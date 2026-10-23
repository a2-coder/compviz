import { CATALOGUE, CATEGORIES } from "./catalogue";
import { DIRECTIONS } from "./compose-to-diagram";
import { indentOf, keyOf, serviceRanges } from "./ranges";

export type Suggestion = { label: string; apply?: string; detail?: string; boost?: number; type: "property" | "keyword" | "enum" | "variable" };
export type Completions = { from: number; options: Suggestion[] };

const TOP_KEYS = ["services", "volumes", "networks", "configs", "secrets", "name", "x-compviz"];
const SERVICE_KEYS = [
  "image", "build", "ports", "depends_on", "links", "labels", "environment", "env_file", "volumes",
  "networks", "command", "entrypoint", "restart", "healthcheck", "profiles", "container_name", "expose",
];
const SETTINGS: Record<string, string> = { title: "Diagram title", direction: "Layout direction" };
const BOOL = ["true", "false"];
const ANNOTATIONS: Record<string, string> = {
  "compviz.name": "Display name",
  "compviz.type": "Category",
  "compviz.icon": "Known App logo",
  "compviz.highlight": "Highlight this Node",
  "compviz.hidden": "Leave out of the Diagram",
};
const EDGE_ANNOTATIONS: Record<string, string> = { label: "Edge label", animated: "Animate this Edge", hidden: "Hide this Edge" };

/** Keys enclosing a line, outermost first, found by walking up to lines with less indentation. */
function pathAt(lines: string[], lineNo: number, indent: number): string[] {
  const path: string[] = [];
  for (let i = lineNo - 1; i >= 0 && indent > 0; i--) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const key = keyOf(line);
    if (indentOf(line) < indent && key && !line.trimStart().startsWith("-")) {
      path.unshift(key);
      indent = indentOf(line);
    }
  }
  return path;
}

function valuesFor(key: string, path: string[], services: string[]): Suggestion[] {
  const enums = (values: readonly string[], type: Suggestion["type"] = "enum") => values.map((label) => ({ label, type }));
  if (path[0] === "x-compviz" && key === "direction") return enums(DIRECTIONS);
  if (path.at(-1) === "labels") {
    if (key === "compviz.type") return enums(CATEGORIES);
    if (key === "compviz.icon") return Object.entries(CATALOGUE).map(([label, app]) => ({ label, detail: app.name, type: "enum" }));
    if (/^compviz\.(highlight|hidden)$|^compviz\.edge\..+\.(animated|hidden)$/.test(key)) return enums(BOOL, "keyword");
  }
  if (path[0] === "services" && path.length === 2 && key === "image") {
    return Object.values(CATALOGUE).map((app) => ({ label: app.aliases[0], detail: app.name, type: "enum" }));
  }
  if (path[0] === "services" && (key === "depends_on" || key === "links")) return enums(services, "variable");
  return [];
}

function keysFor(path: string[], services: string[], self: string | undefined, sep: string): Suggestion[] {
  const keys = (entries: [string, string?][], type: Suggestion["type"] = "property") =>
    entries.map(([label, detail]) => ({ label, detail, apply: `${label}${sep}`, type }));
  if (path.length === 0) return keys(TOP_KEYS.map((k) => [k]));
  if (path[0] === "x-compviz" && path.length === 1) return keys(Object.entries(SETTINGS));
  if (path[0] !== "services") return [];
  if (path.length === 2) return keys(SERVICE_KEYS.map((k) => [k]));
  if (path.length === 3 && path[2] === "labels") {
    const edges = services
      .filter((s) => s !== self)
      .flatMap((s) => Object.entries(EDGE_ANNOTATIONS).map(([p, d]): [string, string] => [`compviz.edge.${s}.${p}`, d]));
    // Service Annotations rank above the (many) Edge Annotations.
    return [...keys(Object.entries(ANNOTATIONS)).map((k) => ({ ...k, boost: 1 })), ...keys(edges)];
  }
  if (path.length === 3 && (path[2] === "depends_on" || path[2] === "links")) {
    return services.filter((s) => s !== self).map((label) => ({ label, type: "variable" }));
  }
  return [];
}

/** Context-aware suggestions for the Compose File at `pos`, or null where there's nothing to suggest. */
export function completeCompose(text: string, pos: number): Completions | null {
  const lines = text.slice(0, pos).split("\n");
  const lineNo = lines.length - 1;
  const before = lines[lineNo];
  const allLines = text.split("\n");
  const services = serviceRanges(text).map((r) => r.id);
  const indent = indentOf(before);
  // A list item may sit at its parent key's indent (`labels:\n- a=b`), so count it one deeper.
  const path = pathAt(allLines, lineNo, before.trimStart().startsWith("-") ? indent + 1 : indent);
  const self = path[0] === "services" ? path[1] : undefined;
  const rest = before.trimStart();
  const result = (partial: string, options: Suggestion[]) => (options.length ? { from: pos - partial.length, options } : null);

  // Flow sequence: `depends_on: [db, ca|`
  const flow = rest.match(/^(depends_on|links):\s*\[(?:[^\]]*,)?\s*([\w.-]*)$/);
  if (flow) return result(flow[2], valuesFor(flow[1], path, services).filter((s) => s.label !== self));

  // List-form label: `- compviz.type=que|` or `- compviz.ty|`
  const listLabel = path.at(-1) === "labels" && rest.match(/^-\s+([\w.-]*)(?:=([\w.-]*))?$/);
  if (listLabel) {
    return listLabel[2] !== undefined
      ? result(listLabel[2], valuesFor(listLabel[1], path, services))
      : result(listLabel[1], keysFor(path, services, self, "="));
  }

  // Value: `key: part|`
  const value = rest.match(/^(?:-\s+)?([\w.-]+):\s+([\w.-]*)$/);
  if (value) return result(value[2], valuesFor(value[1], path, services).filter((s) => s.label !== self));

  // Key, or a block list item: `ke|` / `- it|`
  const key = rest.match(/^(-\s+)?([\w.-]*)$/);
  if (key) return result(key[2], keysFor(path, services, self, key[1] ? "" : ": "));
  return null;
}
