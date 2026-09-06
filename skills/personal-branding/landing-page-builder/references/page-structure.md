# Page structure: sections mapped to YAML data

One section per piece of populated data. **A section with no backing
data in the YAML doesn't appear on the page at all** — never render a
section with placeholder or invented content just to fill out a
"complete-looking" page.

| Section | Source field(s) | Include when | Notes |
| --- | --- | --- | --- |
| Hero | `person.full_name`, `person.tagline`, `person.location`, `person.headshot_url` | Always (name is the only required field) | Name as the page's one `<h1>`. Tagline as a subhead, not a second headline. A photo if `headshot_url` is set, otherwise the monogram treatment from `design-guidelines.md`. One quiet call-to-action (e.g. a mailto or a link to their main social/site) if `socials` has at least one entry — not a button that goes nowhere. |
| About | `person.summary` | `summary` is populated | Prose, not bullet points. This is the one section that most needs to sound like a specific person, not a résumé summary — see `research-guidelines.md` on not laundering a LinkedIn headline into this. |
| Experience | `career.current`, `career.history` | Either is populated | A timeline or stacked-entry layout (see `design-guidelines.md`), most recent first. `highlights` render as short bullet lines under each role — omit the bullet list for a role with no highlights rather than leaving an empty sub-list. |
| Education | `education` | Populated | Can merge into the Experience timeline visually, or sit as its own compact section — a judgment call based on how much career content there is; don't let two thin sections crowd the page when one combined section reads better. |
| Skills | `skills.categories` | Populated | Inline tag/text treatment grouped by category label, not a grid of icon cards or fake percentage/progress bars — a percentage on a "skill" is never a real, sourced number. |
| Projects | `projects` | Populated | Each entry: name, description, and its `url` as a real outbound link (only if `url` is present — a project with no URL still gets listed, just without a dead link). `tags` as small inline labels, not colored badge soup. |
| Achievements | `achievements` | Populated | Title, one-line description, date. Link out via `url` when present. |
| Publications & talks | `publications_or_talks` | Populated | Group by `kind` (publication vs. talk) only if both kinds are present in meaningful numbers; otherwise one flat list is fine. Venue and date alongside title; link via `url`. |
| Testimonials | `testimonials` | Populated **and** every entry has a `source_url` | Per `data-schema.md`, this is the highest-risk section — double-check before rendering that nothing here was drafted rather than sourced. |
| Contact / connect | `socials`, `person.email` | At least one `socials` entry or `email` is present | Render only the specific links that exist — no placeholder icons for platforms the person isn't on (see `design-guidelines.md`). If truly nothing is present, omit this section; the hero's CTA (if any) is the only outbound link. |
| Footer | `person.full_name` | Always | Name and a minimal line (e.g. year, or "Built from publicly available information — corrections welcome" if that fits the context) — not a fake copyright-everything-reserved boilerplate block. |

## Section ordering

Hero always first, footer always last. A sensible default order for the
middle is About → Experience → Education → Skills → Projects →
Publications & talks → Achievements → Testimonials → Contact, but
reorder when the person's own material suggests a different emphasis —
e.g. a working artist's page probably wants Projects immediately after
the hero, well before a career-history section that matters less to a
visitor than the work itself. Match emphasis to what actually makes this
person interesting, not the table order above.

## Navigation

A short in-page nav (anchor links to the sections that actually exist)
is appropriate once the page has roughly four or more sections; for a
sparse page (hero + about + contact) a nav adds clutter for nothing to
navigate to — skip it.
