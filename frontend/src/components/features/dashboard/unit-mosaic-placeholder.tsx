import { Building2 } from "lucide-react";

export function UnitMosaicPlaceholder() {
  return (
    <div
      className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25"
      aria-label="Mosaïque des lots"
    >
      <Building2
        className="h-10 w-10 text-muted-foreground/50"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-medium text-muted-foreground">
        Aucun lot configuré
      </p>
      <p className="mt-1 text-xs text-muted-foreground/75">
        Vos lots apparaîtront ici une fois créés
      </p>
    </div>
  );
}
