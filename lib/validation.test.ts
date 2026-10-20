import { describe, it, expect } from "vitest";
import {
  categoryInputSchema,
  productInputSchema,
  finishInputSchema,
  userInviteSchema,
  passwordChangeSchema,
  companyProfileInputSchema,
  officeInputSchema,
  tenantSettingsSchema,
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
      nameZh: "",
      description: "",
      descriptionZh: "",
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

describe("companyProfileInputSchema", () => {
  const base = {
    email: "",
    phone: "",
    whatsapp: "",
    icpNumber: "",
    catalogueUrl: "",
    salesName: "",
    salesWhatsapp: "",
    salesEmail: "",
    salesWeb: "",
    socials: "",
  };

  it("treats blank as not published", () => {
    const r = companyProfileInputSchema.parse(base);
    expect(r.email).toBeUndefined();
    expect(r.socials).toEqual([]);
  });

  it("strips the scheme off a website", () => {
    expect(companyProfileInputSchema.parse({ ...base, salesWeb: "https://www.komibright.com/" }).salesWeb).toBe(
      "www.komibright.com",
    );
  });

  it("rejects a bad email and a catalogue link without a scheme", () => {
    expect(companyProfileInputSchema.safeParse({ ...base, email: "info@" }).success).toBe(false);
    expect(companyProfileInputSchema.safeParse({ ...base, catalogueUrl: "book.publuu.com" }).success).toBe(false);
  });

  it("parses social links, one per line", () => {
    const r = companyProfileInputSchema.parse({
      ...base,
      socials: "LinkedIn https://linkedin.com/company/x\n\nyoutube https://youtube.com/@x",
    });
    expect(r.socials).toEqual([
      { network: "linkedin", url: "https://linkedin.com/company/x" },
      { network: "youtube", url: "https://youtube.com/@x" },
    ]);
    expect(companyProfileInputSchema.safeParse({ ...base, socials: "myspace https://x" }).success).toBe(false);
  });
});

describe("officeInputSchema", () => {
  const base = { key: "shanghai", tel: "", fax: "", email: "", web: "", line: "", lat: "", lon: "" };

  it("reads coordinates as numbers and blank as none", () => {
    expect(officeInputSchema.parse({ ...base, lat: "31.11", lon: "121.38" })).toMatchObject({ lat: 31.11, lon: 121.38 });
    expect(officeInputSchema.parse(base).lat).toBeUndefined();
  });

  it("rejects coordinates off the globe and a bad key", () => {
    expect(officeInputSchema.safeParse({ ...base, lat: "95" }).success).toBe(false);
    expect(officeInputSchema.safeParse({ ...base, lon: "east" }).success).toBe(false);
    expect(officeInputSchema.safeParse({ ...base, key: "Shanghai Office" }).success).toBe(false);
  });
});

describe("tenantSettingsSchema leadAlertEmails", () => {
  it("splits, lower-cases and de-duplicates", () => {
    const r = tenantSettingsSchema.parse({
      name: "KomiBright",
      leadAlertEmails: "Info@KomiBright.com; sales@komibright.com,\n info@komibright.com",
    });
    expect(r.leadAlertEmails).toEqual(["info@komibright.com", "sales@komibright.com"]);
  });
  it("empty means none; absent means untouched", () => {
    expect(tenantSettingsSchema.parse({ name: "K", leadAlertEmails: " " }).leadAlertEmails).toEqual([]);
    expect(tenantSettingsSchema.parse({ name: "K" }).leadAlertEmails).toBeUndefined();
  });
  it("rejects a malformed address", () => {
    expect(tenantSettingsSchema.safeParse({ name: "K", leadAlertEmails: "info@" }).success).toBe(false);
  });
});
