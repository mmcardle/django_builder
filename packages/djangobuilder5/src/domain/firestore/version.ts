export type DjangoVersionNumber = 3 | 4 | 5;

/** db5 local (3|4|5) -> Firestore django_version (3.2|4.1|5.1). */
export function toVersionNumber(v: DjangoVersionNumber): number {
  return v === 3 ? 3.2 : v === 4 ? 4.1 : 5.1;
}

/** Firestore django_version (number or string) -> db5 local (3|4|5), default 5. */
export function fromVersion(v: number | string): DjangoVersionNumber {
  const s = String(v);
  if (s.startsWith("3")) return 3;
  if (s.startsWith("4")) return 4;
  return 5;
}
