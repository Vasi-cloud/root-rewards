import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Kitchen · Saved & recent",
  description:
    "Reopen saved shopping lists and recipes, plus recent Leafy Kitchen history.",
};

export default function KitchenSavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
