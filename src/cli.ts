#!/usr/bin/env node
import { createReadStream } from "node:fs";
import readline from "node:readline";
import {
  normalizeClippings,
  parseBlocks,
  type RawBlock,
} from "./kindle-clippings.js";
import { toCsv } from "./outputs/csv-output.js";

type Format = "json" | "csv";

function printUsage(): void {
  const message = [
    "Usage:",
    "  kindle-clippings parse <file> [--format json|csv] [--pretty]",
    "",
    "Examples:",
    "  kindle-clippings parse \"My Clippings.txt\" --format json",
    "  kindle-clippings parse \"My Clippings.txt\" --format csv",
  ];
  console.log(message.join("\n"));
}

function parseArgs(args: string[]): {
  command?: string;
  file?: string;
  format: Format;
  pretty: boolean;
} {
  const [command, file, ...rest] = args;
  let format: Format = "json";
  let pretty = false;

  for (let i = 0; i < rest.length; i += 1) {
    const value = rest[i];
    if (value === "--format") {
      const next = rest[i + 1];
      if (next === "json" || next === "csv") {
        format = next;
        i += 1;
        continue;
      }
      throw new Error("Invalid format. Use json or csv.");
    }
    if (value === "--pretty") {
      pretty = true;
      continue;
    }
    throw new Error(`Unknown argument: ${value}`);
  }

  return { command, file, format, pretty };
}

function writeCsvHeader(): void {
  const headerCsv = toCsv([
    {
      title: "",
      type: "",
      rawMetadata: "",
      sourceIndex: 0,
    },
  ]);
  const headerEnd = headerCsv.indexOf("\n");
  process.stdout.write(headerCsv.slice(0, headerEnd + 1));
}

function writeCsvRow(normalized: unknown): void {
  const rowCsv = toCsv([normalized as never]);
  const headerEnd = rowCsv.indexOf("\n");
  process.stdout.write(rowCsv.slice(headerEnd + 1));
}

function writeJsonItem(
  normalized: unknown,
  state: { wroteAny: boolean; pretty: boolean }
): void {
  if (state.pretty) {
    const json = JSON.stringify(normalized, null, 2)
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
    if (state.wroteAny) {
      process.stdout.write(",\n");
    }
    process.stdout.write(json);
  } else {
    if (state.wroteAny) {
      process.stdout.write(",");
    }
    process.stdout.write(JSON.stringify(normalized));
  }
  state.wroteAny = true;
}

async function streamParseFile(
  file: string,
  format: Format,
  pretty: boolean
): Promise<void> {
  const rl = readline.createInterface({
    input: createReadStream(file, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let blockLines: string[] = [];
  let index = 0;
  let sawFirstLine = false;

  const jsonState = { wroteAny: false, pretty };
  if (format === "json") {
    process.stdout.write(pretty ? "[\n" : "[");
  } else {
    writeCsvHeader();
  }

  const flushBlock = (): void => {
    if (blockLines.length === 0) {
      return;
    }
    const rawBlock: RawBlock = {
      index,
      lines: blockLines,
      rawText: blockLines.join("\n"),
    };
    index += 1;
    blockLines = [];

    const parsed = parseBlocks([rawBlock]);
    if (parsed.length === 0) {
      return;
    }
    const normalized = normalizeClippings(parsed)[0];

    if (format === "csv") {
      writeCsvRow(normalized);
    } else {
      writeJsonItem(normalized, jsonState);
    }
  };

  for await (const rawLine of rl) {
    let line = rawLine;
    if (!sawFirstLine) {
      line = line.replace(/^\ufeff/, "");
      sawFirstLine = true;
    }

    if (line.trim() === "==========") {
      flushBlock();
      continue;
    }
    blockLines.push(line);
  }

  flushBlock();

  if (format === "json") {
    process.stdout.write(pretty ? "\n]\n" : "]\n");
  }
}

async function main(): Promise<number> {
  try {
    const args = process.argv.slice(2);
    if (args[0] === "kindle-clippings") {
      args.shift();
    }
    const { command, file, format, pretty } = parseArgs(args);

    if (!command || command === "--help" || command === "-h") {
      printUsage();
      return command ? 0 : 1;
    }

    if (command !== "parse" || !file) {
      printUsage();
      return 1;
    }

    await streamParseFile(file, format, pretty);
    return 0;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error.";
    console.error(message);
    return 1;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    const message =
      error instanceof Error ? error.message : "Unexpected error.";
    console.error(message);
    process.exit(1);
  });
