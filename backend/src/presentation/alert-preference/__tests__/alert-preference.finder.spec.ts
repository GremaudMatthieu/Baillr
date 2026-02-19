import { Test, TestingModule } from '@nestjs/testing';
import { AlertPreferenceFinder } from '../finders/alert-preference.finder';
import { PrismaService } from '@infrastructure/database/prisma.service';

describe('AlertPreferenceFinder', () => {
  let finder: AlertPreferenceFinder;
  let prisma: {
    alertPreference: { findMany: jest.Mock; findUnique: jest.Mock };
  };

  const entityId = '11111111-1111-1111-1111-111111111111';
  const userId = 'user_test123';

  beforeEach(async () => {
    prisma = {
      alertPreference: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertPreferenceFinder,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    finder = module.get(AlertPreferenceFinder);
  });

  describe('findAllByEntityAndUser', () => {
    it('should query with entityId and userId, ordered by alertType', async () => {
      prisma.alertPreference.findMany.mockResolvedValue([]);

      await finder.findAllByEntityAndUser(entityId, userId);

      expect(prisma.alertPreference.findMany).toHaveBeenCalledWith({
        where: { entityId, userId },
        orderBy: { alertType: 'asc' },
      });
    });
  });

  describe('findByEntityUserAndType', () => {
    it('should query by composite unique key', async () => {
      prisma.alertPreference.findUnique.mockResolvedValue(null);

      await finder.findByEntityUserAndType(
        entityId,
        userId,
        'unpaid_rent',
      );

      expect(prisma.alertPreference.findUnique).toHaveBeenCalledWith({
        where: {
          entityId_userId_alertType: {
            entityId,
            userId,
            alertType: 'unpaid_rent',
          },
        },
      });
    });
  });
});
