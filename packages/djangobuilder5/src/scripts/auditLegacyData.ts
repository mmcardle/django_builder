/// <reference types="node" />
/**
 * Read-only audit of one environment's Firestore data for legacy formats.
 *
 *   bun run audit:legacy-data <development|staging|production|project-id> [--out file.json]
 *
 * Reads all five collections through the Firestore REST API as the project
 * owner (rules do not apply), prints a summary and writes a JSON report with
 * the affected project ids. Never writes to Firestore.
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
import { auditFlatData, formatReport, toFlatData, type Collection, type RawDocument } from "@/domain/firestore/audit";

const COLLECTIONS: Collection[] = ["projects", "apps", "models", "fields", "relationships"];
const SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const repoRoot = resolve(import.meta.dirname, "../../../..");

function usage(): never {
  console.error("Usage: bun run audit:legacy-data <development|staging|production|project-id> [--out file.json]");
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

async function fetchCollection(projectId: string, token: string, collection: Collection): Promise<RawDocument[]> {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
  const docs: RawDocument[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(base);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`${collection}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as { documents?: RawDocument[]; nextPageToken?: string };
    docs.push(...(body.documents ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);
  return docs;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outFlag = args.indexOf("--out");
  const outFile = outFlag >= 0 ? args[outFlag + 1] : undefined;
  const positional = args.filter((a, i) => a !== "--out" && i !== outFlag + 1);
  const target = positional[0];
  if (!target) usage();

  const projectId = resolveProjectId(target);
  const token = await accessToken();
  console.error(`Reading ${COLLECTIONS.join(", ")} from ${projectId} (read-only)…`);

  const fetched = {} as Record<Collection, RawDocument[]>;
  for (const collection of COLLECTIONS) fetched[collection] = await fetchCollection(projectId, token, collection);

  const report = auditFlatData(toFlatData(fetched));
  console.log(formatReport(report));

  const out = resolve(repoRoot, outFile ?? `legacy-data-audit.${target}.json`);
  writeFileSync(out, JSON.stringify({ projectId, generatedAt: new Date().toISOString(), ...report }, null, 2));
  console.error(`Report written to ${out}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
