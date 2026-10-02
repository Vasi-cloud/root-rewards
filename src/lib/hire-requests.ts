import {
  isLeaValleyHireListing,
  LEA_VALLEY_HIRE_EMAIL,
  LEA_VALLEY_SHOP_NAME,
  LEA_VALLEY_UID,
  leaValleyHireTitle,
} from "@/lib/lea-valley-guest";

export const HIRE_REQUESTS_STORAGE_KEY = "forest-buddies-hire-requests";
const EVENT = "forest-buddies-hire-requests-updated";

export const HIRE_REQUEST_CONFIRMATION =
  "Request sent — the seller confirms. This is not a booking.";

export type HireRequest = {
  id: string;
  listingId: string;
  listingTitle: string;
  name: string;
  email: string;
  dates: string;
  shopUid: string;
  shopName: string;
  createdAt: string;
  status: "new";
};

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeHireRequests(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function loadHireRequests(): HireRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HIRE_REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HireRequest[];
    return Array.isArray(parsed)
      ? parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];
  } catch {
    return [];
  }
}

function saveLocal(items: HireRequest[]) {
  try {
    localStorage.setItem(
      HIRE_REQUESTS_STORAGE_KEY,
      JSON.stringify(items.slice(0, 200))
    );
    emit();
  } catch {
    // ignore
  }
}

export function buildLeaValleyHireMailto(input: {
  listingTitle: string;
  name: string;
  email: string;
  dates: string;
}): string {
  const subject = `Hire request: ${input.listingTitle}`;
  const body = [
    "Hire request (not a booking)",
    "",
    `Listing: ${input.listingTitle}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Dates: ${input.dates}`,
    "",
    "Please confirm availability.",
  ].join("\n");
  return `mailto:${LEA_VALLEY_HIRE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function openMailto(href: string) {
  if (typeof window === "undefined") return;
  const link = document.createElement("a");
  link.href = href;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function submitLeaValleyHireRequest(input: {
  listingId: string;
  listingTitle: string;
  name: string;
  email: string;
  dates: string;
}): Promise<HireRequest> {
  const listingTitle = leaValleyHireTitle(input.listingId, input.listingTitle);
  if (
    !isLeaValleyHireListing({
      id: input.listingId,
      name: listingTitle,
    })
  ) {
    throw new Error("This listing does not take hire requests here.");
  }

  const request: HireRequest = {
    id: `hr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    listingId: input.listingId,
    listingTitle,
    name: input.name.trim(),
    email: input.email.trim(),
    dates: input.dates.trim(),
    shopUid: LEA_VALLEY_UID,
    shopName: LEA_VALLEY_SHOP_NAME,
    createdAt: new Date().toISOString(),
    status: "new",
  };

  saveLocal([request, ...loadHireRequests()]);

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 3000);
  let posted = false;
  try {
    const res = await fetch("/api/hire-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify(request),
    });
    posted = res.ok;
  } catch {
    posted = false;
  } finally {
    window.clearTimeout(timer);
  }

  if (!posted) {
    openMailto(buildLeaValleyHireMailto(request));
  }

  return request;
}
