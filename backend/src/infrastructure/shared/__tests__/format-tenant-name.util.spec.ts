import { formatTenantDisplayName, getTenantLastName } from '../format-tenant-name.util';

function makeTenant(overrides: Record<string, unknown> = {}) {
  return {
    type: 'individual',
    firstName: 'Jean',
    lastName: 'Dupont',
    companyName: null,
    ...overrides,
  };
}

describe('formatTenantDisplayName', () => {
  it('should return firstName lastName for individual tenant', () => {
    expect(formatTenantDisplayName(makeTenant())).toBe('Jean Dupont');
  });

  it('should return companyName for company tenant', () => {
    expect(
      formatTenantDisplayName(
        makeTenant({ type: 'company', companyName: 'ACME Corp' }),
      ),
    ).toBe('ACME Corp');
  });

  it('should fallback to firstName lastName for company tenant without companyName', () => {
    expect(
      formatTenantDisplayName(makeTenant({ type: 'company', companyName: null })),
    ).toBe('Jean Dupont');
  });

  it('should handle names with special characters', () => {
    expect(
      formatTenantDisplayName(makeTenant({ firstName: "Jean-Pierre", lastName: "O'Brien" })),
    ).toBe("Jean-Pierre O'Brien");
  });
});

describe('getTenantLastName', () => {
  it('should return lastName for individual tenant', () => {
    expect(getTenantLastName(makeTenant())).toBe('Dupont');
  });

  it('should return companyName for company tenant', () => {
    expect(
      getTenantLastName(makeTenant({ type: 'company', companyName: 'SCI Immobilier' })),
    ).toBe('SCI Immobilier');
  });

  it('should fallback to lastName for company tenant without companyName', () => {
    expect(
      getTenantLastName(makeTenant({ type: 'company', companyName: null })),
    ).toBe('Dupont');
  });
});
