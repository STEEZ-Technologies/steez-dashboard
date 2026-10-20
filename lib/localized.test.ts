import { describe, expect, it } from "vitest";
import { localizedDefaults, localizedFromForm, readLocalized } from "./localized";

describe("readLocalized", () => {
  it("keeps non-blank languages and trims them", () => {
    expect(readLocalized({ en: " Office ", fr: "Bureau", it: "  ", de: "Büro" })).toEqual({
      en: "Office",
      fr: "Bureau",
    });
  });

  it("turns a textarea's \\r\\n into \\n", () => {
    expect(readLocalized({ en: "F.202\r\nNo. 6" })).toEqual({ en: "F.202\nNo. 6" });
  });

  it("is null without English", () => {
    expect(readLocalized({ zh: "办公室" })).toBeNull();
    expect(readLocalized(null)).toBeNull();
    expect(readLocalized("Office")).toBeNull();
    expect(readLocalized(["Office"])).toBeNull();
  });
});

describe("localizedFromForm", () => {
  it("reads <name>_<lang> fields", () => {
    const fd = new FormData();
    fd.set("address_en", "No. 6 Huazhong Road");
    fd.set("address_zh", "华中路6号");
    fd.set("address_ja", "");
    expect(localizedFromForm(fd, "address")).toEqual({
      en: "No. 6 Huazhong Road",
      zh: "华中路6号",
    });
  });

  it("is null when English is blank", () => {
    const fd = new FormData();
    fd.set("address_en", " ");
    fd.set("address_zh", "华中路6号");
    expect(localizedFromForm(fd, "address")).toBeNull();
  });
});

describe("localizedDefaults", () => {
  it("fills every language, blank where unwritten", () => {
    expect(localizedDefaults({ en: "Office", ja: "オフィス" })).toEqual({
      en: "Office",
      zh: "",
      fr: "",
      it: "",
      es: "",
      ja: "オフィス",
    });
  });
});
