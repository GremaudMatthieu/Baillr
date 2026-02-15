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
  email?: string;
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
        email: params.email ?? `entity-${id.slice(0, 8)}@example.com`,
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

  async getChargeCategories(entityId: string) {
    const response = await this.request.get(
      `${API_BASE}/api/entities/${entityId}/charge-categories`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to get charge categories: ${response.status()}`);
    }
    return (await response.json()) as { data: Record<string, unknown>[] };
  }

  async createChargeCategory(entityId: string, label: string) {
    const response = await this.request.post(
      `${API_BASE}/api/entities/${entityId}/charge-categories`,
      {
        headers: this.headers(),
        data: { label },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to create charge category: ${response.status()} ${await response.text()}`,
      );
    }
    return (await response.json()) as { data: Record<string, unknown> };
  }

  async configureBillingLines(
    leaseId: string,
    billingLines: { chargeCategoryId: string; amountCents: number }[],
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

  async sendRentCallsByEmail(entityId: string, month: string) {
    const response = await this.request.post(
      `${API_BASE}/api/entities/${entityId}/rent-calls/send`,
      {
        headers: this.headers(),
        data: { month },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to send rent calls: ${response.status()} ${await response.text()}`,
      );
    }
    return (await response.json()) as {
      sent: number;
      failed: number;
      totalAmountCents: number;
      failures: string[];
    };
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

  async importBankStatement(
    entityId: string,
    bankAccountId: string,
    csvContent: string,
    fileName = 'releve.csv',
  ) {
    const response = await this.request.post(
      `${API_BASE}/api/entities/${entityId}/bank-statements/import`,
      {
        headers: { Authorization: `Bearer ${this.token}` },
        multipart: {
          file: {
            name: fileName,
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent),
          },
          bankAccountId,
        },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to import bank statement: ${response.status()} ${await response.text()}`,
      );
    }
    return (await response.json()) as {
      bankStatementId: string;
      transactionCount: number;
      transactions: Record<string, unknown>[];
    };
  }

  async getBankStatements(entityId: string) {
    const response = await this.request.get(
      `${API_BASE}/api/entities/${entityId}/bank-statements`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to get bank statements: ${response.status()}`);
    }
    return (await response.json()) as { data: Record<string, unknown>[] };
  }

  async waitForBankStatementCount(
    entityId: string,
    expectedCount: number,
    timeoutMs = 5000,
  ) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await this.getBankStatements(entityId);
      if (data.length >= expectedCount) return data;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(
      `Timed out waiting for ${expectedCount} bank statements (${timeoutMs}ms)`,
    );
  }

  async matchPayments(
    entityId: string,
    bankStatementId: string,
    month: string,
  ) {
    const response = await this.request.post(
      `${API_BASE}/api/entities/${entityId}/bank-statements/${bankStatementId}/match?month=${month}`,
      {
        headers: this.headers(),
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to match payments: ${response.status()} ${await response.text()}`,
      );
    }
    return (await response.json()) as {
      matches: Record<string, unknown>[];
      ambiguous: Record<string, unknown>[];
      unmatched: Record<string, unknown>[];
      summary: { matched: number; unmatched: number; ambiguous: number; rentCallCount: number };
    };
  }

  async validateMatch(
    entityId: string,
    payload: {
      transactionId: string;
      rentCallId: string;
      amountCents: number;
      payerName: string;
      paymentDate: string;
      bankStatementId?: string;
    },
  ) {
    const response = await this.request.post(
      `${API_BASE}/api/entities/${entityId}/payment-matches/validate`,
      {
        headers: this.headers(),
        data: payload,
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to validate match: ${response.status()} ${await response.text()}`,
      );
    }
  }

  async rejectMatch(entityId: string, transactionId: string) {
    const response = await this.request.post(
      `${API_BASE}/api/entities/${entityId}/payment-matches/reject`,
      {
        headers: this.headers(),
        data: { transactionId },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to reject match: ${response.status()} ${await response.text()}`,
      );
    }
  }

  async recordManualPayment(
    entityId: string,
    rentCallId: string,
    payload: {
      amountCents: number;
      paymentMethod: 'cash' | 'check';
      paymentDate: string;
      payerName: string;
      paymentReference?: string;
    },
  ) {
    const response = await this.request.post(
      `${API_BASE}/api/entities/${entityId}/rent-calls/${rentCallId}/payments/manual`,
      {
        headers: this.headers(),
        data: payload,
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to record manual payment: ${response.status()} ${await response.text()}`,
      );
    }
  }

  async waitForRentCallPaid(
    entityId: string,
    month: string,
    rentCallId: string,
    timeoutMs = 5000,
  ) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await this.getRentCalls(entityId, month);
      const rc = data.find((r) => r.id === rentCallId);
      if (rc && rc.paidAt) return rc;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(
      `Timed out waiting for rent call ${rentCallId} to be paid (${timeoutMs}ms)`,
    );
  }

  async waitForRentCallStatus(
    entityId: string,
    month: string,
    expectedStatus: string,
    timeoutMs = 5000,
  ) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await this.getRentCalls(entityId, month);
      if (data.length > 0 && data[0].paymentStatus === expectedStatus) return data[0];
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(
      `Timed out waiting for rent call status "${expectedStatus}" (${timeoutMs}ms)`,
    );
  }

  async getTenantAccount(entityId: string, tenantId: string) {
    const response = await this.request.get(
      `${API_BASE}/api/entities/${entityId}/tenants/${tenantId}/account`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to get tenant account: ${response.status()}`);
    }
    return (await response.json()) as {
      entries: Record<string, unknown>[];
      balanceCents: number;
    };
  }

  async configureLatePaymentDelay(entityId: string, days: number) {
    const response = await this.request.put(
      `${API_BASE}/api/entities/${entityId}/late-payment-delay`,
      {
        headers: this.headers(),
        data: { days },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to configure late payment delay: ${response.status()} ${await response.text()}`,
      );
    }
  }

  async getUnpaidRentCalls(entityId: string) {
    const response = await this.request.get(
      `${API_BASE}/api/entities/${entityId}/rent-calls/unpaid`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to get unpaid rent calls: ${response.status()}`);
    }
    return (await response.json()) as { data: Record<string, unknown>[] };
  }

  async waitForUnpaidRentCallCount(
    entityId: string,
    expectedCount: number,
    timeoutMs = 5000,
  ) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await this.getUnpaidRentCalls(entityId);
      if (data.length >= expectedCount) return data;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(
      `Timed out waiting for ${expectedCount} unpaid rent calls (${timeoutMs}ms)`,
    );
  }

  async getEscalationStatus(entityId: string, rentCallId: string) {
    const response = await this.request.get(
      `${API_BASE}/api/entities/${entityId}/rent-calls/${rentCallId}/escalation`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(`Failed to get escalation status: ${response.status()}`);
    }
    return (await response.json()) as {
      rentCallId: string;
      tier1SentAt: string | null;
      tier1RecipientEmail: string | null;
      tier2SentAt: string | null;
      tier3SentAt: string | null;
    };
  }

  async sendEscalationReminder(entityId: string, rentCallId: string) {
    const response = await this.request.post(
      `${API_BASE}/api/entities/${entityId}/rent-calls/${rentCallId}/escalation/reminder`,
      { headers: this.headers() },
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to send escalation reminder: ${response.status()} ${await response.text()}`,
      );
    }
    return (await response.json()) as { sent: boolean };
  }

  getCreatedEntityIds() {
    return [...this.createdEntityIds];
  }

  getCreatedPropertyIds() {
    return [...this.createdPropertyIds];
  }
}
