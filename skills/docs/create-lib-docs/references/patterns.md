# Documentation patterns worth copying

What the four reference projects do well, taken from their documentation sources (FastAPI
`docs/en/mkdocs.yml`, Pydantic `mkdocs.yml`, Effect `website` repo, DuckDB `duckdb-web` repo), and how
each pattern maps onto a docs folder written in plain Markdown.

## Information architecture

| Section | Reader's question | Borrowed from | What goes in it |
|---|---|---|---|
| Landing (`README.md`) | "What is this, and should I care?" | FastAPI `index.md` + `features.md` | 3-line pitch, 30-second example with output, feature bullets, a map of the docs |
| Getting started | "How do I get my first success?" | Pydantic *Get Started* (Welcome, Why, Install, Migration); Effect *Getting Started* (Why Effect, Installation, …); DuckDB quickstart | `why-<lib>`, installation, quickstart |
| Tutorial | "Teach me, step by step" | FastAPI *Tutorial – User Guide* (first-steps → … → testing), then *Advanced User Guide* | Numbered pages; each builds on the previous; each ends in a Recap |
| How-to guides | "How do I do X?" | DuckDB *Guides* (by task: file formats, performance, network/cloud), Pydantic *Examples* (files, requests, queues, databases) | Self-contained recipes titled by the task |
| Concepts | "Why does it work this way?" | Pydantic *Concepts* + *Internals/Architecture*; Effect topic sections (error management, concurrency, …) | Mental models, architecture, trade-offs, diagrams |
| Reference | "What exactly does X accept and return?" | FastAPI *Reference*, Pydantic *API Documentation*, DuckDB *SQL* / *Clients* | Exhaustive, terse, one entry per flag/function/key/field |
| Errors | "What does this error mean, and how do I fix it?" | Pydantic *Error Messages* (Usage Errors: one `{#error-code}` anchor per error, with a snippet that triggers it and the fix) | One anchor per error/exit code: message, cause, fix |
| Comparisons | "I know X; how does this differ?" | Effect *Additional resources* (Coming from ZIO, Effect vs Promise, Myths); FastAPI *Alternatives* | Short, fair, specific |
| FAQ / troubleshooting | "Something's wrong" | DuckDB `troubleshooting.md`; Effect *Myths* | Symptom → cause → fix |
| License (`license.md`) | "Can I use this, and under what terms?" | Every package registry's license field; projects that vendor third-party code list it in a NOTICE or third-party table | The library's license, then a table: each bundled part, its license, where declared |
| Agent index | "Load these docs into my context" | Pydantic `llmstxt` plugin (`llms.txt`, `llms-full.txt`, sections from concepts/API); Effect `llms.txt` | Generated from the docs |

This is the [Diátaxis](https://diataxis.fr/) split (tutorials, how-to guides, explanation,
reference), which the reference projects arrive at independently. The rule that matters most:
**one kind per page**.

## Page-level patterns

- **FastAPI: progressive, runnable tutorial.** Each step is a complete file the reader can run
  (`{* docs_src/first_steps/tutorial001_py310.py *}`), followed by how to run it, the exact output to
  expect, then line-by-line explanation with highlighted lines (`hl_lines`). Tips sit in
  `/// tip` blocks. Pages end with a "Recap". *In Markdown:* complete snippets, an output block, GitHub
  alerts (`> [!TIP]`), and a closing "Recap" list.
- **Pydantic: errors as documentation.** `errors/usage_errors.md` has one section per error code with
  an explicit anchor (`## Class not fully defined {#class-not-fully-defined}`), a minimal snippet
  that triggers it, and the fix. *In Markdown:* one `###` heading per error or exit code, so GitHub
  makes the anchor; show the exact message, the cause and the fix.
- **Pydantic and Effect: docs for LLMs.** Pydantic generates `llms.txt` and `llms-full.txt` (with
  a Markdown description and sections from `concepts/*.md` and `api/*.md`); Effect publishes
  `llms.txt` too. *Here:* `scripts/build_llms_txt.py`.
- **Effect: annotated examples.** Examples are titled ("**Example** (Creating an Effect That Can
  Fail)"), and type information is drawn inline with ASCII callouts
  (`┌─── Represents the error type`). *In Markdown:* bold "Example (…)" captions, and `text` blocks with
  callouts for schemas and shapes.
- **Effect: "Why X" and "Myths".** Motivation and misconceptions get their own pages instead of
  cluttering the tutorial.
- **DuckDB: task-first guides.** Guides are grouped by what the reader is trying to do (import a
  file format, tune performance, connect a tool), and kept apart from the SQL reference, which is
  organised by language construct.
- **All four: navigation.** Every page sits in one sidebar section, and its title says what it is.
  *In Markdown:* each section's `README.md` lists its pages in order, and each page ends with next or
  previous links.

## Writing for humans and agents at once

| Need | Human | Agent | Do this |
|---|---|---|---|
| Find the right page | Sidebar, search | `llms.txt` | Descriptive titles; one-sentence summary first |
| Copy an example | Copy button | Reads source | Complete snippets, no prompts, labelled fences |
| Know the exact contract | Skims tables | Parses text | JSON schemas with types; every flag listed |
| Understand a diagram | Looks at it | Can't see it | Text equivalent beside every image |
| Handle failure | Reads error | Branches on exit code | Error/exit-code table with stable anchors |
| Link precisely | Clicks | Cites a URL | Stable heading anchors; don't rename pages casually |
