# Shared Scroll Visualization Contract

These skills are intended to compose with `/visualize`:

```text
/visualize [[ subject ]] | /scroll-sequence
/visualize [[ subject ]] | /scroll-explode
/visualize [[ source-video ]] | /scroll-scrub
```

All three skills use scroll position as the primary playback controller. Scrolling down advances; scrolling up reverses. They should produce a working visual artifact when the user asks to build one, not merely describe the implementation.

## Shared implementation principles

- Prefer normalized scroll progress in `[0,1]`.
- Keep the visual pinned/sticky for the active sequence.
- Respect `prefers-reduced-motion`.
- Preserve aspect ratio.
- Use semantic HTML overlays for text/CTA content.
- Render only when state changes.
- Use `requestAnimationFrame` for scroll-driven rendering.
- Ensure the first and last states are reachable.
- Verify forward and reverse scrolling.

## Public API vs internal references

Public visualization modifiers:

```text
/scroll-sequence
/scroll-explode
/scroll-scrub
```

Internal implementation references must not be exposed as peer commands. In particular, the former `/scroll-linked-video-sequence` behavior is now an implementation reference owned by `/scroll-scrub`.
