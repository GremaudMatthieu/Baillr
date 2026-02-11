import { describe, it, expect } from "vitest";

describe("Smoke test", () => {
  it("should run vitest successfully", () => {
    expect(1 + 1).toBe(2);
  });

  it("should have access to jsdom environment", () => {
    expect(typeof document).toBe("object");
    expect(typeof window).toBe("object");
  });
});
