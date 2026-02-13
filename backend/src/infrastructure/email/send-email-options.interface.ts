export interface SendEmailOptions {
  to: string;
  bcc?: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
  from?: string;
}
