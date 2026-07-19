/**
 * Browser speech helpers for Ask Leafy (STT + TTS).
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
};

type RecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string; confidence?: number }>>;
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

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
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
        /natural|premium|enhanced|samantha|google|aria|jenny/i.test(v.name)
    ) ??
    voices.find((v) => v.lang.startsWith("en-US")) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0];
  return preferred ?? null;
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

  stopSpeaking();

  const utter = new SpeechSynthesisUtterance(clean.slice(0, 1200));
  utter.lang = "en-US";
  // Slightly slower for clarity (seniors / cognitive load)
  utter.rate = opts?.rate ?? 0.92;
  utter.pitch = opts?.pitch ?? 1;
  const voice = pickVoice();
  if (voice) utter.voice = voice;

  utter.onstart = () => opts?.onStart?.();
  utter.onend = () => opts?.onEnd?.();
  utter.onerror = () => {
    opts?.onError?.("Couldn’t finish speaking. Tap Speak to try again.");
    opts?.onEnd?.();
  };

  // Chrome sometimes needs voices loaded asynchronously
  const start = () => window.speechSynthesis.speak(utter);
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      const v = pickVoice();
      if (v) utter.voice = v;
      start();
    };
    // Fallback if voiceschanged never fires
    window.setTimeout(start, 250);
  } else {
    start();
  }
  return true;
}

export function startListening(opts: {
  lang?: string;
  onResult: (transcript: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
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
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    opts.onEnd?.();
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
    if (transcript) opts.onResult(transcript);
    else opts.onError?.("Didn’t catch that — tap Listen and try again.");
    finish();
  };

  recognition.onerror = (event) => {
    const code = event.error ?? "error";
    if (code === "not-allowed" || code === "service-not-allowed") {
      opts.onError?.(
        "Microphone blocked. Allow mic access in your browser settings, then try Listen again."
      );
    } else if (code === "no-speech") {
      opts.onError?.("No speech heard. Tap Listen and speak a little louder.");
    } else if (code !== "aborted") {
      opts.onError?.("Listening stopped unexpectedly. Please try again.");
    }
    finish();
  };

  recognition.onend = () => finish();

  try {
    recognition.start();
  } catch {
    opts.onError?.("Couldn’t start the microphone. Refresh and try again.");
    finish();
    return null;
  }

  return {
    stop: () => {
      try {
        recognition.abort();
      } catch {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }
      finish();
    },
  };
}

/** Build a spoken script from Leafy’s reply + top product picks. */
export function buildLeafySpeechScript(input: {
  message: string;
  picks?: Array<{ name: string; price: number; reason?: string }>;
}): string {
  const parts: string[] = [];
  const message = input.message.trim();
  if (message) parts.push(message);

  const picks = input.picks?.slice(0, 3) ?? [];
  if (picks.length > 0) {
    parts.push(
      picks.length === 1
        ? "My top pick is:"
        : `Here are my top ${picks.length} picks:`
    );
    picks.forEach((p, i) => {
      parts.push(
        `${i + 1}. ${p.name}, $${p.price.toFixed(0)}${
          p.reason ? `. ${p.reason}` : ""
        }`
      );
    });
  }

  parts.push("You can add any of these to your cart when you’re ready.");
  return parts.join(" ");
}

export const LEAFY_AUTO_SPEAK_KEY = "forest-buddies-leafy-auto-speak";

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
