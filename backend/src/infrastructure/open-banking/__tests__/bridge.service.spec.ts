import { BridgeService } from '../bridge.service.js';

describe('BridgeService', () => {
  let service: BridgeService;
  let fetchSpy: jest.SpyInstance;

  // Helper to mock getUserToken so user-scoped methods can work
  const mockTokenResponse = () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uuid: 'user-uuid-1' }),
    }); // createUser
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'mock-access-token' }),
    }); // authorization/token
  };

  beforeEach(() => {
    process.env.BRIDGE_CLIENT_ID = 'test-client-id';
    process.env.BRIDGE_CLIENT_SECRET = 'test-client-secret';

    service = new BridgeService();

    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    delete process.env.BRIDGE_CLIENT_ID;
    delete process.env.BRIDGE_CLIENT_SECRET;
  });

  describe('isAvailable', () => {
    it('should return true when credentials are set', () => {
      expect(service.isAvailable).toBe(true);
    });

    it('should return false when credentials are missing', () => {
      delete process.env.BRIDGE_CLIENT_ID;
      delete process.env.BRIDGE_CLIENT_SECRET;
      const unconfigured = new BridgeService();
      expect(unconfigured.isAvailable).toBe(false);
    });
  });

  describe('getUserToken', () => {
    it('should create user and fetch access token', async () => {
      mockTokenResponse();

      const token = await service.getUserToken('entity-1');

      expect(token).toBe('mock-access-token');

      // First call: create user
      expect(fetchSpy.mock.calls[0][0]).toContain('/v3/aggregation/users');
      const createBody = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
      expect(createBody.external_user_id).toBe('entity-entity-1');

      // Second call: get token
      expect(fetchSpy.mock.calls[1][0]).toContain(
        '/v3/aggregation/authorization/token',
      );
      const tokenBody = JSON.parse(fetchSpy.mock.calls[1][1].body as string);
      expect(tokenBody.external_user_id).toBe('entity-entity-1');
    });

    it('should cache token and not re-create user', async () => {
      mockTokenResponse();

      // First call creates user + gets token
      await service.getUserToken('entity-1');
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      // Second call should use cache
      const token2 = await service.getUserToken('entity-1');
      expect(token2).toBe('mock-access-token');
      expect(fetchSpy).toHaveBeenCalledTimes(2); // No additional calls
    });

    it('should handle 409 (user already exists) gracefully', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => 'User already exists',
      }); // createUser 409
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token-after-409' }),
      }); // authorization/token

      const token = await service.getUserToken('entity-1');

      expect(token).toBe('token-after-409');
    });
  });

  describe('getBanks', () => {
    it('should fetch banks from /v3/providers and filter for aggregation', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resources: [
            {
              id: 6,
              name: 'BNP Paribas',
              country_code: 'FR',
              images: { logo: 'https://logo.bnp' },
              capabilities: ['aggregation', 'single_payment'],
            },
            {
              id: 7,
              name: 'Crédit Agricole',
              country_code: 'FR',
              images: null,
              capabilities: ['aggregation'],
            },
            {
              id: 99,
              name: 'Payment-Only Bank',
              country_code: 'FR',
              images: { logo: 'https://logo.pay' },
              capabilities: ['single_payment'],
            },
          ],
          pagination: { next_uri: null },
        }),
      });

      const result = await service.getBanks('fr');

      // Should filter out the payment-only bank
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 6,
        name: 'BNP Paribas',
        country_code: 'FR',
        logo_url: 'https://logo.bnp',
      });
      expect(result[1]).toEqual({
        id: 7,
        name: 'Crédit Agricole',
        country_code: 'FR',
        logo_url: null,
      });
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/v3/providers'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Client-Id': 'test-client-id',
            'Client-Secret': 'test-client-secret',
          }),
        }),
      );
      // Must NOT contain /aggregation/ path
      expect(fetchSpy.mock.calls[0][0]).not.toContain('/aggregation/');
    });

    it('should paginate through all provider pages', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            resources: [
              {
                id: 6,
                name: 'BNP',
                country_code: 'FR',
                images: null,
                capabilities: ['aggregation'],
              },
            ],
            pagination: { next_uri: '/v3/providers?after=abc' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            resources: [
              {
                id: 7,
                name: 'CA',
                country_code: 'FR',
                images: null,
                capabilities: ['aggregation'],
              },
            ],
            pagination: { next_uri: null },
          }),
        });

      const result = await service.getBanks('fr');

      expect(result).toHaveLength(2);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw on API error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      await expect(service.getBanks('fr')).rejects.toThrow(
        'Failed to fetch providers: 500 Server error',
      );
    });
  });

  describe('getBank', () => {
    it('should fetch a single bank from /v3/providers/:id and map fields', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 6,
          name: 'BNP Paribas',
          country_code: 'FR',
          images: { logo: 'https://logo.bnp' },
          capabilities: ['aggregation'],
        }),
      });

      const result = await service.getBank(6);

      expect(result).toEqual({
        id: 6,
        name: 'BNP Paribas',
        country_code: 'FR',
        logo_url: 'https://logo.bnp',
      });
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/v3/providers/6'),
        expect.anything(),
      );
    });
  });

  describe('createConnectSession', () => {
    it('should create a connect session with Bearer token', async () => {
      mockTokenResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'session-123',
          url: 'https://connect.bridgeapi.io/session-123',
        }),
      });

      const result = await service.createConnectSession(
        'entity-1',
        'https://baillr.fr/callback',
      );

      expect(result.url).toBe('https://connect.bridgeapi.io/session-123');

      // Third fetch call is the actual connect-sessions call
      const connectCall = fetchSpy.mock.calls[2];
      expect(connectCall[0]).toContain('/v3/aggregation/connect-sessions');
      expect(connectCall[1].headers.Authorization).toBe(
        'Bearer mock-access-token',
      );
      const body = JSON.parse(connectCall[1].body as string);
      expect(body.callback_url).toBe('https://baillr.fr/callback');
      expect(body.user_email).toBe('entity-entity-1@app.baillr.fr');
    });

    it('should include prefill_provider_id when provided', async () => {
      mockTokenResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'session-456',
          url: 'https://connect.bridgeapi.io/session-456',
        }),
      });

      await service.createConnectSession(
        'entity-1',
        'https://baillr.fr/callback',
        574,
      );

      const connectCall = fetchSpy.mock.calls[2];
      const body = JSON.parse(connectCall[1].body as string);
      expect(body.provider_id).toBe(574);
      expect(body.country_code).toBe('fr');
    });
  });

  describe('getItems', () => {
    it('should fetch items with Bearer token', async () => {
      mockTokenResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resources: [
            {
              id: 100,
              status: 0,
              provider_id: 6,
              authentication_expires_at: '2026-08-19',
            },
          ],
          pagination: { next_uri: null },
        }),
      });

      const result = await service.getItems('entity-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(100);

      const itemsCall = fetchSpy.mock.calls[2];
      expect(itemsCall[0]).toContain('/v3/aggregation/items');
      expect(itemsCall[1].headers.Authorization).toBe(
        'Bearer mock-access-token',
      );
    });
  });

  describe('getAccounts', () => {
    it('should fetch accounts for an item with Bearer token', async () => {
      mockTokenResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resources: [
            {
              id: 200,
              name: 'Compte courant',
              balance: 1500.5,
              currency_code: 'EUR',
              iban: 'FR76...',
              type: 'checking',
              item_id: 100,
            },
          ],
          pagination: { next_uri: null },
        }),
      });

      const result = await service.getAccounts(100, 'entity-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Compte courant');

      const accountsCall = fetchSpy.mock.calls[2];
      expect(accountsCall[1].headers.Authorization).toBe(
        'Bearer mock-access-token',
      );
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions with Bearer token', async () => {
      mockTokenResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resources: [
            {
              id: 1001,
              clean_description: 'VIREMENT DUPONT JEAN',
              provider_description: 'VIR DUPONT JEAN LOYER',
              amount: 850.0,
              date: '2026-02-15',
              booking_date: '2026-02-15',
              currency_code: 'EUR',
              deleted: false,
              account_id: 200,
              category_id: null,
              operation_type: 'transfer',
            },
          ],
          pagination: { next_uri: null },
        }),
      });

      const result = await service.getTransactions(
        200,
        'entity-1',
        '2026-02-01',
      );

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(850.0);

      const txCall = fetchSpy.mock.calls[2];
      expect(txCall[0]).toContain('since=2026-02-01');
      expect(txCall[1].headers.Authorization).toBe(
        'Bearer mock-access-token',
      );
    });

    it('should filter out deleted transactions', async () => {
      mockTokenResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resources: [
            {
              id: 1001,
              amount: 100,
              deleted: false,
              clean_description: 'A',
              provider_description: '',
              date: '2026-02-15',
              booking_date: null,
              currency_code: 'EUR',
              account_id: 200,
              category_id: null,
              operation_type: null,
            },
            {
              id: 1002,
              amount: 200,
              deleted: true,
              clean_description: 'B',
              provider_description: '',
              date: '2026-02-15',
              booking_date: null,
              currency_code: 'EUR',
              account_id: 200,
              category_id: null,
              operation_type: null,
            },
          ],
          pagination: { next_uri: null },
        }),
      });

      const result = await service.getTransactions(200, 'entity-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1001);
    });

    it('should paginate through all results', async () => {
      mockTokenResponse();
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            resources: [
              {
                id: 1001,
                amount: 100,
                deleted: false,
                clean_description: 'A',
                provider_description: '',
                date: '2026-02-15',
                booking_date: null,
                currency_code: 'EUR',
                account_id: 200,
                category_id: null,
                operation_type: null,
              },
            ],
            pagination: {
              next_uri: '/v3/aggregation/transactions?cursor=abc',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            resources: [
              {
                id: 1002,
                amount: 200,
                deleted: false,
                clean_description: 'B',
                provider_description: '',
                date: '2026-02-16',
                booking_date: null,
                currency_code: 'EUR',
                account_id: 200,
                category_id: null,
                operation_type: null,
              },
            ],
            pagination: { next_uri: null },
          }),
        });

      const result = await service.getTransactions(200, 'entity-1');

      expect(result).toHaveLength(2);
      // 2 token calls + 2 paginated calls = 4
      expect(fetchSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('deleteItem', () => {
    it('should delete an item with Bearer token', async () => {
      mockTokenResponse();
      fetchSpy.mockResolvedValueOnce({ ok: true });

      await service.deleteItem(100, 'entity-1');

      const deleteCall = fetchSpy.mock.calls[2];
      expect(deleteCall[0]).toContain('/v3/aggregation/items/100');
      expect(deleteCall[1].method).toBe('DELETE');
      expect(deleteCall[1].headers.Authorization).toBe(
        'Bearer mock-access-token',
      );
    });

    it('should throw on delete failure after logging warning', async () => {
      mockTokenResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      await expect(
        service.deleteItem(100, 'entity-1'),
      ).rejects.toThrow('Failed to delete Bridge item 100: 404 Not found');
    });
  });
});
