/**
 * Leafy Kitchen Assistant — recipe → shopping list helpers.
 * First version: local parsing (no live LLM). Feels smart, stays honest.
 */

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

/** Pull ingredient lines from free-text recipes. */
export function extractIngredientsFromRecipe(text: string): ShoppingIngredient[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let inIngredients = false;
  const collected: string[] = [];

  for (const line of lines) {
    if (/^ingredients?\b/i.test(line)) {
      inIngredients = true;
      continue;
    }
    if (
      inIngredients &&
      /^(method|directions|instructions|steps|preparation|how to)\b/i.test(line)
    ) {
      break;
    }
    if (inIngredients) {
      if (/^\d+[\).\]]\s/.test(line) && !QTY_LINE.test(line.replace(/^\d+[\).\]]\s*/, ""))) {
        // numbered method that snuck in
        break;
      }
      collected.push(line.replace(/^[-*•]\s*/, ""));
      continue;
    }
  }

  // Fallback: bullet-like lines anywhere
  if (collected.length === 0) {
    for (const line of lines) {
      if (/^[-*•]/.test(line) || /^\d+\s+\w/.test(line)) {
        if (/^(method|step)/i.test(line)) continue;
        collected.push(line.replace(/^[-*•]\s*/, ""));
      }
    }
  }

  // Last resort: split on commas in a short paste
  if (collected.length === 0 && text.length < 400) {
    const bits = text
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && s.length < 60);
    collected.push(...bits.slice(0, 16));
  }

  const seen = new Set<string>();
  const ingredients: ShoppingIngredient[] = [];

  for (const rawLine of collected) {
    const cleaned = rawLine.replace(/^\d+[\).\]]\s*/, "").trim();
    if (!cleaned || cleaned.length < 2) continue;
    if (/^(serves?|about|prep|cook|total)\b/i.test(cleaned)) continue;

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
    });
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
