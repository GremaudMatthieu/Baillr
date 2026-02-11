import { describe, it, expect } from "vitest";
import { unitSchema, billableOptionSchema } from "../unit-schema";

const validUnit = {
  identifier: "Apt 101",
  type: "apartment" as const,
  floor: 1,
  surfaceArea: 45.5,
  billableOptions: [
    { label: "Loyer", amountCents: 85000 },
  ],
};

describe("unitSchema", () => {
  it("should accept a valid unit", () => {
    const result = unitSchema.safeParse(validUnit);
    expect(result.success).toBe(true);
  });

  it.each(["apartment", "parking", "commercial", "storage"] as const)(
    "should accept type %s",
    (type) => {
      const result = unitSchema.safeParse({ ...validUnit, type });
      expect(result.success).toBe(true);
    },
  );

  it("should reject invalid type", () => {
    const result = unitSchema.safeParse({ ...validUnit, type: "office" });
    expect(result.success).toBe(false);
  });

  it("should reject missing identifier", () => {
    const result = unitSchema.safeParse({ ...validUnit, identifier: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("L'identifiant est requis");
    }
  });

  it("should reject identifier exceeding 100 characters", () => {
    const result = unitSchema.safeParse({
      ...validUnit,
      identifier: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional floor as undefined", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { floor: _floor, ...withoutFloor } = validUnit;
    const result = unitSchema.safeParse(withoutFloor);
    expect(result.success).toBe(true);
  });

  it("should accept NaN as floor value", () => {
    const result = unitSchema.safeParse({ ...validUnit, floor: NaN });
    expect(result.success).toBe(true);
  });

  it("should accept negative floor (sous-sol)", () => {
    const result = unitSchema.safeParse({ ...validUnit, floor: -1 });
    expect(result.success).toBe(true);
  });

  it("should reject non-integer floor", () => {
    const result = unitSchema.safeParse({ ...validUnit, floor: 1.5 });
    expect(result.success).toBe(false);
  });

  it("should require positive surfaceArea", () => {
    const result = unitSchema.safeParse({ ...validUnit, surfaceArea: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "La surface doit être positive",
      );
    }
  });

  it("should reject negative surfaceArea", () => {
    const result = unitSchema.safeParse({ ...validUnit, surfaceArea: -10 });
    expect(result.success).toBe(false);
  });

  it("should accept decimal surfaceArea", () => {
    const result = unitSchema.safeParse({ ...validUnit, surfaceArea: 45.75 });
    expect(result.success).toBe(true);
  });

  it("should reject non-number surfaceArea", () => {
    const result = unitSchema.safeParse({ ...validUnit, surfaceArea: "45" });
    expect(result.success).toBe(false);
  });

  it("should accept empty billableOptions array", () => {
    const result = unitSchema.safeParse({ ...validUnit, billableOptions: [] });
    expect(result.success).toBe(true);
  });

  it("should accept undefined billableOptions", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { billableOptions: _billableOptions, ...withoutOptions } = validUnit;
    const result = unitSchema.safeParse(withoutOptions);
    expect(result.success).toBe(true);
  });

  it("should accept multiple billable options", () => {
    const result = unitSchema.safeParse({
      ...validUnit,
      billableOptions: [
        { label: "Loyer", amountCents: 85000 },
        { label: "Charges", amountCents: 15000 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("billableOptionSchema", () => {
  it("should accept a valid billable option", () => {
    const result = billableOptionSchema.safeParse({
      label: "Loyer",
      amountCents: 85000,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty label", () => {
    const result = billableOptionSchema.safeParse({
      label: "",
      amountCents: 85000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Le libellé est requis");
    }
  });

  it("should reject label exceeding 100 characters", () => {
    const result = billableOptionSchema.safeParse({
      label: "x".repeat(101),
      amountCents: 85000,
    });
    expect(result.success).toBe(false);
  });

  it("should accept zero amountCents", () => {
    const result = billableOptionSchema.safeParse({
      label: "Gratuit",
      amountCents: 0,
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative amountCents", () => {
    const result = billableOptionSchema.safeParse({
      label: "Loyer",
      amountCents: -100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Le montant doit être positif ou zéro",
      );
    }
  });

  it("should reject non-integer amountCents", () => {
    const result = billableOptionSchema.safeParse({
      label: "Loyer",
      amountCents: 85.5,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-number amountCents", () => {
    const result = billableOptionSchema.safeParse({
      label: "Loyer",
      amountCents: "85000",
    });
    expect(result.success).toBe(false);
  });
});
