"use client";

import {
  Camera,
  ExternalLink,
  ImagePlus,
  Leaf,
  MapPin,
  Mic,
  Navigation,
  Sparkles,
  ShoppingBag,
  Square,
  Store,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PartnerOutboundButton } from "@/components/affiliate/PartnerOutboundButton";
import { LocalAvailabilityBadge } from "@/components/local/local-availability-badge";
import { ProductPartnerLinks } from "@/components/product/product-partner-links";
import { useCart } from "@/contexts/cart-context";
import {
  VOICE_COMMAND_HINTS,
  buildLeafySpeechScript,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  loadAutoSpeakPreference,
  loadListenAfterSpeakPreference,
  matchProductBySpokenName,
  parseVoiceCommand,
  saveAutoSpeakPreference,
  saveListenAfterSpeakPreference,
  speakFeedback,
  speakText,
  startListening,
  stopSpeaking,
  type SpeechRecognitionHandle,
} from "@/lib/leafy-voice";
import {
  DISTANCE_OPTIONS_MI,
  STOCK_SIMULATION_DISCLAIMER,
  USER_LOCATION_OPTIONS,
  distanceOptionLabel,
  findLocalStoresForProducts,
  formatDistance,
  getLocationOption,
  type LocalStoreMatch,
  type NearbyStore,
} from "@/lib/local-commerce";
import {
  SUGGESTED_PROMPTS,
  recommendProductsAsync,
  type ProductRecommendation,
  type RecommendResult,
} from "@/lib/recommendation-agent";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  VISION_DEMO_HINTS,
  classifyPhotoAsync,
  type VisionResult,
} from "@/lib/vision-agent";
import type { Product } from "@/types";

type AskMode = "text" | "vision";

export default function RecommendPage() {
  const { addToCart } = useCart();
  const fileRef = useRef<HTMLInputElement>(null);
  const photoFileRef = useRef<File | null>(null);

  const [mode, setMode] = useState<AskMode>("text");
  const [query, setQuery] = useState("eco kitchen under $50");
  const [budget, setBudget] = useState("50");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [listenAfterSpeak, setListenAfterSpeak] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [interimHeard, setInterimHeard] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [vision, setVision] = useState<VisionResult | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const listenHandleRef = useRef<SpeechRecognitionHandle | null>(null);
  const picksRef = useRef<ProductRecommendation[]>([]);
  const modeRef = useRef<AskMode>("text");
  const resultRef = useRef<RecommendResult | null>(null);
  const visionRef = useRef<VisionResult | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | undefined>();
  const [visionNote, setVisionNote] = useState("");
  const [visionError, setVisionError] = useState<string | null>(null);
  const [visionReady, setVisionReady] = useState<"unknown" | "grok" | "mock">(
    "unknown"
  );

  const [showLocal, setShowLocal] = useState(false);
  const [locationId, setLocationId] = useState(USER_LOCATION_OPTIONS[0].id);
  const [maxMiles, setMaxMiles] =
    useState<(typeof DISTANCE_OPTIONS_MI)[number]>(50);
  const [localMatches, setLocalMatches] = useState<LocalStoreMatch[] | null>(
    null
  );
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[] | null>(null);
  const [placesEngine, setPlacesEngine] = useState<
    "unknown" | "mock" | "hybrid" | "forest-buddies" | "google-places"
  >("unknown");
  const [findingStores, setFindingStores] = useState(false);
  const [geoOverride, setGeoOverride] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);
  const activeLocation = getLocationOption(locationId);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    setAutoSpeak(loadAutoSpeakPreference());
    setListenAfterSpeak(loadListenAfterSpeakPreference());
    return () => {
      listenHandleRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/vision/analyze")
      .then((r) => r.json())
      .then((data: { engine?: string }) => {
        if (cancelled) return;
        setVisionReady(data.engine === "grok-vision" ? "grok" : "mock");
      })
      .catch(() => {
        if (!cancelled) setVisionReady("mock");
      });
    void fetch("/api/places/nearby")
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => {
        if (cancelled) return;
        setPlacesEngine(data.configured ? "google-places" : "mock");
      })
      .catch(() => {
        if (!cancelled) setPlacesEngine("mock");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activePicks: ProductRecommendation[] =
    mode === "vision" && vision ? vision.picks : (result?.picks ?? []);
  const productIdsForLocal =
    mode === "vision" && vision
      ? vision.productIds
      : (result?.picks.map((p) => p.product.id) ?? []);

  picksRef.current = activePicks;
  modeRef.current = mode;
  resultRef.current = result;
  visionRef.current = vision;

  function leafyReplyScript(
    nextResult: RecommendResult | null = result,
    nextVision: VisionResult | null = vision
  ): string | null {
    if (nextVision) {
      return buildLeafySpeechScript({
        message: nextVision.summary,
        picks: nextVision.picks.map((p) => ({
          name: p.product.name,
          price: p.product.price,
          reason: `${Math.round(p.score)} percent match`,
        })),
        includeVoiceHint: true,
      });
    }
    if (nextResult) {
      return buildLeafySpeechScript({
        message: nextResult.message,
        picks: nextResult.picks.map((p) => ({
          name: p.product.name,
          price: p.product.price,
        })),
        includeVoiceHint: true,
      });
    }
    return null;
  }

  function speakLeafyReply(
    nextResult: RecommendResult | null = result,
    nextVision: VisionResult | null = vision,
    opts?: { listenAfter?: boolean }
  ) {
    const script = leafyReplyScript(nextResult, nextVision);
    if (!script) {
      setVoiceError("Ask Leafy a question first — then tap Speak.");
      return;
    }
    listenHandleRef.current?.stop();
    setListening(false);
    setInterimHeard(null);
    setVoiceError(null);
    setVoiceStatus("Leafy is speaking…");
    const shouldListenAfter =
      opts?.listenAfter ?? (listenAfterSpeak && isSpeechRecognitionSupported());
    speakText(script, {
      onStart: () => setSpeaking(true),
      onEnd: () => {
        setSpeaking(false);
        setVoiceStatus(
          shouldListenAfter
            ? "Your turn — say Add to cart, or Add pick 2…"
            : null
        );
        if (shouldListenAfter) {
          window.setTimeout(() => startVoiceListen({ forCommands: true }), 350);
        }
      },
      onError: (message) => {
        setSpeaking(false);
        setVoiceStatus(null);
        setVoiceError(message);
      },
    });
  }

  function stopLeafyVoice() {
    listenHandleRef.current?.stop();
    listenHandleRef.current = null;
    stopSpeaking();
    setListening(false);
    setSpeaking(false);
    setVoiceStatus(null);
    setInterimHeard(null);
  }

  function confirmAdded(product: Product) {
    addToCart(product);
    setAddedId(product.id);
    window.setTimeout(() => setAddedId(null), 1600);
    const line = `Added ${product.name} to your cart. About $${product.price.toFixed(0)}.`;
    setVoiceStatus(line);
    setVoiceError(null);
    speakFeedback(line, {
      onEnd: () => {
        if (listenAfterSpeak && isSpeechRecognitionSupported()) {
          setVoiceStatus("Say Add pick 2, or another product name…");
          window.setTimeout(() => startVoiceListen({ forCommands: true }), 300);
        }
      },
    });
  }

  function handleVoiceTranscript(transcript: string) {
    const picks = picksRef.current;
    const names = picks.map((p) => p.product.name);
    const command = parseVoiceCommand(transcript, names);

    setVoiceStatus(`Heard: “${transcript}”`);
    setInterimHeard(null);

    if (command.type === "stop") {
      stopLeafyVoice();
      setVoiceStatus("Okay — voice paused.");
      speakFeedback("Okay. Voice paused.");
      return;
    }

    if (command.type === "help") {
      setVoiceStatus(VOICE_COMMAND_HINTS);
      speakFeedback(
        "You can say: Add to cart. Add pick 2. Or say a product name. Or find nearest store. Or ask a new shopping question."
      );
      return;
    }

    if (command.type === "speak_again") {
      speakLeafyReply(resultRef.current, visionRef.current, {
        listenAfter: true,
      });
      return;
    }

    if (command.type === "find_stores") {
      if (modeRef.current === "vision" && visionRef.current) {
        setVoiceStatus("Finding nearest stores…");
        speakFeedback("Looking for the nearest store for your photo.");
        void findNearestStoreFromVision();
      } else {
        setVoiceStatus("Open Snap & match, or browse Buy Local for stores.");
        speakFeedback(
          "For nearby stores, snap a photo in Snap and match, or open Buy Local."
        );
      }
      return;
    }

    if (command.type === "add_cart" || command.type === "add_cart_by_name") {
      if (picks.length === 0) {
        setVoiceError("Ask Leafy for picks first, then say Add to cart.");
        speakFeedback("I don’t have picks yet. Ask me what you’re shopping for.");
        return;
      }
      const index =
        command.type === "add_cart"
          ? command.pickIndex
          : matchProductBySpokenName(command.productQuery, names);
      if (index < 0 || index >= picks.length) {
        setVoiceError(
          `I couldn’t match that. Try “Add pick 1” through “Add pick ${picks.length}”.`
        );
        speakFeedback(
          `I couldn’t find that product. Say add pick 1 through pick ${picks.length}.`
        );
        return;
      }
      confirmAdded(picks[index].product);
      return;
    }

    // Free-form shopping question
    setMode("text");
    setQuery(command.query);
    const money = command.query.match(/\$?\s*(\d{1,3})\b/);
    if (money) setBudget(money[1]);
    void runRecommend(command.query, money?.[1] ?? budget, { fromVoice: true });
  }

  function startVoiceListen(opts?: { forCommands?: boolean }) {
    if (!isSpeechRecognitionSupported()) {
      setVoiceError(
        "Voice input isn’t supported in this browser. Try Chrome or Edge, or type your question."
      );
      return;
    }

    listenHandleRef.current?.stop();
    stopSpeaking();
    setSpeaking(false);
    setVoiceError(null);
    setInterimHeard(null);

    const hasPicks = picksRef.current.length > 0;
    const forCommands = Boolean(opts?.forCommands && hasPicks);
    setVoiceStatus(
      forCommands
        ? "Listening for a command… Add to cart, or a new question"
        : "Listening… say what you’re shopping for"
    );
    setListening(true);

    const handle = startListening({
      continuous: forCommands,
      onInterim: (text) => setInterimHeard(text),
      onSpeechStart: () =>
        setVoiceStatus(
          forCommands ? "Hearing you…" : "Hearing your question…"
        ),
      onResult: (transcript) => {
        handleVoiceTranscript(transcript);
      },
      onError: (message) => {
        setVoiceError(message);
        setVoiceStatus(null);
        setInterimHeard(null);
      },
      onEnd: () => {
        setListening(false);
        setInterimHeard(null);
        listenHandleRef.current = null;
      },
    });
    listenHandleRef.current = handle;

    // End continuous command window after ~8s so mic doesn't stay open forever
    if (forCommands && handle) {
      window.setTimeout(() => {
        if (listenHandleRef.current === handle) {
          handle.stop();
        }
      }, 8000);
    }
  }

  function toggleListen() {
    if (listening) {
      listenHandleRef.current?.stop();
      listenHandleRef.current = null;
      setListening(false);
      setVoiceStatus(null);
      setInterimHeard(null);
      return;
    }
    startVoiceListen({ forCommands: picksRef.current.length > 0 });
  }

  async function runRecommend(
    nextQuery = query,
    nextBudget = budget,
    opts?: { fromVoice?: boolean }
  ) {
    setThinking(true);
    setVoiceError(null);
    setVision(null);
    setLocalMatches(null);
    setNearbyStores(null);
    setShowLocal(false);
    stopSpeaking();
    setSpeaking(false);
    const parsedBudget = Number(nextBudget);
    const out = await recommendProductsAsync({
      query: nextQuery,
      budget:
        Number.isFinite(parsedBudget) && parsedBudget > 0
          ? parsedBudget
          : undefined,
      limit: 4,
    });
    setResult(out);
    setThinking(false);
    if (autoSpeak || opts?.fromVoice) {
      // Small pause so screen readers / UI settle before TTS
      window.setTimeout(() => speakLeafyReply(out, null), 400);
    }
  }

  function clearPhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName(null);
    setFileSize(undefined);
    photoFileRef.current = null;
    setVision(null);
    setVisionError(null);
    setLocalMatches(null);
    setNearbyStores(null);
    setShowLocal(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onFileChosen(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setVisionError("Please upload an image (JPG, PNG, WebP…).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setVisionError("Keep photos under 8 MB.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    photoFileRef.current = file;
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setFileSize(file.size);
    setVisionError(null);
    setVision(null);
    setLocalMatches(null);
    setNearbyStores(null);
    setShowLocal(false);
  }

  async function runVision(overrideName?: string, overrideNote?: string) {
    const name = overrideName ?? fileName;
    if (!name && !photoFileRef.current) {
      setVisionError("Upload a photo (or tap a demo chip) first.");
      return;
    }

    const rate = consumeRateLimit("vision");
    if (!rate.allowed) {
      setVisionError(rate.message);
      return;
    }

    setMode("vision");
    setThinking(true);
    setResult(null);
    setVoiceError(null);
    setVisionError(null);
    setLocalMatches(null);
    setNearbyStores(null);
    setShowLocal(false);

    const usingDemoChip = Boolean(overrideName && !photoFileRef.current);
    if (usingDemoChip && overrideName) {
      setFileName(overrideName);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }

    const note = (overrideNote ?? visionNote).trim() || undefined;
    const out = await classifyPhotoAsync({
      file: usingDemoChip ? null : photoFileRef.current,
      fileName: name ?? "photo.jpg",
      fileSize,
      note,
      limit: 4,
    });
    setVision(out);
    setThinking(false);
    if (autoSpeak) {
      window.setTimeout(() => speakLeafyReply(null, out), 400);
    }
  }

  function findLocalStores() {
    if (productIdsForLocal.length === 0) return;
    const user =
      USER_LOCATION_OPTIONS.find((l) => l.id === locationId) ??
      USER_LOCATION_OPTIONS[0];
    const matches = findLocalStoresForProducts(
      productIdsForLocal,
      user,
      maxMiles
    );
    setLocalMatches(matches);
    setShowLocal(true);
  }

  /** Snap & Match → Forest Buddies makers + Google Places (when configured). */
  async function findNearestStoreFromVision(opts?: {
    locationId?: string;
    maxMiles?: (typeof DISTANCE_OPTIONS_MI)[number];
    geo?: { lat: number; lng: number } | null;
  }) {
    if (!vision || vision.productIds.length === 0) return;
    const locId = opts?.locationId ?? locationId;
    const miles = opts?.maxMiles ?? maxMiles;
    const geo = opts?.geo === undefined ? geoOverride : opts.geo;
    setFindingStores(true);
    setShowLocal(true);
    try {
      const res = await fetch("/api/places/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: geo ? undefined : locId,
          lat: geo?.lat,
          lng: geo?.lng,
          maxMiles: miles,
          productIds: vision.productIds,
          productNames: vision.picks.map((p) => p.product.name),
          categoryHint: vision.categoryHint,
          labels: vision.labels.map((l) => l.label),
          limit: 6,
        }),
      });
      const data = (await res.json()) as {
        stores?: NearbyStore[];
        engine?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not find nearby stores.");
      }
      setNearbyStores(data.stores ?? []);
      if (
        data.engine === "hybrid" ||
        data.engine === "mock" ||
        data.engine === "forest-buddies" ||
        data.engine === "google-places"
      ) {
        setPlacesEngine(data.engine);
      }
    } catch {
      setNearbyStores([]);
    } finally {
      setFindingStores(false);
    }
  }

  function handleAdd(product: Product, opts?: { speak?: boolean }) {
    addToCart(product);
    setAddedId(product.id);
    window.setTimeout(() => setAddedId(null), 1600);
    if (opts?.speak) {
      const line = `Added ${product.name} to your cart.`;
      setVoiceStatus(line);
      speakFeedback(line);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(149,213,178,0.4),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Badge className="mb-3 gap-1 bg-emerald-800/10 text-emerald-900">
          <Wand2 className="size-3" />
          Ask Leafy · text, voice &amp; Grok Vision
        </Badge>
        <h1 className="font-heading text-3xl font-semibold text-primary sm:text-5xl">
          Ask Leafy what to buy
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground sm:text-lg">
          Type, tap <strong className="font-medium text-foreground">Listen</strong>{" "}
          to ask out loud, or snap a photo. After Leafy speaks, say{" "}
          <strong className="font-medium text-foreground">Add to cart</strong>{" "}
          for a pick — clear spoken feedback included.
        </p>

        <div
          className="mt-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-cream to-white p-4 sm:p-5"
          role="region"
          aria-label="Voice controls for Ask Leafy"
        >
          <p className="text-sm font-medium text-primary">
            Voice controls
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Conversational Leafy — ask out loud, hear answers, say{" "}
            <strong className="font-medium text-foreground">Add to cart</strong>
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              size="lg"
              variant={listening ? "default" : "outline"}
              className={`min-h-14 gap-2 text-base ${
                listening
                  ? "bg-red-600 text-white hover:bg-red-600/90"
                  : "border-emerald-300 bg-white"
              }`}
              aria-pressed={listening}
              aria-label={
                listening
                  ? "Stop listening"
                  : "Listen — speak a question or Add to cart"
              }
              disabled={thinking}
              onClick={toggleListen}
            >
              <Mic className={`size-5 ${listening ? "animate-pulse" : ""}`} />
              {listening ? "Listening… tap to stop" : "Listen"}
            </Button>
            <Button
              type="button"
              size="lg"
              variant={speaking ? "default" : "outline"}
              className={`min-h-14 gap-2 text-base ${
                speaking ? "" : "border-emerald-300 bg-white"
              }`}
              aria-pressed={speaking}
              aria-label={
                speaking
                  ? "Stop Leafy speaking"
                  : "Speak — hear Leafy’s reply out loud"
              }
              disabled={thinking || (!result && !vision)}
              onClick={() => {
                if (speaking) {
                  stopLeafyVoice();
                  return;
                }
                speakLeafyReply(
                  mode === "vision" ? null : result,
                  mode === "vision" ? vision : null
                );
              }}
            >
              {speaking ? (
                <>
                  <Square className="size-5" />
                  Stop speaking
                </>
              ) : (
                <>
                  <Volume2 className="size-5" />
                  Speak
                </>
              )}
            </Button>
          </div>
          <p className="mt-3 rounded-xl border border-emerald-100 bg-white/70 px-3 py-2 text-xs leading-relaxed text-emerald-950 sm:text-sm">
            {VOICE_COMMAND_HINTS}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-foreground">
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={autoSpeak}
                onChange={(e) => {
                  const on = e.target.checked;
                  setAutoSpeak(on);
                  saveAutoSpeakPreference(on);
                  setVoiceStatus(
                    on
                      ? "Auto-speak on — Leafy will read answers aloud"
                      : "Auto-speak off"
                  );
                }}
              />
              <span>Always read Leafy’s answers aloud</span>
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-foreground">
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={listenAfterSpeak}
                onChange={(e) => {
                  const on = e.target.checked;
                  setListenAfterSpeak(on);
                  saveListenAfterSpeakPreference(on);
                  setVoiceStatus(
                    on
                      ? "After speaking, Leafy will listen for Add to cart"
                      : "Won’t auto-listen after speaking"
                  );
                }}
              />
              <span>After speaking, listen for “Add to cart”</span>
            </label>
            {(listening || speaking) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 gap-1.5 self-start"
                onClick={stopLeafyVoice}
              >
                <VolumeX className="size-4" />
                Stop all voice
              </Button>
            )}
          </div>
          <div
            className="mt-2 min-h-[1.25rem] space-y-1 text-sm"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {interimHeard && listening && (
              <p className="text-muted-foreground">
                Hearing: <span className="text-foreground">“{interimHeard}”</span>
              </p>
            )}
            {voiceStatus && (
              <p className="text-emerald-900">{voiceStatus}</p>
            )}
            {voiceError && (
              <p className="text-amber-900">{voiceError}</p>
            )}
            {!isSpeechRecognitionSupported() &&
              !isSpeechSynthesisSupported() && (
                <p className="text-muted-foreground">
                  Voice isn’t available in this browser — typing still works.
                </p>
              )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "text"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-white/80 text-foreground hover:bg-muted"
            }`}
          >
            <Sparkles className="size-3.5" />
            Text &amp; voice
          </button>
          <button
            type="button"
            onClick={() => setMode("vision")}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "vision"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-white/80 text-foreground hover:bg-muted"
            }`}
          >
            <Camera className="size-3.5" />
            Snap &amp; match
            {visionReady === "grok" && (
              <span className="ml-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
                Grok
              </span>
            )}
          </button>
        </div>

        {mode === "text" ? (
          <form
            className="mt-6 space-y-4 rounded-3xl border border-border/70 bg-white/80 p-5 shadow-sm sm:p-6"
            onSubmit={(e) => {
              e.preventDefault();
              void runRecommend();
            }}
          >
            <div>
              <label
                htmlFor="rec-query"
                className="mb-1.5 block text-sm font-medium"
              >
                What are you shopping for?
              </label>
              <textarea
                id="rec-query"
                rows={2}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g. "gift for birthday" or "eco kitchen under $50"'
                className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1.5 text-sm text-muted-foreground">
                Or tap <strong className="font-medium">Listen</strong> above and
                say it out loud.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-40">
                <label
                  htmlFor="rec-budget"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Budget ($)
                </label>
                <input
                  id="rec-budget"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="50"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="min-h-12 flex-1 gap-2 text-base"
                disabled={thinking || !query.trim()}
              >
                <Sparkles className="size-4" />
                {thinking ? "Leafy is thinking…" : "Get recommendations"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setQuery(p.query);
                    setBudget(String(p.budget));
                    void runRecommend(p.query, String(p.budget));
                  }}
                  className="rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-950 hover:bg-emerald-100 sm:text-sm"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-4 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white/90 to-sky-50/50 p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Leaf className="size-3.5" />
                Leafy&apos;s eyes
              </span>
              <span className="text-xs text-muted-foreground">
                {visionReady === "grok"
                  ? "Powered by Grok Vision"
                  : visionReady === "mock"
                    ? "Demo mode (add XAI_API_KEY for live Grok)"
                    : "Checking vision…"}
              </span>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium">
                Snap something you like
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-[radial-gradient(ellipse_at_top,_rgba(149,213,178,0.25),transparent_60%)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Upload preview"
                    className="max-h-56 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 rounded-full bg-cream/95 p-1.5 text-foreground shadow-sm hover:bg-white"
                    aria-label="Remove photo"
                  >
                    <X className="size-4" />
                  </button>
                  {fileName && (
                    <p className="border-t border-border/60 bg-cream/80 px-3 py-2 text-xs text-muted-foreground">
                      {fileName} · ready for the canopy scan
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-400/80 bg-white/60 px-4 py-10 text-center transition hover:border-emerald-500 hover:bg-emerald-50/80"
                >
                  <ImagePlus className="size-8 text-emerald-800" />
                  <span className="font-medium text-primary">
                    Drop or choose a photo
                  </span>
                  <span className="max-w-xs text-xs text-muted-foreground">
                    JPG or PNG works best · Leafy + Grok will suggest marketplace
                    twins
                  </span>
                </button>
              )}
              {!previewUrl && fileName && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Demo cue: <span className="font-medium">{fileName}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="vision-note"
                className="mb-1.5 block text-sm font-medium"
              >
                Optional hint for Leafy
              </label>
              <input
                id="vision-note"
                value={visionNote}
                onChange={(e) => setVisionNote(e.target.value)}
                placeholder="e.g. water bottle, rain jacket, tote…"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {VISION_DEMO_HINTS.map((h) => (
                <button
                  key={h.fileName}
                  type="button"
                  onClick={() => {
                    photoFileRef.current = null;
                    setFileName(h.fileName);
                    setVisionNote(h.label.toLowerCase());
                    void runVision(h.fileName, h.label.toLowerCase());
                  }}
                  className="rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-950 hover:bg-emerald-100 sm:text-sm"
                >
                  Try “{h.label}”
                </button>
              ))}
            </div>

            {visionError && (
              <p className="text-sm text-amber-800">{visionError}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {!previewUrl && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="size-4" />
                  Choose photo
                </Button>
              )}
              <Button
                type="button"
                size="lg"
                className="min-h-11 flex-1 gap-2 sm:flex-none"
                disabled={thinking || (!fileName && !previewUrl)}
                onClick={() => void runVision()}
              >
                <Camera className="size-4" />
                {thinking ? "Leafy is looking…" : "Match with Grok Vision"}
              </Button>
            </div>
          </div>
        )}

        {thinking && (
          <div className="mt-8 animate-fb-fade-up rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 px-5 py-6 text-center">
            <Leaf className="mx-auto size-8 animate-fb-float text-primary" />
            <p className="font-heading mt-3 text-lg font-semibold text-primary">
              {mode === "vision"
                ? "Leafy is peering through the leaves…"
                : "Scanning the canopy…"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "vision"
                ? visionReady === "grok"
                  ? "Grok Vision → eco twins from the marketplace"
                  : "Matching shapes & vibes to Forest Buddies finds"
                : "Matching budget, occasion, and eco scores"}
            </p>
          </div>
        )}

        {!thinking && mode === "vision" && vision && (
          <div className="mt-8 space-y-5 animate-fb-fade-up">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    vision.engine === "grok-vision"
                      ? "bg-primary text-primary-foreground"
                      : "bg-amber-800 text-white"
                  }
                >
                  {vision.engine === "grok-vision"
                    ? "Grok Vision"
                    : "Mock vision"}
                </Badge>
                {vision.categoryHint && (
                  <Badge variant="outline">{vision.categoryHint}</Badge>
                )}
                {typeof vision.confidence === "number" && (
                  <Badge
                    variant="secondary"
                    className="tabular-nums"
                    title="Overall look confidence"
                  >
                    {Math.round(vision.confidence * 100)}% sure
                  </Badge>
                )}
              </div>

              <p
                className="font-heading mt-3 text-lg font-semibold text-emerald-950 sm:text-xl"
                id="leafy-vision-reply"
              >
                {vision.summary}
              </p>

              <div className="mt-3">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="min-h-12 gap-2 border-emerald-300 bg-white text-base"
                  aria-label="Speak Leafy’s photo reply"
                  onClick={() => {
                    if (speaking) stopLeafyVoice();
                    else speakLeafyReply(null, vision);
                  }}
                >
                  {speaking ? (
                    <>
                      <Square className="size-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-4" />
                      Speak this reply
                    </>
                  )}
                </Button>
              </div>

              {typeof vision.confidence === "number" && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Match confidence</span>
                    <span className="tabular-nums font-medium text-emerald-900">
                      {Math.round(vision.confidence * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-primary transition-all"
                      style={{
                        width: `${Math.max(8, Math.round(vision.confidence * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {vision.labels.map((l) => (
                  <Badge
                    key={l.label}
                    variant="secondary"
                    className="capitalize"
                  >
                    {l.label} · {Math.round(l.confidence * 100)}%
                  </Badge>
                ))}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Source: {vision.sourceName}
                {vision.fallback && vision.fallbackReason
                  ? ` · ${vision.fallbackReason}`
                  : ""}
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  size="lg"
                  className="min-h-11 flex-1 gap-2 sm:flex-none"
                  disabled={findingStores || vision.productIds.length === 0}
                  onClick={() => findNearestStoreFromVision()}
                >
                  <MapPin className="size-4" />
                  {findingStores
                    ? "Looking nearby…"
                    : showLocal
                      ? "Refresh nearest store"
                      : "Find Nearest Store"}
                </Button>
                <p className="text-xs text-muted-foreground sm:max-w-[14rem]">
                  {placesEngine === "google-places" || placesEngine === "hybrid"
                    ? "Live Google Maps + Forest Buddies makers"
                    : "Enhanced mock makers — add GOOGLE_MAPS_API_KEY for live Places"}
                </p>
              </div>
            </div>

            <VisionNearestStorePanel
              showLocal={showLocal}
              finding={findingStores}
              locationId={locationId}
              maxMiles={maxMiles}
              stores={nearbyStores}
              placesEngine={placesEngine}
              country={activeLocation.country}
              geoLabel={geoOverride?.label ?? null}
              disabled={vision.productIds.length === 0}
              photoLabels={vision.labels.map((l) => l.label)}
              onLocationChange={(id) => {
                setLocationId(id);
                setGeoOverride(null);
                if (showLocal) {
                  void findNearestStoreFromVision({
                    locationId: id,
                    geo: null,
                  });
                }
              }}
              onMilesChange={(mi) => {
                setMaxMiles(mi);
                if (showLocal) {
                  void findNearestStoreFromVision({ maxMiles: mi });
                }
              }}
              onUseMyLocation={() => {
                if (!navigator.geolocation) {
                  setVisionError(
                    "Location isn’t available — pick a UK city instead."
                  );
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const geo = {
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                      label: "Your current location",
                    };
                    setGeoOverride(geo);
                    void findNearestStoreFromVision({
                      geo: { lat: geo.lat, lng: geo.lng },
                    });
                  },
                  () => {
                    setVisionError(
                      "Couldn’t read your location. Allow access, or pick London / Manchester."
                    );
                  },
                  { enableHighAccuracy: false, timeout: 10000 }
                );
              }}
              onFind={() => void findNearestStoreFromVision()}
            />

            <div>
              <h2 className="font-heading text-xl font-semibold text-primary">
                Marketplace twins
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ranked by visual kinship — shop online or pick up nearby.
              </p>
            </div>

            <PickList
              picks={vision.picks}
              addedId={addedId}
              onAdd={handleAdd}
              reasonLabel="Why Leafy matched it"
            />

            <p className="text-center text-xs text-muted-foreground">
              {vision.engine === "grok-vision"
                ? "Live Grok Vision · Find Nearest Store uses makers + Google Places when configured"
                : "Demo vision · set XAI_API_KEY and GOOGLE_MAPS_API_KEY for the full stack"}
            </p>
          </div>
        )}

        {!thinking && mode === "text" && result && (
          <div className="mt-8 space-y-5 animate-fb-fade-up">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-800 text-white">
                  {result.engine === "mock" ? "Mock agent" : "Grok"}
                </Badge>
                {result.parsed.budget != null && (
                  <Badge variant="outline">≤ ${result.parsed.budget}</Badge>
                )}
                {result.parsed.isGift && (
                  <Badge variant="secondary">Gift mode</Badge>
                )}
                {result.parsed.themes.map((t) => (
                  <Badge key={t} variant="outline" className="capitalize">
                    {t}
                  </Badge>
                ))}
              </div>
              <p
                className="font-heading mt-3 text-lg font-semibold text-emerald-950 sm:text-xl"
                id="leafy-text-reply"
              >
                {result.message}
              </p>
              <div className="mt-3">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="min-h-12 gap-2 border-emerald-300 bg-white text-base"
                  aria-label="Speak Leafy’s reply"
                  onClick={() => {
                    if (speaking) stopLeafyVoice();
                    else speakLeafyReply(result, null);
                  }}
                >
                  {speaking ? (
                    <>
                      <Square className="size-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-4" />
                      Speak this reply
                    </>
                  )}
                </Button>
              </div>
            </div>

            <PickList
              picks={result.picks}
              addedId={addedId}
              onAdd={handleAdd}
              reasonLabel="Why Leafy picked it"
            />

            <LocalStoresPanel
              showLocal={showLocal}
              locationId={locationId}
              maxMiles={maxMiles}
              localMatches={localMatches}
              country={activeLocation.country}
              disabled={activePicks.length === 0}
              onLocationChange={setLocationId}
              onMilesChange={setMaxMiles}
              onFind={findLocalStores}
            />

            <p className="text-center text-xs text-muted-foreground">
              Engine: mock scorer on the live marketplace catalog. Hook up Grok
              by swapping{" "}
              <code className="rounded bg-muted px-1">recommendProducts</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PickList({
  picks,
  addedId,
  onAdd,
  reasonLabel,
}: {
  picks: ProductRecommendation[];
  addedId: string | null;
  onAdd: (product: Product) => void;
  reasonLabel: string;
}) {
  return (
    <div className="space-y-4">
      {picks.map((pick, i) => (
        <article
          key={pick.product.id}
          className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:p-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/5 sm:size-20">
              <Leaf className="size-8 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
                      Pick #{i + 1}
                    </p>
                    <Badge className="bg-emerald-100 text-emerald-900 tabular-nums">
                      {Math.round(pick.score)}% match
                    </Badge>
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-primary">
                    {pick.product.name}
                  </h2>
                </div>
                <p className="font-heading text-2xl font-semibold tabular-nums text-primary">
                  ${pick.product.price.toFixed(2)}
                </p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {pick.product.description}
              </p>
              {(pick.product.materials || pick.product.fitGuide) && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/90">
                  {pick.product.materials
                    ? `Materials: ${pick.product.materials}`
                    : null}
                  {pick.product.materials && pick.product.fitGuide ? " · " : null}
                  {pick.product.fitGuide
                    ? `Fit: ${pick.product.fitGuide}`
                    : null}
                </p>
              )}
              <p className="mt-2 text-sm font-medium text-emerald-900">
                {reasonLabel}: {pick.reason}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline">{pick.product.category}</Badge>
                <Badge className="bg-emerald-100 text-emerald-800">
                  Eco {pick.product.sustainabilityScore}
                </Badge>
                {pick.matchTags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onAdd(pick.product)}
                >
                  <ShoppingBag className="size-3.5" />
                  {addedId === pick.product.id ? "Added!" : "Add to cart"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/marketplace" />}
                >
                  Browse similar
                </Button>
              </div>
              <div className="mt-3 border-t border-border/50 pt-3">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Also compare on big stores
                </p>
                <ProductPartnerLinks product={pick.product} />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function VisionNearestStorePanel({
  showLocal,
  finding,
  locationId,
  maxMiles,
  stores,
  placesEngine,
  country,
  geoLabel,
  disabled,
  photoLabels,
  onLocationChange,
  onMilesChange,
  onUseMyLocation,
  onFind,
}: {
  showLocal: boolean;
  finding: boolean;
  locationId: string;
  maxMiles: (typeof DISTANCE_OPTIONS_MI)[number];
  stores: NearbyStore[] | null;
  placesEngine: string;
  country: "gb" | "us";
  geoLabel: string | null;
  disabled: boolean;
  photoLabels: string[];
  onLocationChange: (id: string) => void;
  onMilesChange: (mi: (typeof DISTANCE_OPTIONS_MI)[number]) => void;
  onUseMyLocation: () => void;
  onFind: () => void;
}) {
  const nearest = stores?.[0] ?? null;
  const others = stores?.slice(1) ?? [];
  const engineLabel =
    placesEngine === "hybrid"
      ? "Forest Buddies + Google Maps"
      : placesEngine === "google-places"
        ? "Google Maps Places"
        : placesEngine === "forest-buddies"
          ? "Forest Buddies makers"
          : "Enhanced mock makers";

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-cream p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-heading text-lg font-semibold text-primary">
            <Navigation className="size-5 text-emerald-800" />
            Nearest store for your photo
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            UK-ready distance, directions, and availability hints — {engineLabel}.
          </p>
          {photoLabels.length > 0 && (
            <p className="mt-2 text-xs text-emerald-900/80">
              Looking for:{" "}
              <span className="font-medium capitalize">
                {photoLabels.slice(0, 3).join(", ")}
              </span>
            </p>
          )}
          {geoLabel && (
            <p className="mt-1 text-xs font-medium text-emerald-900">
              Using: {geoLabel}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            disabled={disabled || finding}
            onClick={onUseMyLocation}
          >
            <Navigation className="size-3.5" />
            Use my location
          </Button>
          <Button
            type="button"
            className="gap-1.5"
            disabled={disabled || finding}
            onClick={onFind}
          >
            <MapPin className="size-3.5" />
            {finding
              ? "Finding…"
              : showLocal
                ? "Update results"
                : "Find Nearest Store"}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Near
          </label>
          <select
            value={geoLabel ? "__geo__" : locationId}
            onChange={(e) => {
              const next = e.target.value;
              if (next === "__geo__") return;
              onLocationChange(next);
            }}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          >
            {geoLabel && (
              <option value="__geo__">{geoLabel}</option>
            )}
            {USER_LOCATION_OPTIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-36">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Within
          </label>
          <select
            value={maxMiles}
            onChange={(e) =>
              onMilesChange(
                Number(e.target.value) as (typeof DISTANCE_OPTIONS_MI)[number]
              )
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          >
            {DISTANCE_OPTIONS_MI.map((mi) => (
              <option key={mi} value={mi}>
                {distanceOptionLabel(mi, country)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showLocal && finding && (
        <p className="mt-4 text-sm text-muted-foreground">Searching nearby…</p>
      )}

      {showLocal && !finding && stores && (
        <div className="mt-4 space-y-3">
          {nearest ? (
            <>
              <div className="rounded-2xl border border-primary/20 bg-white/90 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/70">
                        Closest match
                      </p>
                      <Badge
                        className={
                          nearest.source === "google"
                            ? "bg-sky-100 text-sky-950"
                            : "bg-emerald-100 text-emerald-900"
                        }
                      >
                        {nearest.source === "google"
                          ? "Google Maps"
                          : "Forest Buddies"}
                      </Badge>
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-primary">
                      {nearest.name}
                    </h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-900">
                        <MapPin className="size-3.5" />
                        {formatDistance(nearest.distanceMi, country)} away
                      </span>
                      <span>· {nearest.city}</span>
                      {nearest.openNow === true && (
                        <span className="font-medium text-emerald-800">
                          · Open now
                        </span>
                      )}
                      {nearest.openNow === false && <span>· Closed now</span>}
                      {nearest.rating != null && (
                        <span>· {nearest.rating.toFixed(1)}★</span>
                      )}
                    </p>
                    {nearest.address && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {nearest.address}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-900 tabular-nums">
                    {formatDistance(nearest.distanceMi, country)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {nearest.blurb}
                </p>
                <p className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-950">
                  {nearest.availabilityHint}
                  {nearest.hoursHint ? ` · ${nearest.hoursHint}` : ""}
                </p>
                {nearest.matchingProductNames.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {nearest.matchingProductNames.slice(0, 3).map((name) => (
                      <li
                        key={name}
                        className="rounded-lg border border-border/60 bg-cream/70 px-3 py-2 text-sm font-medium text-primary"
                      >
                        Matches: {name}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    nativeButton={false}
                    render={
                      <a
                        href={nearest.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <Navigation className="size-3.5" />
                    Directions
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    nativeButton={false}
                    render={
                      <a
                        href={nearest.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <ExternalLink className="size-3.5" />
                    Open in Maps
                  </Button>
                  {nearest.shopSlug && (
                    <Button
                      size="sm"
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={`/shop/${nearest.shopSlug}`} />}
                    >
                      Visit shop
                    </Button>
                  )}
                </div>
              </div>

              {others.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Other nearby stores
                  </p>
                  {others.map((store) => (
                    <div
                      key={store.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-white/80 px-3.5 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-primary">{store.name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {store.source === "google" ? "Maps" : "FB"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {store.city} ·{" "}
                          <span className="font-medium text-emerald-900">
                            {formatDistance(store.distanceMi, country)}
                          </span>
                          {store.matchingProductNames[0]
                            ? ` · ${store.matchingProductNames[0]}`
                            : store.availabilityHint
                              ? ` · ${store.availabilityHint}`
                              : ""}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 shrink-0"
                        nativeButton={false}
                        render={
                          <a
                            href={store.directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        <Navigation className="size-3.5" />
                        Go
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
              No stores in range for this photo yet. Widen the radius or try
              another city — or browse{" "}
              <Link
                href="/local"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Buy Local
              </Link>
              .
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {STOCK_SIMULATION_DISCLAIMER}{" "}
            {placesEngine === "hybrid" || placesEngine === "google-places"
              ? "Google results show live maps data; product shelf status stays simulated."
              : "Add GOOGLE_MAPS_API_KEY (Places API New) for live nearby stores."}
          </p>
        </div>
      )}
    </div>
  );
}

function LocalStoresPanel({
  showLocal,
  locationId,
  maxMiles,
  localMatches,
  country,
  disabled,
  onLocationChange,
  onMilesChange,
  onFind,
}: {
  showLocal: boolean;
  locationId: string;
  maxMiles: (typeof DISTANCE_OPTIONS_MI)[number];
  localMatches: LocalStoreMatch[] | null;
  country: "gb" | "us";
  disabled: boolean;
  onLocationChange: (id: string) => void;
  onMilesChange: (mi: (typeof DISTANCE_OPTIONS_MI)[number]) => void;
  onFind: () => void;
}) {
  const primaryProduct =
    localMatches?.[0]?.matchingProducts[0]?.product.id;

  return (
    <div className="rounded-2xl border border-border/70 bg-white/90 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-heading text-lg font-semibold text-primary">
            <Store className="size-5 text-emerald-800" />
            Find local stores
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Simulated shelf status near you — in stock, limited, or pickup —
            plus partner links when local is thin.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          disabled={disabled}
          onClick={onFind}
        >
          <MapPin className="size-3.5" />
          {showLocal ? "Refresh nearby" : "Find nearby stores"}
        </Button>
      </div>

      <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-amber-950 sm:text-sm">
        {STOCK_SIMULATION_DISCLAIMER}
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Your area
          </label>
          <select
            value={locationId}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          >
            {USER_LOCATION_OPTIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-36">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Within
          </label>
          <select
            value={maxMiles}
            onChange={(e) =>
              onMilesChange(
                Number(e.target.value) as (typeof DISTANCE_OPTIONS_MI)[number]
              )
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          >
            {DISTANCE_OPTIONS_MI.map((mi) => (
              <option key={mi} value={mi}>
                {distanceOptionLabel(mi, country)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showLocal && localMatches && (
        <div className="mt-4 space-y-3">
          {localMatches.length === 0 ? (
            <div className="space-y-3 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                No makers in range carry these items yet. Try a wider radius,
                another city, or check Amazon UK while we grow local stock
                access.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/local" />}
                >
                  Open Buy Local
                </Button>
                <PartnerOutboundButton
                  platformId="amazon"
                  productName="eco sustainable products"
                />
              </div>
            </div>
          ) : (
            localMatches.map(
              ({ maker, distanceMi, matchingProducts, bestAvailability }) => (
                <div
                  key={maker.id}
                  className="rounded-xl border border-border/70 bg-cream/60 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-primary">{maker.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {maker.city} · {formatDistance(distanceMi, country)}
                        {maker.services[0] ? ` · ${maker.services[0]}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <LocalAvailabilityBadge
                        availability={
                          matchingProducts[0]?.availability ?? {
                            status: bestAvailability,
                            etaNote: "Simulated",
                          }
                        }
                      />
                      {maker.shopSlug && (
                        <Button
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          render={<Link href={`/shop/${maker.shopSlug}`} />}
                        >
                          Visit shop
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {maker.blurb}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {matchingProducts.map(({ product, availability }) => (
                      <li
                        key={product.id}
                        className="rounded-lg border border-border/50 bg-white/70 px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-primary">
                              {product.name}
                            </p>
                            <LocalAvailabilityBadge
                              availability={availability}
                              showNote
                              className="mt-1"
                            />
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-primary">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                            If local is thin — check big stores
                          </p>
                          <ProductPartnerLinks product={product} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )
          )}
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-primary"
            nativeButton={false}
            render={
              <Link
                href={`/local?city=${locationId}${
                  primaryProduct ? `&product=${primaryProduct}` : ""
                }`}
              />
            }
          >
            <MapPin className="size-3.5" />
            Open full Buy Local map
          </Button>
        </div>
      )}
    </div>
  );
}

