import { Test, TestingModule } from '@nestjs/testing';
import { AlertDetectionService } from '../alert-detection.service';
import { RentCallFinder } from '../../../presentation/rent-call/finders/rent-call.finder';
import { TenantFinder } from '../../../presentation/tenant/finders/tenant.finder';
import { EscalationFinder } from '../../../presentation/escalation/finders/escalation.finder';

describe('AlertDetectionService', () => {
  let service: AlertDetectionService;
  let rentCallFinder: {
    findUnpaidBeforeMonth: jest.Mock;
    findUnpaidByIds: jest.Mock;
  };
  let tenantFinder: {
    findWithExpiringInsurance: jest.Mock;
  };
  let escalationFinder: {
    findAllByEntity: jest.Mock;
  };

  const entityId = '11111111-1111-1111-1111-111111111111';
  const userId = 'user_test123';
  const appUrl = 'https://app.baillr.fr';

  beforeEach(async () => {
    rentCallFinder = {
      findUnpaidBeforeMonth: jest.fn().mockResolvedValue([]),
      findUnpaidByIds: jest.fn().mockResolvedValue([]),
    };
    tenantFinder = {
      findWithExpiringInsurance: jest.fn().mockResolvedValue([]),
    };
    escalationFinder = {
      findAllByEntity: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertDetectionService,
        { provide: RentCallFinder, useValue: rentCallFinder },
        { provide: TenantFinder, useValue: tenantFinder },
        { provide: EscalationFinder, useValue: escalationFinder },
      ],
    }).compile();

    service = module.get(AlertDetectionService);
  });

  describe('detectUnpaidAlerts', () => {
    it('should return empty array when no unpaid rent calls', async () => {
      const result = await service.detectUnpaidAlerts(entityId, userId, appUrl);

      expect(result).toEqual([]);
    });

    it('should detect unpaid rent calls from past months', async () => {
      rentCallFinder.findUnpaidBeforeMonth.mockResolvedValue([
        {
          id: 'rc-1',
          totalAmountCents: 85000,
          month: '2026-01',
          tenant: {
            type: 'individual',
            firstName: 'Jean',
            lastName: 'Dupont',
            companyName: null,
          },
          unit: { identifier: 'Apt A1' },
        },
      ]);

      const result = await service.detectUnpaidAlerts(entityId, userId, appUrl);

      expect(result).toHaveLength(1);
      expect(result[0].referenceId).toBe('rc-1');
      expect(result[0].alertItem.description).toContain('Jean Dupont');
      expect(result[0].alertItem.description).toContain('Apt A1');
      expect(result[0].alertItem.description).toContain('2026-01');
      expect(result[0].alertItem.applicationLink).toBe(
        'https://app.baillr.fr/rent-calls',
      );
    });

    it('should use company name for company tenants', async () => {
      rentCallFinder.findUnpaidBeforeMonth.mockResolvedValue([
        {
          id: 'rc-2',
          totalAmountCents: 120000,
          month: '2026-01',
          tenant: {
            type: 'company',
            firstName: 'Jean',
            lastName: 'Dupont',
            companyName: 'SCI Martin',
          },
          unit: { identifier: 'Local B2' },
        },
      ]);

      const result = await service.detectUnpaidAlerts(entityId, userId, appUrl);

      expect(result[0].alertItem.description).toContain('SCI Martin');
      expect(result[0].alertItem.description).not.toContain('Jean Dupont');
    });

    it('should call finder with correct entityId and currentMonth', async () => {
      await service.detectUnpaidAlerts(entityId, userId, appUrl);

      expect(rentCallFinder.findUnpaidBeforeMonth).toHaveBeenCalledWith(
        entityId,
        expect.stringMatching(/^\d{4}-\d{2}$/),
      );
    });
  });

  describe('detectInsuranceAlerts', () => {
    it('should return empty array when no tenants with expiring insurance', async () => {
      const result = await service.detectInsuranceAlerts(entityId, userId, appUrl);

      expect(result).toEqual([]);
    });

    it('should detect expired insurance', async () => {
      const pastDate = new Date('2026-01-15');
      tenantFinder.findWithExpiringInsurance.mockResolvedValue([
        {
          id: 'tenant-1',
          type: 'individual',
          firstName: 'Marie',
          lastName: 'Martin',
          companyName: null,
          renewalDate: pastDate,
        },
      ]);

      const result = await service.detectInsuranceAlerts(entityId, userId, appUrl);

      expect(result).toHaveLength(1);
      expect(result[0].alertItem.description).toContain('Assurance expirée');
      expect(result[0].alertItem.description).toContain('Marie Martin');
      expect(result[0].alertItem.applicationLink).toContain('/tenants/tenant-1');
    });

    it('should detect expiring insurance within 15 days', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      tenantFinder.findWithExpiringInsurance.mockResolvedValue([
        {
          id: 'tenant-2',
          type: 'individual',
          firstName: 'Paul',
          lastName: 'Durand',
          companyName: null,
          renewalDate: futureDate,
        },
      ]);

      const result = await service.detectInsuranceAlerts(entityId, userId, appUrl);

      expect(result).toHaveLength(1);
      expect(result[0].alertItem.description).toContain('Assurance expirante');
      expect(result[0].alertItem.description).toContain('Paul Durand');
    });

    it('should include month key in referenceId for monthly idempotency', async () => {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      tenantFinder.findWithExpiringInsurance.mockResolvedValue([
        {
          id: 'tenant-3',
          type: 'individual',
          firstName: 'A',
          lastName: 'B',
          companyName: null,
          renewalDate: new Date('2026-01-01'),
        },
      ]);

      const result = await service.detectInsuranceAlerts(entityId, userId, appUrl);

      expect(result[0].referenceId).toBe(`tenant-3-${monthKey}`);
    });

    it('should use company name for company tenants', async () => {
      tenantFinder.findWithExpiringInsurance.mockResolvedValue([
        {
          id: 'tenant-4',
          type: 'company',
          firstName: 'Jean',
          lastName: 'Dupont',
          companyName: 'SARL Immo',
          renewalDate: new Date('2026-01-01'),
        },
      ]);

      const result = await service.detectInsuranceAlerts(entityId, userId, appUrl);

      expect(result[0].alertItem.description).toContain('SARL Immo');
    });
  });

  describe('detectEscalationAlerts', () => {
    it('should return empty array when no escalations', async () => {
      const result = await service.detectEscalationAlerts(entityId, userId, appUrl);

      expect(result).toEqual([]);
    });

    it('should detect tier 1 escalation with unpaid rent call and amount', async () => {
      escalationFinder.findAllByEntity.mockResolvedValue([
        {
          id: 'esc-1',
          rentCallId: 'rc-1',
          entityId,
          tier1SentAt: new Date(),
          tier2SentAt: null,
          tier3SentAt: null,
        },
      ]);
      rentCallFinder.findUnpaidByIds.mockResolvedValue([
        {
          id: 'rc-1',
          totalAmountCents: 85000,
          tenant: {
            type: 'individual',
            firstName: 'Jean',
            lastName: 'Dupont',
            companyName: null,
          },
        },
      ]);

      const result = await service.detectEscalationAlerts(entityId, userId, appUrl);

      expect(result).toHaveLength(1);
      expect(result[0].referenceId).toBe('rc-1-tier1');
      expect(result[0].alertItem.description).toContain('Niveau 1');
      expect(result[0].alertItem.description).toContain('Jean Dupont');
      expect(result[0].alertItem.description).toMatch(/850/);
    });

    it('should detect highest tier for escalation', async () => {
      escalationFinder.findAllByEntity.mockResolvedValue([
        {
          id: 'esc-1',
          rentCallId: 'rc-1',
          entityId,
          tier1SentAt: new Date(),
          tier2SentAt: new Date(),
          tier3SentAt: null,
        },
      ]);
      rentCallFinder.findUnpaidByIds.mockResolvedValue([
        {
          id: 'rc-1',
          totalAmountCents: 95000,
          tenant: {
            type: 'individual',
            firstName: 'A',
            lastName: 'B',
            companyName: null,
          },
        },
      ]);

      const result = await service.detectEscalationAlerts(entityId, userId, appUrl);

      expect(result[0].referenceId).toBe('rc-1-tier2');
      expect(result[0].alertItem.description).toContain('Niveau 2');
    });

    it('should skip escalations where rent call is paid', async () => {
      escalationFinder.findAllByEntity.mockResolvedValue([
        {
          id: 'esc-1',
          rentCallId: 'rc-1',
          entityId,
          tier1SentAt: new Date(),
          tier2SentAt: null,
          tier3SentAt: null,
        },
      ]);
      // No unpaid rent calls returned (rc-1 is paid)
      rentCallFinder.findUnpaidByIds.mockResolvedValue([]);

      const result = await service.detectEscalationAlerts(entityId, userId, appUrl);

      expect(result).toEqual([]);
    });

    it('should detect tier 3 correctly', async () => {
      escalationFinder.findAllByEntity.mockResolvedValue([
        {
          id: 'esc-1',
          rentCallId: 'rc-1',
          entityId,
          tier1SentAt: new Date(),
          tier2SentAt: new Date(),
          tier3SentAt: new Date(),
        },
      ]);
      rentCallFinder.findUnpaidByIds.mockResolvedValue([
        {
          id: 'rc-1',
          totalAmountCents: 75000,
          tenant: {
            type: 'individual',
            firstName: 'A',
            lastName: 'B',
            companyName: null,
          },
        },
      ]);

      const result = await service.detectEscalationAlerts(entityId, userId, appUrl);

      expect(result[0].referenceId).toBe('rc-1-tier3');
      expect(result[0].alertItem.description).toContain('Niveau 3');
    });
  });
});
