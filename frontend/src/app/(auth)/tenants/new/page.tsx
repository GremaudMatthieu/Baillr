"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TenantForm } from "@/components/features/tenants/tenant-form";

export default function NewTenantPage() {
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
          Nouveau locataire
        </h1>
      </div>
      <div className="max-w-2xl">
        <TenantForm />
      </div>
    </div>
  );
}
