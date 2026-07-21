import { redirect } from "next/navigation";

/** `/account/settings` → `/dashboard/settings` */
export default function AccountSettingsAliasRedirect() {
  redirect("/dashboard/settings");
}
