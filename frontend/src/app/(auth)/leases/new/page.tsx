"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LeaseForm } from "@/components/features/leases/lease-form";

export default function NewLeasePage() {
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
        <h1 className="text-2xl font-bold tracking-tight">Nouveau bail</h1>
      </div>
      <div className="max-w-2xl">
        <LeaseForm />
      </div>
    </div>
  );
}
