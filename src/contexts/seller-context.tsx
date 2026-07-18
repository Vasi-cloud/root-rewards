"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/contexts/auth-context";
import {
  countOpenReportsForSeller,
  evaluateListing,
  recordFlagHits,
  resolveFlagsForProduct,
  resolveListingDecision,
} from "@/lib/moderation";
import {
  SELLERS_STORAGE_KEY,
  defaultAnalytics,
  defaultEarnings,
  defaultPayouts,
  loadAllSellers,
  normalizeSeller,
  saveAllSellers,
  setProductApproval as storageSetProductApproval,
  setSellerAccountStatus as storageSetSellerAccountStatus,
  setSellerTrustOverride as storageSetSellerTrustOverride,
  pauseSellerAccount as storagePauseSeller,
  resumeSellerAccount as storageResumeSeller,
  cancelSellerAccount as storageCancelSeller,
  uniqueShopSlug,
} from "@/lib/seller-storage";
import type {
  ProductApprovalStatus,
  SellerApplicationInput,
  SellerProduct,
  SellerProfile,
  SellerStatus,
  SellerTrustTier,
  SellerType,
} from "@/types";

interface SellerContextValue {
  seller: SellerProfile | null;
  loading: boolean;
  /** All seller profiles (for admin moderation) */
  allSellers: SellerProfile[];
  refreshSellers: () => void;
  applyAsSeller: (application: SellerApplicationInput) => void;
  updateSellerProfile: (fields: {
    shopName?: string;
    bio?: string;
    story?: string;
    sellerType?: SellerType;
    tradingName?: string;
    servicesOffered?: string;
    professionalBackground?: string;
    companyName?: string;
    location?: string;
  }) => void;
  simulateApproval: () => void;
  pauseSeller: () => void;
  resumeSeller: () => void;
  cancelSeller: () => void;
  setSellerAccountStatus: (
    uid: string,
    status: Extract<
      SellerStatus,
      "approved" | "rejected" | "pending" | "paused" | "none"
    >
  ) => void;
  setSellerTrustOverride: (
    uid: string,
    trustOverride: SellerTrustTier | null
  ) => void;
  setProductApproval: (
    sellerUid: string,
    productId: string,
    status: ProductApprovalStatus,
    reviewNote?: string
  ) => void;
  addProduct: (product: Omit<SellerProduct, "id" | "createdAt">) => void;
  addProducts: (products: Omit<SellerProduct, "id" | "createdAt">[]) => number;
  updateProduct: (id: string, product: Omit<SellerProduct, "id" | "createdAt">) => void;
  deleteProduct: (id: string) => void;
  requestPayout: (amount?: number) => boolean;
}

const SellerContext = createContext<SellerContextValue | undefined>(undefined);

function prepareProduct(
  seller: SellerProfile,
  product: Omit<SellerProduct, "id" | "createdAt">,
  id: string
): SellerProduct {
  const hits = evaluateListing(product);
  const openReports = countOpenReportsForSeller(seller.uid);
  const decision = resolveListingDecision(seller, product, hits, openReports);

  recordFlagHits({
    hits,
    productId: id,
    productName: product.name,
    sellerUid: seller.uid,
    shopName: seller.shopName,
    source: "rule",
  });

  return {
    ...product,
    subtitle: product.subtitle ?? "",
    tags: product.tags ?? [],
    status: decision.status,
    autoApproved: decision.autoApproved,
    reviewNote: decision.reviewNote,
    reviewedAt: decision.autoApproved ? new Date().toISOString() : undefined,
    flagHits: hits,
    views: product.views ?? 0,
    sales: product.sales ?? 0,
    id,
    createdAt: new Date().toISOString(),
  };
}

export function SellerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [allSellers, setAllSellers] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSellers = useCallback(() => {
    const all = loadAllSellers();
    const list = Object.values(all).map(normalizeSeller);
    setAllSellers(list);
    if (user) {
      setSeller(all[user.uid] ? normalizeSeller(all[user.uid]) : null);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSeller(null);
      setAllSellers(Object.values(loadAllSellers()).map(normalizeSeller));
      setLoading(false);
      return;
    }

    refreshSellers();
    setLoading(false);
  }, [user, refreshSellers]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== SELLERS_STORAGE_KEY) return;
      refreshSellers();
    };
    const onCustom = () => refreshSellers();
    window.addEventListener("storage", onStorage);
    window.addEventListener("forest-buddies-sellers-updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("forest-buddies-sellers-updated", onCustom);
    };
  }, [refreshSellers]);

  const persistCurrent = useCallback(
    (next: SellerProfile | null) => {
      if (!user) return;
      const all = loadAllSellers();
      if (next) {
        all[user.uid] = next;
      } else {
        delete all[user.uid];
      }
      saveAllSellers(all);
      setSeller(next);
      setAllSellers(Object.values(all).map(normalizeSeller));
    },
    [user]
  );

  const applyAsSeller = useCallback(
    (application: SellerApplicationInput) => {
      if (!user) return;
      const all = loadAllSellers();
      const existing = all[user.uid];
      const sellerType = application.sellerType;
      const tradingName = application.tradingName?.trim() || undefined;
      const companyName = application.companyName?.trim() || undefined;
      const shopName =
        application.shopName.trim() ||
        tradingName ||
        companyName ||
        "My Forest Shop";

      const profile: SellerProfile = {
        uid: user.uid,
        email: user.email ?? "",
        shopName,
        slug: uniqueShopSlug(shopName, all, user.uid),
        sellerType,
        bio: application.bio.trim(),
        story: (application.story ?? "").trim(),
        location: application.location?.trim() || undefined,
        tradingName: sellerType === "individual" ? tradingName || shopName : undefined,
        servicesOffered:
          sellerType === "individual"
            ? application.servicesOffered?.trim() || undefined
            : application.servicesOffered?.trim() || undefined,
        professionalBackground:
          sellerType === "individual"
            ? application.professionalBackground?.trim() || undefined
            : undefined,
        companyName:
          sellerType === "business" ? companyName || shopName : undefined,
        impact: existing?.impact?.length
          ? existing.impact
          : [
              {
                causeId: "trees",
                unitsSupported: 0,
                label: "Trees you will help fund",
              },
            ],
        status: "pending" as SellerStatus,
        appliedAt: new Date().toISOString(),
        approvedAt: undefined,
        pausedAt: undefined,
        canceledAt: undefined,
        products: existing?.products ?? [],
        earnings: existing?.earnings ?? defaultEarnings(),
        analytics: existing?.analytics ?? defaultAnalytics(),
        payouts: existing?.payouts ?? defaultPayouts(),
        payoutMethod: existing?.payoutMethod ?? "Bank transfer ····4821",
        trustOverride: existing?.trustOverride,
        coverImageUrl: existing?.coverImageUrl,
        founderNote: existing?.founderNote,
        impactStory: existing?.impactStory,
      };
      persistCurrent(profile);
    },
    [user, persistCurrent]
  );

  const updateSellerProfile = useCallback(
    (fields: {
      shopName?: string;
      bio?: string;
      story?: string;
      sellerType?: SellerType;
      tradingName?: string;
      servicesOffered?: string;
      professionalBackground?: string;
      companyName?: string;
      location?: string;
    }) => {
      if (!seller || !user) return;
      const all = loadAllSellers();
      const nextName = fields.shopName?.trim() ?? seller.shopName;
      persistCurrent({
        ...seller,
        shopName: nextName,
        slug:
          nextName !== seller.shopName
            ? uniqueShopSlug(nextName, all, user.uid)
            : seller.slug || uniqueShopSlug(nextName, all, user.uid),
        bio: fields.bio !== undefined ? fields.bio.trim() : seller.bio,
        story: fields.story !== undefined ? fields.story.trim() : seller.story,
        sellerType:
          fields.sellerType !== undefined
            ? fields.sellerType
            : seller.sellerType,
        tradingName:
          fields.tradingName !== undefined
            ? fields.tradingName.trim() || undefined
            : seller.tradingName,
        servicesOffered:
          fields.servicesOffered !== undefined
            ? fields.servicesOffered.trim() || undefined
            : seller.servicesOffered,
        professionalBackground:
          fields.professionalBackground !== undefined
            ? fields.professionalBackground.trim() || undefined
            : seller.professionalBackground,
        companyName:
          fields.companyName !== undefined
            ? fields.companyName.trim() || undefined
            : seller.companyName,
        location:
          fields.location !== undefined
            ? fields.location.trim() || undefined
            : seller.location,
      });
    },
    [seller, user, persistCurrent]
  );

  const simulateApproval = useCallback(() => {
    if (!seller) return;
    persistCurrent({
      ...seller,
      status: "approved",
      approvedAt: new Date().toISOString(),
      pausedAt: undefined,
      canceledAt: undefined,
      earnings: seller.earnings.total ? seller.earnings : defaultEarnings(),
      analytics: seller.analytics ?? defaultAnalytics(),
      payouts: seller.payouts?.length ? seller.payouts : defaultPayouts(),
    });
  }, [seller, persistCurrent]);

  const pauseSeller = useCallback(() => {
    if (!user) return;
    storagePauseSeller(user.uid);
    refreshSellers();
  }, [user, refreshSellers]);

  const resumeSeller = useCallback(() => {
    if (!user) return;
    storageResumeSeller(user.uid);
    refreshSellers();
  }, [user, refreshSellers]);

  const cancelSeller = useCallback(() => {
    if (!user) return;
    storageCancelSeller(user.uid);
    refreshSellers();
  }, [user, refreshSellers]);

  const setSellerAccountStatus = useCallback(
    (
      uid: string,
      status: Extract<
        SellerStatus,
        "approved" | "rejected" | "pending" | "paused" | "none"
      >
    ) => {
      storageSetSellerAccountStatus(uid, status);
      refreshSellers();
    },
    [refreshSellers]
  );

  const setSellerTrustOverride = useCallback(
    (uid: string, trustOverride: SellerTrustTier | null) => {
      storageSetSellerTrustOverride(uid, trustOverride);
      refreshSellers();
    },
    [refreshSellers]
  );

  const setProductApproval = useCallback(
    (
      sellerUid: string,
      productId: string,
      status: ProductApprovalStatus,
      reviewNote?: string
    ) => {
      storageSetProductApproval(sellerUid, productId, status, reviewNote);
      if (status === "approved" || status === "rejected") {
        resolveFlagsForProduct(productId, "resolved");
      }
      refreshSellers();
    },
    [refreshSellers]
  );

  const addProduct = useCallback(
    (product: Omit<SellerProduct, "id" | "createdAt">) => {
      if (!seller || seller.status !== "approved") return;
      const next = prepareProduct(seller, product, `sp-${Date.now()}`);
      persistCurrent({
        ...seller,
        products: [next, ...seller.products],
      });
    },
    [seller, persistCurrent]
  );

  const addProducts = useCallback(
    (products: Omit<SellerProduct, "id" | "createdAt">[]) => {
      if (!seller || seller.status !== "approved" || products.length === 0) {
        return 0;
      }
      const now = Date.now();
      const nextItems = products.map((product, index) =>
        prepareProduct(seller, product, `sp-${now}-${index}`)
      );
      persistCurrent({
        ...seller,
        products: [...nextItems, ...seller.products],
      });
      return nextItems.length;
    },
    [seller, persistCurrent]
  );

  const updateProduct = useCallback(
    (id: string, product: Omit<SellerProduct, "id" | "createdAt">) => {
      if (!seller) return;
      const prepared = prepareProduct(seller, product, id);
      persistCurrent({
        ...seller,
        products: seller.products.map((p) =>
          p.id === id
            ? {
                ...prepared,
                id: p.id,
                createdAt: p.createdAt,
                views: p.views,
                sales: p.sales,
              }
            : p
        ),
      });
    },
    [seller, persistCurrent]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      if (!seller) return;
      persistCurrent({
        ...seller,
        products: seller.products.filter((p) => p.id !== id),
      });
    },
    [seller, persistCurrent]
  );

  const requestPayout = useCallback(
    (amount?: number) => {
      if (!seller || seller.status !== "approved") return false;
      const available = seller.earnings.available ?? 0;
      const requestAmount = Math.min(amount ?? available, available);
      if (requestAmount < 10) return false;

      const scheduled = new Date();
      scheduled.setDate(scheduled.getDate() + 3);

      const payout = {
        id: `po-${Date.now()}`,
        amount: Number(requestAmount.toFixed(2)),
        status: "processing" as const,
        method: seller.payoutMethod ?? "Bank transfer ····4821",
        scheduledFor: scheduled.toISOString().slice(0, 10),
      };

      persistCurrent({
        ...seller,
        earnings: {
          ...seller.earnings,
          available: Number((available - requestAmount).toFixed(2)),
          pending: Number(
            (seller.earnings.pending + requestAmount).toFixed(2)
          ),
        },
        payouts: [
          payout,
          ...seller.payouts.filter((p) => p.id !== "po-next"),
        ],
      });
      return true;
    },
    [seller, persistCurrent]
  );

  const value = useMemo(
    () => ({
      seller,
      loading,
      allSellers,
      refreshSellers,
      applyAsSeller,
      updateSellerProfile,
      simulateApproval,
      pauseSeller,
      resumeSeller,
      cancelSeller,
      setSellerAccountStatus,
      setSellerTrustOverride,
      setProductApproval,
      addProduct,
      addProducts,
      updateProduct,
      deleteProduct,
      requestPayout,
    }),
    [
      seller,
      loading,
      allSellers,
      refreshSellers,
      applyAsSeller,
      updateSellerProfile,
      simulateApproval,
      pauseSeller,
      resumeSeller,
      cancelSeller,
      setSellerAccountStatus,
      setSellerTrustOverride,
      setProductApproval,
      addProduct,
      addProducts,
      updateProduct,
      deleteProduct,
      requestPayout,
    ]
  );

  return (
    <SellerContext.Provider value={value}>{children}</SellerContext.Provider>
  );
}

export function useSeller() {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error("useSeller must be used within a SellerProvider");
  }
  return context;
}
