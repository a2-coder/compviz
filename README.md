# compviz

Turn a Docker Compose file into an architecture diagram. Paste a `compose.yaml`, and compviz draws each service as a node and each dependency as an edge. You can pan and zoom the preview and export it as SVG, PNG or PDF.

Live at [compviz.a2coder.dev](https://compviz.a2coder.dev). Part of a2coder labs, by [@a2coder](https://github.com/a2-coder).

## How it reads your file

- Every entry under `services:` becomes a **node**. Volumes, networks and ports show as details on their service's node, not as nodes of their own.
- `depends_on` and `links` become **edges**, drawn from the dependent service to the one it uses (`api → db` reads "api uses db").
- Well-known images (Postgres, Redis, RabbitMQ, Traefik and 51 more) get their logo and a **category**: database, cache, queue, search, storage, proxy, observability or service. compviz recognises an app by its image, never by its service name.
- compviz only reads the text you paste. It doesn't follow includes, read `.env` files or interpolate variables.

## Customising the diagram

You can customise the diagram from inside the Compose file, so it still runs with `docker compose`. The editor autocompletes every key below.

**Diagram settings** go in a top-level `x-compviz` block:

| Key | Values |
| --- | --- |
| `title` | Diagram title |
| `direction` | `TB` (default), `LR`, `RL`, `BT` |

**Service annotations** are `compviz.*` labels on a service:

| Label | Effect |
| --- | --- |
| `compviz.name` | Display name |
| `compviz.type` | Category: `database`, `cache`, `queue`, `search`, `storage`, `proxy`, `observability`, `service` |
| `compviz.icon` | Use a known app's logo, for example `postgres` |
| `compviz.highlight` | `"true"` makes the node stand out |
| `compviz.hidden` | `"true"` leaves the service out of the diagram |

**Edge annotations** are `compviz.edge.<target>.*` labels on the source service. If `depends_on` doesn't already declare the edge, the annotation creates it.

| Label | Effect |
| --- | --- |
| `compviz.edge.<target>.label` | Edge label |
| `compviz.edge.<target>.animated` | `"true"` animates the edge |
| `compviz.edge.<target>.hidden` | `"true"` hides the edge |

```yaml
x-compviz:
  title: Storefront
  direction: LR

services:
  api:
    build: ./api
    depends_on: [db]
    labels:
      compviz.name: Orders API
      compviz.highlight: "true"
      compviz.edge.db.label: SQL
      compviz.edge.events.label: events
      compviz.edge.events.animated: "true"
  db:
    image: postgres:16-alpine
  events:
    image: rabbitmq:3-management
```

compviz shows a warning for an unknown key or an invalid value instead of failing. See [docs/adr/0001-annotation-syntax.md](docs/adr/0001-annotation-syntax.md) for why the syntax works this way, and [GLOSSARY.md](GLOSSARY.md) for the terms.

## Convert a Compose File With an Agent

compviz ships a `compviz:convert` agent skill that annotates an existing Compose File for you: it adds `compviz.*` labels and an `x-compviz` block, infers edges `depends_on` misses (from URLs like `DATABASE_URL=postgres://db:5432`), and hides one-shot jobs, without changing how the file runs. The Guide (book icon in the app header) has the same instructions as a prompt you can paste into any AI chat.

**Claude Code.** Install the plugin from this repository, in one step on Claude Code 2.1.275 or later:

```text
/plugin install compviz --marketplace a2-coder/compviz
```

On older versions, add the marketplace first:

```text
/plugin marketplace add a2-coder/compviz
```

```text
/plugin install compviz@compviz
```

Then ask "convert my compose file for compviz", or run `/compviz:convert` (optionally with a path, for example `/compviz:convert deploy/compose.yaml`).

**Other agents** (Cursor, Codex, Gemini CLI, GitHub Copilot and others that read `SKILL.md` skills). Install with the [skills](https://skills.sh) CLI:

```bash
npx skills add a2-coder/compviz
```

Or copy [skills/convert/SKILL.md](skills/convert/SKILL.md) into your agent's skills folder, for example `.claude/skills/convert/SKILL.md` for a single project.

## Live viewer count

The header can show how many browser tabs have compviz open right now, using [Supabase Realtime Presence](https://supabase.com/docs/guides/realtime/presence). Nothing is stored, and no table is needed. It's off unless both variables are set at build time:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

With either one missing, the count isn't shown and no connection is opened. The publishable key is public, so the count is for show, not a trustworthy metric.

## SVG API (self-hosted)

A self-hosted copy can expose an HTTP endpoint that turns a Compose file into the same SVG you get from the Export button, so you can generate diagrams from scripts or CI. **It's off by default**, and it isn't enabled on compviz.a2coder.dev. To turn it on, set `COMPVIZ_API=true` in the server's environment:

```bash
bun run build
```

```bash
COMPVIZ_API=true bun run start
```

`COMPVIZ_API=true bun dev` works too. Any value other than `true` leaves the endpoint off.

**`POST /api/svg`**

- **Body:** the Compose file as raw YAML text, up to 1MB. `x-compviz` settings and `compviz.*` annotations apply as in the app.
- **Query:** `theme=dark` for the dark palette. The default is `light`.
- **Response:** `200` with `Content-Type: image/svg+xml`. The SVG is standalone: JetBrains Mono is embedded, so it renders the same anywhere, and it carries the "Made with compviz" line like every Export.

| Status | When |
| --- | --- |
| `400` | The YAML doesn't parse, or the file has no services. The body is the error message. |
| `404` | The API is off (`COMPVIZ_API` isn't `true`). |
| `405` | Any method other than `POST`. |
| `413` | The body is over 1MB. |

Warnings shown in the editor (an unknown annotation key, an invalid value) aren't reported by the API. Those keys are ignored and the diagram still renders.

```bash
curl --fail --data-binary @compose.yaml -o diagram.svg http://localhost:3000/api/svg
```

```bash
curl --fail --data-binary @compose.yaml -o diagram-dark.svg "http://localhost:3000/api/svg?theme=dark"
```

The endpoint has no authentication or rate limiting. If you enable it on a public host, put it behind something that does.

## Adding Known Apps (self-hosted)

The Known Apps live in [lib/compose/catalogue.ts](lib/compose/catalogue.ts). To add one, add an entry to `CATALOGUE`. Its key is the value for `compviz.icon`:

```ts
// a logo from Simple Icons (https://simpleicons.org): import it as si<Name>
import { siSupabase } from "simple-icons";

supabase: { name: "Supabase", category: "database", aliases: ["supabase/postgres"], logo: siSupabase },
```

- `name`: the display name.
- `category`: one of the categories above. It sets the fallback icon and colour.
- `aliases`: image repositories that match the app. An alias matches the whole repository (`node`) or its trailing segments (`oven/bun` matches `docker.io/oven/bun:1`), ignoring the tag and digest.
- `logo`: optional. Without it, the node shows its category's icon.

**A custom logo** doesn't have to come from Simple Icons. Any object with a `path` and a `hex` works. The `path` is the `d` attribute of one SVG `<path>` drawn in a 24×24 viewBox, and `hex` is its colour without the `#`:

```ts
acme: {
  name: "Acme Gateway",
  category: "proxy",
  aliases: ["acme/gateway"],
  logo: { path: "M12 2 2 22h20L12 2Zm0 5 6.5 13h-13L12 7Z", hex: "E11D48" },
},
```

If your logo has several paths, merge them into one (most SVG editors and [SVGOMG](https://jakearchibald.github.io/svgomg/) can do this) and scale it to 24×24 first. A logo too dark or too light for a theme is drawn in the theme's text colour instead, so it stays visible.

Then run `bun test`: it checks that the agent skill lists every Known App, so add the new key to the list in [skills/convert/SKILL.md](skills/convert/SKILL.md) too. The editor's autocomplete, the Guide and the conversion prompt pick up the new entry by themselves.

## Development

Built with Next.js 16, Tailwind CSS v4 and shadcn/ui (Base UI), with a CodeMirror 6 editor and dagre for layout. Use [bun](https://bun.sh):

```bash
bun install
```

```bash
bun dev
```

```bash
bun test
```

```bash
bun run lint
```

```bash
bun run build
```

`bun dev` serves the app at [http://localhost:3000](http://localhost:3000). The Compose-to-diagram conversion in `lib/compose/` is pure and unit-tested; see [CLAUDE.md](CLAUDE.md) for the code layout and design rules.

Copyright © 2026 Arjun Palakkazhi. All rights reserved. 
