
export function uniqueId() {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substr(2, 9);
  }
}