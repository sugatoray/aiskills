# Security model

## What this is

A static, single-file HTML page. It has no server, no accounts, no network access and no third-party code. Its only inputs are the agenda JSON built into the file and an agenda saved in the same browser's `localStorage`.

## Trust boundaries

| Input | Source | Trusted? |
|---|---|---|
| `#agenda-data` block | Whoever wrote or saved the HTML file | Data only. Never executed or parsed as HTML. |
| `localStorage["meetingAgenda"]` | This browser, same origin | Data only. Validated, and falls back to defaults if malformed. |
| Editor fields | The person at the keyboard | Data only |

The file itself is code. Opening an HTML file from someone runs whatever script it contains, just like any other HTML file. Only open agenda files from people you trust, or review the file before opening it. The protections below stop *agenda text* from becoming code. They can't make a tampered file safe.

## Protections

1. **No HTML injection.** All agenda text (titles, sub-points, meeting title, tooltips, aria labels) is set with `textContent` or attributes, never `innerHTML`, `insertAdjacentHTML`, `document.write` or `eval`. A title like `<img src=x onerror=…>` renders as literal text. Tested in `test_user_text_is_not_parsed_as_html`.
2. **Safe "Save HTML".** The agenda is written into `<script type="application/json">`, which browsers never execute. Every `<` in the JSON is escaped as `<`, so a title containing a closing script tag can't end the block early and inject markup. `JSON.parse` turns `<` back into `<`. Tested by round-tripping a title containing `</script><script>…`.
3. **The saved copy is built from a pristine clone** of the page taken before rendering. Runtime DOM (rendered slides, editor rows, user text in attributes) is never serialized into the downloaded file.
4. **Validated input.** `normalize()` rejects non-arrays, empty agendas, non-positive or non-finite minutes, and empty titles. Corrupt `localStorage` JSON is caught, and the file defaults load instead.
5. **No network.** The page has no external `src`/`href`, no `@import`, and no `fetch`/XHR/WebSocket/EventSource. Tests assert both the source and the actual requests made during load. Nothing is sent anywhere, so agenda contents stay on the device.
6. **Storage access is wrapped in try/catch**, so blocked storage (private mode, policy) degrades to "not remembered" rather than breaking the page.

## Data at rest

- `localStorage` is per-origin and unencrypted. For `file://` pages, Chromium shares one origin across local files, so another local HTML file opened in the same browser profile could read the key `meetingAgenda`. Don't put secrets in an agenda.
- "Reset to file defaults" removes the stored copy.
- Downloads go wherever the browser saves files. The saved file contains the agenda in plain text.

## Not in scope

- Integrity or authenticity of a shared HTML file. Use your normal file-sharing controls or a checksum.
- Content Security Policy. A strict CSP would need hashes for the inline script and style, and the hashes would change on every saved agenda, so none is set. Because the page loads nothing external, there is no external script for a CSP to block.

## Reporting

Open an issue in the repository with steps to reproduce. Don't include real meeting content.
