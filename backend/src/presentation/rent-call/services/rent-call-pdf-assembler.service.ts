import { Injectable } from '@nestjs/common';
import type {
  RentCallCoreData,
  RentCallTenantData,
  RentCallUnitData,
  RentCallLeaseData,
  RentCallEntityData,
  RentCallBankAccountData,
} from '@billing/rent-call/rent-call-data.interfaces';
import type { RentCallPdfData } from '@infrastructure/document/rent-call-pdf-data.interface';
import { formatMonthLabel } from '@infrastructure/document/format-euro.util';
import { formatTenantDisplayName } from '@infrastructure/shared/format-tenant-name.util';

@Injectable()
export class RentCallPdfAssembler {
  assembleFromRentCall(
    rentCall: RentCallCoreData,
    tenant: RentCallTenantData,
    unit: RentCallUnitData,
    lease: RentCallLeaseData,
    entity: RentCallEntityData,
    bankAccounts: RentCallBankAccountData[],
  ): RentCallPdfData {
    const tenantName = formatTenantDisplayName(tenant);
    const tenantAddress = this.formatAddress(
      tenant.addressStreet,
      tenant.addressPostalCode,
      tenant.addressCity,
      tenant.addressComplement,
    );
    const entityAddress = this.formatAddress(
      entity.addressStreet,
      entity.addressPostalCode,
      entity.addressCity,
      entity.addressComplement,
    );

    const defaultBankAccount = this.findDefaultBankAccount(bankAccounts);

    const startDate = new Date(lease.startDate);
    const leaseReference = `${String(startDate.getDate()).padStart(2, '0')}/${String(startDate.getMonth() + 1).padStart(2, '0')}/${startDate.getFullYear()}`;

    const billingLines = Array.isArray(rentCall.billingLines)
      ? (rentCall.billingLines as Array<Record<string, unknown>>).map((line) => ({
          categoryLabel: typeof line.categoryLabel === 'string' ? line.categoryLabel : 'Charge',
          amountCents: typeof line.amountCents === 'number' ? line.amountCents : 0,
        }))
      : [];

    return {
      entityName: entity.name,
      entityAddress,
      entitySiret: entity.siret ?? null,
      tenantName,
      tenantAddress,
      unitIdentifier: unit.identifier,
      leaseReference,
      billingPeriod: formatMonthLabel(rentCall.month),
      dueDate: lease.monthlyDueDate,
      rentAmountCents: rentCall.rentAmountCents,
      billingLines,
      totalAmountCents: rentCall.totalAmountCents,
      isProRata: rentCall.isProRata,
      occupiedDays: rentCall.occupiedDays,
      totalDaysInMonth: rentCall.totalDaysInMonth,
      iban: defaultBankAccount?.iban ?? null,
      bic: defaultBankAccount?.bic ?? null,
    };
  }

  private formatAddress(
    street: string | null,
    postalCode: string | null,
    city: string | null,
    complement: string | null,
  ): string {
    const parts: string[] = [];
    if (street) parts.push(street);
    if (complement) parts.push(complement);
    if (postalCode || city) {
      parts.push([postalCode, city].filter(Boolean).join(' '));
    }
    return parts.join(', ');
  }

  private findDefaultBankAccount(
    bankAccounts: RentCallBankAccountData[],
  ): RentCallBankAccountData | undefined {
    // Prefer isDefault bank_account, then any bank_account (not cash_register)
    const bankOnly = bankAccounts.filter((ba) => ba.type === 'bank_account');
    return bankOnly.find((ba) => ba.isDefault) ?? bankOnly[0];
  }
}
