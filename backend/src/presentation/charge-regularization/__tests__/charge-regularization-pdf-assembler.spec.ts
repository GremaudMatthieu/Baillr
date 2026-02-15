import { ChargeRegularizationPdfAssembler } from '../services/charge-regularization-pdf-assembler.service';

describe('ChargeRegularizationPdfAssembler', () => {
  let assembler: ChargeRegularizationPdfAssembler;

  beforeEach(() => {
    assembler = new ChargeRegularizationPdfAssembler();
  });

  const regularization = {
    id: 'entity1-2025',
    entityId: 'entity-1',
    userId: 'user-1',
    fiscalYear: 2025,
    statements: [],
    totalBalanceCents: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const statement = {
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    tenantName: 'Dupont',
    unitId: 'unit-1',
    unitIdentifier: 'Apt A',
    occupancyStart: '2025-01-01',
    occupancyEnd: '2025-12-31',
    occupiedDays: 365,
    daysInYear: 365,
    charges: [
      {
        chargeCategoryId: 'cat-teom',
        label: 'TEOM',
        totalChargeCents: 80000,
        tenantShareCents: 80000,
        isWaterByConsumption: false,
      },
    ],
    totalShareCents: 80000,
    totalProvisionsPaidCents: 75000,
    balanceCents: 5000,
  };

  const entity = {
    name: 'SCI EXAMPLE',
    siret: '12345678901234',
    addressStreet: '12 rue de la Paix',
    addressPostalCode: '75002',
    addressCity: 'PARIS',
    addressComplement: null,
  };

  const tenant = {
    firstName: 'Jean',
    lastName: 'DUPONT',
    companyName: null as string | null,
    addressStreet: '5 avenue Victor Hugo',
    addressPostalCode: '69003',
    addressCity: 'LYON',
    addressComplement: null,
  };

  const property = {
    addressStreet: '10 boulevard Haussmann',
    addressPostalCode: '75009',
    addressCity: 'PARIS',
    addressComplement: null,
  };

  it('should assemble PDF data from statement', () => {
    const result = assembler.assembleFromStatement(
      regularization as never,
      statement,
      entity,
      tenant,
      property,
    );

    expect(result.entityName).toBe('SCI EXAMPLE');
    expect(result.entityAddress).toBe('12 rue de la Paix, 75002 PARIS');
    expect(result.entitySiret).toBe('12345678901234');
    expect(result.tenantName).toBe('Jean DUPONT');
    expect(result.tenantAddress).toBe('5 avenue Victor Hugo, 69003 LYON');
    expect(result.unitIdentifier).toBe('Apt A');
    expect(result.unitAddress).toBe('10 boulevard Haussmann, 75009 PARIS');
    expect(result.occupancyStart).toBe('01/01/2025');
    expect(result.occupancyEnd).toBe('31/12/2025');
    expect(result.occupiedDays).toBe(365);
    expect(result.daysInYear).toBe(365);
    expect(result.charges).toHaveLength(1);
    expect(result.charges[0].label).toBe('TEOM');
    expect(result.totalShareCents).toBe(80000);
    expect(result.totalProvisionsPaidCents).toBe(75000);
    expect(result.balanceCents).toBe(5000);
    expect(result.fiscalYear).toBe(2025);
    expect(result.documentDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('should use companyName for tenant name when present', () => {
    const companyTenant = { ...tenant, companyName: 'ACME Corp' };
    const result = assembler.assembleFromStatement(
      regularization as never,
      statement,
      entity,
      companyTenant,
      property,
    );

    expect(result.tenantName).toBe('ACME Corp');
  });

  it('should format dates from ISO to FR format', () => {
    const result = assembler.assembleFromStatement(
      regularization as never,
      statement,
      entity,
      tenant,
      property,
    );

    expect(result.occupancyStart).toBe('01/01/2025');
    expect(result.occupancyEnd).toBe('31/12/2025');
  });

  it('should handle address with complement', () => {
    const entityWithComplement = {
      ...entity,
      addressComplement: 'Bât. B',
    };
    const result = assembler.assembleFromStatement(
      regularization as never,
      statement,
      entityWithComplement,
      tenant,
      property,
    );

    expect(result.entityAddress).toBe(
      '12 rue de la Paix, Bât. B, 75002 PARIS',
    );
  });

  it('should handle null siret', () => {
    const entityNoSiret = { ...entity, siret: null };
    const result = assembler.assembleFromStatement(
      regularization as never,
      statement,
      entityNoSiret,
      tenant,
      property,
    );

    expect(result.entitySiret).toBeNull();
  });

  it('should handle null property with empty unitAddress', () => {
    const result = assembler.assembleFromStatement(
      regularization as never,
      statement,
      entity,
      tenant,
      null,
    );

    expect(result.unitAddress).toBe('');
  });
});
