import { Injectable } from '@nestjs/common';
import type { ChargeRegularization, OwnershipEntity, Tenant } from '@prisma/client';
import type {
  ChargeRegularizationPdfData,
  ChargeRegularizationPdfCharge,
} from '@infrastructure/document/charge-regularization-pdf-data.interface';
import type { StatementPrimitives } from '@indexation/charge-regularization/regularization-statement';

interface TenantInput {
  firstName: string;
  lastName: string;
  companyName: string | null;
  addressStreet: string | null;
  addressPostalCode: string | null;
  addressCity: string | null;
  addressComplement: string | null;
}

interface EntityInput {
  name: string;
  siret: string | null;
  addressStreet: string;
  addressPostalCode: string;
  addressCity: string;
  addressComplement: string | null;
}

interface PropertyInput {
  addressStreet: string;
  addressPostalCode: string;
  addressCity: string;
  addressComplement: string | null;
}

@Injectable()
export class ChargeRegularizationPdfAssembler {
  assembleFromStatement(
    regularization: ChargeRegularization,
    statement: StatementPrimitives,
    entity: EntityInput,
    tenant: TenantInput,
    property: PropertyInput | null,
  ): ChargeRegularizationPdfData {
    const tenantName = tenant.companyName ?? `${tenant.firstName} ${tenant.lastName}`.trim();
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

    const charges: ChargeRegularizationPdfCharge[] = statement.charges.map((c) => ({
      label: c.label,
      totalChargeCents: c.totalChargeCents,
      tenantShareCents: c.tenantShareCents,
      provisionsPaidCents: c.provisionsPaidCents,
      isWaterByConsumption: c.isWaterByConsumption,
    }));

    const now = new Date();
    const documentDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    return {
      entityName: entity.name,
      entityAddress,
      entitySiret: entity.siret,
      tenantName,
      tenantAddress,
      unitIdentifier: statement.unitIdentifier,
      unitAddress: property
        ? this.formatAddress(
            property.addressStreet,
            property.addressPostalCode,
            property.addressCity,
            property.addressComplement,
          )
        : '',
      occupancyStart: this.formatDateFR(statement.occupancyStart),
      occupancyEnd: this.formatDateFR(statement.occupancyEnd),
      occupiedDays: statement.occupiedDays,
      daysInYear: statement.daysInYear,
      charges,
      totalShareCents: statement.totalShareCents,
      totalProvisionsPaidCents: statement.totalProvisionsPaidCents,
      balanceCents: statement.balanceCents,
      fiscalYear: regularization.fiscalYear,
      documentDate,
    };
  }

  private formatDateFR(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
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
}
