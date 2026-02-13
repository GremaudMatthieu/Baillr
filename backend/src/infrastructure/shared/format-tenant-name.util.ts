interface TenantNameFields {
  type: string;
  companyName: string | null;
  firstName: string;
  lastName: string;
}

export function formatTenantDisplayName(tenant: TenantNameFields): string {
  if (tenant.type === 'company' && tenant.companyName) {
    return tenant.companyName;
  }
  return `${tenant.firstName} ${tenant.lastName}`;
}

export function getTenantLastName(tenant: TenantNameFields): string {
  if (tenant.type === 'company' && tenant.companyName) {
    return tenant.companyName;
  }
  return tenant.lastName;
}
