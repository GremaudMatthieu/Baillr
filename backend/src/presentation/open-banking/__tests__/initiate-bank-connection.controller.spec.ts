import { InitiateBankConnectionController } from '../controllers/initiate-bank-connection.controller.js';
import { UnauthorizedException } from '@nestjs/common';

const mockBridge = {
  createConnectSession: jest.fn(),
};

const mockEntityFinder = {
  findByIdAndUserId: jest.fn(),
};

describe('InitiateBankConnectionController', () => {
  let controller: InitiateBankConnectionController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new InitiateBankConnectionController(
      mockBridge as never,
      mockEntityFinder as never,
    );
  });

  it('should create connect session and return link', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBridge.createConnectSession.mockResolvedValue({
      id: 'session-123',
      url: 'https://connect.bridgeapi.io/session-123',
    });

    const result = await controller.handle(
      'entity-1',
      'ba-1',
      'user-1',
      { institutionId: '574' },
    );

    expect(result.link).toBe('https://connect.bridgeapi.io/session-123');
    expect(result.reference).toBe('session-123');
    expect(mockBridge.createConnectSession).toHaveBeenCalledWith(
      'entity-1',
      expect.stringContaining('/bank-connections/callback'),
      574,
    );

    const callbackUrl = mockBridge.createConnectSession.mock.calls[0][1] as string;
    expect(callbackUrl).toContain('entityId=entity-1');
    expect(callbackUrl).toContain('bankAccountId=ba-1');
  });

  it('should pass undefined when institutionId is empty', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBridge.createConnectSession.mockResolvedValue({
      id: 'session-456',
      url: 'https://connect.bridgeapi.io/session-456',
    });

    await controller.handle('entity-1', 'ba-1', 'user-1', { institutionId: '' } as never);

    // parseInt('', 10) is NaN, so prefillBankId should be undefined
    expect(mockBridge.createConnectSession).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      undefined,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 'ba-1', 'user-1', {
        institutionId: '574',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
