import { describe, it, expect } from "vitest";
import { tenantSchema } from "../tenant-schema";

describe("tenantSchema — insurance fields", () => {
  const validBase = {
    type: "individual",
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean@example.com",
    address: {},
  };

  it("should accept empty insurance fields", () => {
    const result = tenantSchema.safeParse({
      ...validBase,
      insuranceProvider: "",
      policyNumber: "",
      renewalDate: "",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid insurance fields", () => {
    const result = tenantSchema.safeParse({
      ...validBase,
      insuranceProvider: "MAIF",
      policyNumber: "POL-2026-001",
      renewalDate: "2026-12-31",
    });
    expect(result.success).toBe(true);
  });

  it("should accept missing insurance fields (optional)", () => {
    const result = tenantSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("should reject insuranceProvider exceeding 255 characters", () => {
    const result = tenantSchema.safeParse({
      ...validBase,
      insuranceProvider: "A".repeat(256),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("255");
    }
  });

  it("should reject policyNumber exceeding 100 characters", () => {
    const result = tenantSchema.safeParse({
      ...validBase,
      policyNumber: "A".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("100");
    }
  });
});
