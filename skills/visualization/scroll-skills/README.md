# `/scroll-*` Visualization Skills

A composable family of scroll-linked visualization modifiers.

## Included skills

| Skill | Purpose |
|---|---|
| `/scroll-sequence` | General scroll-controlled state/frame sequence |
| `/scroll-explode` | Exploded-view and assembly/disassembly specialization |
| `/scroll-scrub` | Scroll scrubbing through supplied video/time-based media |

## Usage with `/visualize`

```text
/visualize [[ MacBook exploding into components ]] | /scroll-sequence
```

```text
/visualize [[ how a mechanical watch is assembled ]] | /scroll-explode
```

```text
/visualize [[ product.mp4 ]] | /scroll-scrub
```

## Composition model

`/scroll-sequence` is the base interaction primitive.

`/scroll-explode` adds semantic rules for physically understandable exploded views and reversible assembly.

`/scroll-scrub` adds source-media handling, frame extraction, and time/playhead semantics.

## Architecture

The public command surface is intentionally limited to:

```text
/scroll-sequence
/scroll-explode
/scroll-scrub
```

The earlier `/scroll-linked-video-sequence` skill has been retired as a public command. Its detailed implementation guidance now lives at:

```text
scroll-scrub/references/VIDEO_FRAME_SEQUENCE.md
```

Conceptually:

```text
/scroll-sequence
├── /scroll-explode
└── /scroll-scrub
    └── references/VIDEO_FRAME_SEQUENCE.md
```

- `/scroll-sequence` defines the general scroll-controlled interaction.
- `/scroll-explode` specializes that interaction for assembly/disassembly and exploded views.
- `/scroll-scrub` specializes it for time-based media.
- `VIDEO_FRAME_SEQUENCE.md` explains how `/scroll-scrub` should implement deterministic video scrubbing with extracted frames and canvas rendering.

## Suggested aliases

```text
/scroll-frame-sequence → /scroll-sequence
/scroll-exploded-view  → /scroll-explode
/scroll-video          → /scroll-scrub
```

## Install

From a Git repository containing these folders:

```bash
npx skills add <owner>/<repo>
```

Or copy the individual skill folders into the Agent Skills location used by your runtime.
