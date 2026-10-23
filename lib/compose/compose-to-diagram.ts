import { parse } from "yaml";
import { CATALOGUE, CATEGORIES, recognise, type Category } from "./catalogue";

export const DIRECTIONS = ["TB", "LR", "RL", "BT"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export type DiagramNode = {
  id: string;
  name: string;
  category: Category;
  /** Catalogue key whose logo the Node shows. */
  app?: string;
  /** The image as written, or undefined for build-only Services. */
  image?: string;
  ports: string[];
  volumes: number;
  highlight: boolean;
};

export type DiagramEdge = { from: string; to: string; label?: string; animated: boolean };

export type DiagramSettings = { direction: Direction; title?: string };

export type Diagram = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  settings: DiagramSettings;
  warnings: string[];
};

export type ComposeResult = ({ ok: true } & Diagram) | { ok: false; error: string };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

const SERVICE_KEYS = ["name", "type", "icon", "highlight", "hidden"];
const EDGE_KEYS = ["label", "animated", "hidden"];

export function composeToDiagram(yamlText: string): ComposeResult {
  let doc: unknown;
  try {
    doc = parse(yamlText);
  } catch (e) {
    // The yaml library appends a multi-line code excerpt; the first line says enough.
    return { ok: false, error: (e as Error).message.split("\n")[0].replace(/:$/, "") };
  }
  if (!isObj(doc) || !isObj(doc.services) || Object.keys(doc.services).length === 0) {
    return { ok: false, error: "No services found" };
  }

  const warnings: string[] = [];
  const services = doc.services;
  const ids = Object.keys(services);
  const warn = (id: string, key: string, msg: string) => warnings.push(`${id}: ${key} ${msg}`);
  const bool = (id: string, key: string, v: string | undefined) => {
    if (v === undefined) return undefined;
    if (v === "true" || v === "false") return v === "true";
    warn(id, key, `must be "true" or "false"`);
  };

  const labelsOf = new Map(ids.map((id) => [id, readLabels(services[id])]));
  const hidden = new Set(ids.filter((id) => bool(id, "compviz.hidden", labelsOf.get(id)!["compviz.hidden"])));

  const nodes: DiagramNode[] = [];
  const edges = new Map<string, DiagramEdge>();
  const hiddenEdges: string[] = [];
  const edge = (from: string, to: string) => {
    const k = `${from}\0${to}`;
    if (!edges.has(k)) edges.set(k, { from, to, animated: false });
    return edges.get(k)!;
  };

  for (const id of ids) {
    if (hidden.has(id)) continue;
    const svc = isObj(services[id]) ? services[id] : {};
    const labels = labelsOf.get(id)!;
    const image = typeof svc.image === "string" ? svc.image : undefined;

    let app = image ? recognise(image) : undefined;
    const icon = labels["compviz.icon"];
    if (icon !== undefined) {
      if (icon in CATALOGUE) app = icon;
      else warn(id, "compviz.icon", `"${icon}" is not a Known App`);
    }
    let category: Category = app ? CATALOGUE[app].category : "service";
    const type = labels["compviz.type"];
    if (type !== undefined) {
      if ((CATEGORIES as readonly string[]).includes(type)) category = type as Category;
      else warn(id, "compviz.type", `"${type}" is not a Category`);
    }

    nodes.push({
      id,
      name: labels["compviz.name"] || id,
      category,
      app,
      image,
      ports: readPorts(svc.ports),
      volumes: Array.isArray(svc.volumes) ? svc.volumes.length : 0,
      highlight: bool(id, "compviz.highlight", labels["compviz.highlight"]) ?? false,
    });

    const deps = Array.isArray(svc.depends_on) ? svc.depends_on.map(String) : isObj(svc.depends_on) ? Object.keys(svc.depends_on) : [];
    const links = Array.isArray(svc.links) ? svc.links.map((l) => String(l).split(":")[0]) : [];
    for (const to of [...deps, ...links]) {
      if (!(to in services)) warn(id, "depends_on", `"${to}" is not a Service`);
      else if (to !== id && !hidden.has(to)) edge(id, to);
    }

    for (const [key, value] of Object.entries(labels)) {
      if (!key.startsWith("compviz.")) continue;
      const rest = key.slice("compviz.".length);
      if (SERVICE_KEYS.includes(rest)) continue;
      const m = rest.match(/^edge\.(.+)\.([^.]+)$/);
      if (!m || !EDGE_KEYS.includes(m[2])) {
        warn(id, key, "is not a compviz Annotation");
        continue;
      }
      const [, to, prop] = m;
      if (!(to in services)) {
        warn(id, key, `targets "${to}", which is not a Service`);
        continue;
      }
      if (to === id || hidden.has(to)) continue;
      if (prop === "label") edge(id, to).label = value;
      else {
        const b = bool(id, key, value);
        if (b === undefined) continue;
        if (prop === "animated") edge(id, to).animated = b;
        else if (b) hiddenEdges.push(`${id}\0${to}`);
      }
    }
  }
  // Applied last so a label or animated Annotation can't re-create a hidden Edge.
  for (const k of hiddenEdges) edges.delete(k);

  return { ok: true, nodes, edges: [...edges.values()], settings: readSettings(doc["x-compviz"], warnings), warnings };
}

function readLabels(svc: unknown): Record<string, string> {
  const labels = isObj(svc) ? svc.labels : undefined;
  if (Array.isArray(labels)) {
    return Object.fromEntries(
      labels.map((l) => {
        const [k, ...v] = String(l).split("=");
        return [k, v.join("=")];
      }),
    );
  }
  if (isObj(labels)) return Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, String(v ?? "")]));
  return {};
}

/** Host-side port of each published port: `"127.0.0.1:8080:80/tcp"` → `"8080"`. */
function readPorts(ports: unknown): string[] {
  if (!Array.isArray(ports)) return [];
  return ports.map((p) => {
    if (isObj(p)) return String(p.published ?? p.target);
    const parts = String(p).split("/")[0].split(":");
    return parts.length === 1 ? parts[0] : parts[parts.length - 2];
  });
}

function readSettings(x: unknown, warnings: string[]): DiagramSettings {
  const settings: DiagramSettings = { direction: "TB" };
  if (x === undefined) return settings;
  if (!isObj(x)) {
    warnings.push("x-compviz: must be a mapping");
    return settings;
  }
  for (const [key, value] of Object.entries(x)) {
    if (key === "direction") {
      const d = String(value).toUpperCase();
      if ((DIRECTIONS as readonly string[]).includes(d)) settings.direction = d as Direction;
      else warnings.push(`x-compviz: direction "${value}" must be one of ${DIRECTIONS.join(", ")}`);
    } else if (key === "title") settings.title = String(value);
    else warnings.push(`x-compviz: ${key} is not a Diagram Setting`);
  }
  return settings;
}
