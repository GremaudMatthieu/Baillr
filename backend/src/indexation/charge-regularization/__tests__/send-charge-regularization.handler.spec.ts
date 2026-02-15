jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { SendChargeRegularizationHandler } from '../commands/send-charge-regularization.handler';
import { SendChargeRegularizationCommand } from '../commands/send-charge-regularization.command';

describe('SendChargeRegularizationHandler', () => {
  let handler: SendChargeRegularizationHandler;
  let mockAssembler: { assembleFromStatement: jest.Mock };
  let mockPdfGenerator: { generateChargeRegularizationPdf: jest.Mock };
  let mockEmailService: { sendWithAttachment: jest.Mock; from: string };
  let mockFinder: { findByEntityAndYear: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockTenantFinder: { findByIdAndUser: jest.Mock };
  let mockUnitFinder: { findByIdWithProperty: jest.Mock };
  let mockRepository: { load: jest.Mock; save: jest.Mock };

  const mockEntity = {
    id: 'entity-1',
    name: 'SCI Test',
    email: 'admin@test.com',
    siret: null,
    addressStreet: '1 rue Test',
    addressPostalCode: '75001',
    addressCity: 'Paris',
    addressComplement: null,
  };

  const mockTenant = {
    id: 'tenant-1',
    firstName: 'Jean',
    lastName: 'Dupont',
    companyName: null,
    type: 'individual',
    email: 'jean@test.com',
    addressStreet: '2 rue Locataire',
    addressPostalCode: '75002',
    addressCity: 'Paris',
    addressComplement: null,
  };

  const mockStatement = {
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    tenantName: 'Jean Dupont',
    unitId: 'unit-1',
    unitIdentifier: 'Apt 1',
    occupancyStart: '2025-01-01',
    occupancyEnd: '2025-12-31',
    occupiedDays: 365,
    daysInYear: 365,
    charges: [
      {
        chargeCategoryId: 'cat-1',
        label: 'TEOM',
        totalChargeCents: 50000,
        tenantShareCents: 50000,
        provisionsPaidCents: 45000,
        isWaterByConsumption: false,
      },
    ],
    totalShareCents: 50000,
    totalProvisionsPaidCents: 45000,
    balanceCents: 5000,
  };

  const mockRegularization = {
    id: 'entity-1-2025',
    entityId: 'entity-1',
    userId: 'user-1',
    fiscalYear: 2025,
    statements: [mockStatement],
    totalBalanceCents: 5000,
    appliedAt: new Date(),
    sentAt: null,
    settledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockAssembler = { assembleFromStatement: jest.fn().mockReturnValue({}) };
    mockPdfGenerator = {
      generateChargeRegularizationPdf: jest
        .fn()
        .mockResolvedValue(Buffer.from('pdf')),
    };
    mockEmailService = {
      sendWithAttachment: jest.fn().mockResolvedValue(undefined),
      from: 'noreply@baillr.fr',
    };
    mockFinder = { findByEntityAndYear: jest.fn() };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockTenantFinder = { findByIdAndUser: jest.fn() };
    mockUnitFinder = {
      findByIdWithProperty: jest.fn().mockResolvedValue({
        property: {
          addressStreet: '1 rue Immeuble',
          addressPostalCode: '75001',
          addressCity: 'Paris',
          addressComplement: null,
        },
      }),
    };
    mockRepository = {
      load: jest.fn().mockResolvedValue({
        markAsSent: jest.fn(),
      }),
      save: jest.fn().mockResolvedValue(undefined),
    };

    handler = new SendChargeRegularizationHandler(
      mockAssembler as never,
      mockPdfGenerator as never,
      mockEmailService as never,
      mockFinder as never,
      mockEntityFinder as never,
      mockTenantFinder as never,
      mockUnitFinder as never,
      mockRepository as never,
    );
  });

  it('should return empty result if no regularization found', async () => {
    mockFinder.findByEntityAndYear.mockResolvedValue(null);

    const result = await handler.execute(
      new SendChargeRegularizationCommand('id-1', 'entity-1', 'user-1', 2025),
    );

    expect(result).toEqual({ sent: 0, failed: 0, failures: [] });
  });

  it('should return empty result if entity not found', async () => {
    mockFinder.findByEntityAndYear.mockResolvedValue(mockRegularization);
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    const result = await handler.execute(
      new SendChargeRegularizationCommand('id-1', 'entity-1', 'user-1', 2025),
    );

    expect(result).toEqual({ sent: 0, failed: 0, failures: [] });
  });

  it('should send email for each tenant with email', async () => {
    mockFinder.findByEntityAndYear.mockResolvedValue(mockRegularization);
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(mockEntity);
    mockTenantFinder.findByIdAndUser.mockResolvedValue(mockTenant);

    const result = await handler.execute(
      new SendChargeRegularizationCommand('id-1', 'entity-1', 'user-1', 2025),
    );

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(mockEmailService.sendWithAttachment).toHaveBeenCalledTimes(1);
    expect(mockEmailService.sendWithAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jean@test.com',
        bcc: 'admin@test.com',
        subject: 'Décompte de régularisation des charges — 2025',
      }),
    );
  });

  it('should fail for tenant without email', async () => {
    mockFinder.findByEntityAndYear.mockResolvedValue(mockRegularization);
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(mockEntity);
    mockTenantFinder.findByIdAndUser.mockResolvedValue({
      ...mockTenant,
      email: '',
    });

    const result = await handler.execute(
      new SendChargeRegularizationCommand('id-1', 'entity-1', 'user-1', 2025),
    );

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.failures).toEqual(['Jean Dupont (email manquant)']);
    expect(mockEmailService.sendWithAttachment).not.toHaveBeenCalled();
  });

  it('should fail for tenant not found', async () => {
    mockFinder.findByEntityAndYear.mockResolvedValue(mockRegularization);
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(mockEntity);
    mockTenantFinder.findByIdAndUser.mockResolvedValue(null);

    const result = await handler.execute(
      new SendChargeRegularizationCommand('id-1', 'entity-1', 'user-1', 2025),
    );

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.failures).toEqual([
      'Jean Dupont (locataire introuvable)',
    ]);
  });

  it('should mark aggregate as sent after successful sends', async () => {
    mockFinder.findByEntityAndYear.mockResolvedValue(mockRegularization);
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(mockEntity);
    mockTenantFinder.findByIdAndUser.mockResolvedValue(mockTenant);

    await handler.execute(
      new SendChargeRegularizationCommand('id-1', 'entity-1', 'user-1', 2025),
    );

    expect(mockRepository.load).toHaveBeenCalledWith('id-1');
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should not mark aggregate if all sends failed', async () => {
    mockFinder.findByEntityAndYear.mockResolvedValue(mockRegularization);
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(mockEntity);
    mockTenantFinder.findByIdAndUser.mockResolvedValue(null);

    await handler.execute(
      new SendChargeRegularizationCommand('id-1', 'entity-1', 'user-1', 2025),
    );

    expect(mockRepository.load).not.toHaveBeenCalled();
  });

  it('should handle email sending errors gracefully', async () => {
    mockFinder.findByEntityAndYear.mockResolvedValue(mockRegularization);
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(mockEntity);
    mockTenantFinder.findByIdAndUser.mockResolvedValue(mockTenant);
    mockEmailService.sendWithAttachment.mockRejectedValue(
      new Error('SMTP error'),
    );

    const result = await handler.execute(
      new SendChargeRegularizationCommand('id-1', 'entity-1', 'user-1', 2025),
    );

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.failures).toEqual(["Jean Dupont (erreur d'envoi)"]);
  });

  it('should generate PDF for each statement', async () => {
    mockFinder.findByEntityAndYear.mockResolvedValue(mockRegularization);
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(mockEntity);
    mockTenantFinder.findByIdAndUser.mockResolvedValue(mockTenant);

    await handler.execute(
      new SendChargeRegularizationCommand('id-1', 'entity-1', 'user-1', 2025),
    );

    expect(mockAssembler.assembleFromStatement).toHaveBeenCalledTimes(1);
    expect(
      mockPdfGenerator.generateChargeRegularizationPdf,
    ).toHaveBeenCalledTimes(1);
  });

  it('should attach PDF with correct filename', async () => {
    mockFinder.findByEntityAndYear.mockResolvedValue(mockRegularization);
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(mockEntity);
    mockTenantFinder.findByIdAndUser.mockResolvedValue(mockTenant);

    await handler.execute(
      new SendChargeRegularizationCommand('id-1', 'entity-1', 'user-1', 2025),
    );

    expect(mockEmailService.sendWithAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          expect.objectContaining({
            filename: 'regularisation-charges-Dupont-2025.pdf',
          }),
        ],
      }),
    );
  });

  it('should handle multi-tenant batch with partial failure', async () => {
    const tenant2 = {
      ...mockTenant,
      id: 'tenant-2',
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie@test.com',
    };

    const statement2 = {
      ...mockStatement,
      leaseId: 'lease-2',
      tenantId: 'tenant-2',
      tenantName: 'Marie Martin',
      unitId: 'unit-2',
      unitIdentifier: 'Apt 2',
    };

    const multiRegularization = {
      ...mockRegularization,
      statements: [mockStatement, statement2],
    };

    mockFinder.findByEntityAndYear.mockResolvedValue(multiRegularization);
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(mockEntity);
    mockTenantFinder.findByIdAndUser
      .mockResolvedValueOnce(mockTenant)
      .mockResolvedValueOnce(tenant2);
    // First email succeeds, second fails
    mockEmailService.sendWithAttachment
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('SMTP timeout'));

    const result = await handler.execute(
      new SendChargeRegularizationCommand('id-1', 'entity-1', 'user-1', 2025),
    );

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.failures).toEqual(["Marie Martin (erreur d'envoi)"]);
    expect(mockEmailService.sendWithAttachment).toHaveBeenCalledTimes(2);
    // Aggregate still marked as sent because 1 succeeded
    expect(mockRepository.load).toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
