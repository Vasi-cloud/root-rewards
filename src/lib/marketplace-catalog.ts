import type { Product } from "@/types";
import { apparelSizeChart, outerwearSizeChart } from "@/lib/product-details";

/** Shared marketplace catalog — used by shop + recommendation agent. */
export const MARKETPLACE_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Organic Cotton Tote",
    description:
      "Everyday market tote in GOTS-certified organic cotton canvas. Double-stitched seams, reinforced base, and long shoulder straps that stay comfortable when the bag is full. Natural undyed look softens with every wash — built to replace single-use bags for years.",
    price: 28,
    imageUrl: "/eco-tote.svg",
    category: "Accessories",
    sustainabilityScore: 92,
    affiliateCommissionPercent: 12,
    materials: "100% GOTS organic cotton canvas (12 oz), cotton webbing straps",
    madeIn: "Portugal",
    dimensions: "38 × 42 cm body · 28 cm strap drop · holds ~12 L",
    fitGuide:
      "One size. Roomy enough for groceries or a laptop sleeve; straps sit mid-shoulder on most adults.",
    careNotes:
      "Machine wash cold, gentle cycle. Air dry flat to keep shape. Spot-treat stains; avoid bleach.",
  },
  {
    id: "2",
    name: "Bamboo Cutlery Set",
    description:
      "Portable fork, spoon, knife, and chopsticks in a compostable cotton pouch. Smooth bamboo that won’t scratch travel mugs or lunch boxes. Ideal for office desks, picnics, and flights when you want to skip disposable utensils.",
    price: 18,
    imageUrl: "/eco-cutlery.svg",
    category: "Kitchen",
    sustainabilityScore: 88,
    affiliateCommissionPercent: 10,
    materials: "Moso bamboo utensils, organic cotton drawstring pouch",
    madeIn: "Vietnam",
    dimensions: "Pouch 20 × 7 cm · utensils ~16–18 cm",
    careNotes:
      "Hand wash with mild soap; dry thoroughly. Do not soak or dishwasher — bamboo can warp with heat and standing water.",
  },
  {
    id: "3",
    name: "Refillable Glass Cleaner",
    description:
      "Plant-based concentrate in a reusable amber glass bottle. One bottle makes months of all-purpose spray for glass, counters, and stainless. Unscented option with citrus peel extract — no ammonia, no synthetic dyes.",
    price: 14,
    imageUrl: "/eco-cleaner.svg",
    category: "Home",
    sustainabilityScore: 95,
    affiliateCommissionPercent: 15,
    materials: "Amber glass bottle, plant-based surfactant concentrate, recycled paper label",
    madeIn: "USA",
    dimensions: "500 ml glass bottle · concentrate refill sachets sold separately",
    careNotes:
      "Dilute per label. Store upright, away from direct sun. Rinse spray nozzle if clogged. Recycle glass when empty.",
  },
  {
    id: "4",
    name: "Hemp Backpack",
    description:
      "Everyday backpack in 100% organic hemp canvas with a padded laptop sleeve and water-resistant base panel. Hemp softens with wear but stays tough on commute days. Brass hardware, adjustable straps, and a clean silhouette that works for work or weekend trails.",
    price: 65,
    imageUrl: "/eco-backpack.svg",
    category: "Apparel",
    sustainabilityScore: 85,
    affiliateCommissionPercent: 14,
    materials: "Organic hemp canvas, recycled PET lining, brass hardware, padded foam sleeve",
    madeIn: "India (fair-trade workshop)",
    dimensions: "42 × 30 × 14 cm · fits 15\" laptop · ~18 L capacity",
    fitGuide:
      "Unisex one-size. Sternum strap and padded shoulder straps adjust for most adults 157–190 cm. Try on with a jacket if you layer heavily.",
    careNotes:
      "Spot clean or gentle cold wash inside-out in a laundry bag. Air dry only — heat shrinks hemp. Reshape while damp.",
  },
  {
    id: "5",
    name: "Beeswax Food Wraps",
    description:
      "Set of three reusable wraps (S/M/L) coated in beeswax, jojoba, and tree resin. Wrap bowls, cheese, or half an avocado — then wash and reuse for a year or more. Compostable at end of life when the wax wears thin.",
    price: 12,
    imageUrl: "/eco-wraps.svg",
    category: "Kitchen",
    sustainabilityScore: 98,
    affiliateCommissionPercent: 8,
    materials: "Organic cotton, beeswax, jojoba oil, tree resin",
    madeIn: "Canada",
    dimensions: "S 20×20 cm · M 28×28 cm · L 33×33 cm",
    careNotes:
      "Rinse in cool water with mild soap; air dry. Never microwave, oven, or hot water — heat melts the wax. Refresh with a warm iron between parchment if needed.",
  },
  {
    id: "6",
    name: "Recycled Paper Notebook Set",
    description:
      "3-pack of A5 notebooks from 100% post-consumer waste paper. Soft-touch covers, lay-flat binding, and dotted pages that work for journaling or planning. Printed with soy-based ink.",
    price: 15,
    imageUrl: "/eco-notebook.svg",
    category: "Stationery",
    sustainabilityScore: 80,
    affiliateCommissionPercent: 11,
    materials: "100% post-consumer recycled paper, soy ink, vegetable-based glue",
    madeIn: "Netherlands",
    dimensions: "A5 (148 × 210 mm) · 80 pages each · set of 3",
    careNotes:
      "Keep dry. Covers tolerate light backpack wear; avoid prolonged moisture.",
  },
  {
    id: "7",
    name: "Organic Lip Balm",
    description:
      "Certified organic beeswax and essential-oil balm in a refillable metal tin. Softens without sticky residue. Choose unscented or light mint — free from petrolatum and synthetic fragrance.",
    price: 9,
    imageUrl: "/eco-balm.svg",
    category: "Beauty",
    sustainabilityScore: 91,
    affiliateCommissionPercent: 9,
    materials: "Organic beeswax, organic plant oils, essential oils, aluminum tin",
    madeIn: "USA",
    dimensions: "15 g tin · ~1.5 cm deep",
    careNotes:
      "Store below 30°C so the balm doesn’t soften in a hot car. Wipe tin clean; refill when empty.",
  },
  {
    id: "8",
    name: "Solar-Powered Lantern",
    description:
      "Compact LED lantern charged by a fold-out solar panel — no disposable batteries. Three brightness levels and a hanging hook for tents or porches. Charges in ~6 hours of sun; lasts up to 12 hours on low.",
    price: 35,
    imageUrl: "/eco-lantern.svg",
    category: "Home",
    sustainabilityScore: 87,
    affiliateCommissionPercent: 13,
    materials: "Recycled ABS housing, tempered glass lens, lithium battery (replaceable)",
    madeIn: "Taiwan",
    dimensions: "12 cm tall × 8 cm diameter · 280 g",
    careNotes:
      "Wipe with a damp cloth. Charge fully before first use. Avoid submerging. Store with ~50% charge if unused for months.",
  },
  {
    id: "9",
    name: "Stainless Steel Water Bottle",
    description:
      "18/8 food-grade double-wall insulated bottle. Keeps drinks cold ~24 hours or hot ~12. Narrow mouth for sipping, wide enough for ice. Powder-coated exterior resists scratches from backpack pockets.",
    price: 24,
    imageUrl: "/eco-bottle.svg",
    category: "Kitchen",
    sustainabilityScore: 94,
    affiliateCommissionPercent: 11,
    materials: "18/8 stainless steel, BPA-free polypropylene lid, silicone seal",
    madeIn: "China (audited factory)",
    dimensions: "500 ml · 23 cm tall × 7 cm diameter · fits most cup holders",
    fitGuide:
      "Slim profile fits standard car cup holders and backpack side pockets. Not designed for carbonated drinks under pressure.",
    careNotes:
      "Hand wash preferred to protect insulation vacuum. Lid is top-rack dishwasher safe. Do not freeze when full.",
  },
  {
    id: "10",
    name: "Bamboo Toothbrush Set",
    description:
      "4-pack with medium plant-based bristles and travel cases. Handles are untreated bamboo you can compost after removing the bristle head. Color-coded for household sharing.",
    price: 16,
    imageUrl: "/eco-toothbrush.svg",
    category: "Beauty",
    sustainabilityScore: 96,
    affiliateCommissionPercent: 10,
    materials: "Bamboo handle, castor-oil bristles, recycled cardboard sleeve",
    madeIn: "China",
    dimensions: "Standard adult brush length (~19 cm) · set of 4",
    careNotes:
      "Rinse after use; stand upright to dry. Replace every 3 months. Snap off bristle head before composting the handle.",
  },
  {
    id: "11",
    name: "Organic Hemp T-Shirt",
    description:
      "Breathable mid-weight tee from organic hemp–organic cotton blend. Soft from the first wear, stronger after washes, and cut for everyday movement. Ethically sewn in fair-trade workshops with a clean crew neck and double-needle hem.",
    price: 32,
    imageUrl: "/eco-tshirt.svg",
    category: "Apparel",
    sustainabilityScore: 89,
    affiliateCommissionPercent: 13,
    materials: "55% organic hemp / 45% organic cotton jersey (180 gsm)",
    madeIn: "India (fair-trade certified)",
    sizeChart: apparelSizeChart(
      "Regular fit through chest and waist. Hemp softens and relaxes slightly after 2–3 washes — if between sizes, size down for a closer fit."
    ),
    fitGuide:
      "Model reference: 178 cm / 70 kg wears EU 40 (UK 12 / US 8). Shoulder seams sit at the natural shoulder. Length covers the belt line without excess drape.",
    careNotes:
      "Machine wash cold inside-out with like colors. Line dry or tumble low. Avoid high heat — hemp can shrink. Cool iron if needed.",
  },
  {
    id: "12",
    name: "Natural Soy Candle Trio",
    description:
      "Hand-poured soy candles with essential-oil blends (cedar, citrus, lavender). Clean burn, cotton wicks, and reusable glass vessels. Each burns 40+ hours — gift-ready in recycled packaging.",
    price: 28,
    imageUrl: "/eco-candle.svg",
    category: "Home",
    sustainabilityScore: 85,
    affiliateCommissionPercent: 12,
    materials: "Soy wax, cotton wick, essential oils, reusable glass jar",
    madeIn: "USA",
    dimensions: "3 × 120 g jars · ~6 cm diameter each",
    careNotes:
      "Trim wick to 5 mm before lighting. Burn until wax melts edge-to-edge (first burn). Never leave unattended. Reuse jars for herbs or cotton swabs.",
  },
  {
    id: "13",
    name: "Seed Paper Greeting Cards",
    description:
      "6 plantable wildflower cards on seed paper. Write, gift, then plant the card — wildflowers sprout in 1–3 weeks with light and water. Blank insides; envelopes included.",
    price: 19,
    imageUrl: "/eco-cards.svg",
    category: "Stationery",
    sustainabilityScore: 99,
    affiliateCommissionPercent: 9,
    materials: "Post-consumer paper pulp with embedded wildflower seeds, recycled envelopes",
    madeIn: "UK",
    dimensions: "A6 cards (105 × 148 mm) · set of 6 with envelopes",
    careNotes:
      "Keep dry until planting. To plant: soak briefly, press into soil, keep moist and sunny. Best sown in spring/autumn.",
  },
  {
    id: "14",
    name: "Cast Iron Skillet",
    description:
      "Pre-seasoned 10-inch skillet with no synthetic coatings — just iron that lasts generations. Even heat for searing, baking, and stovetop-to-oven meals. Helper handle for safe lifts.",
    price: 42,
    imageUrl: "/eco-skillet.svg",
    category: "Kitchen",
    sustainabilityScore: 91,
    affiliateCommissionPercent: 8,
    materials: "Cast iron, factory seasoning (vegetable oil)",
    madeIn: "USA",
    dimensions: "10\" (25 cm) cooking surface · overall ~40 cm with handles · ~2.3 kg",
    careNotes:
      "Hand wash, dry immediately, wipe with a thin oil film. Avoid soaking and dishwashers. Oven or stovetop re-season if food starts to stick.",
  },
  {
    id: "15",
    name: "Organic Cotton Rounds",
    description:
      "10 reusable facial rounds in a mesh laundry bag. Soft terry on one side, gentle texture on the other for toner or makeup removal. Replaces hundreds of disposable pads.",
    price: 11,
    imageUrl: "/eco-rounds.svg",
    category: "Beauty",
    sustainabilityScore: 93,
    affiliateCommissionPercent: 10,
    materials: "GOTS organic cotton terry, organic cotton mesh wash bag",
    madeIn: "Turkey",
    dimensions: "8 cm diameter rounds · set of 10 + mesh bag",
    careNotes:
      "Toss rounds in the mesh bag; machine wash warm with towels. Air or tumble dry low. No fabric softener — it reduces absorbency.",
  },
  {
    id: "16",
    name: "Wool Dryer Balls",
    description:
      "Set of three New Zealand wool dryer balls. Soften laundry without plastic sheets, cut drying time ~25%, and reduce static. Add a drop of essential oil if you like a light scent.",
    price: 15,
    imageUrl: "/eco-dryer.svg",
    category: "Home",
    sustainabilityScore: 90,
    affiliateCommissionPercent: 11,
    materials: "100% New Zealand wool (felted)",
    madeIn: "New Zealand / finished in USA",
    dimensions: "~7 cm diameter each · set of 3",
    careNotes:
      "Use 3 balls per load. Air out between runs. Hand wash rarely if soiled; reshape and air dry. Lasts 1000+ loads.",
  },
  {
    id: "17",
    name: "Recycled Rain Jacket",
    description:
      "Waterproof shell made from 100% ocean-bound recycled plastic. Packable hood, taped seams, and a quiet matte finish. Cut for commuting and trail days without the bulk of a winter parka.",
    price: 78,
    imageUrl: "/eco-jacket.svg",
    category: "Apparel",
    sustainabilityScore: 84,
    affiliateCommissionPercent: 14,
    materials:
      "100% recycled ocean-bound PET shell, PFC-free DWR, recycled mesh lining",
    madeIn: "Vietnam",
    sizeChart: outerwearSizeChart(),
    fitGuide:
      "Athletic through the shoulders with room to layer a midweight fleece. Sleeve length hits the wrist bone. Packs into its own chest pocket. Model 180 cm wears EU 40 (UK 12 / US 8).",
    careNotes:
      "Machine wash cold gentle; close zippers first. Line dry. Reapply PFC-free DWR after several washes if water stops beading. Do not dry-clean or iron hot.",
  },
  {
    id: "18",
    name: "Glass Storage Jars",
    description:
      "Set of four borosilicate jars with bamboo lids and silicone seals. Stackable for pantry grains, leftovers, or desk snacks. Clear walls make inventory easy — no mystery containers.",
    price: 29,
    imageUrl: "/eco-jars.svg",
    category: "Kitchen",
    sustainabilityScore: 92,
    affiliateCommissionPercent: 9,
    materials: "Borosilicate glass, bamboo lid, food-grade silicone gasket",
    madeIn: "China",
    dimensions: "2 × 500 ml + 2 × 750 ml · lids ~9–10 cm diameter",
    careNotes:
      "Glass is dishwasher safe; hand-wash bamboo lids to prevent warping. Not for oven or microwave with lid on. Replace gasket if seal loosens.",
  },
  {
    id: "s1",
    name: "Green Business Legal Clinic",
    description:
      "60-minute consult with a sustainability-focused attorney for sole traders and small eco brands. Cover formation, contracts, or green claims compliance. Remote session with written follow-up notes.",
    price: 120,
    imageUrl: "/eco-notebook.svg",
    category: "Legal",
    sustainabilityScore: 88,
    affiliateCommissionPercent: 10,
    listingType: "service",
    duration: "60 min",
    deliveryMode: "remote",
    availabilityNote: "Weekday mornings · book up to 2 weeks ahead",
    materials: "Written summary + template checklist included",
    madeIn: "Serves US (remote)",
  },
  {
    id: "s2",
    name: "Circular Supply Consulting",
    description:
      "Half-day workshop-style consulting for teams redesigning packaging or supplier maps. Leaves you with a prioritized action plan and intro intros to regenerative vendors.",
    price: 280,
    imageUrl: "/eco-cleaner.svg",
    category: "Consulting",
    sustainabilityScore: 91,
    affiliateCommissionPercent: 12,
    listingType: "service",
    duration: "Half day (3 hrs)",
    deliveryMode: "hybrid",
    availabilityNote: "Hybrid · studio in Portland or Zoom",
    materials: "Slide deck + supplier shortlist PDF",
    madeIn: "Portland, OR / remote",
  },
  {
    id: "s3",
    name: "Zero-Waste Kitchen Workshop",
    description:
      "Hands-on 2-hour workshop for households: jar systems, food wraps, and shopping routines that stick. Small groups, take-home starter kit of samples from partner makers.",
    price: 45,
    imageUrl: "/eco-wraps.svg",
    category: "Workshops",
    sustainabilityScore: 94,
    affiliateCommissionPercent: 8,
    listingType: "service",
    duration: "2 hours",
    deliveryMode: "in_person",
    availabilityNote: "Saturdays · Alberta makers market kitchen",
    materials: "Sample wrap + shopping list handout",
    madeIn: "Portland, OR",
  },
  {
    id: "s4",
    name: "Gear Repair & Upcycle Hour",
    description:
      "Bring a backpack, jacket, or tote — we’ll mend seams, replace zippers where possible, or redesign a worn piece. Keeps gear out of landfill and teaches a repair trick to take home.",
    price: 55,
    imageUrl: "/eco-backpack.svg",
    category: "Repair & Upcycling",
    sustainabilityScore: 96,
    affiliateCommissionPercent: 9,
    listingType: "service",
    duration: "60 min",
    deliveryMode: "in_person",
    availabilityNote: "By appointment · San Diego studio",
    materials: "Thread, patches, and basic hardware included",
    madeIn: "San Diego, CA",
  },
];

export const MARKETPLACE_CATEGORIES = Array.from(
  new Set(MARKETPLACE_PRODUCTS.map((p) => p.category))
).sort();

export const MARKETPLACE_SERVICES = MARKETPLACE_PRODUCTS.filter(
  (p) => p.listingType === "service"
);

export const MARKETPLACE_GOODS = MARKETPLACE_PRODUCTS.filter(
  (p) => p.listingType !== "service"
);
