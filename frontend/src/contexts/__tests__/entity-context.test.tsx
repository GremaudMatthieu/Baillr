import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { EntityProvider, useEntityContext } from "../entity-context";
import type { EntityData } from "@/lib/api/entities-api";

const mockEntities: EntityData[] = [
  {
    id: "entity-1",
    userId: "user_test123",
    type: "sci",
    name: "SCI Alpha",
    email: "test@example.com",
    siret: null,
    addressStreet: "1 Rue",
    addressPostalCode: "75001",
    addressCity: "Paris",
    addressCountry: "France",
    addressComplement: null,
    legalInformation: null,
    latePaymentDelayDays: 5,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "entity-2",
    userId: "user_test123",
    type: "nom_propre",
    name: "Jean Dupont",
    email: "test@example.com",
    siret: null,
    addressStreet: "2 Rue",
    addressPostalCode: "69001",
    addressCity: "Lyon",
    addressCountry: "France",
    addressComplement: null,
    legalInformation: null,
    latePaymentDelayDays: 5,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

const mockGetEntities = vi.fn().mockResolvedValue(mockEntities);

vi.mock("@/lib/api/entities-api", () => ({
  useEntitiesApi: () => ({
    getEntities: mockGetEntities,
    getEntity: vi.fn(),
    createEntity: vi.fn(),
    updateEntity: vi.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _reset: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <EntityProvider>{children}</EntityProvider>
      </QueryClientProvider>
    );
  };
}

describe("EntityContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock._reset();
    mockGetEntities.mockResolvedValue(mockEntities);
  });

  it("should throw when used outside EntityProvider", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    expect(() => {
      renderHook(() => useEntityContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });
    }).toThrow("useEntityContext must be used within an EntityProvider");
  });

  it("should return null entityId when no stored ID and loading", () => {
    const { result } = renderHook(() => useEntityContext(), {
      wrapper: createWrapper(),
    });

    // During loading, storedId is null (no localStorage value)
    expect(result.current.currentEntityId).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it("should resolve to first entity when stored ID is invalid", async () => {
    localStorageMock.setItem("baillr_current_entity_id", "invalid-id");

    const { result } = renderHook(() => useEntityContext(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentEntityId).toBe("entity-1");
  });

  it("should keep stored ID when it matches a loaded entity", async () => {
    localStorageMock.setItem("baillr_current_entity_id", "entity-2");

    const { result } = renderHook(() => useEntityContext(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentEntityId).toBe("entity-2");
    expect(result.current.currentEntity?.name).toBe("Jean Dupont");
  });

  it("should return null when entities list is empty", async () => {
    mockGetEntities.mockResolvedValue([]);

    const { result } = renderHook(() => useEntityContext(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentEntityId).toBeNull();
    expect(result.current.currentEntity).toBeUndefined();
  });

  it("should update localStorage when entity changes", async () => {
    const { result } = renderHook(() => useEntityContext(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setCurrentEntityId("entity-2");
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "baillr_current_entity_id",
      "entity-2",
    );
    expect(result.current.currentEntityId).toBe("entity-2");
  });

  it("should expose entities array from context", async () => {
    const { result } = renderHook(() => useEntityContext(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.entities).toHaveLength(2);
  });

  it("should read from localStorage on mount", () => {
    localStorageMock.setItem("baillr_current_entity_id", "entity-1");

    renderHook(() => useEntityContext(), {
      wrapper: createWrapper(),
    });

    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "baillr_current_entity_id",
    );
  });
});
