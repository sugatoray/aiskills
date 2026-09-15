# Video Frame Sequence Implementation Reference

This document preserves the detailed implementation pattern previously exposed as `/scroll-linked-video-sequence`. It is now an internal reference used by `/scroll-scrub`.

Do not treat this file as a standalone public command.

## Core pattern

Use a deterministic image sequence for high-fidelity scroll-linked playback:

```text
video
  ↓
image frames
  ↓
preload / progressive load
  ↓
canvas
  ↑
normalized scroll progress
  ↓
frame index
```

Prefer this over repeatedly seeking the source `<video>` when precise forward/reverse playback matters.

## Extract frames

A practical starting point for short cinematic sequences is 24–30 fps. Optimize after inspecting motion and payload size.

```bash
ffmpeg -i input.mp4 -vf "fps=30" frames/frame_%05d.webp
```

Prefer optimized WebP or AVIF delivery rather than large uncompressed PNG sequences.

## Scroll container and sticky stage

```css
.sequence {
  height: 500vh;
}

.sequence__stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
```

Use enough scroll distance for precise control without making the interaction unnecessarily long.

## Map scroll to progress

```js
const maxScroll = section.offsetHeight - innerHeight;
const travelled = Math.min(
  maxScroll,
  Math.max(0, -section.getBoundingClientRect().top)
);
const progress = maxScroll > 0 ? travelled / maxScroll : 0;
```

For `N` frames:

```js
const frameIndex = Math.round(progress * (N - 1));
```

This guarantees the first frame at progress `0` and the last frame at progress `1`.

## Rendering

Render the selected frame into a canvas while preserving aspect ratio. Support both `contain` and `cover` fitting modes. Account for `devicePixelRatio` and rerender after resize/orientation changes.

Avoid redrawing when the frame index has not changed. Schedule scroll-driven rendering with `requestAnimationFrame` rather than doing expensive work directly in every scroll event.

## Loading strategy

- show the first frame or poster immediately;
- prioritize frames near the current playhead;
- progressively load remaining frames;
- avoid requiring the entire sequence before first meaningful paint;
- tolerate a missing noncritical frame by falling back to the nearest loaded frame rather than crashing or showing a blank canvas;
- consider chunked loading for long sequences.

## Native scrolling first

Prefer native sticky positioning and normalized scroll calculations when they are sufficient. Do not add a motion framework merely to reproduce behavior that the browser can implement reliably.

## GSAP / ScrollTrigger option

When GSAP is already present or the experience needs its timeline/pinning capabilities, a playhead object can be scrubbed directly:

```js
const playhead = { frame: 0 };

gsap.to(playhead, {
  frame: frames.length - 1,
  ease: "none",
  snap: "frame",
  scrollTrigger: {
    trigger: ".sequence",
    start: "top top",
    end: "bottom bottom",
    scrub: true
  },
  onUpdate: () => render(Math.round(playhead.frame))
});
```

Do not introduce arbitrary easing when the requested behavior is direct scroll attachment.

## Exploded-view semantics

For exploded product sequences, the default narrative is:

```text
scroll down: assembled → separating → exploded
scroll up:   exploded → recombining → assembled
```

The motion should remain mechanically legible. Parts should not randomly scatter or cross through each other unless the source sequence intentionally depicts that behavior.

## Responsive behavior

- preserve the source aspect ratio;
- choose `contain` when every component must remain visible;
- choose `cover` for cinematic hero sections when cropping is acceptable;
- resize the backing canvas for DPR without changing CSS layout size;
- rerender the active frame after resize;
- test portrait and landscape layouts.

## Text and overlays

Keep headings, labels, narrative copy, and calls to action as semantic HTML/SVG overlays when practical. Do not bake editable text into every raster frame.

## Reduced motion

Respect `prefers-reduced-motion`. Provide a representative poster, first frame, final frame, or simplified static state instead of requiring the complete scroll animation.

## Performance requirements

- do not redraw an unchanged frame;
- use `requestAnimationFrame`;
- avoid giant base64-embedded frame sets;
- avoid unoptimized 4K PNG sequences;
- account for memory pressure on mobile devices;
- test rapid scrolling, slow scrolling, and repeated direction changes;
- avoid delayed catch-up or inertial playback unless explicitly requested.

## Verification

Before calling an implementation complete, verify:

1. progress `0` displays the first frame;
2. progress around `0.5` displays a valid middle state;
3. progress `1` displays the final frame;
4. reverse scrolling walks backward correctly;
5. the visual remains pinned for the intended interval;
6. aspect ratio is preserved;
7. resize/orientation changes rerender correctly;
8. reduced-motion fallback works;
9. initial loading never leaves an unnecessary blank canvas;
10. missing/late noncritical frames do not crash the experience;
11. the console is free of runtime errors;
12. total payload and decoded-memory usage are reasonable for the target device.

## Anti-patterns

Avoid:

- ordinary autoplay disguised as scroll-linked playback;
- mapping animation progress to scroll-event count;
- autonomous animation continuing after scrolling stops;
- delayed catch-up by default;
- arbitrary easing between scroll position and frame index;
- stretching frames to fill the viewport;
- giant embedded base64 sequences;
- uncompressed 4K frame sets without a demonstrated need;
- claiming proprietary Apple code is required to reproduce the interaction pattern.
