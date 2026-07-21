import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { I18nProvider } from "@/contexts/i18n-context";
import { MembershipProvider } from "@/contexts/membership-context";
import { ModerationProvider } from "@/contexts/moderation-context";
import { SellerProvider } from "@/contexts/seller-context";
import { AppToastProvider } from "@/components/ui/app-toast";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Forest Buddies® — Sustainable Marketplace & Affiliates",
    template: "%s | Forest Buddies®",
  },
  description:
    "Shop sustainable products from verified eco brands. Earn rewards as an affiliate with Forest Buddies®.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden font-sans">
        <I18nProvider>
          <CartProvider>
            <AuthProvider>
              <MembershipProvider>
                <SellerProvider>
                  <ModerationProvider>
                    <AppToastProvider>{children}</AppToastProvider>
                  </ModerationProvider>
                </SellerProvider>
              </MembershipProvider>
            </AuthProvider>
          </CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
