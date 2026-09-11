export function clampIndex(index, length) {
  if (!Number.isInteger(length) || length < 1) throw new RangeError("length must be positive");
  return Math.max(0, Math.min(length - 1, Number.isFinite(index) ? Math.trunc(index) : 0));
}

export function hashFor(slideId) {
  return `#${encodeURIComponent(slideId)}`;
}

export function slideIdFromHash(hash = "") {
  const value = String(hash).replace(/^#/, "");
  return value ? decodeURIComponent(value) : null;
}

export function indexFromHash(hash, slides) {
  const id = slideIdFromHash(hash);
  const index = slides.findIndex((slide) => slide.id === id);
  return index < 0 ? 0 : index;
}

export function keyboardIntent(key) {
  if (["ArrowRight", "PageDown", " ", "Enter"].includes(key)) return "next";
  if (["ArrowLeft", "PageUp"].includes(key)) return "previous";
  if (key === "Home") return "first";
  if (key === "End") return "last";
  if (key === "Escape") return "close-overlay";
  return null;
}
