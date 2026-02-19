import { GetOpenBankingStatusController } from '../controllers/get-open-banking-status.controller.js';

describe('GetOpenBankingStatusController', () => {
  it('should return available: true when Bridge is configured', () => {
    const mockBridge = { isAvailable: true };
    const controller = new GetOpenBankingStatusController(mockBridge as never);

    expect(controller.handle()).toEqual({ available: true });
  });

  it('should return available: false when Bridge is not configured', () => {
    const mockBridge = { isAvailable: false };
    const controller = new GetOpenBankingStatusController(mockBridge as never);

    expect(controller.handle()).toEqual({ available: false });
  });
});
