import type { Metadata } from "next";

import { ActionFeed } from "@/components/features/dashboard/action-feed";
import { DashboardContent } from "@/components/features/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <DashboardContent />

        <div>
          <ActionFeed />
        </div>
      </div>
    </div>
  );
}
