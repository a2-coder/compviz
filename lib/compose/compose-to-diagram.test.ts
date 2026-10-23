import { describe, expect, test } from "bun:test";
import { composeToDiagram, type Diagram } from "./compose-to-diagram";

function diagram(yaml: string): Diagram {
  const result = composeToDiagram(yaml);
  if (!result.ok) throw new Error(result.error);
  return result;
}
const node = (d: Diagram, id: string) => d.nodes.find((n) => n.id === id)!;
const pairs = (d: Diagram) => d.edges.map((e) => `${e.from}->${e.to}`).sort();

describe("input errors", () => {
  test("invalid YAML is an error, not a throw", () => {
    const result = composeToDiagram("services: [");
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).not.toContain("\n");
  });
  test("empty file or no services is an error", () => {
    expect(composeToDiagram("").ok).toBe(false);
    expect(composeToDiagram("version: '3'").ok).toBe(false);
    expect(composeToDiagram("services: {}").ok).toBe(false);
  });
});

describe("Known App recognition", () => {
  test("recognises image variants by repository", () => {
    const d = diagram(`
services:
  a: { image: postgres:16-alpine }
  b: { image: docker.io/bitnami/postgresql:16 }
  c: { image: "ghcr.io/foo/redis-stack@sha256:abc" }
  d: { image: jaegertracing/all-in-one:1.57 }
  e: { image: "localhost:5000/nginx" }
`);
    expect(d.nodes.map((n) => [n.app, n.category])).toEqual([
      ["postgres", "database"],
      ["postgres", "database"],
      ["redis", "cache"],
      ["jaeger", "observability"],
      ["nginx", "proxy"],
    ]);
  });
  test("never matches on the service name; build-only Services are plain services", () => {
    const d = diagram(`
services:
  redis: { build: . }
  postgres: { image: acme/api }
`);
    expect(node(d, "redis")).toMatchObject({ app: undefined, image: undefined, category: "service" });
    expect(node(d, "postgres")).toMatchObject({ app: undefined, category: "service" });
  });
  test("does not match a repository that only contains an alias", () => {
    expect(node(diagram("services: { a: { image: my-postgres-backup } }"), "a").app).toBeUndefined();
  });
});

describe("Node details", () => {
  test("ports show the host side and volumes are counted", () => {
    const d = diagram(`
services:
  web:
    image: nginx
    ports: ["8080:80", "127.0.0.1:8443:443/tcp", "3000", { target: 9000, published: 9001 }, { target: 7000 }]
    volumes: ["./conf:/etc/nginx", "data:/data"]
`);
    expect(node(d, "web")).toMatchObject({ ports: ["8080", "8443", "3000", "9001", "7000"], volumes: 2 });
  });
});

describe("Edges", () => {
  test("come from both depends_on forms and links, pointing at the dependency, de-duplicated", () => {
    const d = diagram(`
services:
  api: { build: ., depends_on: [db, cache], links: ["db:database"] }
  worker: { build: ., depends_on: { db: { condition: service_healthy } } }
  db: { image: postgres }
  cache: { image: redis }
`);
    expect(pairs(d)).toEqual(["api->cache", "api->db", "worker->db"]);
  });
  test("a dependency on a missing Service warns and draws nothing", () => {
    const d = diagram("services: { api: { build: ., depends_on: [ghost] } }");
    expect(d.edges).toEqual([]);
    expect(d.warnings).toHaveLength(1);
    expect(d.warnings[0]).toContain("ghost");
  });
});

describe("Service Annotations", () => {
  test("name, type, icon and highlight", () => {
    const d = diagram(`
services:
  db:
    image: postgres
    labels: { compviz.name: Primary DB, compviz.highlight: "true" }
  pg:
    build: ./custom-pg
    labels: ["compviz.icon=postgres"]
  q:
    image: acme/jobs
    labels: { compviz.type: queue }
`);
    expect(node(d, "db")).toMatchObject({ name: "Primary DB", highlight: true });
    expect(node(d, "pg")).toMatchObject({ app: "postgres", category: "database", name: "pg" });
    expect(node(d, "q").category).toBe("queue");
    expect(d.warnings).toEqual([]);
  });
  test("unquoted YAML booleans are accepted", () => {
    expect(node(diagram("services: { a: { image: x, labels: { compviz.highlight: true } } }"), "a").highlight).toBe(true);
  });
  test("hidden drops the Service and its Edges", () => {
    const d = diagram(`
services:
  api: { build: ., depends_on: [db, migrate] }
  migrate: { build: ., depends_on: [db], labels: { compviz.hidden: "true" } }
  db: { image: postgres }
`);
    expect(d.nodes.map((n) => n.id)).toEqual(["api", "db"]);
    expect(pairs(d)).toEqual(["api->db"]);
  });
  test("invalid values warn and are ignored", () => {
    const d = diagram(`
services:
  a:
    image: redis
    labels:
      compviz.type: banana
      compviz.icon: nope
      compviz.highlight: "yes"
      compviz.colour: red
`);
    expect(node(d, "a")).toMatchObject({ app: "redis", category: "cache", highlight: false });
    expect(d.warnings).toHaveLength(4);
    for (const key of ["compviz.type", "compviz.icon", "compviz.highlight", "compviz.colour"]) {
      expect(d.warnings.some((w) => w.startsWith(`a: ${key}`))).toBe(true);
    }
  });
});

describe("Edge Annotations", () => {
  test("label and animate an Edge, and create one depends_on lacks", () => {
    const d = diagram(`
services:
  api:
    build: .
    depends_on: [db]
    labels:
      compviz.edge.db.label: SQL
      compviz.edge.events.animated: "true"
  db: { image: postgres }
  events: { image: nats }
`);
    expect(d.edges).toContainEqual({ from: "api", to: "db", label: "SQL", animated: false });
    expect(d.edges).toContainEqual({ from: "api", to: "events", animated: true });
  });
  test("hidden suppresses an Edge even when another Annotation names it", () => {
    const d = diagram(`
services:
  api:
    build: .
    depends_on: [db]
    labels: { compviz.edge.db.hidden: "true", compviz.edge.db.label: SQL }
  db: { image: postgres }
`);
    expect(d.edges).toEqual([]);
  });
  test("targets may contain dots", () => {
    const d = diagram(`
services:
  api: { build: ., labels: { compviz.edge.db.primary.label: SQL } }
  db.primary: { image: postgres }
`);
    expect(d.edges).toEqual([{ from: "api", to: "db.primary", label: "SQL", animated: false }]);
  });
  test("a missing target or an unknown property warns", () => {
    const d = diagram(`
services:
  api: { build: ., labels: { compviz.edge.ghost.label: x, compviz.edge.api2.colour: red } }
  api2: { build: . }
`);
    expect(d.edges).toEqual([]);
    expect(d.warnings).toHaveLength(2);
  });
});

describe("Diagram Settings", () => {
  test("default to top-to-bottom with no title", () => {
    expect(diagram("services: { a: { image: x } }").settings).toEqual({ direction: "TB" });
  });
  test("read direction and title from x-compviz", () => {
    const d = diagram(`
x-compviz: { direction: lr, title: Shop }
services: { a: { image: x } }
`);
    expect(d.settings).toEqual({ direction: "LR", title: "Shop" });
  });
  test("invalid settings warn and fall back", () => {
    const d = diagram(`
x-compviz: { direction: diagonal, theme: dark }
services: { a: { image: x } }
`);
    expect(d.settings.direction).toBe("TB");
    expect(d.warnings).toHaveLength(2);
  });
});
