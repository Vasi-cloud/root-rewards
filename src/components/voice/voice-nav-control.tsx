"use client";

import { HelpCircle, Mic, Square } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  VOICE_NAV_HELP_LINES,
  confirmVoiceNav,
  getVoiceNavPlaces,
  isSpeechRecognitionSupported,
  parseVoiceNavCommand,
  resolveVoiceNavAction,
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

  // Close help panel on route change
  useEffect(() => {
    setShowHelp(false);
    setPanelOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!status || listening) return;
    const timer = window.setTimeout(() => setStatus(null), 9000);
    return () => window.clearTimeout(timer);
  }, [status, listening]);

  useEffect(() => {
    if (!panelOpen && !listening) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPanelOpen(false);
        setShowHelp(false);
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
    const command = parseVoiceNavCommand(transcript, getVoiceNavPlaces());
    const action = resolveVoiceNavAction(command, getVoiceNavPlaces());
    setStatus(action.status);
    setError(null);
    setPanelOpen(true);
    if (action.showHelp) setShowHelp(true);

    if (action.speak) {
      confirmVoiceNav(action.speak);
    }

    if (action.openUrl && typeof window !== "undefined") {
      window.open(action.openUrl, "_blank", "noopener,noreferrer");
    }

    if (action.href) {
      const [path, hash] = action.href.split("#");
      if (path && path !== pathname) {
        router.push(action.href);
      } else if (hash) {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", `#${hash}`);
        }
      } else if (path) {
        router.push(path);
      }
      onAfterNavigate?.();
    }
  }

  function startVoiceNav() {
    if (!isSpeechRecognitionSupported()) {
      setSupported(false);
      setError(
        "Voice navigation isn’t available in this browser. Try Chrome or Edge — buttons and typing still work."
      );
      setShowHelp(true);
      setPanelOpen(true);
      return;
    }

    stopListening();
    setError(null);
    setStatus("Listening… say a page name, or Help");
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
      {status ? <p className="text-emerald-900">{status}</p> : null}
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
      className="mt-2 grid gap-1 rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2.5 text-xs text-emerald-950 sm:text-sm"
    >
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
              listening ? "Stop voice navigation" : "Voice help — speak a command"
            }
            onClick={toggleListen}
          >
            {listening ? (
              <Square className="size-4 shrink-0" />
            ) : (
              <Mic className={cn("size-4 shrink-0", listening && "animate-pulse")} />
            )}
            {listening ? "Listening… tap to stop" : "Voice help"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0"
            aria-label="Show voice commands"
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
          "rounded-2xl border border-emerald-200/70 bg-white/70 p-3 sm:p-3.5",
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
              "min-h-10 gap-1.5",
              listening && "bg-red-600 text-white hover:bg-red-600/90"
            )}
            aria-pressed={listening}
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
          Navigate pages by voice — separate from Speak / Listen for shopping
          questions.
        </p>
        <div className="mt-2">{statusBlock}</div>
        {helpList}
      </div>
    );
  }

  // Compact header icon
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
          listening ? "Stop voice navigation" : "Voice help — speak a command"
        }
        title="Voice help"
        onClick={toggleListen}
        onContextMenu={(e) => {
          e.preventDefault();
          setPanelOpen(true);
          setShowHelp((v) => !v);
        }}
      >
        <Mic className={cn("size-4", listening && "animate-pulse")} />
      </Button>
      {(panelOpen || listening) && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-emerald-200 bg-cream p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
              Voice help
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
