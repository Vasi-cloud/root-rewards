import Link from "next/link";

import { TrademarkRegLink } from "@/components/legal/trademark-reg-link";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Terms of Service",
  description: "Terms for using the Forest Buddies marketplace.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
        Legal
      </p>
      <h1 className="font-heading mt-2 text-3xl font-semibold text-primary sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: September 15, 2026 · Soft-launch wording — not legal advice.
      </p>

      <Separator className="my-8" />

      <div className="space-y-8 text-base leading-relaxed text-foreground/90">
        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            1. Acceptance
          </h2>
          <p className="mt-2 text-muted-foreground">
            By using Forest Buddies you agree to these Terms and our{" "}
            <Link
              href="/privacy"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>
            . If you do not agree, do not use the app.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            2. Payments &amp; membership
          </h2>
          <p className="mt-2 text-muted-foreground">
            Marketplace checkout and Impact Member (£5/mo) use Stripe Checkout.
            Charges are real in Stripe Test or Live mode, depending on which
            secret key is configured. Impact Member · £5/mo supports partner
            programmes and the Forest Buddies platform — not product cashback or
            a shopping balance.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            3. Accounts
          </h2>
          <p className="mt-2 text-muted-foreground">
            You are responsible for your credentials. Do not attempt to escalate
            privileges or abuse rate limits. New accounts are created as
            customers; admin access is granted separately by the project owner.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            4. Marketplace &amp; sellers
          </h2>
          <p className="mt-2 text-muted-foreground">
            Listings must be accurate and lawful. Misleading eco claims may be
            flagged or removed. Soft-launch seller tools may store some data on
            this device until a full production backend is connected.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            5. Affiliates, partners &amp; impact
          </h2>
          <p className="mt-2 text-muted-foreground">
            Affiliate stats and partner outbound links are illustrative where
            marked. Third-party stores have their own terms. Commission figures
            are not guarantees.
          </p>
          <p className="mt-3 text-muted-foreground">
            Cause gifts and tree funding support partner programmes.
            Impact figures are illustrative — not product cashback, and not a
            GPS pin for a planted tree.
          </p>
          <p className="mt-3 text-muted-foreground">
            Affiliate sharing may come later. It is not a cash wallet, and it is
            not what the Impact Member £5/mo fee is for.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            6. Returns
          </h2>
          <p className="mt-2 text-muted-foreground">
            See our{" "}
            <Link
              href="/returns"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Returns &amp; size guide
            </Link>{" "}
            for return windows and sizing help.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            7. Acceptable use
          </h2>
          <p className="mt-2 text-muted-foreground">
            No scraping that harms the service, no spam, no attempts to bypass
            security controls, and no uploading illegal or harmful content.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            8. Disclaimer
          </h2>
          <p className="mt-2 text-muted-foreground">
            The service is provided “as is” without warranties. We are not liable
            for third-party sites, partner fulfilment delays, or decisions made
            from illustrative impact or recommendation tools.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            9. Changes
          </h2>
          <p className="mt-2 text-muted-foreground">
            We may update these Terms as the product matures. Continued use after
            changes means you accept the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            10. Trademark Notice
          </h2>
          <p className="mt-2 text-muted-foreground">
            &lsquo;Forest Buddies&rsquo; and the Forest Buddies logo are
            registered trademarks (
            <TrademarkRegLink className="font-medium text-primary underline-offset-2 hover:underline" />
            ) of Paaro Limited, Company Number 09643184, in the United Kingdom.
          </p>
          <p className="mt-3 text-muted-foreground">
            The Forest Buddies® mark is protected under Class 9 (software and
            downloadable applications), Class 35 (online marketplace and
            advertising services), and Class 36 (electronic wallet and financial
            transaction services).
          </p>
          <p className="mt-3 text-muted-foreground">
            Any unauthorised use of the Forest Buddies® name, logo, or brand is
            strictly prohibited and may result in legal action.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Full notice:{" "}
            <Link
              href="/trademark"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              /trademark
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
