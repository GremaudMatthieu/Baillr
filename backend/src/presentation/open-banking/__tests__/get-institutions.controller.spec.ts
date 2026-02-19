import { GetInstitutionsController } from '../controllers/get-institutions.controller.js';
import { UnauthorizedException } from '@nestjs/common';

const mockBridge = {
  getBanks: jest.fn(),
};

const mockEntityFinder = {
  findByIdAndUserId: jest.fn(),
};

describe('GetInstitutionsController', () => {
  let controller: GetInstitutionsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new GetInstitutionsController(
      mockBridge as never,
      mockEntityFinder as never,
    );
  });

  it('should return banks for valid entity and user', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBridge.getBanks.mockResolvedValue([
      { id: 6, name: 'BNP Paribas', country_code: 'fr', logo_url: 'https://logo.bnp' },
    ]);

    const result = await controller.handle('entity-1', 'user-1', 'fr');

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(
      expect.objectContaining({ id: 6, name: 'BNP Paribas' }),
    );
    expect(mockBridge.getBanks).toHaveBeenCalledWith('fr');
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('entity-1', 'user-1', 'fr')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
