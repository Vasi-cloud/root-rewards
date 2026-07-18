/**
 * Lightweight client-side validation (no Zod dependency).
 * Pair with Firestore rules for real auth writes.
 */

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function clampString(raw: string, max: number): string {
  return raw.trim().slice(0, max);
}

export function validateEmail(
  raw: string,
  opts?: { required?: boolean; max?: number }
): ValidationResult {
  const required = opts?.required ?? true;
  const max = opts?.max ?? 320;
  const value = clampString(raw, max);
  if (!value) {
    return required
      ? { ok: false, error: "Email is required." }
      : { ok: true, value: "" };
  }
  if (value.length > max) {
    return { ok: false, error: `Email must be under ${max} characters.` };
  }
  if (!EMAIL_RE.test(value)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  return { ok: true, value };
}

export function validatePassword(raw: string): ValidationResult {
  if (!raw) return { ok: false, error: "Password is required." };
  if (raw.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (raw.length > 128) {
    return { ok: false, error: "Password is too long." };
  }
  return { ok: true, value: raw };
}

export function validateName(
  raw: string,
  opts?: { required?: boolean; max?: number; label?: string }
): ValidationResult {
  const required = opts?.required ?? false;
  const max = opts?.max ?? 80;
  const label = opts?.label ?? "Name";
  const value = clampString(raw, max);
  if (!value) {
    return required
      ? { ok: false, error: `${label} is required.` }
      : { ok: true, value: "" };
  }
  if (value.length > max) {
    return { ok: false, error: `${label} must be under ${max} characters.` };
  }
  return { ok: true, value };
}

export function validateMessage(
  raw: string,
  opts?: { required?: boolean; min?: number; max?: number; label?: string }
): ValidationResult {
  const required = opts?.required ?? true;
  const min = opts?.min ?? 3;
  const max = opts?.max ?? 2000;
  const label = opts?.label ?? "Message";
  const value = clampString(raw, max);
  if (!value) {
    return required
      ? { ok: false, error: `${label} is required.` }
      : { ok: true, value: "" };
  }
  if (min > 0 && value.length < min) {
    return {
      ok: false,
      error: `${label} must be at least ${min} characters.`,
    };
  }
  return { ok: true, value };
}

export function validatePostalCode(raw: string): ValidationResult {
  const value = clampString(raw, 20);
  if (!value) return { ok: false, error: "ZIP / postal code is required." };
  if (!/^[A-Za-z0-9\s-]{3,20}$/.test(value)) {
    return { ok: false, error: "Enter a valid ZIP / postal code." };
  }
  return { ok: true, value };
}

export function validateAddress(raw: string): ValidationResult {
  return validateMessage(raw, {
    required: true,
    min: 5,
    max: 200,
    label: "Address",
  });
}

const FEEDBACK_CATEGORIES = new Set(["idea", "feature", "issue", "other"]);

export function validateFeedbackCategory(raw: string): ValidationResult {
  const value = raw.trim().toLowerCase();
  if (!FEEDBACK_CATEGORIES.has(value)) {
    return { ok: false, error: "Choose a valid feedback category." };
  }
  return { ok: true, value };
}

export function validatePrice(raw: string | number): {
  ok: true;
  value: number;
} | { ok: false; error: string } {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: "Enter a valid non-negative price." };
  }
  if (n > 100_000) {
    return { ok: false, error: "Price is unrealistically high." };
  }
  return { ok: true, value: Math.round(n * 100) / 100 };
}
