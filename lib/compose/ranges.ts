export const indentOf = (line: string) => line.length - line.trimStart().length;
export const keyOf = (line: string) => line.match(/^\s*(?:-\s+)?([^\s:#'"-][^:#]*?)\s*:(?:\s|$)/)?.[1];

/** Where one Service's block sits in the Compose File: `from`–`to` spans its lines, `at` is the start of its name. */
export type ServiceRange = { id: string; from: number; to: number; at: number };

/** Text ranges of each block-style Service under the top-level `services:` key, in file order. */
export function serviceRanges(text: string): ServiceRange[] {
  const ranges: ServiceRange[] = [];
  let offset = 0;
  let inServices = false;
  let level = -1;
  for (const line of text.split("\n")) {
    const start = offset;
    offset += line.length + 1;
    if (!line.trim()) continue;
    const indent = indentOf(line);
    if (indent === 0) {
      if (line.trimStart().startsWith("#")) continue;
      inServices = /^services:\s*(#.*)?$/.test(line);
      continue;
    }
    if (!inServices) continue;
    if (level < 0 && !line.trimStart().startsWith("#")) level = indent;
    const key = indent === level && keyOf(line);
    if (key) ranges.push({ id: key, from: start, to: start + line.length, at: start + indent });
    else if (ranges.length && indent > level) ranges[ranges.length - 1].to = start + line.length;
  }
  return ranges;
}
