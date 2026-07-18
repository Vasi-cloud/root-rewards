/**
 * Smoke test: cart → donation math → confirmation payload shape.
 * Run: npx tsx scripts/smoke-checkout-flow.ts
 */
import {
  CAUSES,
  dollarsToUnits,
  emptyCauseSelection,
  formatLiveImpactSummary,
  selectionCost,
  selectionLines,
  selectionTotalUnits,
  unitsToDollars,
} from "../src/lib/causes";
import { MARKETPLACE_PRODUCTS } from "../src/lib/marketplace-catalog";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// 1) Add to cart (simulate)
const product = MARKETPLACE_PRODUCTS[0];
assert(!!product, "catalog has products");
const cart = [{ ...product, quantity: 2 }];
const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
assert(subtotal === product.price * 2, "subtotal matches qty");

// 2) Donation: custom $24 → trees
const trees = CAUSES.find((c) => c.id === "trees")!;
const selection = emptyCauseSelection();
const dollars = 24;
selection.trees = dollarsToUnits(trees, dollars);
assert(selection.trees === 3, `expected 3 trees from $24, got ${selection.trees}`);
assert(unitsToDollars(trees, 3) === 24, "3 trees = $24");

const causeCost = selectionCost(selection);
const total = subtotal + causeCost;
const live = formatLiveImpactSummary(selection);
const lines = selectionLines(selection);

assert(causeCost === 24, `cause cost ${causeCost}`);
assert(selectionTotalUnits(selection) === 3, "3 units");
assert(lines.length === 1 && lines[0].cause.id === "trees", "one tree line");
assert(live != null && live.toLowerCase().includes("tree"), `live impact: ${live}`);
assert(total === subtotal + 24, "order total includes donation");

// 3) Confirmation payload shape (what saveLastDonation stores)
const donation = {
  selection,
  totalCo2: Math.round(
    lines.reduce((s, l) => s + l.units * l.cause.co2PerUnit, 0)
  ),
};
assert(donation.totalCo2 === 66, `co2 ${donation.totalCo2}`);

console.log("OK checkout smoke:", {
  item: product.name,
  qty: 2,
  subtotal,
  donation: live,
  causeCost,
  total,
  co2: donation.totalCo2,
});
