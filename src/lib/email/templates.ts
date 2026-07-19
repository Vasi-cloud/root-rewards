import { getAppUrlForEmail } from "@/lib/email/config";
import { ctaButton, emailLayout, escapeHtml } from "@/lib/email/layout";

export function welcomeEmailHtml(opts: {
  name?: string | null;
}): { subject: string; html: string; text: string } {
  const name = opts.name?.trim() || "friend";
  const appUrl = getAppUrlForEmail();
  const subject = "Welcome to Forest Buddies — let’s grow something good";
  const bodyHtml = `
    <p style="margin:0 0 14px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 14px;">
      Welcome to the grove. Forest Buddies is your home for sustainable goods,
      bookable eco services, and gear you can rent instead of buy.
    </p>
    <p style="margin:0 0 14px;">
      Every checkout can plant trees, fund ocean cleanups, or support climate
      education — impact you can track in your dashboard.
    </p>
    <ul style="margin:0 0 18px;padding-left:18px;color:#2d6a4f;">
      <li>Shop eco brands &amp; solo makers</li>
      <li>Book legal, repair, workshop &amp; wellness services</li>
      <li>Earn affiliate rewards when friends shop green</li>
    </ul>
    ${ctaButton(`${appUrl}/marketplace`, "Explore the marketplace")}
    <p style="margin:20px 0 0;font-size:14px;color:#5c7366;">
      Glad you’re here — the planet could use more shoppers like you.
    </p>
  `;
  const text = `Hi ${name},

Welcome to Forest Buddies. Shop sustainable goods, book eco services, and fund causes with every purchase.

Explore: ${appUrl}/marketplace

— Forest Buddies`;
  return {
    subject,
    html: emailLayout({
      preheader: "Your eco marketplace account is ready.",
      title: "Welcome to the grove",
      bodyHtml,
    }),
    text,
  };
}

export function orderConfirmationEmailHtml(opts: {
  orderNumber: string;
  customerName?: string | null;
  amountTotalCents: number;
  lineItems: Array<{ name: string; quantity: number; amountCents: number }>;
  causeLines?: string[];
}): { subject: string; html: string; text: string } {
  const appUrl = getAppUrlForEmail();
  const name = opts.customerName?.trim() || "there";
  const total = (opts.amountTotalCents / 100).toFixed(2);
  const subject = `Order confirmed — ${opts.orderNumber}`;

  const rows = opts.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e8f0ea;font-size:14px;">
          ${escapeHtml(item.name)}${item.quantity > 1 ? ` × ${item.quantity}` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #e8f0ea;font-size:14px;text-align:right;white-space:nowrap;">
          $${(item.amountCents / 100).toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const impact =
    opts.causeLines && opts.causeLines.length > 0
      ? `<p style="margin:16px 0 8px;font-size:13px;font-weight:600;color:#1b4332;text-transform:uppercase;letter-spacing:0.06em;">Your impact</p>
         <ul style="margin:0 0 16px;padding-left:18px;color:#2d6a4f;">
           ${opts.causeLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
         </ul>`
      : "";

  const bodyHtml = `
    <p style="margin:0 0 14px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 14px;">
      Thank you — your order is confirmed and being prepared with care.
      A little more good is on its way into the world.
    </p>
    <p style="margin:0 0 6px;font-size:13px;color:#5c7366;">Order number</p>
    <p style="margin:0 0 16px;font-family:ui-monospace,monospace;font-weight:600;">${escapeHtml(opts.orderNumber)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
      ${rows || `<tr><td style="padding:8px 0;font-size:14px;">Your Forest Buddies order</td><td style="text-align:right;">$${total}</td></tr>`}
      <tr>
        <td style="padding:12px 0 0;font-weight:600;">Total</td>
        <td style="padding:12px 0 0;font-weight:600;text-align:right;">$${total}</td>
      </tr>
    </table>
    ${impact}
    ${ctaButton(`${appUrl}/dashboard`, "Track your impact")}
    <p style="margin:20px 0 0;font-size:14px;color:#5c7366;">
      Questions? Reply to this email or visit our returns guide anytime.
    </p>
  `;

  const text = `Hi ${name},

Your Forest Buddies order ${opts.orderNumber} is confirmed.
Total: $${total}

${opts.lineItems.map((i) => `- ${i.name} × ${i.quantity}: $${(i.amountCents / 100).toFixed(2)}`).join("\n")}

Dashboard: ${appUrl}/dashboard

— Forest Buddies`;

  return {
    subject,
    html: emailLayout({
      preheader: `Order ${opts.orderNumber} confirmed — $${total}.`,
      title: "Order confirmed",
      bodyHtml,
    }),
    text,
  };
}

export function abandonedCartEmailHtml(opts: {
  previewNames: string[];
  itemCount: number;
  totalPrice: number;
}): { subject: string; html: string; text: string } {
  const appUrl = getAppUrlForEmail();
  const names = opts.previewNames.slice(0, 3);
  const subject = "Your sustainable picks are waiting";
  const list = names
    .map((n) => `<li style="margin:0 0 6px;">${escapeHtml(n)}</li>`)
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 14px;">Hi there,</p>
    <p style="margin:0 0 14px;">
      You left <strong>${opts.itemCount} item${opts.itemCount === 1 ? "" : "s"}</strong>
      (<strong>$${opts.totalPrice.toFixed(2)}</strong>) in your Forest Buddies cart.
      No rush — they’re still saved for you.
    </p>
    ${
      list
        ? `<ul style="margin:0 0 18px;padding-left:18px;color:#2d6a4f;">${list}</ul>`
        : ""
    }
    <p style="margin:0 0 14px;font-size:14px;color:#5c7366;">
      Finish checkout when you’re ready — and add a cause donation if you’d like
      this order to plant trees or fund ocean cleanups.
    </p>
    ${ctaButton(`${appUrl}/checkout`, "Resume checkout")}
    <p style="margin:16px 0 0;">
      <a href="${appUrl}/cart" style="color:#1b4332;font-weight:600;">View cart</a>
    </p>
  `;

  const text = `Your Forest Buddies cart is waiting.

${opts.itemCount} item(s) · $${opts.totalPrice.toFixed(2)}
${names.map((n) => `- ${n}`).join("\n")}

Resume checkout: ${appUrl}/checkout

— Forest Buddies`;

  return {
    subject,
    html: emailLayout({
      preheader: "Your eco cart is still here when you’re ready.",
      title: "Still thinking it over?",
      bodyHtml,
    }),
    text,
  };
}
