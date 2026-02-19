import { Test, TestingModule } from '@nestjs/testing';
import { SendAlertsService } from '../send-alerts.service';
import { AlertDetectionService } from '../alert-detection.service';
import { EmailService } from '../../email/email.service';
import { AlertPreferenceFinder } from '../../../presentation/alert-preference/finders/alert-preference.finder';
import { AlertLogFinder } from '../../../presentation/alert-preference/finders/alert-log.finder';
import { AlertLogWriter } from '../../../presentation/alert-preference/writers/alert-log.writer';
import { EntityFinder } from '../../../presentation/entity/finders/entity.finder';
import { AlertType } from '../../../presentation/alert-preference/alert-type.enum';

const mockGetUser = jest.fn();
jest.mock('@clerk/backend', () => ({
  createClerkClient: () => ({
    users: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  }),
}));

describe('SendAlertsService', () => {
  let service: SendAlertsService;
  let entityFinder: { findAll: jest.Mock };
  let emailService: { sendWithAttachment: jest.Mock; from: string };
  let alertDetection: {
    detectUnpaidAlerts: jest.Mock;
    detectInsuranceAlerts: jest.Mock;
    detectEscalationAlerts: jest.Mock;
  };
  let alertPreferenceFinder: { findAllByEntityAndUser: jest.Mock };
  let alertLogFinder: { findSentReferenceIds: jest.Mock };
  let alertLogWriter: { createMany: jest.Mock };

  const entityId = '11111111-1111-1111-1111-111111111111';
  const userId = 'user_test123';
  const userEmail = 'bailleur@example.com';
  const entityName = 'SCI Dupont';
  const entityEmail = 'sci@dupont.fr';

  beforeEach(async () => {
    entityFinder = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    emailService = {
      sendWithAttachment: jest.fn().mockResolvedValue(undefined),
      from: 'noreply@baillr.fr',
    };
    alertDetection = {
      detectUnpaidAlerts: jest.fn().mockResolvedValue([]),
      detectInsuranceAlerts: jest.fn().mockResolvedValue([]),
      detectEscalationAlerts: jest.fn().mockResolvedValue([]),
    };
    alertPreferenceFinder = {
      findAllByEntityAndUser: jest.fn().mockResolvedValue([]),
    };
    alertLogFinder = {
      findSentReferenceIds: jest.fn().mockResolvedValue(new Set()),
    };
    alertLogWriter = {
      createMany: jest.fn().mockResolvedValue(undefined),
    };

    mockGetUser.mockResolvedValue({
      primaryEmailAddressId: 'email-1',
      emailAddresses: [{ id: 'email-1', emailAddress: userEmail }],
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendAlertsService,
        { provide: EntityFinder, useValue: entityFinder },
        { provide: EmailService, useValue: emailService },
        { provide: AlertDetectionService, useValue: alertDetection },
        { provide: AlertPreferenceFinder, useValue: alertPreferenceFinder },
        { provide: AlertLogFinder, useValue: alertLogFinder },
        { provide: AlertLogWriter, useValue: alertLogWriter },
      ],
    }).compile();

    service = module.get(SendAlertsService);
  });

  describe('processEntityAlerts', () => {
    it('should not send email when no alerts detected', async () => {
      const result = await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        entityEmail,
      );

      expect(result).toEqual({ sent: false, alertCount: 0 });
      expect(emailService.sendWithAttachment).not.toHaveBeenCalled();
    });

    it('should send email with unpaid alerts when detected', async () => {
      alertDetection.detectUnpaidAlerts.mockResolvedValue([
        {
          referenceId: 'rc-1',
          alertItem: {
            description: 'Loyer impayé — Jean Dupont',
            suggestedAction: 'Consultez le détail',
            applicationLink: 'http://localhost:3000/rent-calls',
          },
        },
      ]);

      const result = await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        entityEmail,
      );

      expect(result).toEqual({ sent: true, alertCount: 1 });
      expect(emailService.sendWithAttachment).toHaveBeenCalledTimes(1);
      const call = emailService.sendWithAttachment.mock.calls[0][0];
      expect(call.to).toBe(userEmail);
      expect(call.subject).toContain('Alertes pour SCI Dupont');
      expect(call.html).toContain('Jean Dupont');
    });

    it('should skip alert types when disabled in preferences', async () => {
      alertPreferenceFinder.findAllByEntityAndUser.mockResolvedValue([
        { alertType: AlertType.UNPAID_RENT, enabled: false },
        { alertType: AlertType.INSURANCE_EXPIRING, enabled: true },
        { alertType: AlertType.ESCALATION_THRESHOLD, enabled: false },
      ]);

      await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        entityEmail,
      );

      expect(alertDetection.detectUnpaidAlerts).not.toHaveBeenCalled();
      expect(alertDetection.detectInsuranceAlerts).toHaveBeenCalled();
      expect(alertDetection.detectEscalationAlerts).not.toHaveBeenCalled();
    });

    it('should default all types enabled when no preferences exist', async () => {
      alertPreferenceFinder.findAllByEntityAndUser.mockResolvedValue([]);

      await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        entityEmail,
      );

      expect(alertDetection.detectUnpaidAlerts).toHaveBeenCalled();
      expect(alertDetection.detectInsuranceAlerts).toHaveBeenCalled();
      expect(alertDetection.detectEscalationAlerts).toHaveBeenCalled();
    });

    it('should skip already-sent alerts (idempotency)', async () => {
      alertDetection.detectUnpaidAlerts.mockResolvedValue([
        {
          referenceId: 'rc-1',
          alertItem: {
            description: 'Alert 1',
            suggestedAction: 'Action',
            applicationLink: 'http://localhost:3000/rent-calls',
          },
        },
        {
          referenceId: 'rc-2',
          alertItem: {
            description: 'Alert 2',
            suggestedAction: 'Action',
            applicationLink: 'http://localhost:3000/rent-calls',
          },
        },
      ]);

      // rc-1 was already sent — batch query returns Set containing rc-1
      alertLogFinder.findSentReferenceIds.mockResolvedValue(
        new Set(['rc-1']),
      );

      const result = await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        entityEmail,
      );

      expect(result).toEqual({ sent: true, alertCount: 1 });
      expect(emailService.sendWithAttachment).toHaveBeenCalledTimes(1);
      // Only rc-2 should be logged via batch createMany
      expect(alertLogWriter.createMany).toHaveBeenCalledWith([
        {
          entityId,
          userId,
          alertType: AlertType.UNPAID_RENT,
          referenceId: 'rc-2',
        },
      ]);
    });

    it('should not send email when all alerts already sent', async () => {
      alertDetection.detectUnpaidAlerts.mockResolvedValue([
        {
          referenceId: 'rc-1',
          alertItem: {
            description: 'Alert',
            suggestedAction: 'Action',
            applicationLink: 'http://localhost:3000/rent-calls',
          },
        },
      ]);

      // All alerts already sent — batch query returns Set containing rc-1
      alertLogFinder.findSentReferenceIds.mockResolvedValue(
        new Set(['rc-1']),
      );

      const result = await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        entityEmail,
      );

      expect(result).toEqual({ sent: false, alertCount: 0 });
      expect(emailService.sendWithAttachment).not.toHaveBeenCalled();
    });

    it('should use RFC 5322 compliant From header', async () => {
      alertDetection.detectUnpaidAlerts.mockResolvedValue([
        {
          referenceId: 'rc-1',
          alertItem: {
            description: 'Alert',
            suggestedAction: 'Action',
            applicationLink: 'http://localhost:3000',
          },
        },
      ]);

      await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        entityEmail,
      );

      const call = emailService.sendWithAttachment.mock.calls[0][0];
      expect(call.from).toBe('"SCI Dupont" <noreply@baillr.fr>');
    });

    it('should BCC entity email when different from recipient', async () => {
      alertDetection.detectInsuranceAlerts.mockResolvedValue([
        {
          referenceId: 'tenant-1-2026-02',
          alertItem: {
            description: 'Insurance alert',
            suggestedAction: 'Contact',
            applicationLink: 'http://localhost:3000/tenants/tenant-1',
          },
        },
      ]);

      await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        entityEmail,
      );

      const call = emailService.sendWithAttachment.mock.calls[0][0];
      expect(call.to).toBe(userEmail);
      expect(call.bcc).toBe('sci@dupont.fr');
    });

    it('should not BCC when entity email matches recipient', async () => {
      alertDetection.detectUnpaidAlerts.mockResolvedValue([
        {
          referenceId: 'rc-1',
          alertItem: {
            description: 'Alert',
            suggestedAction: 'Action',
            applicationLink: 'http://localhost:3000',
          },
        },
      ]);

      await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        userEmail, // entity email same as Clerk-resolved user email
      );

      const call = emailService.sendWithAttachment.mock.calls[0][0];
      expect(call.to).toBe(userEmail);
      expect(call.bcc).toBeUndefined();
    });

    it('should not send when Clerk email resolution fails', async () => {
      mockGetUser.mockRejectedValue(new Error('Clerk unavailable'));

      alertDetection.detectUnpaidAlerts.mockResolvedValue([
        {
          referenceId: 'rc-1',
          alertItem: {
            description: 'Alert',
            suggestedAction: 'Action',
            applicationLink: 'http://localhost:3000',
          },
        },
      ]);

      const result = await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        entityEmail,
      );

      expect(result).toEqual({ sent: false, alertCount: 0 });
      expect(emailService.sendWithAttachment).not.toHaveBeenCalled();
    });

    it('should log all sent alerts for idempotency tracking via batch createMany', async () => {
      alertDetection.detectUnpaidAlerts.mockResolvedValue([
        {
          referenceId: 'rc-1',
          alertItem: {
            description: 'Alert 1',
            suggestedAction: 'Action',
            applicationLink: 'http://localhost:3000',
          },
        },
      ]);
      alertDetection.detectInsuranceAlerts.mockResolvedValue([
        {
          referenceId: 'tenant-1-2026-02',
          alertItem: {
            description: 'Alert 2',
            suggestedAction: 'Action',
            applicationLink: 'http://localhost:3000',
          },
        },
      ]);

      await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        entityEmail,
      );

      expect(alertLogWriter.createMany).toHaveBeenCalledTimes(1);
      expect(alertLogWriter.createMany).toHaveBeenCalledWith([
        {
          entityId,
          userId,
          alertType: AlertType.UNPAID_RENT,
          referenceId: 'rc-1',
        },
        {
          entityId,
          userId,
          alertType: AlertType.INSURANCE_EXPIRING,
          referenceId: 'tenant-1-2026-02',
        },
      ]);
    });

    it('should not send when all preferences disabled', async () => {
      alertPreferenceFinder.findAllByEntityAndUser.mockResolvedValue([
        { alertType: AlertType.UNPAID_RENT, enabled: false },
        { alertType: AlertType.INSURANCE_EXPIRING, enabled: false },
        { alertType: AlertType.ESCALATION_THRESHOLD, enabled: false },
      ]);

      const result = await service.processEntityAlerts(
        entityId,
        userId,
        entityName,
        entityEmail,
      );

      expect(result).toEqual({ sent: false, alertCount: 0 });
      expect(alertDetection.detectUnpaidAlerts).not.toHaveBeenCalled();
    });

    it('should escape entity name with quotes in From header', async () => {
      alertDetection.detectUnpaidAlerts.mockResolvedValue([
        {
          referenceId: 'rc-1',
          alertItem: {
            description: 'Alert',
            suggestedAction: 'Action',
            applicationLink: 'http://localhost:3000',
          },
        },
      ]);

      await service.processEntityAlerts(
        entityId,
        userId,
        'SCI "Les Pins"',
        entityEmail,
      );

      const call = emailService.sendWithAttachment.mock.calls[0][0];
      expect(call.from).toBe('"SCI \\"Les Pins\\"" <noreply@baillr.fr>');
    });
  });

  describe('handleCron', () => {
    it('should process all entities', async () => {
      entityFinder.findAll.mockResolvedValue([
        { id: entityId, userId, name: entityName, email: entityEmail },
      ]);

      const spy = jest.spyOn(service, 'processEntityAlerts').mockResolvedValue({
        sent: false,
        alertCount: 0,
      });

      await service.handleCron();

      expect(spy).toHaveBeenCalledWith(entityId, userId, entityName, entityEmail);
    });
  });
});
