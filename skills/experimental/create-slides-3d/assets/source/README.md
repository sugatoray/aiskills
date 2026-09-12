# Offline source snapshot

`index.html` is a self-contained visual snapshot of the `#D3` scene from the
reference keynote:

- https://ethical.institute/keynote/#D3

It is intentionally a static, offline-openable reference artifact. The live
keynote is an application with external JavaScript, CSS, fonts, and media; it
is not redistributed here as a verbatim production bundle. Use this snapshot
to study composition, type scale, chrome, negative space, and the visual
relationship between the headline and the graphics layer.


## Archived application bundle

A local entrypoint and compiled reference application are available under
`bundle/`. The bundle removes the analytics loader and rewrites application
paths to local relative paths. Nonessential binary media is represented by
local SVG placeholders; missing bundled fonts fall back to the system stack.
The reusable skill engine does not depend on this archive.
