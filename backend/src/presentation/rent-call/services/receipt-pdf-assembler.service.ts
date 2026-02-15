import { Injectable } from '@nestjs/common';
import type {
  RentCallTenantData,
  RentCallUnitData,
  RentCallLeaseData,
  RentCallEntityData,
  RentCallBankAccountData,
} from '@billing/rent-call/rent-call-data.interfaces';
import type { ReceiptPdfData } from '@infrastructure/document/receipt-pdf-data.interface';
import { formatMonthLabel } from '@infrastructure/document/format-euro.util';
import { formatTenantDisplayName } from '@infrastructure/shared/format-tenant-name.util';

export interface ReceiptRentCallData {
  month: string;
  rentAmountCents: number;
  billingLines: Array<{ categoryLabel: string; amountCents: number }> | unknown;
  totalAmountCents: number;
  isProRata: boolean;
  occupiedDays: number | null;
  totalDaysInMonth: number | null;
  paymentStatus: string | null;
  remainingBalanceCents: number | null;
}

export interface ReceiptPaymentData {
  amountCents: number;
  paymentDate: Date;
  paymentMethod: string;
}

@Injectable()
export class ReceiptPdfAssembler {
  assembleFromRentCall(
    rentCall: ReceiptRentCallData,
    tenant: RentCallTenantData,
    unit: RentCallUnitData,
    lease: RentCallLeaseData,
    entity: RentCallEntityData,
    bankAccounts: RentCallBankAccountData[],
    payments: ReceiptPaymentData[],
  ): ReceiptPdfData {
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

    const receiptType =
      rentCall.paymentStatus === 'paid' || rentCall.paymentStatus === 'overpaid'
        ? 'quittance'
        : 'recu_paiement';

    const totalPaidCents = payments.reduce((sum, p) => sum + p.amountCents, 0);

    const sortedPayments = [...payments].sort(
      (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime(),
    );

    const lastPayment = sortedPayments[sortedPayments.length - 1];
    const paymentDate = lastPayment
      ? this.formatDate(new Date(lastPayment.paymentDate))
      : '';

    return {
      receiptType,
      entityName: entity.name,
      entityAddress,
      entitySiret: entity.siret ?? null,
      tenantName,
      tenantAddress,
      unitIdentifier: unit.identifier,
      leaseReference,
      billingPeriod: formatMonthLabel(rentCall.month),
      rentAmountCents: rentCall.rentAmountCents,
      billingLines,
      totalAmountCents: rentCall.totalAmountCents,
      totalPaidCents,
      remainingBalanceCents: rentCall.remainingBalanceCents ?? 0,
      paymentDate,
      payments: sortedPayments.map((p) => ({
        date: this.formatDate(new Date(p.paymentDate)),
        amountCents: p.amountCents,
        method: this.formatPaymentMethod(p.paymentMethod),
      })),
      iban: defaultBankAccount?.iban ?? null,
      bic: defaultBankAccount?.bic ?? null,
      isProRata: rentCall.isProRata,
      occupiedDays: rentCall.occupiedDays,
      totalDaysInMonth: rentCall.totalDaysInMonth,
    };
  }

  private formatDate(date: Date): string {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  private formatPaymentMethod(method: string): string {
    switch (method) {
      case 'bank_transfer':
        return 'Virement bancaire';
      case 'cash':
        return 'Espèces';
      case 'check':
        return 'Chèque';
      default:
        return method;
    }
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
    const bankOnly = bankAccounts.filter((ba) => ba.type === 'bank_account');
    return bankOnly.find((ba) => ba.isDefault) ?? bankOnly[0];
  }
}
