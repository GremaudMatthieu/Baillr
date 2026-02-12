import { type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const API_BASE = 'http://localhost:3001';

interface ApiHelperOptions {
  request: APIRequestContext;
  token: string;
}

interface CreateEntityParams {
  id?: string;
  type?: 'sci' | 'nom_propre';
  name: string;
  siret?: string;
  address?: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
    complement?: string | null;
  };
  legalInformation?: string;
}

interface AddBankAccountParams {
  entityId: string;
  accountId?: string;
  type?: 'bank_account' | 'cash_register';
  label: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  isDefault?: boolean;
}

interface CreatePropertyParams {
  entityId: string;
  id?: string;
  name: string;
  type?: string;
  address?: {
    street: string;
    postalCode: string;
    city: string;
    country?: string;
    complement?: string | null;
  };
}

interface CreateUnitParams {
  propertyId: string;
  id?: string;
  identifier: string;
  type?: 'apartment' | 'parking' | 'commercial' | 'storage';
  floor?: number | null;
  surfaceArea?: number;
  billableOptions?: { label: string; amountCents: number }[];
}

interface CreateLeaseParams {
  entityId: string;
  id?: string;
  tenantId: string;
  unitId: string;
  startDate?: string;
  rentAmountCents?: number;
  securityDepositCents?: number;
  monthlyDueDate?: number;
  revisionIndexType?: 'IRL' | 'ILC' | 'ICC';
}

interface RegisterTenantParams {
  entityId: string;
  id?: string;
  type?: 'individual' | 'company';
  firstName: string;
  lastName: string;
  companyName?: string;
  siret?: string;
  email: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    postalCode?: string;
    city?: string;
    complement?: string;
  };
}

export class ApiHelper {
  private request: APIRequestContext;
  private token: string;
  private createdEntityIds: string[] = [];
  private createdPropertyIds: string[] = [];

  constructor({ request, token }: ApiHelperOptions) {
    this.request = request;
    this.token = token;
  }

  private headers() {
    return { Authorization: `Bearer ${this.token}` };
  }

  async createEntity(params: CreateEntityParams) {
    const id = params.id ?? randomUUID();
    const response = await this.request.post(`${API_BASE}/api/entities`, {
      headers: this.headers(),
      data: {
        id,
        type: params.type ?? 'nom_propre',
        name: params.name,
        siret: params.siret,
        address: params.address ?? {
          street: '1 rue de la Paix',
          postalCode: '75001',
          city: 'Paris',
          country: 'France',
        },
        legalInformation: params.legalInformation,
      },
    });
    if (!response.ok()) {
      throw new Error(
        `Failed to create entity: ${response.status()} ${await response.text()}`,
      );
    }
    this.createdEntityIds.push(id);
    return id;
  }

  async getEntities() {
    const response = await this.request.get(`${API_BASE}/api/entities`, {
      headers: this.headers(),
    });
    if (!response.ok()) {
      throw new Error(`Failed to get entities: ${response.status()}`);
    }
    return (await response.json()) as { data: Record<string, unknown>[] };
  }

  async addBankAccount(params: AddBankAccountParams) {
    const accountId = params.accountId ?? randomUUID();
    const response = await this.request.post(
      `${API_BASE}/api/entities/${params.entityId}/bank-accounts`,
      {
        headers: this.headers(),
        data: {
          accountId,
          type: params.type ?? 'bank_account',
          label: params.label,
          iban: params.iban,
          bic: params.bic,
          bankName: params.bankName,
          isDefault: params.isDefault ?? false,
        },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to add bank account: ${response.status()} ${await response.text()}`,
      );
    }
    return accountId;
  }

  async removeBankAccount(entityId: string, accountId: string) {
    const response = await this.request.delete(
      `${API_BASE}/api/entities/${entityId}/bank-accounts/${accountId}`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to remove bank account: ${response.status()}`);
    }
  }

  async createProperty(params: CreatePropertyParams) {
    const id = params.id ?? randomUUID();
    const response = await this.request.post(
      `${API_BASE}/api/entities/${params.entityId}/properties`,
      {
        headers: this.headers(),
        data: {
          id,
          name: params.name,
          type: params.type,
          address: params.address ?? {
            street: '10 avenue des Champs-Élysées',
            postalCode: '75008',
            city: 'Paris',
            country: 'France',
          },
        },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to create property: ${response.status()} ${await response.text()}`,
      );
    }
    this.createdPropertyIds.push(id);
    return id;
  }

  async getProperties(entityId: string) {
    const response = await this.request.get(
      `${API_BASE}/api/entities/${entityId}/properties`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to get properties: ${response.status()}`);
    }
    return (await response.json()) as { data: Record<string, unknown>[] };
  }

  async createUnit(params: CreateUnitParams) {
    const id = params.id ?? randomUUID();
    const response = await this.request.post(
      `${API_BASE}/api/properties/${params.propertyId}/units`,
      {
        headers: this.headers(),
        data: {
          id,
          identifier: params.identifier,
          type: params.type ?? 'apartment',
          floor: params.floor,
          surfaceArea: params.surfaceArea ?? 45,
          billableOptions: params.billableOptions,
        },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to create unit: ${response.status()} ${await response.text()}`,
      );
    }
    return id;
  }

  async getUnits(propertyId: string) {
    const response = await this.request.get(
      `${API_BASE}/api/properties/${propertyId}/units`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to get units: ${response.status()}`);
    }
    return (await response.json()) as { data: Record<string, unknown>[] };
  }

  async getEntityUnits(entityId: string) {
    const response = await this.request.get(
      `${API_BASE}/api/entities/${entityId}/units`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to get entity units: ${response.status()}`);
    }
    return (await response.json()) as { data: Record<string, unknown>[] };
  }

  /** Wait for eventual consistency — poll until read model reflects the expected count */
  async waitForEntityCount(expectedCount: number, timeoutMs = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await this.getEntities();
      if (data.length >= expectedCount) return data;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(
      `Timed out waiting for ${expectedCount} entities (${timeoutMs}ms)`,
    );
  }

  async waitForPropertyCount(
    entityId: string,
    expectedCount: number,
    timeoutMs = 5000,
  ) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await this.getProperties(entityId);
      if (data.length >= expectedCount) return data;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(
      `Timed out waiting for ${expectedCount} properties (${timeoutMs}ms)`,
    );
  }

  async waitForUnitCount(
    propertyId: string,
    expectedCount: number,
    timeoutMs = 5000,
  ) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await this.getUnits(propertyId);
      if (data.length >= expectedCount) return data;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(
      `Timed out waiting for ${expectedCount} units (${timeoutMs}ms)`,
    );
  }

  async registerTenant(params: RegisterTenantParams) {
    const id = params.id ?? randomUUID();
    const response = await this.request.post(
      `${API_BASE}/api/entities/${params.entityId}/tenants`,
      {
        headers: this.headers(),
        data: {
          id,
          type: params.type ?? 'individual',
          firstName: params.firstName,
          lastName: params.lastName,
          companyName: params.companyName,
          siret: params.siret,
          email: params.email,
          phoneNumber: params.phoneNumber,
          address: params.address,
        },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to register tenant: ${response.status()} ${await response.text()}`,
      );
    }
    return id;
  }

  async getTenants(entityId: string) {
    const response = await this.request.get(
      `${API_BASE}/api/entities/${entityId}/tenants`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to get tenants: ${response.status()}`);
    }
    return (await response.json()) as { data: Record<string, unknown>[] };
  }

  async waitForTenantCount(
    entityId: string,
    expectedCount: number,
    timeoutMs = 5000,
  ) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await this.getTenants(entityId);
      if (data.length >= expectedCount) return data;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(
      `Timed out waiting for ${expectedCount} tenants (${timeoutMs}ms)`,
    );
  }

  async createLease(params: CreateLeaseParams) {
    const id = params.id ?? randomUUID();
    const response = await this.request.post(
      `${API_BASE}/api/entities/${params.entityId}/leases`,
      {
        headers: this.headers(),
        data: {
          id,
          tenantId: params.tenantId,
          unitId: params.unitId,
          startDate: params.startDate ?? '2026-03-01T00:00:00.000Z',
          rentAmountCents: params.rentAmountCents ?? 63000,
          securityDepositCents: params.securityDepositCents ?? 63000,
          monthlyDueDate: params.monthlyDueDate ?? 5,
          revisionIndexType: params.revisionIndexType ?? 'IRL',
        },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to create lease: ${response.status()} ${await response.text()}`,
      );
    }
    return id;
  }

  async configureBillingLines(
    leaseId: string,
    billingLines: { label: string; amountCents: number; type: string }[],
  ) {
    const response = await this.request.put(
      `${API_BASE}/api/leases/${leaseId}/billing-lines`,
      {
        headers: this.headers(),
        data: { billingLines },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to configure billing lines: ${response.status()} ${await response.text()}`,
      );
    }
  }

  async configureRevisionParameters(
    leaseId: string,
    params: {
      revisionDay: number;
      revisionMonth: number;
      referenceQuarter: string;
      referenceYear: number;
      baseIndexValue?: number | null;
    },
  ) {
    const response = await this.request.put(
      `${API_BASE}/api/leases/${leaseId}/revision-parameters`,
      {
        headers: this.headers(),
        data: {
          revisionDay: params.revisionDay,
          revisionMonth: params.revisionMonth,
          referenceQuarter: params.referenceQuarter,
          referenceYear: params.referenceYear,
          baseIndexValue: params.baseIndexValue ?? null,
        },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to configure revision parameters: ${response.status()} ${await response.text()}`,
      );
    }
  }

  async getLease(leaseId: string) {
    const response = await this.request.get(
      `${API_BASE}/api/leases/${leaseId}`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to get lease: ${response.status()}`);
    }
    return (await response.json()) as Record<string, unknown>;
  }

  async getLeases(entityId: string) {
    const response = await this.request.get(
      `${API_BASE}/api/entities/${entityId}/leases`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to get leases: ${response.status()}`);
    }
    return (await response.json()) as { data: Record<string, unknown>[] };
  }

  async waitForLeaseCount(
    entityId: string,
    expectedCount: number,
    timeoutMs = 5000,
  ) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await this.getLeases(entityId);
      if (data.length >= expectedCount) return data;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(
      `Timed out waiting for ${expectedCount} leases (${timeoutMs}ms)`,
    );
  }

  async generateRentCalls(entityId: string, month: string) {
    const response = await this.request.post(
      `${API_BASE}/api/entities/${entityId}/rent-calls/generate`,
      {
        headers: this.headers(),
        data: { month },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to generate rent calls: ${response.status()} ${await response.text()}`,
      );
    }
    return (await response.json()) as {
      generated: number;
      totalAmountCents: number;
      exceptions: string[];
    };
  }

  async getRentCalls(entityId: string, month?: string) {
    const url = month
      ? `${API_BASE}/api/entities/${entityId}/rent-calls?month=${month}`
      : `${API_BASE}/api/entities/${entityId}/rent-calls`;
    const response = await this.request.get(url, {
      headers: this.headers(),
    });
    if (!response.ok()) {
      throw new Error(`Failed to get rent calls: ${response.status()}`);
    }
    return (await response.json()) as { data: Record<string, unknown>[] };
  }

  async waitForRentCallCount(
    entityId: string,
    month: string,
    expectedCount: number,
    timeoutMs = 5000,
  ) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await this.getRentCalls(entityId, month);
      if (data.length >= expectedCount) return data;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(
      `Timed out waiting for ${expectedCount} rent calls (${timeoutMs}ms)`,
    );
  }

  async terminateLease(leaseId: string, endDate: string) {
    const response = await this.request.put(
      `${API_BASE}/api/leases/${leaseId}/terminate`,
      {
        headers: this.headers(),
        data: { endDate },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to terminate lease: ${response.status()} ${await response.text()}`,
      );
    }
  }

  getCreatedEntityIds() {
    return [...this.createdEntityIds];
  }

  getCreatedPropertyIds() {
    return [...this.createdPropertyIds];
  }
}
