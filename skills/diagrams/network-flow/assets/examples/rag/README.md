# RAG example

Two versions of the same RAG network-flow diagram.

| Folder | Contents | Edit? |
| --- | --- | --- |
| [original/](original/) | `rag_demo.html`, the standalone HTML first delivered for the RAG prompt, and `rag_prompt.md`, the exact invocation that produced it. | No. Frozen snapshot; never regenerate it from the newer renderer. |
| [generated/](generated/) | `rag.json`, the graph in the skill's schema, and `rag.html`, rendered from it by `scripts/render.py`. | Edit `rag.json` only, then re-render `rag.html`. The unit tests fail if the two drift apart. |

Re-render from the repository root:

```sh
python3 skills/diagrams/network-flow/scripts/render.py \
  skills/diagrams/network-flow/assets/examples/rag/generated/rag.json \
  --output skills/diagrams/network-flow/assets/examples/rag/generated/rag.html
```
