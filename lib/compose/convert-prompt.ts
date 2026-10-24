import { CATALOGUE, CATEGORIES } from "./catalogue";
import { DIRECTIONS } from "./compose-to-diagram";

/** The Guide's copyable prompt; the same rules as the `compviz:convert` skill in `skills/convert/SKILL.md`. */
export const CONVERT_PROMPT = `Convert the Docker Compose file below into a compviz-annotated Compose file, so compviz (https://compviz.a2coder.dev) draws a clear architecture diagram from it.

Rules:
- Only add service \`labels\` and a top-level \`x-compviz\` block. Change nothing else: the file must still run with \`docker compose\`. Keep comments, order and formatting. If a service writes labels as a list, add \`- "compviz.key=value"\` items; otherwise use a mapping.
- Quote every boolean label value: "true" or "false".
- x-compviz: set \`title\` (from the top-level \`name:\` or what the stack does) and \`direction\` (one of ${DIRECTIONS.join(", ")}; TB unless a left-to-right pipeline reads better).
- compviz.name: a short Title Case display name for each service whose id isn't already readable.
- compviz.icon: only when the image is a known app compviz doesn't recognise by name (for example timescale/timescaledb → postgres). Known apps: ${Object.keys(CATALOGUE).join(", ")}.
- compviz.type: only when the category is clear and the image isn't a known app. Categories: ${CATEGORIES.join(", ")}.
- compviz.highlight: "true" on the one or two core services the diagram is about.
- compviz.hidden: "true" on one-shot or tooling containers (migrations, seeders, init jobs, admin UIs) that clutter the diagram.
- Edges come from depends_on and links, drawn from the dependent service to the one it uses. On the source service, add compviz.edge.<target>.label with the protocol or purpose (SQL, REST, gRPC, AMQP, cache, events).
- Add edges depends_on misses: when environment values, commands or proxy labels point at another service's hostname (for example DATABASE_URL=postgres://db:5432), add compviz.edge.<target>.label on the source; the annotation creates the edge.
- compviz.edge.<target>.animated: "true" for asynchronous or streaming flows (queues, events).
- compviz.edge.<target>.hidden: "true" for edges that are noise (for example every service depending on a log collector).
- Use only the keys above; compviz warns about anything else.

Reply with the complete annotated Compose file in one yaml code block, then one line per annotation you inferred rather than read from the file.

Compose file:

`;
