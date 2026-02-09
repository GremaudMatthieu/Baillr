import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "./use-debounce";

export interface BanAddressSuggestion {
  label: string;
  name: string;
  postcode: string;
  city: string;
}

interface BanFeature {
  properties: {
    label: string;
    name: string;
    postcode: string;
    city: string;
  };
}

interface BanResponse {
  features: BanFeature[];
}

async function searchAddresses(
  query: string,
): Promise<BanAddressSuggestion[]> {
  const url = new URL("https://data.geopf.fr/geocodage/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  url.searchParams.set("index", "address");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Address search failed: ${response.status}`);
  }

  const data: BanResponse = await response.json();
  return data.features.map((f) => ({
    label: f.properties.label,
    name: f.properties.name,
    postcode: f.properties.postcode,
    city: f.properties.city,
  }));
}

export function useAddressSearch(query: string) {
  const debouncedQuery = useDebounce(query.trim());

  return useQuery({
    queryKey: ["address-search", debouncedQuery],
    queryFn: () => searchAddresses(debouncedQuery),
    enabled: debouncedQuery.length >= 3,
    staleTime: 60_000,
    retry: 1,
    placeholderData: [],
  });
}
