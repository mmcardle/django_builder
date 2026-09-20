export interface AuditArgs {
  /** Environment alias (development|staging|production) or a raw Firebase project id. */
  target: string | undefined;
  /** Report path from `--out <file>`, if given. */
  outFile: string | undefined;
}

/** Parse the audit CLI's arguments: one positional target plus an optional `--out <file>`. */
export function parseAuditArgs(argv: string[]): AuditArgs {
  let target: string | undefined;
  let outFile: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") {
      outFile = argv[i + 1];
      i++;
    } else if (target === undefined) {
      target = argv[i];
    }
  }
  return { target, outFile };
}
