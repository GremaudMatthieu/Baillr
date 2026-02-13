// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);
jest.mock('@nestjs/cqrs', () => ({
  CommandHandler: () => () => {},
  ICommandHandler: class {},
}));

jest.mock('@infrastructure/email/templates/rent-call-email.template', () => ({
  renderRentCallEmailHtml: jest.fn(() => '<html>email</html>'),
}));

import { SendRentCallsByEmailHandler } from '../commands/send-rent-calls-by-email.handler';
import { SendRentCallsByEmailCommand } from '../commands/send-rent-calls-by-email.command';

const mockAssembler = {
  assembleFromRentCall: jest.fn(() => ({
    entityName: 'SCI Example',
    tenantName: 'Jean Dupont',
    totalAmountCents: 85000,
  })),
};

const mockPdfGenerator = {
  generateRentCallPdf: jest.fn(() => Promise.resolve(Buffer.from('fake-pdf'))),
};

const mockEmailService = {
  sendWithAttachment: jest.fn(() => Promise.resolve()),
  from: 'noreply@baillr.fr',
};

const mockRepository = {
  load: jest.fn(),
  save: jest.fn(),
};

function createRentCallFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rc-1',
    entityId: 'entity-1',
    month: '2026-02',
    totalAmountCents: 85000,
    tenant: {
      type: 'individual',
      firstName: 'Jean',
      lastName: 'Dupont',
      companyName: null,
      email: 'jean@example.com',
    },
    unit: { identifier: 'A1' },
    lease: { monthlyDueDate: 5, startDate: new Date('2025-01-01') },
    entity: {
      name: 'SCI Example',
      email: 'owner@example.com',
      bankAccounts: [],
    },
    ...overrides,
  };
}

describe('SendRentCallsByEmailHandler', () => {
  let handler: SendRentCallsByEmailHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new SendRentCallsByEmailHandler(
      mockAssembler as any,
      mockPdfGenerator as any,
      mockEmailService as any,
      mockRepository as any,
    );

    mockRepository.load.mockResolvedValue({
      markAsSent: jest.fn(),
    });
    mockRepository.save.mockResolvedValue(undefined);
  });

  it('should send emails for all unsent rent calls in batch', async () => {
    const unsentRentCalls = [
      createRentCallFixture(),
      createRentCallFixture({
        id: 'rc-2',
        tenant: {
          type: 'individual',
          firstName: 'Marie',
          lastName: 'Martin',
          companyName: null,
          email: 'marie@example.com',
        },
      }),
    ];

    const result = await handler.execute(
      new SendRentCallsByEmailCommand('entity-1', '2026-02', 'user_123', unsentRentCalls as any),
    );

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.totalAmountCents).toBe(170000);
    expect(result.failures).toEqual([]);
    expect(mockEmailService.sendWithAttachment).toHaveBeenCalledTimes(2);
  });

  it('should return {sent:0} when unsent rent calls array is empty', async () => {
    const result = await handler.execute(
      new SendRentCallsByEmailCommand('entity-1', '2026-02', 'user_123', []),
    );

    expect(result).toEqual({ sent: 0, failed: 0, totalAmountCents: 0, failures: [] });
  });

  it('should count tenant without email as failure', async () => {
    const unsentRentCalls = [
      createRentCallFixture({
        tenant: {
          type: 'individual',
          firstName: 'Jean',
          lastName: 'Dupont',
          companyName: null,
          email: '',
        },
      }),
    ];

    const result = await handler.execute(
      new SendRentCallsByEmailCommand('entity-1', '2026-02', 'user_123', unsentRentCalls as any),
    );

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.failures).toEqual(['Jean Dupont (email manquant)']);
    expect(mockEmailService.sendWithAttachment).not.toHaveBeenCalled();
  });

  it('should mark aggregate as sent after successful email', async () => {
    const mockAggregate = { markAsSent: jest.fn() };
    mockRepository.load.mockResolvedValue(mockAggregate);
    const unsentRentCalls = [createRentCallFixture()];

    await handler.execute(
      new SendRentCallsByEmailCommand('entity-1', '2026-02', 'user_123', unsentRentCalls as any),
    );

    expect(mockRepository.load).toHaveBeenCalledWith('rc-1');
    expect(mockAggregate.markAsSent).toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalledWith(mockAggregate);
  });

  it('should handle email send failure gracefully with sanitized error', async () => {
    const unsentRentCalls = [createRentCallFixture()];
    mockEmailService.sendWithAttachment.mockRejectedValueOnce(new Error('SMTP connection refused'));

    const result = await handler.execute(
      new SendRentCallsByEmailCommand('entity-1', '2026-02', 'user_123', unsentRentCalls as any),
    );

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.failures).toEqual(["Jean Dupont (erreur d'envoi)"]);
  });

  it('should use emailService.from instead of duplicating env access', async () => {
    const unsentRentCalls = [createRentCallFixture()];

    await handler.execute(
      new SendRentCallsByEmailCommand('entity-1', '2026-02', 'user_123', unsentRentCalls as any),
    );

    expect(mockEmailService.sendWithAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining('noreply@baillr.fr'),
      }),
    );
  });

  it('should use RFC 5322 quoted entity name as email sender display name', async () => {
    const unsentRentCalls = [createRentCallFixture()];

    await handler.execute(
      new SendRentCallsByEmailCommand('entity-1', '2026-02', 'user_123', unsentRentCalls as any),
    );

    expect(mockEmailService.sendWithAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"SCI Example" <noreply@baillr.fr>',
        subject: expect.stringContaining("Avis d'échéance"),
      }),
    );
  });

  it('should escape special characters in entity name for RFC 5322 From header', async () => {
    const unsentRentCalls = [
      createRentCallFixture({
        entity: {
          name: 'SCI O\'Brien & "Co"',
          email: 'owner@example.com',
          bankAccounts: [],
        },
      }),
    ];

    await handler.execute(
      new SendRentCallsByEmailCommand('entity-1', '2026-02', 'user_123', unsentRentCalls as any),
    );

    expect(mockEmailService.sendWithAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"SCI O\'Brien & \\"Co\\"" <noreply@baillr.fr>',
      }),
    );
  });

  it('should return correct SendResult with mixed success and failure', async () => {
    const unsentRentCalls = [
      createRentCallFixture(),
      createRentCallFixture({
        id: 'rc-2',
        tenant: {
          type: 'individual',
          firstName: 'No',
          lastName: 'Email',
          companyName: null,
          email: '',
        },
      }),
    ];

    const result = await handler.execute(
      new SendRentCallsByEmailCommand('entity-1', '2026-02', 'user_123', unsentRentCalls as any),
    );

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.totalAmountCents).toBe(85000);
    expect(result.failures).toEqual(['No Email (email manquant)']);
  });
});
