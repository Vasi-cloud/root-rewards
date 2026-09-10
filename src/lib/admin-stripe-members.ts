/** Shared Admin Members row shape (Stripe-backed). Safe for client + server. */

export type AdminMemberStatus = "active" | "cancelled" | "past_due";

export type AdminStripeMember = {
  subscriptionId: string;
  customerId: string;
  /** Stripe customer email when present */
  email: string | null;
  /** True when customer has no email in Stripe */
  emailMissing: boolean;
  status: AdminMemberStatus;
  plan: "Impact Member";
  periodEndsAt: string | null;
  startedAt: string;
  amountMonthly: number;
  cancelAtPeriodEnd: boolean;
};
