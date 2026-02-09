import type { Metadata } from "next";

import { EntityForm } from "@/components/features/entities/entity-form";

export const metadata: Metadata = {
  title: "Nouvelle entité | Baillr",
};

export default function NewEntityPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        Créer une entité
      </h1>
      <div className="max-w-2xl">
        <EntityForm />
      </div>
    </div>
  );
}
