export interface EscalationStatusResponse {
  rentCallId: string;
  tier1SentAt: string | null;
  tier1RecipientEmail: string | null;
  tier2SentAt: string | null;
  tier3SentAt: string | null;
  registeredMailTrackingId: string | null;
  registeredMailProvider: string | null;
  registeredMailCostCents: number | null;
  registeredMailDispatchedAt: string | null;
  registeredMailStatus: string | null;
  registeredMailProofUrl: string | null;
}
