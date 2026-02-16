import { UnauthorizedException } from '@nestjs/common';
import { ExportAccountBookHandler } from '../queries/export-account-book.handler';
import { ExportAccountBookQuery } from '../queries/export-account-book.query';

describe('ExportAccountBookHandler', () => {
  let handler: ExportAccountBookHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockAccountingFinder: { findByEntity: jest.Mock };
  let mockAssembler: { assemble: jest.Mock; buildFilename: jest.Mock };
  let mockExcelGenerator: { generateAccountBookExcel: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockAccountingFinder = { findByEntity: jest.fn() };
    mockAssembler = { assemble: jest.fn(), buildFilename: jest.fn() };
    mockExcelGenerator = { generateAccountBookExcel: jest.fn() };
    handler = new ExportAccountBookHandler(
      mockEntityFinder as never,
      mockAccountingFinder as never,
      mockAssembler as never,
      mockExcelGenerator as never,
    );
  });

  it('should return buffer and filename for valid entity', async () => {
    const entity = { id: 'entity-1', name: 'SCI Test' };
    const entries = [{ id: 'ae-1', category: 'rent_call' }];
    const excelData = { entityName: 'SCI Test', entries: [] };
    const buffer = Buffer.from('xlsx-content');

    mockEntityFinder.findByIdAndUserId.mockResolvedValue(entity);
    mockAccountingFinder.findByEntity.mockResolvedValue(entries);
    mockAssembler.assemble.mockReturnValue(excelData);
    mockExcelGenerator.generateAccountBookExcel.mockReturnValue(buffer);
    mockAssembler.buildFilename.mockReturnValue('livre-comptes-sci-test-2026-02-16.xlsx');

    const result = await handler.execute(
      new ExportAccountBookQuery('entity-1', 'user-1'),
    );

    expect(result.buffer).toBe(buffer);
    expect(result.filename).toBe('livre-comptes-sci-test-2026-02-16.xlsx');
    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-1', 'user-1');
    expect(mockAccountingFinder.findByEntity).toHaveBeenCalledWith('entity-1', {
      startDate: undefined,
      endDate: undefined,
      category: undefined,
      tenantId: undefined,
    });
    expect(mockAssembler.assemble).toHaveBeenCalledWith(entity, entries, {
      startDate: undefined,
      endDate: undefined,
    });
    expect(mockExcelGenerator.generateAccountBookExcel).toHaveBeenCalledWith(excelData);
  });

  it('should forward filters to finder and assembler', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1', name: 'Test' });
    mockAccountingFinder.findByEntity.mockResolvedValue([]);
    mockAssembler.assemble.mockReturnValue({});
    mockExcelGenerator.generateAccountBookExcel.mockReturnValue(Buffer.from(''));
    mockAssembler.buildFilename.mockReturnValue('test.xlsx');

    await handler.execute(
      new ExportAccountBookQuery(
        'entity-1',
        'user-1',
        '2026-01-01',
        '2026-12-31',
        'payment',
        'tenant-1',
      ),
    );

    expect(mockAccountingFinder.findByEntity).toHaveBeenCalledWith('entity-1', {
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      category: 'payment',
      tenantId: 'tenant-1',
    });
    expect(mockAssembler.assemble).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test' }),
      [],
      { startDate: '2026-01-01', endDate: '2026-12-31' },
    );
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new ExportAccountBookQuery('entity-1', 'user-1')),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockAccountingFinder.findByEntity).not.toHaveBeenCalled();
  });

  it('should call buildFilename with entity name', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'e-1', name: 'SCI Les Oliviers' });
    mockAccountingFinder.findByEntity.mockResolvedValue([]);
    mockAssembler.assemble.mockReturnValue({});
    mockExcelGenerator.generateAccountBookExcel.mockReturnValue(Buffer.from(''));
    mockAssembler.buildFilename.mockReturnValue('livre-comptes-sci-les-oliviers-2026-02-16.xlsx');

    await handler.execute(new ExportAccountBookQuery('e-1', 'user-1'));

    expect(mockAssembler.buildFilename).toHaveBeenCalledWith('SCI Les Oliviers');
  });
});
