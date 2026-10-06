import Link from "next/link";

import { HirePayStep } from "@/app/(marketing)/hire/pay/[requestId]/hire-pay-step";
import { getHireListingTerms } from "@/lib/hire-listing-terms-store";
import { getHireRequestForPay } from "@/lib/hire-pay-lookup";
import { leaValleyHirePricePounds } from "@/lib/lea-valley-guest";
import { getStripeKeyMode, isStripeConfigured } from "@/lib/stripe/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function HirePayNotice({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-16">
      <h1 className="font-heading text-3xl font-semibold text-primary">
        {title}
      </h1>
      <p className="mt-3 text-base text-muted-foreground">{body}</p>
      <p className="mt-8 text-sm text-muted-foreground">
        <Link
          href="/marketplace"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Back to marketplace
        </Link>
      </p>
    </div>
  );
}

export default async function HirePayPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId: raw } = await params;
  const requestId = decodeURIComponent(raw ?? "").trim();
  const row = await getHireRequestForPay(requestId);

  if (!row) {
    return (
      <HirePayNotice
        title="That hire request was not found."
        body="No payment was taken. Check the Pay link from your confirm email, or ask the seller to confirm again."
      />
    );
  }

  if (row.status === "Paid") {
    return (
      <HirePayNotice
        title="This hire is already paid."
        body="No further payment was taken."
      />
    );
  }

  if (row.status !== "Confirmed") {
    return (
      <HirePayNotice
        title="The seller has not confirmed this request yet."
        body="No payment was taken. Pay is only available after the seller confirms."
      />
    );
  }

  if (!isStripeConfigured() || getStripeKeyMode() !== "test") {
    return (
      <HirePayNotice
        title="Hire payment stays on Stripe Test."
        body="No payment was taken."
      />
    );
  }

  const pricePounds =
    leaValleyHirePricePounds({
      id: row.listingId,
      name: row.listingTitle,
    }) ?? 0;

  return (
    <HirePayStep
      requestId={row.id}
      listingTitle={row.listingTitle}
      pricePounds={pricePounds}
      listingTerms={getHireListingTerms(row.listingId)}
    />
  );
}
