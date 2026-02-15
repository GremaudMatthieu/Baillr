import { UnauthorizedException } from '@nestjs/common';
import { RecordAnnualChargesController } from '../controllers/record-annual-charges.controller';
import { RecordAnnualChargesCommand } from '@indexation/annual-charges/commands/record-annual-charges.command';

describe('RecordAnnualChargesController', () => {
  let controller: RecordAnnualChargesController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    controller = new RecordAnnualChargesController(
      mockCommandBus as never,
      mockEntityFinder as never,
    );
  });

  const validDto = {
    id: 'entity1-2025',
    fiscalYear: 2025,
    charges: [
      { chargeCategoryId: 'cat-water', label: 'Eau', amountCents: 45000 },
      { chargeCategoryId: 'cat-electricity', label: 'Électricité', amountCents: 30000 },
    ],
  };

  it('should dispatch command with valid data and return 202', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    await controller.handle('entity-1', validDto as never, 'user-1');

    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.any(RecordAnnualChargesCommand),
    );
    const command = mockCommandBus.execute.mock
      .calls[0][0] as RecordAnnualChargesCommand;
    expect(command.id).toBe('entity1-2025');
    expect(command.entityId).toBe('entity-1');
    expect(command.userId).toBe('user-1');
    expect(command.fiscalYear).toBe(2025);
    expect(command.charges).toHaveLength(2);
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', validDto as never, 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should check entity ownership with userId', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    await controller.handle('entity-1', validDto as never, 'user-1');

    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith(
      'entity-1',
      'user-1',
    );
  });
});
