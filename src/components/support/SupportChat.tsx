"use client";

import { HelpCircle, Leaf, MessageCircle, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SUPPORT_OPEN_EVENT,
  SUPPORT_QUICK_PROMPTS,
  createMessage,
  getSupportReplyAsync,
  type SupportMessage,
} from "@/lib/support-agent";
import { consumeRateLimit } from "@/lib/rate-limit";
import { validateMessage } from "@/lib/validation";

const WELCOME =
  "Hi, I’m Sprout — your friendly Forest Buddies helper. Ask about orders, returns, causes, memberships, or affiliates. (Mock answers for now — Grok can join later.)";

/** Keep sticky checkout / place-order clear of the chat FAB */
const HIDE_FAB_PREFIXES = ["/checkout"];

export function SupportChat() {
  const pathname = usePathname();
  const hideFab = HIDE_FAB_PREFIXES.some((p) => pathname?.startsWith(p));
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>(() => [
    createMessage("assistant", WELCOME),
  ]);
  const [suggestions, setSuggestions] = useState(SUPPORT_QUICK_PROMPTS);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hideFab) setOpen(false);
  }, [hideFab]);

  useEffect(() => {
    const openChat = () => {
      if (hideFab) return;
      setOpen(true);
    };
    window.addEventListener(SUPPORT_OPEN_EVENT, openChat);
    const onHash = () => {
      if (hideFab) return;
      if (window.location.hash === "#support" || window.location.hash === "#help") {
        setOpen(true);
      }
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener(SUPPORT_OPEN_EVENT, openChat);
      window.removeEventListener("hashchange", onHash);
    };
  }, [hideFab]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open, busy]);

  async function send(text: string) {
    const checked = validateMessage(text, {
      required: true,
      min: 1,
      max: 1000,
      label: "Message",
    });
    if (!checked.ok || busy) {
      if (!checked.ok) setSendError(checked.error);
      return;
    }
    const rate = consumeRateLimit("support");
    if (!rate.allowed) {
      setSendError(rate.message);
      return;
    }
    setSendError(null);
    setInput("");
    setMessages((prev) => [...prev, createMessage("user", checked.value)]);
    setBusy(true);
    const reply = await getSupportReplyAsync(checked.value);
    setMessages((prev) => [...prev, createMessage("assistant", reply.text)]);
    setSuggestions(reply.suggestions);
    setBusy(false);
  }

  if (hideFab) return null;

  return (
    <>
      {/* Floating help button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed right-4 bottom-4 z-[55] flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:right-6 sm:bottom-6"
        aria-label={open ? "Close support chat" : "Open support chat"}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {open && (
        <div
          className="fixed right-4 bottom-20 z-[55] flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-3xl border border-border bg-cream shadow-2xl sm:right-6 sm:bottom-24"
          role="dialog"
          aria-label="Customer support chat"
        >
          <header className="flex items-center justify-between gap-2 border-b border-border/70 bg-gradient-to-r from-forest to-emerald-800 px-4 py-3 text-cream">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-cream/15">
                <Leaf className="size-4 text-sage" />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-base font-semibold leading-tight">
                  Sprout · Support
                </p>
                <p className="text-[11px] text-cream/75">Usually replies in a blink</p>
              </div>
            </div>
            <Badge className="shrink-0 bg-cream/15 text-cream">Mock</Badge>
          </header>

          <div
            ref={listRef}
            className="flex max-h-[min(50vh,22rem)] flex-col gap-3 overflow-y-auto px-3 py-3 sm:px-4"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/70 bg-white text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border/70 bg-white px-3.5 py-2.5 text-sm text-muted-foreground">
                  Sprout is thinking…
                </div>
              </div>
            )}
          </div>

          {suggestions.length > 0 && !busy && (
            <div className="flex flex-wrap gap-1.5 border-t border-border/50 px-3 py-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-emerald-200 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-medium text-emerald-950 hover:bg-emerald-100"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            className="flex items-end gap-2 border-t border-border/70 bg-white/80 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about orders, returns…"
              maxLength={1000}
              className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Message Sprout"
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0"
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
          {sendError && (
            <p className="border-t border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
              {sendError}
            </p>
          )}

          <p className="border-t border-border/50 bg-cream px-3 py-2 text-center text-[11px] text-muted-foreground">
            Prefer a form?{" "}
            <Link
              href="/feedback"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => setOpen(false)}
            >
              Share feedback
            </Link>
          </p>
        </div>
      )}
    </>
  );
}

/** Compact footer / inline control to open the chat. */
export function SupportChatTrigger({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event(SUPPORT_OPEN_EVENT));
      }}
      className={className}
    >
      {children ?? (
        <span className="inline-flex items-center gap-1.5">
          <HelpCircle className="size-3.5" />
          Chat with support
        </span>
      )}
    </button>
  );
}
