import Link from "next/link";
import { Leaf } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-sage/25 to-cream">
      <header className="px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-heading text-lg font-semibold text-primary"
        >
          <Leaf className="size-5" />
          Forest Buddies
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  );
}
