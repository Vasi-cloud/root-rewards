import { Heart, Recycle, TreePine } from "lucide-react";
import Link from "next/link";

import { TrademarkRegLink } from "@/components/legal/trademark-reg-link";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "About",
};

const values = [
  {
    icon: TreePine,
    title: "Planet first",
    text: "We prioritize brands with measurable environmental impact and transparent supply chains.",
  },
  {
    icon: Recycle,
    title: "Circular by design",
    text: "Products that last, refill, or return to the earth—not the landfill.",
  },
  {
    icon: Heart,
    title: "Community powered",
    text: "Affiliates are partners in the movement, not afterthoughts in a spreadsheet.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold text-primary sm:text-4xl">
        About Forest Buddies®
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        Forest Buddies was built for people who want their purchases—and their
        side hustles—to align with a healthier planet. We combine a curated
        sustainable marketplace with an affiliate platform that rewards honest
        advocacy.
      </p>

      <Separator className="my-10" />

      <div className="space-y-8">
        {values.map((value) => (
          <div key={value.title} className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <value.icon className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-primary">
                {value.title}
              </h2>
              <p className="mt-1 text-muted-foreground">{value.text}</p>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-10" />

      <section
        aria-labelledby="our-brand-heading"
        className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 px-5 py-6 sm:px-6 sm:py-7"
      >
        <h2
          id="our-brand-heading"
          className="font-heading text-2xl font-semibold text-primary sm:text-3xl"
        >
          Our Brand
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Forest Buddies® is a registered UK trademark (No.{" "}
          <TrademarkRegLink className="font-medium text-primary underline-offset-2 hover:underline" />
          ) of Paaro Limited. The mark protects our sustainable marketplace
          platform, mobile application, and commitment to environmental
          awareness and responsible commerce.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Read the full{" "}
          <Link
            href="/trademark"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Trademark Notice
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
