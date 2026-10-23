import { expect, test } from "bun:test";
import { serviceRanges } from "./ranges";

const DOC = `x-compviz:
  title: Shop

services:
  # the API
  api:
    build: .
    labels:
      compviz.name: API

  db.primary: { image: postgres }
volumes:
  data:
`;

test("each Service block spans its lines, without trailing blank lines", () => {
  const ranges = serviceRanges(DOC);
  expect(ranges.map((r) => r.id)).toEqual(["api", "db.primary"]);
  const [api, db] = ranges;
  expect(DOC.slice(api.from, api.to)).toBe("  api:\n    build: .\n    labels:\n      compviz.name: API");
  expect(DOC.slice(api.at, api.at + 4)).toBe("api:");
  expect(DOC.slice(db.from, db.to)).toBe("  db.primary: { image: postgres }");
});

test("keys under other top-level sections are not Services", () => {
  expect(serviceRanges("volumes:\n  data:\n").map((r) => r.id)).toEqual([]);
  expect(serviceRanges("").map((r) => r.id)).toEqual([]);
});
