/**
 * Browser speech helpers for Ask Leafy (STT + TTS + voice commands).
 * Uses Web Speech API — Chrome/Edge best; graceful fallbacks elsewhere.
 */

export type SpeechRecognitionHandle = {
  stop: () => void;
};

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
};

type RecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal?: boolean;
    0: { transcript: string; confidence?: number };
    length: number;
  }>;
};

type RecognitionCtor = new () => RecognitionLike;

function getRecognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isSpeechRecognitionSupported(): boolean {
  return Boolean(getRecognitionCtor());
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let speakGeneration = 0;

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  speakGeneration += 1;
  window.speechSynthesis.cancel();
}

/** Prefer a calm, clear English voice when the OS provides one. */
function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const preferred =
    voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        /natural|premium|enhanced|neural|samantha|google us|aria|jenny|susan|zira/i.test(
          v.name
        )
    ) ??
    voices.find((v) => v.lang.toLowerCase() === "en-us" && !/compact/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en") && v.localService) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0];
  return preferred ?? null;
}

function ensureVoicesLoaded(): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve();
  }
  if (window.speechSynthesis.getVoices().length > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.onvoiceschanged = null;
      resolve();
    };
    window.speechSynthesis.onvoiceschanged = done;
    window.setTimeout(done, 400);
  });
}

function splitIntoSpeakableChunks(text: string, maxLen = 180): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let buf = "";
  for (const sentence of sentences) {
    if ((buf + " " + sentence).trim().length <= maxLen) {
      buf = (buf + " " + sentence).trim();
    } else {
      if (buf) chunks.push(buf);
      if (sentence.length <= maxLen) buf = sentence;
      else {
        // Hard-wrap very long sentences
        for (let i = 0; i < sentence.length; i += maxLen) {
          chunks.push(sentence.slice(i, i + maxLen));
        }
        buf = "";
      }
    }
  }
  if (buf) chunks.push(buf);
  return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
}

export function speakText(
  text: string,
  opts?: {
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (message: string) => void;
  }
): boolean {
  if (!isSpeechSynthesisSupported()) {
    opts?.onError?.(
      "Spoken replies aren’t supported in this browser. Try Chrome or Edge."
    );
    return false;
  }

  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) {
    opts?.onError?.("Nothing for Leafy to say yet.");
    return false;
  }

  speakGeneration += 1;
  const myGen = speakGeneration;
  window.speechSynthesis.cancel();

  const chunks = splitIntoSpeakableChunks(clean.slice(0, 1600));
  let started = false;

  void ensureVoicesLoaded().then(() => {
    if (myGen !== speakGeneration) return;
    const voice = pickVoice();
    const rate = opts?.rate ?? 0.9;
    const pitch = opts?.pitch ?? 1.02;

    const speakChunk = (index: number) => {
      if (myGen !== speakGeneration) return;
      if (index >= chunks.length) {
        opts?.onEnd?.();
        return;
      }
      const utter = new SpeechSynthesisUtterance(chunks[index]);
      utter.lang = "en-US";
      utter.rate = rate;
      utter.pitch = pitch;
      if (voice) utter.voice = voice;

      if (index === 0) {
        utter.onstart = () => {
          if (myGen !== speakGeneration) return;
          started = true;
          opts?.onStart?.();
        };
      }
      utter.onend = () => {
        if (myGen !== speakGeneration) return;
        speakChunk(index + 1);
      };
      utter.onerror = () => {
        if (myGen !== speakGeneration) return;
        if (!started) {
          opts?.onError?.("Couldn’t start speaking. Tap Speak to try again.");
        }
        opts?.onEnd?.();
      };
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
      window.speechSynthesis.speak(utter);
    };

    speakChunk(0);
  });

  return true;
}

/** Short confirmation / prompt — clear feedback for accessibility. */
export function speakFeedback(
  text: string,
  opts?: { onEnd?: () => void }
): boolean {
  return speakText(text, {
    rate: 0.95,
    pitch: 1.05,
    onEnd: opts?.onEnd,
  });
}

export function startListening(opts: {
  lang?: string;
  /** Keep mic open a bit longer for conversational commands */
  continuous?: boolean;
  onResult: (transcript: string, meta: { confidence: number }) => void;
  onInterim?: (transcript: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
  onSpeechStart?: () => void;
}): SpeechRecognitionHandle | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    opts.onError?.(
      "Voice input isn’t supported here. Try Chrome or Edge, or type your question."
    );
    return null;
  }

  const recognition = new Ctor();
  recognition.lang = opts.lang ?? "en-US";
  recognition.continuous = Boolean(opts.continuous);
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;

  let settled = false;
  let finalTranscript = "";
  let bestConfidence = 0;
  let emittedContinuous = false;

  const finish = (emitResult: boolean) => {
    if (settled) return;
    settled = true;
    const text = finalTranscript.trim();
    // Continuous mode emits each final phrase live; only emit leftovers here
    if (emitResult && text && !emittedContinuous) {
      opts.onResult(text, { confidence: bestConfidence });
    } else if (emitResult && !text && !opts.continuous) {
      opts.onError?.("Didn’t catch that — tap Listen and try again.");
    }
    opts.onEnd?.();
  };

  recognition.onspeechstart = () => opts.onSpeechStart?.();

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const row = event.results[i];
      const alt = row[0];
      const piece = alt?.transcript?.trim() ?? "";
      if (!piece) continue;
      if (row.isFinal) {
        if (opts.continuous) {
          // Conversational: handle each phrase as soon as it finalizes
          emittedContinuous = true;
          opts.onResult(piece, { confidence: alt.confidence ?? 0.7 });
          try {
            recognition.stop();
          } catch {
            finish(false);
          }
          return;
        }
        finalTranscript = `${finalTranscript} ${piece}`.trim();
        bestConfidence = Math.max(bestConfidence, alt.confidence ?? 0.7);
      } else {
        interim = `${interim} ${piece}`.trim();
      }
    }
    const live = [finalTranscript, interim].filter(Boolean).join(" ").trim();
    if (live) opts.onInterim?.(live);

    // In one-shot mode, emit when we have a final
    if (!opts.continuous && finalTranscript) {
      try {
        recognition.stop();
      } catch {
        finish(true);
      }
    }
  };

  recognition.onerror = (event) => {
    const code = event.error ?? "error";
    if (code === "not-allowed" || code === "service-not-allowed") {
      opts.onError?.(
        "Microphone blocked. Allow mic access in your browser settings, then try Listen again."
      );
    } else if (code === "no-speech") {
      opts.onError?.("No speech heard. Tap Listen and speak a little louder.");
    } else if (code === "audio-capture") {
      opts.onError?.("No microphone found. Plug one in or check system settings.");
    } else if (code !== "aborted") {
      opts.onError?.("Listening stopped unexpectedly. Please try again.");
    }
    finish(false);
  };

  recognition.onend = () => finish(Boolean(finalTranscript));

  try {
    recognition.start();
  } catch {
    opts.onError?.("Couldn’t start the microphone. Refresh and try again.");
    finish(false);
    return null;
  }

  return {
    stop: () => {
      // Prefer stop over abort so a completed phrase can still emit
      try {
        recognition.stop();
      } catch {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
        finish(Boolean(finalTranscript) && !emittedContinuous);
      }
    },
  };
}

const ORDINAL: Record<string, number> = {
  first: 0,
  "1st": 0,
  one: 0,
  1: 0,
  second: 1,
  "2nd": 1,
  two: 1,
  2: 1,
  third: 2,
  "3rd": 2,
  three: 2,
  3: 2,
  fourth: 3,
  "4th": 3,
  four: 3,
  4: 3,
};

export type VoiceCommand =
  | { type: "add_cart"; pickIndex: number }
  | { type: "add_cart_by_name"; productQuery: string }
  | { type: "speak_again" }
  | { type: "find_stores" }
  | { type: "stop" }
  | { type: "help" }
  | { type: "shop_query"; query: string };

function normalizeTranscript(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s$]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyIncludes(haystack: string, needle: string): boolean {
  const h = normalizeTranscript(haystack);
  const n = normalizeTranscript(needle);
  if (!n || n.length < 3) return false;
  if (h.includes(n)) return true;
  const tokens = n.split(" ").filter((t) => t.length > 2);
  if (tokens.length === 0) return false;
  return tokens.every((t) => h.includes(t));
}

/**
 * Parse a spoken phrase into a Leafy command when picks are on screen.
 * Falls back to shop_query for free-form shopping requests.
 */
export function parseVoiceCommand(
  transcript: string,
  productNames: string[] = []
): VoiceCommand {
  const t = normalizeTranscript(transcript);
  if (!t) return { type: "shop_query", query: transcript.trim() };

  if (/^(stop|cancel|never ?mind|quiet|shh)/.test(t)) {
    return { type: "stop" };
  }
  if (
    /^(help|what can i say|commands|options)/.test(t) ||
    t.includes("what can i say")
  ) {
    return { type: "help" };
  }
  if (
    /^(read again|speak again|say that again|repeat|read it again)/.test(t) ||
    t.includes("read again") ||
    t.includes("speak again")
  ) {
    return { type: "speak_again" };
  }
  if (
    t.includes("nearest store") ||
    t.includes("find store") ||
    t.includes("nearby store") ||
    t.includes("find nearest")
  ) {
    return { type: "find_stores" };
  }

  const addIntent =
    /\b(add|put|drop)\b/.test(t) &&
    (/\b(cart|basket|bag)\b/.test(t) ||
      /\bpick\b/.test(t) ||
      /\bnumber\b/.test(t) ||
      /\b(first|second|third|fourth|one|two|three|four|\d)\b/.test(t) ||
      productNames.some((n) => fuzzyIncludes(t, n)));

  if (addIntent || /^(add to cart|add it|add that|add this)\b/.test(t)) {
    const pickMatch =
      t.match(/\bpick(?:\s*number)?\s*(\d+|first|second|third|fourth|one|two|three|four)\b/) ||
      t.match(/\bnumber\s*(\d+|first|second|third|fourth|one|two|three|four)\b/) ||
      t.match(/\bthe\s+(first|second|third|fourth|one|two|three|four)\b/) ||
      t.match(/\b(first|second|third|fourth)\s+(one|pick|item|product)\b/);

    if (pickMatch) {
      const key = pickMatch[1];
      const idx = ORDINAL[key] ?? (Number(key) >= 1 ? Number(key) - 1 : NaN);
      if (Number.isFinite(idx) && idx >= 0) {
        return { type: "add_cart", pickIndex: idx };
      }
    }

    // "add to cart" / "add it" with no number → first pick
    if (
      /^(add to cart|add it|add that|add this|put it in (the )?cart|add please)\b/.test(
        t
      ) ||
      (t.includes("add to cart") && !pickMatch)
    ) {
      return { type: "add_cart", pickIndex: 0 };
    }

    for (let i = 0; i < productNames.length; i++) {
      if (fuzzyIncludes(t, productNames[i])) {
        return { type: "add_cart", pickIndex: i };
      }
    }

    const afterAdd = t
      .replace(/^(please\s+)?(add|put|drop)\s+(to cart\s+)?/i, "")
      .replace(/\s+(to|in|into)\s+(the\s+)?(cart|basket|bag).*$/i, "")
      .trim();
    if (afterAdd.length >= 3) {
      return { type: "add_cart_by_name", productQuery: afterAdd };
    }

    return { type: "add_cart", pickIndex: 0 };
  }

  // Bare product name while picks are showing
  if (productNames.length > 0) {
    for (let i = 0; i < productNames.length; i++) {
      if (fuzzyIncludes(t, productNames[i]) && t.split(" ").length <= 6) {
        return { type: "add_cart", pickIndex: i };
      }
    }
  }

  return { type: "shop_query", query: transcript.trim() };
}

/** Resolve add_cart_by_name against current pick names. */
export function matchProductBySpokenName(
  query: string,
  productNames: string[]
): number {
  let best = -1;
  let bestScore = 0;
  const q = normalizeTranscript(query);
  productNames.forEach((name, i) => {
    const n = normalizeTranscript(name);
    if (q === n) {
      best = i;
      bestScore = 100;
      return;
    }
    if (fuzzyIncludes(q, n) || fuzzyIncludes(n, q)) {
      const score = Math.min(q.length, n.length);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
  });
  return best;
}

/** Build a spoken script from Leafy’s reply + top product picks. */
export function buildLeafySpeechScript(input: {
  message: string;
  picks?: Array<{ name: string; price: number; reason?: string }>;
  includeVoiceHint?: boolean;
}): string {
  const parts: string[] = [];
  const message = input.message.trim();
  if (message) parts.push(message);

  const picks = input.picks?.slice(0, 4) ?? [];
  if (picks.length > 0) {
    parts.push(
      picks.length === 1
        ? "My top pick is:"
        : `Here are my top ${picks.length} picks:`
    );
    picks.forEach((p, i) => {
      parts.push(
        `Pick ${i + 1}: ${p.name}, about $${p.price.toFixed(0)}${
          p.reason ? `. ${p.reason}` : ""
        }.`
      );
    });
  }

  if (input.includeVoiceHint !== false && picks.length > 0) {
    parts.push(
      "When you’re ready, say Add to cart for pick 1, or Add pick 2, or say the product name."
    );
  } else if (picks.length === 0) {
    parts.push("You can ask me again anytime.");
  }

  return parts.join(" ");
}

export const VOICE_COMMAND_HINTS =
  "Try: “Add to cart” · “Add pick 2” · “Add bamboo bottle” · “Find nearest store” · “Read again”";

export const LEAFY_AUTO_SPEAK_KEY = "forest-buddies-leafy-auto-speak";
export const LEAFY_LISTEN_AFTER_SPEAK_KEY =
  "forest-buddies-leafy-listen-after-speak";

export function loadAutoSpeakPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LEAFY_AUTO_SPEAK_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveAutoSpeakPreference(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEAFY_AUTO_SPEAK_KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
}

export function loadListenAfterSpeakPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = localStorage.getItem(LEAFY_LISTEN_AFTER_SPEAK_KEY);
    if (v === null) return true; // default on for accessibility
    return v === "1";
  } catch {
    return true;
  }
}

export function saveListenAfterSpeakPreference(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEAFY_LISTEN_AFTER_SPEAK_KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
}
