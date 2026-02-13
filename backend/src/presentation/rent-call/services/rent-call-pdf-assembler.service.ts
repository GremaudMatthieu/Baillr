import { Injectable } from '@nestjs/common';
import type {
  OwnershipEntity,
  Tenant,
  Unit,
  Lease,
  BankAccount,
  RentCall,
} from '@prisma/client';
import type { RentCallPdfData } from '@infrastructure/document/rent-call-pdf-data.interface';
import { formatMonthLabel } from '@infrastructure/document/format-euro.util';

@Injectable()
export class RentCallPdfAssembler {
  assembleFromRentCall(
    rentCall: RentCall,
    tenant: Tenant,
    unit: Unit,
    lease: Lease,
    entity: OwnershipEntity,
    bankAccounts: BankAccount[],
  ): RentCallPdfData {
    const tenantName = this.formatTenantName(tenant);
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
      ? (rentCall.billingLines as Array<{
          label: string;
          amountCents: number;
          type: string;
        }>)
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

  private formatTenantName(tenant: Tenant): string {
    if (tenant.type === 'company' && tenant.companyName) {
      return tenant.companyName;
    }
    return `${tenant.firstName} ${tenant.lastName}`;
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
    bankAccounts: BankAccount[],
  ): BankAccount | undefined {
    // Prefer isDefault bank_account, then any bank_account (not cash_register)
    const bankOnly = bankAccounts.filter((ba) => ba.type === 'bank_account');
    return bankOnly.find((ba) => ba.isDefault) ?? bankOnly[0];
  }
}
