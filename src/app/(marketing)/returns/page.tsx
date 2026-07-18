import {
  CheckCircle2,
  Leaf,
  PackageOpen,
  Recycle,
  Ruler,
  Timer,
} from "lucide-react";
import Link from "next/link";

import { SizeGuideTable } from "@/components/product/size-guide-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { STANDARD_SIZE_CHART } from "@/lib/product-details";

export const metadata = {
  title: "Returns & size guide",
  description:
    "Forest Buddies return policy, exchanges, and EU / UK / US size guide.",
};

const STEPS = [
  {
    icon: PackageOpen,
    title: "Start a return",
    text: "From your Dashboard, open the order and choose Return. Or message Sprout with your order ID — we’ll walk you through it.",
  },
  {
    icon: Recycle,
    title: "Pack gently",
    text: "Unused items in original packaging. We’ll suggest reuse or recycling for any packing materials you no longer need.",
  },
  {
    icon: Timer,
    title: "Refund timing",
    text: "In this demo, refunds show as Processing within a few days of approval. Live payment refunds will use your original method later.",
  },
];

const POLICY = [
  {
    title: "30-day window",
    text: "Return unused items within 30 days of delivery for a full refund or exchange (demo policy).",
  },
  {
    title: "Free returns",
    text: "Standard returns are free in this demo. We’ll email a prepaid label when live shipping is connected.",
  },
  {
    title: "What we can’t accept",
    text: "Opened beauty / personal-care seals, worn apparel with signs of use, or custom / final-sale items marked on the listing.",
  },
  {
    title: "Wrong size?",
    text: "Use the EU / UK / US size guide below before you order. Exchanges for size are free within the return window when stock allows.",
  },
];

export default function ReturnsPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_70%_55%_at_50%_-5%,rgba(149,213,178,0.35),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Badge className="mb-3 gap-1 bg-emerald-800/10 text-emerald-900">
          <Leaf className="size-3.5" />
          Returns &amp; sizing
        </Badge>
        <h1 className="font-heading text-3xl font-semibold text-primary sm:text-5xl">
          Easy returns. Clear sizes.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          We&apos;d rather you keep what fits — that&apos;s why every apparel
          listing shows EU / UK / US sizing. When something isn&apos;t right,
          returns are simple, free in this demo, and kinder to the planet.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            nativeButton={false}
            render={<Link href="#size-guide" />}
            size="lg"
            className="min-h-12 gap-2"
          >
            <Ruler className="size-4" />
            Jump to size guide
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/marketplace" />}
            variant="outline"
            size="lg"
            className="min-h-12"
          >
            Continue shopping
          </Button>
        </div>

        <Separator className="my-10" />

        <section>
          <h2 className="font-heading text-2xl font-semibold text-primary">
            Return policy
          </h2>
          <p className="mt-2 text-muted-foreground">
            Demo rules today — live warehouse returns will follow the same
            spirit when inventory APIs are connected.
          </p>
          <ul className="mt-6 space-y-4">
            {POLICY.map((item) => (
              <li
                key={item.title}
                className="flex gap-3 rounded-2xl border border-border/70 bg-white/80 p-4"
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-800" />
                <div>
                  <h3 className="font-heading text-lg font-semibold text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-2xl font-semibold text-primary">
            How returns work
          </h2>
          <div className="mt-6 space-y-5">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary text-primary">
                  <step.icon className="size-5" />
                  <span className="sr-only">Step {i + 1}</span>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-primary">
                    {i + 1}. {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="size-guide" className="mt-12 scroll-mt-24">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-primary">
                Size guide
              </h2>
              <p className="mt-1 text-muted-foreground">
                Convert between EU, UK, and US — plus chest / waist ranges in
                centimetres. Product pages show the same chart when sizes apply.
              </p>
            </div>
          </div>
          <SizeGuideTable
            chart={STANDARD_SIZE_CHART}
            title="Standard apparel · EU / UK / US"
            showReturnsLink={false}
          />
          <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3.5 text-sm leading-relaxed text-emerald-950">
            <p className="font-medium">Measuring tips</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-emerald-900/90">
              <li>Chest: fullest part, tape parallel to the floor.</li>
              <li>Waist: natural waist, not over a belt.</li>
              <li>
                Outerwear: if you layer a fleece underneath, size up one row.
              </li>
              <li>
                Still unsure? Check the listing&apos;s fit note, or{" "}
                <Link
                  href="/recommend"
                  className="font-medium underline underline-offset-2"
                >
                  Ask Leafy
                </Link>{" "}
                / chat with Sprout.
              </li>
            </ul>
          </div>
        </section>

        <div className="mt-12 rounded-2xl border border-border bg-card p-5 text-center sm:p-6">
          <p className="text-base text-muted-foreground">
            Questions about an order? Open Sprout from the footer, or leave a
            note on{" "}
            <Link
              href="/feedback"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              feedback
            </Link>
            .
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/checkout" />}
            variant="outline"
            className="mt-4 min-h-11"
          >
            Back to checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
