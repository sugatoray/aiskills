import { cubeFaces, pointsAttribute } from "./geometry.js";
import { clampIndex, hashFor, indexFromHash, keyboardIntent } from "./navigation.js";

export function createSlideEngine({ d3, root, slides, reducedMotion = false, logicalWidth = 1200, logicalHeight = 675 }) {
  if (!d3 || !root || !Array.isArray(slides) || !slides.length) throw new TypeError("d3, root, and non-empty slides are required");
  const state = { index: 0, mounted: false };
  const svg = d3.select(root).append("svg").attr("viewBox", `0 0 ${logicalWidth} ${logicalHeight}`).attr("role", "img");
  const geometry = svg.append("g").attr("aria-hidden", "true");
  const labels = svg.append("g").attr("class", "slide-labels");
  const duration = reducedMotion ? 0 : 650;

  function render(index, instant = false) {
    state.index = clampIndex(index, slides.length);
    const slide = slides[state.index];
    svg.attr("aria-label", slide.title || `Slide ${state.index + 1}`);
    const faces = (slide.objects || []).flatMap((object, objectIndex) => cubeFaces({
      ...object,
      id: object.id || `object-${objectIndex}`
    }, slide.camera));
    const join = geometry.selectAll("polygon").data(faces, (face) => `${slide.id}-${face.key}`);
    join.exit().transition().duration(instant ? 0 : duration).style("opacity", 0).remove();
    join.enter().append("polygon").attr("points", (face) => pointsAttribute(face.projected)).style("opacity", 0)
      .merge(join).transition().duration(instant ? 0 : duration)
      .attr("points", (face) => pointsAttribute(face.projected)).style("opacity", 1)
      .attr("fill", slide.accent || "#7dd3fc");
    labels.selectAll("text").data([slide], (d) => d.id).join("text")
      .attr("x", 48).attr("y", logicalHeight - 62).text((d) => d.title || "");
    if (typeof history !== "undefined" && location.hash !== hashFor(slide.id)) history.replaceState(null, "", hashFor(slide.id));
    return slide;
  }

  function goTo(target, instant = false) {
    const index = typeof target === "number" ? target : slides.findIndex((slide) => slide.id === target);
    return render(index < 0 ? 0 : index, instant);
  }

  function onKeydown(event) {
    const intent = keyboardIntent(event.key);
    if (!intent || event.target.closest?.("input, textarea, select, button, a")) return;
    event.preventDefault();
    if (intent === "next") goTo(state.index + 1);
    if (intent === "previous") goTo(state.index - 1);
    if (intent === "first") goTo(0);
    if (intent === "last") goTo(slides.length - 1);
  }

  function mount() {
    if (state.mounted) return api;
    state.mounted = true;
    document.addEventListener("keydown", onKeydown);
    addEventListener("hashchange", () => goTo(indexFromHash(location.hash, slides), true));
    goTo(indexFromHash(location.hash, slides), true);
    return api;
  }

  function destroy() {
    if (!state.mounted) return;
    document.removeEventListener("keydown", onKeydown);
    svg.remove();
    state.mounted = false;
  }

  const api = { mount, destroy, goTo, render, getState: () => ({ ...state }) };
  return api;
}
