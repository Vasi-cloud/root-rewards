import { NextResponse } from "next/server";

import {
  hireOrderLineMatchesListing,
  isLeaValleyHireListing,
  leaValleyHireTitle,
} from "@/lib/lea-valley-guest";
import { listConfirmedOrders } from "@/lib/stripe/orders";

export const runtime = "nodejs";

function isHireLineName(name: string): boolean {
  return /\bhire\b/i.test(name) || /\brental\b/i.test(name);
}

/**
 * Read-only: did this signed-in user complete a hire request for this listing?
 * Uses fulfilled Stripe orders already on this server. Does not invent reviews.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId")?.trim() ?? "";
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const productId = url.searchParams.get("productId")?.trim() ?? "";
  const productName = url.searchParams.get("productName")?.trim() ?? "";

  if ((!userId && !email) || (!productId && !productName)) {
    return NextResponse.json({ completed: false });
  }

  if (!isLeaValleyHireListing({ id: productId, name: productName })) {
    return NextResponse.json({ completed: false });
  }

  const listing = {
    id: productId,
    name: leaValleyHireTitle(productId, productName),
  };

  const completed = listConfirmedOrders().some((order) => {
    if (order.kind !== "marketplace_order") return false;
    if (order.status !== "paid" && order.status !== "fulfilled") return false;

    const uidOk = Boolean(userId && order.userId === userId);
    const emailOk = Boolean(
      email && (order.customerEmail ?? "").trim().toLowerCase() === email
    );
    if (!uidOk && !emailOk) return false;

    const hireOrder =
      order.hasHire === true ||
      order.lineItems.some((line) => isHireLineName(line.name));
    if (!hireOrder) return false;

    return order.lineItems.some((line) =>
      hireOrderLineMatchesListing(line.name, listing)
    );
  });

  return NextResponse.json({ completed });
}
