import type {
  ProductApprovalStatus,
  SellerAnalytics,
  SellerPayout,
  SellerProduct,
  SellerProfile,
  SellerStatus,
} from "@/types";
import {
  computeTrustMetrics,
  countOpenReportsForSeller,
  deriveTrustTier,
} from "@/lib/moderation";

export const SELLERS_STORAGE_KEY = "forest-buddies-sellers";

export function slugifyShopName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "eco-shop";
}

/** Ensure unique slug across all sellers (except optional uid). */
export function uniqueShopSlug(
  shopName: string,
  all: Record<string, SellerProfile>,
  exceptUid?: string
): string {
  const base = slugifyShopName(shopName);
  let slug = base;
  let n = 2;
  const taken = (s: string) =>
    Object.values(all).some(
      (seller) => seller.uid !== exceptUid && (seller.slug || slugifyShopName(seller.shopName)) === s
    );
  while (taken(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export function defaultEarnings() {
  return {
    total: 1284.5,
    pending: 216.0,
    available: 168.25,
    thisMonth: 342.75,
    orders: 47,
    breakdown: defaultEarningsBreakdown(),
  };
}

export function defaultEarningsBreakdown() {
  const productSales = 403.24;
  const platformFee = Number((productSales * 0.15).toFixed(2));
  const causeContribution = 12.5;
  const sellerShare = Number(
    (productSales - platformFee - causeContribution).toFixed(2)
  );
  return {
    productSales,
    platformFee,
    sellerShare,
    causeContribution,
    byCategory: [
      { category: "Kitchen", amount: 148.2 },
      { category: "Beauty", amount: 96.4 },
      { category: "Home", amount: 84.1 },
      { category: "Accessories", amount: 74.54 },
    ],
  };
}

export function defaultSellerImpact() {
  return [
    { causeId: "trees", unitsSupported: 120, label: "Trees funded via sales" },
    { causeId: "ocean", unitsSupported: 40, label: "Ocean kits supported" },
    {
      causeId: "education",
      unitsSupported: 25,
      label: "Eco lesson packs gifted",
    },
  ];
}

export function defaultAnalytics(): SellerAnalytics {
  return {
    views: 3840,
    viewsThisMonth: 912,
    sales: 47,
    salesThisMonth: 14,
    conversionRate: 1.2,
  };
}

export function defaultPayouts(): SellerPayout[] {
  const next = new Date();
  next.setDate(next.getDate() + 14);
  return [
    {
      id: "po-next",
      amount: 216.0,
      status: "scheduled",
      method: "Bank transfer ····4821",
      scheduledFor: next.toISOString().slice(0, 10),
    },
    {
      id: "po-prev-1",
      amount: 312.4,
      status: "paid",
      method: "Bank transfer ····4821",
      scheduledFor: "2026-06-30",
      paidAt: "2026-06-30",
    },
    {
      id: "po-prev-2",
      amount: 198.15,
      status: "paid",
      method: "Bank transfer ····4821",
      scheduledFor: "2026-05-31",
      paidAt: "2026-05-31",
    },
  ];
}

export function seedProductMetrics(product: {
  name: string;
  price: number;
}): Pick<SellerProduct, "views" | "sales"> {
  const hash = product.name.split("").reduce((n, c) => n + c.charCodeAt(0), 0);
  return {
    views: 40 + (hash % 220),
    sales: Math.max(0, Math.floor((hash % 17) / 3)),
  };
}

export function loadAllSellers(): Record<string, SellerProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SELLERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SellerProfile>) : {};
  } catch {
    return {};
  }
}

export function saveAllSellers(data: Record<string, SellerProfile>) {
  try {
    localStorage.setItem(SELLERS_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("forest-buddies-sellers-updated"));
  } catch {
    // ignore quota errors
  }
}

export function normalizeProduct(p: SellerProduct): SellerProduct {
  const status: ProductApprovalStatus = p.status ?? "pending";
  const metrics =
    p.views != null && p.sales != null
      ? { views: p.views, sales: p.sales }
      : seedProductMetrics(p);

  return {
    ...p,
    listingType: p.listingType === "service" ? "service" : "product",
    subtitle: p.subtitle ?? "",
    tags: Array.isArray(p.tags) ? p.tags : [],
    status,
    views: metrics.views,
    sales: metrics.sales,
    imageUrl: p.imageUrl,
    gallery: Array.isArray(p.gallery) ? p.gallery : undefined,
    materials: p.materials,
    madeIn: p.madeIn,
    careNotes: p.careNotes,
    fitGuide: p.fitGuide,
    dimensions: p.dimensions,
    sizeChart: p.sizeChart,
    duration: p.duration,
    deliveryMode: p.deliveryMode,
    availabilityNote: p.availabilityNote,
    storySnippet: p.storySnippet,
    impactNote: p.impactNote,
  };
}

export function normalizeSeller(profile: SellerProfile): SellerProfile {
  const earnings = {
    ...defaultEarnings(),
    ...profile.earnings,
    available:
      profile.earnings?.available ??
      Math.max(0, (profile.earnings?.pending ?? 216) * 0.78),
  };

  const products = (profile.products ?? []).map(normalizeProduct);
  const openReports = countOpenReportsForSeller(profile.uid);
  const metrics = computeTrustMetrics({ products }, openReports);
  const trustTier = deriveTrustTier(metrics, profile.trustOverride ?? null);

  return {
    ...profile,
    sellerType: profile.sellerType === "individual" ? "individual" : "business",
    products,
    slug: profile.slug || slugifyShopName(profile.shopName),
    bio: profile.bio ?? "",
    story: profile.story ?? "",
    tradingName: profile.tradingName,
    servicesOffered: profile.servicesOffered,
    professionalBackground: profile.professionalBackground,
    companyName: profile.companyName,
    coverImageUrl: profile.coverImageUrl,
    location: profile.location,
    founderNote: profile.founderNote,
    impactStory: profile.impactStory,
    impact:
      profile.impact && profile.impact.length > 0
        ? profile.impact
        : defaultSellerImpact(),
    earnings: {
      ...earnings,
      breakdown: earnings.breakdown ?? defaultEarningsBreakdown(),
    },
    analytics: { ...defaultAnalytics(), ...profile.analytics },
    payouts:
      profile.payouts && profile.payouts.length > 0
        ? profile.payouts
        : defaultPayouts(),
    payoutMethod: profile.payoutMethod ?? "Bank transfer ····4821",
    trustTier,
  };
}

export function getSellerBySlug(slug: string): SellerProfile | null {
  ensureDemoShops();
  const needle = slug.toLowerCase();
  return (
    listAllSellers().find(
      (s) => (s.slug || slugifyShopName(s.shopName)) === needle
    ) ?? null
  );
}

export function listPublicShops(): SellerProfile[] {
  ensureDemoShops();
  return listAllSellers().filter(isSellerPubliclyVisible);
}

/** Registered brands / studios — for the Eco brands strip. */
export function listPublicBrandShops(): SellerProfile[] {
  return listPublicShops().filter((s) => s.sellerType !== "individual");
}

/** Self-employed / solo makers — for Featured Solo Makers. */
export function listPublicSoloShops(): SellerProfile[] {
  return listPublicShops().filter((s) => s.sellerType === "individual");
}

/** Public shop + listings only when actively approved (not paused/canceled). */
export function isSellerPubliclyVisible(seller: SellerProfile): boolean {
  return seller.status === "approved";
}

/**
 * Pause selling: hide shop & listings, keep all product/earnings data.
 * Resume restores approved without re-application.
 */
export function pauseSellerAccount(uid: string): SellerProfile | null {
  return updateSellerInStore(uid, (seller) => {
    if (seller.status !== "approved" && seller.status !== "paused") {
      return seller;
    }
    return {
      ...seller,
      status: "paused",
      pausedAt: new Date().toISOString(),
    };
  });
}

/** Resume a paused shop — back to approved, listings public again. */
export function resumeSellerAccount(uid: string): SellerProfile | null {
  return updateSellerInStore(uid, (seller) => {
    if (seller.status !== "paused") return seller;
    return {
      ...seller,
      status: "approved",
      pausedAt: undefined,
      approvedAt: seller.approvedAt ?? new Date().toISOString(),
    };
  });
}

/**
 * Cancel seller status: leave the program, keep data for re-apply.
 * Shop and listings stay hidden until a new application is approved.
 */
export function cancelSellerAccount(uid: string): SellerProfile | null {
  return updateSellerInStore(uid, (seller) => ({
    ...seller,
    status: "none",
    canceledAt: new Date().toISOString(),
    pausedAt: undefined,
    approvedAt: undefined,
  }));
}

/** Seed / refresh demo shops with Etsy-style storytelling & photos. */
export function ensureDemoShops() {
  if (typeof window === "undefined") return;
  const all = loadAllSellers();
  const demos = buildDemoShops();
  let changed = false;

  for (const demo of demos) {
    const existing = all[demo.uid];
    const needsRefresh =
      !existing ||
      !existing.coverImageUrl ||
      !existing.impactStory ||
      (existing.products?.length ?? 0) < demo.products.length ||
      existing.products.some((p) => !p.imageUrl || !p.storySnippet) ||
      !existing.products.every((p, i) => {
        const d = demo.products[i];
        if (!d) return true;
        return (
          (!d.sizeChart || !!p.sizeChart) &&
          (!d.fitGuide || p.fitGuide != null) &&
          (!d.dimensions || p.dimensions != null) &&
          (!d.careNotes || p.careNotes != null) &&
          (!d.listingType || p.listingType === d.listingType) &&
          (!d.duration || p.duration != null)
        );
      }) ||
      (demo.sellerType === "individual" &&
        (existing.sellerType !== "individual" ||
          !existing.tradingName ||
          !existing.servicesOffered));
    // Always refresh demo catalog so storytelling upgrades ship to returning visitors
    if (needsRefresh) {
      all[demo.uid] = {
        ...demo,
        // Preserve any admin trust overrides if present
        trustOverride: existing?.trustOverride ?? demo.trustOverride,
      };
      changed = true;
    }
  }

  if (changed) saveAllSellers(all);
}

function buildDemoShops(): SellerProfile[] {
  return [
    {
      uid: "demo-green-grove",
      email: "hello@greengrove.eco",
      shopName: "Green Grove Goods",
      slug: "green-grove",
      sellerType: "business",
      bio: "Kitchen & home staples grown from regenerative farms — made slowly, packed lightly, meant to last.",
      location: "Portland, Oregon",
      founderNote:
        "Founded by Maya & Jordan after a year of cooking with only refillables.",
      coverImageUrl: "/shop/cover-grove.svg",
      story:
        "We started Green Grove after a zero-waste challenge left us hunting for tools that felt as good as they looked.\n\nEvery listing is vetted for materials, packaging, and labor practices. We photograph pieces in natural light, write the full origin story, and keep packaging plastic-free.\n\nA slice of each sale plants trees — so your salad servers do more than dress a bowl.",
      impactStory:
        "When you bring home a Green Grove piece, part of what you pay funds verified tree planting and climate education kits. We publish the running total on this shop so the impact stays visible — not buried in fine print.",
      impact: [
        {
          causeId: "trees",
          unitsSupported: 320,
          label: "Trees funded via sales",
        },
        {
          causeId: "climate",
          unitsSupported: 48,
          label: "Climate kits backed",
        },
      ],
      status: "approved",
      approvedAt: "2026-01-12T00:00:00.000Z",
      products: [
        {
          id: "demo-gg-1",
          name: "Compostable Sponge Pack",
          subtitle: "Plant-fiber scrubbers for everyday dishes",
          description:
            "A set of six plant-fiber sponges that scrub like conventional foam — then compost at end of life. Soft on ceramic, tough on cast iron, dyed with mineral pigments. Each sponge is roughly the size of a standard kitchen scrubber so your existing holders still fit.",
          category: "Kitchen",
          tags: ["compostable", "kitchen", "zero-waste"],
          price: 12,
          ecoScore: 96,
          stock: 40,
          imageUrl: "/shop/sponge.svg",
          gallery: ["/shop/sponge.svg", "/shop/linen.svg", "/shop/servers.svg"],
          materials: "Plant cellulose, natural loofah blend, cotton stitching",
          madeIn: "Oregon, USA",
          dimensions: "Each sponge ~10 × 7 × 3 cm · pack of 6",
          fitGuide:
            "Standard sink-caddy size. Soft side for glassware; coarser face for cast iron and sheet pans.",
          careNotes:
            "Rinse and squeeze dry after each use; stand upright so air can circulate. Compost when worn thin — do not put synthetic scrub pads in compost.",
          storySnippet:
            "We switched after realizing kitchen sponges were the last plastic holdout in our sink.",
          impactNote: "Each pack helps fund roughly one tree through our sales pool.",
          status: "approved",
          reviewedAt: "2026-01-12T00:00:00.000Z",
          autoApproved: true,
          views: 420,
          sales: 38,
          createdAt: "2026-01-10T00:00:00.000Z",
        },
        {
          id: "demo-gg-2",
          name: "Olivewood Salad Servers",
          subtitle: "Hand-carved pair with living grain",
          description:
            "Sustainably harvested olivewood, shaped by a small cooperative and finished with food-safe oil. No two pairs share the same grain — each feels like a keepsake from the grove. Length suits family salad bowls and large serving platters.",
          category: "Kitchen",
          tags: ["wood", "handmade", "heirloom"],
          price: 34,
          ecoScore: 91,
          stock: 18,
          imageUrl: "/shop/servers.svg",
          gallery: ["/shop/servers.svg", "/shop/linen.svg", "/shop/sponge.svg"],
          materials: "Olivewood, beeswax & mineral oil finish",
          madeIn: "Andalusia, Spain",
          dimensions: "Each server ~30 cm long · pair weight ~180 g",
          fitGuide:
            "Designed for bowls 24–36 cm wide. Comfortable for most adult grips; not a toddler utensil.",
          careNotes:
            "Hand wash only with mild soap; dry immediately. Refresh with food-safe mineral oil monthly. Never soak or dishwasher — wood can crack.",
          storySnippet:
            "Carved from pruned orchard wood that would otherwise become scrap.",
          impactNote:
            "A portion of every pair supports climate kits for classrooms.",
          status: "approved",
          reviewedAt: "2026-02-01T00:00:00.000Z",
          views: 210,
          sales: 12,
          createdAt: "2026-02-01T00:00:00.000Z",
        },
        {
          id: "demo-gg-3",
          name: "Stonewashed Linen Napkins",
          subtitle: "Set of four, softened by the sea air",
          description:
            "European flax linen stonewashed for that lived-in drape. Undyed, OEKO-TEX certified, and designed to look better after every wash. Generous dinner size that drapes over the lap without sliding off.",
          category: "Home",
          tags: ["linen", "table", "natural"],
          price: 42,
          ecoScore: 93,
          stock: 24,
          imageUrl: "/shop/linen.svg",
          gallery: ["/shop/linen.svg", "/shop/servers.svg", "/shop/sponge.svg"],
          materials: "100% European flax linen",
          madeIn: "Baltic region",
          dimensions: "45 × 45 cm each · set of 4 · ~200 gsm",
          sizeChart: {
            rows: [
              { eu: "45×45", uk: "18×18\"", us: "18×18\"" },
            ],
            note: "Dinner napkin size — not cocktail (smaller) or banquet (larger).",
          },
          fitGuide:
            "Standard adult dinner napkin. Softens and relaxes ~3–5% after the first few washes; pre-washed so shrinkage is minimal.",
          careNotes:
            "Machine wash cold with like colors. Line dry for softest hand-feel, or tumble low. Warm iron while slightly damp for a crisp look — or skip ironing for the lived-in drape.",
          storySnippet:
            "We wanted napkins that feel like Sunday lunch at a farmhouse table.",
          impactNote: "Table linens that replace disposables — and fund trees.",
          status: "approved",
          reviewedAt: "2026-03-01T00:00:00.000Z",
          views: 156,
          sales: 9,
          createdAt: "2026-02-28T00:00:00.000Z",
        },
      ],
      earnings: defaultEarnings(),
      analytics: defaultAnalytics(),
      payouts: defaultPayouts(),
    },
    {
      uid: "demo-tide-line",
      email: "crew@tideline.eco",
      shopName: "Tide Line Collective",
      slug: "tide-line",
      sellerType: "business",
      bio: "Ocean-bound plastic remade into everyday gear — photographed on the same shores we help clean.",
      location: "San Diego, California",
      founderNote: "Built with coastal cleanup crews who know every tide line by name.",
      coverImageUrl: "/shop/cover-tide.svg",
      story:
        "Tide Line began on weekend cleanups where fishing nets outnumbered shells.\n\nWe partner with crews who recover ocean-bound plastic, then remold it into bottles, totes, and trail kit. Each product page shows the shoreline that inspired it.\n\nYour order funds ocean restoration kits — so the next tide leaves less behind.",
      impactStory:
        "We don’t hide the numbers. Ocean kits and wildlife care packs grow with every confirmed sale. Click through a listing to see how that specific piece contributes.",
      impact: [
        { causeId: "ocean", unitsSupported: 180, label: "Ocean kits funded" },
        {
          causeId: "animals",
          unitsSupported: 22,
          label: "Wildlife care packs",
        },
      ],
      status: "approved",
      approvedAt: "2026-03-04T00:00:00.000Z",
      products: [
        {
          id: "demo-tl-1",
          name: "Ocean Plastic Bottle",
          subtitle: "750ml daily carry with insulated walls",
          description:
            "Insulated bottle molded from ocean-bound plastic recovered along the Pacific. Keeps water cold on trail days and looks like sea glass in morning light. Narrow sip mouth with a wide fill opening under the lid.",
          category: "Accessories",
          tags: ["ocean", "reuse", "insulated"],
          price: 26,
          ecoScore: 94,
          stock: 55,
          imageUrl: "/shop/bottle.svg",
          gallery: ["/shop/bottle.svg", "/shop/tote.svg", "/shop/pouch.svg"],
          materials: "Ocean-bound recycled PET, stainless liner",
          madeIn: "California, USA",
          dimensions: "750 ml · ~25 cm tall × 7.5 cm diameter · cup-holder friendly",
          fitGuide:
            "Fits most car cup holders and backpack side pockets. Not for carbonated drinks under pressure.",
          careNotes:
            "Hand wash preferred to protect the insulation seal. Lid top-rack dishwasher safe. Avoid freezing when full.",
          storySnippet:
            "Each bottle starts as plastic pulled from the same beaches we hike.",
          impactNote: "Helps fund ocean cleanup kits with every confirmed sale.",
          status: "approved",
          reviewedAt: "2026-03-04T00:00:00.000Z",
          views: 610,
          sales: 71,
          createdAt: "2026-03-02T00:00:00.000Z",
        },
        {
          id: "demo-tl-2",
          name: "Shoreline Tote",
          subtitle: "Recycled weave, market-day sized",
          description:
            "A roomy tote spun from recovered fishing nets. Soft enough for produce, strong enough for library hauls, with a story tag stitched inside. Long straps sit comfortably on the shoulder when the bag is full.",
          category: "Accessories",
          tags: ["tote", "recycled", "nets"],
          price: 38,
          ecoScore: 89,
          stock: 22,
          imageUrl: "/shop/tote.svg",
          gallery: ["/shop/tote.svg", "/shop/bottle.svg", "/shop/pouch.svg"],
          materials: "Recovered nylon fishing nets, organic cotton lining",
          madeIn: "Portugal",
          dimensions: "40 × 35 × 12 cm · strap drop 28 cm · holds ~15 L",
          fitGuide:
            "One size. Market-day capacity — fits a folded sweater plus groceries. Straps sit mid-shoulder on most adults.",
          careNotes:
            "Spot clean or gentle cold wash inside-out. Air dry flat. Avoid high heat and tumble dry — nylon can warp.",
          storySnippet:
            "Woven from nets that once drifted just beyond the kelp line.",
          impactNote: "Supports wildlife care packs for coastal rehab centers.",
          status: "approved",
          reviewedAt: "2026-03-20T00:00:00.000Z",
          views: 188,
          sales: 19,
          createdAt: "2026-03-18T00:00:00.000Z",
        },
        {
          id: "demo-tl-3",
          name: "Drift Pouch",
          subtitle: "Zippered carry for keys, cards, SPF",
          description:
            "A small waterproof-ish pouch for pocket overflow. Remade plastic shell, ocean-tone zipper pull, sized for dusk walks on the jetty. Fits keys, cards, SPF stick, and earbuds without bulk.",
          category: "Accessories",
          tags: ["pouch", "travel", "recycled"],
          price: 18,
          ecoScore: 90,
          stock: 40,
          imageUrl: "/shop/pouch.svg",
          gallery: ["/shop/pouch.svg", "/shop/tote.svg", "/shop/bottle.svg"],
          materials: "Recycled ocean plastic shell, YKK zipper",
          madeIn: "California, USA",
          dimensions: "14 × 9 × 3 cm · zipper opening ~12 cm",
          fitGuide:
            "Palm-sized. Slips into jacket pockets and tote side pockets. Not a wallet replacement for thick card stacks.",
          careNotes:
            "Wipe clean with a damp cloth. Avoid high heat and solvents. Do not machine wash.",
          storySnippet: "Designed for the bits that always escape your pockets.",
          impactNote: "Tiny pouch, real ocean kit funding behind it.",
          status: "approved",
          reviewedAt: "2026-04-02T00:00:00.000Z",
          views: 240,
          sales: 33,
          createdAt: "2026-04-01T00:00:00.000Z",
        },
      ],
      earnings: defaultEarnings(),
      analytics: defaultAnalytics(),
      payouts: defaultPayouts(),
    },
    {
      uid: "demo-leaf-counsel",
      email: "hello@leafcounsel.eco",
      shopName: "Leaf Counsel",
      slug: "leaf-counsel",
      sellerType: "individual",
      tradingName: "Leaf Counsel",
      servicesOffered: "Legal, Consulting, Workshops",
      professionalBackground:
        "Former big-firm sustainability counsel · now a one-person practice for eco founders",
      bio: "Self-employed sustainability lawyer and workshop host — practical help for solo eco founders.",
      location: "Austin, TX",
      founderNote: "One-person practice. Booked by the hour, not by the billable army.",
      coverImageUrl: "/shop/cover-grove.svg",
      story:
        "I left big-firm hours to help makers and consultants stay compliant without greenwashing.\n\nForest Buddies lets me list legal clinics, consulting blocks, and community workshops side by side — the way a self-employed practice actually works.",
      impactStory:
        "A slice of every booked session funds climate education kits so the next generation can argue for the planet with better tools.",
      impact: [
        {
          causeId: "education",
          unitsSupported: 40,
          label: "Lesson packs funded",
        },
        {
          causeId: "climate",
          unitsSupported: 18,
          label: "Climate kits backed",
        },
      ],
      status: "approved",
      approvedAt: "2026-05-01T00:00:00.000Z",
      products: [
        {
          id: "demo-lc-1",
          listingType: "service",
          name: "Solo Founder Legal Hour",
          subtitle: "Contracts, claims & formation for eco solos",
          description:
            "Private 60-minute remote session for self-employed makers and consultants. Bring your questions on contracts, green claims, or entity basics — leave with clear next steps and a short written summary.",
          category: "Legal",
          tags: ["legal", "solo", "remote"],
          price: 110,
          ecoScore: 90,
          stock: 8,
          imageUrl: "/shop/linen.svg",
          gallery: ["/shop/linen.svg", "/shop/servers.svg"],
          materials: "Written summary + checklist PDF",
          madeIn: "Austin, TX (remote nationwide)",
          duration: "60 min",
          deliveryMode: "remote",
          availabilityNote: "Tue–Thu mornings · confirm within 24h",
          storySnippet:
            "Built for freelancers who can’t afford a retainer but still need real answers.",
          impactNote: "Part of each hour funds climate lesson packs.",
          status: "approved",
          reviewedAt: "2026-05-01T00:00:00.000Z",
          views: 96,
          sales: 14,
          createdAt: "2026-04-28T00:00:00.000Z",
        },
        {
          id: "demo-lc-2",
          listingType: "service",
          name: "Impact Messaging Workshop",
          subtitle: "Say what’s true — without greenwash",
          description:
            "2-hour small-group workshop on honest eco messaging. Practice claims language, review sample labels, and map what evidence you actually have. Hybrid seats available.",
          category: "Workshops",
          tags: ["workshop", "marketing", "compliance"],
          price: 65,
          ecoScore: 92,
          stock: 12,
          imageUrl: "/shop/sponge.svg",
          gallery: ["/shop/sponge.svg", "/shop/linen.svg"],
          materials: "Workbook + claims do/don’t sheet",
          madeIn: "Austin studio / Zoom",
          duration: "2 hours",
          deliveryMode: "hybrid",
          availabilityNote: "Monthly · max 10 seats",
          storySnippet: "Because “eco-friendly” on a label is not a strategy.",
          impactNote: "Seats help fund education kits for local classrooms.",
          status: "approved",
          reviewedAt: "2026-05-10T00:00:00.000Z",
          views: 72,
          sales: 9,
          createdAt: "2026-05-08T00:00:00.000Z",
        },
        {
          id: "demo-lc-3",
          listingType: "service",
          name: "Supply Chain Consulting Block",
          subtitle: "Half-day map of your next greener vendors",
          description:
            "Working session for self-employed brands ready to upgrade packaging or suppliers. We map risks, shortlist regenerative options, and leave you with a 30-day action list.",
          category: "Consulting",
          tags: ["consulting", "supply-chain", "packaging"],
          price: 240,
          ecoScore: 89,
          stock: 4,
          imageUrl: "/shop/servers.svg",
          gallery: ["/shop/servers.svg", "/shop/bottle.svg"],
          materials: "Action plan PDF + intro list",
          madeIn: "Remote or Austin",
          duration: "Half day (3 hrs)",
          deliveryMode: "hybrid",
          availabilityNote: "Limited slots · book 1 week ahead",
          storySnippet: "For operators who wear every hat — including procurement.",
          impactNote: "Consulting hours also plant climate kit funding.",
          status: "approved",
          reviewedAt: "2026-05-12T00:00:00.000Z",
          views: 54,
          sales: 5,
          createdAt: "2026-05-11T00:00:00.000Z",
        },
      ],
      earnings: defaultEarnings(),
      analytics: defaultAnalytics(),
      payouts: defaultPayouts(),
    },
    {
      uid: "demo-stitch-salvage",
      email: "hello@stitchsalvage.eco",
      shopName: "Stitch & Salvage",
      slug: "stitch-salvage",
      sellerType: "individual",
      tradingName: "Stitch & Salvage",
      servicesOffered: "Repair & Upcycling, Workshops",
      professionalBackground:
        "Former outdoor-gear tech · mends packs, jackets, and totes so they stay in the wild longer",
      bio: "Solo repair studio — seams, zippers, and thoughtful upcycles that keep gear out of landfill.",
      location: "San Diego, CA",
      founderNote: "Book a mend hour. Leave with a trick you can redo at home.",
      coverImageUrl: "/shop/cover-grove.svg",
      story:
        "I spent years fixing rental fleets. Now I help neighbors keep what they already own.\n\nEvery session includes a small repair lesson — because the best impact is the jacket you don’t replace.",
      impactStory:
        "Part of each mend funds climate kits so kids learn why fixing beats tossing.",
      impact: [
        {
          causeId: "climate",
          unitsSupported: 22,
          label: "Climate kits backed",
        },
      ],
      status: "approved",
      approvedAt: "2026-05-15T00:00:00.000Z",
      products: [
        {
          id: "demo-ss-1",
          listingType: "service",
          name: "Gear Mend Hour",
          subtitle: "Zippers, seams & patch work",
          description:
            "Bring a backpack, jacket, or tote. We’ll mend what’s failing and show you one repair you can repeat. Patches and basic hardware included.",
          category: "Repair & Upcycling",
          tags: ["repair", "upcycle", "gear"],
          price: 55,
          ecoScore: 96,
          stock: 10,
          imageUrl: "/shop/tote.svg",
          gallery: ["/shop/tote.svg", "/shop/pouch.svg"],
          materials: "Thread, patches, basic hardware",
          madeIn: "San Diego studio",
          duration: "60 min",
          deliveryMode: "in_person",
          availabilityNote: "By appointment · Tue–Sat",
          storySnippet: "Keep the gear that already fits your life.",
          impactNote: "Each hour funds climate lesson kits.",
          status: "approved",
          reviewedAt: "2026-05-15T00:00:00.000Z",
          views: 88,
          sales: 19,
          createdAt: "2026-05-14T00:00:00.000Z",
        },
        {
          id: "demo-ss-2",
          listingType: "service",
          name: "Visible Mending Workshop",
          subtitle: "Sashiko-inspired patch practice",
          description:
            "2-hour small-group workshop: bring a worn garment and leave with a repaired piece plus a starter kit of needles and thread.",
          category: "Workshops",
          tags: ["workshop", "mending", "textile"],
          price: 48,
          ecoScore: 94,
          stock: 8,
          imageUrl: "/shop/linen.svg",
          gallery: ["/shop/linen.svg", "/shop/pouch.svg"],
          materials: "Needle kit + contrasting thread",
          madeIn: "San Diego studio",
          duration: "2 hours",
          deliveryMode: "in_person",
          availabilityNote: "Monthly · max 8 seats",
          storySnippet: "Make the mend part of the story.",
          impactNote: "Seats help fund climate kits.",
          status: "approved",
          reviewedAt: "2026-05-16T00:00:00.000Z",
          views: 61,
          sales: 11,
          createdAt: "2026-05-15T00:00:00.000Z",
        },
      ],
      earnings: defaultEarnings(),
      analytics: defaultAnalytics(),
      payouts: defaultPayouts(),
    },
    {
      uid: "demo-bloom-path",
      email: "hello@bloompath.eco",
      shopName: "Bloom Path Wellness",
      slug: "bloom-path",
      sellerType: "individual",
      tradingName: "Bloom Path Wellness",
      servicesOffered: "Wellness, Consulting",
      professionalBackground:
        "Certified nature-based coach · burnout recovery for climate and maker workers",
      bio: "One-person wellness practice for eco founders — grounding sessions and sustainable work rhythms.",
      location: "Boulder, CO",
      founderNote: "Remote or trail-side. No corporate wellness theater.",
      coverImageUrl: "/shop/cover-grove.svg",
      story:
        "I coach people who care about the planet and keep forgetting to care for themselves.\n\nSessions blend simple nervous-system tools with practical calendar redesign — so impact work doesn’t burn you out.",
      impactStory:
        "A share of each session funds outdoor education packs for local schools.",
      impact: [
        {
          causeId: "education",
          unitsSupported: 28,
          label: "Lesson packs funded",
        },
      ],
      status: "approved",
      approvedAt: "2026-05-18T00:00:00.000Z",
      products: [
        {
          id: "demo-bp-1",
          listingType: "service",
          name: "Founder Reset Session",
          subtitle: "75-minute grounding + work redesign",
          description:
            "Private coaching for self-employed makers and climate workers. Map your energy drains, rebuild a week that fits, and leave with two practices you’ll actually keep.",
          category: "Wellness",
          tags: ["wellness", "coaching", "remote"],
          price: 95,
          ecoScore: 90,
          stock: 6,
          imageUrl: "/shop/sponge.svg",
          gallery: ["/shop/sponge.svg", "/shop/servers.svg"],
          materials: "Session notes + habit card PDF",
          madeIn: "Boulder / remote",
          duration: "75 min",
          deliveryMode: "hybrid",
          availabilityNote: "Weekday afternoons · Zoom or trail",
          storySnippet: "For people who plant trees and forget lunch.",
          impactNote: "Sessions fund outdoor lesson packs.",
          status: "approved",
          reviewedAt: "2026-05-18T00:00:00.000Z",
          views: 70,
          sales: 12,
          createdAt: "2026-05-17T00:00:00.000Z",
        },
        {
          id: "demo-bp-2",
          listingType: "service",
          name: "Team Rhythm Consulting",
          subtitle: "Half-day for small eco crews",
          description:
            "Working session for 2–6 person teams: meeting hygiene, deep-work blocks, and recovery norms that stick without corporate jargon.",
          category: "Consulting",
          tags: ["consulting", "teams", "wellbeing"],
          price: 220,
          ecoScore: 88,
          stock: 3,
          imageUrl: "/shop/bottle.svg",
          gallery: ["/shop/bottle.svg", "/shop/servers.svg"],
          materials: "Team agreement template",
          madeIn: "Remote or Boulder",
          duration: "Half day (3 hrs)",
          deliveryMode: "remote",
          availabilityNote: "Limited · book 10 days ahead",
          storySnippet: "Culture that doesn’t crash after launch week.",
          impactNote: "Consulting hours fund education kits.",
          status: "approved",
          reviewedAt: "2026-05-19T00:00:00.000Z",
          views: 42,
          sales: 4,
          createdAt: "2026-05-18T00:00:00.000Z",
        },
      ],
      earnings: defaultEarnings(),
      analytics: defaultAnalytics(),
      payouts: defaultPayouts(),
    },
    {
      uid: "demo-patch-garden",
      email: "hello@patchgarden.eco",
      shopName: "Patch Garden Co",
      slug: "patch-garden",
      sellerType: "individual",
      tradingName: "Patch Garden Co",
      servicesOffered: "Garden & Outdoor, Home Services, Workshops",
      professionalBackground:
        "Community garden educator · balcony-to-yard edible installs for renters and homeowners",
      bio: "Solo garden practice — edible installs, soil coaching, and weekend workshops for small spaces.",
      location: "Seattle, WA",
      founderNote: "No lawn guilt. Just food and habitat that fits your square footage.",
      coverImageUrl: "/shop/cover-grove.svg",
      story:
        "I help people grow something useful on porches, shared yards, and tiny plots.\n\nServices cover install days, seasonal coaching, and workshops — always sized for real city living.",
      impactStory:
        "Bookings help fund school garden toolkits across the city.",
      impact: [
        {
          causeId: "trees",
          unitsSupported: 45,
          label: "Trees & habitat funded",
        },
        {
          causeId: "education",
          unitsSupported: 16,
          label: "Garden kits for schools",
        },
      ],
      status: "approved",
      approvedAt: "2026-05-20T00:00:00.000Z",
      products: [
        {
          id: "demo-pg-1",
          listingType: "service",
          name: "Balcony Edible Install",
          subtitle: "Half-day planter setup",
          description:
            "In-person visit: soil, containers, and a starter plant plan sized to sun and wind. You get a watering schedule and seasonal swap list.",
          category: "Garden & Outdoor",
          tags: ["garden", "balcony", "edible"],
          price: 160,
          ecoScore: 93,
          stock: 5,
          imageUrl: "/shop/servers.svg",
          gallery: ["/shop/servers.svg", "/shop/bottle.svg"],
          materials: "Soil mix guidance · plants extra if needed",
          madeIn: "Greater Seattle",
          duration: "Half day (3 hrs)",
          deliveryMode: "in_person",
          availabilityNote: "Weekends · weather permitting",
          storySnippet: "Herbs and salad greens without a backyard.",
          impactNote: "Installs fund school garden kits.",
          status: "approved",
          reviewedAt: "2026-05-20T00:00:00.000Z",
          views: 77,
          sales: 8,
          createdAt: "2026-05-19T00:00:00.000Z",
        },
        {
          id: "demo-pg-2",
          listingType: "service",
          name: "Home Compost Tune-Up",
          subtitle: "Kitchen-to-bin troubleshooting",
          description:
            "90-minute home visit for compost smell, pests, or stalled piles. We fix the mix and leave you a simple weekly routine.",
          category: "Home Services",
          tags: ["home", "compost", "visit"],
          price: 75,
          ecoScore: 95,
          stock: 7,
          imageUrl: "/shop/sponge.svg",
          gallery: ["/shop/sponge.svg", "/shop/servers.svg"],
          materials: "Printed mix chart",
          madeIn: "Seattle homes",
          duration: "90 min",
          deliveryMode: "in_person",
          availabilityNote: "Weekday mornings",
          storySnippet: "Because a smelly bin shouldn’t be why you quit.",
          impactNote: "Visits help fund habitat plantings.",
          status: "approved",
          reviewedAt: "2026-05-21T00:00:00.000Z",
          views: 53,
          sales: 6,
          createdAt: "2026-05-20T00:00:00.000Z",
        },
        {
          id: "demo-pg-3",
          listingType: "service",
          name: "Seed Starting Workshop",
          subtitle: "Indoor starts for short seasons",
          description:
            "2-hour workshop covering trays, light, and transplant timing. Take home a tray and a crop calendar for the Pacific Northwest.",
          category: "Workshops",
          tags: ["workshop", "seeds", "garden"],
          price: 40,
          ecoScore: 92,
          stock: 12,
          imageUrl: "/shop/linen.svg",
          gallery: ["/shop/linen.svg", "/shop/servers.svg"],
          materials: "Seed tray + starter soil",
          madeIn: "Community greenhouse",
          duration: "2 hours",
          deliveryMode: "in_person",
          availabilityNote: "Late winter / early spring",
          storySnippet: "Start strong before the last frost.",
          impactNote: "Seats fund school garden tools.",
          status: "approved",
          reviewedAt: "2026-05-22T00:00:00.000Z",
          views: 64,
          sales: 15,
          createdAt: "2026-05-21T00:00:00.000Z",
        },
      ],
      earnings: defaultEarnings(),
      analytics: defaultAnalytics(),
      payouts: defaultPayouts(),
    },
  ];
}

export function listAllSellers(): SellerProfile[] {
  return Object.values(loadAllSellers()).map(normalizeSeller);
}

export type SellerListingRow = {
  sellerUid: string;
  shopName: string;
  sellerEmail: string;
  sellerStatus: SellerStatus;
  product: SellerProduct;
};

export function listSellerListings(): SellerListingRow[] {
  return listAllSellers().flatMap((seller) =>
    seller.products.map((product) => ({
      sellerUid: seller.uid,
      shopName: seller.shopName,
      sellerEmail: seller.email,
      sellerStatus: seller.status,
      product,
    }))
  );
}

export function updateSellerInStore(
  uid: string,
  updater: (seller: SellerProfile) => SellerProfile
): SellerProfile | null {
  const all = loadAllSellers();
  const current = all[uid];
  if (!current) return null;
  const next = normalizeSeller(updater(normalizeSeller(current)));
  all[uid] = next;
  saveAllSellers(all);
  return next;
}

export function setSellerAccountStatus(
  uid: string,
  status: Extract<
    SellerStatus,
    "approved" | "rejected" | "pending" | "paused" | "none"
  >
): SellerProfile | null {
  if (status === "paused") return pauseSellerAccount(uid);
  if (status === "none") return cancelSellerAccount(uid);
  return updateSellerInStore(uid, (seller) => ({
    ...seller,
    status,
    approvedAt:
      status === "approved" ? new Date().toISOString() : seller.approvedAt,
    pausedAt: status === "approved" ? undefined : seller.pausedAt,
    canceledAt: status === "approved" ? undefined : seller.canceledAt,
  }));
}

export function setProductApproval(
  sellerUid: string,
  productId: string,
  status: ProductApprovalStatus,
  reviewNote?: string
): SellerProfile | null {
  return updateSellerInStore(sellerUid, (seller) => ({
    ...seller,
    products: seller.products.map((p) =>
      p.id === productId
        ? {
            ...p,
            status,
            reviewedAt: new Date().toISOString(),
            reviewNote: reviewNote?.trim() || undefined,
            autoApproved: false,
            ...(status === "approved" && p.views === 0
              ? seedProductMetrics(p)
              : {}),
          }
        : p
    ),
  }));
}

export function setSellerTrustOverride(
  uid: string,
  trustOverride: SellerProfile["trustOverride"]
): SellerProfile | null {
  return updateSellerInStore(uid, (seller) => ({
    ...seller,
    trustOverride: trustOverride ?? null,
  }));
}
