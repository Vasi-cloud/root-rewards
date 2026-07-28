/** Default destination after sign-in when no safe return URL is present. */
export const DEFAULT_AUTH_REDIRECT = "/dashboard";

const AUTH_LOOP_PATHS = new Set(["/login", "/register"]);

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

/**
 * Resolve a post-login redirect from `next` / `return` (or any candidate).
 * Falls back to the dashboard when missing or unsafe.
 */
export function getSafeAuthRedirect(
  raw: string | null | undefined,
  fallback: string = DEFAULT_AUTH_REDIRECT
): string {
  if (!isSafeInternalPath(raw)) return fallback;
  return raw!.trim();
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
