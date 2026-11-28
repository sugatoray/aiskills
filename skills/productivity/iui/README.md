# IUI

Create an interactive answer, walkthrough, comparison, calculator, or diagram.

```text
/iui [[ Explain how a RAG system retrieves and cites evidence. ]] -f walkthrough -o html
```

`-f` is short for `--format`, and `-o` is short for `--output`. Both forms accept the same values.

Open [the example](assets/examples/rag_demo.html) and select the stages. `/IUI` is an accepted prompt alias; the portable skill name is `iui`.

IUI creates interfaces using the capabilities available to the host. It does not activate or reproduce ChatGPT's native Intelligent UI. Depending on the host, the result may be rendered inline or delivered as an offline HTML file.

Once this skill is available in the repository, install it using `npx skills add sugatoray/aiskills --skill iui`.
