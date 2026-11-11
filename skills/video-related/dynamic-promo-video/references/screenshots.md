# Real page screenshots (GitHub, marketplace, docs)

Read this only when a scene needs a live web page.

- First check the project's repo for docs images; they are real and need no browser.
- Shell and WebFetch usually cannot render those pages. Use the built-in browser
  (Claude_Browser tools) if the session is linked to the user's computer: load
  the tools with ToolSearch, call request_access for each site, navigate.
- Screenshots are saved as files on the container (path shown in the tool
  result under `tool-results/`); copy them into the video folder. Pass scale 1.
- Set a tall viewport (e.g. 1100x1727) with resize_window so one screenshot
  covers a lot at 800px wide; scroll with `window.scrollTo` and capture several
  shots (e.g. y=0,1650,3300). Stitch with PIL: paste later shots from row 55 on
  (to skip sticky headers) at offset `y*0.727`. Reset the viewport with preset
  desktop afterwards.
- Use the stitched image as `<img class="shot" id="shot" src="...">` in scene 3
  and scroll it with the camera keyframes.
- If no browser is available, say so and ask the user to connect one; do not
  fake screenshots of live pages.
