import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import {
  useEscalationStatus,
  useSendReminderEmail,
  useRegisteredMailStatus,
  useRegisteredMailCost,
  useSendRegisteredMail,
} from "../use-escalation";
import type { EscalationStatusData } from "@/lib/api/escalation-api";

const mockEscalation: EscalationStatusData = {
  rentCallId: "rc-1",
  tier1SentAt: "2026-02-10T10:00:00Z",
  tier1RecipientEmail: "jean@test.com",
  tier2SentAt: null,
  tier3SentAt: null,
  registeredMailTrackingId: null,
  registeredMailProvider: null,
  registeredMailCostCents: null,
  registeredMailDispatchedAt: null,
  registeredMailStatus: null,
  registeredMailProofUrl: null,
};

const mockGetEscalationStatus = vi.fn().mockResolvedValue(mockEscalation);
const mockSendReminderEmail = vi.fn().mockResolvedValue({ sent: true });
const mockGetRegisteredMailCost = vi
  .fn()
  .mockResolvedValue({ costCentsHt: 399, costCentsTtc: 479 });
const mockSendRegisteredMail = vi
  .fn()
  .mockResolvedValue({ trackingId: "LRE-001", status: "waiting", costCentsTtc: 479 });
const mockFetchRegisteredMailStatus = vi
  .fn()
  .mockResolvedValue({ available: true });

vi.mock("@/lib/api/escalation-api", () => ({
  useEscalationApi: () => ({
    getEscalationStatus: mockGetEscalationStatus,
    sendReminderEmail: mockSendReminderEmail,
    getRegisteredMailCost: mockGetRegisteredMailCost,
    sendRegisteredMail: mockSendRegisteredMail,
  }),
  downloadFormalNoticePdf: vi.fn(),
  downloadStakeholderLetterPdf: vi.fn(),
  fetchRegisteredMailStatus: (...args: unknown[]) =>
    mockFetchRegisteredMailStatus(...args),
}));

describe("useEscalationStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch escalation status for rent call", async () => {
    const { result } = renderHookWithProviders(() =>
      useEscalationStatus("entity-1", "rc-1"),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEscalation);
    expect(mockGetEscalationStatus).toHaveBeenCalledWith("entity-1", "rc-1");
  });

  it("should not fetch when rentCallId is null", () => {
    const { result } = renderHookWithProviders(() =>
      useEscalationStatus("entity-1", null),
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockGetEscalationStatus).not.toHaveBeenCalled();
  });

  it("should not fetch when entityId is empty", () => {
    const { result } = renderHookWithProviders(() =>
      useEscalationStatus("", "rc-1"),
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockGetEscalationStatus).not.toHaveBeenCalled();
  });
});

describe("useSendReminderEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call sendReminderEmail with entityId and rentCallId", async () => {
    const { result } = renderHookWithProviders(() =>
      useSendReminderEmail("entity-1"),
    );

    result.current.mutate("rc-1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSendReminderEmail).toHaveBeenCalledWith("entity-1", "rc-1");
  });
});

describe("useRegisteredMailStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch registered mail availability", async () => {
    const { result } = renderHookWithProviders(() =>
      useRegisteredMailStatus(),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ available: true });
    expect(mockFetchRegisteredMailStatus).toHaveBeenCalled();
  });
});

describe("useRegisteredMailCost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch cost for entity", async () => {
    const { result } = renderHookWithProviders(() =>
      useRegisteredMailCost("entity-1"),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ costCentsHt: 399, costCentsTtc: 479 });
    expect(mockGetRegisteredMailCost).toHaveBeenCalledWith("entity-1");
  });

  it("should not fetch when entityId is empty", () => {
    const { result } = renderHookWithProviders(() =>
      useRegisteredMailCost(""),
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockGetRegisteredMailCost).not.toHaveBeenCalled();
  });
});

describe("useSendRegisteredMail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call sendRegisteredMail with entityId and rentCallId", async () => {
    const { result } = renderHookWithProviders(() =>
      useSendRegisteredMail("entity-1"),
    );

    result.current.mutate("rc-1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSendRegisteredMail).toHaveBeenCalledWith("entity-1", "rc-1");
  });
});
