import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCurrentEntity } from "../use-current-entity";

const mockEntityContext = {
  currentEntityId: "entity-1",
  currentEntity: { id: "entity-1", name: "Test Entity" },
  setCurrentEntityId: vi.fn(),
  entities: [{ id: "entity-1", name: "Test Entity" }],
  isLoading: false,
};

vi.mock("@/contexts/entity-context", () => ({
  useEntityContext: () => mockEntityContext,
}));

describe("useCurrentEntity", () => {
  it("should return entityId from context", () => {
    const { result } = renderHook(() => useCurrentEntity());
    expect(result.current.entityId).toBe("entity-1");
  });

  it("should return entity from context", () => {
    const { result } = renderHook(() => useCurrentEntity());
    expect(result.current.entity).toEqual({ id: "entity-1", name: "Test Entity" });
  });

  it("should return entities from context", () => {
    const { result } = renderHook(() => useCurrentEntity());
    expect(result.current.entities).toHaveLength(1);
  });

  it("should return setEntityId function", () => {
    const { result } = renderHook(() => useCurrentEntity());
    expect(typeof result.current.setEntityId).toBe("function");
  });

  it("should return isLoading from context", () => {
    const { result } = renderHook(() => useCurrentEntity());
    expect(result.current.isLoading).toBe(false);
  });

  it("should return null entityId when context has null", () => {
    mockEntityContext.currentEntityId = null as unknown as string;
    const { result } = renderHook(() => useCurrentEntity());
    expect(result.current.entityId).toBeNull();
    mockEntityContext.currentEntityId = "entity-1";
  });
});
