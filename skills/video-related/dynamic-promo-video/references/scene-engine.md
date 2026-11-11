# Scene engine (assets/template/index.html)

All scenes are `position:absolute` layers in one `index.html`. A global
`window.setT(t)` sets every element's opacity/transform from time `t`.
Rendering never relies on CSS animation, transitions or real time, so
`scripts/render.js` can screenshot any `t` and always get the same frame.

## Helpers (already in the template)

| Helper | Meaning |
| --- | --- |
| `cl(x,a,b)` | clamp |
| `ease(x)` | `1-(1-x)^3`, ease-out cubic |
| `smooth(x)` | smoothstep |
| `seg(t,a,b)` | clamped progress of `t` from `a` to `b` |
| `tf(el,p,dy)` | fade + rise: opacity `ease(p)`, translateY from `dy` px to 0 |
| `kf(t,[[t0,v0],[t1,v1],...])` | keyframes with smoothstep between them |
| `typed(str,t,a,b)` | the first part of `str` as `t` goes from `a` to `b` |

## Timeline

- `OB` = authored scene boundaries. Write all animation in this time.
- `NB` = real boundaries. Start with `NB = OB.slice()`; after the voice clips
  exist, replace it with the line printed by `scripts/timing.py`.
- `warp(tt)` maps real time to authored time piecewise-linearly, and
  `window.setT = tt => draw(warp(tt))`. Retiming never touches the animation code.
- `window.DURATION = NB[NB.length-1]` is what `render.js` renders by default.
- `SC = [[id,start,end],...]` lists scenes in authored time; neighbours
  crossfade over `XF = 0.5` s.

## Frame 0 = cover

Scene 1 is fully visible at `t=0` and only fades out. Social platforms use the
first frame as the preview, so never fade the cover in. `render.js --thumbnail`
exports that frame as `thumbnail.png`.

## Camera on screenshots (scene 3)

Wrap the window in a `perspective(1500px)` container (`.cam-wrap`), animate
`rotateY/rotateX` (and `rotateZ` if wanted), `scale` (1 to about 1.3-1.4) and
`transform-origin` with `kf`, and scroll the inner image with `translateY`.
Replace the placeholder `.shot-ph` block with
`<img class="shot" id="shot" src="shot.png">` (a real screenshot, see
screenshots.md). Keep the zoom away from captions and neighbouring text; the
caption sits on its own pill above the window (`z-index`).

## Typing effect (scene 4)

`el.textContent = typed(cmd, t, a, b)`. Cursor: solid while typing, then blink
with `Math.floor(t*2)%2`.

## Icons

Inline `<symbol>` SVGs used via `<svg><use href="#id"/></svg>`. The template's
icons are simplified drawings; state they are not official logos unless
official files are supplied.

## Pitfalls

- Do not reuse a class name that a script queries with `querySelectorAll`
  (e.g. `.chip`), or those elements get hidden/animated too. Use unique names.
- Fonts: if you link a web font, it must load from the sandbox; otherwise use a
  local stack. `render.js` waits for `document.fonts.ready`.
- Keep every scene inside 1280x720; check the preview frames at the start, the
  middle and the end of each scene.
- Keep `OB` and `NB` the same length (scenes + 1).
