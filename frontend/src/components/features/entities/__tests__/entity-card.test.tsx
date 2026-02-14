import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { EntityCard } from "../entity-card";
import type { EntityData } from "@/lib/api/entities-api";

const sciEntity: EntityData = {
  id: "entity-1",
  userId: "user_test123",
  type: "sci",
  name: "SCI Les Oliviers",
  email: "test@example.com",
  siret: "12345678901234",
  addressStreet: "12 Rue des Lilas",
  addressPostalCode: "75001",
  addressCity: "Paris",
  addressCountry: "France",
  addressComplement: "Bâtiment B",
  legalInformation: "Capital 10 000€",
  latePaymentDelayDays: 5,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const nomPropreEntity: EntityData = {
  id: "entity-2",
  userId: "user_test123",
  type: "nom_propre",
  name: "Jean Dupont",
  email: "test@example.com",
  siret: null,
  addressStreet: "5 Avenue Victor Hugo",
  addressPostalCode: "69001",
  addressCity: "Lyon",
  addressCountry: "France",
  addressComplement: null,
  legalInformation: null,
  latePaymentDelayDays: 5,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("EntityCard", () => {
  it("should render entity name", () => {
    renderWithProviders(<EntityCard entity={sciEntity} />);
    expect(screen.getByText("SCI Les Oliviers")).toBeInTheDocument();
  });

  it("should display SCI type label in description", () => {
    renderWithProviders(<EntityCard entity={sciEntity} />);
    // Description contains "SCI — SIRET ..." so look for text containing both SCI type and SIRET
    expect(
      screen.getByText((content) =>
        content.includes("SCI") && content.includes("SIRET"),
      ),
    ).toBeInTheDocument();
  });

  it("should display Nom propre type label", () => {
    renderWithProviders(<EntityCard entity={nomPropreEntity} />);
    expect(screen.getByText(/Nom propre/)).toBeInTheDocument();
  });

  it("should display SIRET when present", () => {
    renderWithProviders(<EntityCard entity={sciEntity} />);
    expect(screen.getByText(/SIRET 12345678901234/)).toBeInTheDocument();
  });

  it("should not display SIRET when null", () => {
    renderWithProviders(<EntityCard entity={nomPropreEntity} />);
    expect(screen.queryByText(/SIRET/)).not.toBeInTheDocument();
  });

  it("should display full address with complement", () => {
    renderWithProviders(<EntityCard entity={sciEntity} />);
    expect(
      screen.getByText(/12 Rue des Lilas.*Bâtiment B.*75001 Paris/),
    ).toBeInTheDocument();
  });

  it("should display address without complement", () => {
    renderWithProviders(<EntityCard entity={nomPropreEntity} />);
    expect(
      screen.getByText(/5 Avenue Victor Hugo.*69001 Lyon/),
    ).toBeInTheDocument();
  });

  it("should display legal information when present", () => {
    renderWithProviders(<EntityCard entity={sciEntity} />);
    expect(screen.getByText("Capital 10 000€")).toBeInTheDocument();
  });

  it("should not display legal information when null", () => {
    renderWithProviders(<EntityCard entity={nomPropreEntity} />);
    expect(screen.queryByText(/Capital/)).not.toBeInTheDocument();
  });

  it("should render edit link with accessible label", () => {
    renderWithProviders(<EntityCard entity={sciEntity} />);
    const editLink = screen.getByRole("link", {
      name: "Modifier SCI Les Oliviers",
    });
    expect(editLink).toHaveAttribute("href", "/entities/entity-1/edit");
  });
});
