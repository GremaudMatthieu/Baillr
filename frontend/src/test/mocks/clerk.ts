import { vi } from "vitest";

export const mockGetToken = vi.fn().mockResolvedValue("test-token");

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: mockGetToken,
    isLoaded: true,
    isSignedIn: true,
    userId: "user_test123",
  }),
  useUser: () => ({
    user: {
      id: "user_test123",
      firstName: "Test",
      lastName: "User",
      fullName: "Test User",
      primaryEmailAddress: { emailAddress: "test@example.com" },
      imageUrl: "https://example.com/avatar.png",
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: () => null,
  SignUpButton: () => null,
  UserButton: () => null,
}));
