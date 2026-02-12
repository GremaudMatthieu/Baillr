import { describe, it, expect } from "vitest";
import { leaseSchema } from "../lease-schema";

describe("leaseSchema", () => {
  const validData = {
    tenantId: "t1",
    unitId: "u1",
    startDate: "2026-03-01",
    rentAmount: 630,
    securityDeposit: 630,
    monthlyDueDate: 5,
    revisionIndexType: "IRL" as const,
  };

  it("should accept valid lease data", () => {
    const result = leaseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject empty tenantId", () => {
    const result = leaseSchema.safeParse({ ...validData, tenantId: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty unitId", () => {
    const result = leaseSchema.safeParse({ ...validData, unitId: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty startDate", () => {
    const result = leaseSchema.safeParse({ ...validData, startDate: "" });
    expect(result.success).toBe(false);
  });

  it("should reject negative rent amount", () => {
    const result = leaseSchema.safeParse({ ...validData, rentAmount: -1 });
    expect(result.success).toBe(false);
  });

  it("should reject zero rent amount", () => {
    const result = leaseSchema.safeParse({ ...validData, rentAmount: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject rent amount exceeding max", () => {
    const result = leaseSchema.safeParse({
      ...validData,
      rentAmount: 1000000,
    });
    expect(result.success).toBe(false);
  });

  it("should accept zero security deposit", () => {
    const result = leaseSchema.safeParse({
      ...validData,
      securityDeposit: 0,
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative security deposit", () => {
    const result = leaseSchema.safeParse({
      ...validData,
      securityDeposit: -1,
    });
    expect(result.success).toBe(false);
  });

  it("should reject monthlyDueDate below 1", () => {
    const result = leaseSchema.safeParse({
      ...validData,
      monthlyDueDate: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject monthlyDueDate above 31", () => {
    const result = leaseSchema.safeParse({
      ...validData,
      monthlyDueDate: 32,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid revision index type", () => {
    const result = leaseSchema.safeParse({
      ...validData,
      revisionIndexType: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid revision index types", () => {
    for (const type of ["IRL", "ILC", "ICC"]) {
      const result = leaseSchema.safeParse({
        ...validData,
        revisionIndexType: type,
      });
      expect(result.success).toBe(true);
    }
  });
});
