import { describe, expect, test } from "bun:test";
import { completeCompose } from "./complete";

/** Completions at the `|` in `doc`: [typed partial, labels, applies]. */
function at(doc: string) {
  const pos = doc.indexOf("|");
  const r = completeCompose(doc.replace("|", ""), pos);
  return r && { partial: doc.slice(r.from, pos), labels: r.options.map((o) => o.label), applies: r.options.map((o) => o.apply ?? o.label) };
}

const BASE = `services:
  api:
    build: .
  db:
    image: postgres
`;

describe("keys", () => {
  test("top-level keys at column 0", () => {
    expect(at("serv|")!.labels).toContain("services");
    expect(at("x-|")!.applies).toContain("x-compviz: ");
  });
  test("service keys inside a Service", () => {
    const r = at(`services:\n  api:\n    dep|`)!;
    expect(r.partial).toBe("dep");
    expect(r.labels).toContain("depends_on");
  });
  test("Diagram Settings inside x-compviz", () => {
    expect(at(`x-compviz:\n  di|`)!.labels).toEqual(["title", "direction"]);
  });
  test("nothing for Service names under services", () => {
    expect(at(`services:\n  a|`)).toBeNull();
  });
});

describe("compviz labels", () => {
  test("map-form labels suggest Annotations and Edge Annotations to other Services", () => {
    const r = at(`${BASE}  web:\n    labels:\n      compviz.|`)!;
    expect(r.partial).toBe("compviz.");
    expect(r.labels).toContain("compviz.highlight");
    expect(r.labels).toContain("compviz.edge.api.animated");
    expect(r.labels).not.toContain("compviz.edge.web.label");
    expect(r.applies).toContain("compviz.name: ");
  });
  test("list-form labels apply with = and complete values after it", () => {
    expect(at(`${BASE}  web:\n    labels:\n      - compviz.ty|`)!.applies).toContain("compviz.type=");
    expect(at(`${BASE}  web:\n    labels:\n    - compviz.type=q|`)!.labels).toContain("queue");
  });
  test("values for type, icon and booleans", () => {
    expect(at(`${BASE}  web:\n    labels:\n      compviz.type: |`)!.labels).toContain("cache");
    expect(at(`${BASE}  web:\n    labels:\n      compviz.icon: re|`)!.labels).toContain("redis");
    expect(at(`${BASE}  web:\n    labels:\n      compviz.edge.db.animated: |`)!.labels).toEqual(["true", "false"]);
  });
  test("direction values in x-compviz", () => {
    expect(at(`x-compviz:\n  direction: |`)!.labels).toEqual(["TB", "LR", "RL", "BT"]);
  });
});

describe("Service references", () => {
  test("depends_on block lists and flow sequences suggest other Services", () => {
    expect(at(`${BASE}  web:\n    depends_on:\n      - |`)!.labels).toEqual(["api", "db"]);
    expect(at(`${BASE}  web:\n    depends_on: [api, d|`)!.labels).toEqual(["api", "db"]);
    expect(at(`${BASE}  web:\n    depends_on: [api, d|`)!.partial).toBe("d");
  });
  test("a Service never suggests itself", () => {
    expect(at(`services:\n  api:\n    depends_on: [|\n  db:\n    image: x`)!.labels).toEqual(["db"]);
  });
  test("image suggests Known Apps", () => {
    expect(at(`services:\n  db:\n    image: post|`)!.labels).toContain("postgres");
  });
});
