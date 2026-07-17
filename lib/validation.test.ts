import { describe, it, expect } from "vitest";
import {
  categoryInputSchema,
  productInputSchema,
  finishInputSchema,
  userInviteSchema,
  passwordChangeSchema,
} from "./validation";

describe("categoryInputSchema", () => {
  it("accepts a valid category", () => {
    expect(
      categoryInputSchema.safeParse({
        slug: "frames",
        label: "Frames",
        description: "",
      }).success,
    ).toBe(true);
  });
  it("rejects an invalid slug", () => {
    expect(
      categoryInputSchema.safeParse({ slug: "Not Valid!", label: "X" }).success,
    ).toBe(false);
  });
  it("rejects a missing label", () => {
    expect(categoryInputSchema.safeParse({ slug: "frames", label: "" }).success).toBe(
      false,
    );
  });
});

describe("productInputSchema", () => {
  it("accepts a valid product", () => {
    const r = productInputSchema.safeParse({
      slug: "k6130",
      model: "K6130",
      name: "Concealed Cistern",
      description: "",
      imagePath: "",
    });
    expect(r.success).toBe(true);
  });
  it("rejects a missing model", () => {
    expect(
      productInputSchema.safeParse({ slug: "k6130", model: "", name: "X" }).success,
    ).toBe(false);
  });
});

describe("finishInputSchema", () => {
  it("accepts a valid hex accent", () => {
    expect(
      finishInputSchema.safeParse({
        key: "black",
        materialLabel: "Matte Black",
        accentHex: "#474950",
      }).success,
    ).toBe(true);
  });
  it("rejects a bad hex", () => {
    expect(
      finishInputSchema.safeParse({
        key: "black",
        materialLabel: "Matte Black",
        accentHex: "474950",
      }).success,
    ).toBe(false);
  });
});

describe("userInviteSchema", () => {
  it("lowercases email and accepts valid role", () => {
    const r = userInviteSchema.safeParse({
      email: "Owner@Example.com",
      password: "password123",
      role: "OWNER",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("owner@example.com");
  });
  it("rejects a short password", () => {
    expect(
      userInviteSchema.safeParse({
        email: "a@b.com",
        password: "short",
        role: "STAFF",
      }).success,
    ).toBe(false);
  });
  it("rejects an unknown role", () => {
    expect(
      userInviteSchema.safeParse({
        email: "a@b.com",
        password: "password123",
        role: "ADMIN",
      }).success,
    ).toBe(false);
  });
});

describe("passwordChangeSchema", () => {
  it("requires a new password of at least 8 chars", () => {
    expect(
      passwordChangeSchema.safeParse({ currentPassword: "x", newPassword: "1234567" })
        .success,
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({ currentPassword: "x", newPassword: "12345678" })
        .success,
    ).toBe(true);
  });
});
