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
  | { type: "find_local_stores" }
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
  "How far is the nearest store?",
  "Directions",
  "How far is [store]?",
  "Directions to [store]",
  "Help / What can I say?",
] as const;

export const VOICE_NAV_HELP_SPOKEN =
  "You can say: Open Buy Local, Open Leafy Kitchen, Open Leafy Parts, Open Ask Leafy, Open Marketplace, Open My Forest, or Open cart. On Buy Local, try How far is the nearest store, Directions, or Directions to a store name. Say Help anytime.";

const OPEN_TARGETS: Array<{
  href: string;
  label: string;
  patterns: RegExp[];
}> = [
  {
    href: "/local",
    label: "Buy Local",
    patterns: [
      /\b(open|go to|show|take me to)\s+(buy\s*local|local)\b/,
      /^(buy\s*local|local stores?)$/,
    ],
  },
  {
    href: "/kitchen",
    label: "Leafy Kitchen",
    patterns: [
      /\b(open|go to|show|take me to)\s+(leafy\s*)?kitchen\b/,
      /^(leafy\s*)?kitchen$/,
    ],
  },
  {
    href: "/parts",
    label: "Leafy Parts",
    patterns: [
      /\b(open|go to|show|take me to)\s+(leafy\s*)?parts\b/,
      /^(leafy\s*)?parts$/,
    ],
  },
  {
    href: "/recommend",
    label: "Ask Leafy",
    patterns: [
      /\b(open|go to|show|take me to)\s+(ask\s*)?leafy\b/,
      /^(ask\s*)?leafy$/,
      /\b(open|go to)\s+recommend(er)?\b/,
    ],
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    patterns: [
      /\b(open|go to|show|take me to)\s+(the\s+)?marketplace\b/,
      /^(marketplace|shop)$/,
    ],
  },
  {
    href: "/dashboard/my-forest",
    label: "My Forest",
    patterns: [
      /\b(open|go to|show|take me to)\s+(my\s+)?forest\b/,
      /^(my\s+)?forest$/,
    ],
  },
  {
    href: "/cart",
    label: "Cart",
    patterns: [
      /\b(open|go to|show|take me to)\s+(my\s+)?cart\b/,
      /^(cart|basket)$/,
    ],
  },
];

let placesCache: VoiceNavPlace[] = [];

export function setVoiceNavPlaces(places: VoiceNavPlace[]) {
  placesCache = [...places].sort((a, b) => a.distanceMi - b.distanceMi);
}

export function getVoiceNavPlaces(): VoiceNavPlace[] {
  return placesCache;
}

function normalizeTranscript(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchPlaceByName(
  query: string,
  places: VoiceNavPlace[]
): VoiceNavPlace | null {
  const q = normalizeTranscript(query);
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
        score = (hits / tokens.length) * 60;
      }
      return { place, score };
    })
    .filter((row) => row.score >= 40)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.place ?? null;
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
    /^(help|what can i say|commands|voice help|options)$/.test(t) ||
    t.includes("what can i say") ||
    t.includes("voice help")
  ) {
    return { type: "help" };
  }

  for (const target of OPEN_TARGETS) {
    if (target.patterns.some((re) => re.test(t))) {
      return { type: "open", href: target.href, label: target.label };
    }
  }

  if (
    /\b(find|show|search)\s+(local\s+)?(stores?|makers?|shops?)\b/.test(t) ||
    /\bnearby\s+(stores?|shops?)\b/.test(t) ||
    t === "find local stores"
  ) {
    return { type: "find_local_stores" };
  }

  if (
    /how far.*(nearest|closest).*(store|shop|maker|place)/.test(t) ||
    /(nearest|closest)\s+(store|shop|maker).*(how far|distance)/.test(t) ||
    t === "how far is the nearest store"
  ) {
    return { type: "nearest_distance" };
  }

  const howFarMatch = t.match(
    /(?:how far (?:away )?is|what(?:'s| is) the distance to)\s+(.+)/
  );
  if (howFarMatch?.[1]) {
    const place = matchPlaceByName(howFarMatch[1], places);
    if (place) return { type: "how_far", place };
  }

  const directionsToMatch = t.match(
    /(?:directions?|navigate|take me)\s+to\s+(.+)/
  );
  if (directionsToMatch?.[1]) {
    const place = matchPlaceByName(directionsToMatch[1], places);
    if (place) return { type: "directions_to", place };
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
};

export function resolveVoiceNavAction(
  command: VoiceNavCommand,
  places: VoiceNavPlace[] = getVoiceNavPlaces()
): VoiceNavActionResult {
  const nearest = places[0] ?? null;

  switch (command.type) {
    case "help":
      return {
        status: VOICE_NAV_HELP_LINES.map((line) => `“${line}”`).join(" · "),
        speak: VOICE_NAV_HELP_SPOKEN,
        showHelp: true,
      };
    case "open":
      return {
        status: `Opening ${command.label}…`,
        speak: `Opening ${command.label}.`,
        href: command.href,
      };
    case "find_local_stores":
      return {
        status: "Opening Buy Local stores…",
        speak: "Opening Buy Local stores.",
        href: "/local#local-stores",
      };
    case "nearest_distance":
      if (!nearest) {
        return {
          status:
            "No nearby stores loaded yet — opening Buy Local so you can check distances.",
          speak: "Opening Buy Local. Ask again once stores are listed.",
          href: "/local#local-stores",
        };
      }
      return {
        status: `${nearest.name} is about ${nearest.distanceLabel} away.`,
        speak: `${nearest.name} is about ${nearest.distanceLabel} away.`,
        href: "/local#local-stores",
      };
    case "directions_nearest":
      if (!nearest) {
        return {
          status: "No store directions yet — opening Buy Local.",
          speak: "Opening Buy Local for directions.",
          href: "/local#local-stores",
        };
      }
      return {
        status: `Opening directions to ${nearest.name}…`,
        speak: `Opening directions to ${nearest.name}.`,
        openUrl: nearest.directionsUrl,
        href: `/local#local-${nearest.kind}-${nearest.id}`,
      };
    case "how_far":
      return {
        status: `${command.place.name} is about ${command.place.distanceLabel} away.`,
        speak: `${command.place.name} is about ${command.place.distanceLabel} away.`,
        href: `/local#local-${command.place.kind}-${command.place.id}`,
      };
    case "directions_to":
      return {
        status: `Opening directions to ${command.place.name}…`,
        speak: `Opening directions to ${command.place.name}.`,
        openUrl: command.place.directionsUrl,
        href: `/local#local-${command.place.kind}-${command.place.id}`,
      };
    case "unknown":
    default:
      return {
        status:
          "Sorry, I didn’t catch a navigation command. Say “Help” for examples, or try “Open Buy Local”.",
        speak:
          "Sorry, I didn’t catch that. Say Help for examples, or try Open Buy Local.",
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

export {
  isSpeechRecognitionSupported,
  startListening,
  type SpeechRecognitionHandle,
};
