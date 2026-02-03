import { describe, it, expect } from "vitest";
import { toCsv } from "./csv-output.js";
import type { NormalizedClipping } from "../kindle-clippings.js";

describe("toCsv", () => {
  it("renders headers and escapes values", () => {
    const clippings: NormalizedClipping[] = [
      {
        title: "Book, One",
        author: "Alice \"A\"",
        type: "Highlight",
        locationStart: 10,
        locationEnd: 12,
        pageStart: 1,
        pageEnd: 2,
        addedOn: "2024-01-02 03:04:05",
        content: "Hello, \"world\"\nNext line",
        rawMetadata: "- Your Highlight at location 10-12",
        sourceIndex: 0,
      },
    ];

    const csv = toCsv(clippings);
    const headerEnd = csv.indexOf("\n");
    const header = csv.slice(0, headerEnd);
    const row = csv.slice(headerEnd + 1).trimEnd();

    expect(header).toBe(
      "title,author,type,location_start,location_end,page_start,page_end,added_on,content,raw_metadata"
    );

    expect(row).toBe(
      '"Book, One","Alice ""A""",Highlight,10,12,1,2,2024-01-02 03:04:05,"Hello, ""world""\nNext line",- Your Highlight at location 10-12'
    );
  });
});
