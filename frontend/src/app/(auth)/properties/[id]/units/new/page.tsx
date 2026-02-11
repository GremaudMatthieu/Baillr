"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UnitForm } from "@/components/features/units/unit-form";

export default function NewUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: propertyId } = use(params);
  const router = useRouter();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Nouveau lot</h1>
      </div>
      <div className="max-w-2xl">
        <UnitForm propertyId={propertyId} />
      </div>
    </div>
  );
}
