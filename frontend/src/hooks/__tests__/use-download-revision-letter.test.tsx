import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
  }),
}));

const mockDownloadRevisionLetter = vi.fn();
vi.mock("@/lib/api/revisions-api", () => ({
  downloadRevisionLetter: (...args: unknown[]) =>
    mockDownloadRevisionLetter(...args),
  useRevisionsApi: () => ({
    getRevisions: vi.fn(),
    calculateRevisions: vi.fn(),
    approveRevisions: vi.fn(),
  }),
}));

import { useDownloadRevisionLetter } from "../use-download-revision-letter";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useDownloadRevisionLetter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("should trigger download on success with correct filename", async () => {
    const blob = new Blob(["pdf-content"], { type: "application/pdf" });
    mockDownloadRevisionLetter.mockResolvedValue({
      blob,
      filename: "lettre-revision-Dupont-2025-T3.pdf",
    });

    const createElementSpy = vi.spyOn(document, "createElement");
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    const { result } = renderHook(
      () => useDownloadRevisionLetter("entity-1"),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.downloadLetter("rev-1");
    });

    expect(mockDownloadRevisionLetter).toHaveBeenCalledWith(
      "entity-1",
      "rev-1",
      expect.any(Function),
    );
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    const anchorCall = createElementSpy.mock.calls.find((c) => c[0] === "a");
    expect(anchorCall).toBeDefined();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
    expect(result.current.error).toBeNull();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("should handle API error", async () => {
    mockDownloadRevisionLetter.mockRejectedValue(
      new Error("Download failed: 404"),
    );

    const { result } = renderHook(
      () => useDownloadRevisionLetter("entity-1"),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.downloadLetter("rev-1");
    });

    expect(result.current.error).toBe("Download failed: 404");
    expect(result.current.isDownloading).toBe(false);
  });

  it("should set loading state correctly", async () => {
    let resolveFn: (value: { blob: Blob; filename: string }) => void;
    mockDownloadRevisionLetter.mockReturnValue(
      new Promise<{ blob: Blob; filename: string }>((resolve) => {
        resolveFn = resolve;
      }),
    );

    const { result } = renderHook(
      () => useDownloadRevisionLetter("entity-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadingId).toBeNull();

    let downloadPromise: Promise<void>;
    act(() => {
      downloadPromise = result.current.downloadLetter("rev-1");
    });

    expect(result.current.isDownloading).toBe(true);
    expect(result.current.downloadingId).toBe("rev-1");

    await act(async () => {
      resolveFn!({ blob: new Blob(["pdf"]), filename: "test.pdf" });
      await downloadPromise!;
    });

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadingId).toBeNull();
  });
});
