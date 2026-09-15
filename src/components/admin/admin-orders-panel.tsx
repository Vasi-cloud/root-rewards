"use client";

import { Loader2, Package, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

type AdminOrderRow = {
  id: string;
  orderNumber: string;
  customerEmail: string | null;
  amountTotalCents: number;
  currency: string;
  status: string;
  kind: string;
  itemCount: number;
  fulfilledAt: string;
  source: "local" | "stripe";
};

function formatMoney(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2);
  const cur = currency.toLowerCase();
  if (cur === "gbp") return `£${amount}`;
  if (cur === "usd") return `$${amount}`;
  return `${amount} ${currency.toUpperCase()}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16);
  }
}

export function AdminOrdersPanel() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyMode, setKeyMode] = useState<"test" | "live" | null>(null);

  const load = useCallback(async () => {
    const email = user?.email?.trim();
    if (!email) {
      setError("Sign in as admin to load orders.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/orders?email=${encodeURIComponent(email)}`,
        {
          headers: { "x-admin-email": email },
          cache: "no-store",
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        orders?: AdminOrderRow[];
        keyMode?: "test" | "live" | null;
        error?: string;
        stripeError?: string;
      };
      if (!res.ok) {
        setError(
          [data.error ?? "Could not load orders.", data.stripeError]
            .filter(Boolean)
            .join(" ")
        );
        setOrders([]);
        return;
      }
      setOrders(data.orders ?? []);
      setKeyMode(data.keyMode ?? null);
    } catch {
      setError("Could not load orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-primary">
            Orders
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            First-party Stripe Checkout sessions in GBP
            {keyMode ? ` · Stripe ${keyMode}` : ""}.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-11 shrink-0 gap-2 sm:h-9"
          disabled={loading}
          onClick={() => void load()}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="border-b border-primary/10 bg-emerald-50/40">
          <CardTitle className="font-heading flex items-center gap-2">
            <Package className="size-4 text-emerald-800" />
            Marketplace orders
          </CardTitle>
          <CardDescription>
            Order number · email · GBP total · status
            {orders.length > 0 ? ` · ${orders.length} shown` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading orders…
            </p>
          ) : orders.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No Stripe marketplace orders yet.
            </p>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-muted-foreground">
                      {order.orderNumber}
                    </div>
                    <div className="font-medium">
                      {order.customerEmail ?? "email missing"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(order.fulfilledAt)}
                      {order.itemCount > 0
                        ? ` · ${order.itemCount} line${order.itemCount === 1 ? "" : "s"}`
                        : ""}
                      {order.source === "stripe" ? " · Stripe" : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-semibold tabular-nums text-primary">
                      {formatMoney(order.amountTotalCents, order.currency)}
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-950">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
