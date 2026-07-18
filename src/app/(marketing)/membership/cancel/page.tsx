"use client";

import { ArrowLeft, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function MembershipCancelPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-16">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-amber-100 sm:size-20">
        <XCircle className="size-8 text-amber-800 sm:size-10" />
      </div>
      <h1 className="font-heading text-3xl font-semibold text-primary">
        Membership checkout canceled
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        No subscription was started and no card was charged. You can join Impact
        Member anytime from the plans page.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          nativeButton={false}
          render={<Link href="/membership" />}
          size="lg"
          className="min-h-12 gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to plans
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/marketplace" />}
          variant="outline"
          size="lg"
          className="min-h-12"
        >
          Continue shopping
        </Button>
      </div>
    </div>
  );
}
