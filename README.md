# Kindle Clippings Parser (TypeScript)

Parse Amazon Kindle `My Clippings.txt` exports into a normalized structure that can be used in any context, plus optional output helpers (CSV).

## Requirements

- Node.js 18+ (for tests)

## Usage

The core parsing logic has no runtime dependencies and can be used in a browser or bundler.

```ts
import { parseClippings } from "./src/kindle-clippings";
import { toCsv } from "./src/outputs/csv-output";
import { toJson } from "./src/outputs/json-output";

const fileText = await file.text(); // e.g. from an <input type="file">
const { normalized } = parseClippings(fileText);
const csv = toCsv(normalized);
const json = toJson(normalized);
```

## CLI

Build the CLI and run it via `npx` or `npm link`:

```bash
npm run build
npm link
kindle-clippings parse "My Clippings.txt" --format json --pretty
kindle-clippings parse "My Clippings.txt" --format csv
```

You can also run it directly without linking:

```bash
node dist/cli.js parse "My Clippings.txt" --format json --pretty
node dist/cli.js parse "My Clippings.txt" --format csv
```

## Output columns

- `title`
- `author`
- `type` (Highlight / Bookmark / Note)
- `location_start`
- `location_end`
- `page_start`
- `page_end`
- `added_on` (ISO 8601)
- `content`
- `raw_metadata`

## Tests

```bash
npm install
npm run test      # watch mode
npm run test:run  # single run
```

## Notes

- The parser strips a UTF-8 BOM if present.
- Bookmarks usually have no `content`.
- Some files include `page` and/or `location`; missing values are left blank.
