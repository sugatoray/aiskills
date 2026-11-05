# Page templates

Skeletons to start each page type from. Replace the `<…>` placeholders and delete any part the page
doesn't need, but keep the order.

## Landing page (`README.md`)

````markdown
# <Library>

<One sentence: what it is and who it's for.>

<Two sentences: the problem it solves and how.>

```bash
<install command>
<the smallest useful command or call>
```

```text
<its real output>
```

## Features

- **<Feature>**: <one line, concrete>.

## Documentation

### Getting started
- [Why <lib>](getting-started/why-<lib>.md): <summary>
- [Installation](getting-started/installation.md): <summary>
- [Quickstart](getting-started/quickstart.md): <summary>

### Tutorial
- [<Step title>](tutorial/01-<slug>.md): <summary>

### How-to guides
- [<Task>](guides/<slug>.md): <summary>

### Concepts
- [<Concept>](concepts/<slug>.md): <summary>

### Reference
- [<Surface>](reference/<slug>.md): <summary>

### Help
- [FAQ and troubleshooting](faq.md): <summary>
````

`scripts/build_llms_txt.py` builds `llms.txt` from these `###` sections and their link lists, so
keep this shape. Use `- [Title](path): summary`, one link per item.

## Tutorial step

````markdown
# <N>. <What the reader does in this step>

<One sentence: what you'll be able to do after this step.>

**You'll need:** <prerequisites, or "the previous step">.

## <Action>

```bash
<complete command or file>
```

```text
<real output>
```

<Explain what happened, in the order it happened. Point at the parts of the output that matter.>

> [!TIP]
> <one tip, only if it saves the reader real trouble>

## Recap

- <what was learned, one line each>

Reference: [`<thing>`](../reference/<page>.md#<anchor>) · Next: [<N+1>. <title>](<file>.md) · Previous: [<N-1>. <title>](<file>.md)
````

## How-to guide

````markdown
# How to <do the task>

<One sentence: when you'd want this.>

## Steps

1. <step>

   ```bash
   <command>
   ```

## Variations

### <variation>

## Troubleshooting

- **<symptom>**: <cause and fix>.

See also: [<concept>](../concepts/<page>.md) · [<reference>](../reference/<page>.md#<anchor>)
````

## Concept page

````markdown
# <Concept>

<One sentence: the idea, plainly.>

![<alt text that states what the diagram shows>](../images/<diagram>.svg)

<The same information as text: numbered steps or a table, for readers who can't see the image.>

## Why it works this way

## Trade-offs and limits

See also: …
````

## Reference page

````markdown
# <Surface> reference

<One sentence: what this page covers, and that it is exhaustive.>

## <Group>

### `<name>`

<What it does, in one or two sentences.>

| | |
|---|---|
| Type | `<type>` |
| Default | `<default>` |
| Env / config | `<CALLAI_…>` / `<key>` |

```bash
<minimal example>
```

See: [<guide that uses it>](../guides/<page>.md)
````

## Error entry (in the errors reference)

````markdown
### <Error name or exit code>

```text
<exact message, with placeholders in <angle brackets>>
```

**Cause:** <why it happens>.

**Fix:** <what to do>.
````
