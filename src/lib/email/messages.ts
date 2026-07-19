import "server-only";

import { sendTransactionalEmail } from "@/lib/email/send";
import {
  abandonedCartEmailHtml,
  orderConfirmationEmailHtml,
  welcomeEmailHtml,
} from "@/lib/email/templates";
import type { ConfirmedOrder } from "@/lib/stripe/orders";
import { CAUSES, formatCauseUnits } from "@/lib/causes";
import type { EmailSendResult } from "@/lib/email/config";

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

export async function sendOrderConfirmationEmail(
  order: ConfirmedOrder
): Promise<EmailSendResult> {
  if (!order.customerEmail) {
    return { ok: false, error: "Order has no customer email." };
  }

  const causeLines = CAUSES.filter((c) => (order.causeSelection[c.id] || 0) > 0).map(
    (c) => `${c.name}: ${formatCauseUnits(c, order.causeSelection[c.id])}`
  );

  const content = orderConfirmationEmailHtml({
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
    kind: "order_confirmation",
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
