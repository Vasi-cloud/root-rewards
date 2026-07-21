"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  Check,
  DollarSign,
  Flag,
  Leaf,
  EyeOff,
  MessageCircleHeart,
  Package,
  Pencil,
  Plus,
  Shield,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  TreePine,
  TrendingUp,
  Users,
  X,
  XCircle,
} from "lucide-react";

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
import { useModeration } from "@/contexts/moderation-context";
import { useSeller } from "@/contexts/seller-context";
import {
  deleteFeedback,
  feedbackStats,
  loadFeedback,
  setFeedbackStatus,
  subscribeFeedback,
} from "@/lib/feedback-storage";
import { TRUST_CONFIG, REPORT_FLAG_THRESHOLD } from "@/lib/moderation";
import {
  deleteReview,
  formatReviewDate,
  loadAllReviews,
  reviewStats,
  setReviewStatus,
  subscribeReviews,
} from "@/lib/review-storage";
import type { FeedbackItem, FeedbackStatus } from "@/types/feedback";
import { FEEDBACK_CATEGORY_LABELS } from "@/types/feedback";
import type { ProductApprovalStatus, SellerStatus, SellerTrustTier } from "@/types";
import { REPORT_REASON_LABELS } from "@/types/moderation";
import type { ProductReviewRecord, ReviewStatus } from "@/types/reviews";

const ADMIN_EMAIL = "cvasi.crisan@gmail.com";

type AdminTab =
  | "overview"
  | "products"
  | "sellers"
  | "moderation"
  | "reviews"
  | "feedback"
  | "orders"
  | "users"
  | "trees";
type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";

interface AdminProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  ecoScore: number;
  stock: number;
  description: string;
}

interface AdminOrder {
  id: string;
  customer: string;
  total: number;
  status: OrderStatus;
  date: string;
  items: number;
  trees: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "affiliate" | "admin";
  joined: string;
  orders: number;
  treesPlanted: number;
}

const CATEGORIES = [
  "Accessories",
  "Kitchen",
  "Home",
  "Apparel",
  "Beauty",
  "Stationery",
  "Camping",
];

const ORDER_STATUSES: OrderStatus[] = [
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const INITIAL_PRODUCTS: AdminProduct[] = [
  {
    id: "1",
    name: "Organic Cotton Tote",
    category: "Accessories",
    price: 28,
    ecoScore: 92,
    stock: 84,
    description: "Reusable tote made from GOTS-certified organic cotton.",
  },
  {
    id: "9",
    name: "Stainless Steel Water Bottle",
    category: "Kitchen",
    price: 24,
    ecoScore: 94,
    stock: 120,
    description: "18/8 food-grade steel, insulated, 24h cold retention.",
  },
  {
    id: "11",
    name: "Organic Hemp T-Shirt",
    category: "Apparel",
    price: 32,
    ecoScore: 89,
    stock: 56,
    description: "Breathable, ethically made in fair-trade workshops.",
  },
  {
    id: "13",
    name: "Seed Paper Greeting Cards",
    category: "Stationery",
    price: 19,
    ecoScore: 99,
    stock: 200,
    description: "6-pack of plantable wildflower cards.",
  },
  {
    id: "10",
    name: "Bamboo Toothbrush Set",
    category: "Beauty",
    price: 16,
    ecoScore: 96,
    stock: 175,
    description: "4-pack with compostable bristles and travel cases.",
  },
];

const INITIAL_ORDERS: AdminOrder[] = [
  {
    id: "ORD-7842",
    customer: "maya@eco.co",
    total: 124,
    status: "Shipped",
    date: "Jun 22",
    items: 3,
    trees: 5,
  },
  {
    id: "ORD-7841",
    customer: "jake@green.io",
    total: 89,
    status: "Processing",
    date: "Jun 22",
    items: 2,
    trees: 1,
  },
  {
    id: "ORD-7840",
    customer: "luna@root.app",
    total: 215,
    status: "Shipped",
    date: "Jun 21",
    items: 5,
    trees: 10,
  },
  {
    id: "ORD-7839",
    customer: "sam@earth.org",
    total: 47,
    status: "Delivered",
    date: "Jun 20",
    items: 1,
    trees: 1,
  },
  {
    id: "ORD-7838",
    customer: "ada@forest.co",
    total: 156,
    status: "Delivered",
    date: "Jun 19",
    items: 4,
    trees: 5,
  },
  {
    id: "ORD-7837",
    customer: "noah@leaf.io",
    total: 72,
    status: "Cancelled",
    date: "Jun 18",
    items: 2,
    trees: 0,
  },
];

const INITIAL_USERS: AdminUser[] = [
  {
    id: "u1",
    name: "Maya Chen",
    email: "maya@eco.co",
    role: "affiliate",
    joined: "Mar 2026",
    orders: 12,
    treesPlanted: 28,
  },
  {
    id: "u2",
    name: "Jake Rivera",
    email: "jake@green.io",
    role: "customer",
    joined: "Apr 2026",
    orders: 5,
    treesPlanted: 8,
  },
  {
    id: "u3",
    name: "Luna Park",
    email: "luna@root.app",
    role: "affiliate",
    joined: "Jan 2026",
    orders: 21,
    treesPlanted: 64,
  },
  {
    id: "u4",
    name: "Sam Okonkwo",
    email: "sam@earth.org",
    role: "customer",
    joined: "May 2026",
    orders: 3,
    treesPlanted: 4,
  },
  {
    id: "u5",
    name: "Ada Forest",
    email: "ada@forest.co",
    role: "customer",
    joined: "Feb 2026",
    orders: 9,
    treesPlanted: 17,
  },
];

const emptyProductForm = {
  name: "",
  category: "Kitchen",
  price: "",
  ecoScore: "90",
  stock: "50",
  description: "",
};

function statusBadgeClass(status: OrderStatus) {
  switch (status) {
    case "Delivered":
      return "bg-emerald-100 text-emerald-800";
    case "Shipped":
      return "bg-primary/10 text-primary";
    case "Processing":
      return "bg-gold/20 text-primary";
    case "Cancelled":
      return "bg-destructive/10 text-destructive";
  }
}

function sellerAccountBadge(status: SellerStatus) {
  switch (status) {
    case "approved":
      return { label: "Approved", className: "bg-emerald-100 text-emerald-800" };
    case "paused":
      return { label: "Paused", className: "bg-amber-100 text-amber-950" };
    case "rejected":
      return { label: "Rejected", className: "bg-destructive/10 text-destructive" };
    case "pending":
      return { label: "Pending", className: "bg-gold/25 text-primary" };
    case "none":
      return { label: "Canceled", className: "bg-muted text-muted-foreground" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
}

function listingBadge(status: ProductApprovalStatus) {
  switch (status) {
    case "approved":
      return { label: "Approved", className: "bg-emerald-100 text-emerald-800" };
    case "rejected":
      return { label: "Rejected", className: "bg-destructive/10 text-destructive" };
    default:
      return { label: "Pending", className: "bg-gold/25 text-primary" };
  }
}

function trustBadge(tier?: SellerTrustTier) {
  switch (tier) {
    case "trusted":
      return { label: "Trusted", className: "bg-emerald-100 text-emerald-800" };
    case "standard":
      return { label: "Standard", className: "bg-primary/10 text-primary" };
    default:
      return { label: "New", className: "bg-muted text-muted-foreground" };
  }
}

function flagSeverityClass(severity: string) {
  switch (severity) {
    case "block":
    case "high":
      return "bg-destructive/10 text-destructive";
    case "warn":
      return "bg-gold/25 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const {
    allSellers,
    refreshSellers,
    setSellerAccountStatus,
    setSellerTrustOverride,
    setProductApproval,
  } = useSeller();
  const {
    openFlags,
    openReports,
    resolveFlag,
    setReportStatus,
    refresh: refreshModeration,
  } = useModeration();
  const router = useRouter();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [products, setProducts] = useState<AdminProduct[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<AdminOrder[]>(INITIAL_ORDERS);
  const [users] = useState<AdminUser[]>(INITIAL_USERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProductForm);
  const [productQuery, setProductQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState<"All" | OrderStatus>("All");
  const [listingFilter, setListingFilter] = useState<
    "All" | ProductApprovalStatus
  >("pending");
  const [rejectingKey, setRejectingKey] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<
    "All" | FeedbackStatus
  >("new");
  const [reviewItems, setReviewItems] = useState<ProductReviewRecord[]>([]);
  const [reviewFilter, setReviewFilter] = useState<"All" | ReviewStatus>(
    "pending"
  );

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (isAdmin) {
      refreshSellers();
      refreshModeration();
      setFeedbackItems(loadFeedback());
      setReviewItems(loadAllReviews());
    }
  }, [isAdmin, refreshSellers, refreshModeration]);

  useEffect(() => {
    if (!isAdmin) return;
    return subscribeFeedback(() => setFeedbackItems(loadFeedback()));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    return subscribeReviews(() => setReviewItems(loadAllReviews()));
  }, [isAdmin]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [loading, isAdmin, router]);

  const stats = useMemo(() => {
    const totalSales = orders
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + o.total, 0);
    const treesFromOrders = orders.reduce((sum, o) => sum + o.trees, 0);
    const treesFromUsers = users.reduce((sum, u) => sum + u.treesPlanted, 0);
    const treesPlanted = treesFromOrders + treesFromUsers;
    const activeUsers = users.length;
    const openOrders = orders.filter(
      (o) => o.status === "Processing" || o.status === "Shipped"
    ).length;
    const avgOrderValue =
      orders.filter((o) => o.status !== "Cancelled").length > 0
        ? totalSales /
          orders.filter((o) => o.status !== "Cancelled").length
        : 0;
    const lowStock = products.filter((p) => p.stock < 60).length;
    const co2OffsetKg = treesPlanted * 22;

    return {
      totalSales,
      treesPlanted,
      treesThisMonth: treesFromOrders,
      activeUsers,
      openOrders,
      avgOrderValue,
      lowStock,
      co2OffsetKg,
      affiliates: users.filter((u) => u.role === "affiliate").length,
    };
  }, [orders, products, users]);

  const filteredProducts = products.filter((p) => {
    const q = productQuery.toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const filteredOrders = orders.filter(
    (o) => orderFilter === "All" || o.status === orderFilter
  );

  function openAddForm() {
    setEditingId(null);
    setForm(emptyProductForm);
    setFormOpen(true);
  }

  function openEditForm(product: AdminProduct) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      ecoScore: String(product.ecoScore),
      stock: String(product.stock),
      description: product.description,
    });
    setFormOpen(true);
  }

  function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    const payload: AdminProduct = {
      id: editingId ?? `p-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price) || 0,
      ecoScore: Math.min(100, Math.max(0, Number(form.ecoScore) || 0)),
      stock: Math.max(0, Number(form.stock) || 0),
      description: form.description.trim(),
    };

    if (!payload.name) return;

    setProducts((prev) =>
      editingId
        ? prev.map((p) => (p.id === editingId ? payload : p))
        : [payload, ...prev]
    );
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyProductForm);
  }

  function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function updateOrderStatus(id: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-muted-foreground">
        Loading admin panel…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream px-4 text-center">
        <h1 className="font-heading text-2xl font-semibold text-destructive">
          Access Denied
        </h1>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
        <Button nativeButton={false} render={<Link href="/" />} variant="outline">
          Back to home
        </Button>
      </div>
    );
  }

  const pendingSellerAccounts = allSellers.filter((s) => s.status === "pending");
  const pendingListings = allSellers.flatMap((s) =>
    s.products
      .filter((p) => p.status === "pending")
      .map((product) => ({ seller: s, product }))
  );
  const allListings = allSellers.flatMap((s) =>
    s.products.map((product) => ({ seller: s, product }))
  );
  const filteredListings = allListings.filter(
    (row) => listingFilter === "All" || row.product.status === listingFilter
  );

  const fbStats = feedbackStats(feedbackItems);
  const filteredFeedback = feedbackItems.filter(
    (item) => feedbackFilter === "All" || item.status === feedbackFilter
  );
  const rvStats = reviewStats(reviewItems);
  const filteredReviews = reviewItems.filter(
    (item) => reviewFilter === "All" || item.status === reviewFilter
  );

  const tabs: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "products", label: "Products", icon: ShoppingBag },
    { id: "sellers", label: "Sellers", icon: Store },
    { id: "moderation", label: "Moderation", icon: Shield },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "feedback", label: "Feedback", icon: MessageCircleHeart },
    { id: "orders", label: "Orders", icon: Package },
    { id: "users", label: "Users", icon: Users },
    { id: "trees", label: "Trees", icon: TreePine },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sage/20 via-cream to-cream">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-cream/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-10">
              <Leaf className="size-4 sm:size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading truncate text-lg font-semibold text-primary sm:text-2xl">
                Admin Dashboard
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                Forest Buddies® operations
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className="hidden max-w-[12rem] truncate bg-emerald-100 text-emerald-800 sm:inline-flex">
              {user?.email}
            </Badge>
            <Button
              nativeButton={false}
              render={<Link href="/" />}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Site</span>
            </Button>
          </div>
        </div>

        <nav className="scrollbar-none mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-3 sm:px-6">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
                tab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-muted hover:text-primary"
              }`}
            >
              <item.icon className="size-4" />
              <span className="max-sm:text-xs">{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        {tab === "overview" && (
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-primary">
                Overview
              </h2>
              <p className="mt-1 text-muted-foreground">
                Live snapshot of sales, impact, and operations.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={DollarSign}
                label="Net sales"
                value={`$${stats.totalSales.toLocaleString()}`}
                hint={`Avg order $${stats.avgOrderValue.toFixed(0)}`}
              />
              <StatCard
                icon={TreePine}
                label="Trees planted"
                value={stats.treesPlanted.toLocaleString()}
                hint={`+${stats.treesThisMonth} from recent orders`}
                accent
              />
              <StatCard
                icon={Store}
                label="Seller review"
                value={String(pendingListings.length + pendingSellerAccounts.length)}
                hint={`${pendingListings.length} listings · ${pendingSellerAccounts.length} shops`}
              />
              <StatCard
                icon={Shield}
                label="Open flags"
                value={String(openFlags.length + openReports.length)}
                hint={`${openFlags.length} flags · ${openReports.length} reports`}
              />
            </div>

            {rvStats.pending > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="font-heading flex items-center gap-2 text-amber-950">
                      <Star className="size-5" />
                      Reviews awaiting moderation
                    </CardTitle>
                    <CardDescription className="text-amber-900/80">
                      {rvStats.pending} rating
                      {rvStats.pending === 1 ? "" : "s"} waiting to go live on
                      product &amp; service pages.
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setTab("reviews")}>
                    Moderate reviews
                  </Button>
                </CardHeader>
              </Card>
            )}

            {fbStats.newCount > 0 && (
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="font-heading flex items-center gap-2 text-emerald-900">
                      <MessageCircleHeart className="size-5" />
                      New community feedback
                    </CardTitle>
                    <CardDescription className="text-emerald-800/80">
                      {fbStats.newCount} unread note
                      {fbStats.newCount === 1 ? "" : "s"} from shoppers &
                      makers.
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setTab("feedback")}>
                    Review feedback
                  </Button>
                </CardHeader>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-heading">Recent orders</CardTitle>
                  <CardDescription>
                    Latest activity across the marketplace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"
                    >
                      <div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {order.id}
                        </div>
                        <div className="font-medium">{order.customer}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold tabular-nums">
                          ${order.total}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.date} · {order.trees} trees
                        </div>
                      </div>
                      <Badge className={statusBadgeClass(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTab("orders")}
                    className="w-full"
                  >
                    Manage all orders
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-emerald-50/40">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2 text-emerald-800">
                    <TreePine className="size-5" />
                    Impact pulse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-emerald-800">
                  <div>
                    <div className="text-3xl font-semibold tabular-nums">
                      {stats.co2OffsetKg.toLocaleString()} kg
                    </div>
                    <div className="text-emerald-700">Estimated CO₂ offset</div>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-white/70 p-3">
                    <div className="font-medium">
                      {stats.treesThisMonth} trees from checkout donations
                    </div>
                    <div className="mt-1 text-xs text-emerald-700">
                      Every order can fund forest restoration.
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTab("trees")}
                    className="w-full border-emerald-300"
                  >
                    View trees tracking
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-primary">
                  Product management
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Add, edit, or remove catalog items.
                </p>
              </div>
              <Button onClick={openAddForm} className="gap-1.5">
                <Plus className="size-4" />
                Add product
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-sm"
              />
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} products
              </span>
            </div>

            {formOpen && (
              <Card className="border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-heading">
                      {editingId ? "Edit product" : "Add product"}
                    </CardTitle>
                    <CardDescription>
                      Demo form — changes stay in this session.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFormOpen(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={saveProduct}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Name
                      </label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Category
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, category: e.target.value }))
                        }
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        {CATEGORIES.map((c) => (
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
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Eco score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.ecoScore}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, ecoScore: e.target.value }))
                        }
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, stock: e.target.value }))
                        }
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={form.description}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <Button type="submit">
                        {editingId ? "Save changes" : "Create product"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFormOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="divide-y p-0">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{product.name}</span>
                        <Badge variant="outline">{product.category}</Badge>
                        {product.stock < 60 && (
                          <Badge className="bg-gold/25 text-primary">
                            Low stock
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="font-semibold tabular-nums">
                          ${product.price}
                        </div>
                        <div className="text-xs text-emerald-700">
                          {product.ecoScore}% eco · {product.stock} in stock
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditForm(product)}
                          className="gap-1"
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No products match your search.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "sellers" && (
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-primary">
                Seller moderation
              </h2>
              <p className="mt-1 text-muted-foreground">
                Simple pending → approved / rejected review for shops and
                listings.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={Store}
                label="Seller shops"
                value={String(allSellers.length)}
                hint={`${pendingSellerAccounts.length} awaiting approval`}
              />
              <StatCard
                icon={ShoppingBag}
                label="Listings in review"
                value={String(pendingListings.length)}
                hint="Pending product approvals"
                accent
              />
              <StatCard
                icon={Check}
                label="Live listings"
                value={String(
                  allListings.filter((r) => r.product.status === "approved")
                    .length
                )}
                hint="Approved for marketplace"
              />
            </div>

            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="border-b border-primary/10 bg-emerald-50/50">
                <div className="flex items-center gap-2 text-primary">
                  <Leaf className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Shop applications
                  </span>
                </div>
                <CardTitle className="font-heading">Seller accounts</CardTitle>
                <CardDescription>
                  Approve individuals and companies before they can list
                  products or services.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {allSellers.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <Store className="mx-auto size-8 text-primary/40" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      No seller applications yet. Sellers apply from the Seller
                      Hub.
                    </p>
                  </div>
                ) : (
                  allSellers.map((s) => {
                    const badge = sellerAccountBadge(s.status);
                    return (
                      <div
                        key={s.uid}
                        className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                          s.status === "pending" ? "bg-gold/10" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{s.shopName}</span>
                            <Badge className={badge.className}>
                              {badge.label}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                s.sellerType === "individual"
                                  ? "border-sky-300 bg-sky-50 text-sky-900"
                                  : undefined
                              }
                            >
                              {s.sellerType === "individual"
                                ? "Self-employed"
                                : "Business"}
                            </Badge>
                            <Badge className={trustBadge(s.trustTier).className}>
                              {trustBadge(s.trustTier).label}
                            </Badge>
                            {s.trustOverride === "trusted" && (
                              <Badge variant="outline">Override</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {s.email} · {s.products.length} listings ·{" "}
                            {
                              s.products.filter((p) => p.status === "approved")
                                .length
                            }{" "}
                            approved
                          </p>
                          {s.bio ? (
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {s.bio}
                            </p>
                          ) : null}
                          {s.sellerType === "individual" &&
                            (s.tradingName ||
                              s.servicesOffered ||
                              s.professionalBackground) && (
                              <div className="mt-2 space-y-1 rounded-lg border border-sky-200/80 bg-sky-50/50 px-2.5 py-2 text-[11px] text-sky-950">
                                {s.tradingName && (
                                  <p>
                                    <span className="font-medium">Trading: </span>
                                    {s.tradingName}
                                  </p>
                                )}
                                {s.servicesOffered && (
                                  <p>
                                    <span className="font-medium">Offers: </span>
                                    {s.servicesOffered}
                                  </p>
                                )}
                                {s.professionalBackground && (
                                  <p className="line-clamp-2">
                                    <span className="font-medium">Background: </span>
                                    {s.professionalBackground}
                                  </p>
                                )}
                              </div>
                            )}
                          {s.sellerType === "business" && s.companyName && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Company: {s.companyName}
                            </p>
                          )}
                          {s.appliedAt && s.status === "pending" && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Applied {s.appliedAt.slice(0, 10)}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Auto-approve at {TRUST_CONFIG.trustedMinApproved}+
                            approved listings & low rejection rate
                            {s.trustTier === "trusted"
                              ? " · currently eligible"
                              : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.status !== "approved" && s.status !== "paused" && (
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() =>
                                setSellerAccountStatus(s.uid, "approved")
                              }
                            >
                              <Check className="size-3.5" />
                              Approve
                            </Button>
                          )}
                          {s.status === "paused" && (
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() =>
                                setSellerAccountStatus(s.uid, "approved")
                              }
                            >
                              <Check className="size-3.5" />
                              Resume
                            </Button>
                          )}
                          {s.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSellerAccountStatus(s.uid, "paused")
                              }
                            >
                              Pause
                            </Button>
                          )}
                          {s.status === "approved" &&
                            s.trustOverride !== "trusted" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() =>
                                  setSellerTrustOverride(s.uid, "trusted")
                                }
                              >
                                <Shield className="size-3.5" />
                                Mark trusted
                              </Button>
                            )}
                          {s.trustOverride === "trusted" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setSellerTrustOverride(s.uid, null)
                              }
                            >
                              Clear trust override
                            </Button>
                          )}
                          {s.status !== "rejected" && s.status !== "none" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive"
                              onClick={() =>
                                setSellerAccountStatus(s.uid, "rejected")
                              }
                            >
                              <XCircle className="size-3.5" />
                              Reject
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="border-b border-primary/10 bg-emerald-50/40">
                <div className="flex items-center gap-2 text-primary">
                  <ShoppingBag className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Listing review
                  </span>
                </div>
                <CardTitle className="font-heading">Product listings</CardTitle>
                <CardDescription>
                  Check eco score and details, then approve or reject.
                </CardDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(
                    [
                      ["pending", "Pending"],
                      ["approved", "Approved"],
                      ["rejected", "Rejected"],
                      ["All", "All"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setListingFilter(value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        listingFilter === value
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-foreground/70 ring-1 ring-border hover:text-primary"
                      }`}
                    >
                      {label}
                      {value !== "All" && (
                        <span className="ml-1 opacity-70">
                          (
                          {
                            allListings.filter((r) => r.product.status === value)
                              .length
                          }
                          )
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {filteredListings.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <Leaf className="mx-auto size-8 text-primary/40" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      No listings in this filter.
                    </p>
                  </div>
                ) : (
                  filteredListings.map(({ seller: s, product }) => {
                    const badge = listingBadge(product.status ?? "pending");
                    const key = `${s.uid}-${product.id}`;
                    const isRejecting = rejectingKey === key;
                    return (
                      <div
                        key={key}
                        className={`space-y-3 px-5 py-4 ${
                          product.status === "pending" ? "bg-gold/10" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{product.name}</span>
                              <Badge className={badge.className}>
                                {badge.label}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={
                                  product.listingType === "service"
                                    ? "bg-sky-100 text-sky-900"
                                    : undefined
                                }
                              >
                                {product.listingType === "service"
                                  ? "Service"
                                  : "Product"}
                              </Badge>
                              <Badge variant="outline">{product.category}</Badge>
                              <Badge className="bg-emerald-100 text-emerald-800">
                                {product.ecoScore}% eco
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {s.shopName} · ${product.price.toFixed(2)} ·{" "}
                              {product.stock}{" "}
                              {product.listingType === "service"
                                ? "slots"
                                : "stock"}
                            </p>
                            {product.subtitle ? (
                              <p className="mt-1 text-sm text-primary/80">
                                {product.subtitle}
                              </p>
                            ) : null}
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {product.description || "No description"}
                            </p>
                            {(product.flagHits?.length ?? 0) > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {product.flagHits!.map((hit) => (
                                  <Badge
                                    key={`${product.id}-${hit.ruleId}-${hit.message}`}
                                    className={flagSeverityClass(hit.severity)}
                                  >
                                    {hit.ruleId}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {product.autoApproved && (
                              <p className="mt-1 text-xs text-emerald-700">
                                Auto-approved via trusted seller
                              </p>
                            )}
                          </div>
                          {!isRejecting && (
                            <div className="flex shrink-0 flex-wrap gap-2">
                              {product.status !== "approved" && (
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => {
                                    setRejectingKey(null);
                                    setProductApproval(
                                      s.uid,
                                      product.id,
                                      "approved"
                                    );
                                  }}
                                >
                                  <Check className="size-3.5" />
                                  Approve
                                </Button>
                              )}
                              {product.status !== "rejected" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-destructive"
                                  onClick={() => {
                                    setRejectingKey(key);
                                    setRejectNote(product.reviewNote ?? "");
                                  }}
                                >
                                  <XCircle className="size-3.5" />
                                  Reject
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        {isRejecting && (
                          <div className="rounded-xl border border-destructive/20 bg-background p-3">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                              Note for seller (optional)
                            </label>
                            <input
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              placeholder="e.g. Please clarify materials and eco score"
                              className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1"
                                onClick={() => {
                                  setProductApproval(
                                    s.uid,
                                    product.id,
                                    "rejected",
                                    rejectNote
                                  );
                                  setRejectingKey(null);
                                  setRejectNote("");
                                }}
                              >
                                <XCircle className="size-3.5" />
                                Confirm reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setRejectingKey(null);
                                  setRejectNote("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "moderation" && (
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-primary">
                Moderation queue
              </h2>
              <p className="mt-1 text-muted-foreground">
                Rule flags, user reports, and trusted-seller automation.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={Flag}
                label="Open flags"
                value={String(openFlags.length)}
                hint="Rule + report escalations"
                accent
              />
              <StatCard
                icon={Shield}
                label="Open reports"
                value={String(openReports.length)}
                hint="Shopper submissions"
              />
              <StatCard
                icon={Store}
                label="Trusted shops"
                value={String(
                  allSellers.filter((s) => s.trustTier === "trusted").length
                )}
                hint="Eligible for auto-approve"
              />
            </div>

            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="border-b border-primary/10 bg-emerald-50/40">
                <CardTitle className="font-heading">AI-like flags</CardTitle>
                <CardDescription>
                  Low eco scores, greenwashing risk, spam titles, and suspicious
                  prices.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {openFlags.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No open flags. Queue is clear.
                  </p>
                ) : (
                  openFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{flag.productName}</span>
                          <Badge className={flagSeverityClass(flag.severity)}>
                            {flag.severity}
                          </Badge>
                          <Badge variant="outline">{flag.ruleId}</Badge>
                          <Badge variant="secondary">{flag.source}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {flag.message}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {flag.shopName ?? "Catalog"} · {flag.createdAt.slice(0, 10)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => resolveFlag(flag.id, "resolved")}
                        >
                          <Check className="size-3.5" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveFlag(flag.id, "dismissed")}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="border-b border-primary/10 bg-gold/10">
                <CardTitle className="font-heading">User reports</CardTitle>
                <CardDescription>
                  From marketplace report buttons. {REPORT_FLAG_THRESHOLD}+ open
                  reports escalate to a high flag automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {openReports.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No open reports.
                  </p>
                ) : (
                  openReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{report.productName}</span>
                          <Badge className="bg-gold/25 text-primary">
                            {REPORT_REASON_LABELS[report.reason]}
                          </Badge>
                        </div>
                        {report.note ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {report.note}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {report.shopName ?? "Catalog"} ·{" "}
                          {report.createdAt.slice(0, 10)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => setReportStatus(report.id, "reviewed")}
                        >
                          Mark reviewed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReportStatus(report.id, "dismissed")}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "reviews" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-primary">
                Reviews &amp; ratings
              </h2>
              <p className="mt-1 text-muted-foreground">
                Approve shopper reviews for products and services. Pending
                reviews stay private until you publish them.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={Star}
                label="Pending"
                value={String(rvStats.pending)}
                hint="Awaiting moderation"
                accent
              />
              <StatCard
                icon={Check}
                label="Approved"
                value={String(rvStats.approved)}
                hint="Live on listings"
              />
              <StatCard
                icon={EyeOff}
                label="Hidden"
                value={String(rvStats.hidden)}
                hint="Removed from public"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["pending", "approved", "hidden", "All"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={reviewFilter === f ? "default" : "outline"}
                  onClick={() => setReviewFilter(f)}
                  className="capitalize"
                >
                  {f === "All" ? "All" : f}
                </Button>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Review queue</CardTitle>
                <CardDescription>
                  {filteredReviews.length} review
                  {filteredReviews.length === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredReviews.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No reviews in this filter. Shoppers leave ratings from
                    product and service detail pages.
                  </p>
                ) : (
                  filteredReviews.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border/70 bg-card p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {item.listingType}
                          </Badge>
                          <Badge
                            className={
                              item.status === "pending"
                                ? "bg-amber-100 text-amber-950"
                                : item.status === "approved"
                                  ? "bg-emerald-100 text-emerald-900"
                                  : "bg-muted text-muted-foreground"
                            }
                          >
                            {item.status}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-sm font-medium">
                            <Star className="size-3.5 fill-gold text-gold" />
                            {item.rating}/5
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatReviewDate(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-primary">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {item.body}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{item.authorName}</span>
                        {item.authorEmail && <span>{item.authorEmail}</span>}
                        {item.location && <span>{item.location}</span>}
                        <span className="font-mono">{item.productId}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => {
                              setReviewStatus(item.id, "approved");
                              setReviewItems(loadAllReviews());
                            }}
                          >
                            <Check className="size-3.5" />
                            Approve
                          </Button>
                        )}
                        {item.status !== "hidden" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => {
                              setReviewStatus(item.id, "hidden");
                              setReviewItems(loadAllReviews());
                            }}
                          >
                            <EyeOff className="size-3.5" />
                            Hide
                          </Button>
                        )}
                        {item.status === "hidden" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => {
                              setReviewStatus(item.id, "pending");
                              setReviewItems(loadAllReviews());
                            }}
                          >
                            Re-queue
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-destructive"
                          onClick={() => {
                            deleteReview(item.id);
                            setReviewItems(loadAllReviews());
                          }}
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "feedback" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-primary">
                Community feedback
              </h2>
              <p className="mt-1 text-muted-foreground">
                Ideas, bugs, and feature wishes from{" "}
                <Link href="/feedback" className="text-primary underline-offset-2 hover:underline">
                  /feedback
                </Link>
                . Stored in localStorage for this demo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={MessageCircleHeart}
                label="New"
                value={String(fbStats.newCount)}
                hint="Awaiting review"
                accent
              />
              <StatCard
                icon={Check}
                label="Reviewed"
                value={String(fbStats.reviewed)}
                hint="Acknowledged"
              />
              <StatCard
                icon={Archive}
                label="Archived"
                value={String(fbStats.archived)}
                hint="Parked for later"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["new", "reviewed", "archived", "All"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={feedbackFilter === f ? "default" : "outline"}
                  onClick={() => setFeedbackFilter(f)}
                  className="capitalize"
                >
                  {f === "All" ? "All" : f}
                </Button>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Inbox</CardTitle>
                <CardDescription>
                  {filteredFeedback.length} item
                  {filteredFeedback.length === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredFeedback.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No feedback in this filter yet. Encourage visitors to visit
                    /feedback.
                  </p>
                ) : (
                  filteredFeedback.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border/70 bg-card p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {FEEDBACK_CATEGORY_LABELS[item.category]}
                          </Badge>
                          <Badge
                            className={
                              item.status === "new"
                                ? "bg-emerald-100 text-emerald-900"
                                : item.status === "reviewed"
                                  ? "bg-sky-100 text-sky-900"
                                  : "bg-muted text-muted-foreground"
                            }
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {item.message}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {item.name && <span>From: {item.name}</span>}
                        {item.email && <span>{item.email}</span>}
                        {item.pagePath && <span>Page: {item.pagePath}</span>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.status !== "reviewed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => {
                              setFeedbackStatus(item.id, "reviewed");
                              setFeedbackItems(loadFeedback());
                            }}
                          >
                            <Check className="size-3.5" />
                            Mark reviewed
                          </Button>
                        )}
                        {item.status !== "archived" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => {
                              setFeedbackStatus(item.id, "archived");
                              setFeedbackItems(loadFeedback());
                            }}
                          >
                            <Archive className="size-3.5" />
                            Archive
                          </Button>
                        )}
                        {item.status !== "new" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setFeedbackStatus(item.id, "new");
                              setFeedbackItems(loadFeedback());
                            }}
                          >
                            Reopen
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            deleteFeedback(item.id);
                            setFeedbackItems(loadFeedback());
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

        {tab === "orders" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-primary">
                  Order management
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Update fulfillment status for each order.
                </p>
              </div>
              <select
                value={orderFilter}
                onChange={(e) =>
                  setOrderFilter(e.target.value as "All" | OrderStatus)
                }
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="All">All statuses</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <Card>
              <CardContent className="divide-y p-0">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {order.id}
                      </div>
                      <div className="font-medium">{order.customer}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.date} · {order.items} items · {order.trees} trees
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="font-semibold tabular-nums text-primary">
                        ${order.total}
                      </div>
                      <Badge className={statusBadgeClass(order.status)}>
                        {order.status}
                      </Badge>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatus(
                            order.id,
                            e.target.value as OrderStatus
                          )
                        }
                        className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-primary">
                User management
              </h2>
              <p className="mt-1 text-muted-foreground">
                Overview of customers and affiliates (mock data).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={Users}
                label="Total users"
                value={String(users.length)}
                hint="Demo roster"
              />
              <StatCard
                icon={TrendingUp}
                label="Affiliates"
                value={String(stats.affiliates)}
                hint="Earning commissions"
              />
              <StatCard
                icon={TreePine}
                label="User tree total"
                value={String(
                  users.reduce((sum, u) => sum + u.treesPlanted, 0)
                )}
                hint="From checkout donations"
                accent
              />
            </div>

            <Card>
              <CardContent className="divide-y p-0">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {u.email}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <Badge
                        className={
                          u.role === "affiliate"
                            ? "bg-gold/20 text-primary"
                            : u.role === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                        }
                      >
                        {u.role}
                      </Badge>
                      <span className="text-muted-foreground">
                        Joined {u.joined}
                      </span>
                      <span className="tabular-nums">
                        {u.orders} orders · {u.treesPlanted} trees
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "trees" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-primary">
                Trees planted tracking
              </h2>
              <p className="mt-1 text-muted-foreground">
                Checkout donations and community impact (demo totals).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={TreePine}
                label="Total trees"
                value={stats.treesPlanted.toLocaleString()}
                hint="All sources"
                accent
              />
              <StatCard
                icon={Leaf}
                label="From orders"
                value={String(stats.treesThisMonth)}
                hint="Recent checkout donations"
              />
              <StatCard
                icon={Users}
                label="From users"
                value={String(
                  users.reduce((sum, u) => sum + u.treesPlanted, 0)
                )}
                hint="Lifetime lifetime totals"
              />
              <StatCard
                icon={TrendingUp}
                label="CO₂ offset"
                value={`${(stats.co2OffsetKg / 1000).toFixed(1)}t`}
                hint="~22 kg per tree"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-emerald-200 bg-emerald-50/40">
                <CardHeader>
                  <CardTitle className="font-heading text-emerald-800">
                    Donations by order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orders
                    .filter((o) => o.trees > 0)
                    .map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm"
                      >
                        <div>
                          <div className="font-medium">{order.customer}</div>
                          <div className="text-xs text-emerald-700">
                            {order.id} · {order.date}
                          </div>
                        </div>
                        <div className="font-semibold text-emerald-800">
                          {order.trees} trees
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Top planters</CardTitle>
                  <CardDescription>
                    Users with the most trees donated.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...users]
                    .sort((a, b) => b.treesPlanted - a.treesPlanted)
                    .map((u, index) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {u.email}
                            </div>
                          </div>
                        </div>
                        <div className="font-semibold text-emerald-700">
                          {u.treesPlanted}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Demo admin panel with session-local edits. Connect Firebase later for
          persistent roles, products, and orders.
        </p>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={
        accent ? "border-emerald-200 bg-emerald-50/50" : "border-border/80"
      }
    >
      <CardHeader className="pb-2">
        <CardTitle
          className={`flex items-center gap-2 text-sm font-medium ${
            accent ? "text-emerald-700" : "text-muted-foreground"
          }`}
        >
          <Icon className="size-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-3xl font-semibold tabular-nums ${
            accent ? "text-emerald-800" : "text-primary"
          }`}
        >
          {value}
        </div>
        <div
          className={`mt-1 text-xs ${
            accent ? "text-emerald-700" : "text-muted-foreground"
          }`}
        >
          {hint}
        </div>
      </CardContent>
    </Card>
  );
}
