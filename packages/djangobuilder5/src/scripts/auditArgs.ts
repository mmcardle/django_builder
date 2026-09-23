export interface AuditArgs {
  /** Environment alias (development|staging|production) or a raw Firebase project id. */
  target: string | undefined;
  /** Report path from `--out <file>`, if given. */
  outFile: string | undefined;
  /** `--full`: also read every document for the integrity checks (one read per document). */
  full: boolean;
  /** `--force`: run `--full` even when it cannot fit in a day's free read quota. */
  force: boolean;
  /** `--max-offenders <n>`: how many retired-type fields to fetch and attribute (default 1000). */
  maxOffenders: number;
}

/** Parse the audit CLI's arguments: one positional target plus optional flags. */
export function parseAuditArgs(argv: string[]): AuditArgs {
  let target: string | undefined;
  let outFile: string | undefined;
  let full = false;
  let force = false;
  let maxOffenders = 1000;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") {
      outFile = argv[i + 1];
      i++;
    } else if (a === "--max-offenders") {
      const n = parseInt(argv[i + 1] ?? "", 10);
      if (!Number.isNaN(n) && n >= 0) maxOffenders = n;
      i++;
    } else if (a === "--full") {
      full = true;
    } else if (a === "--force") {
      force = true;
    } else if (target === undefined) {
      target = a;
    }
  }
  return { target, outFile, full, force, maxOffenders };
}
