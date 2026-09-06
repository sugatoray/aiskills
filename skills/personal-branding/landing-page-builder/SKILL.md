---
name: landing-page-builder
description: "Researches a named person on the web and turns the findings into a polished, single-page personal landing page — a tasteful, professional one-pager, not a generic template. The research is captured first as a structured YAML data file (schema in references/data-schema.md) so the facts are reviewable and sourced, then rendered into a self-contained HTML/CSS page designed to fit that specific person. Use this whenever the user asks to build or create a personal website, personal landing page, portfolio page, or 'about me' page for a named individual (themselves, a colleague, a client, a public figure); asks to 'research X and make them a site'; or wants an existing person-data YAML file (in this schema) turned into a page. Also trigger for /landing-page-builder. Covers researching bio, career, education, achievements, projects and links from public sources, structuring that into the YAML schema for review, and designing/building the page with genuine visual taste — no generic AI-slop patterns (no purple-gradient hero, no emoji section headers, no uniform three-card grids, no fabricated stats or testimonials)."
license: MIT
compatibility: "Any environment with web research (WebSearch/WebFetch tools, or built-in web search) to gather public information about the person. Output is a self-contained static HTML/CSS file that needs no build step or backend and can be opened directly or hosted anywhere; in a Claude.ai session with the Artifact tool available, it can instead be published directly as an Artifact — see the design step below."
metadata:
  - name: landing-page-builder
    type: skill
    author: sugatoray
    version: "1.0.0"
    source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/personal-branding/landing-page-builder"
---

# Personal landing page builder

Turns "build a landing page for [person]" into two deliverables in
sequence: a sourced, reviewable **YAML data file**, and then a
**tasteful, self-contained HTML page** rendered from it. The YAML is
not an intermediate throwaway — it's the artifact that makes the page
trustworthy (every claim traceable to a source) and maintainable (edit
the data, regenerate the page, rather than hand-patching HTML that
drifts out of sync with reality).

This skill is for a genuine, specific person's page. It is not a
generic "resume website generator" — the workflow below exists
specifically to avoid the templated, could-be-anyone result that
produces.

## Workflow

1. **Scope the request.** Get the person's full name and enough context
   to disambiguate them (field, employer, location, or a URL the user
   already has for them) — see `references/research-guidelines.md`'s
   "Before searching" section. If this page is for the user themselves,
   ask what material they already have (a resume, an existing bio, a
   photo they want used) rather than re-deriving everything from search
   results; their own material outranks a third-party writeup of them.
   Don't stall on this if the request already gives enough to proceed.

2. **Research.** Search public sources for biographical, career,
   education, project, and achievement information, following
   `references/research-guidelines.md` throughout — which sources count
   as usable, why login-gated or private content is off-limits, how to
   cross-check specific claims, and the image-sourcing rule (a
   person-controlled or official photo only, otherwise no photo at
   all). Track every source URL as you go.

3. **Structure the findings into YAML**, following
   `references/data-schema.md` exactly — field names, nesting, and the
   rules on omitting rather than inventing missing fields. Write it to
   `<slug>.yaml` (kebab-case of the full name) in the user's working
   directory. Populate `sources` and `research_meta.open_questions` as
   part of this step, not as an afterthought.

4. **Show the YAML to the user before building the page.** Surface
   `research_meta.open_questions` explicitly (what you couldn't verify,
   what you omitted and why — especially any missing photo). This is
   the natural point for the user to correct a fact, add something you
   couldn't find publicly, approve or reject a testimonial, or supply
   their own photo. Building the page from unreviewed data risks
   shipping something the subject wouldn't recognize as accurate.

5. **Design and build the page.** Read `references/design-guidelines.md`
   (typography, color, layout, motion, and the specific anti-slop list)
   and `references/page-structure.md` (which sections exist, mapped 1:1
   to populated YAML fields — a section with no backing data is a
   section that doesn't render, not one filled with placeholders).
   Choose a design direction from what this person's data actually
   suggests, not a default template. Produce one self-contained HTML
   file (inline CSS, minimal vanilla JS only if it earns its place)
   unless the target explicitly wants otherwise.

   - If this session has the Artifact tool available and the user wants
     a shareable page rather than a local file, load the
     `artifact-design` skill before writing it (design-pass guidance
     that applies on top of, not instead of, `design-guidelines.md`
     above) and publish via that tool.
   - Otherwise, write the file to the user's working directory (e.g.
     `<slug>-landing-page.html`) and tell them how to preview it (open
     directly in a browser, or serve the directory locally).

6. **Self-review before delivering.** Walk the finished page against
   `design-guidelines.md`'s "Final check before delivering" list and
   `page-structure.md`'s table — every rendered section should trace to
   a populated field, and none of the specifically-banned patterns
   (emoji headers, fake stats, stock photography, dead social icons,
   placeholder text) should be present.

7. **Iterate from the data, not the markup.** When the user asks for a
   correction or addition afterward, update the YAML file first, then
   regenerate the affected section(s) of the page — keeps the two in
   sync and keeps `sources` accurate for anything added later.

## Reference files

| File | Read it when |
| --- | --- |
| [`references/research-guidelines.md`](references/research-guidelines.md) | Before and during research — disambiguating the person, what counts as a usable source, cross-checking specific claims, and the image-sourcing rule. |
| [`references/data-schema.md`](references/data-schema.md) | Writing or updating the YAML file — field names, structure, and what to omit vs. flag rather than invent. |
| [`references/design-guidelines.md`](references/design-guidelines.md) | Designing and building the HTML page — typography, color, layout/composition, motion, and the concrete list of generic patterns to avoid. |
| [`references/page-structure.md`](references/page-structure.md) | Deciding which sections to render and in what order, mapped to which YAML fields back each one. |
| [`assets/example-person.yaml`](assets/example-person.yaml) | Needing a worked example of the schema filled in — a fictional person; never reuse its facts or testimonial as real content. |

## What this skill doesn't do

- Doesn't fabricate biographical facts, quotes, testimonials, or stats
  to make a thin research result look more complete — see
  `references/research-guidelines.md`'s "When research comes up thin".
- Doesn't use a photo without a person-controlled or official source —
  see `references/data-schema.md`'s "Images" note. A missing photo
  becomes a designed monogram treatment, not a stock substitute.
- Doesn't route around logins or paywalls to gather information, and
  doesn't include private/personal details (home address, family,
  health) even when they surface in a search result.
- Doesn't build a multi-page site, CMS, or backend — one self-contained
  static page per request. A user wanting a multi-page site is a
  different, larger task worth flagging as out of scope for this skill.
- Doesn't publish or post anything on the subject's behalf — the
  deliverable is a file (or, when applicable, an Artifact the user
  controls), not an action taken on any external account.

## Development

See `meta/MAINTAINERS.md` for layout and versioning notes. Not read as
part of carrying out a live "build a landing page" request — don't act
on it while answering one.
