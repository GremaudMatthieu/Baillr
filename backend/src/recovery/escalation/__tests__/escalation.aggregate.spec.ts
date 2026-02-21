jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { EscalationAggregate } from '../escalation.aggregate';
import { EscalationInitiated } from '../events/escalation-initiated.event';
import { ReminderEmailSent } from '../events/reminder-email-sent.event';
import { FormalNoticeGenerated } from '../events/formal-notice-generated.event';
import { StakeholderNotificationGenerated } from '../events/stakeholder-notification-generated.event';
import { RegisteredMailDispatched } from '../events/registered-mail-dispatched.event';

describe('EscalationAggregate', () => {
  const rentCallId = 'rent-call-123';
  const entityId = 'entity-456';
  const tenantId = 'tenant-789';
  const recipientEmail = 'tenant@example.com';
  const sentAt = new Date('2026-02-14T10:00:00.000Z');

  let aggregate: EscalationAggregate;

  beforeEach(() => {
    aggregate = new EscalationAggregate(rentCallId);
  });

  describe('streamName', () => {
    it('should have escalation as stream name', () => {
      expect(EscalationAggregate.streamName).toBe('escalation');
    });
  });

  describe('initiate', () => {
    it('should emit EscalationInitiated event', () => {
      aggregate.initiate(rentCallId, entityId, tenantId);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(EscalationInitiated);
      expect((events[0] as EscalationInitiated).data).toEqual({
        rentCallId,
        entityId,
        tenantId,
      });
    });

    it('should no-op if already initiated', () => {
      aggregate.initiate(rentCallId, entityId, tenantId);
      aggregate.commit();

      aggregate.initiate(rentCallId, entityId, tenantId);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('sendReminderEmail', () => {
    beforeEach(() => {
      aggregate.initiate(rentCallId, entityId, tenantId);
      aggregate.commit();
    });

    it('should emit ReminderEmailSent event', () => {
      aggregate.sendReminderEmail(recipientEmail, sentAt);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ReminderEmailSent);
      expect((events[0] as ReminderEmailSent).data).toEqual({
        rentCallId,
        tier1SentAt: sentAt.toISOString(),
        recipientEmail,
      });
    });

    it('should no-op if tier 1 already completed', () => {
      aggregate.sendReminderEmail(recipientEmail, sentAt);
      aggregate.commit();

      aggregate.sendReminderEmail(recipientEmail, new Date());

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('generateFormalNotice', () => {
    beforeEach(() => {
      aggregate.initiate(rentCallId, entityId, tenantId);
      aggregate.commit();
    });

    it('should emit FormalNoticeGenerated event', () => {
      aggregate.generateFormalNotice(sentAt);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(FormalNoticeGenerated);
      expect((events[0] as FormalNoticeGenerated).data).toEqual({
        rentCallId,
        tier2SentAt: sentAt.toISOString(),
      });
    });

    it('should no-op if tier 2 already completed', () => {
      aggregate.generateFormalNotice(sentAt);
      aggregate.commit();

      aggregate.generateFormalNotice(new Date());

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should allow tier 2 without tier 1 (skip)', () => {
      aggregate.generateFormalNotice(sentAt);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(FormalNoticeGenerated);
    });
  });

  describe('generateStakeholderNotifications', () => {
    beforeEach(() => {
      aggregate.initiate(rentCallId, entityId, tenantId);
      aggregate.commit();
    });

    it('should emit StakeholderNotificationGenerated event', () => {
      aggregate.generateStakeholderNotifications(sentAt);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(StakeholderNotificationGenerated);
      expect((events[0] as StakeholderNotificationGenerated).data).toEqual({
        rentCallId,
        tier3SentAt: sentAt.toISOString(),
      });
    });

    it('should no-op if tier 3 already completed', () => {
      aggregate.generateStakeholderNotifications(sentAt);
      aggregate.commit();

      aggregate.generateStakeholderNotifications(new Date());

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should allow tier 3 without tier 1 and tier 2 (skip)', () => {
      aggregate.generateStakeholderNotifications(sentAt);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(StakeholderNotificationGenerated);
    });
  });

  describe('full escalation flow', () => {
    it('should support complete tier 1 → tier 2 → tier 3 progression', () => {
      aggregate.initiate(rentCallId, entityId, tenantId);
      aggregate.commit();

      aggregate.sendReminderEmail(recipientEmail, new Date('2026-02-10'));
      aggregate.commit();

      aggregate.generateFormalNotice(new Date('2026-02-18'));
      aggregate.commit();

      aggregate.generateStakeholderNotifications(new Date('2026-02-26'));

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(StakeholderNotificationGenerated);
    });

    it('should support skipping tier 1 and going directly to tier 2', () => {
      aggregate.initiate(rentCallId, entityId, tenantId);
      aggregate.commit();

      aggregate.generateFormalNotice(sentAt);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(FormalNoticeGenerated);
    });

    it('should support skipping tier 1 and tier 2, going directly to tier 3', () => {
      aggregate.initiate(rentCallId, entityId, tenantId);
      aggregate.commit();

      aggregate.generateStakeholderNotifications(sentAt);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(StakeholderNotificationGenerated);
    });
  });

  describe('dispatchViaRegisteredMail', () => {
    beforeEach(() => {
      aggregate.initiate(rentCallId, entityId, tenantId);
      aggregate.commit();
    });

    it('should emit RegisteredMailDispatched event after formal notice generated', () => {
      aggregate.generateFormalNotice(sentAt);
      aggregate.commit();

      aggregate.dispatchViaRegisteredMail('LRE-2026-001', 'ar24', 479);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(RegisteredMailDispatched);
      const eventData = (events[0] as RegisteredMailDispatched).data;
      expect(eventData.rentCallId).toBe(rentCallId);
      expect(eventData.trackingId).toBe('LRE-2026-001');
      expect(eventData.provider).toBe('ar24');
      expect(eventData.costCents).toBe(479);
      expect(eventData.dispatchedAt).toBeTruthy();
    });

    it('should no-op if already dispatched', () => {
      aggregate.generateFormalNotice(sentAt);
      aggregate.commit();

      aggregate.dispatchViaRegisteredMail('LRE-2026-001', 'ar24', 479);
      aggregate.commit();

      aggregate.dispatchViaRegisteredMail('LRE-2026-002', 'ar24', 479);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should throw if formal notice not generated yet', () => {
      expect(() => {
        aggregate.dispatchViaRegisteredMail('LRE-2026-001', 'ar24', 479);
      }).toThrow('Formal notice must be generated before dispatching via registered mail');
    });
  });

  describe('full escalation flow with registered mail', () => {
    it('should support tier 2 → registered mail dispatch', () => {
      aggregate.initiate(rentCallId, entityId, tenantId);
      aggregate.commit();

      aggregate.generateFormalNotice(sentAt);
      aggregate.commit();

      aggregate.dispatchViaRegisteredMail('LRE-2026-001', 'ar24', 479);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(RegisteredMailDispatched);
    });

    it('should support tier 1 → tier 2 → registered mail → tier 3', () => {
      aggregate.initiate(rentCallId, entityId, tenantId);
      aggregate.commit();

      aggregate.sendReminderEmail(recipientEmail, new Date('2026-02-10'));
      aggregate.commit();

      aggregate.generateFormalNotice(new Date('2026-02-18'));
      aggregate.commit();

      aggregate.dispatchViaRegisteredMail('LRE-2026-001', 'ar24', 479);
      aggregate.commit();

      aggregate.generateStakeholderNotifications(new Date('2026-02-26'));

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(StakeholderNotificationGenerated);
    });
  });
});
