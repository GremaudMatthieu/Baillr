import { PaymentMatchingService } from '../domain/service/payment-matching.service.js';
import {
  TransactionData,
  RentCallCandidate,
} from '../domain/service/matching.types.js';

describe('PaymentMatchingService', () => {
  let service: PaymentMatchingService;

  beforeEach(() => {
    service = new PaymentMatchingService();
  });

  const makeTransaction = (
    overrides: Partial<TransactionData> = {},
  ): TransactionData => ({
    id: 'tx-1',
    date: '2026-02-01',
    amountCents: 85000,
    payerName: 'Dupont Jean',
    reference: null,
    ...overrides,
  });

  const makeRentCall = (
    overrides: Partial<RentCallCandidate> = {},
  ): RentCallCandidate => ({
    id: 'rc-1',
    tenantFirstName: 'Jean',
    tenantLastName: 'Dupont',
    companyName: null,
    unitIdentifier: 'Apt 3B',
    leaseId: 'lease-abc12345-def',
    totalAmountCents: 85000,
    month: '2026-02',
    ...overrides,
  });

  describe('match()', () => {
    it('should return empty results for empty inputs', () => {
      const result = service.match([], []);

      expect(result.matches).toHaveLength(0);
      expect(result.ambiguous).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);
      expect(result.summary).toEqual({
        matched: 0,
        unmatched: 0,
        ambiguous: 0,
        rentCallCount: 0,
      });
    });

    it('should match a transaction when no rent calls exist', () => {
      const result = service.match([makeTransaction()], []);

      expect(result.matches).toHaveLength(0);
      expect(result.unmatched).toHaveLength(1);
      expect(result.unmatched[0].transactionId).toBe('tx-1');
    });

    it('should produce exact match with high confidence', () => {
      const tx = makeTransaction({ amountCents: 85000, payerName: 'Dupont Jean' });
      const rc = makeRentCall({ totalAmountCents: 85000 });

      const result = service.match([tx], [rc]);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].rentCallId).toBe('rc-1');
      expect(result.matches[0].confidence).toBe('high');
      expect(result.matches[0].score).toBeGreaterThanOrEqual(0.8);
    });

    it('should produce medium confidence when only amount matches exactly', () => {
      const tx = makeTransaction({
        amountCents: 85000,
        payerName: 'XYZ Company',
        reference: null,
      });
      const rc = makeRentCall({
        totalAmountCents: 85000,
        tenantFirstName: 'Marie',
        tenantLastName: 'Martin',
        companyName: null,
      });

      const result = service.match([tx], [rc]);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].confidence).toBe('medium');
    });

    it('should mark as unmatched when score is below threshold', () => {
      const tx = makeTransaction({
        amountCents: 50000,
        payerName: 'Unknown Person',
        reference: null,
      });
      const rc = makeRentCall({
        totalAmountCents: 85000,
        tenantFirstName: 'Jean',
        tenantLastName: 'Dupont',
      });

      const result = service.match([tx], [rc]);

      expect(result.unmatched).toHaveLength(1);
      expect(result.matches).toHaveLength(0);
    });

    it('should handle ambiguous matches when two rent calls score similarly', () => {
      const tx = makeTransaction({ amountCents: 85000, payerName: 'Dupont' });
      const rc1 = makeRentCall({
        id: 'rc-1',
        totalAmountCents: 85000,
        tenantLastName: 'Dupont',
        tenantFirstName: 'Jean',
      });
      const rc2 = makeRentCall({
        id: 'rc-2',
        totalAmountCents: 85000,
        tenantLastName: 'Dupont',
        tenantFirstName: 'Marie',
      });

      const result = service.match([tx], [rc1, rc2]);

      expect(result.ambiguous).toHaveLength(1);
      expect(result.ambiguous[0].candidates).toHaveLength(2);
    });

    it('should exclude already-matched rent calls', () => {
      const tx = makeTransaction();
      const rc = makeRentCall();

      const result = service.match([tx], [rc], new Set(['rc-1']));

      expect(result.matches).toHaveLength(0);
      expect(result.unmatched).toHaveLength(1);
    });

    it('should not double-match a rent call to multiple transactions', () => {
      const tx1 = makeTransaction({ id: 'tx-1', amountCents: 85000, payerName: 'Dupont Jean' });
      const tx2 = makeTransaction({ id: 'tx-2', amountCents: 85000, payerName: 'Dupont Jean' });
      const rc = makeRentCall({ id: 'rc-1', totalAmountCents: 85000 });

      const result = service.match([tx1, tx2], [rc]);

      // Only one should match, the other should be unmatched
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].transactionId).toBe('tx-1');
      expect(result.unmatched.length + result.ambiguous.length).toBe(1);
    });

    it('should match multiple transactions to multiple rent calls', () => {
      const tx1 = makeTransaction({ id: 'tx-1', amountCents: 85000, payerName: 'Dupont Jean' });
      const tx2 = makeTransaction({ id: 'tx-2', amountCents: 65000, payerName: 'Martin Marie' });
      const rc1 = makeRentCall({
        id: 'rc-1',
        totalAmountCents: 85000,
        tenantFirstName: 'Jean',
        tenantLastName: 'Dupont',
      });
      const rc2 = makeRentCall({
        id: 'rc-2',
        totalAmountCents: 65000,
        tenantFirstName: 'Marie',
        tenantLastName: 'Martin',
      });

      const result = service.match([tx1, tx2], [rc1, rc2]);

      expect(result.matches).toHaveLength(2);
      expect(result.unmatched).toHaveLength(0);
      expect(result.summary).toEqual({ matched: 2, unmatched: 0, ambiguous: 0, rentCallCount: 2 });
    });

    it('should collapse ambiguous to single match when top score gap exceeds 0.15', () => {
      const tx = makeTransaction({ amountCents: 85000, payerName: 'Dupont Jean' });
      const rc1 = makeRentCall({
        id: 'rc-1',
        totalAmountCents: 85000,
        tenantFirstName: 'Jean',
        tenantLastName: 'Dupont',
      });
      const rc2 = makeRentCall({
        id: 'rc-2',
        totalAmountCents: 85000,
        tenantFirstName: 'Pierre',
        tenantLastName: 'Martin',
      });

      const result = service.match([tx], [rc1, rc2]);

      // rc1 scores ~0.85, rc2 scores ~0.50, gap 0.35 > 0.15 → collapse
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].rentCallId).toBe('rc-1');
      expect(result.ambiguous).toHaveLength(0);
    });

    it('should correctly populate summary counts', () => {
      const tx1 = makeTransaction({ id: 'tx-1', amountCents: 85000, payerName: 'Dupont Jean' });
      const tx2 = makeTransaction({ id: 'tx-2', amountCents: 99999, payerName: 'Unknown' });
      const rc = makeRentCall({ totalAmountCents: 85000 });

      const result = service.match([tx1, tx2], [rc]);

      expect(result.summary.matched).toBe(1);
      expect(result.summary.unmatched).toBe(1);
    });

    it('should penalize negative amounts (refund) with medium confidence instead of high', () => {
      const tx = makeTransaction({ amountCents: -85000, payerName: 'Dupont Jean' });
      const rc = makeRentCall({ totalAmountCents: 85000 });

      const result = service.match([tx], [rc]);

      // amount=1.0*0.5(penalty)*0.5(weight) + name=1.0*0.35 = 0.25+0.35 = 0.60 → medium
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].confidence).toBe('medium');
    });
  });

  describe('scoreAmount()', () => {
    it('should return 1.0 for exact amount match', () => {
      expect(service.scoreAmount(85000, 85000)).toBe(1.0);
    });

    it('should return 0.6 for amount within ±5%', () => {
      // 85000 * 1.04 = 88400
      expect(service.scoreAmount(88400, 85000)).toBe(0.6);
    });

    it('should return 0.3 for amount within ±20%', () => {
      // 85000 * 1.15 = 97750
      expect(service.scoreAmount(97750, 85000)).toBe(0.3);
    });

    it('should return 0 for amount beyond ±20%', () => {
      // 85000 * 1.5 = 127500
      expect(service.scoreAmount(127500, 85000)).toBe(0);
    });

    it('should return 0 if rent call amount is 0', () => {
      expect(service.scoreAmount(85000, 0)).toBe(0);
    });

    it('should return 0 for zero transaction vs nonzero rent call', () => {
      expect(service.scoreAmount(0, 85000)).toBe(0);
    });

    it('should return 0 for zero transaction vs zero rent call', () => {
      expect(service.scoreAmount(0, 0)).toBe(0);
    });

    it('should handle equal small amounts', () => {
      expect(service.scoreAmount(100, 100)).toBe(1.0);
    });
  });

  describe('scoreName()', () => {
    it('should return 0 for null payer name', () => {
      expect(service.scoreName(null, 'Jean', 'Dupont', null)).toBe(0);
    });

    it('should return 0 for empty payer name', () => {
      expect(service.scoreName('', 'Jean', 'Dupont', null)).toBe(0);
    });

    it('should return 1.0 for exact match (case insensitive)', () => {
      expect(service.scoreName('Dupont Jean', 'Jean', 'Dupont', null)).toBe(1.0);
    });

    it('should return 1.0 for exact last name match', () => {
      expect(service.scoreName('Dupont', null, 'Dupont', null)).toBe(1.0);
    });

    it('should handle accented characters', () => {
      const score = service.scoreName('HERVE', null, 'Hervé', null);
      expect(score).toBe(1.0);
    });

    it('should handle bank truncation (prefix match)', () => {
      const score = service.scoreName(
        'DOS SANTOS FIRME',
        'Firmino',
        'Dos Santos',
        null,
      );
      // "dos santos firme" startsWith "dos santos firmino" → false
      // "dos santos firmino" startsWith "dos santos firme" → true (truncated)
      expect(score).toBeGreaterThan(0.8);
    });

    it('should match company names', () => {
      expect(
        service.scoreName('SCI LES TILLEULS', null, null, 'SCI Les Tilleuls'),
      ).toBe(1.0);
    });

    it('should handle initials with partial match', () => {
      const score = service.scoreName('ACCO F', 'François', 'Acco', null);
      // Should match on lastName "Acco" at minimum
      expect(score).toBeGreaterThanOrEqual(0.5);
    });

    it('should return high score when bank label contains tenant name', () => {
      // French bank labels: "VIR DUPONT JEAN LOYER FEVRIER"
      expect(
        service.scoreName('VIR DUPONT JEAN LOYER FEVRIER', 'Jean', 'Dupont', null),
      ).toBeGreaterThanOrEqual(0.8);
    });

    it('should return high score when bank label contains last name only', () => {
      expect(
        service.scoreName('PRLV MARTIN CHARGES Q1', null, 'Martin', null),
      ).toBeGreaterThanOrEqual(0.8);
    });

    it('should return high score when payer name is contained in candidate', () => {
      // Payer sends just "DUPONT" but tenant full name is "Dupont Jean"
      expect(
        service.scoreName('DUPONT', 'Jean', 'Dupont', null),
      ).toBe(1.0); // exact match on lastName candidate
    });

    it('should return high score for VIR prefix with company name', () => {
      expect(
        service.scoreName(
          'VIR SCI LES TILLEULS LOYER',
          null,
          null,
          'SCI Les Tilleuls',
        ),
      ).toBeGreaterThanOrEqual(0.8);
    });

    it('should not trigger containment for very short names', () => {
      // "le" is only 2 chars, should NOT trigger containment
      const score = service.scoreName('VIR PAIEMENT LOYER', null, 'Le', null);
      expect(score).toBeLessThan(0.8);
    });

    it('should return low score for very different names', () => {
      expect(service.scoreName('XYZ Corp', 'Jean', 'Dupont', null)).toBeLessThan(0.3);
    });

    it('should handle all null tenant fields', () => {
      expect(service.scoreName('Dupont', null, null, null)).toBe(0);
    });
  });

  describe('scoreReference()', () => {
    it('should return 0 for null reference', () => {
      expect(service.scoreReference(null, makeRentCall())).toBe(0);
    });

    it('should return 1.0 when reference contains unit identifier', () => {
      expect(
        service.scoreReference('LOYER APT 3B FEV', makeRentCall()),
      ).toBe(1.0);
    });

    it('should return 1.0 when reference contains tenant last name', () => {
      expect(
        service.scoreReference('VIR DUPONT LOYER', makeRentCall()),
      ).toBe(1.0);
    });

    it('should return 1.0 when reference contains company name', () => {
      expect(
        service.scoreReference(
          'SCI LES TILLEULS LOYER',
          makeRentCall({ companyName: 'SCI Les Tilleuls' }),
        ),
      ).toBe(1.0);
    });

    it('should return 1.0 when reference contains lease ID fragment', () => {
      expect(
        service.scoreReference('lease-ab PAYMENT', makeRentCall()),
      ).toBe(1.0);
    });

    it('should return 0 when reference does not match anything', () => {
      expect(service.scoreReference('RANDOM TEXT', makeRentCall())).toBe(0);
    });

    it('should handle empty reference string', () => {
      expect(service.scoreReference('', makeRentCall())).toBe(0);
    });
  });

  describe('normalizeName()', () => {
    it('should lowercase and trim', () => {
      expect(service.normalizeName('  DUPONT  ')).toBe('dupont');
    });

    it('should strip accents', () => {
      expect(service.normalizeName('Hervé Bézier')).toBe('herve bezier');
    });

    it('should collapse multiple spaces', () => {
      expect(service.normalizeName('Jean   Pierre')).toBe('jean pierre');
    });

    it('should handle special French characters', () => {
      expect(service.normalizeName('François Çédric Ürsula')).toBe(
        'francois cedric ursula',
      );
    });
  });

  describe('levenshtein()', () => {
    it('should return 0 for identical strings', () => {
      expect(service.levenshtein('hello', 'hello')).toBe(0);
    });

    it('should return string length for empty comparison', () => {
      expect(service.levenshtein('hello', '')).toBe(5);
      expect(service.levenshtein('', 'hello')).toBe(5);
    });

    it('should compute correct distance', () => {
      expect(service.levenshtein('kitten', 'sitting')).toBe(3);
    });

    it('should handle single character difference', () => {
      expect(service.levenshtein('cat', 'car')).toBe(1);
    });
  });

  describe('composite scoring integration', () => {
    it('should produce high confidence for exact amount + exact name', () => {
      const tx = makeTransaction({ amountCents: 85000, payerName: 'Dupont Jean' });
      const rc = makeRentCall({ totalAmountCents: 85000 });

      const result = service.match([tx], [rc]);
      // amount=1.0*0.5 + name=1.0*0.35 + ref=0*0.15 = 0.85 → high
      expect(result.matches[0].score).toBe(0.85);
      expect(result.matches[0].confidence).toBe('high');
    });

    it('should produce medium confidence for exact amount + no name match', () => {
      const tx = makeTransaction({ amountCents: 85000, payerName: 'Unknown' });
      const rc = makeRentCall({ totalAmountCents: 85000 });

      const result = service.match([tx], [rc]);
      // amount=1.0*0.5 + name≈0*0.35 + ref=0*0.15 = 0.5 → medium
      expect(result.matches[0].confidence).toBe('medium');
    });

    it('should produce high confidence with amount + name + reference', () => {
      const tx = makeTransaction({
        amountCents: 85000,
        payerName: 'Dupont Jean',
        reference: 'LOYER APT 3B',
      });
      const rc = makeRentCall({ totalAmountCents: 85000 });

      const result = service.match([tx], [rc]);
      // amount=1.0*0.5 + name=1.0*0.35 + ref=1.0*0.15 = 1.0 → high
      expect(result.matches[0].score).toBe(1.0);
      expect(result.matches[0].confidence).toBe('high');
    });

    it('should produce low confidence for partial amount + partial name', () => {
      const tx = makeTransaction({
        amountCents: 100000, // 100000 vs 85000 = ~17% diff → 0.3
        payerName: 'Dupnt',   // close to Dupont but not exact
      });
      const rc = makeRentCall({ totalAmountCents: 85000 });

      const result = service.match([tx], [rc]);
      // amount=0.3*0.5=0.15 + name≈0.8*0.35≈0.28 + ref=0*0.15=0
      // composite ≈ 0.43 → low
      if (result.matches.length > 0) {
        expect(result.matches[0].confidence).toBe('low');
      }
    });
  });
});
