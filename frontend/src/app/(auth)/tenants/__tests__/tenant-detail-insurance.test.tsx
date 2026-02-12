import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { InsuranceStatusBadge } from "@/components/features/tenants/insurance-status-badge";

// Override Date to control "now" without fake timers (which break Promise resolution)
const OriginalDate = globalThis.Date;
let mockNow = new Date("2026-06-15T12:00:00Z");

function createMockDate() {
  const MockDate = class extends OriginalDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) {
        super(mockNow.getTime());
      } else {
        // @ts-expect-error spread args
        super(...args);
      }
    }
    static override now() {
      return mockNow.getTime();
    }
  } as DateConstructor;
  globalThis.Date = MockDate;
}

describe("InsuranceStatusBadge", () => {
  beforeEach(() => {
    mockNow = new OriginalDate("2026-06-15T12:00:00Z");
    createMockDate();
  });

  afterEach(() => {
    globalThis.Date = OriginalDate;
  });

  it("should show expired badge for past date", () => {
    renderWithProviders(
      <InsuranceStatusBadge renewalDate="2026-05-01T00:00:00.000Z" />,
    );
    expect(screen.getByText(/expirée/)).toBeInTheDocument();
  });

  it("should show expiring badge for date within 30 days", () => {
    renderWithProviders(
      <InsuranceStatusBadge renewalDate="2026-07-01T00:00:00.000Z" />,
    );
    expect(screen.getByText(/expire dans/)).toBeInTheDocument();
    expect(screen.getByText(/jour/)).toBeInTheDocument();
  });

  it("should show green badge for date far in the future", () => {
    renderWithProviders(
      <InsuranceStatusBadge renewalDate="2026-12-31T00:00:00.000Z" />,
    );
    expect(screen.queryByText(/expirée/)).not.toBeInTheDocument();
    expect(screen.queryByText(/expire dans/)).not.toBeInTheDocument();
  });

  it("should show plural 'jours' for multiple days", () => {
    renderWithProviders(
      <InsuranceStatusBadge renewalDate="2026-06-25T00:00:00.000Z" />,
    );
    expect(screen.getByText(/jours/)).toBeInTheDocument();
  });

  it("should show singular 'jour' for exactly 1 day", () => {
    renderWithProviders(
      <InsuranceStatusBadge renewalDate="2026-06-16T00:00:00.000Z" />,
    );
    expect(screen.getByText(/1 jour\b/)).toBeInTheDocument();
  });
});
