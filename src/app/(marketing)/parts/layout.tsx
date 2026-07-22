import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leafy Parts Finder",
  description:
    "Snap the old part. Find the right replacement. Plant a tree — with Leafy Parts Finder on Forest Buddies.",
};

export default function PartsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
