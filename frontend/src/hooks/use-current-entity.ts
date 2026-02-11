"use client";

import { useEntityContext } from "@/contexts/entity-context";

export function useCurrentEntity() {
  const { currentEntityId, currentEntity, setCurrentEntityId, entities, isLoading } =
    useEntityContext();

  return {
    entityId: currentEntityId,
    entity: currentEntity,
    entities,
    setEntityId: setCurrentEntityId,
    isLoading,
  };
}
