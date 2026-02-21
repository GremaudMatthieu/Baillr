import { Event } from 'nestjs-cqrx';

export interface RegisteredMailStatusUpdatedData {
  rentCallId: string;
  status: string;
  proofUrl: string | null;
  updatedAt: string;
}

export class RegisteredMailStatusUpdated extends Event<RegisteredMailStatusUpdatedData> {
  constructor(data: RegisteredMailStatusUpdatedData) {
    super(data);
  }
}
