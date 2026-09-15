---
name: scroll-scrub
description: Turn supplied time-based media, especially a video, into a scroll-scrubbed experience where scroll position directly controls playback position. Prefer optimized image-frame playback for deterministic results, with direct video seeking as an optional implementation strategy.
---

# /scroll-scrub

Use when the user's main intent is to scrub supplied media with scrolling.

## Syntax

```text
/visualize [[ product.mp4 ]] | /scroll-scrub
```

Standalone:

```text
/scroll-scrub [[ product.mp4 ]]
```

## Core contract

The scroll position is the playhead.

```text
scroll progress 0.00 → media start
scroll progress 0.50 → media midpoint
scroll progress 1.00 → media end
```

Scrolling backward moves backward in time.

## Internal implementation reference

For deterministic video scrubbing, use the detailed implementation guidance in:

```text
references/VIDEO_FRAME_SEQUENCE.md
```

That reference contains the former `/scroll-linked-video-sequence` workflow: video inspection, frame extraction, preload strategy, responsive canvas rendering, scroll-to-frame mapping, GSAP/native variants, performance guidance, and verification.

`/scroll-linked-video-sequence` is no longer part of the public command surface.

## Preferred strategy: frame extraction

For high-fidelity product storytelling, prefer:

```text
video
  ↓
optimized frame sequence
  ↓
preload/progressive load
  ↓
canvas
  ↑
scroll progress
```

Frame index:

```js
const frame = Math.round(progress * (frameCount - 1));
```

This avoids unreliable tiny-step video seeking and gives deterministic forward/reverse rendering.

## Alternate strategy: direct video seeking

Use direct `<video>` seeking when:
- payload size makes frame extraction impractical;
- the sequence is long;
- exact frame determinism is not critical;
- the browser/codec combination behaves acceptably.

Mapping:

```js
video.currentTime = progress * video.duration;
```

Throttle updates and avoid excessive seeking.

Do not autoplay audio. Scroll-scrubbing should be silent unless the user explicitly requests another audio behavior.

## Frame extraction guidance

Start around 24–30 fps for short cinematic sequences, then optimize based on source motion, sequence duration, target device, and payload size. Prefer WebP or AVIF for delivery.

```bash
ffmpeg -i product.mp4 -vf "fps=30" frames/frame_%05d.webp
```

## Scroll container

Use a tall section with a sticky visual stage:

```css
.sequence {
  height: 500vh;
}

.stage {
  position: sticky;
  top: 0;
  height: 100vh;
}
```

Adjust scroll distance so the user can scrub precisely without making the page unnecessarily long.

## Loading

- render the first frame/poster immediately;
- prioritize nearby frames;
- progressively load the rest;
- tolerate late/missing noncritical frames;
- never show an empty canvas while waiting if a poster is available.

## Rendering

- preserve aspect ratio;
- support `cover` and `contain`;
- account for device pixel ratio;
- rerender on resize;
- skip draws if frame index did not change;
- use `requestAnimationFrame`.

## Reduced motion

Show a representative poster or static end state instead of requiring full scrubbing.

## Output contract

When given a source video and asked to build:
1. inspect the media;
2. choose frame sequence vs direct video seeking;
3. implement the scroll playhead;
4. verify start/mid/end;
5. verify reverse scroll;
6. provide complete runnable files.

## Anti-patterns

Avoid:
- using ordinary autoplay and pretending it is scroll-linked;
- mapping based on scroll-event count;
- playing audio as scroll position jitters;
- decoding enormous 4K frame sets on mobile without optimization;
- requiring all frames before first meaningful paint.
