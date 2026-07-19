import type { PayoutStatus, ProductApprovalStatus } from "@/types";

export function productStatusBadge(status: ProductApprovalStatus) {
  switch (status) {
    case "approved":
      return { label: "Approved", className: "bg-emerald-100 text-emerald-800" };
    case "rejected":
      return {
        label: "Rejected",
        className: "bg-destructive/10 text-destructive",
      };
    default:
      return { label: "Pending review", className: "bg-gold/25 text-primary" };
  }
}

export function payoutStatusBadge(status: PayoutStatus | string) {
  switch (status) {
    case "paid":
      return { label: "Paid", className: "bg-emerald-100 text-emerald-800" };
    case "processing":
      return { label: "Processing", className: "bg-primary/10 text-primary" };
    case "failed":
      return {
        label: "Failed",
        className: "bg-destructive/10 text-destructive",
      };
    default:
      return { label: "Scheduled", className: "bg-gold/25 text-primary" };
  }
}
