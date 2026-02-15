import { Injectable } from '@nestjs/common';
import type { RevisionLetterPdfData } from '@infrastructure/document/revision-letter-pdf-data.interface';

interface RevisionInput {
  currentRentCents: number;
  newRentCents: number;
  differenceCents: number;
  baseIndexValue: number;
  baseIndexQuarter: string;
  baseIndexYear: number | null;
  newIndexValue: number;
  newIndexQuarter: string;
  newIndexYear: number;
  revisionIndexType: string;
  approvedAt: Date | null;
}

interface EntityInput {
  name: string;
  siret: string | null;
  addressStreet: string;
  addressPostalCode: string;
  addressCity: string;
  addressComplement: string | null;
}

interface TenantInput {
  type: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  addressStreet: string | null;
  addressPostalCode: string | null;
  addressCity: string | null;
  addressComplement: string | null;
}

interface LeaseInput {
  startDate: Date | string;
}

@Injectable()
export class RevisionLetterPdfAssembler {
  assemble(
    revision: RevisionInput,
    entity: EntityInput,
    tenant: TenantInput,
    lease: LeaseInput,
  ): RevisionLetterPdfData {
    const entityAddress = this.formatAddress(
      entity.addressStreet,
      entity.addressPostalCode,
      entity.addressCity,
      entity.addressComplement,
    );

    const tenantAddress = this.formatAddress(
      tenant.addressStreet,
      tenant.addressPostalCode,
      tenant.addressCity,
      tenant.addressComplement,
    );

    const leaseStartDate = this.formatDate(new Date(lease.startDate));

    const approvedAt = revision.approvedAt ? new Date(revision.approvedAt) : new Date();
    const revisionDate = this.formatDate(approvedAt);
    const effectiveDate = revisionDate;

    const now = new Date();
    const documentDate = this.formatDate(now);

    const quarterLabel = this.formatQuarterLabel(revision.newIndexQuarter, revision.newIndexYear);
    const baseQuarterLabel = this.formatQuarterLabel(
      revision.baseIndexQuarter,
      revision.baseIndexYear ?? revision.newIndexYear,
    );

    return {
      entityName: entity.name,
      entityAddress,
      entitySiret: entity.siret,
      tenantFirstName: tenant.firstName,
      tenantLastName: tenant.lastName,
      tenantCompanyName: tenant.type === 'company' ? tenant.companyName : null,
      tenantAddress,
      leaseStartDate,
      revisionDate,
      currentRentCents: revision.currentRentCents,
      newRentCents: revision.newRentCents,
      differenceCents: revision.differenceCents,
      effectiveDate,
      revisionIndexType: revision.revisionIndexType,
      baseIndexQuarter: baseQuarterLabel,
      baseIndexValue: revision.baseIndexValue,
      newIndexQuarter: quarterLabel,
      newIndexValue: revision.newIndexValue,
      documentDate,
      city: entity.addressCity,
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
    return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
  }

  private formatQuarterLabel(quarter: string, year: number): string {
    return `${quarter} ${year}`;
  }
}
