import {
  CAUSES,
  emptyCauseSelection,
  type CauseSelection,
} from "@/lib/causes";
import {
  CAUSE_IDS,
  type CheckoutLineItemInput,
  type CreateCheckoutSessionBody,
} from "@/lib/stripe/checkout-types";
import { validateEmail, validateName, validatePostalCode } from "@/lib/validation";

const MAX_LINE_ITEMS = 40;
const MAX_QTY = 50;
const MAX_UNIT_CENTS = 500_000; // $5,000
const MAX_ORDER_CENTS = 2_000_000; // $20,000
const MAX_MEMBER_CREDIT_CENTS = 800; // $8 Impact credit

export type ValidatedCheckout = {
  email: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  lineItems: CheckoutLineItemInput[];
  causeSelection: CauseSelection;
  memberCreditCents: number;
  goodsCents: number;
  causesCents: number;
  totalCents: number;
  userId: string | null;
};

export function parseCauseSelection(raw: unknown): CauseSelection {
  const base = emptyCauseSelection();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const id of CAUSE_IDS) {
    const n = Number(obj[id]);
    if (Number.isFinite(n) && n > 0) {
      base[id] = Math.min(500, Math.floor(n));
    }
  }
  return base;
}

export function validateCheckoutBody(body: unknown): {
  ok: true;
  data: ValidatedCheckout;
} | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as Partial<CreateCheckoutSessionBody>;

  const emailResult = validateEmail(String(b.email ?? ""));
  if (!emailResult.ok) return { ok: false, error: emailResult.error };

  const nameResult = validateName(String(b.name ?? ""), {
    required: true,
    max: 120,
    label: "Full name",
  });
  if (!nameResult.ok) return { ok: false, error: nameResult.error };

  const address = String(b.address ?? "").trim();
  if (address.length < 5 || address.length > 200) {
    return { ok: false, error: "Enter a valid shipping address." };
  }

  const cityResult = validateName(String(b.city ?? ""), {
    required: true,
    max: 80,
    label: "City",
  });
  if (!cityResult.ok) return { ok: false, error: cityResult.error };

  const zipResult = validatePostalCode(String(b.zip ?? ""));
  if (!zipResult.ok) return { ok: false, error: zipResult.error };

  if (!Array.isArray(b.lineItems) || b.lineItems.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }
  if (b.lineItems.length > MAX_LINE_ITEMS) {
    return { ok: false, error: "Too many items in cart." };
  }

  const lineItems: CheckoutLineItemInput[] = [];
  let goodsCents = 0;

  for (const raw of b.lineItems) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "Invalid cart line item." };
    }
    const item = raw as CheckoutLineItemInput;
    const id = String(item.id ?? "").slice(0, 80);
    const name = String(item.name ?? "").trim().slice(0, 120);
    const qty = Math.floor(Number(item.quantity));
    const unit = Math.floor(Number(item.unitAmountCents));
    if (!id || !name) return { ok: false, error: "Invalid cart item name." };
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) {
      return { ok: false, error: "Invalid item quantity." };
    }
    if (!Number.isFinite(unit) || unit < 1 || unit > MAX_UNIT_CENTS) {
      return { ok: false, error: "Invalid item price." };
    }
    const description =
      typeof item.description === "string"
        ? item.description.slice(0, 200)
        : undefined;
    lineItems.push({ id, name, quantity: qty, unitAmountCents: unit, description });
    goodsCents += unit * qty;
  }

  const causeSelection = parseCauseSelection(b.causeSelection);

  // Recompute cause cents from catalog (never trust client dollar totals)
  let catalogCausesCents = 0;
  for (const cause of CAUSES) {
    catalogCausesCents += (causeSelection[cause.id] || 0) * cause.unitPrice * 100;
  }

  let memberCreditCents = Math.floor(Number(b.memberCreditCents) || 0);
  if (memberCreditCents < 0) memberCreditCents = 0;
  if (memberCreditCents > MAX_MEMBER_CREDIT_CENTS) {
    memberCreditCents = MAX_MEMBER_CREDIT_CENTS;
  }
  memberCreditCents = Math.min(memberCreditCents, catalogCausesCents);

  const totalCents = goodsCents + catalogCausesCents - memberCreditCents;
  if (totalCents < 50) {
    return {
      ok: false,
      error: "Order total must be at least $0.50 for card payment.",
    };
  }
  if (totalCents > MAX_ORDER_CENTS) {
    return { ok: false, error: "Order total exceeds the allowed maximum." };
  }

  return {
    ok: true,
    data: {
      email: emailResult.value,
      name: nameResult.value,
      address,
      city: cityResult.value,
      zip: zipResult.value,
      lineItems,
      causeSelection,
      memberCreditCents,
      goodsCents,
      causesCents: catalogCausesCents,
      totalCents,
      userId:
        typeof b.userId === "string" && b.userId.length > 0
          ? b.userId.slice(0, 128)
          : null,
    },
  };
}
