import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { RentRevisionCalculated } from './events/rent-revision-calculated.event.js';
import { RevisionApproved } from './events/revision-approved.event.js';
import { IndexCalculatorService } from './services/index-calculator.service.js';
import { RevisionNotCalculatedException } from './exceptions/revision-not-calculated.exception.js';
import { RevisionAlreadyApprovedException } from './exceptions/revision-already-approved.exception.js';

export class RevisionAggregate extends AggregateRoot {
  static readonly streamName = 'revision';
  private calculated = false;
  private approved = false;
  private leaseId!: string;
  private entityId!: string;
  private currentRentCents!: number;
  private newRentCents!: number;
  private newIndexValue!: number;
  private newIndexQuarter!: string;
  private newIndexYear!: number;

  get revisionLeaseId(): string {
    return this.leaseId;
  }

  get revisionEntityId(): string {
    return this.entityId;
  }

  get revisionNewRentCents(): number {
    return this.newRentCents;
  }

  get revisionCurrentRentCents(): number {
    return this.currentRentCents;
  }

  get revisionNewIndexValue(): number {
    return this.newIndexValue;
  }

  get revisionNewIndexQuarter(): string {
    return this.newIndexQuarter;
  }

  get revisionNewIndexYear(): number {
    return this.newIndexYear;
  }

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
    baseIndexYear: number,
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
        baseIndexYear,
        newIndexValue,
        newIndexQuarter,
        newIndexYear,
        revisionIndexType,
        calculatedAt: new Date().toISOString(),
      }),
    );
  }

  approve(userId: string): void {
    if (!this.calculated) {
      throw RevisionNotCalculatedException.create();
    }
    if (this.approved) {
      throw RevisionAlreadyApprovedException.create();
    }

    this.apply(
      new RevisionApproved({
        revisionId: this.id,
        leaseId: this.leaseId,
        entityId: this.entityId,
        userId,
        newRentCents: this.newRentCents,
        previousRentCents: this.currentRentCents,
        newIndexValue: this.newIndexValue,
        newIndexQuarter: this.newIndexQuarter,
        newIndexYear: this.newIndexYear,
        approvedAt: new Date().toISOString(),
      }),
    );
  }

  @EventHandler(RentRevisionCalculated)
  onRentRevisionCalculated(event: RentRevisionCalculated): void {
    this.calculated = true;
    this.leaseId = event.data.leaseId;
    this.entityId = event.data.entityId;
    this.currentRentCents = event.data.currentRentCents;
    this.newRentCents = event.data.newRentCents;
    this.newIndexValue = event.data.newIndexValue;
    this.newIndexQuarter = event.data.newIndexQuarter;
    this.newIndexYear = event.data.newIndexYear;
  }

  @EventHandler(RevisionApproved)
  onRevisionApproved(_event: RevisionApproved): void {
    this.approved = true;
  }
}
