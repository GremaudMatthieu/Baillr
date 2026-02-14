import { SendAReminderEmailController } from '../controllers/send-a-reminder-email.controller';

describe('SendAReminderEmailController', () => {
  let controller: SendAReminderEmailController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockRentCallFinder: { findByIdAndEntity: jest.Mock };
  let mockEmailService: { sendWithAttachment: jest.Mock; from: string };

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
      email: 'jean@test.com',
    },
    unit: { identifier: 'Apt 3B' },
    lease: { monthlyDueDate: 5 },
    entity: {
      name: 'SCI Les Oliviers',
      email: 'sci@test.com',
      bankAccounts: [
        { isDefault: true, iban: 'FR76123', bic: 'ABCDEFGH' },
      ],
    },
  };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockRentCallFinder = { findByIdAndEntity: jest.fn() };
    mockEmailService = { sendWithAttachment: jest.fn().mockResolvedValue(undefined), from: 'noreply@baillr.fr' };
    controller = new SendAReminderEmailController(
      mockCommandBus as never,
      mockEntityFinder as never,
      mockRentCallFinder as never,
      mockEmailService as never,
    );
  });

  it('should dispatch command and send email', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1', name: 'SCI Les Oliviers', email: 'sci@test.com' });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(baseRentCall);

    const result = await controller.handle('entity-1', 'rc-1', 'user-1');

    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        rentCallId: 'rc-1',
        entityId: 'entity-1',
        tenantId: 'tenant-1',
        tenantEmail: 'jean@test.com',
      }),
    );
    expect(mockEmailService.sendWithAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jean@test.com',
        bcc: 'sci@test.com',
      }),
    );
    expect(result).toEqual({ sent: true });
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('entity-1', 'rc-1', 'user-1')).rejects.toThrow();
  });

  it('should throw NotFoundException when rent call not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1', name: 'Test' });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(null);

    await expect(controller.handle('entity-1', 'rc-1', 'user-1')).rejects.toThrow();
  });

  it('should throw NotFoundException when tenant has no email', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1', name: 'Test' });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue({
      ...baseRentCall,
      tenant: { ...baseRentCall.tenant, email: '' },
    });

    await expect(controller.handle('entity-1', 'rc-1', 'user-1')).rejects.toThrow();
  });
});
