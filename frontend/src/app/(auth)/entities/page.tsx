import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { EntityList } from "@/components/features/entities/entity-list";

export const metadata: Metadata = {
  title: "Entités | Baillr",
};

export default function EntitiesPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Entités propriétaires
        </h1>
        <Button asChild>
          <Link href="/entities/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvelle entité
          </Link>
        </Button>
      </div>
      <EntityList />
    </div>
  );
}
