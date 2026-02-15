import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GetChargeRegularizationPdfController } from '../controllers/get-charge-regularization-pdf.controller';
import type { ChargeRegularizationPdfData } from '@infrastructure/document/charge-regularization-pdf-data.interface';

describe('GetChargeRegularizationPdfController', () => {
  let controller: GetChargeRegularizationPdfController;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockTenantFinder: { findByIdAndUser: jest.Mock };
  let mockUnitFinder: { findByIdWithProperty: jest.Mock };
  let mockChargeRegularizationFinder: { findByEntityAndYear: jest.Mock };
  let mockPdfGenerator: { generateChargeRegularizationPdf: jest.Mock };
  let mockAssembler: { assembleFromStatement: jest.Mock };
  let mockRes: { set: jest.Mock; end: jest.Mock };

  const pdfBuffer = Buffer.from('%PDF-1.3 test content');

  const mockStatement = {
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    tenantName: 'Dupont',
    unitId: 'unit-1',
    unitIdentifier: 'Apt A',
    occupancyStart: '2025-01-01',
    occupancyEnd: '2025-12-31',
    occupiedDays: 365,
    daysInYear: 365,
    charges: [],
    totalShareCents: 80000,
    totalProvisionsPaidCents: 75000,
    balanceCents: 5000,
  };

  const mockRegularization = {
    id: 'entity1-2025',
    entityId: 'entity-1',
    userId: 'user-1',
    fiscalYear: 2025,
    statements: [mockStatement],
    totalBalanceCents: 5000,
  };

  const mockTenant = {
    id: 'tenant-1',
    firstName: 'Jean',
    lastName: 'DUPONT',
    companyName: null as string | null,
  };

  const mockProperty = {
    id: 'property-1',
    addressStreet: '12 rue de la Paix',
    addressPostalCode: '75002',
    addressCity: 'PARIS',
    addressComplement: null,
  };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockTenantFinder = { findByIdAndUser: jest.fn() };
    mockUnitFinder = { findByIdWithProperty: jest.fn() };
    mockChargeRegularizationFinder = { findByEntityAndYear: jest.fn() };
    mockPdfGenerator = {
      generateChargeRegularizationPdf: jest
        .fn()
        .mockResolvedValue(pdfBuffer),
    };
    mockAssembler = {
      assembleFromStatement: jest.fn().mockReturnValue({
        entityName: 'SCI EXAMPLE',
        tenantName: 'Jean DUPONT',
      } as Partial<ChargeRegularizationPdfData>),
    };
    mockRes = { set: jest.fn(), end: jest.fn() };

    controller = new GetChargeRegularizationPdfController(
      mockEntityFinder as never,
      mockTenantFinder as never,
      mockUnitFinder as never,
      mockChargeRegularizationFinder as never,
      mockPdfGenerator as never,
      mockAssembler as never,
    );
  });

  const entityId = 'entity-1';
  const fiscalYear = 2025;
  const leaseId = 'lease-1';
  const userId = 'user-1';

  it('should return PDF buffer with correct headers including CORS', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockChargeRegularizationFinder.findByEntityAndYear.mockResolvedValue(
      mockRegularization,
    );
    mockTenantFinder.findByIdAndUser.mockResolvedValue(mockTenant);
    mockUnitFinder.findByIdWithProperty.mockResolvedValue({
      id: 'unit-1',
      property: mockProperty,
    });

    await controller.handle(
      entityId,
      fiscalYear,
      leaseId,
      userId,
      mockRes as never,
    );

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="regularisation-charges-DUPONT-2025.pdf"',
        'Access-Control-Expose-Headers': 'Content-Disposition',
      }),
    );
    expect(mockRes.end).toHaveBeenCalledWith(pdfBuffer);
  });

  it('should use TenantFinder to fetch tenant', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockChargeRegularizationFinder.findByEntityAndYear.mockResolvedValue(
      mockRegularization,
    );
    mockTenantFinder.findByIdAndUser.mockResolvedValue(mockTenant);
    mockUnitFinder.findByIdWithProperty.mockResolvedValue({
      id: 'unit-1',
      property: mockProperty,
    });

    await controller.handle(
      entityId,
      fiscalYear,
      leaseId,
      userId,
      mockRes as never,
    );

    expect(mockTenantFinder.findByIdAndUser).toHaveBeenCalledWith(
      'tenant-1',
      userId,
    );
  });

  it('should pass property to assembler for unit address', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockChargeRegularizationFinder.findByEntityAndYear.mockResolvedValue(
      mockRegularization,
    );
    mockTenantFinder.findByIdAndUser.mockResolvedValue(mockTenant);
    mockUnitFinder.findByIdWithProperty.mockResolvedValue({
      id: 'unit-1',
      property: mockProperty,
    });

    await controller.handle(
      entityId,
      fiscalYear,
      leaseId,
      userId,
      mockRes as never,
    );

    expect(mockAssembler.assembleFromStatement).toHaveBeenCalledWith(
      mockRegularization,
      mockStatement,
      expect.anything(),
      mockTenant,
      mockProperty,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle(
        entityId,
        fiscalYear,
        leaseId,
        userId,
        mockRes as never,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw NotFoundException when regularization not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockChargeRegularizationFinder.findByEntityAndYear.mockResolvedValue(null);

    await expect(
      controller.handle(
        entityId,
        fiscalYear,
        leaseId,
        userId,
        mockRes as never,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when statement for lease not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockChargeRegularizationFinder.findByEntityAndYear.mockResolvedValue(
      mockRegularization,
    );

    await expect(
      controller.handle(
        entityId,
        fiscalYear,
        'non-existent-lease',
        userId,
        mockRes as never,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should use companyName for filename when tenant is company', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockChargeRegularizationFinder.findByEntityAndYear.mockResolvedValue(
      mockRegularization,
    );
    mockTenantFinder.findByIdAndUser.mockResolvedValue({
      ...mockTenant,
      companyName: 'ACME Corp',
    });
    mockUnitFinder.findByIdWithProperty.mockResolvedValue({
      id: 'unit-1',
      property: mockProperty,
    });

    await controller.handle(
      entityId,
      fiscalYear,
      leaseId,
      userId,
      mockRes as never,
    );

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Disposition':
          'attachment; filename="regularisation-charges-ACME_Corp-2025.pdf"',
      }),
    );
  });
});
