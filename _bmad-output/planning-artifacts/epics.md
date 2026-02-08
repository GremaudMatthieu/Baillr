---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md', '_bmad-output/planning-artifacts/ux-design-specification.md']
---

# Baillr - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Baillr, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: Bailleur can create and manage multiple ownership entities (SCI or personal name)
- FR2: Bailleur can configure entity details (name, SIRET, address, legal information)
- FR3: Bailleur can associate multiple bank accounts and a cash register to each entity
- FR4: Bailleur can switch between entities within a single session
- FR5: Bailleur can create properties under an ownership entity with address and details
- FR6: Bailleur can create units within a property (apartments, parking, commercial spaces)
- FR7: Bailleur can configure unit-level options (boiler, parking, custom billable options)
- FR8: Bailleur can view all units across all properties with their current status
- FR9: Bailleur can register tenants (individuals or companies) with contact information
- FR10: Bailleur can track tenant insurance (provider, policy number, renewal date)
- FR11: System alerts bailleur when tenant insurance renewal date is approaching or expired
- FR12: Bailleur can create a lease linking a tenant to a unit with rent amount, security deposit, due date, and revision index type (IRL/ILC/ICC)
- FR13: Bailleur can configure billing lines per lease (rent, charge provisions, billable options)
- FR14: Bailleur can set a configurable IRL/ILC/ICC revision date per lease
- FR15: Bailleur can set a configurable reference quarter per lease for index revision
- FR16: Bailleur can terminate a lease with an end date
- FR17: System calculates pro-rata amounts when a lease starts or ends mid-period
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
- FR28: Bailleur can import bank statements (CSV/Excel) from multiple banks
- FR29: System automatically proposes payment-to-rent-call matches based on amount, payer name, and reference
- FR30: Bailleur can validate, reject, or manually assign each proposed match
- FR31: Bailleur can record manual payments (cash, check) not from bank import
- FR32: System handles partial payments, overpayments, and credits on tenant current accounts
- FR33: Bailleur can view tenant current account balance (debits from rent calls, credits from payments)
- FR34: Bailleur can connect to bank accounts via Open Banking API for automatic statement retrieval
- FR35: System detects late payments based on configurable delay thresholds
- FR36: System proposes 3-tier escalation actions: email reminder, formal notice (registered mail), stakeholder notification
- FR37: Bailleur can trigger each escalation tier with one click
- FR38: Bailleur can send reminders by email directly from the application
- FR39: Bailleur can generate registered mail documents (PDF for postal dispatch)
- FR40: Bailleur can send registered mail directly via AR24/Maileva integration
- FR41: System tracks escalation status per tenant and per unpaid period
- FR42: Bailleur can enter INSEE indices (IRL, ILC, ICC) with quarter and year
- FR43: System validates entered indices for format and plausibility
- FR44: System calculates revised rent using the correct formula: current_rent × (new_index / previous_index) rounded down to the cent
- FR45: Bailleur can review all pending revisions in a single view and batch-approve
- FR46: Revised rents automatically apply to future rent calls
- FR47: System retrieves INSEE indices automatically (IRL/ILC/ICC)
- FR48: Bailleur can enter actual annual charges by category (water, electricity, TEOM, cleaning, custom)
- FR49: Bailleur can enter individual water meter readings per unit
- FR50: System calculates per-tenant charge statement: actual charges pro-rated by occupancy period minus provisions paid
- FR51: System generates charge regularization documents with detailed breakdown
- FR52: Credits or debits from regularization are applied to tenant current accounts
- FR53: System maintains an event-sourced account book (livre de comptes) per ownership entity
- FR54: Bailleur can view the account book with filters (date range, bank account, operation type)
- FR55: Bailleur can export the account book as Excel, formatted for 2072 tax declaration preparation
- FR56: Every financial operation is recorded as an immutable event with full audit trail
- FR57: Bailleur can view a dashboard showing unit payment status (paid, pending, late) across all entities
- FR58: Dashboard displays collection rate and key financial indicators
- FR59: Dashboard displays an action feed with pending tasks (receipts to send, reminders to trigger, statements to import)
- FR60: Dashboard displays a treasury chart showing income and expenses over time
- FR61: System sends email alerts to bailleur for critical events (unpaid rent detected, insurance expiring, escalation thresholds reached)
- FR62: Bailleur can create an account and start configuring entities immediately (self-service)
- FR63: Bailleur can grant read-only access to an accountant scoped to specific entities
- FR64: Application is accessible on desktop and mobile browsers (responsive)

### NonFunctional Requirements

- NFR1: Batch rent call generation completes in under 5 seconds for a portfolio of 50 units
- NFR2: Bank statement import and matching proposals display in under 10 seconds for 200 transaction lines
- NFR3: PDF document generation completes in under 3 seconds per document
- NFR4: Dashboard loads with current status data in under 2 seconds
- NFR5: Account book queries with filters return results in under 3 seconds for 5 years of event history
- NFR6: Batch email sending processes at a rate that handles 50 emails within 60 seconds
- NFR7: All data encrypted in transit (TLS 1.2+) and at rest
- NFR8: Authentication via secure session management with password hashing (bcrypt or argon2)
- NFR9: Tenant data isolation — no user can access another user's data under any circumstance
- NFR10: GDPR-compliant data handling: data export on request, deletion respecting legal retention periods
- NFR11: No sensitive data (passwords, bank details) logged in application logs
- NFR12: Accountant read-only access cannot modify, create, or delete any data
- NFR13: Event store guarantees zero data loss — every recorded event is persisted durably before acknowledgment
- NFR14: Events are immutable — no update or delete operations on the event store
- NFR15: Financial calculations produce identical results when replayed from events (deterministic projections)
- NFR16: System recovers from crash without data corruption — event store is the source of truth
- NFR17: Automated daily backups of the event store with point-in-time recovery capability
- NFR18: All financial amounts stored and calculated with 2-decimal precision, no floating-point arithmetic on money
- NFR19: Codebase follows consistent patterns across all bounded contexts (entity, lease, payment, charges)
- NFR20: Event schema versioning supports forward-compatible evolution without breaking existing events
- NFR21: All business rules (IRL/ILC/ICC formula, pro-rata calculation, charge regularization) covered by unit tests with >95% branch coverage

### Additional Requirements

**From Architecture:**

- Starter template: `create-next-app` (frontend) + `@nestjs/cli new` (backend) + Docker Compose (KurrentDB + PostgreSQL) — Epic 1 Story 1
- Single repository, two independent applications (frontend/ + backend/), no monorepo tooling
- Hexagonal CQRS/ES: KurrentDB (event store, source of truth) + PostgreSQL (read models via Prisma 6)
- Clerk authentication with JWT verification via JWKS (no API call per request)
- Multi-tenant isolation: entityId in event metadata + all Prisma queries filtered by entityId
- Event versioning via client-side upcasting pipeline (nestjs-cqrx transformer)
- All monetary values as integer cents — no floating-point
- Domain/presentation separation: domain/ writes events only, presentation/ reads PostgreSQL only
- Zero business logic in command handlers — all logic in aggregates
- Services passed as parameters to aggregate methods (hexagonal ports)
- VerbANoun naming for commands/queries, PastTense for events, kebab-case files
- CI/CD: GitHub Actions (lint + typecheck + tests on PR, auto-deploy via Railway on merge to main)
- NestJS Logger with correlation IDs, global ExceptionFilter for error normalization
- Optimistic UI: frontend generates UUIDs, commands return 202 Accepted with no body

**From UX Design:**

- Desktop-first responsive: full layout at lg+ (1024px), collapsed at md (768px), monitoring-only at sm- (640px)
- WCAG 2.1 AA accessibility: 4.5:1 contrast, keyboard navigation, screen reader support, focus indicators
- shadcn/ui + Tailwind CSS 4 + Radix UI component foundation
- 10 custom components required: UnitMosaic, ActionFeed, ContinuousFlowStepper, MatchingRow, BatchSummary, KPITile, EntitySwitcher, TenantCurrentAccount, RevisionTable, StatusTimeline
- Dark mode as first-class citizen (designed simultaneously with light mode)
- Deep teal (bleu pétrole) + slate color palette with Inter typeface (tabular-nums for financials)
- Action-first interface: dashboard action feed IS the primary interface, not navigation
- Continuous flow: monthly cycle runs as single progressive flow without page changes
- Clickable status mosaic: color-coded unit tiles serve as both status indicator AND navigation
- Empty states guide onboarding through action feed (no wizard)
- Batch operations with rich completion summaries (count, amounts, exceptions)
- French-language navigation labels, French number/date formatting

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1-4 | Epic 2 | Entity management (SCI/nom propre), bank accounts, entity switching |
| FR5-8 | Epic 2 | Properties, units, unit options, status view |
| FR9-11 | Epic 3 | Tenant registration, insurance tracking, insurance alerts |
| FR12-17 | Epic 3 | Lease CRUD, billing lines, revision config, termination, pro-rata |
| FR18-20 | Epic 4 | Batch rent call generation, PDF documents, batch email |
| FR21-22 | Epic 5 | Quittance (full receipt) + reçu de paiement (partial receipt) |
| FR23 | Epic 7 | IRL/ILC/ICC revision letters with formula |
| FR24-25 | Epic 6 | Formal notices (mise en demeure) + stakeholder letters |
| FR26 | Epic 7 | Annual charge regularization statements |
| FR27 | Epic 4-7 | PDF generation (progressive — each epic adds document types) |
| FR28-33 | Epic 5 | Bank import, auto-matching, manual payments, tenant balance |
| FR34 | Epic 9 | Open Banking API integration |
| FR35-41 | Epic 6 | Late detection, 3-tier escalation, email/registered mail, status tracking |
| FR42-46 | Epic 7 | INSEE index entry, validation, revision calculation, batch approve |
| FR47 | Epic 9 | Automatic INSEE index retrieval |
| FR48-52 | Epic 7 | Charge categories, water meters, pro-rata statement, credits/debits |
| FR53-56 | Epic 8 | Event-sourced account book, filters, Excel export, audit trail |
| FR57-61 | Epic 8 | Dashboard (mosaic, KPIs, action feed, treasury chart), email alerts |
| FR62 | Epic 1 | Self-service account creation |
| FR63 | Epic 9 | Accountant read-only access |
| FR64 | Epic 1 | Responsive desktop + mobile |

**64/64 FRs covered. No gaps.**

## Epic List

### Epic 1: Project Foundation & Authentication
**Goal:** User can create an account, login, and see an empty dashboard with the full layout (sidebar, header, dark mode).
**FRs covered:** FR62, FR64
**Notes:** Starter template (create-next-app + NestJS + Docker Compose + KurrentDB), Clerk auth, shadcn/ui + deep teal theme, core layout shell, responsive skeleton. Foundation for everything else.

#### Story 1.1: Initialize Repository and Development Environment

As a developer,
I want a working monorepo with frontend (Next.js 15), backend (NestJS 11), and infrastructure (Docker Compose with KurrentDB 25 + PostgreSQL 16),
So that I have a ready-to-code foundation with all services running locally.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** I run `docker compose up` and `npm install` in both frontend/ and backend/
**Then** KurrentDB is accessible on port 2113, PostgreSQL on port 5432
**And** Next.js dev server starts on port 3000 with no errors
**And** NestJS dev server starts on port 3001 with no errors
**And** Prisma 6 schema is initialized with an empty migration
**And** ESLint + Prettier configs are shared, TypeScript strict mode is enabled
**And** GitHub Actions CI runs lint + typecheck on PR

#### Story 1.2: Configure Clerk Authentication with JWT Verification

As a bailleur,
I want to create an account and log in securely,
So that I can access my rental management dashboard.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I navigate to the application
**Then** I am redirected to the Clerk sign-in/sign-up page
**And** I can create an account with email (FR62 — self-service)

**Given** I am authenticated via Clerk
**When** the frontend makes an API request to the backend
**Then** the backend verifies the JWT via JWKS endpoint (no API call per request)
**And** the userId is extracted and available in the request context
**And** unauthenticated requests to protected endpoints return 401

#### Story 1.3: Implement Core Layout Shell with Responsive Design

As a bailleur,
I want to see a professional application layout with sidebar navigation, header, and main content area,
So that I can navigate the application on both desktop and mobile (FR64).

**Acceptance Criteria:**

**Given** I am authenticated
**When** I access the application on a desktop (≥1024px)
**Then** I see a full sidebar with French-language navigation labels, a header with user menu, and a main content area
**And** the layout uses the deep teal + slate color palette with Inter typeface

**Given** I am authenticated
**When** I access the application on a tablet (768px)
**Then** the sidebar collapses to icon-only mode
**And** all content remains accessible

**Given** I am authenticated
**When** I access the application on mobile (<640px)
**Then** the sidebar is hidden behind a hamburger menu
**And** the layout adapts to monitoring-only mode

**And** dark mode toggle is functional and persisted
**And** WCAG 2.1 AA compliance: 4.5:1 contrast, keyboard navigation, focus indicators
**And** shadcn/ui + Tailwind CSS 4 + Radix UI are configured as the design system foundation

#### Story 1.4: Create Empty Dashboard with Action Feed Placeholder

As a bailleur,
I want to see an empty dashboard that guides me toward my first actions,
So that I understand what to do next without a tutorial.

**Acceptance Criteria:**

**Given** I am authenticated and have no entities configured
**When** I land on the dashboard
**Then** I see an empty state with the ActionFeed component displaying onboarding guidance ("Créez votre première entité")
**And** I see placeholder areas for the UnitMosaic (empty state) and KPI tiles (showing zeros/dashes)
**And** the page title displays "Tableau de bord"
**And** the dashboard loads in under 2 seconds (NFR4)

### Epic 2: Portfolio Setup — Entities, Properties & Units
**Goal:** User can create ownership entities (SCIs), properties, and units. The unit mosaic appears on the dashboard.
**FRs covered:** FR1-8
**Notes:** EntitySwitcher, UnitMosaic (gray tiles = vacant), action feed guiding onboarding ("Create your first entity"), progressive empty states.

#### Story 2.1: Create and Manage Ownership Entities

As a bailleur,
I want to create ownership entities (SCI or personal name) with their details,
So that I can organize my rental portfolio by legal structure (FR1, FR2).

**Acceptance Criteria:**

**Given** I am authenticated and have no entities
**When** I click the onboarding action "Créez votre première entité" in the ActionFeed
**Then** I see a form to create an entity with: type (SCI / nom propre), name, SIRET, address, legal information
**And** the entity is persisted via a command (CreateAnEntity) returning 202 Accepted
**And** the event EntityCreated is stored in KurrentDB with entityId in metadata

**Given** I have created an entity
**When** I view the entity list
**Then** I see all my entities with their details
**And** I can edit entity details (UpdateAnEntity command)
**And** the ActionFeed updates to suggest the next step ("Ajoutez un bien immobilier")

#### Story 2.2: Associate Bank Accounts to an Entity

As a bailleur,
I want to associate bank accounts and a cash register to each entity,
So that generated documents display the correct IBAN for rent payments (FR3).

**Acceptance Criteria:**

**Given** I have an entity
**When** I navigate to the entity's bank account configuration
**Then** I can add multiple bank accounts with: label, IBAN, BIC, bank name
**And** I can designate one as the default for rent call documents
**And** I can add a cash register (caisse) for tracking cash payments
**And** bank account details are stored as part of the entity aggregate

#### Story 2.3: Implement Entity Switcher Component

As a bailleur,
I want to switch between my entities within a single session,
So that I can manage multiple SCIs without logging out (FR4).

**Acceptance Criteria:**

**Given** I have multiple entities
**When** I click the EntitySwitcher in the sidebar header
**Then** I see a dropdown listing all my entities with their type (SCI/nom propre) and name
**And** selecting an entity updates the entire application context (all queries filter by this entityId)
**And** the current entity name is displayed prominently in the sidebar
**And** the switch is instantaneous (no page reload)
**And** all data displayed (properties, units, dashboard) reflects the selected entity only (NFR9 — tenant data isolation)

#### Story 2.4: Create Properties Under an Entity

As a bailleur,
I want to create properties (buildings/addresses) under my ownership entity,
So that I can organize my real estate portfolio geographically (FR5).

**Acceptance Criteria:**

**Given** I have selected an entity
**When** I create a new property
**Then** I can enter: property name, full address, type/description
**And** the property is linked to the current entity via entityId
**And** the event PropertyCreated is stored in KurrentDB
**And** the property appears in the property list for this entity

#### Story 2.5: Create and Configure Units Within a Property

As a bailleur,
I want to create units (apartments, parking, commercial spaces) within a property and configure their options,
So that I can track each rentable space individually (FR6, FR7).

**Acceptance Criteria:**

**Given** I have a property
**When** I create a unit
**Then** I can enter: unit identifier (e.g., "Apt 3B"), type (apartment/parking/commercial/storage), floor, surface area
**And** I can configure unit-level billable options: boiler maintenance, parking fee, custom options with label and amount
**And** the event UnitCreated is stored in KurrentDB
**And** billable options are stored as part of the unit aggregate

#### Story 2.6: Display Unit Mosaic on Dashboard

As a bailleur,
I want to see all my units across all properties displayed as a color-coded mosaic on the dashboard,
So that I can instantly see the status of my entire portfolio (FR8).

**Acceptance Criteria:**

**Given** I have properties with units
**When** I view the dashboard
**Then** I see the UnitMosaic component displaying one tile per unit, grouped by property
**And** tiles show unit identifier and property name
**And** vacant units (no active lease) appear as gray tiles
**And** clicking a unit tile navigates to the unit detail page
**And** the mosaic is responsive: grid layout on desktop, horizontal scroll on mobile
**And** the mosaic updates in real-time when units are added (optimistic UI with frontend-generated UUIDs)

### Epic 3: Tenant & Lease Management
**Goal:** User can register tenants, track their insurance, and create complete leases with billing lines and revision configuration.
**FRs covered:** FR9-17
**Notes:** Insurance tracking + alerts (FR11), configurable billing lines, pro-rata calculation, revision date/index type per lease.

#### Story 3.1: Register Tenants with Contact Information

As a bailleur,
I want to register tenants (individuals or companies) with their contact details,
So that I can manage my tenant directory and associate them with leases (FR9).

**Acceptance Criteria:**

**Given** I have an entity selected
**When** I create a new tenant
**Then** I can enter: type (individual/company), first name, last name (or company name + SIRET), email, phone, postal address
**And** the event TenantRegistered is stored in KurrentDB with entityId in metadata
**And** the tenant appears in the tenant list for this entity
**And** I can edit tenant contact information after creation

#### Story 3.2: Track Tenant Insurance with Expiry Alerts

As a bailleur,
I want to record tenant insurance details and be alerted when insurance is approaching renewal or has expired,
So that I can ensure all tenants maintain valid insurance (FR10, FR11).

**Acceptance Criteria:**

**Given** I have a registered tenant
**When** I add insurance information
**Then** I can enter: insurance provider, policy number, renewal date
**And** the insurance details are stored as part of the tenant aggregate

**Given** a tenant's insurance renewal date is within 30 days
**When** the system checks insurance status (daily)
**Then** the ActionFeed displays a warning: "Assurance de [tenant name] expire le [date]"
**And** the tenant's insurance status is marked as "approaching renewal"

**Given** a tenant's insurance renewal date has passed
**When** the system checks insurance status
**Then** the ActionFeed displays an urgent alert: "Assurance de [tenant name] expirée"
**And** the tenant's insurance status is marked as "expired"

#### Story 3.3: Create a Lease Linking Tenant to Unit

As a bailleur,
I want to create a lease that links a tenant to a specific unit with rent amount, security deposit, due date, and revision index type,
So that I can formalize the rental agreement in the system (FR12).

**Acceptance Criteria:**

**Given** I have a tenant and a vacant unit
**When** I create a lease
**Then** I can enter: tenant selection, unit selection, start date, rent amount (stored as integer cents), security deposit amount, monthly due date (day of month), revision index type (IRL/ILC/ICC)
**And** the event LeaseCreated is stored in KurrentDB
**And** the unit's status changes from vacant (gray) to occupied in the UnitMosaic
**And** the lease appears in both the unit detail and tenant detail views

#### Story 3.4: Configure Billing Lines Per Lease

As a bailleur,
I want to configure billing lines for each lease (rent, charge provisions, billable options),
So that rent calls reflect the exact amounts due per tenant (FR13).

**Acceptance Criteria:**

**Given** I have an active lease
**When** I configure billing lines
**Then** I see a default line for base rent (from lease creation)
**And** I can add a charge provision line (provisions sur charges) with a monthly amount
**And** I can add billable option lines from the unit's configured options (boiler, parking, custom) with their amounts
**And** each line has: label, amount (integer cents), type (rent/provision/option)
**And** the total monthly amount is displayed as the sum of all lines
**And** all amounts use French number formatting (1 234,56 €)

#### Story 3.5: Configure Lease Revision Parameters

As a bailleur,
I want to set a revision date and reference quarter per lease,
So that the system can calculate rent revisions at the right time with the right index (FR14, FR15).

**Acceptance Criteria:**

**Given** I have an active lease
**When** I configure revision parameters
**Then** I can set: annual revision date (day + month), reference quarter (Q1/Q2/Q3/Q4), reference year
**And** the revision index type (IRL/ILC/ICC) is already set from lease creation
**And** the system stores the previous index value for future revision calculation
**And** revision parameters are displayed in the lease detail view

#### Story 3.6: Terminate a Lease with Pro-Rata Calculation

As a bailleur,
I want to terminate a lease by setting an end date, with the system calculating pro-rata amounts for partial periods,
So that final billing is accurate when a tenant leaves (FR16, FR17).

**Acceptance Criteria:**

**Given** I have an active lease
**When** I terminate the lease with an end date
**Then** the event LeaseTerminated is stored with the end date
**And** the unit's status returns to vacant (gray) in the UnitMosaic after the end date

**Given** a lease starts or ends mid-month
**When** a rent call is generated for that period
**Then** the system calculates pro-rata: (number of days in period / total days in month) × monthly amount
**And** pro-rata is applied to all billing lines (rent, provisions, options)
**And** all calculations use integer cents with rounding down to the cent (NFR18)
**And** the pro-rata formula and dates are displayed on the rent call document

### Epic 4: Rent Call Generation & Email Sending
**Goal:** User can batch generate all rent calls and send them by email with PDF. First "wow moment".
**FRs covered:** FR18-20, FR27 (rent calls PDF)
**Notes:** BatchSummary component, ActionFeed ("Generate your rent calls"), PDF generation, batch SMTP, mosaic turns orange.

#### Story 4.1: Generate Rent Calls for All Active Leases in Batch

As a bailleur,
I want to generate rent calls for all active leases of my entity in a single batch operation,
So that I can prepare monthly billing efficiently (FR18).

**Acceptance Criteria:**

**Given** I have active leases with configured billing lines
**When** I trigger batch rent call generation from the ActionFeed ("Générez vos appels de loyer") or the rent call page
**Then** the system generates one rent call per active lease for the selected month
**And** each rent call contains all billing lines (rent, provisions, options) with correct amounts
**And** pro-rata is applied for leases starting or ending mid-month (FR17)
**And** the event RentCallGenerated is stored per lease in KurrentDB
**And** batch generation completes in under 5 seconds for 50 units (NFR1)
**And** the BatchSummary component displays: total rent calls generated, total amount, any exceptions (terminated leases, missing config)

#### Story 4.2: Generate Rent Call PDF Documents

As a bailleur,
I want each rent call to be available as a downloadable PDF with correct amounts, IBAN, legal mentions, and lease references,
So that I can provide professional, legally compliant billing documents (FR19, FR27).

**Acceptance Criteria:**

**Given** rent calls have been generated for a month
**When** I view or download a rent call document
**Then** the PDF contains: entity name and address, tenant name and address, lease reference, billing period, all billing line items with amounts, total amount due, due date, entity's default IBAN and BIC, legal mentions required by French rental law
**And** all amounts are displayed in French format (1 234,56 €)
**And** PDF generation completes in under 3 seconds per document (NFR3)
**And** the document is stored and available for future download

#### Story 4.3: Send Rent Calls by Email in Batch with PDF Attachments

As a bailleur,
I want to send all generated rent calls by email with PDF attachments in a single batch operation,
So that all tenants receive their billing documents without manual effort (FR20).

**Acceptance Criteria:**

**Given** rent calls have been generated for a month
**When** I trigger batch email sending from the ActionFeed or rent call page
**Then** each tenant with an email address receives an email with their rent call PDF attached
**And** the email contains: a professional French-language subject line and body, the billing period, the total amount due
**And** the BatchSummary displays: total emails sent, total emails failed (missing email), total amount billed
**And** batch sending processes 50 emails within 60 seconds (NFR6)
**And** the event RentCallSent is stored per lease in KurrentDB
**And** the UnitMosaic tiles update to orange (pending payment) for units with sent rent calls

### Epic 5: Bank Reconciliation & Payment Management
**Goal:** User can import a bank statement, reconcile payments, generate receipts (quittances) and partial payment receipts. The monthly cycle is complete.
**FRs covered:** FR21-22, FR28-33, FR27 (receipts PDF)
**Notes:** ContinuousFlowStepper, MatchingRow, TenantCurrentAccount, auto-matching algorithm, partial/overpayments, mosaic turns green.

#### Story 5.1: Import Bank Statements from CSV/Excel

As a bailleur,
I want to import bank statements in CSV or Excel format from multiple banks,
So that I can reconcile tenant payments against rent calls (FR28).

**Acceptance Criteria:**

**Given** I have an entity with bank accounts configured
**When** I upload a CSV or Excel bank statement file
**Then** the system parses the file and extracts transaction lines: date, amount, payer name, reference/label
**And** each transaction is displayed in a list with parsed details
**And** the import handles multiple bank formats (configurable column mapping)
**And** import and display completes in under 10 seconds for 200 transaction lines (NFR2)
**And** the event BankStatementImported is stored in KurrentDB

#### Story 5.2: Auto-Match Payments to Rent Calls

As a bailleur,
I want the system to automatically propose matches between imported payments and outstanding rent calls,
So that I can validate reconciliation quickly without manual lookup (FR29).

**Acceptance Criteria:**

**Given** a bank statement has been imported with transaction lines
**When** the system processes the transactions
**Then** it proposes matches based on: amount match (exact or partial), payer name similarity to tenant name, reference containing lease or tenant identifiers
**And** each proposal is displayed as a MatchingRow component showing: transaction details on the left, proposed rent call match on the right, confidence indicator (high/medium/low)
**And** unmatched transactions are clearly separated at the bottom
**And** the matching proposals display within the 10-second NFR2 budget

#### Story 5.3: Validate, Reject, or Manually Assign Payment Matches

As a bailleur,
I want to validate, reject, or manually assign each proposed payment match,
So that I have full control over reconciliation accuracy (FR30).

**Acceptance Criteria:**

**Given** the system has proposed payment matches
**When** I review a MatchingRow
**Then** I can validate the match (confirm payment against rent call)
**And** I can reject the match (mark as not a rent payment)
**And** I can manually assign the transaction to a different rent call or tenant via search
**And** validated matches store a PaymentRecorded event in KurrentDB
**And** the ContinuousFlowStepper shows progress: Import → Match → Validate → Complete
**And** the UnitMosaic updates tiles from orange to green as payments are validated

#### Story 5.4: Record Manual Payments (Cash, Check)

As a bailleur,
I want to record manual payments (cash, check) that are not from a bank import,
So that I can track all payment methods in the system (FR31).

**Acceptance Criteria:**

**Given** I have an outstanding rent call
**When** I record a manual payment
**Then** I can enter: payment method (cash/check), amount, date, reference (check number), tenant selection
**And** the payment is linked to the specified rent call
**And** the event ManualPaymentRecorded is stored in KurrentDB
**And** the tenant's current account is updated accordingly

#### Story 5.5: Handle Partial Payments, Overpayments, and Tenant Current Account

As a bailleur,
I want the system to handle partial payments and overpayments on tenant current accounts,
So that I can accurately track what each tenant owes or is owed (FR32, FR33).

**Acceptance Criteria:**

**Given** a payment amount is less than the rent call total
**When** the payment is recorded
**Then** the rent call is marked as partially paid with the remaining balance
**And** the tenant current account shows: debit (rent call amount) and credit (payment amount) with running balance

**Given** a payment amount exceeds the rent call total
**When** the payment is recorded
**Then** the excess is credited to the tenant current account as a positive balance
**And** the credit is automatically applied to the next rent call

**Given** I want to review a tenant's financial history
**When** I view the TenantCurrentAccount component
**Then** I see a chronological list of all debits (rent calls) and credits (payments) with running balance
**And** all amounts are displayed in French format with integer cents precision (NFR18)

#### Story 5.6: Generate Receipts (Quittances) and Partial Payment Receipts

As a bailleur,
I want to generate full receipts (quittances) for fully paid rent and partial payment receipts (reçus de paiement) for partial payments,
So that I provide legally correct documents to my tenants (FR21, FR22, FR27).

**Acceptance Criteria:**

**Given** a rent call has been fully paid
**When** I generate a receipt
**Then** the system produces a quittance de loyer PDF with: entity details, tenant details, lease reference, period, itemized amounts paid (rent + charges + options), total paid, payment date, legal mentions
**And** the quittance is distinct from a partial payment receipt

**Given** a rent call has been partially paid
**When** I generate a receipt
**Then** the system produces a reçu de paiement PDF (not a quittance) with: amounts paid, remaining balance, partial payment notation
**And** the document clearly states it is NOT a quittance de loyer

**And** PDF generation completes in under 3 seconds (NFR3)
**And** the ActionFeed suggests "Envoyez les quittances" after payment validation

### Epic 6: Unpaid Rent Management & Reminders
**Goal:** User can manage unpaid rent with 3-tier escalation: email reminder, formal notice, stakeholder notification.
**FRs covered:** FR24-25, FR35-41, FR27 (formal notices PDF)
**Notes:** StatusTimeline, late payment detection, one-click escalation, formal notice + stakeholder letters, mosaic turns red.

#### Story 6.1: Detect Late Payments and Display Unpaid Status

As a bailleur,
I want the system to automatically detect late payments based on configurable delay thresholds,
So that I am alerted to unpaid rent without manual tracking (FR35).

**Acceptance Criteria:**

**Given** a rent call has been sent and the due date has passed
**When** the configurable delay threshold is exceeded (e.g., 5 days after due date)
**Then** the system marks the rent call as late
**And** the UnitMosaic tile turns red for units with unpaid rent
**And** the ActionFeed displays an alert: "Loyer impayé — [tenant name] — [amount] — [days late]"
**And** the delay threshold is configurable per entity (default: 5 days)

#### Story 6.2: Propose 3-Tier Escalation Actions

As a bailleur,
I want the system to propose escalation actions in 3 tiers for each unpaid rent,
So that I can follow a structured recovery process (FR36).

**Acceptance Criteria:**

**Given** a late payment has been detected
**When** I view the unpaid rent details
**Then** I see the StatusTimeline component showing 3 escalation tiers:
- **Tier 1:** Email reminder (relance par email)
- **Tier 2:** Formal notice via registered mail (mise en demeure par lettre recommandée)
- **Tier 3:** Stakeholder notification (signalement assureur, avocat, garant)
**And** each tier shows: status (available/completed/skipped), date if completed, action button
**And** the system tracks which tiers have been executed per tenant per unpaid period (FR41)

#### Story 6.3: Send Email Reminders (Tier 1)

As a bailleur,
I want to send email reminders to tenants with unpaid rent with one click,
So that I can initiate the first recovery step quickly (FR37, FR38).

**Acceptance Criteria:**

**Given** a late payment has been detected and Tier 1 is available
**When** I click the Tier 1 action button
**Then** an email reminder is sent to the tenant with: professional French-language subject and body, amount due, number of days late, payment instructions with IBAN
**And** the event ReminderSent is stored in KurrentDB
**And** the StatusTimeline updates Tier 1 to "completed" with the sent date
**And** the ActionFeed reflects the updated escalation status

#### Story 6.4: Generate Formal Notices — Mise en Demeure (Tier 2)

As a bailleur,
I want to generate formal notice documents (mises en demeure) with all legal mentions and amount details,
So that I can send legally compliant registered mail to defaulting tenants (FR24, FR37, FR39, FR27).

**Acceptance Criteria:**

**Given** Tier 1 has been completed (or skipped) and Tier 2 is available
**When** I click the Tier 2 action button
**Then** the system generates a mise en demeure PDF with: entity details, tenant details, lease reference, unpaid periods with amounts, total debt, legal mentions required by French law, formal demand for payment within a specified delay
**And** the PDF is available for download (for manual postal dispatch)
**And** the event FormalNoticeSent is stored in KurrentDB
**And** the StatusTimeline updates Tier 2 to "completed"
**And** PDF generation completes in under 3 seconds (NFR3)

#### Story 6.5: Generate Stakeholder Notification Letters (Tier 3)

As a bailleur,
I want to generate notification letters to stakeholders (insurance company, lawyer, guarantor),
So that I can alert all relevant parties about the tenant's default (FR25, FR37, FR27).

**Acceptance Criteria:**

**Given** Tier 2 has been completed (or skipped) and Tier 3 is available
**When** I click the Tier 3 action button
**Then** the system generates stakeholder notification PDF letters for each configured recipient: insurance company, lawyer, guarantor (garant)
**And** each letter contains: entity details, tenant details, lease reference, debt summary, escalation history, request for action
**And** the event StakeholderNotified is stored in KurrentDB
**And** the StatusTimeline updates Tier 3 to "completed"
**And** all generated PDFs are available for download

### Epic 7: Index Revision & Annual Charges
**Goal:** User can manage IRL/ILC/ICC revisions and annual charge regularization with water meter readings.
**FRs covered:** FR23, FR26, FR42-52, FR27 (revision letters + charge statements PDF)
**Notes:** RevisionTable, INSEE index entry + validation, batch approve, charge regularization, pro-rata occupation, credits/debits applied.

#### Story 7.1: Enter and Validate INSEE Indices (IRL/ILC/ICC)

As a bailleur,
I want to enter INSEE indices (IRL, ILC, ICC) with their quarter and year,
So that the system can calculate rent revisions with official reference values (FR42, FR43).

**Acceptance Criteria:**

**Given** I navigate to the index management page
**When** I enter an INSEE index
**Then** I can specify: index type (IRL/ILC/ICC), quarter (Q1/Q2/Q3/Q4), year, value
**And** the system validates the index for format (positive decimal number) and plausibility (within expected range relative to previous quarter)
**And** invalid entries display a clear error message
**And** the event IndexRecorded is stored in KurrentDB
**And** the index is available for revision calculations across all leases using that index type and quarter

#### Story 7.2: Calculate Revised Rent Using Official Formula

As a bailleur,
I want the system to calculate revised rent using the correct formula with the entered indices,
So that revisions are legally accurate and auditable (FR44).

**Acceptance Criteria:**

**Given** an index has been entered for the relevant quarter and a lease has a revision date approaching
**When** the system calculates the revision
**Then** it applies the formula: new_rent = current_rent × (new_index / previous_index)
**And** the result is rounded down to the cent (troncature, not rounding — NFR18)
**And** all calculations use integer cents internally
**And** the revision detail shows: current rent, previous index (quarter + value), new index (quarter + value), formula applied, resulting new rent
**And** the calculation is deterministic and produces identical results when replayed (NFR15)

#### Story 7.3: Review and Batch-Approve Pending Revisions

As a bailleur,
I want to review all pending revisions in a single view and batch-approve them,
So that I can efficiently process annual rent revisions (FR45).

**Acceptance Criteria:**

**Given** indices have been entered and revisions calculated
**When** I view the RevisionTable component
**Then** I see all pending revisions with: tenant name, unit, current rent, new rent, difference, index details
**And** I can approve individual revisions or batch-approve all
**And** approved revisions store a RentRevised event in KurrentDB
**And** revised rents automatically apply to future rent calls (FR46)
**And** the revision date and new amount are updated on the lease

#### Story 7.4: Generate IRL/ILC/ICC Revision Letters

As a bailleur,
I want to generate revision letters with the detailed formula and legal mentions,
So that I can formally notify tenants of their rent revision (FR23, FR27).

**Acceptance Criteria:**

**Given** a revision has been approved
**When** I generate a revision letter
**Then** the system produces a PDF with: entity details, tenant details, lease reference, revision date, previous rent, new rent, complete formula with index values, effective date, legal mentions required by French law
**And** the letter is available for download
**And** PDF generation completes in under 3 seconds (NFR3)

#### Story 7.5: Enter Actual Annual Charges by Category

As a bailleur,
I want to enter actual annual charges by category (water, electricity, TEOM, cleaning, custom),
So that I can calculate the difference between provisions paid and actual costs (FR48).

**Acceptance Criteria:**

**Given** a fiscal year has ended
**When** I enter actual charges for my entity
**Then** I can enter amounts per category: water (eau), electricity (électricité), property tax (TEOM), cleaning (nettoyage), custom categories with label
**And** each amount is stored as integer cents
**And** the event AnnualChargesRecorded is stored in KurrentDB
**And** the total actual charges are displayed alongside total provisions collected

#### Story 7.6: Enter Individual Water Meter Readings Per Unit

As a bailleur,
I want to enter individual water meter readings per unit,
So that water charges can be distributed based on actual consumption (FR49).

**Acceptance Criteria:**

**Given** I have units with tenants
**When** I enter water meter readings
**Then** I can enter: unit selection, previous reading, current reading, reading date
**And** the system calculates consumption per unit (current - previous)
**And** water charges are distributed proportionally based on consumption
**And** units without individual meters share remaining water charges equally

#### Story 7.7: Calculate and Generate Charge Regularization Statements

As a bailleur,
I want the system to calculate per-tenant charge regularization statements and generate detailed documents,
So that tenants receive an accurate breakdown of actual vs. provisioned charges (FR50, FR51, FR26, FR27).

**Acceptance Criteria:**

**Given** actual charges and water readings have been entered
**When** I trigger charge regularization
**Then** the system calculates per tenant: actual charges pro-rated by occupancy period (days occupied / days in year), minus provisions paid during the period
**And** the result is either a credit (tenant overpaid provisions) or a debit (tenant underpaid)
**And** the system generates a charge regularization PDF statement with: detailed breakdown per category, provision amounts paid, actual amounts allocated, pro-rata calculation, final balance (credit or debit)
**And** PDF generation completes in under 3 seconds (NFR3)

#### Story 7.8: Apply Regularization Credits/Debits to Tenant Accounts

As a bailleur,
I want regularization results to be applied to tenant current accounts,
So that credits reduce future amounts due and debits are collected (FR52).

**Acceptance Criteria:**

**Given** charge regularization has been calculated
**When** I approve the regularization results
**Then** credits are applied as positive balance on the tenant's current account
**And** debits are added as amounts due on the tenant's current account
**And** the events ChargeRegularizationCredited / ChargeRegularizationDebited are stored in KurrentDB
**And** the TenantCurrentAccount component reflects the updated balance
**And** future rent calls account for any credit balance

### Epic 8: Dashboard, Accounting & Monitoring
**Goal:** User has a complete dashboard with KPIs, treasury chart, email alerts, and an exportable account book.
**FRs covered:** FR53-61
**Notes:** KPITile, treasury chart, full action feed, email alerts (cron), event-sourced account book, Excel export for 2072.

#### Story 8.1: Implement Event-Sourced Account Book (Livre de Comptes)

As a bailleur,
I want the system to maintain an event-sourced account book per ownership entity,
So that every financial operation is recorded with a complete audit trail (FR53, FR56).

**Acceptance Criteria:**

**Given** financial operations occur (rent calls, payments, regularizations, revisions)
**When** any financial event is stored in KurrentDB
**Then** the account book projection in PostgreSQL records: date, operation type, description, debit amount, credit amount, balance, related entity (tenant/property/unit), event reference
**And** every entry is immutable — no updates or deletes on the event store (NFR14)
**And** the account book is scoped per ownership entity (entityId isolation)
**And** all entries include a full audit trail: timestamp, userId, correlation ID

#### Story 8.2: View and Filter the Account Book

As a bailleur,
I want to view the account book with filters (date range, bank account, operation type),
So that I can analyze my financial operations efficiently (FR54).

**Acceptance Criteria:**

**Given** the account book has entries
**When** I navigate to the account book page
**Then** I see a chronological table of all financial operations with: date, type, description, debit, credit, running balance
**And** I can filter by: date range (start/end), bank account, operation type (rent call, payment, regularization, revision)
**And** filters can be combined
**And** queries return results in under 3 seconds for 5 years of event history (NFR5)
**And** all amounts use French number formatting (1 234,56 €) with tabular-nums

#### Story 8.3: Export Account Book as Excel for 2072 Tax Declaration

As a bailleur,
I want to export the account book as an Excel file formatted for 2072 tax declaration preparation,
So that I can easily transmit financial data to my accountant (FR55).

**Acceptance Criteria:**

**Given** I have viewed and optionally filtered the account book
**When** I click the export button
**Then** the system generates an Excel (.xlsx) file with: all displayed entries, proper column headers in French, amounts formatted for accounting (debits/credits separated), summary totals per category
**And** the format is structured for easy integration with 2072 tax declaration
**And** the export includes: entity details header, date range, operation breakdown by type

#### Story 8.4: Display Dashboard with Unit Payment Status Mosaic

As a bailleur,
I want to see a dashboard showing unit payment status (paid, pending, late) across all entities,
So that I have an instant overview of my portfolio health (FR57).

**Acceptance Criteria:**

**Given** I have active leases with various payment statuses
**When** I view the dashboard
**Then** the UnitMosaic displays color-coded tiles: green (paid), orange (pending/sent), red (late/unpaid), gray (vacant)
**And** I can see all units across all properties for the selected entity
**And** clicking a tile navigates to the unit/lease detail
**And** the dashboard loads in under 2 seconds (NFR4)

#### Story 8.5: Display KPIs and Collection Rate

As a bailleur,
I want the dashboard to display collection rate and key financial indicators,
So that I can monitor my rental business performance at a glance (FR58).

**Acceptance Criteria:**

**Given** I have financial activity (rent calls, payments)
**When** I view the dashboard
**Then** I see KPITile components displaying: collection rate (% of rent collected vs. called for current month), total rent called this month, total payments received this month, number of unpaid tenants, total outstanding debt
**And** each KPI shows a trend indicator (up/down vs. previous month)
**And** all amounts use French number formatting with tabular-nums font feature

#### Story 8.6: Display Action Feed with Pending Tasks

As a bailleur,
I want the dashboard to display an action feed with pending tasks,
So that I know exactly what actions need my attention (FR59).

**Acceptance Criteria:**

**Given** there are pending actions across my portfolio
**When** I view the ActionFeed on the dashboard
**Then** I see a prioritized list of pending tasks: receipts to send (quittances non envoyées), reminders to trigger (impayés détectés), bank statements to import (nouveau mois), insurance renewals approaching, revisions pending approval
**And** each action item has: icon, description, timestamp, action button
**And** clicking an action navigates directly to the relevant workflow
**And** completed actions are removed from the feed
**And** the feed is the primary interface — it IS the homepage, not a sidebar widget

#### Story 8.7: Display Treasury Chart (Income vs. Expenses Over Time)

As a bailleur,
I want the dashboard to display a treasury chart showing income and expenses over time,
So that I can visualize my cash flow trends (FR60).

**Acceptance Criteria:**

**Given** I have financial history spanning multiple months
**When** I view the dashboard
**Then** I see a line/bar chart displaying: monthly income (rent received), monthly amounts called, timeline spanning the last 12 months by default
**And** I can adjust the time range
**And** the chart uses the deep teal color palette
**And** hovering shows exact amounts in French format

#### Story 8.8: Send Email Alerts for Critical Events

As a bailleur,
I want to receive email alerts for critical events (unpaid rent detected, insurance expiring, escalation thresholds reached),
So that I am notified even when not logged in (FR61).

**Acceptance Criteria:**

**Given** a critical event occurs
**When** the system detects: a new late payment, an insurance renewal within 15 days, an escalation threshold reached
**Then** an email alert is sent to the bailleur with: event description, tenant/unit details, suggested action, link to the relevant page in the application
**And** alerts are sent via a scheduled process (cron/background job)
**And** the bailleur can configure which alert types to receive (per entity)
**And** no sensitive data (bank details, passwords) is included in emails (NFR11)

### Epic 9: Integrations & Advanced Features
**Goal:** External integrations and advanced features: Open Banking, registered mail, auto INSEE, accountant access.
**FRs covered:** FR34, FR40, FR47, FR63
**Notes:** Open Banking API, AR24/Maileva integration, auto INSEE retrieval, accountant read-only access.

#### Story 9.1: Connect to Bank via Open Banking API

As a bailleur,
I want to connect my bank accounts via Open Banking API for automatic statement retrieval,
So that I don't need to manually download and import CSV files each month (FR34).

**Acceptance Criteria:**

**Given** I have bank accounts configured for an entity
**When** I initiate Open Banking connection
**Then** I am redirected to the bank's authorization flow (OAuth2/consent)
**And** upon successful authorization, the connection is stored securely
**And** the system can automatically retrieve new transactions from the connected bank
**And** retrieved transactions follow the same processing pipeline as CSV imports (matching, validation)
**And** the ActionFeed displays "Nouvelles transactions bancaires disponibles" when new data arrives
**And** no bank credentials are stored in the application — only access tokens (NFR11)

#### Story 9.2: Send Registered Mail via AR24/Maileva Integration

As a bailleur,
I want to send registered mail (lettres recommandées) directly via AR24 or Maileva from the application,
So that I can dispatch formal notices without visiting a post office (FR40).

**Acceptance Criteria:**

**Given** I have generated a formal notice PDF (mise en demeure from Epic 6)
**When** I choose to send via registered mail integration
**Then** the system transmits the document to AR24 or Maileva API with: recipient address, sender address, document PDF, registered mail options (AR — accusé de réception)
**And** the system receives a tracking number and dispatch confirmation
**And** the event RegisteredMailDispatched is stored in KurrentDB with tracking reference
**And** the StatusTimeline in Epic 6 updates with the tracking status
**And** the cost of the registered mail is displayed before confirmation

#### Story 9.3: Automatic INSEE Index Retrieval

As a bailleur,
I want the system to automatically retrieve INSEE indices (IRL/ILC/ICC) when they are published,
So that I don't need to manually look up and enter index values (FR47).

**Acceptance Criteria:**

**Given** a new quarter has passed
**When** the INSEE publishes new index values
**Then** the system automatically retrieves the latest IRL, ILC, and ICC values via INSEE API or web scraping
**And** retrieved values are stored with the same validation as manual entry (FR43)
**And** the ActionFeed displays "Nouveaux indices INSEE disponibles — Vérifiez les révisions"
**And** the bailleur can review and confirm the retrieved values before they are used for calculations
**And** if automatic retrieval fails, the system falls back to manual entry with a notification

#### Story 9.4: Grant Accountant Read-Only Access

As a bailleur,
I want to grant read-only access to my accountant scoped to specific entities,
So that they can view financial data without risking modifications (FR63).

**Acceptance Criteria:**

**Given** I am authenticated as a bailleur
**When** I invite an accountant
**Then** I can enter: accountant email, select which entities they can access
**And** the accountant receives an invitation email with a link to create their account (or log in)
**And** the accountant can view: account book, tenant current accounts, charge statements, Excel exports — for the scoped entities only
**And** the accountant CANNOT: create, modify, or delete any data (NFR12)
**And** the accountant sees a read-only UI with edit/action buttons hidden or disabled
**And** all API endpoints enforce read-only permission for accountant role
**And** the bailleur can revoke accountant access at any time

### Story Summary

| Epic | Stories | FRs Covered |
|------|---------|-------------|
| Epic 1: Foundation & Auth | 4 | FR62, FR64 |
| Epic 2: Portfolio Setup | 6 | FR1-8 |
| Epic 3: Tenant & Lease | 6 | FR9-17 |
| Epic 4: Rent Calls | 3 | FR18-20, FR27 |
| Epic 5: Bank Reconciliation | 6 | FR21-22, FR28-33, FR27 |
| Epic 6: Unpaid Management | 5 | FR24-25, FR35-41, FR27 |
| Epic 7: Revision & Charges | 8 | FR23, FR26, FR42-52, FR27 |
| Epic 8: Dashboard & Accounting | 8 | FR53-61 |
| Epic 9: Integrations | 4 | FR34, FR40, FR47, FR63 |
| **Total** | **50 stories** | **64/64 FRs** |

### Dependency Flow

```
Epic 1 (Foundation) → Epic 2 (Portfolio) → Epic 3 (Tenants/Leases)
                                                      ↓
                                              Epic 4 (Rent Calls)
                                                      ↓
                                              Epic 5 (Payments)
                                                      ↓
                                    Epic 6 (Unpaid) + Epic 7 (Revision/Charges)
                                                      ↓
                                              Epic 8 (Dashboard/Accounting)
                                                      ↓
                                              Epic 9 (Integrations)
```

Each epic is standalone: Epic 5 works without Epic 6, Epic 6 works without Epic 7, etc.
