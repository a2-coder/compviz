# Glossary

**Compose File**: The single Docker Compose YAML document a user pastes in. compviz reads only this text: no included files, no `.env`, and no variable interpolation.

**Service**: An entry under `services:` in the Compose File. Each Service is one Node in the Diagram.

**Diagram**: The architecture picture generated from one Compose File: Nodes, Edges and diagram-wide settings.

**Node**: The box that represents one Service in the Diagram. Volumes, networks and ports are never Nodes. They appear as details on a Service's Node.

**Edge**: A directed link from a dependent Service to the Service it depends on (`api → db` reads "api uses db"). It comes from `depends_on`, `links` or an Edge Annotation.

**Category**: The role of a Service, chosen from a closed set: database, cache, queue, search, storage, proxy, observability, or service (the default).

**Catalogue**: compviz's list of Known Apps. Each entry names the app, its image aliases, its Category and its logo.

**Known App**: An app in the Catalogue, such as Postgres or Redis. A Service is recognised as a Known App by its image name, never by its service name.

**Annotation**: A `compviz.*` label on a Service that adds to or overrides what compviz infers about the Service or its outgoing Edges.

**Edge Annotation**: An Annotation of the form `compviz.edge.<target>.*`. It sets details of the Edge to the target Service, and creates that Edge if `depends_on` doesn't already declare it.

**Diagram Settings**: Options for the whole Diagram, such as layout direction, set in the top-level `x-compviz` block of the Compose File.

**Highlight**: An Annotation-driven emphasis that makes one Node stand out from the rest.

**Preview**: The interactive view of the Diagram inside compviz. It can be panned and zoomed.

**Export**: A downloadable copy of the whole Diagram, as an SVG, PNG or PDF file. It looks the same as the Preview, whatever the current pan and zoom.

**Attribution**: The line "Made with compviz · compviz.a2coder.dev" at the bottom of every Export. It never appears in the Preview.
