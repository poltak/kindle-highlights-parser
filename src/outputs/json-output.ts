import type { NormalizedClipping } from "../kindle-clippings.js";

export function toJson(
  clippings: NormalizedClipping[],
  options: { pretty?: boolean } = {}
): string {
  const { pretty = true } = options;
  return JSON.stringify(clippings, null, pretty ? 2 : 0) + "\n";
}
