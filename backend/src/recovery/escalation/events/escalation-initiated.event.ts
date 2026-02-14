import { Event } from 'nestjs-cqrx';

export interface EscalationInitiatedData {
  rentCallId: string;
  entityId: string;
  tenantId: string;
}

export class EscalationInitiated extends Event<EscalationInitiatedData> {
  constructor(data: EscalationInitiatedData) {
    super(data);
  }
}
