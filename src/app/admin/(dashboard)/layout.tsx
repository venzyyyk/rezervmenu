import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { getDashboardStats } from "@/server/admin";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const stats = await getDashboardStats();

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <AdminSidebar
        newOrders={stats.newOrdersCount}
        newReservations={stats.newReservationsCount}
      />

      {/* Контент */}
      <div className="flex-1 overflow-y-auto md:pt-0 pt-14 pb-16 md:pb-0">
        {children}
      </div>
    </div>
  );
}
