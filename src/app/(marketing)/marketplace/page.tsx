import type { Metadata } from "next";

import MarketplaceClient from "./MarketplaceClient";

export const metadata: Metadata = {
  title: "Forest Buddies® Marketplace",
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
