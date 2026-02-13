import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import type { SendEmailOptions } from './send-email-options.interface.js';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly defaultFrom: string;

  constructor() {
    this.transporter = createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    this.defaultFrom = process.env.SMTP_FROM ?? 'noreply@baillr.fr';
  }

  get from(): string {
    return this.defaultFrom;
  }

  async sendWithAttachment(options: SendEmailOptions): Promise<void> {
    if (!options.to) {
      throw new Error('Recipient email address is required');
    }
    if (!options.subject) {
      throw new Error('Email subject is required');
    }

    const from = options.from ?? this.defaultFrom;

    await this.transporter.sendMail({
      from,
      to: options.to,
      bcc: options.bcc,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType ?? 'application/pdf',
      })),
    });

    this.logger.log(`Email sent to ${options.to}: "${options.subject}"`);
  }
}
