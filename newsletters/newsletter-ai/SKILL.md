---
name: newsletter-ai
description: "Generates the weekly executive AI intelligence newsletter: researches the last 7 days of AI developments (with 30-90 day context where needed) and writes them up as a 15-part executive brief — the Top 20 developments, model intelligence, open-vs-closed, talent, funding/M&A, production deployment, agents, chips/compute, data centers/energy, the global AI race, a company watchlist, key numbers, under-the-radar signals, what changed this week, and a closing synthesis. Use when the user runs /newsletter-ai, or asks to draft, write, or update this week's AI newsletter/intelligence brief."
license: MIT
metadata:
  - name: newsletter-ai
    type: skill
    author: sugatoray
    version: "1.0.0"
    source_url: "https://github.com/sugatoray/aiskills/tree/master/newsletters/newsletter-ai"
---

# Newsletter: AI Intelligence Brief

This skill's job is to produce one edition of the weekly AI intelligence
newsletter. All of the editorial substance — role, audience, research
window, sourcing rules, the 15-part structure, editorial rules, and
writing style — lives in `assets/PROMPT.md` in this same directory. This
file only says how to use it; `assets/PROMPT.md` is the single source of
truth for what the newsletter contains and how it reads, so don't
reconstruct the brief from memory or summarize it — read the file itself.

## Steps

1. Read `assets/PROMPT.md` in full before writing anything. Treat it as
   the complete editorial brief for this edition, not a template to
   paraphrase.
2. Do the research it calls for: AI developments from the last 7 days,
   pulling in 30-90 days of prior context only where a development needs
   it to make sense. Use current web research and prefer the primary
   sources `assets/PROMPT.md` lists (company announcements, papers, model
   cards, technical reports, repos, earnings, regulatory filings) over
   secondary reporting; cross-check important claims across multiple
   sources.
3. Write the newsletter following `assets/PROMPT.md`'s structure and
   rules exactly, in order: the Top 20 Developments, then Parts 2-15
   (Model Intelligence through The Big Picture), applying the Editorial
   Rules and Writing Style sections throughout. Skip a section's content
   honestly ("No material development this week.") rather than
   manufacturing a story to fill it.
4. Keep confirmed fact, company claim, reported information, and analyst
   inference clearly distinguished throughout, as `assets/PROMPT.md`
   requires — don't blur them for narrative flow.
5. Return the finished edition as markdown chat output unless the user
   asks for it to be saved to a file.

## Development

If the editorial brief itself needs to change (new sections, different
sourcing rules, a different audience), edit `assets/PROMPT.md` directly —
this file should stay a thin pointer to it rather than duplicating its
content.
