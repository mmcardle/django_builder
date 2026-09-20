declare module "firebase-tools/lib/api.js" {
  const api: { clientId(): string; clientSecret(): string };
  export default api;
}
