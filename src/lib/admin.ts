/** Shared admin access — email allowlist for soft launch. */
export const ADMIN_EMAIL = "cvasi.crisan@gmail.com";

export function isAdminUser(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
}
