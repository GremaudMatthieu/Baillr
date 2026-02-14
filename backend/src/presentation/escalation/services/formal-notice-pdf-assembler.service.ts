import { Injectable } from '@nestjs/common';
import type { FormalNoticePdfData } from '@infrastructure/document/formal-notice-pdf-data.interface';
import { formatMonthLabel } from '@infrastructure/document/format-euro.util';
import { formatTenantDisplayName } from '@infrastructure/shared/format-tenant-name.util';

interface AssembleInput {
  rentCall: {
    month: string;
    totalAmountCents: number;
    remainingBalanceCents: number | null;
  };
  tenant: {
    type: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
    addressStreet: string | null;
    addressPostalCode: string | null;
    addressCity: string | null;
    addressComplement: string | null;
  };
  unit: { identifier: string };
  lease: { startDate: Date | string };
  entity: {
    name: string;
    siret: string | null;
    addressStreet: string | null;
    addressPostalCode: string | null;
    addressCity: string | null;
    addressComplement: string | null;
  };
  escalation: {
    tier1SentAt: Date | null;
  } | null;
}

@Injectable()
export class FormalNoticePdfAssembler {
  assemble(input: AssembleInput): FormalNoticePdfData {
    const { rentCall, tenant, unit, lease, entity, escalation } = input;

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

    const startDate = new Date(lease.startDate);
    const leaseReference = `${String(startDate.getDate()).padStart(2, '0')}/${String(startDate.getMonth() + 1).padStart(2, '0')}/${startDate.getFullYear()}`;

    const debtCents = rentCall.remainingBalanceCents ?? rentCall.totalAmountCents;

    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const tier1SentAt = escalation?.tier1SentAt
      ? this.formatDate(escalation.tier1SentAt)
      : null;

    return {
      entityName: entity.name,
      entityAddress,
      entitySiret: entity.siret ?? null,
      tenantName,
      tenantAddress,
      leaseReference,
      unitIdentifier: unit.identifier,
      unpaidPeriods: [
        { period: formatMonthLabel(rentCall.month), amountCents: debtCents },
      ],
      totalDebtCents: debtCents,
      tier1SentAt,
      date,
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

  private formatDate(date: Date): string {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }
}
