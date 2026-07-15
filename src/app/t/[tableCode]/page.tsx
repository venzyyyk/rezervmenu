import { getTableByCode } from "@/server/menu";
import { getOpenOrdersByTableCode } from "@/server/orders";
import { notFound } from "next/navigation";
import TableQRClient from "./TableQRClient";
import TableBillClient from "./TableBillClient";

interface Props {
  params: { tableCode: string };
}

export const dynamic = "force-dynamic";

export default async function TableQRPage({ params }: Props) {
  const table = await getTableByCode(params.tableCode);
  if (!table) notFound();

  // Есть ли открытый счёт у стола (заказ, созданный официантом или гостем)
  const openOrders = await getOpenOrdersByTableCode(params.tableCode);

  if (openOrders.length > 0) {
    return (
      <TableBillClient
        tableCode={params.tableCode}
        tableNumber={table.number}
        venueSlug={table.venue.slug}
        venueName={table.venue.name}
        orders={openOrders}
        stripeEnabled={Boolean(process.env.STRIPE_SECRET_KEY)}
      />
    );
  }

  // Счёта нет — как раньше: сохраняем стол и открываем меню
  return (
    <TableQRClient
      tableCode={params.tableCode}
      tableNumber={table.number}
      venueSlug={table.venue.slug}
      venueName={table.venue.name}
    />
  );
}
