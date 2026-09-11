import test from "node:test";
import assert from "node:assert/strict";
import { depth, fitCamera, project } from "../src/projection.js";

test("project preserves the origin", () => {
  assert.deepEqual(project({ x: 0, y: 0, z: 0 }), { x: 600, y: 350 });
});

test("raising z moves a point upward", () => {
  assert.ok(project({ z: 10 }).y < project({ z: 0 }).y);
});

test("fitCamera uses a uniform scale", () => {
  assert.equal(fitCamera(1200, 337.5), 0.5);
});

test("depth is deterministic for a point", () => {
  assert.equal(depth({ x: 2, y: 3, z: 4 }, { yaw: 0 }), 9);
});
