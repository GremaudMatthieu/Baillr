import { Injectable } from '@nestjs/common';
import { sanitizeForFilename } from '@infrastructure/shared/sanitize-filename.util.js';
import type { AccountEntryWithTenant } from '../finders/accounting.finder.js';
import type {
  AccountBookExcelData,
  AccountBookExcelEntry,
} from '@infrastructure/document/account-book-excel-data.interface.js';

// SYNC: must match frontend/src/lib/constants/operation-types.ts (OPERATION_TYPE_LABELS)
const CATEGORY_LABELS: Record<string, string> = {
  rent_call: 'Appel de loyer',
  payment: 'Paiement',
  overpayment_credit: 'Trop-perçu',
  charge_regularization: 'Régularisation',
  adjustment: 'Ajustement',
};

const CATEGORY_ORDER = [
  'rent_call',
  'payment',
  'overpayment_credit',
  'charge_regularization',
  'adjustment',
];

@Injectable()
export class AccountBookExcelAssembler {
  assemble(
    entity: { name: string },
    entries: AccountEntryWithTenant[],
    filters: { startDate?: string; endDate?: string },
  ): AccountBookExcelData {
    const now = new Date();
    const exportDate = this.formatDateDMY(now);

    const dateRange = this.buildDateRange(filters.startDate, filters.endDate);

    const excelEntries: AccountBookExcelEntry[] = entries.map((entry) =>
      this.mapEntry(entry),
    );

    const entriesByCategory: Record<string, AccountBookExcelEntry[]> = {};
    for (const categoryKey of CATEGORY_ORDER) {
      const label = CATEGORY_LABELS[categoryKey] ?? categoryKey;
      const categoryEntries = excelEntries.filter(
        (e) => e.category === label,
      );
      if (categoryEntries.length > 0) {
        entriesByCategory[label] = categoryEntries;
      }
    }
    // Handle unknown categories
    for (const entry of excelEntries) {
      if (
        !Object.values(CATEGORY_LABELS).includes(entry.category) &&
        !entriesByCategory[entry.category]
      ) {
        entriesByCategory[entry.category] = excelEntries.filter(
          (e) => e.category === entry.category,
        );
      }
    }

    const totalDebitEuros = excelEntries.reduce(
      (sum, e) => sum + (e.debitEuros ?? 0),
      0,
    );
    const totalCreditEuros = excelEntries.reduce(
      (sum, e) => sum + (e.creditEuros ?? 0),
      0,
    );
    const totalBalanceEuros =
      excelEntries.length > 0
        ? excelEntries[excelEntries.length - 1].balanceEuros
        : 0;

    return {
      entityName: entity.name,
      dateRange,
      exportDate,
      entries: excelEntries,
      entriesByCategory,
      totalDebitEuros,
      totalCreditEuros,
      totalBalanceEuros,
    };
  }

  buildFilename(entityName: string): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sanitized = sanitizeForFilename(entityName).toLowerCase();
    return `livre-comptes-${sanitized}-${date}.xlsx`;
  }

  private mapEntry(entry: AccountEntryWithTenant): AccountBookExcelEntry {
    const amountEuros = entry.amountCents / 100;
    const isDebit = entry.type === 'debit';

    return {
      date: this.formatDateDMY(new Date(entry.entryDate)),
      category: CATEGORY_LABELS[entry.category] ?? entry.category,
      description: entry.description,
      tenantName: this.formatTenantName(entry.tenant),
      debitEuros: isDebit ? amountEuros : null,
      creditEuros: isDebit ? null : amountEuros,
      balanceEuros: entry.balanceCents / 100,
    };
  }

  private formatTenantName(tenant: {
    firstName: string;
    lastName: string;
    companyName: string | null;
    type: string;
  }): string {
    if (tenant.type === 'company' && tenant.companyName) {
      return tenant.companyName;
    }
    return `${tenant.firstName} ${tenant.lastName}`;
  }

  private formatDateDMY(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  private buildDateRange(startDate?: string, endDate?: string): string {
    if (startDate && endDate) {
      const start = this.formatDateDMY(new Date(startDate));
      const end = this.formatDateDMY(new Date(endDate));
      return `${start} — ${end}`;
    }
    if (startDate) {
      return `Depuis le ${this.formatDateDMY(new Date(startDate))}`;
    }
    if (endDate) {
      return `Jusqu'au ${this.formatDateDMY(new Date(endDate))}`;
    }
    return 'Toutes les dates';
  }
}
