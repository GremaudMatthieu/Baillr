import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { InseeIndexList } from "../insee-index-list";
import type { InseeIndexData } from "@/lib/api/insee-indices-api";

const mockIndices: InseeIndexData[] = [
  {
    id: "idx-1",
    type: "IRL",
    quarter: "Q1",
    year: 2025,
    value: 142.06,
    entityId: "ent-1",
    userId: "user-1",
    source: "manual",
    createdAt: "2025-04-15T10:00:00.000Z",
  },
  {
    id: "idx-2",
    type: "IRL",
    quarter: "Q2",
    year: 2025,
    value: 143.15,
    entityId: "ent-1",
    userId: "user-1",
    source: "auto",
    createdAt: "2025-07-20T10:00:00.000Z",
  },
  {
    id: "idx-3",
    type: "ILC",
    quarter: "Q4",
    year: 2024,
    value: 134.2,
    entityId: "ent-1",
    userId: "user-1",
    source: "manual",
    createdAt: "2025-01-10T10:00:00.000Z",
  },
];

describe("InseeIndexList", () => {
  it("renders empty state when no indices", () => {
    renderWithProviders(<InseeIndexList indices={[]} />);

    expect(
      screen.getByText(
        /Aucun indice enregistré/,
      ),
    ).toBeInTheDocument();
  });

  it("renders grouped indices by type", () => {
    renderWithProviders(<InseeIndexList indices={mockIndices} />);

    expect(
      screen.getByText("IRL — Indice de Référence des Loyers"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("ILC — Indice des Loyers Commerciaux"),
    ).toBeInTheDocument();
  });

  it("renders index values in table", () => {
    renderWithProviders(<InseeIndexList indices={mockIndices} />);

    expect(screen.getByText("142.06")).toBeInTheDocument();
    expect(screen.getByText("143.15")).toBeInTheDocument();
    expect(screen.getByText("134.2")).toBeInTheDocument();
  });

  it("renders quarter labels", () => {
    renderWithProviders(<InseeIndexList indices={mockIndices} />);

    expect(screen.getAllByText("T1 (Janvier-Mars)")).toHaveLength(1);
    expect(screen.getAllByText("T2 (Avril-Juin)")).toHaveLength(1);
    expect(screen.getAllByText("T4 (Octobre-Décembre)")).toHaveLength(1);
  });

  it("renders year for each index", () => {
    renderWithProviders(<InseeIndexList indices={mockIndices} />);

    expect(screen.getAllByText("2025")).toHaveLength(2);
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("sorts indices by year desc then quarter desc within each group", () => {
    const indices: InseeIndexData[] = [
      {
        id: "a",
        type: "IRL",
        quarter: "Q1",
        year: 2024,
        value: 140,
        entityId: "e",
        userId: "u",
        source: "manual",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "b",
        type: "IRL",
        quarter: "Q3",
        year: 2025,
        value: 145,
        entityId: "e",
        userId: "u",
        source: "manual",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "c",
        type: "IRL",
        quarter: "Q1",
        year: 2025,
        value: 142,
        entityId: "e",
        userId: "u",
        source: "manual",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ];

    renderWithProviders(<InseeIndexList indices={indices} />);

    const rows = screen.getAllByRole("row");
    // Skip header row (index 0), data rows start at 1
    const cells = rows.slice(1).map((row) => row.textContent);
    // Should be: Q3 2025, Q1 2025, Q1 2024
    expect(cells[0]).toContain("145");
    expect(cells[1]).toContain("142");
    expect(cells[2]).toContain("140");
  });

  it("renders source badges for indices", () => {
    renderWithProviders(<InseeIndexList indices={mockIndices} />);

    // idx-1 is manual, idx-2 is auto
    expect(screen.getByText("Auto")).toBeInTheDocument();
    expect(screen.getAllByText("Manuel")).toHaveLength(2); // idx-1 and idx-3
  });

  it("renders Source column header", () => {
    renderWithProviders(<InseeIndexList indices={mockIndices} />);

    const headers = screen.getAllByRole("columnheader");
    const sourceHeaders = headers.filter((h) => h.textContent === "Source");
    expect(sourceHeaders.length).toBeGreaterThan(0);
  });

  it("does not render types with no data", () => {
    const irlOnly: InseeIndexData[] = [
      {
        id: "idx-1",
        type: "IRL",
        quarter: "Q1",
        year: 2025,
        value: 142.06,
        entityId: "ent-1",
        userId: "user-1",
        source: "manual",
        createdAt: "2025-04-15T10:00:00.000Z",
      },
    ];

    renderWithProviders(<InseeIndexList indices={irlOnly} />);

    expect(
      screen.getByText("IRL — Indice de Référence des Loyers"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("ILC — Indice des Loyers Commerciaux"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("ICC — Indice du Coût de la Construction"),
    ).not.toBeInTheDocument();
  });
});
