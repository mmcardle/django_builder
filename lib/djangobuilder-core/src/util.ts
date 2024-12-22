
export function uniqueId() {
  try {
    return crypto.randomUUID();
  } catch (e) {
    console.warn('crypto.randomUUID() is not available, using Math.random() instead', e);
    return Math.random().toString(36).substr(2, 9);
  }
}