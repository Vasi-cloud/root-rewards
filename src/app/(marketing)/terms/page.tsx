import Link from "next/link";

import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Terms of Service",
  description: "Terms for using the Forest Buddies marketplace demo.",
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
        Last updated: July 17, 2026 · Demo / MVP wording — not legal advice.
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
            2. Demo nature
          </h2>
          <p className="mt-2 text-muted-foreground">
            This product is an MVP demo. Prices, inventory, affiliate earnings,
            memberships, vision matching, and local stock are simulated unless
            otherwise stated. No real payment is charged.
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
            flagged or removed. Seller tools in this demo store data locally
            until a production backend is connected.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            5. Affiliates &amp; partners
          </h2>
          <p className="mt-2 text-muted-foreground">
            Affiliate stats and partner outbound links are illustrative.
            Third-party stores have their own terms. Commission figures are not
            guarantees.
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
            for the demo return window and sizing help.
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
            for demo data loss, third-party sites, or decisions made from
            simulated recommendations.
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
      </div>
    </div>
  );
}
