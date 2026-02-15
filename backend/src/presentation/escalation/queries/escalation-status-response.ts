export interface EscalationStatusResponse {
  rentCallId: string;
  tier1SentAt: string | null;
  tier1RecipientEmail: string | null;
  tier2SentAt: string | null;
  tier3SentAt: string | null;
}
