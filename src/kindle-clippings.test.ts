import { describe, it, expect } from "vitest";
import { parseClippings } from "./kindle-clippings.js";

describe("parseClippings", () => {
  const sample = [
    "\ufeffThe Great Book (Jane Doe)",
    "- Your Highlight at location 123-125 | Added on Thursday, 20 February 2020 22:37:52",
    "",
    "This is a highlight.",
    "==========",
    "Another Book (John Smith)",
    "- Your Note at page 10 | location 200 | Added on Friday, 21 February 2020 10:00:00",
    "",
    "This is a note.",
    "==========",
    "Third Book",
    "- Your Bookmark at location 300",
    "==========",
    "Fourth Book",
    "- Your Highlight at location 400",
    "==========",
  ].join("\n");

  it("parses and normalizes clippings", () => {
    const result = parseClippings(sample);

    expect(result.rawBlocks).toHaveLength(4);
    expect(result.parsed).toHaveLength(4);
    expect(result.normalized).toHaveLength(4);

    const first = result.normalized[0];
    expect(first.title).toBe("The Great Book");
    expect(first.author).toBe("Jane Doe");
    expect(first.type).toBe("Highlight");
    expect(first.locationStart).toBe(123);
    expect(first.locationEnd).toBe(125);
    expect(first.pageStart).toBeUndefined();
    expect(first.addedOn).toBe("2020-02-20 22:37:52");
    expect(first.content).toBe("This is a highlight.");

    const second = result.normalized[1];
    expect(second.title).toBe("Another Book");
    expect(second.author).toBe("John Smith");
    expect(second.type).toBe("Note");
    expect(second.pageStart).toBe(10);
    expect(second.pageEnd).toBe(10);
    expect(second.locationStart).toBe(200);
    expect(second.addedOn).toBe("2020-02-21 10:00:00");
    expect(second.content).toBe("This is a note.");

    const third = result.normalized[2];
    expect(third.title).toBe("Third Book");
    expect(third.type).toBe("Bookmark");
    expect(third.content).toBeUndefined();

    const fourth = result.parsed[3];
    expect(fourth.title.text).toBe("Fourth Book");
    expect(fourth.meta.type).toBe("Highlight");
    expect(fourth.content).toBeUndefined();
    expect(fourth.issues).toContain("highlight-missing-content");
  });

  it("handles malformed metadata and preserves raw values", () => {
    const text = [
      "Odd Book",
      "- Not matching the usual pattern",
      "",
      "Some text",
      "==========",
    ].join("\n");

    const result = parseClippings(text);
    expect(result.normalized).toHaveLength(1);
    expect(result.parsed[0].meta.issues).toContain("metadata-unmatched");
    expect(result.normalized[0].type).toBe("- Not matching the usual pattern");
    expect(result.normalized[0].rawMetadata).toBe(
      "- Not matching the usual pattern"
    );
  });

  it("ignores blocks with only one line", () => {
    const text = ["Lonely Title", "=========="].join("\n");
    const result = parseClippings(text);
    expect(result.rawBlocks).toHaveLength(1);
    expect(result.parsed).toHaveLength(0);
    expect(result.normalized).toHaveLength(0);
  });

  it("leaves addedOn undefined for unsupported date formats", () => {
    const text = [
      "Date Book",
      "- Your Highlight at location 50 | Added on 2020-02-20 22:37:52",
      "",
      "Content",
      "==========",
    ].join("\n");

    const result = parseClippings(text);
    expect(result.normalized).toHaveLength(1);
    expect(result.normalized[0].addedOn).toBeUndefined();
  });
});
