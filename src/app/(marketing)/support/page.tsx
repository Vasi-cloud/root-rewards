import { redirect } from "next/navigation";

/** Alias for Support a cause → /donate */
export default function SupportPage() {
  redirect("/donate");
}
