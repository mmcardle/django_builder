/**
 * Translate a djangobuilder.io hash-router URL (`/#/project/abc`, `/#/login/`,
 * `/#/action?mode=…`) into the equivalent djangobuilder5 path.
 *
 * Returns `null` when there is nothing to translate (no `#/…` hash). Unknown
 * legacy routes map to `/` so old bookmarks always land somewhere sensible.
 */
export function legacyHashToPath(hash: string): string | null {
  if (!hash.startsWith("#/")) return null;
  const [rawPath, query = ""] = hash.slice(1).split("?", 2);
  const [head, second] = rawPath.split("/").filter(Boolean);
  const search = query ? `?${query}` : "";

  switch (head) {
    case undefined:
      return "/";
    case "project":
      return second ? `/project/${second}` : "/projects";
    case "home":
      return "/projects";
    case "login":
    case "signup":
    case "about":
    case "unverified":
      return `/${head}`;
    case "reset_password":
      return "/reset";
    case "action":
      return `/action${search}`;
    case "verify":
      return second ? `/action?mode=verifyEmail&oobCode=${encodeURIComponent(second)}` : "/";
    case "reset":
      return second ? `/action?mode=resetPassword&oobCode=${encodeURIComponent(second)}` : "/";
    default:
      return "/";
  }
}

type LocationLike = Pick<Location, "pathname" | "hash">;
type HistoryLike = Pick<History, "replaceState">;

/**
 * If the page was opened at the app base with a legacy hash URL, rewrite the
 * address in place (no new history entry) so the router starts on the right
 * route. Returns the URL it switched to, or null when nothing was done.
 */
export function redirectLegacyHash(
  location: LocationLike = window.location,
  history: HistoryLike = window.history,
  base: string = import.meta.env.BASE_URL,
): string | null {
  if (location.pathname !== base) return null;
  const target = legacyHashToPath(location.hash);
  if (target === null) return null;
  const url = `${base.replace(/\/$/, "")}${target}`;
  history.replaceState(null, "", url);
  return url;
}
