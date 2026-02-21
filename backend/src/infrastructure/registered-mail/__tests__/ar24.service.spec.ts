import { Ar24Service } from '../ar24.service.js';
import * as crypto from '../ar24-crypto.util.js';

// Mock the crypto utility to avoid real encryption in service tests
jest.mock('../ar24-crypto.util.js', () => ({
  generateAr24Signature: jest.fn().mockReturnValue('mock-signature'),
  decryptAr24Response: jest.fn(),
  formatAr24Date: jest.fn().mockReturnValue('2026-02-21 14:30:00'),
}));

const mockDecrypt = crypto.decryptAr24Response as jest.MockedFunction<
  typeof crypto.decryptAr24Response
>;

describe('Ar24Service', () => {
  let service: Ar24Service;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.AR24_TOKEN = 'test-token';
    process.env.AR24_PRIVATE_KEY = 'test-private-key';
    process.env.AR24_USER_ID = 'test-user-id';
    process.env.AR24_BASE_URL = 'https://sandbox.ar24.fr/api';

    service = new Ar24Service();
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    delete process.env.AR24_TOKEN;
    delete process.env.AR24_PRIVATE_KEY;
    delete process.env.AR24_USER_ID;
    delete process.env.AR24_BASE_URL;
  });

  describe('isAvailable', () => {
    it('should return true when all credentials are set', () => {
      expect(service.isAvailable).toBe(true);
    });

    it('should return false when token is missing', () => {
      delete process.env.AR24_TOKEN;
      const unconfigured = new Ar24Service();
      expect(unconfigured.isAvailable).toBe(false);
    });

    it('should return false when private key is missing', () => {
      delete process.env.AR24_PRIVATE_KEY;
      const unconfigured = new Ar24Service();
      expect(unconfigured.isAvailable).toBe(false);
    });

    it('should return false when user ID is missing', () => {
      delete process.env.AR24_USER_ID;
      const unconfigured = new Ar24Service();
      expect(unconfigured.isAvailable).toBe(false);
    });
  });

  describe('uploadAttachment', () => {
    it('should upload a PDF and return the file ID', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: async () => 'encrypted-response',
      });
      mockDecrypt.mockReturnValueOnce(
        JSON.stringify({ result: { id: 'file-123' } }),
      );

      const pdfBuffer = Buffer.from('fake-pdf-content');
      const result = await service.uploadAttachment(pdfBuffer, 'notice.pdf');

      expect(result.fileId).toBe('file-123');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://sandbox.ar24.fr/api/attachment');
      expect(options.method).toBe('POST');
      expect(options.headers.signature).toBe('mock-signature');
      expect(options.body).toBeInstanceOf(FormData);
    });

    it('should throw on API error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      });

      await expect(
        service.uploadAttachment(Buffer.from('pdf'), 'test.pdf'),
      ).rejects.toThrow('AR24 upload failed: 400 Bad request');
    });
  });

  describe('sendLetter', () => {
    const baseParams = {
      recipientFirstName: 'Jean',
      recipientLastName: 'Dupont',
      recipientEmail: 'jean@example.com',
      recipientAddress1: '10 rue de la Paix',
      recipientCity: 'Paris',
      recipientPostalCode: '75002',
      attachmentIds: ['file-123'],
      senderFirstName: 'Pierre',
      senderLastName: 'Martin',
    };

    it('should send a letter and return tracking info', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: async () => 'encrypted-response',
      });
      mockDecrypt.mockReturnValueOnce(
        JSON.stringify({
          result: {
            id: 'mail-456',
            tracking: 'LRE-2026-001',
            status: 'waiting',
          },
        }),
      );

      const result = await service.sendLetter(baseParams);

      expect(result.mailId).toBe('mail-456');
      expect(result.trackingNumber).toBe('LRE-2026-001');
      expect(result.status).toBe('waiting');

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://sandbox.ar24.fr/api/mail');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(options.body as string);
      expect(body.token).toBe('test-token');
      expect(body.id_user).toBe('test-user-id');
      expect(body.eidas).toBe(1);
      expect(body.to_firstname).toBe('Jean');
      expect(body.to_lastname).toBe('Dupont');
      expect(body.to_email).toBe('jean@example.com');
      expect(body.to_country).toBe('FR');
      expect(body['attachment[]']).toEqual(['file-123']);
    });

    it('should include optional company fields', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: async () => 'encrypted-response',
      });
      mockDecrypt.mockReturnValueOnce(
        JSON.stringify({
          result: { id: 'mail-789', tracking: 'LRE-2026-002', status: 'waiting' },
        }),
      );

      await service.sendLetter({
        ...baseParams,
        recipientCompany: 'SARL Dupont',
        recipientAddress2: 'Bat A',
        senderCompany: 'SCI Martin',
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
      expect(body.to_company).toBe('SARL Dupont');
      expect(body.to_address2).toBe('Bat A');
      expect(body.custom_from_company).toBe('SCI Martin');
    });

    it('should throw on API error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => 'Validation error',
      });

      await expect(service.sendLetter(baseParams)).rejects.toThrow(
        'AR24 send letter failed: 422 Validation error',
      );
    });
  });

  describe('getStatus', () => {
    it('should fetch status for a mail ID', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: async () => 'encrypted-response',
      });
      mockDecrypt.mockReturnValueOnce(
        JSON.stringify({
          result: {
            id: 'mail-456',
            status: 'AR',
            proof_url: 'https://ar24.fr/proof/456',
          },
        }),
      );

      const result = await service.getStatus('mail-456');

      expect(result.mailId).toBe('mail-456');
      expect(result.status).toBe('AR');
      expect(result.proofUrl).toBe('https://ar24.fr/proof/456');

      const [url] = fetchSpy.mock.calls[0];
      expect(url).toContain('https://sandbox.ar24.fr/api/mail/mail-456');
      expect(url).toContain('token=test-token');
      expect(url).toContain('id_user=test-user-id');
    });

    it('should throw on API error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      await expect(service.getStatus('mail-999')).rejects.toThrow(
        'AR24 get status failed: 404 Not found',
      );
    });
  });

  describe('getCost', () => {
    it('should return static LRE pricing', () => {
      const cost = service.getCost();

      expect(cost.costCentsHt).toBe(399);
      expect(cost.costCentsTtc).toBe(479);
    });
  });
});
