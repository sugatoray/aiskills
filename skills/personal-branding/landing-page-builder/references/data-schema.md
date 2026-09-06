# Person data YAML schema

The YAML file is the single source of truth for the page. Build it
first, get it right (or get it corrected), and only then render HTML
from it — never hand-edit the page with a fact that isn't in the YAML.

Every field below is optional except `person.full_name`. Omit a field
entirely when nothing verifiable was found for it — do not fill it with
a placeholder, a guess, or `"N/A"`. A missing `projects` section, for
example, means the page has no Projects section at all (see
`page-structure.md`), not a Projects section with invented entries.

## Top-level shape

```yaml
person:
  full_name: "Ava Okonkwo-Reyes"        # required
  preferred_name: "Ava"                  # what the page should call them day-to-day
  pronouns: "she/her"
  tagline: "Marine biologist studying coral resilience"   # one line, specific, not a job title alone
  location: "Honolulu, Hawaii"
  headshot_url: "https://example.org/ava.jpg"  # see "Images" below before including this
  summary: |
    Two to four sentences, written from what sources actually say —
    not a generic LinkedIn-headline paraphrase. First- or third-person,
    matching how the person presents themselves in their own sources.

socials:
  website: "https://example.org"
  linkedin: "https://linkedin.com/in/..."
  github: "https://github.com/..."
  twitter_x: "https://x.com/..."
  scholar: "https://scholar.google.com/citations?user=..."
  email: "ava@example.org"   # only if the person has published it themselves

career:
  current:
    title: "Senior Research Scientist"
    organization: "Pacific Reef Institute"
    start_date: "2023-03"
    location: "Honolulu, HI"
    highlights:
      - "Leads a 6-person team studying thermal-tolerance in staghorn coral"
  history:
    - title: "Postdoctoral Fellow"
      organization: "University of Hawaii"
      start_date: "2019-08"
      end_date: "2023-02"
      location: "Honolulu, HI"
      highlights:
        - "Published 4 peer-reviewed papers on coral bleaching thresholds"

education:
  - institution: "Scripps Institution of Oceanography"
    degree: "Ph.D."
    field: "Marine Biology"
    start_date: "2014"
    end_date: "2019"

skills:
  categories:
    - name: "Research"
      items: ["Coral reef ecology", "Field sampling", "R", "QGIS"]
    - name: "Languages"
      items: ["English", "Portuguese"]

projects:
  - name: "Reef Resilience Atlas"
    description: "Open dataset mapping thermal tolerance across 40 Pacific reef sites."
    url: "https://example.org/atlas"
    role: "Principal investigator"
    date: "2022–present"
    tags: ["open-data", "coral", "GIS"]

achievements:
  - title: "NSF CAREER Award"
    description: "For research on coral thermal adaptation mechanisms."
    date: "2024"
    url: "https://nsf.gov/..."

publications_or_talks:
  - title: "Thermal tolerance thresholds in Acropora cervicornis"
    venue: "Nature Climate Change"
    date: "2023"
    url: "https://doi.org/..."
    kind: "publication"   # or "talk"

testimonials:
  - quote: "Ava's fieldwork protocol is now standard across three research stations."
    author: "Dr. Marcus Lin"
    role: "Director, Pacific Reef Institute"
    source_url: "https://example.org/press/..."   # required — see "Testimonials" below

sources:
  - url: "https://example.org/about"
    note: "Personal site, About page — bio, current role"
  - url: "https://linkedin.com/in/..."
    note: "Career history, education dates"

research_meta:
  researched_at: "2026-09-06"
  confidence: "high"   # high | medium | low, your honest assessment
  open_questions:
    - "Could not confirm exact start date at Pacific Reef Institute — month only, no day"
    - "No public headshot found; page should use a monogram instead"
```

## Field notes

- **`full_name`** — the only required field. Everything else degrades
  gracefully: a page with just a name and tagline is a valid (if bare)
  output; say so to the user rather than inventing content to fill the
  gaps.
- **`tagline`** — write this yourself from the research, don't lift a
  verbatim LinkedIn headline (those are keyword-stuffed for search, not
  written for a landing page's hero).
- **Dates** — `YYYY-MM` or `YYYY`, whichever precision the source
  actually supports. Don't guess a month or day that wasn't stated.
- **Images (`headshot_url`)** — only include a photo URL when it comes
  from a source the person controls (their own site, their own social
  profile picture) or an official organizational bio page. Never include
  a photo scraped from a news photo agency, a random search-result
  image, or anything without a clear indication the person authorized
  its public use. When in doubt, omit `headshot_url` — the page design
  handles this gracefully with a monogram/initial treatment instead (see
  `design-guidelines.md`). Flag the omission in `research_meta.open_questions`
  so the user can supply their own photo if they want one.
- **`testimonials`** — the highest-risk section for fabrication because
  a fake quote attributed to a real name is a real harm, not just a
  content-quality issue. Only include a testimonial that is already
  published somewhere public (a press quote, a book jacket blurb, a
  LinkedIn recommendation visible without login) and record that
  `source_url`. Never draft a plausible-sounding quote yourself. If
  nothing public exists, omit the whole section.
- **`sources`** — keep this populated as you research, not reconstructed
  at the end. Every non-obvious claim in the other sections (a date, an
  award, a project's existence) should trace back to something here.
- **`research_meta.open_questions`** — this is where you tell the user
  what you couldn't verify, what you're unsure about, and what decisions
  (like the photo omission above) you made on their behalf. Surface this
  list to the user alongside the YAML — don't bury it silently.

## Extending the schema

Adding a new top-level key for a kind of content not covered above
(e.g. `press_mentions`, `volunteer_work`) is fine when a person's real
data calls for it — the schema above covers the common cases, not an
exhaustive enum. Keep new keys structured the same way (a list of
objects with a `date`/`url` where relevant) rather than dumping
unstructured prose into a new field.
