/**
 * Names entered here become Python identifiers in the generated project — app
 * packages, model classes, field attributes. An invalid one produces code that
 * won't import, and the failure only shows up once the user has downloaded and
 * run it, so reject it at the point of entry instead.
 */

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Reserved words that can't be used as an identifier in Python 3. */
const KEYWORDS = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await", "break",
  "class", "continue", "def", "del", "elif", "else", "except", "finally",
  "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal",
  "not", "or", "pass", "raise", "return", "try", "while", "with", "yield",
]);

/**
 * `null` when `value` is usable as a Python name, otherwise a message written
 * for the person typing it. `label` names the thing being validated so the
 * message reads naturally ("App name can't contain spaces").
 */
export function nameError(value: string, label = "Name"): string | null {
  const v = value.trim();
  if (!v) return `${label} is required`;
  if (/\s/.test(v)) return `${label} can't contain spaces`;
  if (/^[0-9]/.test(v)) return `${label} can't start with a number`;
  if (!IDENTIFIER.test(v)) return `${label} can only use letters, numbers and underscores`;
  if (KEYWORDS.has(v)) return `"${v}" is a reserved Python word`;
  return null;
}

/** Convenience predicate for callers that only need a yes/no. */
export function isValidName(value: string): boolean {
  return nameError(value) === null;
}
