---
name: convert
description: Convert a Docker Compose file into a compviz-annotated Compose file by adding compviz.* service labels and an x-compviz block, so compviz draws a clear architecture diagram. Use when the user wants to annotate, label or prepare a compose.yaml / docker-compose.yml for compviz, or asks for a better compviz diagram.
---

# compviz:convert

compviz (https://compviz.a2coder.dev) turns a Compose File into an architecture diagram: every service is a node, and every `depends_on` or `links` entry is an edge from the dependent service to the one it uses (`api → db` reads "api uses db"). This skill adds the annotations that make that diagram readable, without changing how the file runs.

## Steps

1. Find the Compose File: the path the user gave, else `compose.yaml`, `compose.yml`, `docker-compose.yaml` or `docker-compose.yml` in the working directory. If there are several, ask which one.
2. Read the whole file, including `environment`, `env_file` names, `command`, proxy labels and config mounts, to learn how services talk to each other.
3. Add the annotations below by editing the file in place, unless the user asked for a copy.
4. If `docker compose` is available, run `docker compose -f <file> config --quiet` to check the file is still valid.
5. Report each annotation you inferred rather than read from the file, one line each, so the user can check them. Suggest pasting the file into https://compviz.a2coder.dev to see the diagram.

## Rules

- Only add service `labels` and a top-level `x-compviz` block. Change nothing else: the file must still run with `docker compose`. Keep comments, key order and formatting.
- Match each service's label style: if it writes labels as a list, add `- "compviz.key=value"` items; otherwise use a mapping. Don't touch existing non-compviz labels.
- Quote every boolean value: `"true"` or `"false"`.
- Use only the keys below. compviz warns about any other `compviz.*` key or `x-compviz` setting.

### Diagram Settings: top-level `x-compviz`

| Key | Value |
| --- | --- |
| `title` | From the top-level `name:` or what the stack does, in Title Case |
| `direction` | One of `TB`, `LR`, `RL`, `BT`. `TB` (default) unless a left-to-right pipeline reads better |

### Service Annotations

| Label | When to add it |
| --- | --- |
| `compviz.name` | A short Title Case display name, for each service whose id isn't already readable |
| `compviz.icon` | Only when the image is a Known App compviz doesn't recognise by name (for example `timescale/timescaledb` → `postgres`) |
| `compviz.type` | Only when the category is clear and the image isn't a Known App |
| `compviz.highlight` | `"true"` on the one or two core services the diagram is about |
| `compviz.hidden` | `"true"` on one-shot or tooling containers (migrations, seeders, init jobs, admin UIs) that clutter the diagram |

Known Apps (values for `compviz.icon`), recognised from the image's repository name: postgres, mysql, mariadb, mongodb, cockroachdb, clickhouse, cassandra, redis, valkey, memcached, rabbitmq, kafka, nats, elasticsearch, opensearch, meilisearch, typesense, minio, nginx, traefik, caddy, haproxy, httpd, html, react, nextjs, vue, nuxt, angular, svelte, nodejs, bun, deno, express, nestjs, python, django, flask, fastapi, golang, rust, java, spring, dotnet, ruby, rails, php, laravel, wordpress, graphql, apollo, hasura, grafana, prometheus, jaeger.

Categories (values for `compviz.type`): database, cache, queue, search, storage, proxy, observability, service.

### Edge Annotations: on the source service, keyed by the target service id

| Label | When to add it |
| --- | --- |
| `compviz.edge.<target>.label` | The protocol or purpose: SQL, REST, gRPC, AMQP, cache, events |
| `compviz.edge.<target>.animated` | `"true"` for asynchronous or streaming flows (queues, events) |
| `compviz.edge.<target>.hidden` | `"true"` for edges that are noise (for example every service depending on a log collector) |

- `<target>` must be a service id in the same file.
- Add edges `depends_on` misses: when environment values, commands or proxy labels point at another service's hostname (for example `DATABASE_URL=postgres://db:5432`, or a Traefik router for `web`), add `compviz.edge.<target>.label` on the source service. The annotation creates the edge.
- Don't add `depends_on` entries to create edges; that changes start-up order.

## Example

Before:

```yaml
services:
  api:
    build: ./api
    environment:
      DATABASE_URL: postgres://db:5432/app
      AMQP_URL: amqp://events:5672
  db:
    image: timescale/timescaledb:latest-pg16
  events:
    image: rabbitmq:3-management
  migrate:
    build: ./api
    command: migrate
    depends_on: [db]
```

After:

```yaml
x-compviz:
  title: Orders
  direction: TB

services:
  api:
    build: ./api
    environment:
      DATABASE_URL: postgres://db:5432/app
      AMQP_URL: amqp://events:5672
    labels:
      compviz.name: Orders API
      compviz.highlight: "true"
      compviz.edge.db.label: SQL
      compviz.edge.events.label: events
      compviz.edge.events.animated: "true"
  db:
    image: timescale/timescaledb:latest-pg16
    labels:
      compviz.name: TimescaleDB
      compviz.icon: postgres
  events:
    image: rabbitmq:3-management
  migrate:
    build: ./api
    command: migrate
    depends_on: [db]
    labels:
      compviz.hidden: "true"
```
