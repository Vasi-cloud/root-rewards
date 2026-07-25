import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Garage · Leafy Parts",
  description:
    "Your saved parts from Leafy Parts Finder — stored on this device for easy revisit.",
};

export default function PartsGarageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
