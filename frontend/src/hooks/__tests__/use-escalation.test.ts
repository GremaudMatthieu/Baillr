import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useEscalationStatus, useSendReminderEmail } from "../use-escalation";
import type { EscalationStatusData } from "@/lib/api/escalation-api";

const mockEscalation: EscalationStatusData = {
  rentCallId: "rc-1",
  tier1SentAt: "2026-02-10T10:00:00Z",
  tier1RecipientEmail: "jean@test.com",
  tier2SentAt: null,
  tier3SentAt: null,
};

const mockGetEscalationStatus = vi.fn().mockResolvedValue(mockEscalation);
const mockSendReminderEmail = vi.fn().mockResolvedValue({ sent: true });

vi.mock("@/lib/api/escalation-api", () => ({
  useEscalationApi: () => ({
    getEscalationStatus: mockGetEscalationStatus,
    sendReminderEmail: mockSendReminderEmail,
  }),
  downloadFormalNoticePdf: vi.fn(),
  downloadStakeholderLetterPdf: vi.fn(),
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
