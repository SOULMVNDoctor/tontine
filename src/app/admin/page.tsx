import { AdminPageClient } from "@/components/AdminPageClient";
import { requireAdmin } from "@/lib/serverAuth";

export default async function AdminPage() {
  await requireAdmin();
  return <AdminPageClient />;
}
