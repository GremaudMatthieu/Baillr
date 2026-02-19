import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { AlertPreferenceController } from '../controllers/alert-preference.controller';
import { EntityFinder } from '../../entity/finders/entity.finder';
import { UnauthorizedException } from '@nestjs/common';
import { AlertType } from '../alert-type.enum';
import { GetAlertPreferencesQuery } from '../queries/get-alert-preferences.query';
import { UpdateAlertPreferencesCommand } from '../commands/update-alert-preferences.command';
import type { AlertPreferenceResult } from '../queries/get-alert-preferences.handler';

describe('AlertPreferenceController', () => {
  let controller: AlertPreferenceController;
  let entityFinder: { findByIdAndUserId: jest.Mock };
  let queryBus: { execute: jest.Mock };
  let commandBus: { execute: jest.Mock };

  const entityId = '11111111-1111-1111-1111-111111111111';
  const userId = 'user_test123';

  beforeEach(async () => {
    entityFinder = { findByIdAndUserId: jest.fn() };
    queryBus = { execute: jest.fn() };
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertPreferenceController],
      providers: [
        { provide: EntityFinder, useValue: entityFinder },
        { provide: QueryBus, useValue: queryBus },
        { provide: CommandBus, useValue: commandBus },
      ],
    }).compile();

    controller = module.get(AlertPreferenceController);
  });

  describe('GET /api/entities/:entityId/alert-preferences', () => {
    it('should throw UnauthorizedException if entity not found', async () => {
      entityFinder.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        controller.getPreferences(entityId, userId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return existing preferences with defaults for missing types', async () => {
      entityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });

      const queryResult: AlertPreferenceResult[] = [
        {
          id: 'pref-1',
          entityId,
          userId,
          alertType: AlertType.UNPAID_RENT,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: null,
          entityId,
          userId,
          alertType: AlertType.INSURANCE_EXPIRING,
          enabled: true,
          createdAt: null,
          updatedAt: null,
        },
        {
          id: null,
          entityId,
          userId,
          alertType: AlertType.ESCALATION_THRESHOLD,
          enabled: true,
          createdAt: null,
          updatedAt: null,
        },
      ];
      queryBus.execute.mockResolvedValue(queryResult);

      const result = await controller.getPreferences(entityId, userId);

      expect(result.data).toHaveLength(3);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetAlertPreferencesQuery),
      );
      const query = queryBus.execute.mock.calls[0][0];
      expect(query.entityId).toBe(entityId);
      expect(query.userId).toBe(userId);
      expect(result.data[0].alertType).toBe(AlertType.UNPAID_RENT);
      expect(result.data[0].enabled).toBe(true);
      // Defaults for missing types
      const insurancePref = result.data.find(
        (p: AlertPreferenceResult) => p.alertType === AlertType.INSURANCE_EXPIRING,
      );
      expect(insurancePref).toBeDefined();
      expect(insurancePref!.enabled).toBe(true);
      expect(insurancePref!.id).toBeNull();
    });

    it('should return all defaults when no preferences exist', async () => {
      entityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });

      const queryResult: AlertPreferenceResult[] = [
        { id: null, entityId, userId, alertType: AlertType.UNPAID_RENT, enabled: true, createdAt: null, updatedAt: null },
        { id: null, entityId, userId, alertType: AlertType.INSURANCE_EXPIRING, enabled: true, createdAt: null, updatedAt: null },
        { id: null, entityId, userId, alertType: AlertType.ESCALATION_THRESHOLD, enabled: true, createdAt: null, updatedAt: null },
      ];
      queryBus.execute.mockResolvedValue(queryResult);

      const result = await controller.getPreferences(entityId, userId);

      expect(result.data).toHaveLength(3);
      result.data.forEach((p: AlertPreferenceResult) => {
        expect(p.enabled).toBe(true);
        expect(p.id).toBeNull();
      });
    });
  });

  describe('PUT /api/entities/:entityId/alert-preferences', () => {
    it('should throw UnauthorizedException if entity not found', async () => {
      entityFinder.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        controller.updatePreferences(entityId, userId, {
          preferences: [
            { alertType: AlertType.UNPAID_RENT, enabled: false },
          ],
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should execute command and return updated list', async () => {
      entityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
      commandBus.execute.mockResolvedValue([
        {
          id: 'pref-1',
          entityId,
          userId,
          alertType: AlertType.UNPAID_RENT,
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await controller.updatePreferences(entityId, userId, {
        preferences: [
          { alertType: AlertType.UNPAID_RENT, enabled: false },
        ],
      });

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateAlertPreferencesCommand),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should pass all preferences to command', async () => {
      entityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
      commandBus.execute.mockResolvedValue([]);

      await controller.updatePreferences(entityId, userId, {
        preferences: [
          { alertType: AlertType.UNPAID_RENT, enabled: false },
          { alertType: AlertType.INSURANCE_EXPIRING, enabled: true },
          { alertType: AlertType.ESCALATION_THRESHOLD, enabled: false },
        ],
      });

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateAlertPreferencesCommand),
      );
      const command = commandBus.execute.mock.calls[0][0];
      expect(command.entityId).toBe(entityId);
      expect(command.userId).toBe(userId);
      expect(command.preferences).toHaveLength(3);
    });
  });
});
