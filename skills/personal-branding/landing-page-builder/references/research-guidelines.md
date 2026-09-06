# Researching a person, responsibly

The goal is a page the subject would recognize as accurate and would be
comfortable with existing — not the most impressive-sounding page that
could plausibly be assembled from search results.

## Before searching

- **Disambiguate the name first.** A common name plus no context (field,
  employer, location, a link the user already gave you) will return
  several different people. If the user's request doesn't already pin
  this down, ask one targeted question before spending searches on the
  wrong person — better than researching confidently and being wrong.
- **Establish who this page is for.** Building it for the user
  themselves is different from building it for a public figure or a
  colleague: ask what they already have (an existing bio, a resume, a
  photo they want used) before re-deriving all of it from public search
  results — their own material is a better source than a third-party
  writeup of them.

## What counts as a usable source

Prefer sources the person controls or that are clearly authoritative:

1. Their own website, personal blog, or portfolio.
2. Official bio pages from their current or past employer/institution.
3. Their own social profiles' public, non-login-gated content (a
   LinkedIn "About" section as rendered on the public profile page, a
   GitHub profile README, a public Twitter/X bio).
4. Press coverage, interviews, or press releases that quote them
   directly or report on them specifically (not passing mentions).
5. Their own publications, talks, patents, or repositories.

Treat as lower-confidence, and say so in `research_meta.confidence` /
`open_questions` rather than presenting it as fact:

- Aggregator sites that scrape and often misattribute or stale-date bios
  (people-search sites, some "top 10 experts in X" listicles).
- A single unconfirmed mention with no corroborating source, especially
  for anything specific (an exact title, a date, an award).

Never use, and never route around a login wall or paywall to get:

- Content behind a required login (a LinkedIn profile's fields only
  visible after connecting/logging in, a private repository, a
  members-only bio).
- Anything that reads as personal rather than professional (home
  address, family details, health information, private contact
  info) even if it surfaces in a search result — it doesn't belong on a
  professional landing page regardless of where it was found.

## Cross-checking

For anything that will appear as a specific claim on the page (a title,
a date range, an award, a publication), prefer to see it in at least two
independent sources before treating it as settled. One source is enough
to include something with a note in `open_questions` ("only one source
for this date"); zero corroborating sources for a load-bearing claim
(e.g. current employer) is a reason to ask the user rather than publish
it unverified.

## Images

See `data-schema.md`'s "Images" note for the rule (only a
person-controlled or official source, otherwise omit and use the
monogram treatment). This is worth restating here because it's the
single easiest place to accidentally cause real harm — publishing a
press photographer's copyrighted photo, or a photo of the wrong person
entirely, under someone's name.

## When research comes up thin

A page built from three verified facts and an honest "here's what I
could confirm" is a better outcome than a page padded with plausible-
sounding filler. If research turns up little, say so directly, show the
user what you did find, and ask whether they can supply the rest (a
resume, a bio they've already written, corrections) rather than
inventing career history, achievements, or a testimonial to make the
page feel more complete.

## Recording what you found

Populate `sources` in the YAML as you go, not from memory afterward — a
claim you can't trace back to a specific URL by the time you're writing
the YAML is a claim to drop or flag, not one to keep because it sounded
right.
