import { redirect } from "next/navigation";

/** `/settings` → `/dashboard/settings` */
export default function LegacySettingsRedirect() {
  redirect("/dashboard/settings");
}
