import { describe, it, expect } from "vitest";
import { toJson } from "./json-output.js";
import type { NormalizedClipping } from "../kindle-clippings.js";

describe("toJson", () => {
  it("renders pretty JSON by default with trailing newline", () => {
    const clippings: NormalizedClipping[] = [
      {
        title: "Book",
        type: "Highlight",
        locationStart: 1,
        locationEnd: 2,
        addedOn: "2024-01-02 03:04:05",
        content: "Line 1\nLine 2",
        rawMetadata: "- Your Highlight at location 1-2",
        sourceIndex: 0,
      },
    ];

    const json = toJson(clippings);
    expect(json.endsWith("\n")).toBe(true);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(clippings);
    expect(json).toContain("\n    \"title\": \"Book\"");
  });

  it("supports compact output", () => {
    const clippings: NormalizedClipping[] = [
      {
        title: "Book",
        type: "Bookmark",
        rawMetadata: "- Your Bookmark at location 10",
        sourceIndex: 1,
      },
    ];

    const json = toJson(clippings, { pretty: false });
    expect(json).toBe(
      "[{\"title\":\"Book\",\"type\":\"Bookmark\",\"rawMetadata\":\"- Your Bookmark at location 10\",\"sourceIndex\":1}]\n"
    );
  });
});
