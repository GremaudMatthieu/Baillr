import { Injectable, Logger } from '@nestjs/common';

export interface BridgeBank {
  id: number;
  name: string;
  country_code: string;
  logo_url: string | null;
}

/** Raw provider shape from Bridge API /v3/providers */
interface BridgeProviderRaw {
  id: number;
  name: string;
  country_code: string;
  images: { logo: string } | null;
  capabilities: string[];
}

export interface BridgeConnectSession {
  id: string;
  url: string;
}

export interface BridgeItem {
  id: number;
  status: number;
  status_code_info: string | null;
  provider_id: number;
  authentication_expires_at: string | null;
}

export interface BridgeAccount {
  id: number;
  name: string;
  balance: number;
  currency_code: string;
  iban: string | null;
  type: string;
  item_id: number;
}

export interface BridgeTransaction {
  id: number;
  clean_description: string;
  provider_description: string;
  amount: number;
  date: string;
  booking_date: string | null;
  currency_code: string;
  deleted: boolean;
  account_id: number;
  category_id: number | null;
  operation_type: string | null;
}

export interface BridgePaginatedResponse<T> {
  resources: T[];
  pagination: { next_uri: string | null };
}

interface TokenCacheEntry {
  accessToken: string;
  expiresAt: number;
}

@Injectable()
export class BridgeService {
  private readonly logger = new Logger(BridgeService.name);
  private readonly baseUrl = 'https://api.bridgeapi.io';
  private readonly bridgeVersion = '2025-01-15';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tokenCache = new Map<string, TokenCacheEntry>();
  private readonly userCreated = new Set<string>();

  constructor() {
    this.clientId = process.env.BRIDGE_CLIENT_ID ?? '';
    this.clientSecret = process.env.BRIDGE_CLIENT_SECRET ?? '';
  }

  get isAvailable(): boolean {
    return this.clientId !== '' && this.clientSecret !== '';
  }

  private get headers(): Record<string, string> {
    return {
      'Client-Id': this.clientId,
      'Client-Secret': this.clientSecret,
      'Bridge-Version': this.bridgeVersion,
      'Content-Type': 'application/json',
    };
  }

  private userHeaders(accessToken: string): Record<string, string> {
    return {
      ...this.headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }

  // ─── User management ──────────────────────────────────────────

  /**
   * Ensures a Bridge user exists and returns an access token for user-scoped API calls.
   * Tokens are cached in-memory (valid 2 hours on Bridge side).
   */
  async getUserToken(entityId: string): Promise<string> {
    const externalId = `entity-${entityId}`;

    // Return cached token if still valid (with 1-minute safety buffer)
    const cached = this.tokenCache.get(externalId);
    if (cached && cached.expiresAt > Date.now() + 60_000) {
      return cached.accessToken;
    }

    // Ensure user exists (idempotent — 409 means already created)
    if (!this.userCreated.has(externalId)) {
      await this.createUser(externalId);
      this.userCreated.add(externalId);
    }

    // Fetch fresh access token
    const response = await fetch(
      `${this.baseUrl}/v3/aggregation/authorization/token`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ external_user_id: externalId }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${body}`);
    }

    const data = (await response.json()) as { access_token: string };

    this.tokenCache.set(externalId, {
      accessToken: data.access_token,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
    });

    return data.access_token;
  }

  private async createUser(externalUserId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v3/aggregation/users`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ external_user_id: externalUserId }),
    });

    // 409 Conflict = user already exists, which is fine (idempotent)
    if (!response.ok && response.status !== 409) {
      const body = await response.text();
      throw new Error(`Failed to create Bridge user: ${response.status} ${body}`);
    }
  }

  // ─── Public catalog endpoints (no user auth needed) ───────────

  async getBanks(country?: string): Promise<BridgeBank[]> {
    const allBanks: BridgeBank[] = [];
    let nextUri: string | null = null;

    const url = new URL(`${this.baseUrl}/v3/providers`);
    if (country) {
      url.searchParams.set('country', country);
    }
    url.searchParams.set('limit', '500');

    let currentUrl = url.toString();
    do {
      const response = await fetch(currentUrl, { headers: this.headers });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to fetch providers: ${response.status} ${body}`);
      }

      const data =
        (await response.json()) as BridgePaginatedResponse<BridgeProviderRaw>;

      // Filter for aggregation-capable providers and map to internal shape
      const mapped = data.resources
        .filter((p) => p.capabilities.includes('aggregation'))
        .map(this.mapProvider);

      allBanks.push(...mapped);
      nextUri = data.pagination.next_uri;
      if (nextUri) {
        currentUrl = `${this.baseUrl}${nextUri}`;
      }
    } while (nextUri);

    return allBanks;
  }

  async getBank(bankId: number): Promise<BridgeBank> {
    const response = await fetch(`${this.baseUrl}/v3/providers/${bankId}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to get provider: ${response.status} ${body}`);
    }

    const raw = (await response.json()) as BridgeProviderRaw;
    return this.mapProvider(raw);
  }

  private mapProvider(raw: BridgeProviderRaw): BridgeBank {
    return {
      id: raw.id,
      name: raw.name,
      country_code: raw.country_code,
      logo_url: raw.images?.logo ?? null,
    };
  }

  // ─── User-scoped endpoints (Bearer token required) ────────────

  async createConnectSession(
    entityId: string,
    callbackUrl: string,
    prefillBankId?: number,
  ): Promise<BridgeConnectSession> {
    const token = await this.getUserToken(entityId);

    const userEmail = `entity-${entityId}@app.baillr.fr`;
    const body: Record<string, unknown> = {
      user_email: userEmail,
      callback_url: callbackUrl,
      country_code: 'fr',
    };
    if (prefillBankId) {
      body.provider_id = prefillBankId;
    }

    const response = await fetch(
      `${this.baseUrl}/v3/aggregation/connect-sessions`,
      {
        method: 'POST',
        headers: this.userHeaders(token),
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `Failed to create connect session: ${response.status} ${responseBody}`,
      );
    }

    return (await response.json()) as BridgeConnectSession;
  }

  async getItems(entityId: string): Promise<BridgeItem[]> {
    const token = await this.getUserToken(entityId);

    const url = new URL(`${this.baseUrl}/v3/aggregation/items`);
    url.searchParams.set('limit', '100');

    const response = await fetch(url.toString(), {
      headers: this.userHeaders(token),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to list items: ${response.status} ${body}`);
    }

    const data = (await response.json()) as BridgePaginatedResponse<BridgeItem>;
    return data.resources;
  }

  async getItem(itemId: number, entityId: string): Promise<BridgeItem> {
    const token = await this.getUserToken(entityId);

    const response = await fetch(
      `${this.baseUrl}/v3/aggregation/items/${itemId}`,
      { headers: this.userHeaders(token) },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to get item: ${response.status} ${body}`);
    }

    return (await response.json()) as BridgeItem;
  }

  async getAccounts(
    itemId: number,
    entityId: string,
  ): Promise<BridgeAccount[]> {
    const token = await this.getUserToken(entityId);

    const url = new URL(`${this.baseUrl}/v3/aggregation/accounts`);
    url.searchParams.set('item_id', String(itemId));
    url.searchParams.set('limit', '100');

    const response = await fetch(url.toString(), {
      headers: this.userHeaders(token),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to list accounts: ${response.status} ${body}`);
    }

    const data = (await response.json()) as BridgePaginatedResponse<BridgeAccount>;
    return data.resources;
  }

  async getTransactions(
    accountId: number,
    entityId: string,
    since?: string,
    until?: string,
  ): Promise<BridgeTransaction[]> {
    const token = await this.getUserToken(entityId);

    const allTransactions: BridgeTransaction[] = [];
    let nextUri: string | null = null;

    const url = new URL(`${this.baseUrl}/v3/aggregation/transactions`);
    url.searchParams.set('account_id', String(accountId));
    url.searchParams.set('limit', '500');
    if (since) {
      url.searchParams.set('since', since);
    }
    if (until) {
      url.searchParams.set('until', until);
    }

    // Paginate through all results
    let currentUrl = url.toString();
    do {
      const response = await fetch(currentUrl, {
        headers: this.userHeaders(token),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Failed to get transactions: ${response.status} ${body}`,
        );
      }

      const data =
        (await response.json()) as BridgePaginatedResponse<BridgeTransaction>;
      allTransactions.push(...data.resources.filter((t) => !t.deleted));
      nextUri = data.pagination.next_uri;
      if (nextUri) {
        currentUrl = `${this.baseUrl}${nextUri}`;
      }
    } while (nextUri);

    return allTransactions;
  }

  async deleteItem(itemId: number, entityId: string): Promise<void> {
    const token = await this.getUserToken(entityId);

    const response = await fetch(
      `${this.baseUrl}/v3/aggregation/items/${itemId}`,
      {
        method: 'DELETE',
        headers: this.userHeaders(token),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(
        `Failed to delete item ${itemId}: ${response.status} ${body}`,
      );
      throw new Error(`Failed to delete Bridge item ${itemId}: ${response.status} ${body}`);
    }
  }
}
