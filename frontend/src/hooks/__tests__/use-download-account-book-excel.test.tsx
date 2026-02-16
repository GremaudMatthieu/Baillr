import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDownloadAccountBookExcel } from "../use-download-account-book-excel";

const mockBlob = new Blob(["xlsx-content"], {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});

vi.mock("@/lib/api/accounting-api", () => ({
  downloadAccountBookExcel: vi.fn(),
}));

import { downloadAccountBookExcel } from "@/lib/api/accounting-api";
const mockDownload = downloadAccountBookExcel as ReturnType<typeof vi.fn>;

describe("useDownloadAccountBookExcel", () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    createObjectURLSpy = vi.fn().mockReturnValue("blob:test-url");
    revokeObjectURLSpy = vi.fn();
    globalThis.URL.createObjectURL =
      createObjectURLSpy as typeof URL.createObjectURL;
    globalThis.URL.revokeObjectURL =
      revokeObjectURLSpy as typeof URL.revokeObjectURL;
  });

  it("should download excel and trigger browser download", async () => {
    mockDownload.mockResolvedValue({
      blob: mockBlob,
      filename: "livre-comptes-sci-test-2026-02-16.xlsx",
    });

    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    const { result } = renderHook(() =>
      useDownloadAccountBookExcel("entity-1"),
    );

    await act(async () => {
      await result.current.downloadExcel({ startDate: "2026-01-01" });
    });

    expect(mockDownload).toHaveBeenCalledWith(
      "entity-1",
      { startDate: "2026-01-01" },
      expect.any(Function),
    );
    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test-url");
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should set loading state during download", async () => {
    let resolvePromise: (value: { blob: Blob; filename: string }) => void;
    mockDownload.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() =>
      useDownloadAccountBookExcel("entity-1"),
    );

    let downloadPromise: Promise<void>;
    act(() => {
      downloadPromise = result.current.downloadExcel();
    });

    expect(result.current.isDownloading).toBe(true);

    await act(async () => {
      resolvePromise!({ blob: mockBlob, filename: "test.xlsx" });
      await downloadPromise!;
    });

    expect(result.current.isDownloading).toBe(false);
  });

  it("should handle download error", async () => {
    mockDownload.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useDownloadAccountBookExcel("entity-1"),
    );

    await act(async () => {
      await result.current.downloadExcel();
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.isDownloading).toBe(false);
  });

  it("should clear error on new download", async () => {
    mockDownload
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce({ blob: mockBlob, filename: "test.xlsx" });

    const { result } = renderHook(() =>
      useDownloadAccountBookExcel("entity-1"),
    );

    await act(async () => {
      await result.current.downloadExcel();
    });

    expect(result.current.error).toBe("First error");

    await act(async () => {
      await result.current.downloadExcel();
    });

    expect(result.current.error).toBeNull();
  });
});
