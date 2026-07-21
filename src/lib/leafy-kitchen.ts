/**
 * Leafy Kitchen Assistant — recipe → shopping list helpers.
 * First version: local parsing (no live LLM). Feels smart, stays honest.
 */

import { getAmazonMarketplace } from "@/lib/amazon-affiliate";
import type { Product } from "@/types";

export type SampleRecipe = {
  id: string;
  title: string;
  tagline: string;
  cookMinutes: number;
  servings: number;
  tags: string[];
  text: string;
};

export type ShoppingIngredient = {
  id: string;
  raw: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  /** pantry | produce | protein | dairy | other */
  aisle: "pantry" | "produce" | "protein" | "dairy" | "other";
  checked: boolean;
  /** How many units to add to the Forest Buddies cart (default 1) */
  cartQty: number;
};

export type RecipePlan = {
  title: string;
  ingredientCount: number;
  cookMinutes: number;
  shopMinutes: number;
  prepBufferMinutes: number;
  totalMinutes: number;
  servingsHint: number | null;
  calendarUrl: string;
  summary: string;
};

export const SAMPLE_RECIPES: SampleRecipe[] = [
  {
    id: "herb-lentil-bowl",
    title: "Herb Lentil Power Bowl",
    tagline: "Weeknight greens · 30 min",
    cookMinutes: 30,
    servings: 2,
    tags: ["vegan", "high-protein"],
    text: `Herb Lentil Power Bowl
Serves 2 · About 30 minutes

Ingredients:
- 1 cup green lentils, rinsed
- 2 cups vegetable stock
- 1 large sweet potato, cubed
- 2 tbsp olive oil
- 1 tsp smoked paprika
- 2 cups baby spinach
- 1 avocado, sliced
- 1 lemon, juiced
- 2 tbsp tahini
- 1 garlic clove, minced
- Salt and black pepper to taste
- Fresh parsley, a small handful

Method:
1. Simmer lentils in stock until tender, about 20 minutes.
2. Roast sweet potato with oil and paprika at 200°C for 20 minutes.
3. Whisk tahini, lemon, garlic, and a splash of water into a dressing.
4. Assemble bowls with spinach, lentils, sweet potato, avocado, and parsley.
`,
  },
  {
    id: "one-pan-salmon",
    title: "One-Pan Lemon Herb Salmon",
    tagline: "Light supper · 25 min",
    cookMinutes: 25,
    servings: 2,
    tags: ["pescatarian", "quick"],
    text: `One-Pan Lemon Herb Salmon
Serves 2 · About 25 minutes

Ingredients:
- 2 salmon fillets (about 140g each)
- 300g new potatoes, halved
- 1 bunch asparagus, trimmed
- 2 tbsp olive oil
- 1 lemon, sliced
- 2 garlic cloves, crushed
- 1 tsp dried oregano
- Handful of fresh dill
- Sea salt and cracked pepper

Method:
1. Toss potatoes with oil, oregano, salt; roast 15 minutes at 200°C.
2. Add salmon, asparagus, lemon, and garlic; roast 10–12 minutes more.
3. Finish with dill and a squeeze of lemon.
`,
  },
  {
    id: "forest-chia-pudding",
    title: "Forest Berry Chia Pudding",
    tagline: "Make-ahead breakfast · 10 min + chill",
    cookMinutes: 10,
    servings: 2,
    tags: ["breakfast", "make-ahead"],
    text: `Forest Berry Chia Pudding
Serves 2 · 10 minutes active + overnight chill

Ingredients:
- 6 tbsp chia seeds
- 400ml oat milk
- 2 tbsp maple syrup
- 1 tsp vanilla extract
- 150g mixed berries (fresh or frozen)
- 2 tbsp coconut yoghurt
- 1 tbsp pumpkin seeds
- Pinch of cinnamon

Method:
1. Stir chia, oat milk, maple, vanilla, and cinnamon; rest 5 minutes, stir again.
2. Chill overnight (or at least 2 hours).
3. Top with berries, yoghurt, and pumpkin seeds.
`,
  },
];

const UNIT_PATTERN =
  "(?:cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|ml|l|litres?|liters?|g|grams?|kg|oz|ounces?|lb|lbs|pounds?|cloves?|bunch(?:es)?|handfuls?|slices?|pinch(?:es)?|cans?|packets?|packs?)";

const QTY_LINE =
  new RegExp(
    `^[-*•]?\\s*(?:(\\d+[\\/\\d.]*(?:\\s*-\\s*\\d+[\\/\\d.]*)?)\\s*(${UNIT_PATTERN})?\\s+)?(.+)$`,
    "i"
  );

const PRODUCE = [
  "spinach",
  "avocado",
  "lemon",
  "potato",
  "asparagus",
  "berry",
  "berries",
  "parsley",
  "dill",
  "garlic",
  "onion",
  "tomato",
  "carrot",
  "pepper",
  "herb",
  "greens",
  "apple",
  "banana",
  "cucumber",
  "lettuce",
  "kale",
  "broccoli",
  "mushroom",
];
const PROTEIN = [
  "salmon",
  "chicken",
  "tofu",
  "egg",
  "beef",
  "turkey",
  "fish",
  "lentil",
  "chickpea",
  "bean",
];
const DAIRY = ["yoghurt", "yogurt", "milk", "cheese", "butter", "cream"];
const PANTRY = [
  "oil",
  "salt",
  "pepper",
  "paprika",
  "oregano",
  "tahini",
  "stock",
  "chia",
  "maple",
  "vanilla",
  "cinnamon",
  "seed",
  "flour",
  "sugar",
  "rice",
  "pasta",
  "spice",
];

function classifyAisle(name: string): ShoppingIngredient["aisle"] {
  const n = name.toLowerCase();
  if (PRODUCE.some((w) => n.includes(w))) return "produce";
  if (PROTEIN.some((w) => n.includes(w))) return "protein";
  if (DAIRY.some((w) => n.includes(w))) return "dairy";
  if (PANTRY.some((w) => n.includes(w))) return "pantry";
  return "other";
}

function cleanIngredientName(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(to taste|optional|fresh|rinsed|cubed|sliced|minced|crushed|trimmed|halved|chopped|diced)\b/gi, "")
    .replace(/,.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(text: string): string {
  const first = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 2 && !/^ingredients?/i.test(l));
  if (!first) return "Your recipe";
  return first.replace(/^#+\s*/, "").slice(0, 80);
}

function extractCookMinutes(text: string, fallback: number): number {
  const hour = text.match(/(\d+)\s*(?:hours?|hrs?)\b/i);
  if (hour) return Number(hour[1]) * 60;
  const range = text.match(
    /(?:about|approx(?:imately)?|cook(?:ing)?(?:\s+time)?|ready in)?\s*(\d+)\s*(?:–|-|to)\s*(\d+)\s*min/i
  );
  if (range) {
    return Math.round((Number(range[1]) + Number(range[2])) / 2);
  }
  const single = text.match(/(\d+)\s*min(?:utes?)?/i);
  if (single) return Number(single[1]);
  return fallback;
}

function extractServings(text: string): number | null {
  const m = text.match(/serves?\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

const METHOD_START =
  /^(method|directions|instructions|steps|preparation|how to|procedure|cooking|to make|make it)\b/i;
const INGREDIENTS_START =
  /^(ingredients?|you(?:'| wi)?ll need|shopping list|what you need)\b[:\s]*/i;

/** Common grocery names for free-text auto-detect when lists are messy. */
const COMMON_INGREDIENTS = [
  "olive oil",
  "vegetable oil",
  "coconut oil",
  "butter",
  "garlic",
  "onion",
  "shallot",
  "lemon",
  "lime",
  "ginger",
  "spinach",
  "kale",
  "avocado",
  "tomato",
  "cherry tomatoes",
  "potato",
  "sweet potato",
  "carrot",
  "celery",
  "broccoli",
  "asparagus",
  "mushroom",
  "cucumber",
  "pepper",
  "bell pepper",
  "chilli",
  "chili",
  "parsley",
  "coriander",
  "cilantro",
  "basil",
  "mint",
  "dill",
  "thyme",
  "rosemary",
  "oregano",
  "paprika",
  "cumin",
  "cinnamon",
  "salt",
  "black pepper",
  "pepper",
  "soy sauce",
  "tahini",
  "maple syrup",
  "honey",
  "vanilla",
  "oat milk",
  "almond milk",
  "coconut milk",
  "milk",
  "yoghurt",
  "yogurt",
  "cream",
  "cheese",
  "feta",
  "parmesan",
  "eggs",
  "egg",
  "salmon",
  "chicken",
  "tofu",
  "lentils",
  "chickpeas",
  "black beans",
  "rice",
  "quinoa",
  "pasta",
  "flour",
  "sugar",
  "chia seeds",
  "pumpkin seeds",
  "sesame seeds",
  "stock",
  "broth",
  "vinegar",
  "mustard",
  "berries",
  "banana",
  "apple",
];

function looksLikeIngredientLine(line: string): boolean {
  if (!line || line.length < 2 || line.length > 120) return false;
  if (METHOD_START.test(line)) return false;
  if (/^(serves?|servings?|prep|cook|total|yield|difficulty|nutrition)\b/i.test(line)) {
    return false;
  }
  if (/^#+\s/.test(line)) return false;
  // Numbered method steps: "1. Preheat" / "2) Mix"
  if (/^\d+[\).]\s+[A-Z]/.test(line) && !QTY_LINE.test(line.replace(/^\d+[\).]\s*/, ""))) {
    return false;
  }
  if (/^(preheat|heat|bring|place|put|mix|stir|add|bake|roast|simmer|serve|whisk|season|combine|transfer|remove|drain|chop|slice)\b/i.test(line)) {
    return false;
  }
  return (
    /^[-*•]/.test(line) ||
    QTY_LINE.test(line.replace(/^[-*•]\s*/, "")) ||
    /^\d+\s*[a-z]/i.test(line) ||
    COMMON_INGREDIENTS.some((name) =>
      new RegExp(`\\b${name.replace(/\s+/g, "\\s+")}\\b`, "i").test(line)
    )
  );
}

function detectCommonIngredientsInText(
  text: string,
  seen: Set<string>
): ShoppingIngredient[] {
  const lower = text.toLowerCase();
  // Prefer longer names first (olive oil before oil)
  const sorted = [...COMMON_INGREDIENTS].sort((a, b) => b.length - a.length);
  const found: ShoppingIngredient[] = [];

  for (const name of sorted) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    const re = new RegExp(`\\b${name.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (!re.test(lower)) continue;
    // Skip if only appears inside method after "add the" without being grocery-ish — still ok for demo
    seen.add(key);
    found.push({
      id: `ing-auto-${key.replace(/\s+/g, "-").slice(0, 24)}`,
      raw: name,
      name,
      quantity: null,
      unit: null,
      aisle: classifyAisle(name),
      checked: false,
      cartQty: 1,
    });
    if (found.length >= 18) break;
  }
  return found;
}

/** Pull ingredient lines from free-text recipes (full paste friendly). */
export function extractIngredientsFromRecipe(text: string): ShoppingIngredient[] {
  const rawLines = text.split(/\r?\n/).map((l) => l.trim());
  const lines = rawLines.filter(Boolean);
  let inIngredients = false;
  let sawIngredientsHeader = false;
  const collected: string[] = [];

  for (const line of lines) {
    if (INGREDIENTS_START.test(line)) {
      inIngredients = true;
      sawIngredientsHeader = true;
      // "Ingredients: 2 eggs, milk" on one line
      const rest = line.replace(INGREDIENTS_START, "").trim();
      if (rest.length > 2) {
        for (const bit of rest.split(/[,;]/).map((s) => s.trim()).filter(Boolean)) {
          collected.push(bit);
        }
      }
      continue;
    }
    if (inIngredients && METHOD_START.test(line)) {
      inIngredients = false;
      break;
    }
    if (inIngredients) {
      // Stop if we hit a clear numbered method without quantity
      if (
        /^\d+[\).]\s+/.test(line) &&
        !QTY_LINE.test(line.replace(/^\d+[\).]\s*/, "")) &&
        /^(preheat|heat|mix|stir|add|bake|roast|simmer|serve)/i.test(
          line.replace(/^\d+[\).]\s*/, "")
        )
      ) {
        break;
      }
      collected.push(line.replace(/^[-*•]\s*/, ""));
      continue;
    }
  }

  // No header: gather bullet / qty lines before method section
  if (collected.length === 0) {
    let hitMethod = false;
    for (const line of lines) {
      if (METHOD_START.test(line)) {
        hitMethod = true;
        continue;
      }
      if (hitMethod) continue;
      if (looksLikeIngredientLine(line)) {
        collected.push(line.replace(/^[-*•]\s*/, ""));
      }
    }
  }

  // Still empty: any bullet/qty lines in the whole paste (skip method body)
  if (collected.length === 0) {
    let skip = false;
    for (const line of lines) {
      if (METHOD_START.test(line)) skip = true;
      if (skip) continue;
      if (looksLikeIngredientLine(line)) {
        collected.push(line.replace(/^[-*•]\s*/, ""));
      }
    }
  }

  // Short paste: comma-separated
  if (collected.length === 0 && text.length < 500) {
    const bits = text
      .split(/[,\n;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && s.length < 60 && looksLikeIngredientLine(s));
    collected.push(...bits.slice(0, 16));
  }

  const seen = new Set<string>();
  const ingredients: ShoppingIngredient[] = [];

  for (const rawLine of collected) {
    const cleaned = rawLine.replace(/^\d+[\).]\s*/, "").trim();
    if (!cleaned || cleaned.length < 2) continue;
    if (/^(serves?|about|prep|cook|total|yield)\b/i.test(cleaned)) continue;
    if (METHOD_START.test(cleaned)) continue;

    const match = cleaned.match(QTY_LINE);
    const quantity = match?.[1]?.trim() ?? null;
    const unit = match?.[2]?.trim().toLowerCase() ?? null;
    const namePart = match?.[3]?.trim() ?? cleaned;
    const name = cleanIngredientName(namePart) || namePart;
    const key = name.toLowerCase();
    if (seen.has(key) || name.length < 2) continue;
    seen.add(key);

    ingredients.push({
      id: `ing-${ingredients.length + 1}-${key.replace(/\s+/g, "-").slice(0, 24)}`,
      raw: cleaned,
      name,
      quantity,
      unit,
      aisle: classifyAisle(name),
      checked: false,
      cartQty: 1,
    });
  }

  // Boost sparse parses by scanning for common grocery names in the full text
  if (ingredients.length < 4 || !sawIngredientsHeader) {
    const extras = detectCommonIngredientsInText(text, seen);
    for (const extra of extras) {
      if (ingredients.length >= 24) break;
      ingredients.push(extra);
    }
  }

  return ingredients.slice(0, 24);
}

export function formatIngredientLabel(ing: ShoppingIngredient): string {
  if (ing.quantity && ing.unit) {
    return `${ing.quantity} ${ing.unit} ${ing.name}`;
  }
  if (ing.quantity) return `${ing.quantity} ${ing.name}`;
  return ing.name;
}

/** Stable cart id for a kitchen ingredient (dedupe across recipes). */
export function kitchenIngredientCartId(ing: Pick<ShoppingIngredient, "name">): string {
  const slug = ing.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `kitchen-${slug || "item"}`;
}

const AISLE_BASE_PRICE: Record<ShoppingIngredient["aisle"], number> = {
  produce: 2.5,
  protein: 6.5,
  dairy: 3.5,
  pantry: 4.0,
  other: 3.0,
};

/** Unit shelf estimate for one cart line (before cartQty). */
export function estimateIngredientUnitPrice(ing: ShoppingIngredient): number {
  const qty = ing.quantity ? Number.parseFloat(ing.quantity.replace(/^\d+\//, "0.")) : NaN;
  const qtyFactor =
    Number.isFinite(qty) && qty > 0 ? Math.min(3, Math.max(0.5, qty)) : 1;
  return Math.round(AISLE_BASE_PRICE[ing.aisle] * qtyFactor * 100) / 100;
}

export function estimateIngredientLineTotal(ing: ShoppingIngredient): number {
  const cartQty = Math.max(1, ing.cartQty || 1);
  return Math.round(estimateIngredientUnitPrice(ing) * cartQty * 100) / 100;
}

export function estimateShoppingListTotal(
  ingredients: ShoppingIngredient[],
  opts?: { onlyAddable?: (ing: ShoppingIngredient) => boolean }
): number {
  const list = opts?.onlyAddable
    ? ingredients.filter(opts.onlyAddable)
    : ingredients.filter((i) => !i.checked);
  return Math.round(
    list.reduce((sum, ing) => sum + estimateIngredientLineTotal(ing), 0) * 100
  ) / 100;
}

/** Match cart / Amazon marketplace currency so Kitchen totals align with checkout. */
export function formatKitchenMoney(amount: number): string {
  return getAmazonMarketplace() === "uk"
    ? `£${amount.toFixed(2)}`
    : `$${amount.toFixed(2)}`;
}

export function ingredientToCartProduct(ing: ShoppingIngredient): Product {
  const price = estimateIngredientUnitPrice(ing);

  return {
    id: kitchenIngredientCartId(ing),
    name: formatIngredientLabel(ing),
    description: `From Leafy Kitchen · ${AISLE_LABELS[ing.aisle]}. Confirm size and brand at checkout or in-store.`,
    price,
    imageUrl:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect fill="#e8f0ea" width="160" height="160"/><text x="80" y="88" text-anchor="middle" font-size="48">🌿</text></svg>`
      ),
    category: "Kitchen",
    sustainabilityScore: 80,
    affiliateCommissionPercent: 5,
    availabilityNote: "Kitchen list item — availability not verified",
  };
}

/** Rough shop time: ~2.5 min per unique ingredient, capped. */
export function estimateShopMinutes(ingredientCount: number): number {
  if (ingredientCount <= 0) return 0;
  return Math.min(45, Math.max(10, Math.round(ingredientCount * 2.5)));
}

export function buildRecipePlan(input: {
  recipeText: string;
  ingredients: ShoppingIngredient[];
  sampleCookMinutes?: number;
}): RecipePlan {
  const title = extractTitle(input.recipeText);
  const cookMinutes = extractCookMinutes(
    input.recipeText,
    input.sampleCookMinutes ??
      Math.min(60, 15 + input.ingredients.length * 2)
  );
  const shopMinutes = estimateShopMinutes(input.ingredients.length);
  const prepBufferMinutes = 10;
  const totalMinutes = cookMinutes + shopMinutes + prepBufferMinutes;
  const servingsHint = extractServings(input.recipeText);

  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 2);
  const end = new Date(start.getTime() + totalMinutes * 60_000);

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const details = [
    `Leafy Kitchen plan for “${title}”`,
    ``,
    `Shopping ~${shopMinutes} min · Cook ~${cookMinutes} min · Buffer ${prepBufferMinutes} min`,
    `Total ~${totalMinutes} minutes`,
    ``,
    `Shopping list:`,
    ...input.ingredients.map((i) => `• ${formatIngredientLabel(i)}`),
    ``,
    `Planned with Forest Buddies® Leafy Kitchen Assistant`,
    `(Calendar deep-sync coming soon — this link uses Google’s event template.)`,
  ].join("\n");

  const calendarUrl = new URL(
    "https://calendar.google.com/calendar/render"
  );
  calendarUrl.searchParams.set("action", "TEMPLATE");
  calendarUrl.searchParams.set("text", `Cook: ${title}`);
  calendarUrl.searchParams.set("dates", `${fmt(start)}/${fmt(end)}`);
  calendarUrl.searchParams.set("details", details.slice(0, 1800));

  return {
    title,
    ingredientCount: input.ingredients.length,
    cookMinutes,
    shopMinutes,
    prepBufferMinutes,
    totalMinutes,
    servingsHint,
    calendarUrl: calendarUrl.toString(),
    summary: `Leafy estimates about ${totalMinutes} minutes end-to-end (${shopMinutes} shopping + ${cookMinutes} cooking + ${prepBufferMinutes} buffer).`,
  };
}

export const AISLE_LABELS: Record<ShoppingIngredient["aisle"], string> = {
  produce: "Fresh produce",
  protein: "Protein & legumes",
  dairy: "Dairy & alternatives",
  pantry: "Pantry staples",
  other: "Everything else",
};

export function groupByAisle(
  ingredients: ShoppingIngredient[]
): Array<{ aisle: ShoppingIngredient["aisle"]; items: ShoppingIngredient[] }> {
  const order: ShoppingIngredient["aisle"][] = [
    "produce",
    "protein",
    "dairy",
    "pantry",
    "other",
  ];
  return order
    .map((aisle) => ({
      aisle,
      items: ingredients.filter((i) => i.aisle === aisle),
    }))
    .filter((g) => g.items.length > 0);
}
