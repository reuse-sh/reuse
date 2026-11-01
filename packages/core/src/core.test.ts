import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./clipboard.js";
import { escapeHtml } from "./escape-html.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HTML text and attribute escaping", () => {
  it("escapes markup, both quote types, and ampersands in one input", () => {
    expect(escapeHtml("<a title=\"A&B\">'hello'</a>")).toBe(
      "&lt;a title=&quot;A&amp;B&quot;&gt;&#39;hello&#39;&lt;/a&gt;",
    );
  });
  it("preserves ordinary Unicode text", () => {
    expect(escapeHtml("Café 日本語")).toBe("Café 日本語");
  });
});

describe("clipboard", () => {
  it("writes the exact text and reports success only after completion", async () => {
    const clipboard: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: async (text: string) => {
          clipboard.push(text);
        },
      },
    });
    expect(await copyText("A & B\nsecond line")).toBe(true);
    expect(clipboard).toEqual(["A & B\nsecond line"]);
  });
  it("reports denied or unavailable clipboard access without throwing", async () => {
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: async () => {
          throw new Error("Denied");
        },
      },
    });
    expect(await copyText("value")).toBe(false);
    vi.stubGlobal("navigator", {});
    expect(await copyText("value")).toBe(false);
    expect(await copyText("")).toBe(false);
  });
});
