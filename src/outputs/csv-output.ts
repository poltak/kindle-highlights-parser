import type { NormalizedClipping } from "../kindle-clippings";

const HEADERS = [
  "title",
  "author",
  "type",
  "location_start",
  "location_end",
  "page_start",
  "page_end",
  "added_on",
  "content",
  "raw_metadata",
];

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(clippings: NormalizedClipping[]): string {
  const rows = [HEADERS.join(",")];
  for (const clip of clippings) {
    const values = [
      clip.title,
      clip.author ?? "",
      clip.type,
      clip.locationStart?.toString() ?? "",
      clip.locationEnd?.toString() ?? "",
      clip.pageStart?.toString() ?? "",
      clip.pageEnd?.toString() ?? "",
      clip.addedOn ?? "",
      clip.content ?? "",
      clip.rawMetadata,
    ].map(csvEscape);
    rows.push(values.join(","));
  }

  return `${rows.join("\n")}\n`;
}
