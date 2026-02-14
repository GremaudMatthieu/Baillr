import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { RentRevisionCalculated } from './events/rent-revision-calculated.event.js';
import { IndexCalculatorService } from './services/index-calculator.service.js';

export class RevisionAggregate extends AggregateRoot {
  static readonly streamName = 'revision';
  private calculated = false;

  calculateRevision(
    leaseId: string,
    entityId: string,
    userId: string,
    tenantId: string,
    unitId: string,
    tenantName: string,
    unitLabel: string,
    currentRentCents: number,
    baseIndexValue: number,
    baseIndexQuarter: string,
    newIndexValue: number,
    newIndexQuarter: string,
    newIndexYear: number,
    revisionIndexType: string,
    calculator: IndexCalculatorService,
  ): void {
    if (this.calculated) return; // no-op guard

    const newRentCents = calculator.calculate(
      currentRentCents,
      newIndexValue,
      baseIndexValue,
    );

    this.apply(
      new RentRevisionCalculated({
        revisionId: this.id,
        leaseId,
        entityId,
        userId,
        tenantId,
        unitId,
        tenantName,
        unitLabel,
        currentRentCents,
        newRentCents,
        differenceCents: newRentCents - currentRentCents,
        baseIndexValue,
        baseIndexQuarter,
        newIndexValue,
        newIndexQuarter,
        newIndexYear,
        revisionIndexType,
        calculatedAt: new Date().toISOString(),
      }),
    );
  }

  @EventHandler(RentRevisionCalculated)
  onRentRevisionCalculated(event: RentRevisionCalculated): void {
    this.calculated = true;
    void event;
  }
}
