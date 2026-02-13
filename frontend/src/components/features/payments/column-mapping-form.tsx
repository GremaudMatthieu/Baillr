"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColumnMapping } from "@/hooks/use-bank-statements";

interface ColumnMappingFormProps {
  mapping: Partial<ColumnMapping>;
  onChange: (mapping: Partial<ColumnMapping>) => void;
}

export function ColumnMappingForm({
  mapping,
  onChange,
}: ColumnMappingFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (field: keyof ColumnMapping, value: string) => {
    onChange({ ...mapping, [field]: value });
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        Configuration avancée
        {isOpen ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>

      {isOpen && (
        <div className="grid gap-3 rounded-lg border p-3">
          <div className="grid gap-1.5">
            <Label htmlFor="dateColumn">Colonne date</Label>
            <Input
              id="dateColumn"
              placeholder="Date"
              value={mapping.dateColumn ?? ""}
              onChange={(e) => handleChange("dateColumn", e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="amountColumn">Colonne montant</Label>
            <Input
              id="amountColumn"
              placeholder="Montant"
              value={mapping.amountColumn ?? ""}
              onChange={(e) => handleChange("amountColumn", e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="payerColumn">Colonne payeur / libellé</Label>
            <Input
              id="payerColumn"
              placeholder="Libellé"
              value={mapping.payerColumn ?? ""}
              onChange={(e) => handleChange("payerColumn", e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="referenceColumn">Colonne référence</Label>
            <Input
              id="referenceColumn"
              placeholder="Référence"
              value={mapping.referenceColumn ?? ""}
              onChange={(e) => handleChange("referenceColumn", e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="amountFormat">Format montant</Label>
            <Select
              value={mapping.amountFormat ?? "european"}
              onValueChange={(v) =>
                handleChange("amountFormat", v as "european" | "standard")
              }
            >
              <SelectTrigger id="amountFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="european">
                  Européen (1.234,56)
                </SelectItem>
                <SelectItem value="standard">Standard (1,234.56)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
