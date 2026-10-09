import { Leaf } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Returns & refunds",
  description:
    "Forest Buddies returns and refunds for goods, cause gifts, and hire.",
};

const BLOCKS = [
  {
    title: "Goods",
    text: "Unused items can be returned in the window shown on that listing. Start from your order in Dashboard, or contact us with the order ID.",
  },
  {
    title: "Cause gifts",
    text: "A cause gift is a donation to a partner programme, not a product. It is not returned like goods. Questions about a gift: use the order ID on Dashboard or feedback.",
  },
  {
    title: "Hire",
    text: "A hire is not a goods return. The hire fee follows the listing. A deposit is held as the listing says. Damage sits with the rider or the seller.",
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
          Returns &amp; refunds
        </Badge>
        <h1 className="font-heading text-3xl font-semibold text-primary sm:text-5xl">
          Returns &amp; refunds
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          How goods, cause gifts, and hire are treated on Forest Buddies.
        </p>

        <ul className="mt-10 space-y-4">
          {BLOCKS.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-border/70 bg-white/80 p-4 sm:p-5"
            >
              <h2 className="font-heading text-lg font-semibold text-primary sm:text-xl">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.text}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-10">
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
      </div>
    </div>
  );
}
