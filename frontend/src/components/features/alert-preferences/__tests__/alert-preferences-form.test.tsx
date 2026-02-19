import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AlertPreferencesForm } from "../alert-preferences-form";

const mockUseAlertPreferences = vi.fn();
const mockMutate = vi.fn();
const mockUseUpdateAlertPreferences = vi.fn();

vi.mock("@/hooks/use-alert-preferences", () => ({
  useAlertPreferences: (...args: unknown[]) => mockUseAlertPreferences(...args),
  useUpdateAlertPreferences: (...args: unknown[]) =>
    mockUseUpdateAlertPreferences(...args),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("AlertPreferencesForm", () => {
  const entityId = "11111111-1111-1111-1111-111111111111";

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUpdateAlertPreferences.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it("should show loading state", () => {
    mockUseAlertPreferences.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderWithProviders(<AlertPreferencesForm entityId={entityId} />);

    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("should render toggle switches for each alert type", () => {
    mockUseAlertPreferences.mockReturnValue({
      data: [
        { alertType: "unpaid_rent", enabled: true },
        { alertType: "insurance_expiring", enabled: true },
        { alertType: "escalation_threshold", enabled: false },
      ],
      isLoading: false,
    });

    renderWithProviders(<AlertPreferencesForm entityId={entityId} />);

    expect(screen.getByText("Loyers impayés")).toBeInTheDocument();
    expect(screen.getByText("Assurances expirantes")).toBeInTheDocument();
    expect(screen.getByText("Relances impayés")).toBeInTheDocument();
  });

  it("should render correct checked/unchecked state", () => {
    mockUseAlertPreferences.mockReturnValue({
      data: [
        { alertType: "unpaid_rent", enabled: true },
        { alertType: "insurance_expiring", enabled: false },
        { alertType: "escalation_threshold", enabled: true },
      ],
      isLoading: false,
    });

    renderWithProviders(<AlertPreferencesForm entityId={entityId} />);

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(3);
    expect(switches[0]).toHaveAttribute("data-state", "checked");
    expect(switches[1]).toHaveAttribute("data-state", "unchecked");
    expect(switches[2]).toHaveAttribute("data-state", "checked");
  });

  it("should call mutation on toggle change", async () => {
    const user = userEvent.setup();
    mockUseAlertPreferences.mockReturnValue({
      data: [
        { alertType: "unpaid_rent", enabled: true },
        { alertType: "insurance_expiring", enabled: true },
        { alertType: "escalation_threshold", enabled: true },
      ],
      isLoading: false,
    });

    renderWithProviders(<AlertPreferencesForm entityId={entityId} />);

    const switches = screen.getAllByRole("switch");
    await user.click(switches[0]);

    expect(mockMutate).toHaveBeenCalledWith({
      preferences: [{ alertType: "unpaid_rent", enabled: false }],
    });
  });

  it("should render nothing when data is undefined and not loading", () => {
    mockUseAlertPreferences.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { container } = renderWithProviders(
      <AlertPreferencesForm entityId={entityId} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("should have accessible labels for each switch", () => {
    mockUseAlertPreferences.mockReturnValue({
      data: [
        { alertType: "unpaid_rent", enabled: true },
        { alertType: "insurance_expiring", enabled: false },
      ],
      isLoading: false,
    });

    renderWithProviders(<AlertPreferencesForm entityId={entityId} />);

    expect(
      screen.getByLabelText(/désactiver les alertes loyers impayés/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/activer les alertes assurances expirantes/i),
    ).toBeInTheDocument();
  });
});
