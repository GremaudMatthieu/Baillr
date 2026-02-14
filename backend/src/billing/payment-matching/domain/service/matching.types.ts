export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface TransactionData {
  id: string;
  date: string;
  amountCents: number;
  payerName: string | null;
  reference: string | null;
}

export interface RentCallCandidate {
  id: string;
  tenantFirstName: string | null;
  tenantLastName: string | null;
  companyName: string | null;
  unitIdentifier: string;
  leaseId: string;
  totalAmountCents: number;
  month: string;
}

export interface MatchProposal {
  transactionId: string;
  rentCallId: string;
  confidence: ConfidenceLevel;
  score: number;
  transaction: TransactionData;
  rentCall: RentCallCandidate;
}

export interface AmbiguousMatch {
  transactionId: string;
  confidence: ConfidenceLevel;
  score: number;
  transaction: TransactionData;
  candidates: Array<{
    rentCallId: string;
    score: number;
    confidence: ConfidenceLevel;
    rentCall: RentCallCandidate;
  }>;
}

export interface UnmatchedTransaction {
  transactionId: string;
  transaction: TransactionData;
}

export interface MatchingSummary {
  matched: number;
  unmatched: number;
  ambiguous: number;
  rentCallCount: number;
}

export interface MatchingResult {
  matches: MatchProposal[];
  ambiguous: AmbiguousMatch[];
  unmatched: UnmatchedTransaction[];
  summary: MatchingSummary;
}
