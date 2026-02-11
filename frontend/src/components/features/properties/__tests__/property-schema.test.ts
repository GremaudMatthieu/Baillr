import { describe, it, expect } from "vitest";
import { propertySchema } from "../property-schema";

const validProperty = {
  name: "Résidence Les Pins",
  type: "immeuble",
  address: {
    street: "12 Rue des Lilas",
    postalCode: "75001",
    city: "Paris",
    country: "France",
    complement: "Bât A",
  },
};

describe("propertySchema", () => {
  it("should accept a valid property", () => {
    const result = propertySchema.safeParse(validProperty);
    expect(result.success).toBe(true);
  });

  it("should accept empty type", () => {
    const result = propertySchema.safeParse({ ...validProperty, type: "" });
    expect(result.success).toBe(true);
  });

  it("should accept undefined type", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type: _type, ...withoutType } = validProperty;
    const result = propertySchema.safeParse(withoutType);
    expect(result.success).toBe(true);
  });

  it("should reject missing name", () => {
    const result = propertySchema.safeParse({ ...validProperty, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Le nom est requis");
    }
  });

  it("should reject name exceeding 255 characters", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      name: "x".repeat(256),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Le nom ne peut pas dépasser 255 caractères",
      );
    }
  });

  it("should accept name at 255 characters boundary", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      name: "x".repeat(255),
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid postal code format (less than 5 digits)", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      address: { ...validProperty.address, postalCode: "7500" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Le code postal doit contenir 5 chiffres",
      );
    }
  });

  it("should reject non-numeric postal code", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      address: { ...validProperty.address, postalCode: "ABCDE" },
    });
    expect(result.success).toBe(false);
  });

  it("should reject postal code with more than 5 digits", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      address: { ...validProperty.address, postalCode: "750011" },
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing street", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      address: { ...validProperty.address, street: "" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("La rue est requise");
    }
  });

  it("should reject missing city", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      address: { ...validProperty.address, city: "" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("La ville est requise");
    }
  });

  it("should accept empty country and complement", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      address: {
        ...validProperty.address,
        country: "",
        complement: "",
      },
    });
    expect(result.success).toBe(true);
  });

  it("should reject type exceeding 255 characters", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      type: "x".repeat(256),
    });
    expect(result.success).toBe(false);
  });
});
