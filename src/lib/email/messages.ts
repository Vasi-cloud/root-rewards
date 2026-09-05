import "server-only";

import { buildLoginHref } from "@/lib/auth-redirect";
import {
  CAUSES,
  emptyCauseGifts,
  formatCauseUnits,
  giftTotal,
} from "@/lib/causes";
import { getAppUrlForEmail, type EmailSendResult } from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/send";
import {
  abandonedCartEmailHtml,
  causeGiftEmailHtml,
  membershipSuccessEmailHtml,
  orderConfirmationEmailHtml,
  welcomeEmailHtml,
} from "@/lib/email/templates";
import type { ConfirmedOrder } from "@/lib/stripe/orders";

/** Stripe cause line items use Support:/Impact: names — not physical SKUs. */
function isCauseGiftLineItemName(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n.startsWith("support:") || n.startsWith("impact:");
}

/** True when the paid session funded causes only (no physical catalogue SKUs). */
export function isCauseOnlyOrder(order: ConfirmedOrder): boolean {
  const hasUnits = CAUSES.some((c) => (order.causeSelection[c.id] || 0) > 0);
  const hasGifts = giftTotal(order.causeGifts ?? emptyCauseGifts()) >= 1;
  if (!hasUnits && !hasGifts) return false;
  const physical = order.lineItems.filter(
    (li) => !isCauseGiftLineItemName(li.name)
  );
  return physical.length === 0;
}

function impactTrackUrlForOrder(order: ConfirmedOrder): string {
  const appUrl = getAppUrlForEmail();
  const impactPath = "/dashboard/impact";
  if (order.userId) {
    return `${appUrl}${impactPath}`;
  }
  return `${appUrl}${buildLoginHref(impactPath)}`;
}

export async function sendWelcomeEmail(opts: {
  to: string;
  name?: string | null;
}): Promise<EmailSendResult> {
  const content = welcomeEmailHtml({ name: opts.name });
  return sendTransactionalEmail({
    to: opts.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    kind: "welcome",
  });
}

export async function sendMembershipSuccessEmail(opts: {
  to: string;
  name?: string | null;
}): Promise<EmailSendResult> {
  const content = membershipSuccessEmailHtml({ name: opts.name });
  return sendTransactionalEmail({
    to: opts.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    kind: "membership_success",
  });
}

export async function sendOrderConfirmationEmail(
  order: ConfirmedOrder
): Promise<EmailSendResult> {
  if (!order.customerEmail) {
    return { ok: false, error: "Order has no customer email." };
  }

  const causeOnly = isCauseOnlyOrder(order);

  const causeLines = CAUSES.filter(
    (c) => (order.causeSelection[c.id] || 0) > 0
  ).map(
    (c) =>
      `${c.name}: ≈ ${formatCauseUnits(c, order.causeSelection[c.id])} (illustrative)`
  );

  const content = causeOnly
    ? causeGiftEmailHtml({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        amountTotalCents: order.amountTotalCents,
        lineItems: order.lineItems,
        causeLines,
        impactTrackUrl: impactTrackUrlForOrder(order),
      })
    : orderConfirmationEmailHtml({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        amountTotalCents: order.amountTotalCents,
        lineItems: order.lineItems,
        causeLines,
      });

  return sendTransactionalEmail({
    to: order.customerEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
    kind: causeOnly ? "cause_gift" : "order_confirmation",
  });
}

export async function sendAbandonedCartEmail(opts: {
  to: string;
  previewNames: string[];
  itemCount: number;
  totalPrice: number;
}): Promise<EmailSendResult> {
  const content = abandonedCartEmailHtml(opts);
  return sendTransactionalEmail({
    to: opts.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    kind: "abandoned_cart",
  });
}
