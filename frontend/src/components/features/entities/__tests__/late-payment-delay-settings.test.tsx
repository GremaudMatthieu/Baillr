import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LatePaymentDelaySettings } from "../late-payment-delay-settings";

const mockMutate = vi.fn();
vi.mock("@/hooks/use-configure-late-payment-delay", () => ({
  useConfigureLatePaymentDelay: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("LatePaymentDelaySettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display current delay value in read mode", () => {
    renderWithProviders(
      <LatePaymentDelaySettings entityId="entity-1" currentDelay={5} />,
    );

    expect(screen.getByText("5 jours")).toBeInTheDocument();
    expect(
      screen.getByText("Délai de retard de paiement :"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Modifier" }),
    ).toBeInTheDocument();
  });

  it("should display singular for 1 jour", () => {
    renderWithProviders(
      <LatePaymentDelaySettings entityId="entity-1" currentDelay={1} />,
    );

    expect(screen.getByText("1 jour")).toBeInTheDocument();
  });

  it("should display singular for 0 jour", () => {
    renderWithProviders(
      <LatePaymentDelaySettings entityId="entity-1" currentDelay={0} />,
    );

    expect(screen.getByText("0 jour")).toBeInTheDocument();
  });

  it("should switch to edit mode on click Modifier", async () => {
    renderWithProviders(
      <LatePaymentDelaySettings entityId="entity-1" currentDelay={5} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Modifier" }));

    expect(screen.getByLabelText("Délai (jours)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enregistrer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Annuler" }),
    ).toBeInTheDocument();
  });

  it("should call mutate with new value on save", async () => {
    mockMutate.mockImplementation((_days: number, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });

    renderWithProviders(
      <LatePaymentDelaySettings entityId="entity-1" currentDelay={5} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Modifier" }));

    const input = screen.getByLabelText("Délai (jours)");
    await userEvent.clear(input);
    await userEvent.type(input, "10");

    await userEvent.click(
      screen.getByRole("button", { name: "Enregistrer" }),
    );

    expect(mockMutate).toHaveBeenCalledWith(10, expect.any(Object));
  });

  it("should cancel editing and revert value", async () => {
    renderWithProviders(
      <LatePaymentDelaySettings entityId="entity-1" currentDelay={5} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Modifier" }));

    const input = screen.getByLabelText("Délai (jours)");
    await userEvent.clear(input);
    await userEvent.type(input, "10");

    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));

    // Should be back in read mode with original value
    expect(screen.getByText("5 jours")).toBeInTheDocument();
  });
});
