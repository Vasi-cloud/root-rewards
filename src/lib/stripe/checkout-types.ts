import type { CauseId, CauseSelection } from "@/lib/causes";

export type CheckoutLineItemInput = {
  id: string;
  name: string;
  unitAmountCents: number;
  quantity: number;
  description?: string;
};

export type CreateCheckoutSessionBody = {
  email: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  lineItems: CheckoutLineItemInput[];
  causeSelection: CauseSelection;
  memberCreditCents: number;
  userId?: string | null;
};

export type CreateMembershipSessionBody = {
  email: string;
  userId?: string | null;
  customerId?: string | null;
};

export const CAUSE_IDS: CauseId[] = [
  "trees",
  "ocean",
  "animals",
  "education",
  "climate",
];
