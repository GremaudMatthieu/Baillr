"use client";

import * as React from "react";
import { Loader2, Search, Landmark } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInstitutions } from "@/hooks/use-bank-connections";
import type { InstitutionData } from "@/lib/api/open-banking-api";

interface ConnectBankDialogProps {
  entityId: string;
  bankAccountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectInstitution: (institution: InstitutionData) => void;
  isPending: boolean;
}

export function ConnectBankDialog({
  entityId,
  bankAccountId,
  open,
  onOpenChange,
  onSelectInstitution,
  isPending,
}: ConnectBankDialogProps) {
  const { data: institutions, isLoading } = useInstitutions(entityId);
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    if (!institutions) return [];
    if (!search.trim()) return institutions;
    const term = search.toLowerCase();
    return institutions.filter((inst) =>
      inst.name.toLowerCase().includes(term),
    );
  }, [institutions, search]);

  function handleConnect() {
    const institution = institutions?.find((i) => i.id === selectedId);
    if (institution) {
      onSelectInstitution(institution);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Connecter ma banque</AlertDialogTitle>
          <AlertDialogDescription>
            Sélectionnez votre banque pour connecter automatiquement vos
            relevés via Open Banking.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Rechercher une banque..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Rechercher une banque"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Landmark
                className="h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Aucune banque trouvée
              </p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <ul
                className="space-y-1"
                role="listbox"
                aria-label="Banques disponibles"
              >
                {filtered.map((inst) => (
                  <li key={inst.id} role="option" aria-selected={inst.id === selectedId}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(inst.id)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                        inst.id === selectedId
                          ? "bg-accent ring-2 ring-primary"
                          : ""
                      }`}
                    >
                      {inst.logo ? (
                        <img
                          src={inst.logo}
                          alt=""
                          className="h-8 w-8 rounded object-contain"
                          aria-hidden="true"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                          <Landmark className="h-4 w-4" aria-hidden="true" />
                        </div>
                      )}
                      <span className="font-medium">{inst.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleConnect();
            }}
            disabled={!selectedId || isPending}
          >
            {isPending && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Connecter
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
