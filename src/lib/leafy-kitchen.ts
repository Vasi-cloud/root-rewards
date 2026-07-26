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
  /** User already has this — muted + excluded from Add All */
  haveIt: boolean;
  /** How many units to add to the Forest Buddies cart (default 1) */
  cartQty: number;
  /** Quantity at recipe base servings (for rescaling) */
  baseQuantity: string | null;
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
    tags: ["vegan", "vegetarian", "gluten-free", "high-protein"],
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
    tags: ["pescatarian", "gluten-free", "quick"],
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
    tags: ["vegan", "vegetarian", "breakfast", "make-ahead"],
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
  "(?:cups?|tbsp|tbsps?|tablespoons?|tsp|tsps?|teaspoons?|ml|l|litres?|liters?|g|grams?|kg|oz|ounces?|lb|lbs|pounds?|cloves?|bunch(?:es)?|handfuls?|slices?|pinch(?:es)?|cans?|tins?|packets?|packs?|fillets?|pieces?|sprigs?)";

/** Quantity token: 2, 1/2, 1½, 1 1/2, 2-3, 2–3 */
const QTY_TOKEN =
  "(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?(?:\\s*[-–]\\s*(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?))?)";

const QTY_LINE = new RegExp(
  `^[-*•]?\\s*(?:(${QTY_TOKEN})\\s*(${UNIT_PATTERN})?\\s+)?(.+)$`,
  "i"
);

const UNICODE_FRACTIONS: Record<string, string> = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

const UNIT_NORMALIZE: Record<string, string> = {
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tbsps: "tbsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tsps: "tsp",
  cup: "cup",
  cups: "cups",
  gram: "g",
  grams: "g",
  litre: "l",
  litres: "l",
  liter: "l",
  liters: "l",
  ounce: "oz",
  ounces: "oz",
  pound: "lb",
  pounds: "lb",
  lbs: "lb",
  clove: "clove",
  cloves: "cloves",
  handful: "handful",
  handfuls: "handful",
  pinch: "pinch",
  pinches: "pinch",
  bunch: "bunch",
  bunches: "bunches",
  fillet: "fillet",
  fillets: "fillets",
  tin: "tin",
  tins: "tins",
  can: "can",
  cans: "cans",
};

function normalizeFractions(text: string): string {
  let out = text;
  for (const [glyph, ascii] of Object.entries(UNICODE_FRACTIONS)) {
    out = out.split(glyph).join(ascii);
  }
  // "1½" style already handled; also "1 ½" after unicode swap → "1 1/2"
  return out.replace(/(\d)\s+(\d+\/\d+)/g, "$1 $2");
}

function normalizeUnit(unit: string | null): string | null {
  if (!unit) return null;
  const key = unit.toLowerCase().trim();
  return UNIT_NORMALIZE[key] ?? key;
}

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

const METHOD_START =
  /^(method|directions|instructions|steps|preparation|how to|procedure|cooking|to make|make it)\b/i;
const INGREDIENTS_START =
  /^(ingredients?|you(?:'| wi)?ll need|shopping list|what you need)\b[:\s]*/i;

function cleanIngredientName(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, "")
    .replace(
      /\b(optional|fresh|rinsed|cubed|sliced|minced|crushed|trimmed|halved|chopped|diced|roughly|finely|thinly|large|small|medium|ripe|organic|sea|cracked|dried|ground|baby)\b/gi,
      ""
    )
    .replace(/,.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

type ParsedLine = {
  quantity: string | null;
  unit: string | null;
  name: string;
  raw: string;
};

/**
 * Parse a single ingredient line into qty / unit / name.
 * Handles “2 tbsp”, “1/2 cup”, “a handful of…”, “to taste”, trailing handfuls.
 */
export function parseIngredientLine(line: string): ParsedLine | null {
  let cleaned = normalizeFractions(line.replace(/^[-*•]\s*/, "").trim());
  cleaned = cleaned.replace(/^\d+[\).]\s*/, "").trim();
  if (!cleaned || cleaned.length < 2) return null;
  if (/^(serves?|about|prep|cook|total|yield|ingredients?)\b/i.test(cleaned)) {
    return null;
  }
  if (METHOD_START.test(cleaned)) return null;

  const raw = cleaned;
  let quantity: string | null = null;
  let unit: string | null = null;
  let namePart = cleaned;

  // “Salt and black pepper to taste” / “…, to taste”
  if (/\bto\s+taste\b/i.test(cleaned)) {
    namePart = cleaned
      .replace(/,?\s*to\s+taste\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    quantity = "to taste";
    const name = cleanIngredientName(namePart) || namePart;
    return { quantity, unit: null, name: name || "seasoning", raw };
  }

  // Trailing vague qty: “Fresh parsley, a small handful”
  const trailingVague = cleaned.match(
    /^(.+?),\s*(?:a\s+)?((?:small|large|heaped)\s+)?(handful|pinch|dash|splash|sprinkle)\s*$/i
  );
  if (trailingVague) {
    const size = trailingVague[2]?.trim();
    const vague = trailingVague[3].toLowerCase();
    quantity = size ? `${size} ${vague}`.replace(/\s+/g, " ") : vague;
    unit = null;
    namePart = trailingVague[1];
    const name = cleanIngredientName(namePart) || namePart;
    return { quantity, unit, name, raw };
  }

  // Leading vague: “a handful of dill”, “Pinch of cinnamon”, “Handful of fresh dill”
  const leadingVague = cleaned.match(
    /^(?:a\s+|an\s+)?((?:small|large|heaped)\s+)?(handful|pinch|dash|splash|sprinkle)\s+(?:of\s+)?(.+)$/i
  );
  if (leadingVague) {
    const size = leadingVague[1]?.trim();
    const vague = leadingVague[2].toLowerCase();
    quantity = size ? `${size} ${vague}`.replace(/\s+/g, " ") : vague;
    namePart = leadingVague[3];
    const name = cleanIngredientName(namePart) || namePart;
    return { quantity, unit: null, name, raw };
  }

  // “about 140g …” without leading count — keep as name-focused
  const match = cleaned.match(QTY_LINE);
  if (match?.[1]) {
    quantity = match[1].replace(/\s*[-–]\s*/g, "–").replace(/\s+/g, " ").trim();
    unit = normalizeUnit(match[2] ?? null);
    namePart = match[3]?.trim() ?? cleaned;
  } else {
    namePart = cleaned;
  }

  // “2 x salmon fillets” / “2x eggs”
  const timesForm = namePart.match(/^x\s+(.+)$/i);
  if (timesForm && quantity) {
    namePart = timesForm[1];
  }

  let name = cleanIngredientName(namePart) || namePart;
  // If unit was swallowed into name (rare), leave as-is
  if (name.length < 2) name = namePart.trim();

  return { quantity, unit, name, raw };
}

export function extractTitle(text: string): string {
  const first = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 2 && !/^ingredients?/i.test(l));
  if (!first) return "Your recipe";
  return first.replace(/^#+\s*/, "").slice(0, 80);
}

/** Pull method / directions block from a pasted recipe, if present. */
export function extractRecipeMethod(text: string): string | null {
  const lines = text.split(/\r?\n/);
  let inMethod = false;
  const collected: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed && !inMethod) continue;

    if (METHOD_START.test(trimmed)) {
      inMethod = true;
      const rest = trimmed
        .replace(METHOD_START, "")
        .replace(/^[:\s]+/, "")
        .trim();
      if (rest) collected.push(rest);
      continue;
    }

    if (inMethod) {
      if (INGREDIENTS_START.test(trimmed)) break;
      collected.push(trimmed);
    }
  }

  const method = collected.join("\n").trim();
  return method.length > 0 ? method : null;
}

/** True when the paste looks like it includes cooking steps. */
export function recipeTextHasMethod(text: string): boolean {
  return Boolean(extractRecipeMethod(text));
}

function extractCookMinutes(text: string, fallback: number): number {
  // Prefer header-style timings over method step durations.
  const header = text.split(/\r?\n/).slice(0, 6).join("\n");
  const about = header.match(
    /(?:about|approx(?:imately)?|ready in)\s*(\d+)\s*min/i
  );
  if (about) return Number(about[1]);
  const servesLine = header.match(
    /(?:serves?\s+\d+\s*[·•|,]\s*)(?:about\s*)?(\d+)\s*min/i
  );
  if (servesLine) return Number(servesLine[1]);
  const active = header.match(/(\d+)\s*min(?:utes?)?\s*active/i);
  if (active) return Number(active[1]);

  const range = text.match(
    /(?:about|approx(?:imately)?|cook(?:ing)?(?:\s+time)?|ready in)\s*(\d+)\s*(?:–|-|to)\s*(\d+)\s*min/i
  );
  if (range) {
    return Math.round((Number(range[1]) + Number(range[2])) / 2);
  }
  const single = header.match(/(\d+)\s*min(?:utes?)?/i);
  if (single) return Number(single[1]);
  return fallback;
}

function extractServings(text: string): number | null {
  const m = text.match(/serves?\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

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
      haveIt: false,
      cartQty: 1,
      baseQuantity: null,
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
    const parsed = parseIngredientLine(rawLine);
    if (!parsed) continue;
    const key = parsed.name.toLowerCase();
    if (seen.has(key) || parsed.name.length < 2) continue;
    seen.add(key);

    ingredients.push({
      id: `ing-${ingredients.length + 1}-${key.replace(/\s+/g, "-").slice(0, 24)}`,
      raw: parsed.raw,
      name: parsed.name,
      quantity: parsed.quantity,
      unit: parsed.unit,
      aisle: classifyAisle(parsed.name),
      checked: false,
      haveIt: false,
      cartQty: 1,
      baseQuantity: parsed.quantity,
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

function pluralizeUnit(unit: string | null, qty: string | null): string | null {
  if (!unit) return null;
  const n = parseQuantityValue(qty);
  const plural = n != null && n > 1.001;
  const map: Record<string, [string, string]> = {
    cup: ["cup", "cups"],
    cups: ["cup", "cups"],
    tbsp: ["tbsp", "tbsp"],
    tsp: ["tsp", "tsp"],
    clove: ["clove", "cloves"],
    cloves: ["clove", "cloves"],
    bunch: ["bunch", "bunches"],
    bunches: ["bunch", "bunches"],
    fillet: ["fillet", "fillets"],
    fillets: ["fillet", "fillets"],
    can: ["can", "cans"],
    cans: ["can", "cans"],
    tin: ["tin", "tins"],
    tins: ["tin", "tins"],
    g: ["g", "g"],
    ml: ["ml", "ml"],
    kg: ["kg", "kg"],
    l: ["l", "l"],
    oz: ["oz", "oz"],
    lb: ["lb", "lb"],
  };
  const pair = map[unit.toLowerCase()];
  if (!pair) return unit;
  return plural ? pair[1] : pair[0];
}

export function formatIngredientLabel(ing: ShoppingIngredient): string {
  if (ing.quantity === "to taste") {
    return `${ing.name} (to taste)`;
  }
  if (ing.quantity && ing.unit) {
    const unit = pluralizeUnit(ing.unit, ing.quantity) ?? ing.unit;
    return `${ing.quantity} ${unit} ${ing.name}`;
  }
  if (ing.quantity) {
    // Vague measures read naturally: “handful dill” → “handful of dill”
    if (
      /^(?:small |large |heaped )?(handful|pinch|dash|splash|sprinkle)$/i.test(
        ing.quantity
      )
    ) {
      return `${ing.quantity} of ${ing.name}`;
    }
    return `${ing.quantity} ${ing.name}`;
  }
  return ing.name;
}

export const SERVING_OPTIONS = [2, 4, 6, 8] as const;

const VAGUE_QTY_RE =
  /^(?:to taste|(?:small |large |heaped )?(handful|pinch|dash|splash|sprinkle))$/i;

/** Parse a quantity string into a number (null if not scalable). */
export function parseQuantityValue(qty: string | null): number | null {
  if (!qty) return null;
  const trimmed = qty.trim();
  if (VAGUE_QTY_RE.test(trimmed)) return null;

  // Range → midpoint (e.g. 2–3)
  const range = trimmed.match(
    /^(\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)\s*[–-]\s*(\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)$/
  );
  if (range) {
    const a = parseQuantityValue(range[1]);
    const b = parseQuantityValue(range[2]);
    if (a != null && b != null) return (a + b) / 2;
  }

  // Mixed number: 1 1/2
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  }

  // Simple fraction: 1/2
  const frac = trimmed.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }

  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Format a scaled amount in a friendly way (prefer simple fractions). */
export function formatQuantityValue(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "1";
  const rounded = Math.round(n * 100) / 100;
  const whole = Math.floor(rounded + 1e-9);
  const frac = rounded - whole;

  const fractions: Array<[number, string]> = [
    [0, ""],
    [0.25, "1/4"],
    [0.33, "1/3"],
    [0.5, "1/2"],
    [0.67, "2/3"],
    [0.75, "3/4"],
  ];

  let best = "";
  let bestDiff = 0.08;
  for (const [v, label] of fractions) {
    const diff = Math.abs(frac - v);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = label;
    }
  }

  if (best === "" && frac < 0.08) {
    return String(Math.max(1, whole || Math.round(rounded)));
  }
  if (best && whole === 0) return best;
  if (best && whole > 0) return `${whole} ${best}`;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(Math.round(rounded * 10) / 10);
}

export function scaleQuantityString(
  baseQuantity: string | null,
  baseServings: number,
  servings: number
): string | null {
  if (!baseQuantity) return null;
  if (baseServings <= 0 || servings <= 0) return baseQuantity;
  if (Math.abs(baseServings - servings) < 1e-9) return baseQuantity;
  if (VAGUE_QTY_RE.test(baseQuantity.trim())) return baseQuantity;

  const value = parseQuantityValue(baseQuantity);
  if (value == null) return baseQuantity;

  const scaled = value * (servings / baseServings);
  return formatQuantityValue(scaled);
}

export function scaleIngredientsForServings(
  ingredients: ShoppingIngredient[],
  baseServings: number,
  servings: number
): ShoppingIngredient[] {
  return ingredients.map((ing) => ({
    ...ing,
    quantity: scaleQuantityString(
      ing.baseQuantity ?? ing.quantity,
      baseServings,
      servings
    ),
  }));
}

export function resolveBaseServings(
  recipeText: string,
  sampleId?: string | null
): number {
  const fromText = extractServings(recipeText);
  if (fromText && fromText > 0) return fromText;
  const sample = sampleId
    ? SAMPLE_RECIPES.find((s) => s.id === sampleId)
    : undefined;
  return sample?.servings ?? 2;
}

/** Cleaner grocery search term for Amazon / Buy Local. */
export function ingredientSearchTerm(
  ing: Pick<ShoppingIngredient, "name" | "raw" | "unit">
): string {
  const raw = ing.raw
    .replace(/\([^)]*\)/g, "")
    .replace(/\bto taste\b/gi, "")
    .replace(
      /^(?:a\s+|an\s+)?(?:small\s+|large\s+|heaped\s+)?(?:handful|pinch|dash|splash|sprinkle)\s+(?:of\s+)?/i,
      ""
    )
    .replace(
      /^\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?(?:\s*[–-]\s*\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)?\s*/i,
      ""
    )
    .replace(
      /^(?:cups?|tbsp|tbsps?|tablespoons?|tsp|tsps?|teaspoons?|ml|l|g|kg|oz|lb|lbs|cloves?|bunch(?:es)?|cans?|tins?|packets?|packs?|fillets?|pieces?)\s+/i,
      ""
    )
    .replace(
      /\b(optional|rinsed|cubed|sliced|minced|crushed|trimmed|halved|chopped|diced|juiced|fresh|dried|ground|organic|sea|cracked)\b/gi,
      ""
    )
    .replace(/,.*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  let term = raw.length >= 3 ? raw : ing.name;

  // Prefer keeping distinctive product words from the cleaned name
  if (ing.name && term.toLowerCase().includes(ing.name.toLowerCase())) {
    // already good
  } else if (ing.name.length > term.length) {
    term = ing.name;
  }

  // Count nouns that shoppers search for
  if (/\bsalmon\b/i.test(term) && !/\bfillet/i.test(term)) {
    term = term.replace(/\bsalmon\b/i, "salmon fillets");
  }
  if (/\blentil\b/i.test(term) && !/\blentils\b/i.test(term)) {
    term = term.replace(/\blentil\b/i, "lentils");
  }

  term = term.replace(/\s+/g, " ").trim();
  return term || ing.name;
}

export function kitchenAmazonSearchTerm(
  ing: Pick<ShoppingIngredient, "name" | "raw" | "unit">
): string {
  return `${ingredientSearchTerm(ing)}`.trim();
}

/** Deep-link to Buy Local focused on this ingredient. */
export function kitchenLocalHref(
  ingredient: string | Pick<ShoppingIngredient, "name" | "raw" | "unit">
): string {
  const term =
    typeof ingredient === "string"
      ? ingredient.trim()
      : ingredientSearchTerm(ingredient);
  const params = new URLSearchParams({
    ingredient: term,
    from: "kitchen",
  });
  return `/local?${params.toString()}#local-stores`;
}

export type DietaryFilterId = "vegetarian" | "vegan" | "gluten-free";

export const DIETARY_FILTERS: Array<{
  id: DietaryFilterId;
  label: string;
  hint: string;
}> = [
  {
    id: "vegetarian",
    label: "Vegetarian",
    hint: "No meat or fish",
  },
  {
    id: "vegan",
    label: "Vegan",
    hint: "Plant-based",
  },
  {
    id: "gluten-free",
    label: "Gluten-free",
    hint: "Check labels — guidance only",
  },
];

export function sampleMatchesDietaryFilter(
  sample: SampleRecipe,
  filter: DietaryFilterId | null
): boolean {
  if (!filter) return true;
  const tags = sample.tags.map((t) => t.toLowerCase());
  if (filter === "vegan") return tags.includes("vegan");
  if (filter === "vegetarian") {
    return tags.includes("vegan") || tags.includes("vegetarian");
  }
  if (filter === "gluten-free") return tags.includes("gluten-free");
  return true;
}

/** Gentle note when a dietary filter is active on the current list. */
export function shoppingListFilterNote(
  ingredients: ShoppingIngredient[],
  filter: DietaryFilterId | null
): string | null {
  if (!filter || ingredients.length === 0) return null;

  if (filter === "vegan") {
    const hasAnimal =
      ingredients.some((i) =>
        /\b(salmon|tuna|fish|chicken|beef|turkey|egg|eggs|honey|butter|cheese|feta|parmesan)\b/i.test(
          i.name
        )
      ) ||
      ingredients.some(
        (i) =>
          /\b(milk|yoghurt|yogurt|cream)\b/i.test(i.name) &&
          !/\b(oat|almond|soy|coconut|rice|hemp)\b/i.test(i.name)
      );
    if (hasAnimal) {
      return "Vegan filter is on — this list may include animal products. Double-check before you shop.";
    }
    return "Vegan filter is on — this list looks plant-based. Still check labels for honey or hidden dairy.";
  }

  if (filter === "vegetarian") {
    const hasMeatFish = ingredients.some((i) =>
      /\b(salmon|tuna|fish|chicken|beef|turkey|anchovy|prawn|shrimp)\b/i.test(
        i.name
      )
    );
    if (hasMeatFish) {
      return "Vegetarian filter is on — this list includes fish or meat. Swap those items if you need a vegetarian shop.";
    }
    return "Vegetarian filter is on — no meat or fish spotted on this list.";
  }

  if (filter === "gluten-free") {
    const risky = ingredients.some((i) =>
      /\b(flour|pasta|bread|soy sauce|wheat|couscous|noodle|oat|oats)\b/i.test(
        i.name
      )
    );
    if (risky) {
      return "Gluten-free filter is on — some items may contain gluten depending on brand. Choose certified GF where needed.";
    }
    return "Gluten-free filter is on — nothing obvious on this list, but always read packaging.";
  }

  return null;
}

export function formatShoppingListPlainText(input: {
  title: string;
  servings: number;
  ingredients: ShoppingIngredient[];
}): string {
  const lines = [
    input.title,
    `Servings: ${input.servings}`,
    "",
    "Shopping list",
    ...input.ingredients.map((ing) => {
      const label = formatIngredientLabel(ing);
      if (ing.haveIt) return `☐ ${label} (already have)`;
      if (ing.checked) return `☑ ${label}`;
      return `☐ ${label}`;
    }),
    "",
    "Planned with Forest Buddies® Leafy Kitchen",
  ];
  return lines.join("\n");
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
  const qty = parseQuantityValue(ing.quantity);
  const qtyFactor =
    qty != null && qty > 0 ? Math.min(3, Math.max(0.5, qty)) : 1;
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
    : ingredients.filter((i) => !i.checked && !i.haveIt);
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

export type RecipeComplexity = {
  score: number;
  aisleCount: number;
  hasProtein: boolean;
  slowCookHints: boolean;
};

/** Heuristic complexity from ingredient mix + method wording. */
export function estimateRecipeComplexity(
  recipeText: string,
  ingredients: ShoppingIngredient[]
): RecipeComplexity {
  const aisles = new Set(ingredients.map((i) => i.aisle));
  const hasProtein = ingredients.some((i) => i.aisle === "protein");
  const text = recipeText.toLowerCase();
  const slowCookHints =
    /\b(roast|bake|simmer|marinate|overnight|chill|reduce|braise|proof|ferment)\b/i.test(
      text
    );

  let score = 1;
  if (ingredients.length >= 8) score += 1;
  if (ingredients.length >= 12) score += 1;
  if (aisles.size >= 4) score += 1;
  if (hasProtein) score += 1;
  if (slowCookHints) score += 1;
  if (/\b(blend|whisk|assemble|layer)\b/i.test(text)) score += 0.5;

  return {
    score: Math.min(5, score),
    aisleCount: aisles.size,
    hasProtein,
    slowCookHints,
  };
}

/**
 * Shop time: base + per item + aisle hopping.
 * Typical small list ~12–20 min; larger multi-aisle ~25–45.
 */
export function estimateShopMinutes(
  ingredientCount: number,
  complexity?: Pick<RecipeComplexity, "aisleCount">
): number {
  if (ingredientCount <= 0) return 0;
  const aisleBonus = complexity
    ? Math.max(0, complexity.aisleCount - 2) * 3
    : 0;
  const raw = 8 + ingredientCount * 2.2 + aisleBonus;
  return Math.min(50, Math.max(10, Math.round(raw / 5) * 5));
}

function estimatePrepBufferMinutes(
  ingredientCount: number,
  complexity: RecipeComplexity
): number {
  const raw = 6 + ingredientCount * 0.6 + complexity.score * 2;
  return Math.min(20, Math.max(8, Math.round(raw / 2) * 2));
}

function estimateCookFallback(
  ingredientCount: number,
  complexity: RecipeComplexity
): number {
  const raw =
    12 +
    ingredientCount * 1.5 +
    complexity.score * 4 +
    (complexity.hasProtein ? 5 : 0) +
    (complexity.slowCookHints ? 8 : 0);
  return Math.min(75, Math.max(15, Math.round(raw / 5) * 5));
}

export function buildRecipePlan(input: {
  recipeText: string;
  ingredients: ShoppingIngredient[];
  sampleCookMinutes?: number;
}): RecipePlan {
  const title = extractTitle(input.recipeText);
  const complexity = estimateRecipeComplexity(
    input.recipeText,
    input.ingredients
  );
  // Prefer explicit sample cook time — free-text often matches step times (e.g. “10–12 min more”).
  const cookMinutes =
    input.sampleCookMinutes ??
    extractCookMinutes(
      input.recipeText,
      estimateCookFallback(input.ingredients.length, complexity)
    );
  const shopMinutes = estimateShopMinutes(
    input.ingredients.length,
    complexity
  );
  const prepBufferMinutes = estimatePrepBufferMinutes(
    input.ingredients.length,
    complexity
  );
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
    summary: `About ${totalMinutes} min end-to-end: ${shopMinutes} shopping + ${cookMinutes} cooking + ${prepBufferMinutes} prep buffer. Times are estimates — adjust for your kitchen and store.`,
  };
}

export type DietaryNote = {
  id: string;
  label: string;
  detail: string;
  /** warning = likely allergen present; info = general dietary tip */
  tone: "warning" | "info";
};

const ALLERGEN_RULES: Array<{
  id: string;
  label: string;
  detail: string;
  tone: DietaryNote["tone"];
  keywords: string[];
}> = [
  {
    id: "fish",
    label: "Contains fish",
    detail:
      "This list includes fish (e.g. salmon). Cross-check packaging if cooking for someone with a fish allergy.",
    tone: "warning",
    keywords: ["salmon", "tuna", "cod", "fish", "anchovy", "sardine", "trout"],
  },
  {
    id: "shellfish",
    label: "Contains shellfish",
    detail: "Shellfish can cause severe reactions — confirm labels and prep surfaces.",
    tone: "warning",
    keywords: ["shrimp", "prawn", "crab", "lobster", "mussel", "clam", "oyster"],
  },
  {
    id: "dairy",
    label: "Contains dairy",
    detail:
      "Dairy or dairy-style items detected. Plant alternatives may work — check recipes and labels.",
    tone: "warning",
    keywords: [
      "milk",
      "butter",
      "cheese",
      "yoghurt",
      "yogurt",
      "cream",
      "feta",
      "parmesan",
    ],
  },
  {
    id: "egg",
    label: "Contains egg",
    detail: "Eggs appear on this list. Confirm if cooking for egg allergies.",
    tone: "warning",
    keywords: ["egg", "eggs"],
  },
  {
    id: "gluten",
    label: "May contain gluten",
    detail:
      "Gluten-free options may vary by brand (flour, pasta, soy sauce, oats). Always read the label.",
    tone: "warning",
    keywords: [
      "flour",
      "pasta",
      "bread",
      "soy sauce",
      "noodle",
      "wheat",
      "couscous",
      "oat",
      "oats",
    ],
  },
  {
    id: "sesame",
    label: "Contains sesame",
    detail: "Sesame (including tahini) is a common allergen in many regions.",
    tone: "warning",
    keywords: ["sesame", "tahini"],
  },
  {
    id: "nuts",
    label: "May contain nuts",
    detail:
      "Tree nuts or nut products may be present. Check packaging for cross-contamination notes.",
    tone: "warning",
    keywords: [
      "almond",
      "walnut",
      "cashew",
      "peanut",
      "hazelnut",
      "pecan",
      "pistachio",
      "nut",
    ],
  },
  {
    id: "soy",
    label: "Contains soy",
    detail: "Soy appears on this list (e.g. tofu, soy sauce). Confirm labels if needed.",
    tone: "warning",
    keywords: ["tofu", "soy", "edamame", "tempeh"],
  },
];

function isPlantDairyAlternative(name: string): boolean {
  return /\b(oat|almond|soy|coconut|rice|hemp|cashew)\s+(milk|yoghurt|yogurt|cream)\b/i.test(
    name
  ) || /\bcoconut\s+(yoghurt|yogurt)\b/i.test(name);
}

function ingredientMatchesAllergen(
  name: string,
  ruleId: string,
  keywords: string[]
): boolean {
  const n = name.toLowerCase();
  if (ruleId === "dairy" && isPlantDairyAlternative(n)) return false;
  // Avoid “peanut” false-positive from bare “nut” when only seeds present
  return keywords.some((kw) => {
    if (kw === "nut" && /\b(coconut|nutmeg)\b/.test(n) && !/\b(tree\s+)?nuts?\b/.test(n)) {
      return false;
    }
    const re = new RegExp(`\\b${kw.replace(/\s+/g, "\\s+")}\\b`, "i");
    return re.test(n);
  });
}

/** Cautious allergen / dietary notes inferred from ingredient names. */
export function detectDietaryNotes(
  ingredients: ShoppingIngredient[]
): DietaryNote[] {
  const notes: DietaryNote[] = [];

  for (const rule of ALLERGEN_RULES) {
    const hit = ingredients.some((ing) =>
      ingredientMatchesAllergen(ing.name, rule.id, rule.keywords)
    );
    if (hit) {
      notes.push({
        id: rule.id,
        label: rule.label,
        detail: rule.detail,
        tone: rule.tone,
      });
    }
  }

  // Helpful, non-alarmist tip when nothing strong matched
  if (notes.length === 0 && ingredients.length > 0) {
    notes.push({
      id: "general",
      label: "Check labels & allergens",
      detail:
        "Leafy can’t verify allergens from a recipe paste. If cooking for others, double-check every pack and ask about cross-contact.",
      tone: "info",
    });
  } else if (notes.length > 0) {
    notes.push({
      id: "caution",
      label: "Guidance only",
      detail:
        "These notes are inferred from ingredient names — not a full allergen analysis. Always verify packaging.",
      tone: "info",
    });
  }

  return notes;
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
