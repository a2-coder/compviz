import { afterEach, expect, test } from "bun:test";
import { POST } from "./route";

const post = (body: string, query = "") => POST(new Request(`http://localhost/api/svg${query}`, { method: "POST", body }));
const compose = "services: { api: { build: ., depends_on: [db] }, db: { image: postgres } }";

afterEach(() => delete process.env.COMPVIZ_API);

test("is off unless COMPVIZ_API=true", async () => {
  expect((await post(compose)).status).toBe(404);
  process.env.COMPVIZ_API = "1";
  expect((await post(compose)).status).toBe(404);
});

test("returns the SVG Export with embedded fonts", async () => {
  process.env.COMPVIZ_API = "true";
  const res = await post(compose);
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toStartWith("image/svg+xml");
  const svg = await res.text();
  expect(svg).toStartWith("<svg");
  expect(svg).toContain("@font-face");
  expect(svg).toContain("Made with compviz");
  expect(svg).toContain("#ffffff");
  expect(await (await post(compose, "?theme=dark")).text()).toContain("#18181b");
});

test("rejects invalid and oversized input", async () => {
  process.env.COMPVIZ_API = "true";
  const bad = await post("services: [");
  expect(bad.status).toBe(400);
  expect(await bad.text()).not.toBe("");
  expect((await post("name: x")).status).toBe(400);
  expect((await post("#".repeat(1_000_001))).status).toBe(413);
});
