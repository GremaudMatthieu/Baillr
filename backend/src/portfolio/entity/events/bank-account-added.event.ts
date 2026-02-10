import { Event } from 'nestjs-cqrx';

export interface BankAccountAddedData {
  id: string;
  entityId: string;
  accountId: string;
  type: 'bank_account' | 'cash_register';
  label: string;
  iban: string | null;
  bic: string | null;
  bankName: string | null;
  isDefault: boolean;
}

export class BankAccountAdded extends Event<BankAccountAddedData> {
  constructor(data: BankAccountAddedData) {
    super(data);
  }
}
