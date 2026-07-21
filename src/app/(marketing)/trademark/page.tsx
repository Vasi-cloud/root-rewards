import Link from "next/link";

import { TrademarkRegLink } from "@/components/legal/trademark-reg-link";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Trademark Notice",
  description:
    "Forest Buddies® UK trademark notice — registration UK00004226296, Paaro Limited.",
};

export default function TrademarkPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
        Legal
      </p>
      <h1 className="font-heading mt-2 text-3xl font-semibold text-primary sm:text-4xl">
        Trademark Notice
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        United Kingdom · Registration No.{" "}
        <TrademarkRegLink className="font-medium text-primary underline-offset-2 hover:underline" />
      </p>

      <Separator className="my-8" />

      <div className="space-y-6 text-base leading-relaxed">
        <p className="text-muted-foreground">
          &lsquo;Forest Buddies&rsquo; and the Forest Buddies logo are registered
          trademarks (
          <TrademarkRegLink className="font-medium text-primary underline-offset-2 hover:underline" />
          ) of Paaro Limited, Company Number 09643184, in the United Kingdom.
        </p>
        <p className="text-muted-foreground">
          The Forest Buddies® mark is protected under Class 9 (software and
          downloadable applications), Class 35 (online marketplace and
          advertising services), and Class 36 (electronic wallet and financial
          transaction services).
        </p>
        <p className="text-muted-foreground">
          Any unauthorised use of the Forest Buddies® name, logo, or brand is
          strictly prohibited and may result in legal action.
        </p>
      </div>

      <Separator className="my-8" />

      <p className="text-sm text-muted-foreground">
        See also our{" "}
        <Link
          href="/terms"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/about"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          About
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
