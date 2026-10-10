import { describe, expect, it } from "vitest";
import { parseYouTube } from "./youtube";

describe("parseYouTube", () => {
  it.each([
    ["https://www.youtube.com/watch?v=g_Oggx4L4I0", "g_Oggx4L4I0", false],
    ["https://www.youtube.com/watch?v=g_Oggx4L4I0&t=42s&list=PL123", "g_Oggx4L4I0", false],
    ["youtube.com/watch?v=g_Oggx4L4I0", "g_Oggx4L4I0", false],
    ["https://m.youtube.com/watch?v=mo38-xX3QTs", "mo38-xX3QTs", false],
    ["https://youtu.be/7w84CV1XMfg?si=abcdef", "7w84CV1XMfg", false],
    ["https://www.youtube.com/shorts/hgd1QfJCw0A", "hgd1QfJCw0A", true],
    ["https://youtube.com/shorts/hgd1QfJCw0A?feature=share", "hgd1QfJCw0A", true],
    ["https://www.youtube.com/embed/OdHjZRxcVHU", "OdHjZRxcVHU", false],
    ["https://www.youtube-nocookie.com/embed/OdHjZRxcVHU", "OdHjZRxcVHU", false],
    ["https://www.youtube.com/live/0VI5kKA3ZXs", "0VI5kKA3ZXs", false],
    ["  9lzTtu1kEvc  ", "9lzTtu1kEvc", false],
  ])("reads %s", (input, id, short) => {
    expect(parseYouTube(input)).toEqual({ id, short });
  });

  it.each([
    "",
    "not a link",
    "https://vimeo.com/123456789",
    "https://www.youtube.com/@komibright",
    "https://www.youtube.com/watch?v=tooshort",
    "https://evil.com/watch?v=g_Oggx4L4I0",
  ])("rejects %s", (input) => {
    expect(parseYouTube(input)).toBeNull();
  });
});
