/**
 * Site-wide voice navigation — short, reliable commands.
 * Separate from Ask Leafy shopping voice and Kitchen recipe dictation.
 */

import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakFeedback,
  startListening,
  type SpeechRecognitionHandle,
} from "@/lib/leafy-voice";

export type VoiceNavPlace = {
  id: string;
  name: string;
  kind: "store" | "maker";
  distanceMi: number;
  distanceLabel: string;
  directionsUrl: string;
};

export type VoiceNavCommand =
  | { type: "open"; href: string; label: string }
  | { type: "find_local_stores"; focusQuery?: string }
  | { type: "nearest_distance" }
  | { type: "directions_nearest" }
  | { type: "how_far"; place: VoiceNavPlace }
  | { type: "directions_to"; place: VoiceNavPlace }
  | { type: "help" }
  | { type: "unknown"; transcript: string };

export const VOICE_NAV_HELP_LINES = [
  "Open Buy Local",
  "Open Leafy Kitchen",
  "Open Leafy Parts",
  "Open Ask Leafy",
  "Open Marketplace",
  "Open My Forest",
  "Open cart",
  "Open donate / Support a cause",
  "Find local stores",
  "Nearest store",
  "How far is the nearest store?",
  "Where is Sainsbury’s near me?",
  "Directions",
  "Directions to [store]",
  "Help / What can I say?",
] as const;

export const VOICE_NAV_HELP_SPOKEN =
  "You can say: Open Buy Local, Open Leafy Kitchen, Open Leafy Parts, Open Ask Leafy, Open Marketplace, Open My Forest, Open cart, or Open donate. Try Find local stores, Nearest store, or Where is Tesco near me. Say Help anytime.";

const KNOWN_CHAINS =
  /\b(sainsbury'?s?|tesco|waitrose|asda|aldi|lidl|whole\s*foods|boots|marks?\s*(?:and|&)\s*spencer|m\s*&\s*s|target|walmart|trader\s*joe'?s?|costco|co-?op)\b/i;

const OPEN_TARGETS: Array<{
  href: string;
  label: string;
  patterns: RegExp[];
}> = [
  {
    href: "/local",
    label: "Buy Local",
    patterns: [
      /\b(open|go to|show|take me to|navigate to)\s+(buy\s*local|local)\b/,
      /^(buy\s*local)$/,
      /^open\s+local$/,
    ],
  },
  {
    href: "/kitchen",
    label: "Leafy Kitchen",
    patterns: [
      /\b(open|go to|show|take me to|navigate to)\s+(leafy\s*)?kitchen\b/,
      /^(leafy\s*)?kitchen$/,
    ],
  },
  {
    href: "/parts",
    label: "Leafy Parts",
    patterns: [
      /\b(open|go to|show|take me to|navigate to)\s+(leafy\s*)?parts\b/,
      /^(leafy\s*)?parts$/,
    ],
  },
  {
    href: "/recommend",
    label: "Ask Leafy",
    patterns: [
      /\b(open|go to|show|take me to|navigate to)\s+(ask\s*)?leafy\b/,
      /^(ask\s*)?leafy$/,
      /\b(open|go to)\s+recommend(er)?\b/,
    ],
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    patterns: [
      /\b(open|go to|show|take me to|navigate to)\s+(the\s+)?marketplace\b/,
      /^(marketplace)$/,
    ],
  },
  {
    href: "/dashboard/my-forest",
    label: "My Forest",
    patterns: [
      /\b(open|go to|show|take me to|navigate to)\s+(my\s+)?forest\b/,
      /^(my\s+)?forest$/,
    ],
  },
  {
    href: "/cart",
    label: "Cart",
    patterns: [
      /\b(open|go to|show|take me to|navigate to)\s+(my\s+)?cart\b/,
      /^(cart|basket)$/,
      /^open\s+cart$/,
    ],
  },
  {
    href: "/donate",
    label: "Support a cause",
    patterns: [
      /\b(open|go to|show|take me to|navigate to)\s+(donate|donation|support(\s+a)?\s+cause)\b/,
      /^(donate|support(\s+a)?\s+cause)$/,
      /\bfund\s+(impact|a\s+cause)\b/,
    ],
  },
];

const FOCUS_KEY = "fb-voice-nav-focus";

let placesCache: VoiceNavPlace[] = [];

export type VoiceNavFocusPayload = {
  /** Name / chain query to match on Buy Local */
  query?: string;
  placeId?: string;
  kind?: "store" | "maker";
  intent: "nearest" | "named" | "browse" | "directions";
  /** Pre-built confirmation when we already know the match */
  confirmation?: string;
};

export function setVoiceNavPlaces(places: VoiceNavPlace[]) {
  placesCache = [...places].sort((a, b) => a.distanceMi - b.distanceMi);
}

export function getVoiceNavPlaces(): VoiceNavPlace[] {
  return placesCache;
}

export function setVoiceNavFocusPayload(payload: VoiceNavFocusPayload | null) {
  if (typeof window === "undefined") return;
  try {
    if (!payload) sessionStorage.removeItem(FOCUS_KEY);
    else sessionStorage.setItem(FOCUS_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event("fb-voice-nav-focus"));
  } catch {
    // ignore
  }
}

/** @deprecated prefer setVoiceNavFocusPayload */
export function setVoiceNavFocusQuery(query: string | null) {
  if (!query?.trim()) {
    setVoiceNavFocusPayload(null);
    return;
  }
  setVoiceNavFocusPayload({ query: query.trim(), intent: "named" });
}

export function consumeVoiceNavFocusPayload(): VoiceNavFocusPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FOCUS_KEY);
    sessionStorage.removeItem(FOCUS_KEY);
    if (!raw) return null;
    // Legacy: plain string query
    if (!raw.startsWith("{")) {
      return { query: raw.trim(), intent: "named" };
    }
    const parsed = JSON.parse(raw) as VoiceNavFocusPayload;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** @deprecated prefer consumeVoiceNavFocusPayload */
export function consumeVoiceNavFocusQuery(): string | null {
  return consumeVoiceNavFocusPayload()?.query ?? null;
}

function storeMatchConfirmation(place: VoiceNavPlace): string {
  return `Showing nearby stores — ${place.name} is about ${place.distanceLabel} away`;
}

function storeMatchSpoken(place: VoiceNavPlace): string {
  return `${place.name} is about ${place.distanceLabel} away.`;
}

const NEARBY_STORES_FALLBACK =
  "Here are nearby stores on Buy Local.";

function normalizeTranscript(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripFiller(name: string): string {
  return name
    .replace(
      /\b(near me|nearby|please|the|a|an|store|shop|supermarket|closest|nearest)\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

/** Score how well a spoken query matches a place name (higher is better). */
export function scorePlaceNameMatch(query: string, name: string): number {
  const q = normalizeTranscript(stripFiller(query));
  const n = normalizeTranscript(name);
  if (!q || !n) return 0;
  if (n === q) return 100;
  if (n.startsWith(q) || q.startsWith(n)) return 92;
  if (n.includes(q)) return 85;
  if (q.includes(n) && n.length >= 4) return 80;
  const tokens = q.split(" ").filter((t) => t.length > 2);
  if (tokens.length === 0) return 0;
  const hits = tokens.filter((t) => n.includes(t)).length;
  if (hits === 0) return 0;
  return (hits / tokens.length) * 70;
}

/** Pick a single best name match — ignores weak runners-up. */
export function pickBestNamedMatch<T extends { id: string; name: string }>(
  query: string,
  items: T[],
  minScore = 48
): T | null {
  if (!query.trim() || items.length === 0) return null;
  let best: T | null = null;
  let bestScore = 0;
  for (const item of items) {
    const score = scorePlaceNameMatch(query, item.name);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  if (!best || bestScore < minScore) return null;
  return best;
}

function matchPlaceByName(
  query: string,
  places: VoiceNavPlace[]
): VoiceNavPlace | null {
  return pickBestNamedMatch(query, places, 40);
}

/** True when the phrase is a site navigation command (not a product question). */
export function isSiteNavigationCommand(
  transcript: string,
  places: VoiceNavPlace[] = getVoiceNavPlaces()
): boolean {
  return parseVoiceNavCommand(transcript, places).type !== "unknown";
}

/**
 * Parse a spoken phrase into a site navigation command.
 */
export function parseVoiceNavCommand(
  transcript: string,
  places: VoiceNavPlace[] = getVoiceNavPlaces()
): VoiceNavCommand {
  const t = normalizeTranscript(transcript);
  if (!t) return { type: "unknown", transcript };

  if (
    /^(help|what can i say|commands|voice help|options|what can you do)$/.test(
      t
    ) ||
    t.includes("what can i say") ||
    t.includes("voice help") ||
    t.includes("what can you do")
  ) {
    return { type: "help" };
  }

  for (const target of OPEN_TARGETS) {
    if (target.patterns.some((re) => re.test(t))) {
      return { type: "open", href: target.href, label: target.label };
    }
  }

  if (
    /how far.*(nearest|closest).*(store|shop|maker|place)/.test(t) ||
    /(nearest|closest)\s+(store|shop|maker).*(how far|distance)/.test(t) ||
    /^(how far is the nearest store)$/.test(t)
  ) {
    return { type: "nearest_distance" };
  }

  if (
    /^(nearest|closest)\s+(store|shop|maker)s?$/.test(t) ||
    /^(find|show|get)\s+(the\s+)?(nearest|closest)\s+(store|shop)/.test(t) ||
    /\b(find|show|search)\s+(local\s+)?(stores?|makers?|shops?)\b/.test(t) ||
    /\bnearby\s+(stores?|shops?)\b/.test(t) ||
    t === "find local stores" ||
    t === "local stores"
  ) {
    return { type: "find_local_stores" };
  }

  const whereNearMe = t.match(
    /(?:where (?:is|are)|find|locate|show me)\s+(.+?)(?:\s+near me)?$/
  );
  if (whereNearMe?.[1] && (/\bnear me\b/.test(t) || KNOWN_CHAINS.test(t))) {
    const focus = stripFiller(whereNearMe[1]);
    if (focus) {
      const place = matchPlaceByName(focus, places);
      if (place) return { type: "how_far", place };
      return { type: "find_local_stores", focusQuery: focus };
    }
  }

  if (KNOWN_CHAINS.test(t) && /\b(near me|nearby|local|find|where)\b/.test(t)) {
    const chain = t.match(KNOWN_CHAINS)?.[0];
    if (chain) {
      const place = matchPlaceByName(chain, places);
      if (place) return { type: "how_far", place };
      return { type: "find_local_stores", focusQuery: chain };
    }
  }

  const howFarMatch = t.match(
    /(?:how far (?:away )?is|what(?:'s| is) the distance to)\s+(.+)/
  );
  if (howFarMatch?.[1]) {
    const place = matchPlaceByName(howFarMatch[1], places);
    if (place) return { type: "how_far", place };
    const focus = stripFiller(howFarMatch[1]);
    if (focus) return { type: "find_local_stores", focusQuery: focus };
  }

  const directionsToMatch = t.match(
    /(?:directions?|navigate|take me)\s+to\s+(.+)/
  );
  if (directionsToMatch?.[1]) {
    const place = matchPlaceByName(directionsToMatch[1], places);
    if (place) return { type: "directions_to", place };
    const focus = stripFiller(directionsToMatch[1]);
    if (focus) return { type: "find_local_stores", focusQuery: focus };
  }

  if (
    /^(directions?|get directions?|navigate)$/.test(t) ||
    /\b(directions?|navigate)\s+(please|now)?$/.test(t)
  ) {
    return { type: "directions_nearest" };
  }

  return { type: "unknown", transcript };
}

export type VoiceNavActionResult = {
  status: string;
  speak?: string;
  href?: string;
  openUrl?: string;
  showHelp?: boolean;
  focusPayload?: VoiceNavFocusPayload;
};

export function resolveVoiceNavAction(
  command: VoiceNavCommand,
  places: VoiceNavPlace[] = getVoiceNavPlaces()
): VoiceNavActionResult {
  const nearest = places[0] ?? null;

  switch (command.type) {
    case "help":
      return {
        status: "Here are site voice commands you can say:",
        speak: VOICE_NAV_HELP_SPOKEN,
        showHelp: true,
      };
    case "open":
      return {
        status: `Opening ${command.label}…`,
        speak: `Opening ${command.label}.`,
        href: command.href,
      };
    case "find_local_stores": {
      const focus = command.focusQuery?.trim();
      if (focus) {
        const place = matchPlaceByName(focus, places);
        if (place) {
          return {
            status: storeMatchConfirmation(place),
            speak: storeMatchSpoken(place),
            href: `/local#local-${place.kind}-${place.id}`,
            focusPayload: {
              query: focus,
              placeId: place.id,
              kind: place.kind,
              intent: "named",
              confirmation: storeMatchConfirmation(place),
            },
          };
        }
        return {
          status: NEARBY_STORES_FALLBACK,
          speak: NEARBY_STORES_FALLBACK,
          href: "/local#local-stores",
          focusPayload: { query: focus, intent: "named" },
        };
      }
      return {
        status: NEARBY_STORES_FALLBACK,
        speak: NEARBY_STORES_FALLBACK,
        href: "/local#local-stores",
        focusPayload: { intent: "browse" },
      };
    }
    case "nearest_distance":
      if (!nearest) {
        return {
          status: NEARBY_STORES_FALLBACK,
          speak: NEARBY_STORES_FALLBACK,
          href: "/local#local-stores",
          focusPayload: { intent: "nearest" },
        };
      }
      return {
        status: storeMatchConfirmation(nearest),
        speak: storeMatchSpoken(nearest),
        href: `/local#local-${nearest.kind}-${nearest.id}`,
        focusPayload: {
          query: nearest.name,
          placeId: nearest.id,
          kind: nearest.kind,
          intent: "nearest",
          confirmation: storeMatchConfirmation(nearest),
        },
      };
    case "directions_nearest":
      if (!nearest) {
        return {
          status: NEARBY_STORES_FALLBACK,
          speak: NEARBY_STORES_FALLBACK,
          href: "/local#local-stores",
          focusPayload: { intent: "directions" },
        };
      }
      return {
        status: `Opening directions to ${nearest.name} — about ${nearest.distanceLabel} away`,
        speak: `Opening directions to ${nearest.name}.`,
        openUrl: nearest.directionsUrl,
        href: `/local#local-${nearest.kind}-${nearest.id}`,
        focusPayload: {
          query: nearest.name,
          placeId: nearest.id,
          kind: nearest.kind,
          intent: "directions",
          confirmation: storeMatchConfirmation(nearest),
        },
      };
    case "how_far":
      return {
        status: storeMatchConfirmation(command.place),
        speak: storeMatchSpoken(command.place),
        href: `/local#local-${command.place.kind}-${command.place.id}`,
        focusPayload: {
          query: command.place.name,
          placeId: command.place.id,
          kind: command.place.kind,
          intent: "named",
          confirmation: storeMatchConfirmation(command.place),
        },
      };
    case "directions_to":
      return {
        status: `Opening directions to ${command.place.name} — about ${command.place.distanceLabel} away`,
        speak: `Opening directions to ${command.place.name}.`,
        openUrl: command.place.directionsUrl,
        href: `/local#local-${command.place.kind}-${command.place.id}`,
        focusPayload: {
          query: command.place.name,
          placeId: command.place.id,
          kind: command.place.kind,
          intent: "directions",
          confirmation: storeMatchConfirmation(command.place),
        },
      };
    case "unknown":
    default:
      return {
        status: `I didn’t recognise “${command.transcript.trim()}” as a site command. Try one of these:`,
        speak:
          "Sorry, I didn’t catch a navigation command. Say Help for examples, or try Open Buy Local.",
        showHelp: true,
      };
  }
}

export function confirmVoiceNav(
  text: string,
  opts?: { enabled?: boolean }
): void {
  if (opts?.enabled === false) return;
  if (!isSpeechSynthesisSupported()) return;
  speakFeedback(text);
}

/**
 * Run a resolved site-nav action (navigate, open directions, focus store).
 */
export function runVoiceNavAction(
  action: VoiceNavActionResult,
  opts: {
    pathname?: string | null;
    navigate: (href: string) => void;
  }
): void {
  if (action.focusPayload) {
    setVoiceNavFocusPayload(action.focusPayload);
  }

  if (action.speak) {
    confirmVoiceNav(action.speak);
  }

  if (action.openUrl && typeof window !== "undefined") {
    window.open(action.openUrl, "_blank", "noopener,noreferrer");
  }

  if (!action.href) return;

  const href = action.href;
  const hashIdx = href.indexOf("#");
  const path = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const hash = hashIdx >= 0 ? href.slice(hashIdx + 1) : "";
  const pathname = opts.pathname ?? "";

  if (path && path !== pathname) {
    opts.navigate(href);
    return;
  }

  if (hash && typeof document !== "undefined") {
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${hash}`);
      return;
    }
  }

  if (path) opts.navigate(href);
}

/** Parse transcript and run the matching site command (if any). */
export function handleSiteVoiceTranscript(
  transcript: string,
  opts: {
    pathname?: string | null;
    navigate: (href: string) => void;
  }
): VoiceNavActionResult {
  const command = parseVoiceNavCommand(transcript, getVoiceNavPlaces());
  const action = resolveVoiceNavAction(command, getVoiceNavPlaces());
  runVoiceNavAction(action, opts);
  return action;
}

export {
  isSpeechRecognitionSupported,
  startListening,
  type SpeechRecognitionHandle,
};
