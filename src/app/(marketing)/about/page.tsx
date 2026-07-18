import { Heart, Recycle, TreePine } from "lucide-react";

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
        About Forest Buddies
      </h1>
      <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
        Forest Buddies was built for people who want their purchases—and their side hustles—to
        align with a healthier planet. We combine a curated sustainable marketplace with an
        affiliate platform that rewards honest advocacy.
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
    </div>
  );
}
