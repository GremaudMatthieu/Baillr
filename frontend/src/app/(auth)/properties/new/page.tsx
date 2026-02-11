"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PropertyForm } from "@/components/features/properties/property-form";

export default function NewPropertyPage() {
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
        <h1 className="text-2xl font-bold tracking-tight">
          Nouveau bien immobilier
        </h1>
      </div>
      <div className="max-w-2xl">
        <PropertyForm />
      </div>
    </div>
  );
}
