import Link from "next/link";

import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Privacy Policy",
  description: "How Forest Buddies handles personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
        Legal
      </p>
      <h1 className="font-heading mt-2 text-3xl font-semibold text-primary sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: July 17, 2026
      </p>

      <Separator className="my-8" />

      <div className="space-y-8 text-base leading-relaxed text-foreground/90">
        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            1. Who we are
          </h2>
          <p className="mt-2 text-muted-foreground">
            Forest Buddies is the marketplace at forestbuddies.com. This policy
            explains what we collect.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            2. What we collect
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Account data</strong> uses
              Firebase Auth and Firestore — email, display name, photo URL, and
              the account profile.
            </li>
            <li>
              <strong className="text-foreground">This browser</strong> — some
              cart and draft data stays in this browser.
            </li>
            <li>
              <strong className="text-foreground">Optional messages</strong> —
              feedback, support chat, and product reports you choose to send.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            3. How we use data
          </h2>
          <p className="mt-2 text-muted-foreground">
            To sign you in, remember your cart, moderate listings, and improve
            the marketplace. Impact figures are illustrative. We do not sell
            personal data.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            4. Payments
          </h2>
          <p className="mt-2 text-muted-foreground">
            Card payments are taken by Stripe. Forest Buddies does not store
            the card number.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            5. Sharing
          </h2>
          <p className="mt-2 text-muted-foreground">
            Affiliate links open Amazon or another partner site. Those sites
            have their own policies. Impact figures are illustrative.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            6. Security
          </h2>
          <p className="mt-2 text-muted-foreground">
            Firestore rules limit each account profile to its owner and block
            client role changes. We validate input on the server. Some cart and
            draft data stays in this browser until you clear site data.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            7. Your choices
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sign out anytime. Free plan members can soft-deactivate from{" "}
            <Link
              href="/dashboard/settings"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Dashboard → Settings
            </Link>{" "}
            (account marked inactive; records retained for legal reasons).
            Request full deletion by contacting the project owner when a
            production support channel exists. For questions, use{" "}
            <Link
              href="/feedback"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              feedback
            </Link>{" "}
            or Sprout chat.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            8. Contact
          </h2>
          <p className="mt-2 text-muted-foreground">
            Contact{" "}
            <a
              href="mailto:cvasi.crisan@gmail.com"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              cvasi.crisan@gmail.com
            </a>
            . Related:{" "}
            <Link
              href="/terms"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
