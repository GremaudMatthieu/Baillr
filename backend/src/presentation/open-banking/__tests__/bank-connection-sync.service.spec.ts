import { BankConnectionSyncService } from '../services/bank-connection-sync.service.js';
import type { BridgeTransaction } from '@infrastructure/open-banking/bridge.service';

const mockBridge = {
  getTransactions: jest.fn(),
};

const mockCommandBus = {
  execute: jest.fn(),
};

const mockPrisma = {
  bankTransaction: {
    findMany: jest.fn(),
  },
};

describe('BankConnectionSyncService', () => {
  let service: BankConnectionSyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.bankTransaction.findMany.mockResolvedValue([]);
    service = new BankConnectionSyncService(
      mockBridge as never,
      mockCommandBus as never,
      mockPrisma as never,
    );
  });

  describe('mapTransactions', () => {
    it('should map Bridge credit transaction to ParsedTransaction', () => {
      const bridgeTransactions: BridgeTransaction[] = [
        {
          id: 1001,
          clean_description: 'VIREMENT DUPONT JEAN',
          provider_description: 'VIR DUPONT JEAN LOYER FEVRIER 2026 APT 3B',
          amount: 850.0,
          date: '2026-02-15',
          booking_date: '2026-02-15',
          currency_code: 'EUR',
          deleted: false,
          account_id: 200,
          category_id: null,
          operation_type: 'transfer',
        },
      ];

      const result = service.mapTransactions(bridgeTransactions);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: new Date('2026-02-15').toISOString(),
        amountCents: 85000,
        payerName: 'VIREMENT DUPONT JEAN',
        reference: 'VIR DUPONT JEAN LOYER FEVRIER 2026 APT 3B',
        rawLine: {
          transactionId: '1001',
          bookingDate: '2026-02-15',
          amount: '850',
          currency: 'EUR',
        },
      });
    });

    it('should map Bridge debit transaction', () => {
      const bridgeTransactions: BridgeTransaction[] = [
        {
          id: 1002,
          clean_description: 'PRELEVEMENT EDF',
          provider_description: 'PRLV EDF FACTURE ELECTRICITE',
          amount: -120.5,
          date: '2026-02-10',
          booking_date: '2026-02-10',
          currency_code: 'EUR',
          deleted: false,
          account_id: 200,
          category_id: null,
          operation_type: null,
        },
      ];

      const result = service.mapTransactions(bridgeTransactions);

      expect(result).toHaveLength(1);
      expect(result[0].amountCents).toBe(-12050);
      expect(result[0].payerName).toBe('PRELEVEMENT EDF');
    });

    it('should use clean_description as reference fallback when provider_description is empty', () => {
      const bridgeTransactions: BridgeTransaction[] = [
        {
          id: 1003,
          clean_description: 'VIREMENT MARTIN',
          provider_description: '',
          amount: 500.0,
          date: '2026-02-12',
          booking_date: null,
          currency_code: 'EUR',
          deleted: false,
          account_id: 200,
          category_id: null,
          operation_type: null,
        },
      ];

      const result = service.mapTransactions(bridgeTransactions);

      expect(result[0].reference).toBe('VIREMENT MARTIN');
    });

    it('should use "Inconnu" when clean_description is empty', () => {
      const bridgeTransactions: BridgeTransaction[] = [
        {
          id: 1004,
          clean_description: '',
          provider_description: '',
          amount: 100.0,
          date: '2026-02-12',
          booking_date: null,
          currency_code: 'EUR',
          deleted: false,
          account_id: 200,
          category_id: null,
          operation_type: null,
        },
      ];

      const result = service.mapTransactions(bridgeTransactions);

      expect(result[0].payerName).toBe('Inconnu');
    });

    it('should handle fractional cents correctly', () => {
      const bridgeTransactions: BridgeTransaction[] = [
        {
          id: 1005,
          clean_description: 'TEST',
          provider_description: '',
          amount: 99.99,
          date: '2026-02-12',
          booking_date: null,
          currency_code: 'EUR',
          deleted: false,
          account_id: 200,
          category_id: null,
          operation_type: null,
        },
      ];

      const result = service.mapTransactions(bridgeTransactions);

      expect(result[0].amountCents).toBe(9999);
    });

    it('should use date when booking_date is null', () => {
      const bridgeTransactions: BridgeTransaction[] = [
        {
          id: 1006,
          clean_description: 'TEST',
          provider_description: '',
          amount: 50.0,
          date: '2026-02-14',
          booking_date: null,
          currency_code: 'EUR',
          deleted: false,
          account_id: 200,
          category_id: null,
          operation_type: null,
        },
      ];

      const result = service.mapTransactions(bridgeTransactions);

      expect(result[0].date).toBe(new Date('2026-02-14').toISOString());
    });
  });

  describe('syncConnection', () => {
    const mockConnection = {
      id: 'conn-1',
      entityId: 'entity-1',
      bankAccountId: 'ba-1',
      accountIds: ['200', '201'] as unknown,
      lastSyncedAt: null,
    };

    it('should sync transactions for all accounts and dispatch commands', async () => {
      mockBridge.getTransactions
        .mockResolvedValueOnce([
          {
            id: 1001,
            clean_description: 'VIREMENT DUPONT',
            provider_description: 'LOYER',
            amount: 850.0,
            date: '2026-02-15',
            booking_date: '2026-02-15',
            currency_code: 'EUR',
            deleted: false,
            account_id: 200,
            category_id: null,
            operation_type: null,
          },
        ])
        .mockResolvedValueOnce([]);

      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await service.syncConnection(
        mockConnection as never,
        'user-1',
      );

      // Import command + mark-synced command
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);
      expect(result.imported).toBe(1);
    });

    it('should use lastSyncedAt as since when available', async () => {
      const connectionWithSync = {
        ...mockConnection,
        lastSyncedAt: new Date('2026-02-10T08:00:00.000Z'),
      };

      mockBridge.getTransactions.mockResolvedValue([]);
      mockCommandBus.execute.mockResolvedValue(undefined);

      await service.syncConnection(connectionWithSync as never, 'user-1');

      expect(mockBridge.getTransactions).toHaveBeenCalledWith(
        200,
        'entity-1',
        '2026-02-10',
        undefined,
      );
    });

    it('should continue syncing remaining accounts if one fails', async () => {
      mockBridge.getTransactions
        .mockRejectedValueOnce(new Error('Account error'))
        .mockResolvedValueOnce([
          {
            id: 1002,
            clean_description: 'VIREMENT MARTIN',
            provider_description: 'REF',
            amount: 500.0,
            date: '2026-02-16',
            booking_date: '2026-02-16',
            currency_code: 'EUR',
            deleted: false,
            account_id: 201,
            category_id: null,
            operation_type: null,
          },
        ]);

      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await service.syncConnection(
        mockConnection as never,
        'user-1',
      );

      // Should still import the second account's transactions
      expect(result.imported).toBe(1);
    });

    it('should mark connection as synced after processing', async () => {
      mockBridge.getTransactions.mockResolvedValue([]);
      mockCommandBus.execute.mockResolvedValue(undefined);

      await service.syncConnection(mockConnection as never, 'user-1');

      // The last command should be MarkBankConnectionSyncedCommand
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      const lastCall = mockCommandBus.execute.mock.calls[0][0];
      expect(lastCall.entityId).toBe('entity-1');
      expect(lastCall.connectionId).toBe('conn-1');
    });

    it('should skip duplicate transactions matching existing ones', async () => {
      // Simulate existing transaction in DB
      const existingDate = new Date('2026-02-15T00:00:00.000Z');
      mockPrisma.bankTransaction.findMany.mockResolvedValue([
        { date: existingDate, amountCents: 85000, reference: 'LOYER' },
      ]);

      mockBridge.getTransactions.mockResolvedValueOnce([
        {
          id: 1001,
          clean_description: 'VIREMENT DUPONT',
          provider_description: 'LOYER',
          amount: 850.0,
          date: '2026-02-15',
          booking_date: '2026-02-15',
          currency_code: 'EUR',
          deleted: false,
          account_id: 200,
          category_id: null,
          operation_type: null,
        },
      ]).mockResolvedValueOnce([]);

      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await service.syncConnection(
        mockConnection as never,
        'user-1',
      );

      // Only the mark-synced command, NO import command (all duplicates)
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      expect(result.imported).toBe(0);
    });

    it('should import only non-duplicate transactions', async () => {
      const existingDate = new Date('2026-02-15T00:00:00.000Z');
      mockPrisma.bankTransaction.findMany.mockResolvedValue([
        { date: existingDate, amountCents: 85000, reference: 'EXISTING-REF' },
      ]);

      mockBridge.getTransactions.mockResolvedValueOnce([
        {
          id: 1001,
          clean_description: 'VIREMENT DUPONT',
          provider_description: 'EXISTING-REF',
          amount: 850.0,
          date: '2026-02-15',
          booking_date: '2026-02-15',
          currency_code: 'EUR',
          deleted: false,
          account_id: 200,
          category_id: null,
          operation_type: null,
        },
        {
          id: 1002,
          clean_description: 'VIREMENT MARTIN',
          provider_description: 'NEW-REF',
          amount: 500.0,
          date: '2026-02-16',
          booking_date: '2026-02-16',
          currency_code: 'EUR',
          deleted: false,
          account_id: 200,
          category_id: null,
          operation_type: null,
        },
      ]).mockResolvedValueOnce([]);

      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await service.syncConnection(
        mockConnection as never,
        'user-1',
      );

      // Import command (1 non-duplicate) + mark-synced command
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);
      expect(result.imported).toBe(1);

      // Verify only the non-duplicate was in the import command
      const importCall = mockCommandBus.execute.mock.calls[0][0];
      expect(importCall.transactions).toHaveLength(1);
      expect(importCall.transactions[0].reference).toBe('NEW-REF');
    });

    it('should pass since and until options to bridge', async () => {
      mockBridge.getTransactions.mockResolvedValue([]);
      mockCommandBus.execute.mockResolvedValue(undefined);

      await service.syncConnection(mockConnection as never, 'user-1', {
        since: '2026-01-01',
        until: '2026-01-31',
      });

      expect(mockBridge.getTransactions).toHaveBeenCalledWith(
        200,
        'entity-1',
        '2026-01-01',
        '2026-01-31',
      );
    });

    it('should override lastSyncedAt when since option is provided', async () => {
      const connectionWithSync = {
        ...mockConnection,
        lastSyncedAt: new Date('2026-02-10T08:00:00.000Z'),
      };

      mockBridge.getTransactions.mockResolvedValue([]);
      mockCommandBus.execute.mockResolvedValue(undefined);

      await service.syncConnection(connectionWithSync as never, 'user-1', {
        since: '2026-01-01',
      });

      expect(mockBridge.getTransactions).toHaveBeenCalledWith(
        200,
        'entity-1',
        '2026-01-01',
        undefined,
      );
    });
  });
});
