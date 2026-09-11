import test from "node:test";
import assert from "node:assert/strict";
import { clampIndex, hashFor, indexFromHash, keyboardIntent, slideIdFromHash } from "../src/navigation.js";

const slides = [{ id: "first" }, { id: "middle" }, { id: "last" }];

test("clampIndex keeps navigation inside bounds", () => {
  assert.equal(clampIndex(-2, 3), 0);
  assert.equal(clampIndex(20, 3), 2);
  assert.equal(clampIndex(1.9, 3), 1);
});

test("hash state round trips safely", () => {
  assert.equal(hashFor("slide 1"), "#slide%201");
  assert.equal(slideIdFromHash("#slide%201"), "slide 1");
  assert.equal(indexFromHash("#middle", slides), 1);
  assert.equal(indexFromHash("#missing", slides), 0);
});

test("keyboard intent is presentation-oriented", () => {
  assert.equal(keyboardIntent("ArrowRight"), "next");
  assert.equal(keyboardIntent("PageUp"), "previous");
  assert.equal(keyboardIntent("Home"), "first");
  assert.equal(keyboardIntent("Escape"), "close-overlay");
  assert.equal(keyboardIntent("x"), null);
});
