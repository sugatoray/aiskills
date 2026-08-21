# style-pastel-carousel

Generates educational, carousel-style content in a modern pastel
flat-illustration aesthetic — the kind commonly seen on Instagram and
LinkedIn "swipe" posts. The skill produces text-only outlines (titles,
bullets, illustration descriptions, icon flows) that a designer or an
image-generation step can turn into real slides; it does not render images
itself.

## Usage

```
/visualize {{ concept }} | /style-pastel-carousel
```

Pass any topic as `{{ concept }}`. The skill returns a numbered slide
deck following the palette, typography, layout, and voice rules defined in
[`SKILL.md`](SKILL.md).

## Demo

Three sample concepts run through the skill below. For a rendered, visual
version of these same three decks (pastel palette, rounded flat-illustration
doodles, swipeable slides), open
[`assets/cozy-carousel-deck.html`](assets/cozy-carousel-deck.html) in a
browser.

---

### `/visualize Automating your inbox | /style-pastel-carousel`

**Slide 1 — Your Inbox Is Trying to Tell You Something**
- The average inbox eats 2+ hours a day
- Most of that time is repetitive triage, not real decisions
- Automation handles the repetitive part so you don't have to
Illustration: A cozy desk scene, laptop open, a stack of pastel envelopes
floating toward a soft blue tray, sparkles around the screen.
Icons: 📥 Inbox → 🤖 Automate → ✅ Done

**Slide 2 — What You Can Automate**
- Sorting by sender or subject
- Drafting quick replies
- Flagging anything time-sensitive
Illustration: Flat-vector hand sorting sticky notes into three pastel bins
labeled with rounded tags.

**Slide 3 — What You Should Keep Doing Yourself**
- Anything needing judgment or nuance
- Sensitive or high-stakes replies
- Relationship-building messages
Illustration: A person sipping tea, thinking bubble with a small heart icon,
warm cream background.

**Slide 4 — A Simple Starting Setup**
- Rule 1: auto-file newsletters
- Rule 2: draft replies to FAQs
- Rule 3: star anything from your team
Illustration: Three rounded sticky notes stacked with a soft arrow flow
between them.
Icons: ✉️ → 🏷️ → ⭐

**Slide 5 — Save the Hours for What Matters**
- Less triage, more deep work
- Automation is a teammate, not a replacement
- Start with one rule today
Illustration: Person closing laptop, walking toward a sunny window with a
plant and a mug, soft pink and yellow accents.

---

### `/visualize Building a morning routine | /style-pastel-carousel`

**Slide 1 — Mornings Set the Tone**
- The first hour shapes the rest of your day
- A little structure beats a lot of willpower
- Small, repeatable habits compound
Illustration: Sunrise-toned flat scene, a person stretching beside a window,
a cup of coffee and an open notebook on the table.

**Slide 2 — The 3-Step Framework**
- Move: a few minutes of stretching or walking
- Reflect: jot down today's one priority
- Fuel: a proper breakfast, not just coffee
Illustration: Three simple rounded icons in a row — sneaker, notebook, and
mug — connected by soft dotted arrows.
Icons: 🏃 → 📝 → ☕

**Slide 3 — What to Skip**
- Checking email first thing
- Scrolling social media in bed
- Overplanning the whole day at once
Illustration: A phone with a soft "do not disturb" doodle and a crossed-out
notification bubble, muted pink background.

**Slide 4 — Make It Stick**
- Anchor it to something you already do
- Keep the routine under 30 minutes
- Track it for one week, not forever
Illustration: A small calendar with pastel star stickers on a few days,
sitting next to a plant.

**Slide 5 — Your Morning, Your Rules**
- There's no universal "perfect" routine
- Adjust until it feels sustainable
- Consistency beats intensity
Illustration: Person walking out the door with a tote bag, smiling, soft
blue sky background with a few clouds.

---

### `/visualize Getting started with AI agents | /style-pastel-carousel`

**Slide 1 — What Is an AI Agent, Really?**
- Not just a chatbot — it can take actions
- Reads context, decides, and executes steps
- Think "assistant with hands," not "search bar"
Illustration: A friendly rounded robot mascot at a desk with a laptop and a
small task list, pastel yellow background.

**Slide 2 — The Core Loop**
- Input: a goal or task you give it
- Process: it plans and calls tools
- Output: a result, or a question back to you
Illustration: A circular flow doodle connecting three soft rounded boxes.
Icons: 🎯 Goal → ⚙️ Tools → 📤 Result

**Slide 3 — Common Starter Use Cases**
- Summarizing long documents
- Drafting first-pass reports
- Triaging repetitive requests
Illustration: A stack of papers shrinking into a single sticky note, with a
small sparkle to show "simplified."

**Slide 4 — Keep a Human in the Loop**
- Review before anything goes out the door
- Set clear boundaries on what it can touch
- Treat mistakes as tuning, not failure
Illustration: A person and the robot mascot high-fiving over a checklist,
soft blue accent tag reading "Reviewed ✓."

**Slide 5 — Start Small, Then Expand**
- Pick one repetitive task this week
- Automate it, then watch it run
- Add the next task once it's boring, not before
Illustration: A small potted plant growing taller across three panels,
symbolizing gradual growth, warm cream background throughout.

---

## Notes

- Output is descriptive text, not generated images — pair it with an
  illustration tool or designer to produce final slides.
- Palette, typography, and voice rules live in [`SKILL.md`](SKILL.md); this
  file only demonstrates the format.
- [`assets/cozy-carousel-deck.html`](assets/cozy-carousel-deck.html) is a
  self-contained, static HTML rendering of the three demo carousels above —
  open it directly in a browser (no build step or server needed).
