import {
  Controller,
  Post,
  Param,
  Query,
  ParseUUIDPipe,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { BankStatementFinder } from '../finders/bank-statement.finder.js';
import { RentCallFinder } from '../../rent-call/finders/rent-call.finder.js';
import { PaymentMatchingService } from '@billing/payment-matching/domain/service/payment-matching.service';
import type {
  TransactionData,
  RentCallCandidate,
  MatchingResult,
} from '@billing/payment-matching/domain/service/matching.types';

@Controller('entities/:entityId/bank-statements/:bankStatementId')
export class MatchPaymentsController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly bankStatementFinder: BankStatementFinder,
    private readonly rentCallFinder: RentCallFinder,
    private readonly matchingService: PaymentMatchingService,
  ) {}

  @Post('match')
  async handle(
    @CurrentUser() userId: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('bankStatementId', ParseUUIDPipe) bankStatementId: string,
    @Query('month') month: string,
  ): Promise<MatchingResult> {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }

    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    // Load data via finders (presentation layer orchestration)
    const transactions = await this.bankStatementFinder.findTransactions(
      bankStatementId,
      entityId,
      userId,
    );

    const rentCalls =
      await this.rentCallFinder.findAllWithRelationsByEntityAndMonth(
        entityId,
        userId,
        month,
      );

    // Map to domain types
    const transactionData: TransactionData[] = transactions.map((tx) => ({
      id: tx.id,
      date:
        tx.date instanceof Date
          ? tx.date.toISOString().split('T')[0]
          : String(tx.date),
      amountCents: tx.amountCents,
      payerName: tx.payerName,
      reference: tx.reference,
    }));

    const rentCallCandidates: RentCallCandidate[] = rentCalls.map((rc) => ({
      id: rc.id,
      tenantFirstName: rc.tenant?.firstName ?? null,
      tenantLastName: rc.tenant?.lastName ?? null,
      companyName: rc.tenant?.companyName ?? null,
      unitIdentifier: rc.unit?.identifier ?? '',
      leaseId: rc.leaseId,
      totalAmountCents: rc.totalAmountCents,
      month: rc.month,
    }));

    // For now, no excluded rent call IDs (Story 5.3 will add payment tracking)
    const excludedRentCallIds = new Set<string>();

    return this.matchingService.match(
      transactionData,
      rentCallCandidates,
      excludedRentCallIds,
    );
  }
}
