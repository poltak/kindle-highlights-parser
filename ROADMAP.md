# Roadmap

## Near term
- Add Anki export as a schema-driven CSV/TSV output.
- Support user-defined field mappings using simple templates (e.g., `{content}`, `{title}`, `{author}`, `{locationStart}`).
- Provide computed helpers like `{location}` and `{page}` (start/end combined).
- CLI support for `--anki-schema <file>` plus `--format anki|tsv`.

## Open questions
- How to help users derive their Anki note type field order (manual instructions vs. add-on export).
- Default schema to ship (or none) and whether to include tags support.
- How to handle missing fields (empty string vs. literal placeholder).
