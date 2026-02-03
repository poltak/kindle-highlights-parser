export interface RawBlock {
  index: number;
  lines: string[];
  rawText: string;
}

export interface ParsedMetadata {
  type: string;
  raw: string;
  rest?: string;
  locationRaw?: string;
  pageRaw?: string;
  addedOnRaw?: string;
  issues: string[];
}

export interface ParsedClipping {
  title: {
    text: string;
    author?: string;
    raw: string;
  };
  meta: ParsedMetadata;
  content?: string;
  raw: {
    titleLine: string;
    metaLine: string;
    contentLines: string[];
  };
  issues: string[];
  sourceIndex: number;
}

export interface NormalizedClipping {
  title: string;
  author?: string;
  type: string;
  locationStart?: number;
  locationEnd?: number;
  pageStart?: number;
  pageEnd?: number;
  addedOn?: string; // YYYY-MM-DD HH:MM:SS
  content?: string;
  rawMetadata: string;
  sourceIndex: number;
}

export interface ParseResult {
  rawBlocks: RawBlock[];
  parsed: ParsedClipping[];
  normalized: NormalizedClipping[];
}

const SEPARATOR = "==========";

const TITLE_RE = /^(.+?)(?:\s*\((.+)\))?\s*$/;
const META_RE = /^-\s+Your\s+(.+?)\s+at\s+(.+)$/;
const LOCATION_RE = /location\s+(\d+(?:-\d+)?)/i;
const PAGE_RE = /page\s+(\d+(?:-\d+)?)/i;
const ADDED_RE = /Added on\s+(.+)$/i;

const MONTHS: Record<string, string> = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};

function splitLines(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function parseTitle(line: string): { text: string; author?: string; raw: string } {
  const raw = line;
  const clean = line.replace(/^\ufeff/, "").trim();
  const match = clean.match(TITLE_RE);
  if (!match) {
    return { text: clean, raw };
  }
  const text = match[1].trim();
  const author = match[2] ? match[2].trim() : undefined;
  return { text, author, raw };
}

function parseMetadata(line: string): ParsedMetadata {
  const raw = line.trim();
  const issues: string[] = [];
  const match = raw.match(META_RE);
  if (!match) {
    return { type: raw, raw, issues: ["metadata-unmatched"] };
  }

  const type = match[1].trim();
  const rest = match[2];

  const locMatch = rest.match(LOCATION_RE);
  const pageMatch = rest.match(PAGE_RE);
  const addedMatch = rest.match(ADDED_RE);

  if (!locMatch && !pageMatch) {
    issues.push("missing-location-or-page");
  }

  return {
    type,
    raw,
    rest,
    locationRaw: locMatch ? locMatch[1] : undefined,
    pageRaw: pageMatch ? pageMatch[1] : undefined,
    addedOnRaw: addedMatch ? addedMatch[1].trim() : undefined,
    issues,
  };
}

function parseRange(value: string | undefined): { start?: number; end?: number } {
  if (!value) {
    return {};
  }
  if (value.includes("-")) {
    const [startRaw, endRaw] = value.split("-", 2);
    const start = Number(startRaw);
    const end = Number(endRaw);
    return {
      start: Number.isFinite(start) ? start : undefined,
      end: Number.isFinite(end) ? end : undefined,
    };
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return {};
  }
  return { start: num, end: num };
}

function parseAddedOn(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const match = value.match(
    /^[A-Za-z]+,\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/
  );
  if (!match) {
    return undefined;
  }
  const day = match[1].padStart(2, "0");
  const monthName = match[2];
  const year = match[3];
  const hour = match[4];
  const minute = match[5];
  const second = match[6];
  const month = MONTHS[monthName];
  if (!month) {
    return undefined;
  }
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function parseBlock(block: RawBlock): ParsedClipping | undefined {
  let start = 0;
  let end = block.lines.length;
  while (start < end && block.lines[start].trim() === "") {
    start += 1;
  }
  while (end > start && block.lines[end - 1].trim() === "") {
    end -= 1;
  }
  const trimmed = block.lines.slice(start, end);
  if (trimmed.length < 2) {
    return undefined;
  }

  const titleLine = trimmed[0];
  const metaLine = trimmed[1];
  let contentLines = trimmed.slice(2);
  if (contentLines.length > 0 && contentLines[0].trim() === "") {
    contentLines = contentLines.slice(1);
  }

  const title = parseTitle(titleLine);
  const meta = parseMetadata(metaLine);
  const contentRaw = contentLines.join("\n").trim();
  const content = contentRaw.length > 0 ? contentRaw : undefined;

  const issues = [...meta.issues];
  if (!content && meta.type.toLowerCase().includes("highlight")) {
    issues.push("highlight-missing-content");
  }

  return {
    title,
    meta,
    content,
    raw: {
      titleLine,
      metaLine,
      contentLines,
    },
    issues,
    sourceIndex: block.index,
  };
}

export function parseRawBlocks(text: string): RawBlock[] {
  const sanitized = text.replace(/^\ufeff/, "");
  const lines = splitLines(sanitized);
  const blocks: RawBlock[] = [];
  let current: string[] = [];
  let index = 0;

  for (const line of lines) {
    if (line.trim() === SEPARATOR) {
      if (current.length > 0) {
        blocks.push({
          index,
          lines: current,
          rawText: current.join("\n"),
        });
        index += 1;
      }
      current = [];
      continue;
    }
    current.push(line);
  }

  if (current.length > 0) {
    blocks.push({
      index,
      lines: current,
      rawText: current.join("\n"),
    });
  }

  return blocks;
}

export function parseBlocks(blocks: RawBlock[]): ParsedClipping[] {
  const parsed: ParsedClipping[] = [];
  for (const block of blocks) {
    const clipping = parseBlock(block);
    if (clipping) {
      parsed.push(clipping);
    }
  }
  return parsed;
}

export function normalizeClippings(parsed: ParsedClipping[]): NormalizedClipping[] {
  return parsed.map((clip) => {
    const { start: locationStart, end: locationEnd } = parseRange(
      clip.meta.locationRaw
    );
    const { start: pageStart, end: pageEnd } = parseRange(clip.meta.pageRaw);
    const addedOn = parseAddedOn(clip.meta.addedOnRaw);

    return {
      title: clip.title.text,
      author: clip.title.author,
      type: clip.meta.type,
      locationStart,
      locationEnd,
      pageStart,
      pageEnd,
      addedOn,
      content: clip.content,
      rawMetadata: clip.meta.raw,
      sourceIndex: clip.sourceIndex,
    };
  });
}

export function parseClippings(text: string): ParseResult {
  const rawBlocks = parseRawBlocks(text);
  const parsed = parseBlocks(rawBlocks);
  const normalized = normalizeClippings(parsed);
  return { rawBlocks, parsed, normalized };
}
