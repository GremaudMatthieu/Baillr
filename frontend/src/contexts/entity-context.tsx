"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useEntities } from "@/hooks/use-entities";
import type { EntityData } from "@/lib/api/entities-api";

const STORAGE_KEY = "baillr_current_entity_id";

interface EntityContextValue {
  currentEntityId: string | null;
  setCurrentEntityId: (id: string) => void;
  currentEntity: EntityData | undefined;
  entities: EntityData[] | undefined;
  isLoading: boolean;
}

const EntityContext = createContext<EntityContextValue | null>(null);

function resolveEntityId(
  storedId: string | null,
  entities: EntityData[] | undefined,
  isLoading: boolean,
): string | null {
  if (isLoading || !entities) return storedId;
  if (entities.length === 0) return null;
  const isValid = storedId && entities.some((e) => e.id === storedId);
  return isValid ? storedId : entities[0].id;
}

export function EntityProvider({ children }: { children: ReactNode }) {
  const { data: entities, isLoading } = useEntities();
  const [storedId, setStoredId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const setCurrentEntityId = useCallback((id: string) => {
    setStoredId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  // Derive resolved ID from stored + entities (pure computation, no side effects)
  const resolvedId = resolveEntityId(storedId, entities, isLoading);

  // Sync storedId to match resolvedId when entities finish loading
  // This uses the "sync state during render" pattern accepted by React:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (!isLoading && entities && resolvedId !== storedId) {
    setStoredId(resolvedId);
    if (typeof window !== "undefined") {
      if (resolvedId === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, resolvedId);
      }
    }
  }

  const currentEntity = entities?.find((e) => e.id === resolvedId);

  return (
    <EntityContext value={{ currentEntityId: resolvedId, setCurrentEntityId, currentEntity, entities, isLoading }}>
      {children}
    </EntityContext>
  );
}

export function useEntityContext(): EntityContextValue {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error("useEntityContext must be used within an EntityProvider");
  }
  return context;
}
