import { Injectable, Logger } from '@nestjs/common';
import {
  generateAr24Signature,
  decryptAr24Response,
  formatAr24Date,
} from './ar24-crypto.util.js';

export interface Ar24SendLetterResult {
  mailId: string;
  trackingNumber: string;
  status: string;
}

export interface Ar24UploadResult {
  fileId: string;
}

export interface Ar24StatusResult {
  mailId: string;
  status: string;
  proofUrl: string | null;
}

export interface Ar24CostResult {
  costCentsHt: number;
  costCentsTtc: number;
}

@Injectable()
export class Ar24Service {
  private readonly logger = new Logger(Ar24Service.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly privateKey: string;
  private readonly userId: string;

  constructor() {
    this.baseUrl = process.env.AR24_BASE_URL ?? 'https://sandbox.ar24.fr/api';
    this.token = process.env.AR24_TOKEN ?? '';
    this.privateKey = process.env.AR24_PRIVATE_KEY ?? '';
    this.userId = process.env.AR24_USER_ID ?? '';
  }

  get isAvailable(): boolean {
    return this.token !== '' && this.privateKey !== '' && this.userId !== '';
  }

  /**
   * Upload a PDF attachment to AR24.
   * Returns the file_id to reference in sendLetter().
   */
  async uploadAttachment(pdfBuffer: Buffer, filename: string): Promise<Ar24UploadResult> {
    const { date, signature } = this.createAuth();

    const formData = new FormData();
    formData.append('token', this.token);
    formData.append('id_user', this.userId);
    formData.append('date', date);
    formData.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), filename);

    const response = await fetch(`${this.baseUrl}/attachment`, {
      method: 'POST',
      headers: { signature },
      body: formData,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`AR24 upload failed: ${response.status} ${body}`);
    }

    const encryptedBody = await response.text();
    const decrypted = decryptAr24Response(this.privateKey, encryptedBody);
    const data = JSON.parse(decrypted) as { result: { id: string } };

    this.logger.log(`AR24 attachment uploaded: ${data.result.id}`);
    return { fileId: data.result.id };
  }

  /**
   * Send a registered letter (LRE) via AR24.
   * Requires a previously uploaded attachment file_id.
   */
  async sendLetter(params: {
    recipientFirstName: string;
    recipientLastName: string;
    recipientCompany?: string;
    recipientEmail: string;
    recipientAddress1: string;
    recipientAddress2?: string;
    recipientCity: string;
    recipientPostalCode: string;
    recipientCountry?: string;
    attachmentIds: string[];
    senderFirstName: string;
    senderLastName: string;
    senderCompany?: string;
  }): Promise<Ar24SendLetterResult> {
    const { date, signature } = this.createAuth();

    const body: Record<string, unknown> = {
      token: this.token,
      id_user: this.userId,
      date,
      eidas: 1, // eIDAS-qualified registered letter
      to_firstname: params.recipientFirstName,
      to_lastname: params.recipientLastName,
      to_email: params.recipientEmail,
      to_address1: params.recipientAddress1,
      to_city: params.recipientCity,
      to_zipcode: params.recipientPostalCode,
      to_country: params.recipientCountry ?? 'FR',
      'attachment[]': params.attachmentIds,
      custom_from_firstname: params.senderFirstName,
      custom_from_lastname: params.senderLastName,
    };

    if (params.recipientCompany) {
      body.to_company = params.recipientCompany;
    }
    if (params.recipientAddress2) {
      body.to_address2 = params.recipientAddress2;
    }
    if (params.senderCompany) {
      body.custom_from_company = params.senderCompany;
    }

    const response = await fetch(`${this.baseUrl}/mail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        signature,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(`AR24 send letter failed: ${response.status} ${responseBody}`);
    }

    const encryptedBody = await response.text();
    const decrypted = decryptAr24Response(this.privateKey, encryptedBody);
    const data = JSON.parse(decrypted) as {
      result: { id: string; tracking: string; status: string };
    };

    this.logger.log(`AR24 letter sent: mailId=${data.result.id}, tracking=${data.result.tracking}`);
    return {
      mailId: data.result.id,
      trackingNumber: data.result.tracking,
      status: data.result.status,
    };
  }

  /**
   * Get the status of a previously sent registered letter.
   */
  async getStatus(mailId: string): Promise<Ar24StatusResult> {
    const { date, signature } = this.createAuth();

    const url = new URL(`${this.baseUrl}/mail/${mailId}`);
    url.searchParams.set('token', this.token);
    url.searchParams.set('id_user', this.userId);
    url.searchParams.set('date', date);

    const response = await fetch(url.toString(), {
      headers: { signature },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`AR24 get status failed: ${response.status} ${body}`);
    }

    const encryptedBody = await response.text();
    const decrypted = decryptAr24Response(this.privateKey, encryptedBody);
    const data = JSON.parse(decrypted) as {
      result: { id: string; status: string; proof_url: string | null };
    };

    return {
      mailId: data.result.id,
      status: data.result.status,
      proofUrl: data.result.proof_url,
    };
  }

  /**
   * Get the cost of sending a registered letter.
   * Returns static pricing (3.99 EUR HT for LRE with eIDAS).
   */
  getCost(): Ar24CostResult {
    // AR24 LRE pricing (eIDAS-qualified): 3.99 EUR HT, 20% VAT = 4.79 EUR TTC
    // Source: https://www.ar24.fr/tarifs/ — last verified 2026-02-21
    // TODO: Replace with live API pricing endpoint when AR24 provides one
    return {
      costCentsHt: 399,
      costCentsTtc: 479,
    };
  }

  private createAuth(): { date: string; signature: string } {
    const date = formatAr24Date();
    const signature = generateAr24Signature(this.privateKey, date);
    return { date, signature };
  }
}
