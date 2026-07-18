import Link from "next/link";

import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Privacy Policy",
  description: "How Forest Buddies handles personal data in this demo.",
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
        Last updated: July 17, 2026 · Demo / MVP wording — not legal advice.
      </p>

      <Separator className="my-8" />

      <div className="space-y-8 text-base leading-relaxed text-foreground/90">
        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            1. Who we are
          </h2>
          <p className="mt-2 text-muted-foreground">
            Forest Buddies is a sustainable marketplace demo. This policy
            explains what this app may collect while you explore the product.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            2. What we collect
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Account data</strong> — if
              Firebase Auth is configured: email, display name, photo URL, and a
              customer role profile in Firestore.
            </li>
            <li>
              <strong className="text-foreground">Local device data</strong> —
              cart, membership demo state, feedback, seller drafts, and rate-limit
              counters stored in your browser (localStorage).
            </li>
            <li>
              <strong className="text-foreground">Optional messages</strong> —
              feedback, support chat, and product reports you choose to send
              (demo storage unless a backend is connected).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            3. How we use data
          </h2>
          <p className="mt-2 text-muted-foreground">
            To sign you in, remember your cart, show affiliate and impact demos,
            moderate listings, and improve the product. We do not sell personal
            data in this demo.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            4. Payments
          </h2>
          <p className="mt-2 text-muted-foreground">
            Checkout is simulated. No real card numbers are processed or stored.
            Live payments would use a PCI-compliant provider and updated notices.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            5. Sharing
          </h2>
          <p className="mt-2 text-muted-foreground">
            Partner “Via Amazon / Target / REI” links open third-party sites with
            their own policies. Affiliate tags in this demo are illustrative.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-primary">
            6. Security
          </h2>
          <p className="mt-2 text-muted-foreground">
            We use Firebase Auth when configured, hardened Firestore rules (owner
            profiles, no client role escalation), input validation, and
            browser-side rate-limit simulation. Clear browser data to remove
            localStorage demos.
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
            Demo project — see the repository README for setup contacts. Related:{" "}
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
