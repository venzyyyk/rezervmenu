import { getMenuForAdmin } from "@/server/admin";
import { MenuEditor } from "@/components/admin/MenuEditor";

export default async function AdminMenuPage() {
  const data = await getMenuForAdmin();
  return <MenuEditor initialData={data} />;
}
