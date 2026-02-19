import { Test, TestingModule } from '@nestjs/testing';
import { AlertLogFinder } from '../finders/alert-log.finder';
import { PrismaService } from '@infrastructure/database/prisma.service';

describe('AlertLogFinder', () => {
  let finder: AlertLogFinder;
  let prisma: {
    alertLog: { findUnique: jest.Mock; findMany: jest.Mock };
  };

  const entityId = '11111111-1111-1111-1111-111111111111';
  const userId = 'user_test123';

  beforeEach(async () => {
    prisma = {
      alertLog: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertLogFinder,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    finder = module.get(AlertLogFinder);
  });

  describe('findByEntityUserTypeAndReference', () => {
    it('should query by composite unique key', async () => {
      prisma.alertLog.findUnique.mockResolvedValue(null);

      await finder.findByEntityUserTypeAndReference(
        entityId,
        userId,
        'unpaid_rent',
        'ref-123',
      );

      expect(prisma.alertLog.findUnique).toHaveBeenCalledWith({
        where: {
          entityId_userId_alertType_referenceId: {
            entityId,
            userId,
            alertType: 'unpaid_rent',
            referenceId: 'ref-123',
          },
        },
      });
    });

    it('should return alert log when found', async () => {
      const alertLog = {
        id: 'log-1',
        entityId,
        userId,
        alertType: 'unpaid_rent',
        referenceId: 'ref-123',
        sentAt: new Date(),
      };
      prisma.alertLog.findUnique.mockResolvedValue(alertLog);

      const result = await finder.findByEntityUserTypeAndReference(
        entityId,
        userId,
        'unpaid_rent',
        'ref-123',
      );

      expect(result).toEqual(alertLog);
    });
  });

  describe('findSentReferenceIds', () => {
    it('should return empty set when no referenceIds provided', async () => {
      const result = await finder.findSentReferenceIds(
        entityId,
        userId,
        'unpaid_rent',
        [],
      );

      expect(result).toEqual(new Set());
      expect(prisma.alertLog.findMany).not.toHaveBeenCalled();
    });

    it('should return set of sent referenceIds', async () => {
      prisma.alertLog.findMany.mockResolvedValue([
        { referenceId: 'rc-1' },
        { referenceId: 'rc-3' },
      ]);

      const result = await finder.findSentReferenceIds(
        entityId,
        userId,
        'unpaid_rent',
        ['rc-1', 'rc-2', 'rc-3'],
      );

      expect(result).toEqual(new Set(['rc-1', 'rc-3']));
      expect(prisma.alertLog.findMany).toHaveBeenCalledWith({
        where: {
          entityId,
          userId,
          alertType: 'unpaid_rent',
          referenceId: { in: ['rc-1', 'rc-2', 'rc-3'] },
        },
        select: { referenceId: true },
      });
    });
  });

  describe('findAllByEntityAndUser', () => {
    it('should query with entityId and userId, ordered by sentAt desc', async () => {
      prisma.alertLog.findMany.mockResolvedValue([]);

      await finder.findAllByEntityAndUser(entityId, userId);

      expect(prisma.alertLog.findMany).toHaveBeenCalledWith({
        where: { entityId, userId },
        orderBy: { sentAt: 'desc' },
      });
    });
  });
});
