# Annotations live in the Compose File: service labels keyed by target, plus `x-compviz`

Users customise the Diagram inside their own Compose File, so one paste carries everything and the file still runs with `docker compose`. Service and Edge options are `compviz.*` service labels. Edge options are keyed by the target service on the source service (`compviz.edge.db.label`), because Compose has nowhere to put labels on a dependency. Diagram Settings go in a top-level `x-compviz` block, because labels can only sit on services.

## Considered Options

- **A sidecar config file**: rejected. It splits one paste into two inputs and drifts out of step with the Compose File.
- **A single JSON-valued label** (`compviz: '{...}'`): rejected. Quoting it in YAML is painful, and it's unreadable in diffs.
- **Edge options inside `depends_on` long syntax**: rejected. Compose validates `depends_on` keys and would reject unknown ones. This option also couldn't express Edges that `depends_on` doesn't declare.

## Consequences

Once users have Annotations in real Compose Files, the syntax is effectively frozen. Renaming a key needs a deprecation path.
