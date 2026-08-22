# Design Reference — Pastel Carousel Style

A structured, implementation-ready version of the rules in [`../SKILL.md`](../SKILL.md).
Use this when actually building slides — in code, in a design tool, or as a
prompt for an image model — while `SKILL.md` stays the source of truth for
narrative guidance. [`cozy-carousel-deck.html`](cozy-carousel-deck.html) is a
worked example that applies every token below.

## Color tokens

| Token | Hex | Role |
| --- | --- | --- |
| `bg-cream-1` | `#FFF9F5` | Lightest slide background |
| `bg-cream-2` | `#FDF7F3` | Mid slide background |
| `bg-cream-3` | `#F7EFEA` | Deepest slide background |
| `accent-pink` | `#F4C2C2` | Primary accent — highlights, first bullet dot, warm props |
| `accent-yellow` | `#F7D96F` | Secondary accent — stars/sparkles, second bullet dot, sun |
| `accent-blue` | `#A7D3F0` | Tertiary accent — UI/tech props, third bullet dot, shadows under objects |
| `ink` | `#2E2E2E` | Primary text, outlines on illustrations |
| `ink-soft` | `#6A6A6A` | Secondary text, captions, pills |

Rotate the three accents across a deck's slide backgrounds (`bg-cream-1` →
`bg-cream-2` → `bg-cream-3` → repeat) so consecutive slides feel related but
not identical. Bullet-point markers cycle pink → yellow → blue in list order
— it's a small rhythm that ties every slide back to the same three accents.

## Typography

| Role | Typeface | Weight | Notes |
| --- | --- | --- | --- |
| Heading | Rounded, bold sans-serif (e.g. Fredoka) | 600–700 | Large, short — one idea per slide title |
| Body / bullets | Clean, friendly sans-serif (e.g. Nunito) | 400–700 | 3–4 bullets max, each one line where possible |
| Labels / pills | Same body face | 800, uppercase | Small size, wide letter-spacing (`~0.08em`) |

Avoid condensed or geometric-mono faces — they read as technical, not cozy.

## Slide anatomy

Standard aspect ratio: **4:5** (matches Instagram's tallest portrait format,
1080×1350px). A single-image post can use 1:1 instead.

```
┌───────────────────────────────┐
│ pill: "Slide N / total"        │  ← top-left, low-contrast chip
│                                 │
│   ┌─────────────────────────┐   │
│   │      illustration        │   │  ← ~35–40% of slide height
│   │  (2–4 simple flat shapes │   │
│   │   over a soft accent     │   │
│   │   blob/ellipse backdrop) │   │
│   └─────────────────────────┘   │
│                                 │
│ Heading (1–2 lines)             │
│                                 │
│ • Bullet one                    │
│ • Bullet two                    │
│ • Bullet three (optional)       │
│                                 │
│ [optional icon-flow row]        │  ← e.g. 🎯 → ⚙️ → 📤
└───────────────────────────────┘
```

Keep at least a 6–8% margin on all sides — pastel carousels read as
"breathable," not edge-to-edge.

## Illustration component library

Every illustration in the demo deck is composed from 2–4 of these simple,
reusable flat shapes, layered over one soft accent-colored ellipse or blob as
a backdrop. None use complex hand-authored paths — circles, rounded
rectangles, and short arcs only.

| Sticker | Built from | Typical use |
| --- | --- | --- |
| Laptop | rounded rect body + inset screen rect | Productivity, work scenes |
| Mug | rect + arc handle | Cozy props, breaks |
| Plant | ellipse pot + leaf shapes | Warmth, growth, desk dressing |
| Envelope | rect + triangle flap | Inbox / communication concepts |
| Star / sparkle | 4-point path or crossed diamonds | Emphasis, "magic," celebration |
| Sticky note | rotated rounded rect + folded corner | Tasks, tags, reminders |
| Cloud | 2–3 overlapping circles | Sky scenes, softness |
| Sun | circle + short ray lines | Morning / energy concepts |
| Robot mascot | rounded rect body + circle head + antenna | AI / automation concepts |
| Calendar | rect + grid lines + star sticker | Planning, schedules |
| Person (abstract) | circle head + simple rounded torso | Human presence without detailed faces |
| Notebook | rect + ruled lines | Notes, reflection |
| Phone | rounded rect + simple icon | Notifications, digital habits |
| Checklist tag | rounded rect + checkmark path | Review, completion, approval |
| Papers stack | 2–3 offset overlapping rects | Documents, reports |

Guidelines when composing a new illustration:
- One backdrop shape (ellipse/blob, 25–35% opacity of an accent color).
- 2–4 foreground stickers, each a flat fill with a thin `#2E2E2E` outline
  where it helps readability (not required on every shape).
- No gradients, no drop shadows on the illustration itself — flat only.
- Rounded corners everywhere (`rx`/`ry` on rects, no sharp joins).

## Icon-flow rows

Use only when the slide content is genuinely a sequence (a process, a
before/after, a pipeline) — not as decoration on every slide. Format:
`emoji/short-label` → `emoji/short-label` → `emoji/short-label`, 2–3 steps,
separated by a muted arrow (`ink-soft`, not an accent color).

## Voice quick-check

Before finalizing copy on a slide, confirm it:
- Opens with a concrete claim or question, not a throat-clear.
- Uses active, second-person or imperative phrasing ("Save time," not "Time
  can be saved").
- Keeps each bullet under ~8 words where possible.
- Avoids jargon unless the audience is explicitly technical.
