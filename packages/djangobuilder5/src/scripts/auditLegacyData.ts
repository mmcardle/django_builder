/// <reference types="node" />
/**
 * Read-only audit of one environment's Firestore data for legacy formats.
 *
 *   bun run audit_legacy_data <development|staging|production|project-id> [--out file.json] [--max-offenders n] [--full] [--force]
 *
 * (from the repo root; bun's --filter would drop the bare environment argument)
 *
 * Default mode is quota-friendly: count aggregations (about one read per 1,000
 * documents counted) plus targeted queries that fetch only the offending
 * documents (one read each, up to --max-offenders) and walk up to their project
 * (three reads each). `--full` additionally reads every document for the
 * integrity checks (dangling references, orphans, fields with no type): one read
 * per document, refused when that exceeds the day's free quota unless --force is
 * given. The JSON report is written after the quick phase, so a failing full scan
 * cannot lose it. Never writes to Firestore.
 *
 * Credentials, in order: GOOGLE_APPLICATION_CREDENTIALS / gcloud application-
 * default credentials if present, otherwise the Firebase CLI's own login
 * (`bunx firebase login`) read from its local config store.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { GoogleAuth, UserRefreshClient } from "google-auth-library";
import firebaseApi from "firebase-tools/lib/api.js";
import {
  auditFlatData,
  decodeDocument,
  formatQuickReport,
  formatReport,
  fullScanAllowed,
  legacyQueries,
  mapKeyQuery,
  quickReport,
  toFlatData,
  type Attribution,
  type Collection,
  type QuickCounts,
  type RawDocument,
  type StructuredQuery,
} from "@/domain/firestore/audit";
import type { FieldDoc, ProjectDoc } from "@/domain/firestore/types";
import { parseAuditArgs } from "./auditArgs";

const COLLECTIONS: Collection[] = ["projects", "apps", "models", "fields", "relationships"];
const SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const repoRoot = resolve(import.meta.dirname, "../../../..");

let reads = 0; // approximate billed document reads

function usage(): never {
  console.error("Usage: bun run audit_legacy_data <development|staging|production|project-id> [--out file.json] [--max-offenders n] [--full] [--force]");
  process.exit(1);
}

function resolveProjectId(nameOrId: string): string {
  const rcPath = resolve(repoRoot, ".firebaserc");
  if (existsSync(rcPath)) {
    const rc = JSON.parse(readFileSync(rcPath, "utf8")) as { projects?: Record<string, string> };
    if (rc.projects?.[nameOrId]) return rc.projects[nameOrId];
  }
  return nameOrId;
}

async function accessToken(): Promise<string> {
  const adcFile = resolve(homedir(), ".config/gcloud/application_default_credentials.json");
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || existsSync(adcFile)) {
    const token = await new GoogleAuth({ scopes: [SCOPE] }).getAccessToken();
    if (token) return token;
  }
  const storePath = resolve(homedir(), ".config/configstore/firebase-tools.json");
  if (!existsSync(storePath)) {
    throw new Error("No credentials: run `bunx firebase login` (or set GOOGLE_APPLICATION_CREDENTIALS).");
  }
  const store = JSON.parse(readFileSync(storePath, "utf8")) as { tokens?: { refresh_token?: string } };
  if (!store.tokens?.refresh_token) throw new Error("Firebase CLI is not logged in: run `bunx firebase login`.");
  const client = new UserRefreshClient(firebaseApi.clientId(), firebaseApi.clientSecret(), store.tokens.refresh_token);
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Could not obtain an access token from the Firebase CLI login.");
  return token;
}

function docsBase(projectId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

async function post(url: string, token: string, body: unknown, what: string): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) {
    throw new Error(
      `${what}: Firestore quota exceeded (HTTP 429). On the Spark plan the daily read quota is shared with the live app; ` +
        `wait for the reset (midnight Pacific) or upgrade the project's plan. Approximate reads so far: ${reads}.`,
    );
  }
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

/** Count documents matching a query: ~1 read per 1,000 index entries. */
async function count(projectId: string, token: string, query: StructuredQuery, what: string): Promise<number> {
  const body = { structuredAggregationQuery: { structuredQuery: query, aggregations: [{ alias: "n", count: {} }] } };
  const rows = (await post(`${docsBase(projectId)}:runAggregationQuery`, token, body, what)) as Array<{
    result?: { aggregateFields?: { n?: { integerValue?: string } } };
  }>;
  const n = Number(rows.find((r) => r.result)?.result?.aggregateFields?.n?.integerValue ?? 0);
  reads += Math.max(1, Math.ceil(n / 1000));
  return n;
}

/** Fetch the documents matching a query: one read each. */
async function runQuery(projectId: string, token: string, query: StructuredQuery, what: string): Promise<RawDocument[]> {
  const rows = (await post(`${docsBase(projectId)}:runQuery`, token, { structuredQuery: query }, what)) as Array<{ document?: RawDocument }>;
  const docs = rows.map((r) => r.document).filter((d): d is RawDocument => Boolean(d));
  reads += Math.max(1, docs.length);
  return docs;
}

async function listAll(projectId: string, token: string, collection: Collection): Promise<RawDocument[]> {
  const docs: RawDocument[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`${docsBase(projectId)}/${collection}`);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 429) throw new Error(`${collection}: Firestore quota exceeded (HTTP 429) after ~${reads} reads.`);
    if (!res.ok) throw new Error(`${collection}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as { documents?: RawDocument[]; nextPageToken?: string };
    docs.push(...(body.documents ?? []));
    reads += body.documents?.length ?? 0;
    pageToken = body.nextPageToken;
  } while (pageToken);
  return docs;
}

/** field id -> owning project, found by walking the parent maps upward (3 reads per field). */
async function attribute(projectId: string, token: string, fields: FieldDoc[]): Promise<Map<string, Attribution>> {
  const out = new Map<string, Attribution>();
  for (const field of fields) {
    const [model] = await runQuery(projectId, token, mapKeyQuery("models", "fields", field.id), `model of field ${field.id}`);
    if (!model) continue;
    const modelId = decodeDocument(model).id;
    const [app] = await runQuery(projectId, token, mapKeyQuery("apps", "models", modelId), `app of model ${modelId}`);
    if (!app) continue;
    const appId = decodeDocument(app).id;
    const [project] = await runQuery(projectId, token, mapKeyQuery("projects", "apps", appId), `project of app ${appId}`);
    if (!project) continue;
    const p = decodeDocument(project) as unknown as ProjectDoc;
    const m = decodeDocument(model) as unknown as { name: string };
    out.set(field.id, { id: p.id, owner: p.owner, name: p.name, modelName: m.name });
  }
  return out;
}

async function main(): Promise<void> {
  const { target, outFile, full, force, maxOffenders } = parseAuditArgs(process.argv.slice(2));
  if (!target) usage();

  const projectId = resolveProjectId(target);
  const token = await accessToken();
  console.error(`Auditing ${projectId} (read-only, ${full ? "full scan" : "counts + targeted queries"})…`);

  // 1. Totals and legacy-signal counts: a handful of reads regardless of data size.
  const totals = {} as Record<Collection, number>;
  for (const c of COLLECTIONS) totals[c] = await count(projectId, token, { from: [{ collectionId: c }] }, `count ${c}`);
  const q = legacyQueries();
  const counts: QuickCounts = {
    totals,
    dottedFieldTypes: await count(projectId, token, q.dottedFieldTypes, "count dotted field types"),
    retiredFieldTypes: await count(projectId, token, q.retiredFieldTypes, "count retired field types"),
    dottedRelationshipTypes: await count(projectId, token, q.dottedRelationshipTypes, "count dotted relationship types"),
    fullPathTargets: await count(projectId, token, q.fullPathTargets, "count full-path targets"),
    preDjango3Projects:
      (await count(projectId, token, q.preDjango3Numeric, "count pre-Django-3 (numeric)")) +
      (await count(projectId, token, q.preDjango3String, "count pre-Django-3 (string)")),
  };

  // 2. Only the offending documents, then their owning projects.
  const retiredFields =
    maxOffenders > 0
      ? (await runQuery(projectId, token, { ...q.retiredFieldTypes, limit: maxOffenders }, "retired-type fields")).map(
          (d) => decodeDocument(d) as unknown as FieldDoc,
        )
      : [];
  const preDjango3Projects = [
    ...(await runQuery(projectId, token, { ...q.preDjango3Numeric, limit: 200 }, "pre-Django-3 projects (numeric)")),
    ...(await runQuery(projectId, token, { ...q.preDjango3String, limit: 200 }, "pre-Django-3 projects (string)")),
  ].map((d) => decodeDocument(d) as unknown as ProjectDoc);
  console.error(`Attributing ${retiredFields.length} retired-type fields to their projects (~${retiredFields.length * 3} reads)…`);
  const attribution = await attribute(projectId, token, retiredFields);

  const quick = quickReport(counts, { retiredFields, preDjango3Projects }, attribution);
  console.log(formatQuickReport(quick));
  if (counts.retiredFieldTypes > retiredFields.length) {
    console.log(`  (fetched ${retiredFields.length} of ${counts.retiredFieldTypes} retired-type fields; raise --max-offenders to see more)`);
  }

  // Write the report now so a failing full scan cannot lose the quick results.
  const out = resolve(repoRoot, outFile ?? `legacy-data-audit.${target}.json`);
  const write = (fullReport: ReturnType<typeof auditFlatData> | null) =>
    writeFileSync(out, JSON.stringify({ projectId, generatedAt: new Date().toISOString(), approximateReads: reads, quick, full: fullReport }, null, 2));
  write(null);
  console.error(`Approximate Firestore reads used so far: ${reads}. Report written to ${out}`);

  // 3. Optional full scan for the integrity checks.
  if (full) {
    const totalDocs = Object.values(totals).reduce((a, b) => a + b, 0);
    const decision = fullScanAllowed(totalDocs, force);
    console.error(decision.message);
    if (decision.ok) {
      const fetched = {} as Record<Collection, RawDocument[]>;
      for (const c of COLLECTIONS) fetched[c] = await listAll(projectId, token, c);
      const fullReport = auditFlatData(toFlatData(fetched));
      console.log("");
      console.log(formatReport(fullReport));
      write(fullReport);
      console.error(`Approximate Firestore reads used: ${reads}. Report updated at ${out}`);
    }
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
