"use client";

import {
  Briefcase,
  Building2,
  CheckCircle2,
  Leaf,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SERVICE_CATEGORIES } from "@/lib/listing-categories";
import type { SellerApplicationInput, SellerType } from "@/types";

const OFFERING_OPTIONS = [
  ...SERVICE_CATEGORIES,
  "Products / goods",
] as const;

const APPROVAL_STEPS = [
  {
    title: "You apply",
    text: "Tell us who you are — solo professional or company — and what you’ll list.",
  },
  {
    title: "We review",
    text: "A quick eco-credentials check (demo: minutes). We look for clarity, care, and honesty.",
  },
  {
    title: "You list & grow",
    text: "Open your shop, add products or services, and earn while funding causes.",
  },
];

export function BecomeSellerHero() {
  return (
    <div className="mb-8 text-center sm:mb-10">
      <Badge variant="secondary" className="mb-3 gap-1">
        <Sparkles className="size-3" />
        Welcome, makers &amp; professionals
      </Badge>
      <h1 className="font-heading text-3xl font-semibold text-primary sm:text-4xl">
        Become a Forest Buddies seller
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
        Solo makers, self-employed consultants, and eco companies are all
        welcome. Choose how you sell — we’ll meet you there.
      </p>
    </div>
  );
}

export function BecomeSellerPathCards({
  sellerType,
  onSelect,
}: {
  sellerType: SellerType | null;
  onSelect: (type: SellerType) => void;
}) {
  const options = [
    {
      value: "individual" as const,
      icon: UserRound,
      label: "Individual / Self-Employed",
      hint: "Freelancers, solo makers, consultants, coaches",
      points: [
        "Trading name & services",
        "Legal, workshops, repair & more",
        "No company registration required",
      ],
    },
    {
      value: "business" as const,
      icon: Building2,
      label: "Business / Company",
      hint: "Registered brands, studios, and eco shops",
      points: [
        "Brand or company name",
        "Team or multi-SKU catalogs",
        "Goods, rentals & services",
      ],
    },
  ];

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-semibold text-primary">
        1. How do you sell?
      </legend>
      <p className="text-xs text-muted-foreground">
        Pick one — you can refine details after approval.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const selected = sellerType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                  : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-base font-semibold text-primary">
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {opt.hint}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {opt.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-center gap-1.5 text-xs text-foreground/80"
                      >
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-700" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function BecomeSellerApplicationForm({
  onSubmit,
  initial,
}: {
  onSubmit: (application: SellerApplicationInput) => void;
  initial?: Partial<SellerApplicationInput>;
}) {
  const [sellerType, setSellerType] = useState<SellerType | null>(
    initial?.sellerType ?? null
  );
  const [tradingName, setTradingName] = useState(initial?.tradingName ?? "");
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [shopName, setShopName] = useState(initial?.shopName ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [story, setStory] = useState(initial?.story ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [professionalBackground, setProfessionalBackground] = useState(
    initial?.professionalBackground ?? ""
  );
  const [selectedOfferings, setSelectedOfferings] = useState<string[]>(() =>
    (initial?.servicesOffered ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const [error, setError] = useState<string | null>(null);

  const isIndividual = sellerType === "individual";
  const isBusiness = sellerType === "business";

  const servicesOffered = useMemo(
    () => selectedOfferings.join(", "),
    [selectedOfferings]
  );

  function toggleOffering(label: string) {
    setSelectedOfferings((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sellerType) {
      setError("Please choose Individual / Self-Employed or Business / Company.");
      return;
    }

    const resolvedShop =
      (isIndividual
        ? tradingName.trim() || shopName.trim()
        : companyName.trim() || shopName.trim()) || "";

    if (!resolvedShop) {
      setError(
        isIndividual
          ? "Add your trading name so shoppers know who you are."
          : "Add your company or brand name."
      );
      return;
    }

    if (isIndividual && selectedOfferings.length === 0) {
      setError("Select at least one service or product offering.");
      return;
    }

    if (!bio.trim()) {
      setError("A short bio helps shoppers trust you — one or two sentences is enough.");
      return;
    }

    setError(null);
    onSubmit({
      sellerType,
      shopName: resolvedShop,
      bio,
      story,
      location,
      tradingName: isIndividual ? tradingName.trim() || resolvedShop : undefined,
      servicesOffered: servicesOffered || undefined,
      professionalBackground: isIndividual
        ? professionalBackground
        : undefined,
      companyName: isBusiness ? companyName.trim() || resolvedShop : undefined,
    });
  }

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="border-b border-primary/10 bg-gradient-to-br from-emerald-50/80 via-cream to-background">
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Leaf className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Seller application
          </span>
        </div>
        <CardTitle className="font-heading">Tell us about your practice</CardTitle>
        <CardDescription>
          Takes a couple of minutes. Solo professionals and companies use the
          same friendly review — we just ask for the right details.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <BecomeSellerPathCards
            sellerType={sellerType}
            onSelect={(type) => {
              setSellerType(type);
              setError(null);
            }}
          />

          {sellerType && (
            <div className="space-y-4 border-t border-border/60 pt-6">
              <div>
                <p className="text-sm font-semibold text-primary">
                  2.{" "}
                  {isIndividual
                    ? "Your self-employed profile"
                    : "Your company profile"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isIndividual
                    ? "Trading name, what you offer, and a little background."
                    : "Brand details shoppers will see on your public shop."}
                </p>
              </div>

              {isIndividual ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Trading name <span className="text-destructive">*</span>
                    </label>
                    <input
                      required
                      value={tradingName}
                      onChange={(e) => setTradingName(e.target.value)}
                      placeholder="e.g. Leaf Counsel, River Studio"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      The name customers see — your practice, not necessarily a
                      registered company.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Services &amp; offerings{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {OFFERING_OPTIONS.map((opt) => {
                        const on = selectedOfferings.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleOffering(opt)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Professional background
                    </label>
                    <textarea
                      rows={3}
                      value={professionalBackground}
                      onChange={(e) =>
                        setProfessionalBackground(e.target.value)
                      }
                      placeholder="Credentials, years of practice, who you typically help…"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Company / brand name{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. GreenNest Co."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Short bio <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={
                    isIndividual
                      ? "One line that captures your eco mission as a solo practice"
                      : "One line that captures your brand’s eco mission"
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Your story
                </label>
                <textarea
                  rows={4}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Why you started, who you serve, the change you want to grow…"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Location
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Austin, TX · Remote-friendly"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
              </div>

              {isBusiness && (
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    What will you list? (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OFFERING_OPTIONS.map((opt) => {
                      const on = selectedOfferings.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleOffering(opt)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            on
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-3 border-t border-border/60 pt-4">
            <p className="text-sm font-semibold text-primary">
              3. What happens next
            </p>
            <ol className="grid gap-3 sm:grid-cols-3">
              {APPROVAL_STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-border/70 bg-muted/20 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
                    Step {i + 1}
                  </p>
                  <p className="mt-1 text-sm font-medium text-primary">
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={!sellerType}
            >
              <Briefcase className="size-4" />
              Submit seller application
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Free to apply · Demo review is instant after you submit
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
