import { UnauthorizedException } from '@nestjs/common';
import { GetBankStatementsHandler } from '../queries/get-bank-statements.handler';
import { GetBankStatementsQuery } from '../queries/get-bank-statements.query';

describe('GetBankStatementsHandler', () => {
  let handler: GetBankStatementsHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockBankStatementFinder: { findAllByEntity: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockBankStatementFinder = { findAllByEntity: jest.fn() };
    handler = new GetBankStatementsHandler(
      mockEntityFinder as never,
      mockBankStatementFinder as never,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(handler.execute(new GetBankStatementsQuery('entity-1', 'user-1'))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return bank statements for valid entity', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const statements = [{ id: 'bs-1', filename: 'relevé-01.csv', importedAt: new Date() }];
    mockBankStatementFinder.findAllByEntity.mockResolvedValue(statements);

    const result = await handler.execute(new GetBankStatementsQuery('entity-1', 'user-1'));

    expect(result).toEqual(statements);
    expect(mockBankStatementFinder.findAllByEntity).toHaveBeenCalledWith('entity-1', 'user-1');
  });
});
