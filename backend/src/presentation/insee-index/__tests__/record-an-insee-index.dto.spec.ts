import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RecordAnInseeIndexDto } from '../dto/record-an-insee-index.dto';

describe('RecordAnInseeIndexDto', () => {
  function createDto(overrides: Partial<RecordAnInseeIndexDto> = {}): RecordAnInseeIndexDto {
    return plainToInstance(RecordAnInseeIndexDto, {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'IRL',
      quarter: 'Q1',
      year: 2026,
      value: 142.06,
      ...overrides,
    });
  }

  it('should pass with valid data', async () => {
    const dto = createDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid UUID', async () => {
    const dto = createDto({ id: 'not-a-uuid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid type', async () => {
    const dto = createDto({ type: 'INVALID' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with type too long', async () => {
    const dto = createDto({ type: 'ABCD' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid quarter', async () => {
    const dto = createDto({ quarter: 'Q5' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with quarter too long', async () => {
    const dto = createDto({ quarter: 'Q12' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with year below 2000', async () => {
    const dto = createDto({ year: 1999 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with year above 2100', async () => {
    const dto = createDto({ year: 2101 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with non-integer year', async () => {
    const dto = createDto({ year: 2026.5 as number });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with value below 0.001', async () => {
    const dto = createDto({ value: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with value above 500', async () => {
    const dto = createDto({ value: 501 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it.each(['IRL', 'ILC', 'ICC'])('should accept valid type: %s', async (type) => {
    const dto = createDto({ type });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it.each(['Q1', 'Q2', 'Q3', 'Q4'])('should accept valid quarter: %s', async (quarter) => {
    const dto = createDto({ quarter });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with empty string id', async () => {
    const dto = createDto({ id: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with empty string type', async () => {
    const dto = createDto({ type: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with empty string quarter', async () => {
    const dto = createDto({ quarter: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
