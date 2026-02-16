import { ExportAccountBookController } from '../controllers/export-account-book.controller';
import { ExportAccountBookQuery } from '../queries/export-account-book.query';

describe('ExportAccountBookController', () => {
  let controller: ExportAccountBookController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new ExportAccountBookController(queryBus as never);
  });

  it('should set Content-Type and Content-Disposition headers and send buffer', async () => {
    const buffer = Buffer.from('xlsx-content');
    queryBus.execute.mockResolvedValue({
      buffer,
      filename: 'livre-comptes-sci-test-2026-02-16.xlsx',
    });

    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    await controller.handle('entity-1', 'user-1', {}, res as never);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="livre-comptes-sci-test-2026-02-16.xlsx"',
    );
    expect(res.end).toHaveBeenCalledWith(buffer);
  });

  it('should dispatch query with all filter params', async () => {
    queryBus.execute.mockResolvedValue({
      buffer: Buffer.from(''),
      filename: 'test.xlsx',
    });
    const res = { setHeader: jest.fn(), end: jest.fn() };

    await controller.handle(
      'entity-1',
      'user-1',
      {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        category: 'rent_call',
        tenantId: 'tenant-1',
      },
      res as never,
    );

    const query = queryBus.execute.mock.calls[0]?.[0] as ExportAccountBookQuery;
    expect(query).toBeInstanceOf(ExportAccountBookQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user-1');
    expect(query.startDate).toBe('2026-01-01');
    expect(query.endDate).toBe('2026-12-31');
    expect(query.category).toBe('rent_call');
    expect(query.tenantId).toBe('tenant-1');
  });

  it('should dispatch query without optional params', async () => {
    queryBus.execute.mockResolvedValue({
      buffer: Buffer.from(''),
      filename: 'test.xlsx',
    });
    const res = { setHeader: jest.fn(), end: jest.fn() };

    await controller.handle('entity-1', 'user-1', {}, res as never);

    const query = queryBus.execute.mock.calls[0]?.[0] as ExportAccountBookQuery;
    expect(query.startDate).toBeUndefined();
    expect(query.endDate).toBeUndefined();
    expect(query.category).toBeUndefined();
    expect(query.tenantId).toBeUndefined();
  });
});
