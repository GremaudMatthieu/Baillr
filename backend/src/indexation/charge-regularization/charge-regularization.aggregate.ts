import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import {
  ChargeRegularizationCalculated,
  type ChargeRegularizationCalculatedData,
} from './events/charge-regularization-calculated.event.js';
import {
  ChargeRegularizationApplied,
} from './events/charge-regularization-applied.event.js';
import {
  ChargeRegularizationSent,
} from './events/charge-regularization-sent.event.js';
import {
  ChargeRegularizationSettled,
} from './events/charge-regularization-settled.event.js';
import type { StatementPrimitives } from './regularization-statement.js';
import { FiscalYear } from '@indexation/annual-charges/fiscal-year.js';

export class ChargeRegularizationAggregate extends AggregateRoot {
  static readonly streamName = 'charge-regularization';

  private calculated = false;
  private appliedAt: string | null = null;
  private sentAt: string | null = null;
  private settledAt: string | null = null;
  private statements: StatementPrimitives[] = [];
  private totalBalanceCents = 0;

  calculate(
    entityId: string,
    userId: string,
    fiscalYear: number,
    statements: StatementPrimitives[],
  ): void {
    FiscalYear.create(fiscalYear);

    const totalBalanceCents = statements.reduce(
      (sum, s) => sum + s.balanceCents,
      0,
    );

    // No-op guard: skip if data is identical to current state
    if (this.calculated && this.isSameData(statements, totalBalanceCents)) {
      return;
    }

    this.apply(
      new ChargeRegularizationCalculated({
        chargeRegularizationId: this.id,
        entityId,
        userId,
        fiscalYear,
        statements,
        totalBalanceCents,
        calculatedAt: new Date().toISOString(),
      }),
    );
  }

  private isSameData(
    statements: StatementPrimitives[],
    totalBalanceCents: number,
  ): boolean {
    if (this.totalBalanceCents !== totalBalanceCents) return false;
    if (this.statements.length !== statements.length) return false;
    return this.statements.every(
      (existing, i) =>
        existing.leaseId === statements[i].leaseId &&
        existing.totalShareCents === statements[i].totalShareCents &&
        existing.totalProvisionsPaidCents ===
          statements[i].totalProvisionsPaidCents &&
        existing.balanceCents === statements[i].balanceCents &&
        existing.occupiedDays === statements[i].occupiedDays &&
        existing.charges.length === statements[i].charges.length &&
        existing.charges.every(
          (c, j) =>
            c.chargeCategoryId === statements[i].charges[j].chargeCategoryId &&
            c.tenantShareCents === statements[i].charges[j].tenantShareCents,
        ),
    );
  }

  applyRegularization(entityId: string, userId: string, fiscalYear: number): void {
    // Guard: cannot apply if not yet calculated
    if (!this.calculated) {
      return;
    }

    // No-op guard: skip if already applied
    if (this.appliedAt) {
      return;
    }

    this.apply(
      new ChargeRegularizationApplied({
        chargeRegularizationId: this.id,
        entityId,
        userId,
        fiscalYear,
        statements: this.statements,
        appliedAt: new Date().toISOString(),
      }),
    );
  }

  @EventHandler(ChargeRegularizationCalculated)
  onChargeRegularizationCalculated(
    event: ChargeRegularizationCalculated,
  ): void {
    this.calculated = true;
    this.statements = event.data.statements;
    this.totalBalanceCents = event.data.totalBalanceCents;
  }

  @EventHandler(ChargeRegularizationApplied)
  onChargeRegularizationApplied(
    event: ChargeRegularizationApplied,
  ): void {
    this.appliedAt = event.data.appliedAt;
  }

  markAsSent(
    entityId: string,
    userId: string,
    fiscalYear: number,
    sentCount: number,
  ): void {
    // Guard: cannot send if not yet calculated
    if (!this.calculated) {
      return;
    }

    // No-op guard: skip if already sent
    if (this.sentAt) {
      return;
    }

    this.apply(
      new ChargeRegularizationSent({
        chargeRegularizationId: this.id,
        entityId,
        userId,
        fiscalYear,
        sentCount,
        sentAt: new Date().toISOString(),
      }),
    );
  }

  @EventHandler(ChargeRegularizationSent)
  onChargeRegularizationSent(
    event: ChargeRegularizationSent,
  ): void {
    this.sentAt = event.data.sentAt;
  }

  markAsSettled(
    entityId: string,
    userId: string,
    fiscalYear: number,
  ): void {
    // Guard: cannot settle if not yet applied
    if (!this.appliedAt) {
      return;
    }

    // No-op guard: skip if already settled
    if (this.settledAt) {
      return;
    }

    this.apply(
      new ChargeRegularizationSettled({
        chargeRegularizationId: this.id,
        entityId,
        userId,
        fiscalYear,
        settledAt: new Date().toISOString(),
      }),
    );
  }

  @EventHandler(ChargeRegularizationSettled)
  onChargeRegularizationSettled(
    event: ChargeRegularizationSettled,
  ): void {
    this.settledAt = event.data.settledAt;
  }
}
