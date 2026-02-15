import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { GetReceiptPdfController } from '../controllers/get-receipt-pdf.controller';
import type { ReceiptPdfData } from '@infrastructure/document/receipt-pdf-data.interface';

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
    paymentStatus: 'paid' as string | null,
    remainingBalanceCents: 0 as number | null,
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
      email: 'contact@sci-example.com',
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

describe('GetReceiptPdfController', () => {
  let controller: GetReceiptPdfController;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockRentCallFinder: { findByIdAndEntity: jest.Mock };
  let mockPaymentFinder: { findByRentCallId: jest.Mock };
  let mockPdfGenerator: { generateReceiptPdf: jest.Mock };
  let mockAssembler: { assembleFromRentCall: jest.Mock };
  let mockRes: { set: jest.Mock; end: jest.Mock };

  const pdfBuffer = Buffer.from('%PDF-1.3 test content');

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockRentCallFinder = { findByIdAndEntity: jest.fn() };
    mockPaymentFinder = { findByRentCallId: jest.fn().mockResolvedValue([]) };
    mockPdfGenerator = { generateReceiptPdf: jest.fn().mockResolvedValue(pdfBuffer) };
    mockAssembler = {
      assembleFromRentCall: jest.fn().mockReturnValue({
        receiptType: 'quittance',
        entityName: 'SCI EXAMPLE',
        tenantName: 'Jean DUPONT',
      } as Partial<ReceiptPdfData>),
    };
    mockRes = { set: jest.fn(), end: jest.fn() };

    controller = new GetReceiptPdfController(
      mockEntityFinder as any,
      mockRentCallFinder as any,
      mockPaymentFinder as any,
      mockPdfGenerator as any,
      mockAssembler as any,
    );
  });

  const entityId = 'entity-1';
  const rentCallId = 'rc-1';
  const userId = 'user_123';

  it('should return quittance PDF with correct filename for paid rent call', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(
      makeRentCallWithRelations({ paymentStatus: 'paid' }),
    );

    await controller.handle(entityId, rentCallId, userId, mockRes as any);

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="quittance-DUPONT-2026-02.pdf"',
      }),
    );
    expect(mockRes.end).toHaveBeenCalledWith(pdfBuffer);
  });

  it('should return quittance PDF for overpaid rent call', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(
      makeRentCallWithRelations({ paymentStatus: 'overpaid' }),
    );

    await controller.handle(entityId, rentCallId, userId, mockRes as any);

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Disposition': 'attachment; filename="quittance-DUPONT-2026-02.pdf"',
      }),
    );
  });

  it('should return reçu PDF with correct filename for partial rent call', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(
      makeRentCallWithRelations({ paymentStatus: 'partial' }),
    );

    await controller.handle(entityId, rentCallId, userId, mockRes as any);

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Disposition': 'attachment; filename="recu-paiement-DUPONT-2026-02.pdf"',
      }),
    );
  });

  it('should throw BadRequestException for unpaid rent call', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(
      makeRentCallWithRelations({ paymentStatus: null }),
    );

    await expect(controller.handle(entityId, rentCallId, userId, mockRes as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle(entityId, rentCallId, userId, mockRes as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw NotFoundException when rent call not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(null);

    await expect(controller.handle(entityId, rentCallId, userId, mockRes as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should pass payments to assembler', async () => {
    const payments = [
      { id: 'p-1', amountCents: 85000, paymentDate: new Date(), paymentMethod: 'bank_transfer' },
    ];
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(
      makeRentCallWithRelations({ paymentStatus: 'paid' }),
    );
    mockPaymentFinder.findByRentCallId.mockResolvedValue(payments);

    await controller.handle(entityId, rentCallId, userId, mockRes as any);

    expect(mockAssembler.assembleFromRentCall).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      payments,
    );
  });

  it('should use companyName for filename when tenant is company', async () => {
    const rcData = makeRentCallWithRelations({ paymentStatus: 'paid' });
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
        'Content-Disposition': 'attachment; filename="quittance-ACME_Corp-2026-02.pdf"',
      }),
    );
  });
});
