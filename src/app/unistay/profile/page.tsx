import { redirect } from "next/navigation";

export default function ProfilePage() {
  redirect("/unistay/dashboard?tab=profile");
}
