import { vi } from "vitest";

export const mockPush = vi.fn();
export const mockBack = vi.fn();
export const mockReplace = vi.fn();
export const mockRefresh = vi.fn();

export const mockRouter = {
  push: mockPush,
  back: mockBack,
  replace: mockReplace,
  refresh: mockRefresh,
  prefetch: vi.fn(),
  forward: vi.fn(),
};

export const mockPathname = vi.fn(() => "/dashboard");
export const mockParams = vi.fn(() => ({}));
export const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname(),
  useParams: () => mockParams(),
  useSearchParams: () => mockSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));
