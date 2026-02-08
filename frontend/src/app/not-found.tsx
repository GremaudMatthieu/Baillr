import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page introuvable</h1>
      <p className="mt-3 text-muted-foreground">
        Cette page sera disponible prochainement.
      </p>
      <Button variant="outline" asChild className="mt-6">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour au tableau de bord
        </Link>
      </Button>
    </div>
  );
}
