import type { FlagHit } from "@/types/moderation";

export type ListingInput = {
  name: string;
  subtitle?: string;
  description?: string;
  category?: string;
  tags?: string[];
  price: number;
  ecoScore: number;
};

const ECO_KEYWORDS = [
  "organic",
  "bamboo",
  "recycled",
  "compostable",
  "biodegradable",
  "refill",
  "zero waste",
  "sustainable",
  "eco",
  "hemp",
  "fsc",
  "fair trade",
  "plastic-free",
  "plant-based",
];

const SUSPICIOUS_WORDS = [
  "counterfeit",
  "replica",
  "fake eco",
  "guaranteed ranking",
  "miracle",
  "100% natural guaranteed scam",
];

const CLICKBAIT = ["!!!", "buy now!!!", "limited!!!", "act fast"];

/**
 * Rule-based “AI-like” listing scanner.
 * Pure function — easy to swap for a real model later.
 */
export function evaluateListing(listing: ListingInput): FlagHit[] {
  const hits: FlagHit[] = [];
  const text = [
    listing.name,
    listing.subtitle ?? "",
    listing.description ?? "",
    ...(listing.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (listing.ecoScore < 50) {
    hits.push({
      ruleId: "low_eco_score",
      severity: "block",
      message: `Eco score ${listing.ecoScore} is below the 50 minimum.`,
    });
  } else if (listing.ecoScore < 65) {
    hits.push({
      ruleId: "low_eco_score",
      severity: "high",
      message: `Eco score ${listing.ecoScore} looks weak for Forest Buddies.`,
    });
  }

  if (listing.ecoScore >= 95) {
    const hasEcoLanguage = ECO_KEYWORDS.some((k) => text.includes(k));
    if (!hasEcoLanguage) {
      hits.push({
        ruleId: "greenwashing_risk",
        severity: "warn",
        message:
          "Very high eco score without sustainability keywords — possible greenwashing.",
      });
    }
  }

  if (listing.price <= 0) {
    hits.push({
      ruleId: "invalid_price",
      severity: "block",
      message: "Price must be greater than zero.",
    });
  } else if (listing.price < 2) {
    hits.push({
      ruleId: "suspicious_price",
      severity: "high",
      message: `Unusually low price ($${listing.price}).`,
    });
  } else if (listing.price > 2500) {
    hits.push({
      ruleId: "suspicious_price",
      severity: "warn",
      message: `Unusually high price ($${listing.price}).`,
    });
  }

  const name = listing.name.trim();
  if (name.length < 3) {
    hits.push({
      ruleId: "weak_title",
      severity: "high",
      message: "Title is too short.",
    });
  }

  const capsRatio =
    name.length === 0
      ? 0
      : name.replace(/[^A-Z]/g, "").length / Math.max(1, name.replace(/[^A-Za-z]/g, "").length);
  if (capsRatio > 0.7 && name.replace(/[^A-Za-z]/g, "").length >= 6) {
    hits.push({
      ruleId: "spam_title",
      severity: "warn",
      message: "Title is mostly ALL CAPS — often spammy.",
    });
  }

  if (/(.)\1{4,}/.test(name.toLowerCase())) {
    hits.push({
      ruleId: "spam_title",
      severity: "high",
      message: "Title has repeated characters.",
    });
  }

  for (const word of SUSPICIOUS_WORDS) {
    if (text.includes(word)) {
      hits.push({
        ruleId: "banned_content",
        severity: "block",
        message: `Suspicious phrase detected: “${word}”.`,
      });
      break;
    }
  }

  for (const bait of CLICKBAIT) {
    if (text.includes(bait)) {
      hits.push({
        ruleId: "clickbait",
        severity: "warn",
        message: "Clickbait-style language detected.",
      });
      break;
    }
  }

  const desc = (listing.description ?? "").trim();
  if (desc.length > 0 && desc.length < 20) {
    hits.push({
      ruleId: "thin_description",
      severity: "info",
      message: "Description is very short — harder for shoppers to trust.",
    });
  }

  if (!desc) {
    hits.push({
      ruleId: "missing_description",
      severity: "warn",
      message: "Missing product description.",
    });
  }

  return hits;
}
