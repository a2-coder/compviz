import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { CATALOGUE, CATEGORIES } from "./catalogue";
import { composeToDiagram } from "./compose-to-diagram";
import { CONVERT_PROMPT } from "./convert-prompt";

const skill = readFileSync(new URL("../../skills/convert/SKILL.md", import.meta.url), "utf8");

test("the skill and the Guide prompt list every Known App and Category", () => {
  for (const name of [...Object.keys(CATALOGUE), ...CATEGORIES]) {
    expect(skill).toContain(name);
    expect(CONVERT_PROMPT).toContain(name);
  }
});

test("the skill's example output is a valid, warning-free annotated Compose File", () => {
  const after = [...skill.matchAll(/```yaml\n([\s\S]*?)```/g)].at(-1)![1];
  const result = composeToDiagram(after);
  expect(result.ok && result.warnings).toEqual([]);
  expect(result.ok && result.edges.map((e) => `${e.from}>${e.to}`)).toEqual(["api>db", "api>events"]);
});
