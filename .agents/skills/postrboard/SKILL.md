---
name: postrboard
description: "Apply the Postrboard design language to frontend work. Quiet CSS for loud products, code-native, restrained, non-generic."
---

# Postrboard Skill

You are designing with **Postrboard CSS**. Your job is not to make a pretty SaaS page. Your job is to make the product feel specific, intentional, code-native, and calm.

**Quiet CSS for loud products.** The framework should recede. The product, workflow, and data should speak.

If this skill conflicts with generic web-design instincts, this skill wins.

---

## P0 Behavioral Rules

These rules block output. Do not emit UI until they pass.

1. **No generic SaaS structure.** Never default to Hero → Features → Testimonials → Pricing → CTA.
2. **No decorative emptiness.** Every card, badge, stat, gradient, icon, and section must carry product meaning.
3. **No fake specificity.** Do not invent numbers, logos, quotes, avatars, customers, or metrics. Use honest placeholders.
4. **No centered marketing fog.** Prefer left-aligned, information-dense layouts. Center only for narrow confirmations, empty states, or single-purpose prompts.
5. **No rainbow styling.** One dominant accent per surface. Coral for action/brand, azure for information, sage for success/progress.
6. **No emoji. Ever.** Never use emoji as iconography, decoration, or section markers. Use SVG icons from Lucide, Phosphor, or Tabler sized to `--icon-sm`/`--icon-md`/`--icon-lg` tokens. If no icon clarifies, use none.
7. **No stock icon grids.** Icons are optional, small, and clarifying. They are not content.
8. **No bloated copy.** Labels must name the actual object, action, input, output, or consequence.
9. **No arbitrary CSS values.** Use Postrboard tokens/classes. Custom CSS may compose tokens, not replace them.
10. **No template recipes.** Use layout decisions from the content. Do not copy a canned page shape.
11. **No unreviewed output.** Run the self-review scan before finalizing.

---

## Authority Hierarchy

When deciding what to use:

1. **User's requested content and product context** — source of truth for meaning.
2. **Postrboard behavioral rules in this file** — source of truth for taste.
3. **`postrboard.css`** — source of truth for class names, tokens, and component APIs.
4. **`design-system.html`** — source of truth for live examples and edge cases.
5. Your general design knowledge — only when it does not conflict with the above.

If you need exact classes, read `postrboard.css`. If you need examples, read `design-system.html`. Do not inline the whole reference into your reasoning.

---

## Required Setup

Use the framework correctly before designing.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://burkeholland.github.io/postrboard-design/postrboard.min.css">
```

Use `<html data-mode="light">`, `<html data-mode="dark">`, or omit `data-mode` for system preference.

Docs: https://burkeholland.github.io/postrboard-design

---

## Postrboard Personality

Postrboard feels like:

- A developer tool with editorial restraint.
- Dense information made breathable.
- Terminal-adjacent, not cyberpunk.
- Polished without looking venture-backed by default.
- Confident enough to leave space empty.
- Built from real product surfaces, not Dribbble sections.

Postrboard does **not** feel like:

- Gradient blob SaaS.
- Emoji-and-card dashboards.
- “Unlock your potential” landing pages.
- Centered hero plus three benefit cards.
- Purple-blue glassmorphism.
- Fake enterprise trust walls.

---

## Quick Decision Tree

Choose structure from the content type, not from habit.

### 1. Is the user asking for a product page or landing page?

**If the product is technical, workflow-based, or developer-facing:**
- Lead with a real workflow slice: command, config, diff, dashboard row, event stream, or before/after state.
- Pair prose with an artifact, not an illustration.
- Structure: problem context → working surface → specific capabilities → consequence/action.

**If the product is conceptual or early-stage:**
- Lead with a crisp positioning statement and one concrete example.
- Use fewer sections. Show the idea operating on real inputs.
- Structure: claim → example → mechanics → next step.

**If the product is trust/compliance/security-led:**
- Lead with proof, constraints, auditability, or risk reduction.
- Use tables, logs, policies, status panels, and evidence blocks.
- Structure: risk → control surface → verification → adoption path.

### 2. Is the user asking for an app/dashboard?

**If data is primary:**
- Start with navigation/context, then the most important table, log, queue, chart, or status surface.
- Keep summary cards subordinate to the work surface.
- Structure: context bar → filters/actions → primary data surface → secondary detail.

**If action is primary:**
- Make the next action unmistakable.
- Show required inputs and consequences before decoration.
- Structure: current state → available action → preview/result → confirmation.

**If monitoring is primary:**
- Use calm density: status, trends, exceptions, timestamps.
- Avoid celebratory cards. Show what changed and what needs attention.
- Structure: system state → exceptions → recent activity → drill-down.

### 3. Is the user asking for docs, reference, or developer education?

- Lead with the smallest working example.
- Use code, callouts, steps, and compact navigation.
- Structure: outcome → install/setup → example → options → troubleshooting.

### 4. Is the user asking for a component?

- Design the component around its state model.
- Include default, empty, loading, error, and success states when relevant.
- Structure internally by state, not by visual flourish.

### 5. Is the content sparse?

- Do not inflate it into a full landing page.
- Create a focused single-screen composition, placeholder honestly, or ask the surrounding UI to carry context.

---

## Approved Layout Postures

Pick one dominant posture. Do not mix all of them.

### Workflow-led
Use when the product helps someone do a task.
- Anchor the page with a realistic work surface.
- Show inputs, transformation, and output.
- Best elements: terminal, command strip, editor pane, event timeline, task list.

### Evidence-led
Use when trust matters.
- Put proof before persuasion.
- Show logs, policies, checks, uptime, audit trails, typed metadata.
- Avoid testimonials unless provided by the user.

### Data-led
Use when users manage or interpret information.
- Prioritize tables, queues, filters, and summaries.
- Let density be beautiful. Use whitespace to group, not to dilute.

### Editorial-led
Use when explaining an idea, announcement, or narrative.
- Use strong hierarchy, short sections, and sharp prose.
- Prefer pull quotes, side notes, and code-adjacent examples over feature grids.

### Conversion-led
Use only when the request is explicitly marketing/sales.
- One primary CTA.
- Benefits must tie to concrete product behavior.
- Replace testimonial/pricing filler with proof, screenshots, examples, or honest placeholders.

---

## AI Design Tells: P0 Blockers

Scan every emitted surface for these. If found, revise before output.

| Tell | Symptom | Why it reads as AI slop | Replacement |
|---|---|---|---|
| Generic hero stack | Huge centered headline, vague subhead, two CTAs | Default SaaS average | Left-aligned claim plus concrete product surface |
| Three feature cards | “Fast / Secure / Easy” grid | Filler pretending to be structure | Show workflow steps, states, or actual capabilities |
| Fake metrics | “10x faster”, “99.9%”, “1M users” without source | Invented credibility | Use “Metric pending”, real user-provided data, or remove |
| Gradient blob background | Purple/blue glow with no meaning | Trend mimicry | Subtle token gradient, border, or no decoration |
| Icon confetti | Same-size icon above every card | Visual noise | Use text hierarchy; add icons only where they disambiguate |
| Buzzword copy | “Transform your workflow”, “unlock potential” | Says nothing testable | Name the input, action, output, and consequence |
| Repetitive cards | Identical cards with swapped nouns | Template smell | Vary form by content: table, timeline, code, checklist, stat |
| Floating testimonial | Quote/avatar/company invented or ornamental | Fake social proof | Use provided quotes only; otherwise show evidence or omit |
| Oversized CTA band | Final gradient box repeating headline | Formulaic ending | End with next practical step, docs link, command, or compact CTA |
| Decorative dashboard | Charts/cards with meaningless labels | Looks like mock data | Use domain-specific rows, logs, statuses, or honest placeholders |
| Excess rounded glass | Blur, transparency, giant radius everywhere | Generic “premium” effect | Use restrained surfaces, borders, soft shadows |
| Centered everything | All sections aligned center | No editorial judgment | Use left alignment and asymmetric content rhythm |

A single P0 tell is enough to block output.

---

## Honest Placeholder Rule

When real content is missing, be explicit.

Use:
- “Customer quote pending”
- “Integration name”
- “Metric not yet measured”
- “Example event payload”
- “Connect data source to populate this table”

Do not use:
- Fake people, logos, avatars, companies, or testimonials.
- Fake growth metrics.
- Lorem ipsum in product surfaces.
- Placeholder copy that sounds finished.

Placeholders should reveal what belongs there, not pretend the page is complete.

---

## Copy Rules

Postrboard copy is specific, compressed, and operational.

Write like this:
- “Replay failed jobs from the last deploy.”
- “Compare config drift before merging.”
- “Ship a hosted status page from your incident log.”
- “Paste a webhook payload; get a typed handler.”

Do not write like this:
- “Streamline your workflow.”
- “Powerful insights at your fingertips.”
- “Everything you need to succeed.”
- “Beautifully designed for modern teams.”

Every headline should pass this test: **Could this appear on 500 unrelated startup sites?** If yes, rewrite.

---

## Class Usage Guidance

Do not memorize the whole framework. Use these anchors, then read `postrboard.css` for exact APIs.

Core layout:
- `container` for page width.
- `stack` for vertical rhythm.
- `cluster` for horizontal grouping.
- Grid/card utilities for grouped content only when content deserves grouping.

Core typography:
- Display classes for one major claim.
- Body/muted/meta classes for hierarchy.
- Mono classes for commands, labels, metadata, logs, and technical texture.

Core components:
- Buttons: one primary action, secondary actions quiet.
- Cards/panels: contain meaningful state, not filler.
- Badges: status or metadata only.
- Terminal/code components: use when the product is command/config/code/workflow oriented.
- Forms/tables/nav/alerts: use native framework classes before custom CSS.

Customization:
- Compose with CSS variables from `postrboard.css`.
- Do not introduce new color systems, font stacks, shadow recipes, or spacing scales.
- Custom CSS is acceptable for layout composition and product-specific surfaces.

Approved component library: **shadcn/ui only if the project already uses it or the user asks for React components.** Style it with Postrboard tokens.

---

## Composition Rules

1. Start from the most truthful product artifact: table, command, editor, timeline, form, diff, log, or config.
2. Add prose only where it clarifies the artifact.
3. Prefer fewer sections with stronger internal structure.
4. Use asymmetry: artifact beside claim, metadata beside content, timeline beside outcome.
5. Vary content shapes. Do not make every idea a card.
6. Keep color rare. Accent action, state, or focus — not decoration.
7. Use mono type as texture and information, not as a gimmick.
8. Leave whitespace around important objects; do not pad weak ideas into importance.

---

## Self-Review Scan

Before final output, inspect every page/component you generated.

### Scan 1: Structure
- Did I choose a posture from the decision tree?
- Is the primary surface specific to the user's content?
- Did I avoid Hero → Features → Testimonials → CTA unless explicitly required?

### Scan 2: Content
- Are all claims specific and testable?
- Are placeholders honest?
- Did I remove invented metrics, quotes, logos, and avatars?

### Scan 3: Visual Taste
- Is alignment mostly left or purposefully asymmetric?
- Is there only one dominant accent?
- Did I avoid gradient blobs, icon grids, and repeated cards?

### Scan 4: Framework Use
- Are fonts and CSS loaded correctly?
- Did I use Postrboard classes/tokens before custom CSS?
- Would reading `postrboard.css` reveal a better native class I should use?

If any answer fails, revise. Do not explain the failure; fix the output.

---

## Final Output Standard

A successful Postrboard result should feel:

- Specific to this product.
- Calm but not empty.
- Technical without being hostile.
- Editorial without being precious.
- Polished without obvious AI tells.

If the page could be renamed to another startup by changing only the logo, it is not done.
