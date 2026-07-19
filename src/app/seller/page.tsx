"use client";

import Link from "next/link";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Download,
  FileSpreadsheet,
  Leaf,
  Pencil,
  Plus,
  ShoppingBag,
  Store,
  Tags,
  Trash2,
  TrendingUp,
  Upload,
  Wallet,
  X,
} from "lucide-react";

import { MarketingShell } from "@/components/layout/marketing-shell";
import {
  BecomeSellerApplicationForm,
  BecomeSellerHero,
} from "@/components/seller/become-seller-application";
import { SellerAccountControls } from "@/components/seller/seller-account-controls";
import { productStatusBadge } from "@/components/seller/seller-hub-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useSeller } from "@/contexts/seller-context";
import type {
  ListingType,
  ProductApprovalStatus,
  SellerProduct,
  SellerType,
  ServiceDeliveryMode,
} from "@/types";
import {
  DELIVERY_MODE_LABELS,
  PRODUCT_CATEGORIES,
  categoriesForListingType,
  defaultCategoryFor,
  listingTypeLabel,
} from "@/lib/listing-categories";
import { getCause } from "@/lib/causes";
import { apparelSizeChart } from "@/lib/product-details";

const SellerOverviewPanel = lazy(() =>
  import("@/components/seller/seller-overview-panel").then((m) => ({
    default: m.SellerOverviewPanel,
  }))
);
const SellerAnalyticsPanel = lazy(() =>
  import("@/components/seller/seller-analytics-panel").then((m) => ({
    default: m.SellerAnalyticsPanel,
  }))
);
const SellerEarningsPanel = lazy(() =>
  import("@/components/seller/seller-earnings-panel").then((m) => ({
    default: m.SellerEarningsPanel,
  }))
);

function SellerPanelFallback() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/80" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-muted/70" />
    </div>
  );
}

const CSV_HEADERS = [
  "title",
  "subtitle",
  "description",
  "category",
  "tags",
  "price",
  "eco_score",
  "stock",
] as const;

const emptyForm = {
  listingType: "product" as ListingType,
  name: "",
  subtitle: "",
  description: "",
  category: "Kitchen",
  tags: [] as string[],
  tagInput: "",
  price: "",
  ecoScore: "90",
  stock: "25",
  materials: "",
  madeIn: "",
  careNotes: "",
  fitGuide: "",
  dimensions: "",
  includeSizeChart: false,
  sizeChartNote: "",
  duration: "",
  deliveryMode: "remote" as ServiceDeliveryMode,
  availabilityNote: "",
};

type ProductDraft = {
  name: string;
  subtitle: string;
  description: string;
  category: string;
  tags: string;
  price: string;
  ecoScore: string;
  stock: string;
};

const emptyDraft = (): ProductDraft => ({
  name: "",
  subtitle: "",
  description: "",
  category: "Kitchen",
  tags: "",
  price: "",
  ecoScore: "90",
  stock: "25",
});

type SellerTab = "overview" | "products" | "analytics" | "earnings" | "profile";
type ProductPanel = "none" | "single" | "bulk";

function parseTags(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 12);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsvProducts(text: string): {
  products: Omit<SellerProduct, "id" | "createdAt">[];
  errors: string[];
} {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { products: [], errors: ["CSV needs a header row and at least one product."] };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const idx = (key: string) => header.indexOf(key);

  if (idx("title") < 0 && idx("name") < 0) {
    return {
      products: [],
      errors: ["CSV must include a title (or name) column."],
    };
  }

  const products: Omit<SellerProduct, "id" | "createdAt">[] = [];
  const errors: string[] = [];

  lines.slice(1).forEach((line, rowIndex) => {
    const cells = parseCsvLine(line);
    const get = (keys: string[]) => {
      for (const key of keys) {
        const i = idx(key);
        if (i >= 0 && cells[i] !== undefined) return cells[i];
      }
      return "";
    };

    const name = get(["title", "name"]).trim();
    if (!name) {
      errors.push(`Row ${rowIndex + 2}: missing title.`);
      return;
    }

    const category = get(["category"]) || "Home";
    products.push({
      name,
      subtitle: get(["subtitle"]).trim(),
      description: get(["description", "desc"]).trim(),
      category: (PRODUCT_CATEGORIES as readonly string[]).includes(category)
        ? category
        : category || "Home",
      tags: parseTags(get(["tags", "keywords"])),
      price: Math.max(0, Number(get(["price"])) || 0),
      ecoScore: Math.min(100, Math.max(0, Number(get(["eco_score", "ecoscore", "eco"])) || 80)),
      stock: Math.max(0, Number(get(["stock", "quantity"])) || 0),
      listingType: "product",
      status: "pending",
      views: 0,
      sales: 0,
    });
  });

  return { products, errors };
}

function downloadCsvTemplate() {
  const sample = [
    CSV_HEADERS.join(","),
    '"Bamboo Toothbrush","Plastic-free daily care","FSC bamboo handle with soft plant-based bristles",Beauty,"bamboo,zero waste,oral care",6.50,96,120',
    '"Organic Cotton Tote","Everyday reusable bag","Heavyweight organic cotton tote for groceries and errands",Accessories,"organic,tote,reuse",18.00,92,80',
  ].join("\n");
  const blob = new Blob([sample], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "forest-buddies-products-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function SellerPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    seller,
    loading: sellerLoading,
    applyAsSeller,
    simulateApproval,
    resumeSeller,
    addProduct,
    addProducts,
    updateProduct,
    deleteProduct,
    requestPayout,
    updateSellerProfile,
  } = useSeller();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<SellerTab>("overview");
  const [shopName, setShopName] = useState("");
  const [bio, setBio] = useState("");
  const [story, setStory] = useState("");
  const [sellerType, setSellerType] = useState<SellerType>("business");
  const [tradingName, setTradingName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [servicesOffered, setServicesOffered] = useState("");
  const [professionalBackground, setProfessionalBackground] = useState("");
  const [location, setLocation] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [confirmTypeSwitch, setConfirmTypeSwitch] = useState(false);
  const [panel, setPanel] = useState<ProductPanel>("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [bulkMode, setBulkMode] = useState<"csv" | "form">("csv");
  const [bulkDrafts, setBulkDrafts] = useState<ProductDraft[]>([
    emptyDraft(),
    emptyDraft(),
    emptyDraft(),
  ]);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [catalogFilter, setCatalogFilter] = useState<
    "All" | ProductApprovalStatus
  >("All");

  useEffect(() => {
    if (seller && seller.status === "approved") {
      setShopName(seller.shopName);
      setBio(seller.bio);
      setStory(seller.story ?? "");
      setSellerType(seller.sellerType ?? "business");
      setTradingName(seller.tradingName ?? "");
      setCompanyName(seller.companyName ?? "");
      setServicesOffered(seller.servicesOffered ?? "");
      setProfessionalBackground(seller.professionalBackground ?? "");
      setLocation(seller.location ?? "");
    }
  }, [seller]);

  if (authLoading || sellerLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-muted-foreground">
        Loading seller hub…
      </div>
    );
  }

  // Logged out — welcoming gate with sign-in
  if (!user) {
    return (
      <MarketingShell>
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <BecomeSellerHero />
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="font-heading">Sign in to apply</CardTitle>
              <CardDescription>
                Create a free account — then choose Individual / Self-Employed
                or Business / Company in a short application.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button
                nativeButton={false}
                render={<Link href="/login" />}
                className="flex-1"
              >
                Sign in to continue
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/register" />}
                variant="outline"
                className="flex-1"
              >
                Create free account
              </Button>
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already selling?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-2 hover:underline">
              Open Seller Hub
            </Link>
          </p>
        </div>
      </MarketingShell>
    );
  }

  // Not applied yet — or canceled (re-apply)
  if (!seller || seller.status === "none") {
    const isReapply = Boolean(
      seller?.canceledAt || (seller?.products?.length ?? 0) > 0
    );
    return (
      <MarketingShell>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          <BecomeSellerHero />
          {isReapply && seller && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950">
              <p className="font-medium">Welcome back</p>
              <p className="mt-1 text-emerald-900/85">
                Your previous catalog ({seller.products.length} listing
                {seller.products.length === 1 ? "" : "s"}) and earnings are
                still saved. Submit a new application to sell again — listings
                stay hidden until you&apos;re approved.
              </p>
            </div>
          )}
          <BecomeSellerApplicationForm
            onSubmit={applyAsSeller}
            initial={
              seller
                ? {
                    sellerType: seller.sellerType,
                    shopName: seller.shopName,
                    bio: seller.bio,
                    story: seller.story,
                    location: seller.location,
                    tradingName: seller.tradingName,
                    servicesOffered: seller.servicesOffered,
                    professionalBackground: seller.professionalBackground,
                    companyName: seller.companyName,
                  }
                : undefined
            }
          />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Prefer to browse first?{" "}
            <Link
              href="/shop"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              See seller shops
            </Link>{" "}
            or{" "}
            <Link
              href="/marketplace"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              the marketplace
            </Link>
            .
          </p>
        </div>
      </MarketingShell>
    );
  }

  // Pending approval
  if (seller.status === "pending") {
    const isSolo = seller.sellerType === "individual";
    return (
      <MarketingShell>
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-gold/20">
              <Leaf className="size-7 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-semibold text-primary sm:text-3xl">
              You&apos;re on the list
            </h1>
            <p className="mt-2 text-muted-foreground">
              <strong>{seller.shopName}</strong> is under review. We check eco
              clarity and fit — usually quick in this demo.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge className="bg-gold/25 text-primary">Pending review</Badge>
              <Badge
                variant="outline"
                className={
                  isSolo ? "border-sky-300 bg-sky-50 text-sky-900" : undefined
                }
              >
                {isSolo ? "Individual / Self-Employed" : "Business / Company"}
              </Badge>
            </div>
          </div>

          <Card className="mt-8 border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg">
                Application summary
              </CardTitle>
              <CardDescription>
                Submitted{" "}
                {seller.appliedAt
                  ? new Date(seller.appliedAt).toLocaleDateString()
                  : "recently"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isSolo && seller.tradingName && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Trading name
                  </p>
                  <p>{seller.tradingName}</p>
                </div>
              )}
              {!isSolo && seller.companyName && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Company
                  </p>
                  <p>{seller.companyName}</p>
                </div>
              )}
              {seller.servicesOffered && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Offerings
                  </p>
                  <p>{seller.servicesOffered}</p>
                </div>
              )}
              {seller.professionalBackground && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Background
                  </p>
                  <p className="text-muted-foreground">
                    {seller.professionalBackground}
                  </p>
                </div>
              )}
              {seller.bio && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Bio</p>
                  <p>{seller.bio}</p>
                </div>
              )}
              {seller.location && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Location
                  </p>
                  <p>{seller.location}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 rounded-2xl border border-dashed border-primary/25 bg-card p-5">
            <p className="text-sm font-medium text-primary">Approval process</p>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>1. Our team reviews your application (demo: you can unlock below).</li>
              <li>2. Once approved, list products or bookable services.</li>
              <li>3. Shoppers find you on Marketplace and your public shop.</li>
            </ol>
            <Button onClick={simulateApproval} className="mt-5 w-full">
              Simulate approval (demo)
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Production uses the Admin → Sellers queue instead of this button.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/marketplace" />}
            >
              Browse marketplace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </MarketingShell>
    );
  }

  // Paused — shop & listings hidden; resume or cancel
  if (seller.status === "paused") {
    return (
      <SellerShell shopName={seller.shopName}>
        <div className="mx-auto max-w-xl space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-100">
              <Store className="size-7 text-amber-900" />
            </div>
            <h1 className="font-heading text-2xl font-semibold text-primary">
              Selling paused
            </h1>
            <p className="mt-2 text-muted-foreground">
              <strong>{seller.shopName}</strong> is hidden from shoppers. Your
              listings and earnings are safe — resume when you&apos;re ready, or
              leave the program and re-apply later.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                What&apos;s hidden right now
              </CardTitle>
              <CardDescription>
                Soft pause — nothing was deleted from your catalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                · Public shop page (/shop/{seller.slug}) not listed
              </p>
              <p>
                · {seller.products.length} listing
                {seller.products.length === 1 ? "" : "s"} kept offline
              </p>
              <p>· Earnings &amp; payout history unchanged</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Seller status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SellerAccountControls />
            </CardContent>
          </Card>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={resumeSeller}
            >
              Resume selling
            </Button>
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </SellerShell>
    );
  }

  // Rejected — allow re-apply
  if (seller.status === "rejected") {
    return (
      <MarketingShell>
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-8 text-center">
            <h1 className="font-heading text-2xl font-semibold text-primary sm:text-3xl">
              Let&apos;s try again
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your previous application for <strong>{seller.shopName}</strong>{" "}
              wasn&apos;t approved. Update your details — especially eco clarity
              — and resubmit. Solo makers and companies are still welcome.
            </p>
          </div>
          <BecomeSellerApplicationForm
            onSubmit={applyAsSeller}
            initial={{
              sellerType: seller.sellerType,
              shopName: seller.shopName,
              bio: seller.bio,
              story: seller.story,
              location: seller.location,
              tradingName: seller.tradingName,
              servicesOffered: seller.servicesOffered,
              professionalBackground: seller.professionalBackground,
              companyName: seller.companyName,
            }}
          />
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              Back to dashboard
            </Button>
          </div>
        </div>
      </MarketingShell>
    );
  }

  // Approved seller dashboard
  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setPanel("single");
    setTab("products");
  }

  function openBulk() {
    setEditingId(null);
    setBulkMessage(null);
    setBulkError(null);
    setBulkMode("csv");
    setBulkDrafts([emptyDraft(), emptyDraft(), emptyDraft()]);
    setPanel("bulk");
    setTab("products");
  }

  function closePanel() {
    setPanel("none");
    setEditingId(null);
    setForm(emptyForm);
    setBulkMessage(null);
    setBulkError(null);
  }

  function openEdit(product: SellerProduct) {
    setEditingId(product.id);
    setForm({
      listingType: product.listingType === "service" ? "service" : "product",
      name: product.name,
      subtitle: product.subtitle ?? "",
      description: product.description,
      category: product.category,
      tags: product.tags ?? [],
      tagInput: "",
      price: String(product.price),
      ecoScore: String(product.ecoScore),
      stock: String(product.stock),
      materials: product.materials ?? "",
      madeIn: product.madeIn ?? "",
      careNotes: product.careNotes ?? "",
      fitGuide: product.fitGuide ?? "",
      dimensions: product.dimensions ?? "",
      includeSizeChart: Boolean(product.sizeChart?.rows?.length),
      sizeChartNote: product.sizeChart?.note ?? "",
      duration: product.duration ?? "",
      deliveryMode: product.deliveryMode ?? "remote",
      availabilityNote: product.availabilityNote ?? "",
    });
    setPanel("single");
    setTab("products");
  }

  function addTagFromInput() {
    const next = parseTags(form.tagInput);
    if (next.length === 0) return;
    setForm((f) => ({
      ...f,
      tags: [...new Set([...f.tags, ...next])].slice(0, 12),
      tagInput: "",
    }));
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    const existing = editingId
      ? seller?.products.find((p) => p.id === editingId)
      : undefined;
    const isService = form.listingType === "service";
    const payload: Omit<SellerProduct, "id" | "createdAt"> = {
      listingType: form.listingType,
      name: form.name.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      category: form.category,
      tags: form.tags,
      price: Number(form.price) || 0,
      ecoScore: Math.min(100, Math.max(0, Number(form.ecoScore) || 0)),
      stock: Math.max(0, Number(form.stock) || 0),
      materials: form.materials.trim() || undefined,
      madeIn: form.madeIn.trim() || undefined,
      careNotes: isService ? undefined : form.careNotes.trim() || undefined,
      fitGuide: isService ? undefined : form.fitGuide.trim() || undefined,
      dimensions: isService ? undefined : form.dimensions.trim() || undefined,
      sizeChart:
        !isService && form.includeSizeChart
          ? apparelSizeChart(form.sizeChartNote.trim() || undefined)
          : undefined,
      duration: isService ? form.duration.trim() || undefined : undefined,
      deliveryMode: isService ? form.deliveryMode : undefined,
      availabilityNote: isService
        ? form.availabilityNote.trim() || undefined
        : undefined,
      status: "pending",
      views: 0,
      sales: 0,
      // Preserve storytelling assets when editing
      imageUrl: existing?.imageUrl,
      gallery: existing?.gallery,
      storySnippet: existing?.storySnippet,
      impactNote: existing?.impactNote,
    };
    if (!payload.name) return;

    if (editingId) {
      updateProduct(editingId, {
        ...payload,
        views: existing?.views ?? 0,
        sales: existing?.sales ?? 0,
        status: existing?.status ?? "pending",
      });
    } else {
      addProduct(payload);
    }
    closePanel();
  }

  function draftToPayload(
    draft: ProductDraft
  ): Omit<SellerProduct, "id" | "createdAt"> | null {
    const name = draft.name.trim();
    if (!name) return null;
    return {
      listingType: "product",
      name,
      subtitle: draft.subtitle.trim(),
      description: draft.description.trim(),
      category: draft.category,
      tags: parseTags(draft.tags),
      price: Math.max(0, Number(draft.price) || 0),
      ecoScore: Math.min(100, Math.max(0, Number(draft.ecoScore) || 80)),
      stock: Math.max(0, Number(draft.stock) || 0),
      status: "pending",
      views: 0,
      sales: 0,
    };
  }

  function saveBulkForm(e: React.FormEvent) {
    e.preventDefault();
    setBulkError(null);
    const payloads = bulkDrafts
      .map(draftToPayload)
      .filter((p): p is Omit<SellerProduct, "id" | "createdAt"> => p !== null);

    if (payloads.length === 0) {
      setBulkError("Add at least one product with a title.");
      return;
    }

    const count = addProducts(payloads);
    setBulkMessage(`Listed ${count} sustainable product${count === 1 ? "" : "s"}.`);
    setBulkDrafts([emptyDraft(), emptyDraft()]);
  }

  async function handleCsvFile(file: File) {
    setBulkError(null);
    setBulkMessage(null);
    try {
      const text = await file.text();
      const { products, errors } = parseCsvProducts(text);
      if (products.length === 0) {
        setBulkError(errors[0] || "No valid products found in CSV.");
        return;
      }
      const count = addProducts(products);
      setBulkMessage(
        `Imported ${count} product${count === 1 ? "" : "s"} from CSV.` +
          (errors.length ? ` (${errors.length} row${errors.length === 1 ? "" : "s"} skipped)` : "")
      );
    } catch {
      setBulkError("Could not read that CSV file. Try the template format.");
    }
  }

  const pendingCount = useMemo(
    () => seller.products.filter((p) => p.status === "pending").length,
    [seller.products]
  );
  const approvedCount = useMemo(
    () => seller.products.filter((p) => p.status === "approved").length,
    [seller.products]
  );
  const rejectedCount = useMemo(
    () => seller.products.filter((p) => p.status === "rejected").length,
    [seller.products]
  );
  const catalogProducts = useMemo(
    () =>
      seller.products.filter(
        (p) =>
          catalogFilter === "All" || (p.status ?? "pending") === catalogFilter
      ),
    [seller.products, catalogFilter]
  );

  const tabs: { id: SellerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "products", label: "Products", icon: ShoppingBag },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "earnings", label: "Earnings", icon: Wallet },
    { id: "profile", label: "Profile", icon: Store },
  ];

  return (
    <SellerShell shopName={seller.shopName}>
      <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-xl font-semibold text-primary sm:text-3xl">
              {seller.shopName}
            </h1>
            <Badge className="bg-emerald-100 text-emerald-800">Approved</Badge>
            <Badge
              className={
                seller.trustTier === "trusted"
                  ? "bg-emerald-100 text-emerald-800"
                  : seller.trustTier === "standard"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              }
            >
              {seller.trustTier === "trusted"
                ? "Trusted"
                : seller.trustTier === "standard"
                  ? "Standard"
                  : "New seller"}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {seller.bio || "Your eco seller dashboard"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openBulk} className="gap-1.5 flex-1 sm:flex-none">
            <Upload className="size-4" />
            Bulk upload
          </Button>
          <Button onClick={openAdd} className="gap-1.5 flex-1 sm:flex-none">
            <Plus className="size-4" />
            Add product
          </Button>
        </div>
      </div>

      <nav className="scrollbar-none -mx-3 mb-6 flex gap-1 overflow-x-auto px-3 pb-1 sm:mx-0 sm:mb-8 sm:px-0">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:bg-muted hover:text-primary"
            }`}
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <Suspense fallback={<SellerPanelFallback />}>
          <SellerOverviewPanel seller={seller} onTab={setTab} />
        </Suspense>
      )}

      {tab === "products" && (
        <div className="space-y-6">
          {panel === "single" && (
            <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-emerald-50/80 via-background to-cream">
              <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-primary/10 pb-4">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-primary">
                    <Leaf className="size-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Eco listing
                    </span>
                  </div>
                  <CardTitle className="font-heading">
                    {editingId ? "Edit listing" : "Add a listing"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Products or bookable services (legal, consulting,
                    workshops…). New listings go to admin approval.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={closePanel}>
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <form
                  onSubmit={saveProduct}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <fieldset className="sm:col-span-2">
                    <legend className="mb-2 text-xs font-medium text-muted-foreground">
                      Listing type
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          {
                            value: "product" as const,
                            label: "Product",
                            hint: "Physical or digital goods",
                          },
                          {
                            value: "service" as const,
                            label: "Service",
                            hint: "Legal, consulting, workshops…",
                          },
                        ] as const
                      ).map((opt) => (
                        <label
                          key={opt.value}
                          className={`cursor-pointer rounded-xl border px-3 py-3 text-sm transition-colors ${
                            form.listingType === opt.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-input bg-background hover:bg-muted/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name="listingType"
                            value={opt.value}
                            checked={form.listingType === opt.value}
                            onChange={() =>
                              setForm((f) => ({
                                ...f,
                                listingType: opt.value,
                                category: defaultCategoryFor(opt.value),
                                includeSizeChart: false,
                                stock:
                                  opt.value === "service"
                                    ? "6"
                                    : f.stock || "25",
                              }))
                            }
                            className="sr-only"
                          />
                          <span className="block font-medium">{opt.label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {opt.hint}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Title
                    </label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder={
                        form.listingType === "service"
                          ? "e.g. Solo Founder Legal Hour"
                          : "e.g. Bamboo Travel Cutlery Set"
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Subtitle
                    </label>
                    <input
                      value={form.subtitle}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, subtitle: e.target.value }))
                      }
                      placeholder={
                        form.listingType === "service"
                          ? "Who it’s for and what they leave with"
                          : "Short line that highlights the eco benefit"
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Tags className="size-3.5" />
                      Keywords / tags
                    </label>
                    <div className="flex flex-wrap gap-1.5 rounded-lg border border-input bg-background px-2 py-2">
                      {form.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 hover:bg-emerald-200"
                        >
                          {tag}
                          <X className="size-3" />
                        </button>
                      ))}
                      <input
                        value={form.tagInput}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, tagInput: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addTagFromInput();
                          }
                        }}
                        onBlur={addTagFromInput}
                        placeholder={
                          form.tags.length
                            ? "Add another…"
                            : form.listingType === "service"
                              ? "legal, remote, workshop…"
                              : "bamboo, zero waste, organic…"
                        }
                        className="min-w-[10rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Press Enter or comma to add. Up to 12 tags.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => {
                        const category = e.target.value;
                        setForm((f) => ({
                          ...f,
                          category,
                          includeSizeChart:
                            f.listingType === "product" &&
                            category === "Apparel"
                              ? true
                              : f.includeSizeChart,
                        }));
                      }}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    >
                      {categoriesForListingType(form.listingType).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Price ($)
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, price: e.target.value }))
                      }
                      placeholder="24.00"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Eco score (0–100)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={form.ecoScore}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, ecoScore: e.target.value }))
                        }
                        className="w-full accent-emerald-700"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.ecoScore}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, ecoScore: e.target.value }))
                        }
                        className="w-16 rounded-lg border border-input bg-background px-2 py-2 text-center text-sm tabular-nums"
                      />
                    </div>
                    <p className="mt-1 text-xs text-emerald-800/80">
                      Higher scores signal stronger sustainability credentials.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {form.listingType === "service"
                        ? "Bookable slots"
                        : "Stock"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, stock: e.target.value }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      placeholder={
                        form.listingType === "service"
                          ? "What’s included, who it’s for, and how the session works."
                          : "Who it’s for, how it feels, what makes it last — rich detail reduces returns."
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  {form.listingType === "service" && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Duration
                        </label>
                        <input
                          value={form.duration}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              duration: e.target.value,
                            }))
                          }
                          placeholder="e.g. 60 min, half day"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Delivery
                        </label>
                        <select
                          value={form.deliveryMode}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              deliveryMode: e.target
                                .value as ServiceDeliveryMode,
                            }))
                          }
                          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                        >
                          {(
                            Object.keys(
                              DELIVERY_MODE_LABELS
                            ) as ServiceDeliveryMode[]
                          ).map((mode) => (
                            <option key={mode} value={mode}>
                              {DELIVERY_MODE_LABELS[mode]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Availability note
                        </label>
                        <input
                          value={form.availabilityNote}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              availabilityNote: e.target.value,
                            }))
                          }
                          placeholder="e.g. Tue–Thu mornings · confirm within 24h"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                        />
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {form.listingType === "service"
                        ? "What’s included"
                        : "Materials"}
                    </label>
                    <input
                      value={form.materials}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, materials: e.target.value }))
                      }
                      placeholder={
                        form.listingType === "service"
                          ? "e.g. Written summary + checklist PDF"
                          : "e.g. 55% organic hemp / 45% organic cotton"
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {form.listingType === "service"
                        ? "Based in / coverage"
                        : "Made in"}
                    </label>
                    <input
                      value={form.madeIn}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, madeIn: e.target.value }))
                      }
                      placeholder={
                        form.listingType === "service"
                          ? "e.g. Austin, TX (remote nationwide)"
                          : "e.g. Portugal"
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  {form.listingType === "product" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Dimensions
                    </label>
                    <input
                      value={form.dimensions}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, dimensions: e.target.value }))
                      }
                      placeholder="e.g. 38 × 42 cm · 12 L"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  )}
                  {form.listingType === "product" && (
                    <>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Care instructions
                    </label>
                    <textarea
                      rows={2}
                      value={form.careNotes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, careNotes: e.target.value }))
                      }
                      placeholder="Wash, dry, store — be specific to avoid damage returns."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Fit guide
                    </label>
                    <textarea
                      rows={2}
                      value={form.fitGuide}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fitGuide: e.target.value }))
                      }
                      placeholder="Who it fits, model height/size, whether to size up or down…"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 rounded-xl border border-border/70 bg-secondary/20 p-3.5">
                    <label className="flex items-start gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={form.includeSizeChart}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            includeSizeChart: e.target.checked,
                          }))
                        }
                        className="mt-1 accent-emerald-700"
                      />
                      <span>
                        <span className="font-medium text-primary">
                          Include EU / UK / US size chart
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Recommended for apparel. Shows a standard conversion
                          table on the product page.
                        </span>
                      </span>
                    </label>
                    {form.includeSizeChart && (
                      <input
                        value={form.sizeChartNote}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            sizeChartNote: e.target.value,
                          }))
                        }
                        placeholder="Size note: e.g. True to size — size up for a relaxed fit"
                        className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                      />
                    )}
                  </div>
                    </>
                  )}
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <Button type="submit" className="gap-1.5">
                      <Leaf className="size-4" />
                      {editingId
                        ? "Save changes"
                        : form.listingType === "service"
                          ? "List service"
                          : "List product"}
                    </Button>
                    <Button type="button" variant="outline" onClick={closePanel}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {panel === "bulk" && (
            <Card className="overflow-hidden border-primary/25">
              <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-primary/10 bg-emerald-50/50 pb-4">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-primary">
                    <FileSpreadsheet className="size-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Bulk upload
                    </span>
                  </div>
                  <CardTitle className="font-heading">
                    Add multiple products
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Upload a CSV or fill a few rows at once — same eco fields as
                    the single form.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={closePanel}>
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={bulkMode === "csv" ? "default" : "outline"}
                    onClick={() => setBulkMode("csv")}
                    className="gap-1.5"
                  >
                    <Upload className="size-3.5" />
                    CSV file
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={bulkMode === "form" ? "default" : "outline"}
                    onClick={() => setBulkMode("form")}
                    className="gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Quick form
                  </Button>
                </div>

                {bulkMessage && (
                  <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-900">
                    {bulkMessage}
                  </p>
                )}
                {bulkError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                    {bulkError}
                  </p>
                )}

                {bulkMode === "csv" ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 px-5 py-8 text-center">
                      <Upload className="mx-auto size-8 text-primary/70" />
                      <p className="mt-3 text-sm font-medium text-foreground">
                        Drop a CSV or choose a file
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Columns: title, subtitle, description, category, tags,
                        price, eco_score, stock
                      </p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-1.5"
                        >
                          <Upload className="size-4" />
                          Choose CSV
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadCsvTemplate}
                          className="gap-1.5"
                        >
                          <Download className="size-4" />
                          Download template
                        </Button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleCsvFile(file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <form onSubmit={saveBulkForm} className="space-y-4">
                    {bulkDrafts.map((draft, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-border/80 bg-muted/20 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                            Product {index + 1}
                          </span>
                          {bulkDrafts.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-destructive"
                              onClick={() =>
                                setBulkDrafts((rows) =>
                                  rows.filter((_, i) => i !== index)
                                )
                              }
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-muted-foreground">
                              Title
                            </label>
                            <input
                              value={draft.name}
                              onChange={(e) =>
                                setBulkDrafts((rows) =>
                                  rows.map((r, i) =>
                                    i === index
                                      ? { ...r, name: e.target.value }
                                      : r
                                  )
                                )
                              }
                              placeholder="Product title"
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-muted-foreground">
                              Subtitle
                            </label>
                            <input
                              value={draft.subtitle}
                              onChange={(e) =>
                                setBulkDrafts((rows) =>
                                  rows.map((r, i) =>
                                    i === index
                                      ? { ...r, subtitle: e.target.value }
                                      : r
                                  )
                                )
                              }
                              placeholder="Eco benefit line"
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">
                              Category
                            </label>
                            <select
                              value={draft.category}
                              onChange={(e) =>
                                setBulkDrafts((rows) =>
                                  rows.map((r, i) =>
                                    i === index
                                      ? { ...r, category: e.target.value }
                                      : r
                                  )
                                )
                              }
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            >
                              {PRODUCT_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">
                              Price ($)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft.price}
                              onChange={(e) =>
                                setBulkDrafts((rows) =>
                                  rows.map((r, i) =>
                                    i === index
                                      ? { ...r, price: e.target.value }
                                      : r
                                  )
                                )
                              }
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">
                              Eco score
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={draft.ecoScore}
                              onChange={(e) =>
                                setBulkDrafts((rows) =>
                                  rows.map((r, i) =>
                                    i === index
                                      ? { ...r, ecoScore: e.target.value }
                                      : r
                                  )
                                )
                              }
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">
                              Stock
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={draft.stock}
                              onChange={(e) =>
                                setBulkDrafts((rows) =>
                                  rows.map((r, i) =>
                                    i === index
                                      ? { ...r, stock: e.target.value }
                                      : r
                                  )
                                )
                              }
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-muted-foreground">
                              Tags (comma-separated)
                            </label>
                            <input
                              value={draft.tags}
                              onChange={(e) =>
                                setBulkDrafts((rows) =>
                                  rows.map((r, i) =>
                                    i === index
                                      ? { ...r, tags: e.target.value }
                                      : r
                                  )
                                )
                              }
                              placeholder="bamboo, organic, refill"
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-muted-foreground">
                              Description
                            </label>
                            <input
                              value={draft.description}
                              onChange={(e) =>
                                setBulkDrafts((rows) =>
                                  rows.map((r, i) =>
                                    i === index
                                      ? { ...r, description: e.target.value }
                                      : r
                                  )
                                )
                              }
                              placeholder="Brief product description"
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setBulkDrafts((rows) => [...rows, emptyDraft()])
                        }
                        className="gap-1.5"
                      >
                        <Plus className="size-4" />
                        Add another row
                      </Button>
                      <Button type="submit" className="gap-1.5">
                        <Leaf className="size-4" />
                        List all products
                      </Button>
                      <Button type="button" variant="ghost" onClick={closePanel}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="space-y-3 border-b pb-4">
              <div className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-heading text-lg">
                    Your catalog
                  </CardTitle>
                  <CardDescription>
                    {seller.products.length} listing
                    {seller.products.length === 1 ? "" : "s"} · {approvedCount}{" "}
                    live
                  </CardDescription>
                </div>
                {panel === "none" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openBulk}
                      className="gap-1"
                    >
                      <Upload className="size-3.5" />
                      Bulk
                    </Button>
                    <Button size="sm" onClick={openAdd} className="gap-1">
                      <Plus className="size-3.5" />
                      Add
                    </Button>
                  </div>
                )}
              </div>
              {seller.products.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["All", "All"],
                      ["pending", "Pending"],
                      ["approved", "Approved"],
                      ["rejected", "Rejected"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCatalogFilter(value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        catalogFilter === value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-foreground/70 hover:text-primary"
                      }`}
                    >
                      {label}
                      <span className="ml-1 opacity-70">
                        (
                        {value === "All"
                          ? seller.products.length
                          : value === "pending"
                            ? pendingCount
                            : value === "approved"
                              ? approvedCount
                              : rejectedCount}
                        )
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="divide-y p-0">
              {seller.products.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <Leaf className="size-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground">
                    Grow your eco catalog
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add one listing or upload several from a CSV.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button onClick={openAdd} className="gap-1.5">
                      <Plus className="size-4" />
                      Add product
                    </Button>
                    <Button
                      variant="outline"
                      onClick={openBulk}
                      className="gap-1.5"
                    >
                      <Upload className="size-4" />
                      Bulk upload
                    </Button>
                  </div>
                </div>
              ) : catalogProducts.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No products in this status filter.
                </p>
              ) : (
                catalogProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                      (product.status ?? "pending") === "pending"
                        ? "bg-gold/10"
                        : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{product.name}</span>
                        <Badge
                          className={
                            productStatusBadge(product.status ?? "pending")
                              .className
                          }
                        >
                          {
                            productStatusBadge(product.status ?? "pending")
                              .label
                          }
                        </Badge>
                        <Badge variant="outline">{product.category}</Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {listingTypeLabel(product.listingType)}
                        </Badge>
                        <Badge className="bg-emerald-100 text-emerald-800">
                          {product.ecoScore}% eco
                        </Badge>
                      </div>
                      {product.subtitle ? (
                        <p className="mt-0.5 text-sm text-primary/80">
                          {product.subtitle}
                        </p>
                      ) : null}
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {product.description || "No description"}
                      </p>
                      {product.status === "rejected" && product.reviewNote ? (
                        <p className="mt-1 text-xs text-destructive">
                          Review note: {product.reviewNote}
                        </p>
                      ) : null}
                      {product.autoApproved ? (
                        <p className="mt-1 text-xs text-emerald-700">
                          Auto-approved (trusted seller)
                        </p>
                      ) : null}
                      {(product.flagHits?.length ?? 0) > 0 &&
                        product.status === "pending" && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {product.flagHits!.map((hit) => (
                              <span
                                key={`${product.id}-${hit.ruleId}`}
                                className="rounded-md bg-gold/20 px-1.5 py-0.5 text-[11px] text-primary"
                              >
                                Flagged: {hit.ruleId}
                              </span>
                            ))}
                          </div>
                        )}
                      {(product.tags?.length ?? 0) > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {product.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right text-sm">
                        <div className="font-semibold tabular-nums">
                          ${product.price.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.stock}{" "}
                          {product.listingType === "service"
                            ? "slots"
                            : "stock"}{" "}
                          · {product.views ?? 0} views · {product.sales ?? 0}{" "}
                          sales
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Remove this product?")) {
                            deleteProduct(product.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "analytics" && (
        <Suspense fallback={<SellerPanelFallback />}>
          <SellerAnalyticsPanel seller={seller} />
        </Suspense>
      )}

      {tab === "earnings" && (
        <Suspense fallback={<SellerPanelFallback />}>
          <SellerEarningsPanel
            seller={seller}
            onRequestPayout={requestPayout}
          />
        </Suspense>
      )}

      {tab === "profile" && (
        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-emerald-50/70 via-cream to-background">
            <CardHeader>
              <div className="mb-1 flex items-center gap-2 text-primary">
                <Leaf className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Seller profile
                </span>
              </div>
              <CardTitle className="font-heading">Bio, story & impact</CardTitle>
              <CardDescription>
                Help shoppers fall in love with why you sell — not just what you
                sell.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profileMessage && (
                <p className="mb-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-900">
                  {profileMessage}
                </p>
              )}
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const prevType = seller.sellerType ?? "business";
                  if (sellerType !== prevType && !confirmTypeSwitch) {
                    setConfirmTypeSwitch(true);
                    return;
                  }
                  updateSellerProfile({
                    shopName,
                    bio,
                    story,
                    sellerType,
                    tradingName:
                      sellerType === "individual" ? tradingName : undefined,
                    companyName:
                      sellerType === "business" ? companyName : undefined,
                    servicesOffered,
                    professionalBackground:
                      sellerType === "individual"
                        ? professionalBackground
                        : undefined,
                    location,
                  });
                  setConfirmTypeSwitch(false);
                  setProfileMessage(
                    sellerType !== prevType
                      ? `Switched to ${
                          sellerType === "individual"
                            ? "Individual / Self-Employed"
                            : "Business / Company"
                        }. Your listings stay as they are.`
                      : "Profile saved — your story is looking strong."
                  );
                }}
              >
                <fieldset>
                  <legend className="mb-2 text-xs font-medium text-muted-foreground">
                    Seller type
                  </legend>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Switch between Individual and Business anytime. We&apos;ll
                    confirm before changing how your shop is labeled.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        {
                          value: "individual" as const,
                          label: "Individual / Self-Employed",
                        },
                        {
                          value: "business" as const,
                          label: "Business / Company",
                        },
                      ] as const
                    ).map((opt) => (
                      <label
                        key={opt.value}
                        className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                          sellerType === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-input bg-background hover:bg-muted/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="profileSellerType"
                          value={opt.value}
                          checked={sellerType === opt.value}
                          onChange={() => {
                            setSellerType(opt.value);
                            setConfirmTypeSwitch(false);
                          }}
                          className="sr-only"
                        />
                        <span className="font-medium">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {confirmTypeSwitch &&
                  sellerType !== (seller.sellerType ?? "business") && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-3 text-sm text-amber-950">
                      <p className="font-medium">
                        Confirm switch to{" "}
                        {sellerType === "individual"
                          ? "Individual / Self-Employed"
                          : "Business / Company"}
                        ?
                      </p>
                      <p className="mt-1 text-amber-950/85">
                        Your public shop label updates. Listings stay online
                        with the same approval status — only how you&apos;re
                        presented changes. Fill in the fields for your new type
                        below, then save again to confirm.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="submit" size="sm">
                          Yes, switch &amp; save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSellerType(seller.sellerType ?? "business");
                            setConfirmTypeSwitch(false);
                          }}
                        >
                          Keep current type
                        </Button>
                      </div>
                    </div>
                  )}
                {sellerType === "individual" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Trading name
                      </label>
                      <input
                        value={tradingName}
                        onChange={(e) => setTradingName(e.target.value)}
                        placeholder="Public practice name"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Services offered
                      </label>
                      <input
                        value={servicesOffered}
                        onChange={(e) => setServicesOffered(e.target.value)}
                        placeholder="e.g. Legal, Consulting, Workshops"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Professional background
                      </label>
                      <textarea
                        rows={2}
                        value={professionalBackground}
                        onChange={(e) =>
                          setProfessionalBackground(e.target.value)
                        }
                        placeholder="Credentials and who you help"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                      />
                    </div>
                  </>
                )}
                {sellerType === "business" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Company / brand name
                    </label>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Legal or brand name"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Shop name
                  </label>
                  <input
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                {seller.status === "approved" && seller.slug && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-3 text-sm text-emerald-950">
                    <p className="font-medium">Public shop</p>
                    <p className="mt-0.5 text-emerald-800/80">
                      forestbuddies.app/shop/{seller.slug}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      nativeButton={false}
                      render={<Link href={`/shop/${seller.slug}`} />}
                    >
                      View public shop
                    </Button>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Location
                  </label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Austin, TX"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Short bio
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="One-line mission shoppers see first"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Your story
                  </label>
                  <textarea
                    rows={5}
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="Origins, materials, makers, the future you’re growing…"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <Button type="submit" className="gap-1.5">
                  <Leaf className="size-4" />
                  {confirmTypeSwitch &&
                  sellerType !== (seller.sellerType ?? "business")
                    ? "Confirm switch & save"
                    : "Save profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card id="seller-status" className="scroll-mt-20 border-border/80">
            <CardHeader>
              <div className="mb-1 flex items-center gap-2 text-primary">
                <Store className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Profile · Settings
                </span>
              </div>
              <CardTitle className="font-heading">
                Pause or cancel seller status
              </CardTitle>
              <CardDescription>
                Hide your shop temporarily, or leave the program and re-apply
                later. Listings are soft-hidden — never hard-deleted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SellerAccountControls />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Impact you support</CardTitle>
              <CardDescription>
                Demo impact metrics tied to your shop — grow them with every
                sale.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {(seller.impact ?? []).map((row) => {
                const cause = getCause(row.causeId);
                return (
                  <div
                    key={row.causeId}
                    className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                      {cause?.name ?? row.causeId}
                    </div>
                    <div className="mt-1 font-heading text-2xl font-semibold tabular-nums text-emerald-950">
                      {row.unitsSupported}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.label ?? cause?.tagline}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </SellerShell>
  );
}

function SellerShell({
  children,
  shopName,
}: {
  children: React.ReactNode;
  shopName?: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sage/20 via-cream to-cream">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-cream/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-9">
              <Store className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="font-heading text-sm font-semibold text-primary sm:text-base">
                Seller Hub
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {shopName ?? "Sales, analytics & earnings"}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              nativeButton={false}
              render={<Link href="/" />}
              variant="ghost"
              size="sm"
              className="hidden px-2 sm:inline-flex sm:px-3"
            >
              Home
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/dashboard" />}
              variant="outline"
              size="sm"
              className="gap-1 px-2 sm:px-3"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/marketplace" />}
              variant="ghost"
              size="sm"
              className="px-2 sm:px-3"
            >
              <span className="sm:hidden">Shop</span>
              <span className="hidden sm:inline">Marketplace</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

