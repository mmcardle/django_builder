export interface AuditArgs {
  /** Environment alias (development|staging|production) or a raw Firebase project id. */
  target: string | undefined;
  /** Report path from `--out <file>`, if given. */
  outFile: string | undefined;
  /** `--full`: also read every document for the integrity checks (one read per document). */
  full: boolean;
}

/** Parse the audit CLI's arguments: one positional target, optional `--out <file>`, optional `--full`. */
export function parseAuditArgs(argv: string[]): AuditArgs {
  let target: string | undefined;
  let outFile: string | undefined;
  let full = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") {
      outFile = argv[i + 1];
      i++;
    } else if (argv[i] === "--full") {
      full = true;
    } else if (target === undefined) {
      target = argv[i];
    }
  }
  return { target, outFile, full };
}
