import { EmailService } from '../email.service.js';
import type { SendEmailOptions } from '../send-email-options.interface.js';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: 'test-id' });
    service = new EmailService();
  });

  it('should send an email with attachment', async () => {
    const pdfBuffer = Buffer.from('fake-pdf-content');
    const options: SendEmailOptions = {
      to: 'tenant@example.com',
      subject: "Avis d'échéance — Février 2026",
      html: '<p>Test email body</p>',
      attachments: [{ filename: 'appel-loyer.pdf', content: pdfBuffer }],
    };

    await service.sendWithAttachment(options);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'noreply@baillr.fr',
      to: 'tenant@example.com',
      subject: "Avis d'échéance — Février 2026",
      html: '<p>Test email body</p>',
      attachments: [
        {
          filename: 'appel-loyer.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  });

  it('should handle SMTP errors', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));

    const options: SendEmailOptions = {
      to: 'tenant@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    };

    await expect(service.sendWithAttachment(options)).rejects.toThrow(
      'SMTP connection refused',
    );
  });

  it('should throw when recipient is missing', async () => {
    const options: SendEmailOptions = {
      to: '',
      subject: 'Test',
      html: '<p>Test</p>',
    };

    await expect(service.sendWithAttachment(options)).rejects.toThrow(
      'Recipient email address is required',
    );
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should throw when subject is missing', async () => {
    const options: SendEmailOptions = {
      to: 'test@example.com',
      subject: '',
      html: '<p>Test</p>',
    };

    await expect(service.sendWithAttachment(options)).rejects.toThrow(
      'Email subject is required',
    );
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should expose defaultFrom via from getter', () => {
    expect(service.from).toBe('noreply@baillr.fr');
  });

  it('should use configured from address', async () => {
    const options: SendEmailOptions = {
      to: 'tenant@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      from: 'custom@example.com',
    };

    await service.sendWithAttachment(options);

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'custom@example.com' }),
    );
  });
});
