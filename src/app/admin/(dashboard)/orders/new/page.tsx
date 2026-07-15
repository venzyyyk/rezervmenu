import { getOrderFormData } from "@/server/admin";
import NewOrderClient from "./NewOrderClient";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const venues = await getOrderFormData();
  return <NewOrderClient venues={venues} />;
}
