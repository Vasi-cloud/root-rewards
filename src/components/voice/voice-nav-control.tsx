"use client";

import { HelpCircle, Mic, Square } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  VOICE_NAV_HELP_LINES,
  handleSiteVoiceTranscript,
  isSpeechRecognitionSupported,
  startListening,
  type SpeechRecognitionHandle,
} from "@/lib/voice-nav";
import { cn } from "@/lib/utils";

type VoiceNavControlProps = {
  /** icon = compact header mic; menu = mobile drawer row; panel = Ask Leafy strip */
  variant?: "icon" | "menu" | "panel";
  className?: string;
  onAfterNavigate?: () => void;
};

export function VoiceNavControl({
  variant = "icon",
  className,
  onAfterNavigate,
}: VoiceNavControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SpeechRecognitionHandle | null>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [interim, setInterim] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    return () => {
      handleRef.current?.stop();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    setShowHelp(false);
    setPanelOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!status || listening || showHelp) return;
    const timer = window.setTimeout(() => setStatus(null), 10000);
    return () => window.clearTimeout(timer);
  }, [status, listening, showHelp]);

  useEffect(() => {
    if (!panelOpen && !listening) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [panelOpen, listening]);

  function stopListening() {
    handleRef.current?.stop();
    handleRef.current = null;
    setListening(false);
    setInterim(null);
  }

  function applyTranscript(transcript: string) {
    const action = handleSiteVoiceTranscript(transcript, {
      pathname,
      navigate: (href) => {
        router.push(href);
        onAfterNavigate?.();
      },
    });
    setStatus(action.status);
    setError(null);
    setPanelOpen(true);
    if (action.showHelp) setShowHelp(true);
  }

  function startVoiceNav() {
    if (!isSpeechRecognitionSupported()) {
      setSupported(false);
      setError(
        "Voice navigation isn’t available in this browser. Try Chrome or Edge — buttons and typing still work."
      );
      setShowHelp(true);
      setPanelOpen(true);
      setStatus("Speech recognition isn’t supported here.");
      return;
    }

    stopListening();
    setError(null);
    setStatus("Listening for a site command… try “Open Buy Local” or “Help”");
    setInterim(null);
    setListening(true);
    setShowHelp(false);
    setPanelOpen(true);

    const handle = startListening({
      continuous: false,
      onInterim: (text) => setInterim(text),
      onSpeechStart: () => setStatus("Hearing you…"),
      onResult: (transcript) => {
        applyTranscript(transcript);
      },
      onError: (message) => {
        setError(message);
        setStatus(null);
        setInterim(null);
        setShowHelp(true);
        setPanelOpen(true);
      },
      onEnd: () => {
        setListening(false);
        setInterim(null);
        handleRef.current = null;
      },
    });
    handleRef.current = handle;
  }

  function toggleListen() {
    if (listening) {
      stopListening();
      setStatus(null);
      return;
    }
    startVoiceNav();
  }

  const statusBlock = (
    <div
      className="space-y-1 text-xs leading-relaxed sm:text-sm"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {interim && listening ? (
        <p className="text-muted-foreground">
          Hearing: <span className="text-foreground">“{interim}”</span>
        </p>
      ) : null}
      {status ? (
        <p className="font-medium text-emerald-900">{status}</p>
      ) : null}
      {error ? <p className="text-amber-900">{error}</p> : null}
      {!supported ? (
        <p className="text-muted-foreground">
          Speech recognition isn’t supported here. Use the menu links — everything
          still works without voice.
        </p>
      ) : null}
    </div>
  );

  const helpList = showHelp ? (
    <ul
      id={panelId}
      className="mt-2 grid gap-1.5 rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2.5 text-xs text-emerald-950 sm:text-sm"
    >
      <li className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800/70">
        Example commands
      </li>
      {VOICE_NAV_HELP_LINES.map((line) => (
        <li key={line} className="leading-snug">
          “{line}”
        </li>
      ))}
    </ul>
  ) : null;

  if (variant === "menu") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={listening ? "default" : "outline"}
            className={cn(
              "min-h-11 flex-1 justify-start gap-2",
              listening && "bg-red-600 text-white hover:bg-red-600/90"
            )}
            aria-pressed={listening}
            aria-label={
              listening
                ? "Stop site voice help"
                : "Site voice help — open pages and stores by voice"
            }
            onClick={toggleListen}
          >
            {listening ? (
              <Square className="size-4 shrink-0" />
            ) : (
              <Mic className="size-4 shrink-0" />
            )}
            {listening ? "Listening… tap to stop" : "Voice help"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0"
            aria-label="Show site voice commands"
            aria-expanded={showHelp}
            aria-controls={panelId}
            onClick={() => setShowHelp((v) => !v)}
          >
            <HelpCircle className="size-4" />
          </Button>
        </div>
        {statusBlock}
        {helpList}
      </div>
    );
  }

  if (variant === "panel") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-emerald-300/80 bg-emerald-50/50 p-3 sm:p-3.5",
          className
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-primary">Site voice help</p>
          <Button
            type="button"
            size="sm"
            variant={listening ? "default" : "outline"}
            className={cn(
              "min-h-10 gap-1.5 border-emerald-300 bg-white",
              listening && "border-transparent bg-red-600 text-white hover:bg-red-600/90"
            )}
            aria-pressed={listening}
            aria-label={
              listening
                ? "Stop site voice help"
                : "Site voice help — navigate by voice"
            }
            onClick={toggleListen}
          >
            <Mic className={cn("size-3.5", listening && "animate-pulse")} />
            {listening ? "Listening…" : "Voice help"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-10 gap-1.5"
            aria-expanded={showHelp}
            onClick={() => setShowHelp((v) => !v)}
          >
            <HelpCircle className="size-3.5" />
            Commands
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Opens pages and Buy Local stores.{" "}
          <strong className="font-medium text-foreground">Speak</strong> above is
          only for shopping questions — it won’t run site navigation.
        </p>
        <div className="mt-2">{statusBlock}</div>
        {helpList}
      </div>
    );
  }

  return (
    <div className={cn("relative shrink-0", className)} ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "size-9 shrink-0 p-0 sm:size-10",
          listening && "bg-red-600 text-white hover:bg-red-600/90"
        )}
        aria-pressed={listening}
        aria-label={
          listening ? "Stop site voice help" : "Site voice help — speak a command"
        }
        title="Site voice help"
        onClick={toggleListen}
        onContextMenu={(e) => {
          e.preventDefault();
          setPanelOpen(true);
          setShowHelp(true);
        }}
      >
        <Mic className={cn("size-4", listening && "animate-pulse")} />
      </Button>
      {(panelOpen || listening) && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl border border-emerald-200 bg-cream p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
              Site voice help
            </p>
            <button
              type="button"
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => setShowHelp((v) => !v)}
            >
              {showHelp ? "Hide" : "Commands"}
            </button>
          </div>
          {statusBlock}
          {helpList}
        </div>
      )}
    </div>
  );
}
