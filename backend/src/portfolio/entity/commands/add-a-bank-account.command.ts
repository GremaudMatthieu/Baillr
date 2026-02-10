export class AddABankAccountCommand {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly accountId: string,
    public readonly type: 'bank_account' | 'cash_register',
    public readonly label: string,
    public readonly iban: string | null,
    public readonly bic: string | null,
    public readonly bankName: string | null,
    public readonly isDefault: boolean,
  ) {}
}
