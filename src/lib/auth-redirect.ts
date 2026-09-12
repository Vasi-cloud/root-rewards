/** Default destination after sign-in when no safe return URL is present. */
export const DEFAULT_AUTH_REDIRECT = "/dashboard";

const AUTH_LOOP_PATHS = new Set(["/login", "/register"]);

/** Paths allowed as post-auth `?next=` destinations (plus their subpaths). */
const POST_AUTH_ALLOWED_PREFIXES = [
  "/dashboard",
  "/membership",
  "/marketplace",
  "/donate",
] as const;

function pathOnly(value: string): string {
  return value.split(/[?#]/, 1)[0] ?? value;
}

/**
 * True for same-origin relative paths only (blocks open redirects).
 */
export function isSafeInternalPath(raw: string | null | undefined): boolean {
  if (!raw) return false;

  let value = raw.trim();
  if (!value) return false;

  try {
    value = decodeURIComponent(value);
  } catch {
    return false;
  }

  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("://") || value.includes("\\")) return false;
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;

  const path = pathOnly(value);
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (AUTH_LOOP_PATHS.has(path)) return false;

  return true;
}

function isAllowedPostAuthPath(path: string): boolean {
  return POST_AUTH_ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

/**
 * Resolve a post-login redirect from `next` / `return` (or any candidate).
 * Only /dashboard, /membership, /marketplace, /donate (and subpaths) are kept.
 */
export function getSafeAuthRedirect(
  raw: string | null | undefined,
  fallback: string = DEFAULT_AUTH_REDIRECT
): string {
  if (!isSafeInternalPath(raw)) return fallback;
  const trimmed = raw!.trim();
  const path = pathOnly(trimmed);
  if (!isAllowedPostAuthPath(path)) return fallback;
  return trimmed;
}

/** Prefer `next`, then `return`. */
export function readAuthReturnParam(searchParams: {
  get: (key: string) => string | null;
}): string {
  return getSafeAuthRedirect(
    searchParams.get("next") ?? searchParams.get("return")
  );
}

/**
 * Build `/login` or `/register` with a safe `next` query when returnPath is valid.
 * The post-auth resolver still allowlists the final destination.
 */
export function buildAuthHref(
  authPath: "/login" | "/register",
  returnPath?: string | null
): string {
  if (!isSafeInternalPath(returnPath)) return authPath;
  return `${authPath}?next=${encodeURIComponent(returnPath!.trim())}`;
}

export function buildLoginHref(returnPath?: string | null): string {
  return buildAuthHref("/login", returnPath);
}

export function buildRegisterHref(returnPath?: string | null): string {
  return buildAuthHref("/register", returnPath);
}

/** Login link that carries a short banner for “email already registered”. */
export function buildLoginHrefEmailExists(returnPath?: string | null): string {
  const base = buildLoginHref(returnPath);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}notice=email-exists`;
}
