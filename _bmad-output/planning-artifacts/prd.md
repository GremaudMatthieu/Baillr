---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
workflowCompleted: true
completedAt: '2026-02-08'
inputDocuments: ['_bmad-output/brainstorming/brainstorming-session-2026-02-08.md']
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: 'saas_b2b'
  domain: 'proptech_rental_management'
  complexity: 'medium-high'
  projectContext: 'greenfield'
  domainConcerns: 'French rental law (loi ALUR), IRL indexation, SCI accounting, GDPR tenant data, event sourcing architecture'
---

# Product Requirements Document - Baillr

**Author:** Monsieur
**Date:** 2026-02-08

## Executive Summary

Baillr is a SaaS web application for French property managers (bailleurs) managing rental properties through SCIs (Sociétés Civiles Immobilières) or personal ownership. It replaces the current fragmented workflow of specialized software (Emjysoft Gestion Locative) combined with Excel spreadsheets with a single, simple, fully automated solution.

**Target users:** Individual property managers handling 1-50 rental units across one or more ownership entities (SCI or personal name).

**Core differentiator:** Radical simplicity powered by full automation. The property manager supervises; the software executes. Monthly management drops from ~2 hours to ~15 minutes.

**Technical foundation:** Event-sourced architecture (Next.js frontend, NestJS backend) where the accounting ledger IS the event store - not a technical choice imposed on the domain, but the natural digital translation of how property accounting already works.

## Success Criteria

### User Success

- Property manager completes full monthly cycle (rent calls, payment matching, receipts) in under 15 minutes for a portfolio of 10 units
- New user creates their first property, unit, tenant, and lease within 10 minutes without documentation
- All documents (rent calls, receipts, IRL revision letters, reminders) generate automatically with zero manual formatting
- Single application replaces both Emjysoft and Excel entirely - no secondary tool needed
- Bank statement import + automatic payment matching reduces manual reconciliation to validate-and-click

### Business Success

- Deferred to post-product phase. Current focus: build a complete, reliable, simple product that solves the problem fully
- Initial validation: the product must satisfy the creator's own SCI management needs (dogfooding)

### Technical Success

- Event-sourced architecture correctly models all 27 domain events with full auditability
- Ledger projections (tenant balance, annual charges, account book) calculate accurately from events with zero stored state
- PDF document generation produces output identical in structure to existing real-world documents (quittances, rent calls, IRL letters analyzed during brainstorming)
- Bank statement Excel import parses and matches payments with >90% automatic match rate
- IRL index calculation matches INSEE reference values exactly

### Measurable Outcomes

- Time to complete monthly cycle: <15 min (vs ~2h current)
- Document accuracy: 100% match with legal requirements (correct IRL formula, proper legal mentions)
- Payment matching accuracy: >90% automatic, remaining resolved in <3 clicks
- Zero data loss: event store guarantees full audit trail and recoverability

## Product Scope

### Full Product

1. Multi-entity management (SCI + nom propre)
2. Properties, units, tenants, leases with configurable templates
3. Monthly rent calls (auto-generation + batch email send)
4. Bank statement import + payment matching
5. Receipts auto-generation after payment
6. 3-tier reminder process (email, registered mail, stakeholder notification)
7. IRL/ILC/ICC annual revision (auto-calculation from INSEE)
8. Annual charges regularization with water meter support
9. Account book (event-sourced ledger) with export
10. Dashboard (health pulse, action feed, treasury chart, timeline)
11. Email alerts to property manager
12. Tenant insurance tracking
13. PDF generation for all document types
14. Open Banking API integration for bank statement import
15. AR24/Maileva integration for registered mail from interface
16. Mobile responsive adaptation
17. Multi-user access (accountant read-only view)
18. Automated INSEE index retrieval (IRL/ILC/ICC)

### Future Vision

- AI-powered anomaly detection on payment patterns
- Predictive cash flow forecasting
- Tax declaration 2072 pre-fill assistance
- Tenant portal for document access
- Marketplace integrations (insurance, diagnostics)

## User Journeys

### Journey 1: Alain - First Setup (Onboarding)

**Persona:** Alain, 52, manages SCI SIRIUS WAT. 2 buildings, 10 apartments, 3 parking spots in Montauban. Uses Emjysoft + Excel for 8 years. Spends 2 hours every Saturday morning on property management.

**Opening Scene:** Alain creates his Baillr account. Empty dashboard displays "Start by creating your first ownership entity." He clicks, enters "SCI SIRIUS WAT", SIRET, address, adds two bank accounts (Banque Postale + BNP) and cash register.

**Rising Action:** Creates first property (52 rue de la Résistance, Montauban), then units: Apt 102, Apt 302, Parking Roosevelt. For each unit, configures available options (boiler yes/no, parking yes/no). Registers tenants: Delbos/Dos Santos Firme for Apt 102 (individuals), Acco for Apt 302. Creates leases in 3 clicks: selects tenant, unit, enters rent (630€), reference IRL (Q2 2024: 145.17), security deposit, due date (5th of month), IRL revision date. Billing lines auto-configure: rent + charge provisions 64.10€ + boiler maintenance 9.33€.

**Climax:** Clicks "Generate rent calls." 10 rent calls generated in 2 seconds with correct amounts, IBANs, legal mentions. Clicks "Send all" - 10 emails with PDF attachments sent. Checks watch: 8 minutes elapsed. Usually he'd barely be on his 3rd call in Emjysoft.

**Resolution:** Dashboard comes alive. 10 units in orange "awaiting payment." Action feed shows "Bank statement to import." For the first time, everything is in one place. No more Excel.

**Capabilities:** Entity creation, property/unit setup, tenant registration, lease creation with configurable billing lines and configurable IRL revision date, batch rent call generation, batch email sending, dashboard initialization.

---

### Journey 2: Alain - Monthly Cycle (Happy Path)

**Opening Scene:** First Saturday of the month. Dashboard shows: 8 green units (paid), 1 orange (pending), 1 red (late). Collection rate: 90%. Action feed: "1 receipt pending send, 1 reminder to trigger, February bank statement not imported."

**Rising Action:** Alain downloads Banque Postale CSV from bank website. Imports into Baillr. System parses lines and proposes: "Transfer 709.98€ from DOS SANTOS FIRME → Rent call Apt 102 January?" - automatic match. "Transfer 986.33€ from ACCO F. → Rent call Apt 302 January?" - automatic match. Validates each match with one click. 8 payments matched in 30 seconds.

**Climax:** Receipts generate instantly. Clicks "Send all receipts" - 8 emails sent. For the late unit (Apt 201, Mme Dupont), system already detected the delay and proposes: "Send simple reminder by email?" - one click, done. Imports BNP statement. 2 more matches. Total: 12 minutes for the entire month.

**Resolution:** Dashboard all green except Apt 201 (orange - reminded). Alain closes Baillr. Saturday morning is free. Action feed will remind him in 10 days if Mme Dupont still hasn't paid.

**Capabilities:** Dashboard health view, bank statement import (CSV/Excel), automatic payment matching, one-click validation, batch receipt generation, batch email, late payment detection, automated reminder trigger, action feed updates.

---

### Journey 3: Alain - Unpaid Rent Management (Edge Case)

**Opening Scene:** Alain receives email alert from Baillr: "Unpaid rent detected - Apt 201, Mme Dupont. Simple reminder sent 15/01, no payment received." It's January 26th. Tier 2 threshold reached.

**Rising Action:** Opens Baillr. Action feed: "Formal notice recommended for Apt 201 - Mme Dupont [Generate]." Clicks. System generates formal notice with all legal mentions, amount owed details, lease references. Alain reviews, clicks "Send as registered mail." PDF ready for postal dispatch.

**Climax:** 10 business days later, still nothing. Baillr triggers tier 3 and proposes: "Unpaid notification - Generate letters for: rent insurance, lawyer, guarantor?" Alain confirms. Three personalized letters generated with correct recipients and references. Meanwhile, Mme Dupont's current account clearly shows cumulative debit balance.

**Resolution:** Mme Dupont eventually pays 500€. Baillr records partial payment, generates a payment receipt (not a full receipt - legally distinct), displays remaining balance of 209.98€. Unit stays orange on dashboard until full payment. Eventually she pays the remainder - full receipt auto-generates.

**Capabilities:** Email alerts, configurable 3-tier reminder escalation, formal notice generation, registered mail support, multi-stakeholder notification (insurance, lawyer, guarantor), partial payment handling, payment receipt vs full receipt distinction, tenant current account balance, status tracking.

---

### Journey 4: Alain - Annual Cycle (IRL Revision + Charges Regularization)

**Opening Scene:** The action feed shows for each lease approaching its IRL revision date: "IRL Revision - New Q2 index available (146.68). 8 leases eligible for revision. [Calculate revisions]." IRL revision dates are configurable per lease - some trigger in December, others at the lease anniversary date.

**Rising Action:** Alain clicks. Baillr calculates automatically for each lease: current rent × (IRL Q2 current year / IRL Q2 previous year). For Apt 102: 630.00 × (146.68/145.17) = 636.55€. He sees the table of all new rents, verifies, clicks "Generate revision letters." 8 formal letters with detailed formula and legal mentions generated. Sends by email.

**Charges Regularization (January):** Action feed reminds: "2025 charges regularization due." Alain enters actual annual charges: water bill (subscription + distribution + wastewater treatment + public organism), common area electricity, TEOM, cleaning/containers. Enters individual water meter readings. Baillr auto-calculates per-tenant statement: actual charges pro-rated by occupancy period - provisions paid = balance. Mme Acco (Apt 302) overpaid by 45€, M. Dupont (Apt 201) owes additional 22€.

**Climax:** Charge statements generated and sent. Account book is up to date. Alain clicks "Export 2025 account book" - clean Excel file exports, ready for his accountant to prepare the 2072 tax declaration.

**Resolution:** Treasury chart on dashboard shows 12 months of green bars (income) and red bars (expenses). Portfolio is profitable. New rents automatically apply to upcoming rent calls. The annual cycle is complete.

**Capabilities:** Configurable IRL revision date per lease, IRL revision automation with INSEE index, revision letter generation, annual charges regularization, water meter readings, pro-rata occupancy calculation, charge statement generation, account book export (Excel), treasury visualization, automatic rent update for future calls.

---

### Journey Requirements Summary

| Journey | Key capabilities revealed |
|---------|-------------------------|
| **Onboarding** | Entity/property/unit/tenant/lease CRUD, configurable billing lines, configurable IRL revision date, template system, batch operations |
| **Monthly cycle** | Bank import, auto-matching, batch receipt generation, batch email, late detection, action feed |
| **Unpaid management** | 3-tier escalation, formal notices, multi-stakeholder letters, partial payments, tenant balance |
| **Annual cycle** | Configurable IRL revision timing, charges regularization, water meters, pro-rata, ledger export, treasury view |

Coverage: These 4 journeys cover 100% of the product scope. Every feature is addressed by at least one journey.

## Domain-Specific Requirements

### Compliance & Regulatory

**French Rental Law (Loi ALUR / Loi du 6 juillet 1989):**
- Mandatory legal mentions on rent receipts (law articles, lease references)
- Rent revision formula strictly regulated: `current_rent × (new_index / previous_index)` — no interpretation margin
- Security deposit return deadline: 1 month (compliant inventory) or 2 months (non-compliant)
- Legal distinction between quittance de loyer (full payment receipt) and reçu de paiement (partial payment receipt)
- Recoverable charges: mandatory annual regularization with supporting documents

**Three Revision Index Types (INSEE):**
- **IRL** (Indice de Référence des Loyers) — residential leases (most common)
- **ILC** (Indice des Loyers Commerciaux) — commercial leases (since 2008)
- **ICC** (Indice du Coût de la Construction) — older commercial leases, still in force on some contracts
- Same calculation formula for all three, only the INSEE reference index differs
- Index type is configurable per lease — the lease determines which index applies, with its reference quarter
- Manual index entry supported, with automated INSEE API retrieval also available
- Validation of entered index (format, plausibility against previous quarters)

**GDPR / Personal Data Protection:**
- Tenant data = personal data (name, address, email, bank details, identity documents)
- Legal basis: contract execution (no explicit consent needed for rental management)
- Right to erasure limited by legal accounting retention obligations
- Retention periods: accounting data 10 years (Code de commerce), lease data for lease duration + statute of limitations

**SCI Accounting:**
- Mandatory account book for SCIs
- Export compatible with 2072 tax declaration preparation
- Full operation traceability (event sourcing natively covers this requirement)

### Technical Constraints

**Event Sourcing:**
- Event immutability: once recorded, an event can never be modified or deleted
- Corrections via compensating events (e.g., `PaymentCancelled` to correct an erroneous `PaymentReceived`)
- Projections recalculable at any time from the event store
- Command idempotency to prevent duplicates (double-click, network retry)

**Financial Calculations:**
- Decimal precision: 2 decimal places for euro amounts, rounded to the cent
- IRL/ILC/ICC formula: result rounded down to the nearest cent (in favor of tenant, case law)
- Pro-rata temporis for charges: calculation to the exact day based on occupancy period

**PDF Generation:**
- Documents conforming to legal templates analyzed (quittances, rent calls, revisions)
- Faithful reproduction of real-world document structure from SCI SIRIUS WAT

### Integration Requirements

**Bank Statement Import:**
- CSV/Excel parsing for Banque Postale and BNP statements (bank-specific formats)
- Matching algorithm: reconciliation by amount + payer name + reference
- Multi-bank + cash register management within the same month

**Email:**
- SMTP sending with PDF attachments (receipts, rent calls, reminders)
- Batch sending with deliverability tracking

**INSEE Indices:**
- Manual entry of IRL, ILC, and ICC indices with automated API retrieval
- Index validation (format, plausibility against previous quarters)

### Risk Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Index calculation error (IRL/ILC/ICC) | Legal - tenant dispute | Exhaustive unit tests + comparison with existing manual calculations |
| Event data loss | Critical - accounting history lost | Event store backups + immutability guaranteed by architecture |
| Non-compliant legal mentions | Legal - invalid receipt | Templates validated against analyzed real-world documents |
| Bank matching error | Financial - wrong allocation | Matching proposed, never auto-validated — human confirms |
| Personal data exposure | GDPR - CNIL sanctions | Entity isolation, encryption at rest, authenticated access |
| Duplicate rent call sent | UX - tenant confusion | Command idempotency + send status per rent call |

## SaaS B2B Specific Requirements

### Tenant Model

- **Tenant = User = Bailleur**: single user type, each account is fully isolated
- **Multi-entity per tenant**: one bailleur manages multiple ownership entities (SCIs + personal name)
- **Data isolation**: logical isolation within shared infrastructure — each ownership entity's event store is fully separated
- **No cross-tenant data sharing**: complete isolation between users
- **No delegation or multi-user**: one account, one person, full control

### Permission Model

- **Primary role**: bailleur — full access to all their entities
- **Secondary role**: read-only accountant scoped to specific entities for 2072 preparation

### Subscription & Billing

- Deferred to post-product phase: no subscription tiers, billing, or pricing initially
- Initial deployment: dogfooding by creator on real SCI management
- Future consideration: likely usage-based (number of units) or flat tiers

### Integration Architecture

| Integration | Capabilities |
|------------|-------------|
| Bank statements | CSV/Excel file import + Open Banking API |
| Email sending | SMTP with PDF attachments |
| INSEE indices (IRL/ILC/ICC) | Manual entry with validation + automated API retrieval |
| Registered mail | PDF generation for postal dispatch + AR24/Maileva API |
| Accounting export | Excel export (livre de comptes) |

### Implementation Considerations

- **Self-service onboarding**: user creates account, immediately starts configuring entities — no approval workflow
- **Desktop-first**: optimized for desktop browser usage with responsive mobile adaptation
- **Batch operations**: core UX pattern — generate all rent calls, send all emails, match all payments in bulk
- **Event store per entity**: each ownership entity has its own event stream, projections computed per entity
- **PDF generation server-side**: documents generated on backend, served as downloadable/emailable attachments

## Development Strategy

### Product Philosophy

**No MVP concept.** Baillr is built as a complete product — all 18 capabilities, all 4 user journeys. Partial automation provides no value over the current manual process. The product value is in replacing the entire workflow.

### Resource & Approach

Solo developer (creator) with no timeline pressure. Quality over speed.

### Risk Mitigation

| Risk | Strategy |
|------|----------|
| **Technical**: Event sourcing with NestJS (first time) | Invest in architecture design first, start with simple bounded context (entity management), validate pattern before complex domains |
| **Market**: Unvalidated product-market fit | Dogfooding — product must satisfy creator's own SCI management needs first |
| **Scope**: Scope creep during development | Strict adherence to 18 defined capabilities, no additions until all ship |

## Functional Requirements

### Ownership & Entity Management

- FR1: Bailleur can create and manage multiple ownership entities (SCI or personal name)
- FR2: Bailleur can configure entity details (name, SIRET, address, legal information)
- FR3: Bailleur can associate multiple bank accounts and a cash register to each entity
- FR4: Bailleur can switch between entities within a single session

### Property & Unit Management

- FR5: Bailleur can create properties under an ownership entity with address and details
- FR6: Bailleur can create units within a property (apartments, parking, commercial spaces)
- FR7: Bailleur can configure unit-level options (boiler, parking, custom billable options)
- FR8: Bailleur can view all units across all properties with their current status

### Tenant Management

- FR9: Bailleur can register tenants (individuals or companies) with contact information
- FR10: Bailleur can track tenant insurance (provider, policy number, renewal date)
- FR11: System alerts bailleur when tenant insurance renewal date is approaching or expired

### Lease Management

- FR12: Bailleur can create a lease linking a tenant to a unit with rent amount, security deposit, due date, and revision index type (IRL/ILC/ICC)
- FR13: Bailleur can configure billing lines per lease (rent, charge provisions, billable options)
- FR14: Bailleur can set a configurable IRL/ILC/ICC revision date per lease
- FR15: Bailleur can set a configurable reference quarter per lease for index revision
- FR16: Bailleur can terminate a lease with an end date
- FR17: System calculates pro-rata amounts when a lease starts or ends mid-period

### Rent Call & Document Generation

- FR18: Bailleur can generate rent calls for all active leases in a single batch operation
- FR19: System generates rent call documents with correct amounts, IBANs, legal mentions, and lease references
- FR20: Bailleur can send all generated rent calls by email with PDF attachments in batch
- FR21: Bailleur can generate receipts (quittances) automatically upon full payment confirmation
- FR22: System generates partial payment receipts (reçus de paiement) distinct from full receipts (quittances)
- FR23: Bailleur can generate IRL/ILC/ICC revision letters with detailed formula and legal mentions
- FR24: Bailleur can generate formal notices (mises en demeure) with all legal mentions and amount details
- FR25: Bailleur can generate stakeholder notification letters (insurance, lawyer, guarantor)
- FR26: Bailleur can generate annual charge regularization statements per tenant
- FR27: All generated documents are available as downloadable PDFs

### Payment & Bank Reconciliation

- FR28: Bailleur can import bank statements (CSV/Excel) from multiple banks
- FR29: System automatically proposes payment-to-rent-call matches based on amount, payer name, and reference
- FR30: Bailleur can validate, reject, or manually assign each proposed match
- FR31: Bailleur can record manual payments (cash, check) not from bank import
- FR32: System handles partial payments, overpayments, and credits on tenant current accounts
- FR33: Bailleur can view tenant current account balance (debits from rent calls, credits from payments)
- FR34: Bailleur can connect to bank accounts via Open Banking API for automatic statement retrieval

### Reminder & Unpaid Management

- FR35: System detects late payments based on configurable delay thresholds
- FR36: System proposes 3-tier escalation actions: email reminder, formal notice (registered mail), stakeholder notification
- FR37: Bailleur can trigger each escalation tier with one click
- FR38: Bailleur can send reminders by email directly from the application
- FR39: Bailleur can generate registered mail documents (PDF for postal dispatch)
- FR40: Bailleur can send registered mail directly via AR24/Maileva integration
- FR41: System tracks escalation status per tenant and per unpaid period

### Index Revision

- FR42: Bailleur can enter INSEE indices (IRL, ILC, ICC) with quarter and year
- FR43: System validates entered indices for format and plausibility
- FR44: System calculates revised rent using the correct formula: `current_rent × (new_index / previous_index)` rounded down to the cent
- FR45: Bailleur can review all pending revisions in a single view and batch-approve
- FR46: Revised rents automatically apply to future rent calls
- FR47: System retrieves INSEE indices automatically (IRL/ILC/ICC)

### Annual Charges Regularization

- FR48: Bailleur can enter actual annual charges by category (water, electricity, TEOM, cleaning, custom)
- FR49: Bailleur can enter individual water meter readings per unit
- FR50: System calculates per-tenant charge statement: actual charges pro-rated by occupancy period minus provisions paid
- FR51: System generates charge regularization documents with detailed breakdown
- FR52: Credits or debits from regularization are applied to tenant current accounts

### Account Book & Export

- FR53: System maintains an event-sourced account book (livre de comptes) per ownership entity
- FR54: Bailleur can view the account book with filters (date range, bank account, operation type)
- FR55: Bailleur can export the account book as Excel, formatted for 2072 tax declaration preparation
- FR56: Every financial operation is recorded as an immutable event with full audit trail

### Dashboard & Monitoring

- FR57: Bailleur can view a dashboard showing unit payment status (paid, pending, late) across all entities
- FR58: Dashboard displays collection rate and key financial indicators
- FR59: Dashboard displays an action feed with pending tasks (receipts to send, reminders to trigger, statements to import)
- FR60: Dashboard displays a treasury chart showing income and expenses over time
- FR61: System sends email alerts to bailleur for critical events (unpaid rent detected, insurance expiring, escalation thresholds reached)

### User Account & Access

- FR62: Bailleur can create an account and start configuring entities immediately (self-service)
- FR63: Bailleur can grant read-only access to an accountant scoped to specific entities
- FR64: Application is accessible on desktop and mobile browsers (responsive)

## Non-Functional Requirements

### Performance

- NFR1: Batch rent call generation completes in under 5 seconds for a portfolio of 50 units
- NFR2: Bank statement import and matching proposals display in under 10 seconds for 200 transaction lines
- NFR3: PDF document generation completes in under 3 seconds per document
- NFR4: Dashboard loads with current status data in under 2 seconds
- NFR5: Account book queries with filters return results in under 3 seconds for 5 years of event history
- NFR6: Batch email sending processes at a rate that handles 50 emails within 60 seconds

### Security

- NFR7: All data encrypted in transit (TLS 1.2+) and at rest
- NFR8: Authentication via secure session management with password hashing (bcrypt or argon2)
- NFR9: Tenant data isolation — no user can access another user's data under any circumstance
- NFR10: GDPR-compliant data handling: data export on request, deletion respecting legal retention periods
- NFR11: No sensitive data (passwords, bank details) logged in application logs
- NFR12: Accountant read-only access cannot modify, create, or delete any data

### Reliability & Data Integrity

- NFR13: Event store guarantees zero data loss — every recorded event is persisted durably before acknowledgment
- NFR14: Events are immutable — no update or delete operations on the event store
- NFR15: Financial calculations produce identical results when replayed from events (deterministic projections)
- NFR16: System recovers from crash without data corruption — event store is the source of truth
- NFR17: Automated daily backups of the event store with point-in-time recovery capability
- NFR18: All financial amounts stored and calculated with 2-decimal precision, no floating-point arithmetic on money

### Maintainability

- NFR19: Codebase follows consistent patterns across all bounded contexts (entity, lease, payment, charges)
- NFR20: Event schema versioning supports forward-compatible evolution without breaking existing events
- NFR21: All business rules (IRL/ILC/ICC formula, pro-rata calculation, charge regularization) covered by unit tests with >95% branch coverage
