"use client";

import * as React from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAddressSearch,
  type BanAddressSuggestion,
} from "@/hooks/use-address-search";

interface AddressAutocompleteProps {
  onSelect: (suggestion: BanAddressSuggestion) => void;
}

export function AddressAutocomplete({ onSelect }: AddressAutocompleteProps) {
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxRef = React.useRef<HTMLUListElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const instanceId = React.useId();

  const { data: suggestions = [], isFetching, isError } = useAddressSearch(query);
  const showDropdown = isOpen && suggestions.length > 0;

  React.useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(suggestion: BanAddressSuggestion) {
    onSelect(suggestion);
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          selectSuggestion(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  const listboxId = `address-autocomplete-listbox-${instanceId}`;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `address-option-${instanceId}-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-label="Rechercher une adresse"
          placeholder="Rechercher une adresse..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "border-input placeholder:text-muted-foreground h-9 w-full rounded-md border bg-transparent py-1 pl-8 pr-8 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          )}
        />
        {isFetching && (
          <Loader2 className="text-muted-foreground absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
        )}
      </div>
      {isError && query.length >= 3 && (
        <p className="text-destructive mt-1 text-xs" role="alert">
          Impossible de rechercher des adresses. Vérifiez votre connexion.
        </p>
      )}
      <div aria-live="polite" className="sr-only">
        {showDropdown
          ? `${suggestions.length} suggestion${suggestions.length > 1 ? "s" : ""} trouvée${suggestions.length > 1 ? "s" : ""}`
          : ""}
      </div>

      {showDropdown && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label="Suggestions d'adresses"
          className="bg-popover text-popover-foreground absolute z-50 mt-1 w-full overflow-hidden rounded-md border shadow-md"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.label}-${index}`}
              id={`address-option-${instanceId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                index === activeIndex && "bg-accent text-accent-foreground",
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(suggestion);
              }}
            >
              <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
              <span>{suggestion.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
