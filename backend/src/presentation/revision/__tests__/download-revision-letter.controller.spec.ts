import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DownloadRevisionLetterController } from '../controllers/download-revision-letter.controller';

describe('DownloadRevisionLetterController', () => {
  let controller: DownloadRevisionLetterController;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockTenantFinder: { findByIdAndUser: jest.Mock };
  let mockLeaseFinder: { findByIdAndUser: jest.Mock };
  let mockRevisionFinder: { findByIdAndEntity: jest.Mock };
  let mockPdfGenerator: { generateRevisionLetterPdf: jest.Mock };
  let mockAssembler: { assemble: jest.Mock };
  let mockRes: { set: jest.Mock; end: jest.Mock };

  const entity = {
    id: 'entity-1',
    name: 'SCI Test',
    siret: '123',
    addressStreet: '10 Rue',
    addressPostalCode: '75001',
    addressCity: 'Paris',
    addressComplement: null,
  };

  const revision = {
    id: 'rev-1',
    tenantId: 'tenant-1',
    leaseId: 'lease-1',
    entityId: 'entity-1',
    status: 'approved',
    currentRentCents: 85000,
    newRentCents: 87550,
    differenceCents: 2550,
    newIndexYear: 2025,
    newIndexQuarter: 'T3',
    baseIndexYear: 2024,
    approvedAt: new Date('2026-01-15'),
  };

  const tenant = {
    id: 'tenant-1',
    type: 'individual',
    firstName: 'Jean',
    lastName: 'Dupont',
    companyName: null,
  };

  const lease = {
    id: 'lease-1',
    startDate: new Date('2025-01-01'),
  };

  beforeEach(() => {
    mockEntityFinder = {
      findByIdAndUserId: jest.fn().mockResolvedValue(entity),
    };
    mockTenantFinder = {
      findByIdAndUser: jest.fn().mockResolvedValue(tenant),
    };
    mockLeaseFinder = {
      findByIdAndUser: jest.fn().mockResolvedValue(lease),
    };
    mockRevisionFinder = {
      findByIdAndEntity: jest.fn().mockResolvedValue(revision),
    };
    mockPdfGenerator = {
      generateRevisionLetterPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    };
    mockAssembler = {
      assemble: jest.fn().mockReturnValue({ entityName: 'SCI Test' }),
    };
    mockRes = {
      set: jest.fn(),
      end: jest.fn(),
    };

    controller = new DownloadRevisionLetterController(
      mockEntityFinder as never,
      mockTenantFinder as never,
      mockLeaseFinder as never,
      mockRevisionFinder as never,
      mockPdfGenerator as never,
      mockAssembler as never,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 'rev-1', 'user-1', mockRes as never),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw NotFoundException when revision not found', async () => {
    mockRevisionFinder.findByIdAndEntity.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 'rev-1', 'user-1', mockRes as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when revision is not approved', async () => {
    mockRevisionFinder.findByIdAndEntity.mockResolvedValue({
      ...revision,
      status: 'pending',
    });

    await expect(
      controller.handle('entity-1', 'rev-1', 'user-1', mockRes as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when tenant not found', async () => {
    mockTenantFinder.findByIdAndUser.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 'rev-1', 'user-1', mockRes as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when lease not found', async () => {
    mockLeaseFinder.findByIdAndUser.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 'rev-1', 'user-1', mockRes as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('should generate PDF and stream buffer', async () => {
    const pdfBuffer = Buffer.from('fake-pdf-content');
    mockPdfGenerator.generateRevisionLetterPdf.mockResolvedValue(pdfBuffer);

    await controller.handle('entity-1', 'rev-1', 'user-1', mockRes as never);

    expect(mockAssembler.assemble).toHaveBeenCalledWith(revision, entity, tenant, lease);
    expect(mockPdfGenerator.generateRevisionLetterPdf).toHaveBeenCalled();
    expect(mockRes.end).toHaveBeenCalledWith(pdfBuffer);
  });

  it('should set correct response headers', async () => {
    await controller.handle('entity-1', 'rev-1', 'user-1', mockRes as never);

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Access-Control-Expose-Headers': 'Content-Disposition',
      }),
    );

    const headers = mockRes.set.mock.calls[0][0];
    expect(headers['Content-Disposition']).toContain('lettre-revision-Dupont-2025-T3.pdf');
  });

  it('should use company name for company tenants in filename', async () => {
    mockTenantFinder.findByIdAndUser.mockResolvedValue({
      ...tenant,
      type: 'company',
      companyName: 'SARL Test',
    });

    await controller.handle('entity-1', 'rev-1', 'user-1', mockRes as never);

    const headers = mockRes.set.mock.calls[0][0];
    expect(headers['Content-Disposition']).toContain('SARL_Test');
  });
});
