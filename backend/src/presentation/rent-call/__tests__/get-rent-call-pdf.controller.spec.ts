import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GetRentCallPdfController } from '../controllers/get-rent-call-pdf.controller';
import type { RentCallPdfData } from '@infrastructure/document/rent-call-pdf-data.interface';

function makeRentCallWithRelations(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rc-1',
    entityId: 'entity-1',
    userId: 'user_123',
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    month: '2026-02',
    rentAmountCents: 75000,
    billingLines: [
      { chargeCategoryId: 'cat-1', categoryLabel: 'Provisions sur charges', amountCents: 10000 },
    ],
    totalAmountCents: 85000,
    isProRata: false,
    occupiedDays: null,
    totalDaysInMonth: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: {
      id: 'tenant-1',
      type: 'individual' as string,
      firstName: 'Jean',
      lastName: 'DUPONT',
      companyName: null as string | null,
      addressStreet: '5 avenue Victor Hugo',
      addressPostalCode: '69003',
      addressCity: 'LYON',
      addressComplement: null,
    },
    unit: { id: 'unit-1', identifier: 'Apt 101' },
    lease: {
      id: 'lease-1',
      startDate: new Date('2025-01-01'),
      monthlyDueDate: 5,
    },
    entity: {
      id: 'entity-1',
      name: 'SCI EXAMPLE',
      siret: '12345678901234',
      addressStreet: '12 rue de la Paix',
      addressPostalCode: '75002',
      addressCity: 'PARIS',
      addressComplement: null,
      bankAccounts: [
        {
          id: 'ba-1',
          type: 'bank_account',
          iban: 'FR76 1234 5678',
          bic: 'BNPAFRPP',
          isDefault: true,
        },
      ],
    },
    ...overrides,
  };
}

describe('GetRentCallPdfController', () => {
  let controller: GetRentCallPdfController;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockRentCallFinder: { findByIdAndEntity: jest.Mock };
  let mockPdfGenerator: { generateRentCallPdf: jest.Mock };
  let mockAssembler: { assembleFromRentCall: jest.Mock };
  let mockRes: { set: jest.Mock; end: jest.Mock };

  const pdfBuffer = Buffer.from('%PDF-1.3 test content');

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockRentCallFinder = { findByIdAndEntity: jest.fn() };
    mockPdfGenerator = { generateRentCallPdf: jest.fn().mockResolvedValue(pdfBuffer) };
    mockAssembler = {
      assembleFromRentCall: jest.fn().mockReturnValue({
        entityName: 'SCI EXAMPLE',
        tenantName: 'Jean DUPONT',
      } as Partial<RentCallPdfData>),
    };
    mockRes = { set: jest.fn(), end: jest.fn() };

    controller = new GetRentCallPdfController(
      mockEntityFinder as any,
      mockRentCallFinder as any,
      mockPdfGenerator as any,
      mockAssembler as any,
    );
  });

  const entityId = 'entity-1';
  const rentCallId = 'rc-1';
  const userId = 'user_123';

  it('should return PDF buffer with correct headers', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(makeRentCallWithRelations());

    await controller.handle(entityId, rentCallId, userId, mockRes as any);

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="appel-loyer-DUPONT-2026-02.pdf"',
      }),
    );
    expect(mockRes.end).toHaveBeenCalledWith(pdfBuffer);
  });

  it('should throw NotFoundException when rent call not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(null);

    await expect(controller.handle(entityId, rentCallId, userId, mockRes as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle(entityId, rentCallId, userId, mockRes as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should handle pro-rata rent call', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(
      makeRentCallWithRelations({
        isProRata: true,
        occupiedDays: 15,
        totalDaysInMonth: 28,
      }),
    );

    await controller.handle(entityId, rentCallId, userId, mockRes as any);

    expect(mockAssembler.assembleFromRentCall).toHaveBeenCalled();
    expect(mockPdfGenerator.generateRentCallPdf).toHaveBeenCalled();
    expect(mockRes.end).toHaveBeenCalledWith(pdfBuffer);
  });

  it('should handle rent call without IBAN', async () => {
    const rcData = makeRentCallWithRelations();
    rcData.entity.bankAccounts = [];
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(rcData);

    await controller.handle(entityId, rentCallId, userId, mockRes as any);

    expect(mockRes.end).toHaveBeenCalledWith(pdfBuffer);
  });

  it('should use companyName for filename when tenant is company', async () => {
    const rcData = makeRentCallWithRelations();
    rcData.tenant = {
      ...rcData.tenant,
      type: 'company',
      companyName: 'ACME Corp',
    };
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(rcData);

    await controller.handle(entityId, rentCallId, userId, mockRes as any);

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Disposition': 'attachment; filename="appel-loyer-ACME_Corp-2026-02.pdf"',
      }),
    );
  });

  it('should sanitize special characters in filename', async () => {
    const rcData = makeRentCallWithRelations();
    rcData.tenant = {
      ...rcData.tenant,
      type: 'company',
      companyName: 'SCI "La Maison\\Bleue"',
    };
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(rcData);

    await controller.handle(entityId, rentCallId, userId, mockRes as any);

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Disposition':
          'attachment; filename="appel-loyer-SCI__La_Maison_Bleue_-2026-02.pdf"',
      }),
    );
  });
});
