export type DjangoVersionNumber = 3 | 4 | 5 | 6;

/** db5 local (3|4|5|6) -> Firestore django_version (3.2|4.1|5.1|6.0). */
export function toVersionNumber(v: DjangoVersionNumber): number {
  return v === 3 ? 3.2 : v === 4 ? 4.1 : v === 5 ? 5.1 : 6.0;
}

/** Firestore django_version (number or string) -> db5 local (3|4|5|6).
 * Projects saved for Django 1.x/2.x display and generate as 3, the oldest version
 * offered. Missing or unparseable values default to 6. */
export function fromVersion(v: number | string): DjangoVersionNumber {
  const n = parseFloat(String(v));
  if (Number.isNaN(n)) return 6;
  if (n < 4) return 3;
  if (n < 5) return 4;
  if (n < 6) return 5;
  return 6;
}
