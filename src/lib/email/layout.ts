import { getAppUrlForEmail } from "@/lib/email/config";

/** Shared eco-themed HTML shell for transactional emails. */
export function emailLayout(opts: {
  preheader: string;
  title: string;
  bodyHtml: string;
}): string {
  const appUrl = getAppUrlForEmail();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=Fraunces:wght@600&display=swap" rel="stylesheet" />
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background:#f8f9f6;color:#1b4332;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(opts.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9f6;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #d8e8dc;">
          <tr>
            <td style="background:linear-gradient(135deg,#1b4332 0%,#2d6a4f 55%,#40916c 100%);padding:28px 28px 24px;">
              <p style="margin:0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#95d5b2;">
                Forest Buddies
              </p>
              <h1 style="margin:8px 0 0;font-family:Fraunces,Georgia,serif;font-size:28px;line-height:1.2;font-weight:600;color:#f8f9f6;">
                ${escapeHtml(opts.title)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#1b4332;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#5c7366;">
              <p style="margin:0 0 8px;">Grown with care · Every purchase can fund trees, oceans, and climate education.</p>
              <p style="margin:0;">
                <a href="${appUrl}" style="color:#1b4332;font-weight:600;">Visit Forest Buddies</a>
                &nbsp;·&nbsp;
                <a href="${appUrl}/marketplace" style="color:#1b4332;">Marketplace</a>
                &nbsp;·&nbsp;
                <a href="${appUrl}/dashboard" style="color:#1b4332;">Dashboard</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:12px;color:#7a9084;">
          You’re receiving this because you have an account or order with Forest Buddies.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:14px 22px;background:#1b4332;color:#f8f9f6;text-decoration:none;border-radius:12px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;">${escapeHtml(label)}</a>`;
}
