---
name: subskill-dispatcher
description: "Dispatch a named subskill from within a parent skill using the ::s syntax, with inherited context, scoped options, explicit resolution, and preserved output contracts."
license: MIT
compatibility: "Skill runtimes that support slash-command composition or nested skill loading."
disable-model-invocation: true
metadata:
  - name: subskill-dispatcher
    type: skill
    author: sugatoray
    version: "0.2.1"
    source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/development/building-blocks/subskill-dispatcher"
---

# Subskill Dispatcher

Use this skill when a parent slash skill exposes named child capabilities in the form:

```text
/{{parent-skill}} ::s {{subskill}} [arguments] [--options]
```

The dispatcher is a protocol for skill composition. It does not replace the parent skill's domain instructions and does not invent unavailable subskills.

## Invocation model

Interpret the command as four parts:

```text
/{{parent-skill}} ::s {{subskill}} [arguments] [--options]
```

- `parent-skill`: the active or explicitly named parent skill.
- `::s`: the subskill operator.
- `subskill`: the child skill name or registered alias.
- `arguments` and `--options`: input and configuration for the child skill.

Options before `::s` belong to the parent. Options after `::s` belong to the child. The original subject, files, constraints, and required output format are inherited unless the child explicitly overrides them.

Example:

```text
/visualize [[coffee production]] --output html ::s infographic --orientation landscape --theme editorial
```

Conceptually:

```json
{
  "parent": "visualize",
  "subskill": "infographic",
  "input": "coffee production",
  "parent_options": {"output": "html"},
  "subskill_options": {
    "orientation": "landscape",
    "theme": "editorial"
  }
}
```

## Resolution

Resolve the child in this order:

1. An exact parent-local subskill name.
2. An exact globally available skill name.
3. A declared alias.

If no exact match exists, stop and report the unknown subskill plus the parent's supported subskills. Do not silently select a similarly named skill.

If the environment supports loading or invoking skills, load the resolved child skill and follow its instructions. If the child is unavailable, return a blocked result rather than pretending it ran.

## Parent contract

A parent skill that supports this protocol should declare its registry:

```markdown
## Subskills

- `carousel` — create a sequential visual presentation.
- `infographic` — create a structured explanatory graphic.
- `export` — convert the parent result to a requested file format.

Syntax:

```text
/{{skill-name}} ::s {{subskill}} [arguments] [--options]
```
```

The parent owns the overall task and final response. The child owns only its declared specialization.

## Context and option rules

- Pass the original subject or source to the child.
- Preserve parent constraints, audience, accessibility requirements, and output expectations.
- Treat child options as child-scoped.
- A child may override an inherited setting only when the override is explicit and compatible with the parent contract.
- Do not let a child silently change unrelated parent behavior.
- Preserve files, artifacts, warnings, errors, and verification results when returning to the parent.

## Chaining

Chaining is allowed only when the parent or child declares it:

```text
/visualize ::s infographic ::s export --format pdf
```

Evaluate an allowed chain left to right. Each stage receives the prior stage's result and inherited task context. A child must not recursively dispatch another child unless nested composition is supported.

Existing pipe composition remains valid for modifier-style skills:

```text
/visualize [[a mechanical watch]] | /scroll-sequence
```

Use `::s` for a named capability owned by a parent and `|` for an independently composable modifier.

## Result contract

Represent the child result internally as:

```json
{
  "status": "completed | partial | blocked",
  "artifacts": [],
  "content": {},
  "warnings": [],
  "verification": []
}
```

The parent determines the final user-facing response. Do not expose this structure unless machine-readable output was requested.

## Failure behavior

For an invalid, unavailable, or incompatible child:

- identify the exact failure;
- list valid alternatives when known;
- preserve completed parent-level work;
- do not fabricate child output;
- stop before external mutations if the child cannot be resolved or validated.

## Design invariants

- Context flows downward; results flow upward.
- Names and aliases must resolve explicitly.
- Parent and child options remain scoped.
- Child output must satisfy the parent's declared output contract.
- Generated artifacts retain their source and verification status.
- Subskills should remain independently usable whenever practical.

See `meta/MAINTAINERS.md` for maintenance-only layout and versioning notes.