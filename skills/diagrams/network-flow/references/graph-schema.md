# Graph contract

Supply a UTF-8 JSON object. Runtime generation requires only Python 3.9+.

| Field | Shape | Meaning |
| --- | --- | --- |
| `title` | Nonempty string | Diagram title |
| `subtitle`, `eyebrow` | Optional strings | Supporting label |
| `colors` | Optional map of key to `#RRGGBB` | Defaults to one blue `flow` color |
| `nodes` | 1–24 objects | `id`, `name`; optional `kind`, `sub`, `detail`, `color` |
| `edges` | Array of objects | `id`, `from`, `to`; optional `kind` referencing colors |
| `scenarios` | Optional map | Scenario ID to `label`, `scope` edge IDs, and `steps` |
| `steps` | Ordered array | Each object has an in-scope `edge` and explanatory `text` |
| `layouts` | Optional map | `wide`, `medium`, `narrow` → node ID → `[column,row]` |
| `legend` | Optional map | Color key to human-facing label |
| `footer` | Optional object | Strings: `label`, `text`, `reference`, `note` |

Use lowercase hyphenated IDs starting with a letter, up to 64 characters. Node
and edge IDs are unique within their own collections. Edges must reference real,
distinct nodes; self-loops require a separate state node. The source → destination
order defines packet direction. All display text is inserted as text, never HTML.
Colors must be six-digit hex values. Every explicit responsive layout must place
all nodes in unique cells, with columns under 4/3/2 for wide/medium/narrow and rows
between 0 and 23. Omit layouts for automatic row placement.

The renderer creates the reserved `all` scenario from every edge. Other scenarios
need at least one step. A step lasts 2.6 seconds; source captions advance in order.
Non-active topology remains visible but subdued. Scenario timelines are explanatory
sequences, not distributed-system traces: label concurrent/alternative behavior.

```json
{
  "title": "Request and response",
  "nodes": [
    {"id": "client", "name": "Client"},
    {"id": "api", "name": "API"},
    {"id": "database", "name": "Database"}
  ],
  "edges": [
    {"id": "request", "from": "client", "to": "api"},
    {"id": "lookup", "from": "api", "to": "database"}
  ],
  "scenarios": {
    "read": {
      "label": "Read",
      "scope": ["request", "lookup"],
      "steps": [
        {"edge": "request", "text": "The client requests a record."},
        {"edge": "lookup", "text": "The API queries storage."}
      ]
    }
  }
}
```

For a full example with failure and recovery, read `../examples/rag.json`.
