"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPERATION_TYPE_LABELS } from "@/lib/constants/operation-types";
import type { AccountingFilters } from "@/lib/api/accounting-api";

interface TenantOption {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  type: string;
}

interface AccountBookFiltersProps {
  filters: AccountingFilters;
  onFiltersChange: (filters: AccountingFilters) => void;
  tenants: TenantOption[];
  availableCategories: string[];
}

export function AccountBookFilters({
  filters,
  onFiltersChange,
  tenants,
  availableCategories,
}: AccountBookFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-start-date" className="text-xs text-muted-foreground">
          Date début
        </label>
        <input
          id="filter-start-date"
          type="date"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.startDate ?? ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              startDate: e.target.value || undefined,
            })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-end-date" className="text-xs text-muted-foreground">
          Date fin
        </label>
        <input
          id="filter-end-date"
          type="date"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.endDate ?? ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              endDate: e.target.value || undefined,
            })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Type</label>
        <Select
          value={filters.category ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              category: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[180px]" aria-label="Filtrer par type">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {OPERATION_TYPE_LABELS[cat] ?? cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Locataire</label>
        <Select
          value={filters.tenantId ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              tenantId: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[200px]" aria-label="Filtrer par locataire">
            <SelectValue placeholder="Tous les locataires" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les locataires</SelectItem>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.type === "company" && t.companyName
                  ? t.companyName
                  : `${t.firstName} ${t.lastName}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
