/**
 * Domain interfaces for rent call data — no Prisma dependency.
 * Used by commands/handlers (billing domain) and the PDF assembler (presentation).
 * Prisma types returned by finders satisfy these interfaces via structural typing.
 */

export interface RentCallTenantData {
  type: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string;
  addressStreet: string | null;
  addressPostalCode: string | null;
  addressCity: string | null;
  addressComplement: string | null;
}

export interface RentCallUnitData {
  identifier: string;
}

export interface RentCallLeaseData {
  monthlyDueDate: number;
  startDate: Date;
}

export interface RentCallBankAccountData {
  type: string;
  isDefault: boolean;
  iban: string | null;
  bic: string | null;
}

export interface RentCallEntityData {
  name: string;
  email: string;
  siret: string | null;
  addressStreet: string;
  addressPostalCode: string;
  addressCity: string;
  addressComplement: string | null;
}

export interface RentCallCoreData {
  month: string;
  rentAmountCents: number;
  billingLines: unknown;
  totalAmountCents: number;
  isProRata: boolean;
  occupiedDays: number | null;
  totalDaysInMonth: number | null;
}

export interface UnsentRentCallData extends RentCallCoreData {
  id: string;
  entityId: string;
  tenant: RentCallTenantData;
  unit: RentCallUnitData;
  lease: RentCallLeaseData;
  entity: RentCallEntityData & { bankAccounts: RentCallBankAccountData[] };
}
