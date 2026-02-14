export class ConfigureLatePaymentDelayCommand {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly days: number,
  ) {}
}
