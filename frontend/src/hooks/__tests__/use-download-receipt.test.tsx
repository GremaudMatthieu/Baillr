import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDownloadReceipt } from "../use-download-receipt";

const mockBlob = new Blob(["%PDF-1.3"], { type: "application/pdf" });

vi.mock("@/lib/api/rent-calls-api", () => ({
  downloadReceiptPdf: vi.fn(),
}));

import { downloadReceiptPdf } from "@/lib/api/rent-calls-api";
const mockDownloadReceiptPdf = downloadReceiptPdf as ReturnType<typeof vi.fn>;

describe("useDownloadReceipt", () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLSpy = vi.fn().mockReturnValue("blob:test-url");
    revokeObjectURLSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLSpy as typeof URL.createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy as typeof URL.revokeObjectURL;
  });

  it("should download receipt and trigger browser download", async () => {
    mockDownloadReceiptPdf.mockResolvedValue({
      blob: mockBlob,
      filename: "quittance-DUPONT-2026-02.pdf",
    });

    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    const { result } = renderHook(() => useDownloadReceipt("entity-1"));

    await act(async () => {
      await result.current.downloadReceipt("rc-1");
    });

    expect(mockDownloadReceiptPdf).toHaveBeenCalledWith(
      "entity-1",
      "rc-1",
      expect.any(Function),
    );
    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test-url");
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadingId).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should set loading state during download", async () => {
    let resolvePromise: (value: { blob: Blob; filename: string }) => void;
    mockDownloadReceiptPdf.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useDownloadReceipt("entity-1"));

    let downloadPromise: Promise<void>;
    act(() => {
      downloadPromise = result.current.downloadReceipt("rc-1");
    });

    expect(result.current.isDownloading).toBe(true);
    expect(result.current.downloadingId).toBe("rc-1");

    await act(async () => {
      resolvePromise!({ blob: mockBlob, filename: "test.pdf" });
      await downloadPromise!;
    });

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadingId).toBeNull();
  });

  it("should handle download error", async () => {
    mockDownloadReceiptPdf.mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useDownloadReceipt("entity-1"));

    await act(async () => {
      await result.current.downloadReceipt("rc-1");
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.isDownloading).toBe(false);
  });

  it("should clear error on new download", async () => {
    mockDownloadReceiptPdf
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce({ blob: mockBlob, filename: "test.pdf" });

    const { result } = renderHook(() => useDownloadReceipt("entity-1"));

    await act(async () => {
      await result.current.downloadReceipt("rc-1");
    });

    expect(result.current.error).toBe("First error");

    await act(async () => {
      await result.current.downloadReceipt("rc-2");
    });

    expect(result.current.error).toBeNull();
  });
});
