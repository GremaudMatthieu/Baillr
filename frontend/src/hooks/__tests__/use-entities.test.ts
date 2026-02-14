import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useEntities, useCreateEntity, useUpdateEntity } from "../use-entities";
import type { EntityData } from "@/lib/api/entities-api";

const mockEntities: EntityData[] = [
  {
    id: "entity-1",
    userId: "user_test123",
    type: "sci",
    name: "SCI Les Pins",
    email: "test@example.com",
    siret: "12345678901234",
    addressStreet: "12 Rue des Lilas",
    addressPostalCode: "75001",
    addressCity: "Paris",
    addressCountry: "France",
    addressComplement: null,
    legalInformation: null,
    latePaymentDelayDays: 5,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

const mockGetEntities = vi.fn().mockResolvedValue(mockEntities);
const mockCreateEntity = vi.fn().mockResolvedValue(undefined);
const mockUpdateEntity = vi.fn().mockResolvedValue(undefined);
const mockGetEntity = vi.fn();
const mockConfigureLatePaymentDelay = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/api/entities-api", () => ({
  useEntitiesApi: () => ({
    getEntities: mockGetEntities,
    getEntity: mockGetEntity,
    createEntity: mockCreateEntity,
    updateEntity: mockUpdateEntity,
    configureLatePaymentDelay: mockConfigureLatePaymentDelay,
  }),
}));

const newEntityPayload = {
  id: "entity-2",
  type: "nom_propre" as const,
  name: "Jean Dupont",
  email: "test@example.com",
  address: {
    street: "5 Avenue Victor Hugo",
    postalCode: "69001",
    city: "Lyon",
    country: "France",
  },
};

describe("useEntities", () => {
  it("should fetch entities", async () => {
    const { result } = renderHookWithProviders(() => useEntities());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEntities);
    expect(mockGetEntities).toHaveBeenCalledOnce();
  });
});

describe("useCreateEntity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should apply optimistic update on create", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() => useCreateEntity());
    queryClient.setQueryData(["entities"], mockEntities);

    await act(async () => {
      result.current.mutate(newEntityPayload);
    });

    const data = queryClient.getQueryData<EntityData[]>(["entities"]);
    expect(data).toHaveLength(2);
    expect(data?.[1]?.name).toBe("Jean Dupont");
    vi.useRealTimers();
  });

  it("should rollback on error", async () => {
    mockCreateEntity.mockRejectedValueOnce(new Error("Server error"));

    const { result, queryClient } = renderHookWithProviders(() => useCreateEntity());
    queryClient.setQueryData(["entities"], mockEntities);

    act(() => {
      result.current.mutate(newEntityPayload);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const data = queryClient.getQueryData<EntityData[]>(["entities"]);
    expect(data).toHaveLength(1);
    expect(data?.[0]?.id).toBe("entity-1");
  });

  it("should call invalidateQueries in onSettled with delayed pattern", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() => useCreateEntity());
    queryClient.setQueryData(["entities"], mockEntities);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await act(async () => {
      result.current.mutate(newEntityPayload);
    });

    // Mutation succeeds synchronously (mocked), but setTimeout hasn't fired yet
    expect(invalidateSpy).not.toHaveBeenCalled();

    // Advance past the 1500ms delay
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["entities"] });
    vi.useRealTimers();
  });
});

describe("useUpdateEntity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should apply optimistic update on update", async () => {
    const { result, queryClient } = renderHookWithProviders(() => useUpdateEntity());
    queryClient.setQueryData(["entities"], mockEntities);

    await act(async () => {
      result.current.mutate({
        id: "entity-1",
        payload: { name: "SCI Les Chênes" },
      });
    });

    const data = queryClient.getQueryData<EntityData[]>(["entities"]);
    expect(data?.[0]?.name).toBe("SCI Les Chênes");
  });
});
