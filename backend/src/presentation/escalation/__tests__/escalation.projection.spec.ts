import { EscalationProjection } from '../projections/escalation.projection';

describe('EscalationProjection', () => {
  let projection: EscalationProjection;
  let mockPrisma: {
    escalation: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    rentCall: {
      findUnique: jest.Mock;
    };
  };
  let mockKurrentDb: {
    client: {
      subscribeToAll: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      escalation: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      rentCall: {
        findUnique: jest.fn(),
      },
    };
    mockKurrentDb = {
      client: {
        subscribeToAll: jest.fn().mockReturnValue({
          on: jest.fn(),
        }),
      },
    };
    projection = new EscalationProjection(
      mockKurrentDb as never,
      mockPrisma as never,
    );
  });

  describe('onEscalationInitiated', () => {
    it('should create escalation record with userId from rent call', async () => {
      mockPrisma.escalation.findUnique.mockResolvedValue(null);
      mockPrisma.rentCall.findUnique.mockResolvedValue({ userId: 'user-123' });
      mockPrisma.escalation.create.mockResolvedValue({});

      await (projection as any).onEscalationInitiated({
        rentCallId: 'rc-1',
        entityId: 'entity-1',
        tenantId: 'tenant-1',
      });

      expect(mockPrisma.escalation.create).toHaveBeenCalledWith({
        data: {
          rentCallId: 'rc-1',
          entityId: 'entity-1',
          userId: 'user-123',
          tenantId: 'tenant-1',
        },
      });
    });

    it('should skip if escalation already exists (idempotent)', async () => {
      mockPrisma.escalation.findUnique.mockResolvedValue({ rentCallId: 'rc-1' });

      await (projection as any).onEscalationInitiated({
        rentCallId: 'rc-1',
        entityId: 'entity-1',
        tenantId: 'tenant-1',
      });

      expect(mockPrisma.escalation.create).not.toHaveBeenCalled();
    });

    it('should skip if rent call not found', async () => {
      mockPrisma.escalation.findUnique.mockResolvedValue(null);
      mockPrisma.rentCall.findUnique.mockResolvedValue(null);

      await (projection as any).onEscalationInitiated({
        rentCallId: 'rc-1',
        entityId: 'entity-1',
        tenantId: 'tenant-1',
      });

      expect(mockPrisma.escalation.create).not.toHaveBeenCalled();
    });
  });

  describe('onReminderEmailSent', () => {
    it('should update tier1 fields', async () => {
      mockPrisma.escalation.findUnique.mockResolvedValue({ rentCallId: 'rc-1' });
      mockPrisma.escalation.update.mockResolvedValue({});

      await (projection as any).onReminderEmailSent({
        rentCallId: 'rc-1',
        tier1SentAt: '2026-02-10T10:00:00.000Z',
        recipientEmail: 'tenant@test.com',
      });

      expect(mockPrisma.escalation.update).toHaveBeenCalledWith({
        where: { rentCallId: 'rc-1' },
        data: {
          tier1SentAt: new Date('2026-02-10T10:00:00.000Z'),
          tier1RecipientEmail: 'tenant@test.com',
        },
      });
    });

    it('should skip if escalation not found', async () => {
      mockPrisma.escalation.findUnique.mockResolvedValue(null);

      await (projection as any).onReminderEmailSent({
        rentCallId: 'rc-1',
        tier1SentAt: '2026-02-10T10:00:00.000Z',
        recipientEmail: 'tenant@test.com',
      });

      expect(mockPrisma.escalation.update).not.toHaveBeenCalled();
    });
  });

  describe('onFormalNoticeGenerated', () => {
    it('should update tier2SentAt', async () => {
      mockPrisma.escalation.findUnique.mockResolvedValue({ rentCallId: 'rc-1' });
      mockPrisma.escalation.update.mockResolvedValue({});

      await (projection as any).onFormalNoticeGenerated({
        rentCallId: 'rc-1',
        tier2SentAt: '2026-02-15T10:00:00.000Z',
      });

      expect(mockPrisma.escalation.update).toHaveBeenCalledWith({
        where: { rentCallId: 'rc-1' },
        data: {
          tier2SentAt: new Date('2026-02-15T10:00:00.000Z'),
        },
      });
    });

    it('should skip if escalation not found', async () => {
      mockPrisma.escalation.findUnique.mockResolvedValue(null);

      await (projection as any).onFormalNoticeGenerated({
        rentCallId: 'rc-1',
        tier2SentAt: '2026-02-15T10:00:00.000Z',
      });

      expect(mockPrisma.escalation.update).not.toHaveBeenCalled();
    });
  });

  describe('onStakeholderNotificationGenerated', () => {
    it('should update tier3SentAt', async () => {
      mockPrisma.escalation.findUnique.mockResolvedValue({ rentCallId: 'rc-1' });
      mockPrisma.escalation.update.mockResolvedValue({});

      await (projection as any).onStakeholderNotificationGenerated({
        rentCallId: 'rc-1',
        tier3SentAt: '2026-02-20T10:00:00.000Z',
      });

      expect(mockPrisma.escalation.update).toHaveBeenCalledWith({
        where: { rentCallId: 'rc-1' },
        data: {
          tier3SentAt: new Date('2026-02-20T10:00:00.000Z'),
        },
      });
    });

    it('should skip if escalation not found', async () => {
      mockPrisma.escalation.findUnique.mockResolvedValue(null);

      await (projection as any).onStakeholderNotificationGenerated({
        rentCallId: 'rc-1',
        tier3SentAt: '2026-02-20T10:00:00.000Z',
      });

      expect(mockPrisma.escalation.update).not.toHaveBeenCalled();
    });
  });
});
