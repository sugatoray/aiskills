# Changelog

All notable changes to the `scroll-scrub` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-09-15

### Added

- Initial release of `/scroll-scrub` for scroll-controlled scrubbing of supplied time-based media.
- Deterministic video-to-frame-sequence playback as the preferred implementation, with direct HTML video seeking as an optional strategy.
- Guidance for frame extraction, progressive loading, Canvas rendering, sticky scroll containers, responsive sizing, and reduced-motion fallbacks.
- Start/middle/end and reverse-scroll verification requirements plus media-loading and rendering anti-patterns.
- Internal `references/VIDEO_FRAME_SEQUENCE.md` implementation reference preserving the former `/scroll-linked-video-sequence` workflow without exposing it as a fourth public command.
- Repository-standard skill frontmatter with MIT license, compatibility declaration, author/source metadata, and version `1.0.0`.
