"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type SearchType = "shots" | "designers" | "services";

type SearchStateValue = {
  query: string;
  setQuery: (value: string) => void;
  type: SearchType;
  setType: (value: SearchType) => void;
  searchTab: "shots" | "designers";
};

const SearchStateContext = createContext<SearchStateValue | null>(null);

export function SearchStateProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("shots");

  return (
    <SearchStateContext.Provider
      value={{
        query,
        setQuery,
        type,
        setType,
        searchTab: type === "designers" ? "designers" : "shots",
      }}
    >
      {children}
    </SearchStateContext.Provider>
  );
}

export function useSearchState() {
  const value = useContext(SearchStateContext);

  if (!value) {
    throw new Error("useSearchState must be used inside SearchStateProvider");
  }

  return value;
}
