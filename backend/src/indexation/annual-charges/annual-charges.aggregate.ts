import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import {
  AnnualChargesRecorded,
  type AnnualChargesRecordedData,
} from './events/annual-charges-recorded.event.js';
import { ChargeEntry, type ChargeEntryPrimitives } from './charge-entry.js';
import { FiscalYear } from './fiscal-year.js';

export class AnnualChargesAggregate extends AggregateRoot {
  static readonly streamName = 'annual-charges';

  private recorded = false;
  private charges: ChargeEntryPrimitives[] = [];
  private totalAmountCents = 0;

  record(
    entityId: string,
    userId: string,
    fiscalYear: number,
    charges: ChargeEntryPrimitives[],
  ): void {
    // Validate VOs
    FiscalYear.create(fiscalYear);
    const entries = charges.map((c) => ChargeEntry.fromPrimitives(c));
    const totalAmountCents = entries.reduce(
      (sum, e) => sum + e.amountCents,
      0,
    );

    const chargesPrimitives = entries.map((e) => e.toPrimitives());

    // No-op guard: skip if data is identical to current state
    if (this.recorded && this.isSameData(chargesPrimitives, totalAmountCents)) {
      return;
    }

    this.apply(
      new AnnualChargesRecorded({
        annualChargesId: this.id,
        entityId,
        userId,
        fiscalYear,
        charges: chargesPrimitives,
        totalAmountCents,
        recordedAt: new Date().toISOString(),
      }),
    );
  }

  private isSameData(
    charges: ChargeEntryPrimitives[],
    totalAmountCents: number,
  ): boolean {
    if (this.totalAmountCents !== totalAmountCents) return false;
    if (this.charges.length !== charges.length) return false;
    return this.charges.every(
      (existing, i) =>
        existing.chargeCategoryId === charges[i].chargeCategoryId &&
        existing.label === charges[i].label &&
        existing.amountCents === charges[i].amountCents,
    );
  }

  @EventHandler(AnnualChargesRecorded)
  onAnnualChargesRecorded(event: AnnualChargesRecorded): void {
    this.recorded = true;
    this.charges = event.data.charges;
    this.totalAmountCents = event.data.totalAmountCents;
  }
}
