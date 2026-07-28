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
  "Find local stores",
  "Nearest store",
  "How far is the nearest store?",
  "Where is Sainsbury’s near me?",
  "Directions",
  "Directions to [store]",
  "Help / What can I say?",
] as const;

export const VOICE_NAV_HELP_SPOKEN =
  "You can say: Open Buy Local, Open Leafy Kitchen, Open Leafy Parts, Open Ask Leafy, Open Marketplace, Open My Forest, or Open cart. Try Find local stores, Nearest store, or Where is Tesco near me. Say Help anytime.";

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
];

const FOCUS_KEY = "fb-voice-nav-focus";

let placesCache: VoiceNavPlace[] = [];

export function setVoiceNavPlaces(places: VoiceNavPlace[]) {
  placesCache = [...places].sort((a, b) => a.distanceMi - b.distanceMi);
}

export function getVoiceNavPlaces(): VoiceNavPlace[] {
  return placesCache;
}

export function setVoiceNavFocusQuery(query: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (!query?.trim()) sessionStorage.removeItem(FOCUS_KEY);
    else sessionStorage.setItem(FOCUS_KEY, query.trim());
  } catch {
    // ignore
  }
}

export function consumeVoiceNavFocusQuery(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(FOCUS_KEY);
    sessionStorage.removeItem(FOCUS_KEY);
    return v?.trim() || null;
  } catch {
    return null;
  }
}

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

function matchPlaceByName(
  query: string,
  places: VoiceNavPlace[]
): VoiceNavPlace | null {
  const q = normalizeTranscript(stripFiller(query));
  if (!q || places.length === 0) return null;

  const scored = places
    .map((place) => {
      const name = normalizeTranscript(place.name);
      let score = 0;
      if (name === q) score = 100;
      else if (name.includes(q) || q.includes(name)) score = 80;
      else {
        const tokens = q.split(" ").filter((t) => t.length > 2);
        if (tokens.length === 0) return { place, score: 0 };
        const hits = tokens.filter((t) => name.includes(t)).length;
        score = (hits / tokens.length) * 70;
      }
      return { place, score };
    })
    .filter((row) => row.score >= 40)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.place ?? null;
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
  focusQuery?: string;
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
      return {
        status: focus
          ? `Opening Buy Local to look for ${focus}…`
          : "Opening Buy Local — nearby stores…",
        speak: focus
          ? `Opening Buy Local to look for ${focus}.`
          : "Opening Buy Local stores.",
        href: "/local#local-stores",
        focusQuery: focus,
      };
    }
    case "nearest_distance":
      if (!nearest) {
        return {
          status:
            "Opening Buy Local so you can see the nearest store and distance.",
          speak: "Opening Buy Local for the nearest store.",
          href: "/local#local-stores",
        };
      }
      return {
        status: `Nearest: ${nearest.name} — about ${nearest.distanceLabel} away. Opening Buy Local…`,
        speak: `The nearest is ${nearest.name}, about ${nearest.distanceLabel} away.`,
        href: `/local#local-${nearest.kind}-${nearest.id}`,
        focusQuery: nearest.name,
      };
    case "directions_nearest":
      if (!nearest) {
        return {
          status: "Opening Buy Local for directions…",
          speak: "Opening Buy Local for directions.",
          href: "/local#local-stores",
        };
      }
      return {
        status: `Opening directions to ${nearest.name}…`,
        speak: `Opening directions to ${nearest.name}.`,
        openUrl: nearest.directionsUrl,
        href: `/local#local-${nearest.kind}-${nearest.id}`,
        focusQuery: nearest.name,
      };
    case "how_far":
      return {
        status: `${command.place.name} is about ${command.place.distanceLabel} away. Opening Buy Local…`,
        speak: `${command.place.name} is about ${command.place.distanceLabel} away.`,
        href: `/local#local-${command.place.kind}-${command.place.id}`,
        focusQuery: command.place.name,
      };
    case "directions_to":
      return {
        status: `Opening directions to ${command.place.name}…`,
        speak: `Opening directions to ${command.place.name}.`,
        openUrl: command.place.directionsUrl,
        href: `/local#local-${command.place.kind}-${command.place.id}`,
        focusQuery: command.place.name,
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
  if (action.focusQuery) {
    setVoiceNavFocusQuery(action.focusQuery);
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
