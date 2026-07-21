import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leafy Kitchen Assistant",
  description:
    "Paste a recipe and let Leafy build a smart shopping list — buy online, check local stores, and plan your cook time.",
};

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
