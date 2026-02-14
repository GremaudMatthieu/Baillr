export interface RevisionLetterPdfData {
  // Entity (sender)
  entityName: string;
  entityAddress: string;
  entitySiret: string | null;

  // Tenant (recipient)
  tenantFirstName: string;
  tenantLastName: string;
  tenantCompanyName: string | null;
  tenantAddress: string;

  // Lease reference
  leaseStartDate: string; // DD/MM/YYYY format

  // Revision details
  revisionDate: string; // DD/MM/YYYY — approvedAt date
  currentRentCents: number;
  newRentCents: number;
  differenceCents: number;
  effectiveDate: string; // DD/MM/YYYY — revision effective date

  // Formula components
  revisionIndexType: string; // IRL | ILC | ICC
  baseIndexQuarter: string; // e.g. "T1 2025"
  baseIndexValue: number;
  newIndexQuarter: string; // e.g. "T3 2025"
  newIndexValue: number;

  // Document metadata
  documentDate: string; // DD/MM/YYYY — generation date (today)
  city: string; // Entity city for "Fait à {city}"
}
