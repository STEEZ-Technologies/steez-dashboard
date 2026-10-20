import { describe, expect, it } from "vitest";
import { sniffDocumentType } from "./document-sniff";

describe("sniffDocumentType", () => {
  it("accepts a PDF by its header", () => {
    expect(sniffDocumentType(Buffer.from("%PDF-1.7\n…"))).toEqual({ mime: "application/pdf", ext: "pdf" });
  });

  it("accepts a JPEG or PNG scan", () => {
    expect(sniffDocumentType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))?.ext).toBe("jpg");
    expect(
      sniffDocumentType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))?.ext,
    ).toBe("png");
  });

  it("rejects anything else, whatever it's named", () => {
    expect(sniffDocumentType(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(sniffDocumentType(Buffer.from("PK\u0003\u0004 a .docx"))).toBeNull();
    expect(sniffDocumentType(Buffer.from("%PD"))).toBeNull();
  });
});
