"use client";

import { Loader2, Mic, MicOff, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type KitchenVoiceInputProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

export function KitchenVoiceInput({
  onTranscript,
  disabled,
  className,
}: KitchenVoiceInputProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()));
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }

  function startListening() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      setError(
        "Voice input isn’t supported in this browser. Try Chrome or Edge, or paste your recipe."
      );
      return;
    }

    setError(null);
    try {
      recognitionRef.current?.abort();
    } catch {
      // ignore
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-GB";

    recognition.onresult = (event) => {
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        }
      }
      const trimmed = finalChunk.trim();
      if (trimmed) {
        onTranscriptRef.current(trimmed);
      }
    };

    recognition.onerror = (event) => {
      const code = event.error ?? "unknown";
      if (code === "not-allowed" || code === "service-not-allowed") {
        setError("Microphone permission denied. Enable it to use voice input.");
      } else if (code === "no-speech") {
        setError("No speech detected — try again a little closer to the mic.");
      } else if (code !== "aborted") {
        setError("Voice input paused. Tap the mic to try again.");
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Couldn’t start listening. Tap the mic to retry.");
      setListening(false);
    }
  }

  if (supported === false) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border/80 bg-muted/25 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground",
          className
        )}
      >
        <p className="flex items-center gap-1.5 font-medium text-foreground">
          <MicOff className="size-3.5 shrink-0" />
          Voice input not available
        </p>
        <p className="mt-1">
          Your browser doesn’t support speech recognition. Paste a recipe, or
          try Chrome / Edge on desktop.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={listening ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-10 gap-2 sm:h-9",
            listening
              ? "bg-emerald-800 text-cream hover:bg-emerald-900"
              : "bg-white"
          )}
          disabled={disabled || supported === null}
          onClick={() => (listening ? stopListening() : startListening())}
          aria-pressed={listening}
        >
          {supported === null ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : listening ? (
            <Square className="size-3.5 fill-current" />
          ) : (
            <Mic className="size-3.5" />
          )}
          {listening ? "Stop listening" : "Speak recipe"}
        </Button>
        {listening && (
          <p
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-900"
            aria-live="polite"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-700" />
            </span>
            Listening… speak ingredients or steps
          </p>
        )}
      </div>
      {error && (
        <p className="text-xs leading-relaxed text-amber-900" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
