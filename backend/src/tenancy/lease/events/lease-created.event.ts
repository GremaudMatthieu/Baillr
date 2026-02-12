import { Event } from 'nestjs-cqrx';

export interface LeaseCreatedData {
  id: string;
  entityId: string;
  userId: string;
  tenantId: string;
  unitId: string;
  startDate: string;
  rentAmountCents: number;
  securityDepositCents: number;
  monthlyDueDate: number;
  revisionIndexType: string;
}

export class LeaseCreated extends Event<LeaseCreatedData> {
  constructor(data: LeaseCreatedData) {
    super(data);
  }
}
