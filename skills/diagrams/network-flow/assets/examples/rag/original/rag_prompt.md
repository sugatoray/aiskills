# RAG network-flow demo prompt

Original invocation used to produce [rag_demo.html](rag_demo.html):

```text
/network-flow [[
Explain a RAG system with ingestion, retrieval, reranking,
generation, citations, and a failed retrieval path.
]]
--theme dark-grid
--routing orthogonal
--scenarios ingest,answer,retry,all
--mode simulated
--output html
```

The HTML is the original delivered standalone file. The handbook quotation is
illustrative, not a sourced policy. Flows are simulated rather than telemetry.
