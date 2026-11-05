# Verification

Validate graph IDs, endpoints, scopes, and responsive layout cells before rendering.
Then verify behavior in a real browser. Unit checks do not establish visual quality.

- Inspect wide, medium, 390px, and 320px views for page overflow and clipped labels.
- Check orthogonal paths avoid card interiors and remain attached after resizing.
- Compare packet offsets at different times; assert pause freezes them and resume
  restarts movement. Confirm scenario captions change and replay restarts steps.
- Select a node and check only immediate neighbors in the selected scope remain
  emphasized. Test clearing by selecting again and by pressing Escape.
- Check retry, recovered evidence, and exhausted/abstention alternative captions.
- Check reduced motion hides packets, and confirm no runtime errors or requests.

Use `tests/check_browser.cjs` for the RAG example. It expects the example HTML path
as its first argument, uses Playwright, and optionally accepts a browser executable
through `NETWORK_FLOW_CHROMIUM`. The browser suite is a developer dependency, not
needed by users of generated HTML. Open screenshots for visual inspection after
the automated checks; do not commit routine machine-specific screenshots.
