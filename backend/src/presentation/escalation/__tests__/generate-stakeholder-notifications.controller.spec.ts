import { GenerateStakeholderNotificationsController } from '../controllers/generate-stakeholder-notifications.controller';

describe('GenerateStakeholderNotificationsController', () => {
  let controller: GenerateStakeholderNotificationsController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockRentCallFinder: { findByIdAndEntity: jest.Mock };
  let mockEscalationFinder: { findByRentCallId: jest.Mock };
  let mockPdfGenerator: { generateStakeholderLetterPdf: jest.Mock };
  let mockAssembler: { assemble: jest.Mock };
  let mockRes: { set: jest.Mock; end: jest.Mock };

  const baseRentCall = {
    id: 'rc-1',
    tenantId: 'tenant-1',
    month: '2026-01',
    totalAmountCents: 85000,
    remainingBalanceCents: 85000,
    tenant: {
      type: 'individual',
      firstName: 'Jean',
      lastName: 'Dupont',
      companyName: null,
    },
    unit: { identifier: 'Apt 3B' },
    lease: { startDate: new Date('2025-01-01') },
    entity: {
      name: 'SCI Les Oliviers',
      siret: '123',
      addressStreet: '10 Rue',
      addressPostalCode: '75001',
      addressCity: 'Paris',
      addressComplement: null,
    },
  };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockRentCallFinder = { findByIdAndEntity: jest.fn() };
    mockEscalationFinder = { findByRentCallId: jest.fn() };
    mockPdfGenerator = {
      generateStakeholderLetterPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    };
    mockAssembler = { assemble: jest.fn().mockReturnValue({ tenantName: 'Jean Dupont' }) };
    mockRes = { set: jest.fn(), end: jest.fn() };
    controller = new GenerateStakeholderNotificationsController(
      mockCommandBus as never,
      mockEntityFinder as never,
      mockRentCallFinder as never,
      mockEscalationFinder as never,
      mockPdfGenerator as never,
      mockAssembler as never,
    );
  });

  it('should dispatch command and return PDF for insurance', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(baseRentCall);
    mockEscalationFinder.findByRentCallId.mockResolvedValue({
      tier1SentAt: new Date(),
      tier2SentAt: new Date(),
    });

    await controller.handle(
      'entity-1',
      'rc-1',
      { recipientType: 'insurance' } as never,
      'user-1',
      mockRes as never,
    );

    expect(mockCommandBus.execute).toHaveBeenCalled();
    expect(mockAssembler.assemble).toHaveBeenCalledWith(
      expect.objectContaining({ recipientType: 'insurance' }),
    );
    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringContaining('assureur'),
      }),
    );
    expect(mockRes.end).toHaveBeenCalled();
  });

  it('should generate PDF for lawyer', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(baseRentCall);
    mockEscalationFinder.findByRentCallId.mockResolvedValue(null);

    await controller.handle(
      'entity-1',
      'rc-1',
      { recipientType: 'lawyer' } as never,
      'user-1',
      mockRes as never,
    );

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Disposition': expect.stringContaining('avocat'),
      }),
    );
  });

  it('should generate PDF for guarantor', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(baseRentCall);
    mockEscalationFinder.findByRentCallId.mockResolvedValue(null);

    await controller.handle(
      'entity-1',
      'rc-1',
      { recipientType: 'guarantor' } as never,
      'user-1',
      mockRes as never,
    );

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Disposition': expect.stringContaining('garant'),
      }),
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle(
        'entity-1',
        'rc-1',
        { recipientType: 'insurance' } as never,
        'user-1',
        mockRes as never,
      ),
    ).rejects.toThrow();
  });
});
