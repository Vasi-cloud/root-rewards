/**
 * Mock customer support agent.
 * Keep SupportReply shape stable for a future Grok API swap.
 */

export interface SupportMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

export interface SupportReply {
  text: string;
  topic: string;
  /** Suggested follow-up chips */
  suggestions: string[];
  engine: "mock" | "grok";
}

type FaqEntry = {
  topic: string;
  keywords: string[];
  answer: string;
  suggestions: string[];
};

const FAQ: FaqEntry[] = [
  {
    topic: "orders",
    keywords: [
      "order",
      "orders",
      "tracking",
      "track",
      "shipment",
      "shipping",
      "delivery",
      "when will",
      "status",
      "package",
    ],
    answer:
      "You can check order status anytime from your Dashboard after signing in. Demo orders usually show as Processing → Shipped → Delivered. Need a hand finding an order ID? It’s on your confirmation screen and in recent activity.",
    suggestions: [
      "How do returns work?",
      "What is Impact Member?",
      "How do causes work?",
    ],
  },
  {
    topic: "returns",
    keywords: [
      "return",
      "returns",
      "refund",
      "exchange",
      "wrong item",
      "damaged",
      "send back",
    ],
    answer:
      "Returns are free within 30 days for unused items in original packaging (demo). Full details and the EU / UK / US size guide live on /returns. Start from Dashboard → order details, or reply here with your order ID and we’ll walk you through it.",
    suggestions: [
      "Where is my order?",
      "What is Impact Member?",
      "How do causes work?",
    ],
  },
  {
    topic: "causes",
    keywords: [
      "cause",
      "causes",
      "trees",
      "ocean",
      "impact",
      "donation",
      "plant",
      "co2",
      "checkout",
    ],
    answer:
      "At checkout you can fund Trees, Ocean, Animals, Education, or Climate — even a few dollars converts into real units (e.g. $24 ≈ 3 trees). Your lifetime impact shows on the Dashboard. Impact Members also get a monthly cause credit.",
    suggestions: [
      "What is Impact Member?",
      "Ask Leafy for a gift idea",
      "Buy Local nearby",
    ],
  },
  {
    topic: "membership",
    keywords: [
      "member",
      "membership",
      "impact member",
      "subscribe",
      "subscription",
      "upgrade",
      "plan",
      "free tier",
      "boost",
    ],
    answer:
      "Forest Buddies has Free and Impact Member plans. Impact Member ($9/mo in the demo) adds a +25% first-party affiliate boost and an $8 monthly cause credit at checkout. Cancel anytime from your Dashboard → Membership — you keep benefits until the end of the billing period. No real card is charged in this demo.",
    suggestions: [
      "How do affiliates work?",
      "How do causes work?",
      "Where is my order?",
    ],
  },
  {
    topic: "affiliates",
    keywords: [
      "affiliate",
      "referral",
      "commission",
      "ref=",
      "earn",
      "payout",
      "amazon",
      "partner",
    ],
    answer:
      "Share your Forest Buddies link with ?ref=yourcode, or use Via Amazon / Target / REI tags on marketplace products. First-party checkouts track in your dashboard; external partners often report later (sometimes ~24h windows). Attribution lasts up to 30 days depending on partner platform.",
    suggestions: [
      "What is Impact Member?",
      "Where is my order?",
      "Share feedback",
    ],
  },
  {
    topic: "local",
    keywords: ["local", "nearby", "distance", "pickup", "buy local", "map"],
    answer:
      "Buy Local (/local) and Ask Leafy’s Find local stores show simulated shelf status (in stock, limited, pickup, out). That’s demo data — live inventory comes later. You can also open Via Amazon / Target / REI links to compare; those are partner search pages, not confirmed aisle stock.",
    suggestions: [
      "How do causes work?",
      "Ask Leafy for a gift idea",
      "Where is my order?",
    ],
  },
  {
    topic: "leafy",
    keywords: [
      "leafy",
      "recommend",
      "vision",
      "photo",
      "snap",
      "upload",
      "similar",
      "camera",
      "picture",
    ],
    answer:
      "Ask Leafy (/recommend) can take a shopping note, voice, or photo. Snap & match uses mock vision today and suggests similar products. Find local stores shows simulated availability nearby, plus Amazon / Target / REI links when you want a big-store option. Real stock feeds come later.",
    suggestions: [
      "Buy Local nearby",
      "How do returns work?",
      "Ask Leafy for a gift idea",
    ],
  },
  {
    topic: "account",
    keywords: [
      "login",
      "sign in",
      "password",
      "account",
      "register",
      "dashboard",
    ],
    answer:
      "Create a free account from Sign in / Register in the header. Once you’re in, the Dashboard shows impact, affiliate stats, and membership. Seller tools live at /seller after you apply.",
    suggestions: [
      "What is Impact Member?",
      "How do returns work?",
      "Contact a human",
    ],
  },
  {
    topic: "hello",
    keywords: ["hi", "hello", "hey", "help", "support"],
    answer:
      "Hi friend — I’m Sprout, your Forest Buddies helper. Ask me about orders, returns, causes, memberships, affiliates, or Buy Local. I’ll keep it simple and green.",
    suggestions: [
      "Where is my order?",
      "How do returns work?",
      "What is Impact Member?",
      "How do causes work?",
    ],
  },
];

const FALLBACK: SupportReply = {
  topic: "general",
  engine: "mock",
  text: "I’m still growing my knowledge grove (mock brain for now). Try asking about orders, returns, causes, memberships, or affiliates — or leave a note on /feedback and a human buddy will see it.",
  suggestions: [
    "Where is my order?",
    "How do returns work?",
    "What is Impact Member?",
    "How do causes work?",
  ],
};

export const SUPPORT_QUICK_PROMPTS = [
  "Where is my order?",
  "How do returns work?",
  "How do causes work?",
  "What is Impact Member?",
  "How do affiliates work?",
];

export const SUPPORT_OPEN_EVENT = "forest-buddies-open-support";

export function openSupportChat() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SUPPORT_OPEN_EVENT));
  }
}

export function getSupportReply(userText: string): SupportReply {
  const q = userText.toLowerCase().trim();
  if (!q) {
    return {
      ...FALLBACK,
      text: "Whenever you’re ready, ask me anything about shopping with Forest Buddies.",
    };
  }

  // Friendly human handoff
  if (
    /human|person|agent|email|call|speak to|real (person|human)/i.test(q)
  ) {
    return {
      topic: "handoff",
      engine: "mock",
      text: "Absolutely — real humans are welcome here too. Drop details on /feedback (choose “Something broken” or “Just saying hi”) and our team will review it in the admin inbox. For demo purposes, there’s no live inbox email yet.",
      suggestions: ["How do returns work?", "Where is my order?", "Share feedback"],
    };
  }

  let best: FaqEntry | null = null;
  let bestScore = 0;
  for (const entry of FAQ) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw)) score += kw.length > 4 ? 2 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (!best || bestScore === 0) return FALLBACK;

  return {
    topic: best.topic,
    engine: "mock",
    text: best.answer,
    suggestions: best.suggestions,
  };
}

export async function getSupportReplyAsync(
  userText: string,
  delayMs = 450
): Promise<SupportReply> {
  await new Promise((r) => setTimeout(r, delayMs));
  return getSupportReply(userText);
}

export function createMessage(
  role: SupportMessage["role"],
  text: string
): SupportMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}
