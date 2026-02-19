import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MatchPaymentsController } from '../match-payments.controller.js';
import type { MatchingResult } from '@billing/payment-matching/domain/service/matching.types';

describe('MatchPaymentsController', () => {
  let controller: MatchPaymentsController;
  let entityFinder: { findByIdAndUserId: jest.Mock };
  let bankStatementFinder: { findTransactions: jest.Mock };
  let rentCallFinder: {
    findAllWithRelationsByEntityAndMonth: jest.Mock;
    findPaidRentCallIds: jest.Mock;
  };
  let matchingService: { match: jest.Mock };

  const mockResult: MatchingResult = {
    matches: [],
    ambiguous: [],
    unmatched: [],
    summary: { matched: 0, unmatched: 0, ambiguous: 0, rentCallCount: 0 },
  };

  beforeEach(() => {
    entityFinder = {
      findByIdAndUserId: jest.fn().mockResolvedValue({ id: 'entity-1' }),
    };
    bankStatementFinder = {
      findTransactions: jest.fn().mockResolvedValue([]),
    };
    rentCallFinder = {
      findAllWithRelationsByEntityAndMonth: jest.fn().mockResolvedValue([]),
      findPaidRentCallIds: jest.fn().mockResolvedValue([]),
    };
    matchingService = {
      match: jest.fn().mockReturnValue(mockResult),
    };

    controller = new MatchPaymentsController(
      entityFinder as any,
      bankStatementFinder as any,
      rentCallFinder as any,
      matchingService as any,
    );
  });

  it('should reject invalid month format', async () => {
    await expect(controller.handle('user-1', 'entity-1', 'bs-1', 'invalid')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject missing month', async () => {
    await expect(controller.handle('user-1', 'entity-1', 'bs-1', '')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject when entity not found (ownership check)', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('user-1', 'entity-1', 'bs-1', '2026-02')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should load data via finders and call matching service', async () => {
    const transactions = [
      {
        id: 'tx-1',
        date: new Date('2026-02-15'),
        amountCents: 85000,
        payerName: 'DUPONT JEAN',
        reference: 'LOYER-FEV',
      },
    ];
    const rentCalls = [
      {
        id: 'rc-1',
        tenant: { firstName: 'Jean', lastName: 'Dupont', companyName: null },
        unit: { identifier: 'Apt 3B' },
        leaseId: 'lease-1',
        totalAmountCents: 85000,
        month: '2026-02',
      },
    ];

    bankStatementFinder.findTransactions.mockResolvedValue(transactions);
    rentCallFinder.findAllWithRelationsByEntityAndMonth.mockResolvedValue(rentCalls);

    const customResult: MatchingResult = {
      matches: [
        {
          transactionId: 'tx-1',
          rentCallId: 'rc-1',
          confidence: 'high',
          score: 0.92,
          transaction: {
            id: 'tx-1',
            date: '2026-02-15',
            amountCents: 85000,
            payerName: 'DUPONT JEAN',
            reference: 'LOYER-FEV',
          },
          rentCall: {
            id: 'rc-1',
            tenantFirstName: 'Jean',
            tenantLastName: 'Dupont',
            companyName: null,
            unitIdentifier: 'Apt 3B',
            leaseId: 'lease-1',
            totalAmountCents: 85000,
            month: '2026-02',
          },
        },
      ],
      ambiguous: [],
      unmatched: [],
      summary: { matched: 1, unmatched: 0, ambiguous: 0, rentCallCount: 1 },
    };
    matchingService.match.mockReturnValue(customResult);

    const result = await controller.handle('user-1', 'entity-1', 'bs-1', '2026-02');

    expect(entityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-1', 'user-1');
    expect(bankStatementFinder.findTransactions).toHaveBeenCalledWith('bs-1', 'entity-1', 'user-1');
    expect(rentCallFinder.findAllWithRelationsByEntityAndMonth).toHaveBeenCalledWith(
      'entity-1',
      'user-1',
      '2026-02',
    );
    expect(matchingService.match).toHaveBeenCalledWith(
      [
        {
          id: 'tx-1',
          date: '2026-02-15',
          amountCents: 85000,
          payerName: 'DUPONT JEAN',
          reference: 'LOYER-FEV',
        },
      ],
      [
        {
          id: 'rc-1',
          tenantFirstName: 'Jean',
          tenantLastName: 'Dupont',
          companyName: null,
          unitIdentifier: 'Apt 3B',
          leaseId: 'lease-1',
          totalAmountCents: 85000,
          month: '2026-02',
        },
      ],
      new Set(),
    );
    expect(result).toMatchObject(customResult);
    expect(result.availableRentCalls).toEqual([
      {
        id: 'rc-1',
        tenantFirstName: 'Jean',
        tenantLastName: 'Dupont',
        companyName: null,
        unitIdentifier: 'Apt 3B',
        leaseId: 'lease-1',
        totalAmountCents: 85000,
        month: '2026-02',
      },
    ]);
  });

  it('should return empty result when no transactions', async () => {
    const result = await controller.handle('user-1', 'entity-1', 'bs-1', '2026-02');

    expect(matchingService.match).toHaveBeenCalledWith([], [], new Set());
    expect(result).toMatchObject(mockResult);
    expect(result.availableRentCalls).toEqual([]);
  });

  it('should pass paid rent call IDs as excludedRentCallIds', async () => {
    rentCallFinder.findPaidRentCallIds.mockResolvedValue(['rc-2', 'rc-4']);

    await controller.handle('user-1', 'entity-1', 'bs-1', '2026-02');

    expect(rentCallFinder.findPaidRentCallIds).toHaveBeenCalledWith(
      'entity-1',
      'user-1',
      '2026-02',
    );
    expect(matchingService.match).toHaveBeenCalledWith([], [], new Set(['rc-2', 'rc-4']));
  });

  it('should filter out debit transactions (negative amounts) from matching', async () => {
    const transactions = [
      {
        id: 'tx-credit',
        date: new Date('2026-02-15'),
        amountCents: 85000,
        payerName: 'DUPONT JEAN',
        reference: 'LOYER-FEV',
      },
      {
        id: 'tx-debit',
        date: new Date('2026-02-10'),
        amountCents: -12050,
        payerName: 'PRELEVEMENT EDF',
        reference: 'EDF-ELEC',
      },
      {
        id: 'tx-zero',
        date: new Date('2026-02-12'),
        amountCents: 0,
        payerName: 'AJUSTEMENT',
        reference: 'ADJ',
      },
    ];
    bankStatementFinder.findTransactions.mockResolvedValue(transactions);

    await controller.handle('user-1', 'entity-1', 'bs-1', '2026-02');

    // Only the credit transaction should be passed to matching
    expect(matchingService.match).toHaveBeenCalledWith(
      [
        {
          id: 'tx-credit',
          date: '2026-02-15',
          amountCents: 85000,
          payerName: 'DUPONT JEAN',
          reference: 'LOYER-FEV',
        },
      ],
      [],
      new Set(),
    );
  });
});
