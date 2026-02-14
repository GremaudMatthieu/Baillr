import { Injectable } from '@nestjs/common';
import {
  TransactionData,
  RentCallCandidate,
  MatchProposal,
  AmbiguousMatch,
  UnmatchedTransaction,
  MatchingResult,
  ConfidenceLevel,
} from './matching.types.js';

const AMOUNT_WEIGHT = 0.5;
const NAME_WEIGHT = 0.35;
const REFERENCE_WEIGHT = 0.15;

const HIGH_THRESHOLD = 0.8;
const MEDIUM_THRESHOLD = 0.5;
const LOW_THRESHOLD = 0.3;

@Injectable()
export class PaymentMatchingService {
  match(
    transactions: TransactionData[],
    rentCalls: RentCallCandidate[],
    excludedRentCallIds: Set<string> = new Set(),
  ): MatchingResult {
    const availableRentCalls = rentCalls.filter(
      (rc) => !excludedRentCallIds.has(rc.id),
    );
    const claimedRentCallIds = new Set<string>();

    const matches: MatchProposal[] = [];
    const ambiguous: AmbiguousMatch[] = [];
    const unmatched: UnmatchedTransaction[] = [];

    for (const transaction of transactions) {
      const scored = this.scoreTransaction(transaction, availableRentCalls, claimedRentCallIds);

      if (scored.length === 0) {
        unmatched.push({
          transactionId: transaction.id,
          transaction,
        });
        continue;
      }

      if (scored.length === 1) {
        const best = scored[0];
        claimedRentCallIds.add(best.rentCallId);
        matches.push({
          transactionId: transaction.id,
          rentCallId: best.rentCallId,
          confidence: best.confidence,
          score: best.score,
          transaction,
          rentCall: best.rentCall,
        });
        continue;
      }

      // Multiple candidates above threshold → ambiguous
      ambiguous.push({
        transactionId: transaction.id,
        confidence: scored[0].confidence,
        score: scored[0].score,
        transaction,
        candidates: scored.map((s) => ({
          rentCallId: s.rentCallId,
          score: s.score,
          confidence: s.confidence,
          rentCall: s.rentCall,
        })),
      });
    }

    return {
      matches,
      ambiguous,
      unmatched,
      summary: {
        matched: matches.length,
        unmatched: unmatched.length,
        ambiguous: ambiguous.length,
        rentCallCount: availableRentCalls.length,
      },
    };
  }

  private scoreTransaction(
    transaction: TransactionData,
    rentCalls: RentCallCandidate[],
    claimedIds: Set<string>,
  ): Array<{
    rentCallId: string;
    score: number;
    confidence: ConfidenceLevel;
    rentCall: RentCallCandidate;
  }> {
    const scored: Array<{
      rentCallId: string;
      score: number;
      confidence: ConfidenceLevel;
      rentCall: RentCallCandidate;
    }> = [];

    for (const rentCall of rentCalls) {
      if (claimedIds.has(rentCall.id)) continue;

      const rawAmountScore = this.scoreAmount(
        Math.abs(transaction.amountCents),
        rentCall.totalAmountCents,
      );
      // Penalize negative (refund) transactions — should not match rent calls with high confidence
      const amountScore = transaction.amountCents < 0 ? rawAmountScore * 0.5 : rawAmountScore;
      const nameScore = this.scoreName(
        transaction.payerName,
        rentCall.tenantFirstName,
        rentCall.tenantLastName,
        rentCall.companyName,
      );
      const referenceScore = this.scoreReference(
        transaction.reference,
        rentCall,
      );

      const composite =
        amountScore * AMOUNT_WEIGHT +
        nameScore * NAME_WEIGHT +
        referenceScore * REFERENCE_WEIGHT;

      if (composite >= LOW_THRESHOLD) {
        scored.push({
          rentCallId: rentCall.id,
          score: Math.round(composite * 100) / 100,
          confidence: this.toConfidence(composite),
          rentCall,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    // If top score is clearly better than second (gap > 0.15), return only the best
    if (scored.length >= 2 && scored[0].score - scored[1].score > 0.15) {
      return [scored[0]];
    }

    return scored;
  }

  scoreAmount(transactionCents: number, rentCallCents: number): number {
    if (rentCallCents === 0) return 0;
    if (transactionCents === rentCallCents) return 1.0;

    const ratio = transactionCents / rentCallCents;
    const diff = Math.abs(1 - ratio);

    if (diff <= 0.05) return 0.6;
    if (diff <= 0.2) return 0.3;
    return 0;
  }

  scoreName(
    payerName: string | null,
    firstName: string | null,
    lastName: string | null,
    companyName: string | null,
  ): number {
    if (!payerName) return 0;

    const normalizedPayer = this.normalizeName(payerName);
    if (!normalizedPayer) return 0;

    const candidates: string[] = [];

    if (lastName) {
      candidates.push(this.normalizeName(lastName));
      if (firstName) {
        candidates.push(
          this.normalizeName(`${firstName} ${lastName}`),
        );
        candidates.push(
          this.normalizeName(`${lastName} ${firstName}`),
        );
      }
    }
    if (companyName) {
      candidates.push(this.normalizeName(companyName));
    }

    let bestScore = 0;

    for (const candidate of candidates) {
      if (!candidate) continue;

      // Exact match
      if (normalizedPayer === candidate) return 1.0;

      let candidateScore = 0;

      // Substring containment (bank labels include VIR/PRLV prefix + LOYER suffix around the name)
      if (candidate.length >= 4 && normalizedPayer.includes(candidate)) {
        candidateScore = Math.max(candidateScore, 0.8);
      }
      if (normalizedPayer.length >= 4 && candidate.includes(normalizedPayer)) {
        candidateScore = Math.max(candidateScore, 0.8);
      }

      // Prefix match (bank truncation)
      if (
        normalizedPayer.startsWith(candidate) ||
        candidate.startsWith(normalizedPayer)
      ) {
        const minLen = Math.min(normalizedPayer.length, candidate.length);
        const maxLen = Math.max(normalizedPayer.length, candidate.length);
        candidateScore = Math.max(candidateScore, minLen / maxLen);
      }

      // Levenshtein distance (always computed, take best)
      const distance = this.levenshtein(normalizedPayer, candidate);
      const maxLen = Math.max(normalizedPayer.length, candidate.length);
      const similarity = maxLen === 0 ? 0 : 1 - distance / maxLen;
      candidateScore = Math.max(candidateScore, similarity);

      bestScore = Math.max(bestScore, candidateScore);
    }

    return Math.round(bestScore * 100) / 100;
  }

  scoreReference(
    reference: string | null,
    rentCall: RentCallCandidate,
  ): number {
    if (!reference) return 0;

    const normalizedRef = this.normalizeName(reference);
    if (!normalizedRef) return 0;

    const searchTerms: string[] = [];

    if (rentCall.unitIdentifier) {
      searchTerms.push(this.normalizeName(rentCall.unitIdentifier));
    }
    if (rentCall.tenantLastName) {
      searchTerms.push(this.normalizeName(rentCall.tenantLastName));
    }
    if (rentCall.companyName) {
      searchTerms.push(this.normalizeName(rentCall.companyName));
    }
    // Short fragments of lease ID (first 8 chars)
    if (rentCall.leaseId && rentCall.leaseId.length >= 8) {
      searchTerms.push(rentCall.leaseId.substring(0, 8).toLowerCase());
    }

    for (const term of searchTerms) {
      if (!term) continue;
      if (normalizedRef.includes(term)) return 1.0;
    }

    return 0;
  }

  normalizeName(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;

    if (m === 0) return n;
    if (n === 0) return m;

    const dp: number[][] = Array.from({ length: m + 1 }, () =>
      Array(n + 1).fill(0),
    );

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }

    return dp[m][n];
  }

  private toConfidence(score: number): ConfidenceLevel {
    if (score >= HIGH_THRESHOLD) return 'high';
    if (score >= MEDIUM_THRESHOLD) return 'medium';
    return 'low';
  }
}
