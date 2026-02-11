"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Settings } from "lucide-react";
import { useEntityContext } from "@/contexts/entity-context";
import type { EntityData } from "@/lib/api/entities-api";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function getEntityTypeLabel(type: "sci" | "nom_propre"): string {
  return type === "sci" ? "SCI" : "Nom propre";
}

function getEntityInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function EntityDropdownItems({
  entities,
  currentEntityId,
  onSelect,
  onNavigate,
}: {
  entities: EntityData[];
  currentEntityId: string | null;
  onSelect: (id: string) => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <DropdownMenuGroup>
        {entities.map((entity) => (
          <DropdownMenuItem
            key={entity.id}
            onSelect={() => onSelect(entity.id)}
          >
            <div className="flex flex-1 items-center gap-2">
              {entity.id === currentEntityId ? (
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <span className="h-4 w-4 shrink-0" />
              )}
              <span className="flex-1 truncate">{entity.name}</span>
              <Badge
                variant={entity.type === "sci" ? "default" : "secondary"}
                className="text-[10px]"
              >
                {getEntityTypeLabel(entity.type)}
              </Badge>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/entities" className="gap-2" onClick={onNavigate}>
          <Settings className="h-4 w-4" aria-hidden="true" />
          <span>Gérer les entités</span>
        </Link>
      </DropdownMenuItem>
    </>
  );
}

interface EntitySwitcherProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function EntitySwitcher({ collapsed, onNavigate }: EntitySwitcherProps) {
  const { currentEntityId, setCurrentEntityId, currentEntity, entities, isLoading } =
    useEntityContext();
  const pathname = usePathname();
  const router = useRouter();

  function handleEntitySwitch(id: string) {
    onNavigate?.();
    if (id === currentEntityId) return;
    setCurrentEntityId(id);
    if (pathname !== "/dashboard" && pathname !== "/entities") {
      router.push("/dashboard");
    }
  }

  // Loading state
  if (isLoading) {
    if (collapsed) {
      return (
        <div className="flex justify-center px-2 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      );
    }
    return (
      <div className="px-4 py-3">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    );
  }

  // No entities state (AC: 5)
  if (!entities || entities.length === 0) {
    if (collapsed) {
      return (
        <div className="flex justify-center px-2 py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/entities/new"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium hover:bg-sidebar-accent/80 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="Créer une entité"
              >
                +
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Aucune entité — Créer
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }
    return (
      <div className="px-4 py-3">
        <Link
          href="/entities/new"
          className="flex items-center gap-2 rounded-md border border-dashed border-sidebar-border px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="Créer votre première entité"
        >
          <span className="text-lg leading-none">+</span>
          <span>Aucune entité</span>
        </Link>
      </div>
    );
  }

  // Single entity — display only, no dropdown (AC: 4)
  if (entities.length === 1) {
    const entity = entities[0];
    if (collapsed) {
      return (
        <div className="flex justify-center px-2 py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex h-8 w-8 items-center justify-center"
                aria-label={`Entité : ${entity.name}`}
              >
                <Avatar>
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                    {getEntityInitials(entity.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {entity.name} — {getEntityTypeLabel(entity.type)}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-md px-3 py-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {entity.name}
            </span>
            <Badge
              variant={entity.type === "sci" ? "default" : "secondary"}
              className="mt-0.5 w-fit text-[10px]"
            >
              {getEntityTypeLabel(entity.type)}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  // Multiple entities — dropdown (AC: 1, 2)
  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-sidebar-accent/80 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="Sélecteur d'entité"
          >
            <Avatar>
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                {currentEntity
                  ? getEntityInitials(currentEntity.name)
                  : "?"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56">
            <EntityDropdownItems
              entities={entities}
              currentEntityId={currentEntityId}
              onSelect={handleEntitySwitch}
              onNavigate={onNavigate}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-sidebar-accent/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="Sélecteur d'entité"
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {currentEntity?.name ?? "Sélectionner"}
            </span>
            {currentEntity && (
              <Badge
                variant={
                  currentEntity.type === "sci" ? "default" : "secondary"
                }
                className="mt-0.5 w-fit text-[10px]"
              >
                {getEntityTypeLabel(currentEntity.type)}
              </Badge>
            )}
          </div>
          <ChevronsUpDown
            className="h-4 w-4 shrink-0 text-sidebar-foreground/50"
            aria-hidden="true"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <EntityDropdownItems
            entities={entities}
            currentEntityId={currentEntityId}
            onSelect={handleEntitySwitch}
            onNavigate={onNavigate}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
