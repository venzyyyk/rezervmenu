import { getVenuesAdmin, addTable, deleteTable } from "@/server/admin";
import { VenuesClient } from "./VenuesClient";

export default async function AdminVenuesPage() {
  const venues = await getVenuesAdmin();
  return <VenuesClient venues={venues} />;
}
