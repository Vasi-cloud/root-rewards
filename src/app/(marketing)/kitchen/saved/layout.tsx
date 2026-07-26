import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Kitchen · Saved lists",
  description:
    "Reopen shopping lists and recipes you’ve saved in Leafy Kitchen.",
};

export default function KitchenSavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
