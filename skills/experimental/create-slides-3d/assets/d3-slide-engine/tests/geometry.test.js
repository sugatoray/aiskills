import test from "node:test";
import assert from "node:assert/strict";
import { cubeFaces, linePath, pointsAttribute } from "../src/geometry.js";

test("cube produces three visible faces with projected points", () => {
  const faces = cubeFaces({ id: "tower", width: 2, depth: 3, height: 4 });
  assert.deepEqual(faces.map((face) => face.id).sort(), ["front", "side", "top"]);
  assert.ok(faces.every((face) => face.projected.length === 4));
  assert.ok(faces.every((face) => face.key.startsWith("tower:")));
});

test("geometry helpers emit SVG-compatible strings", () => {
  const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
  assert.equal(pointsAttribute(points), "1,2 3,4");
  assert.equal(linePath(points), "M1,2 L3,4");
  assert.equal(linePath([]), "");
});

test("faces are depth ordered", () => {
  const faces = cubeFaces({ width: 2, depth: 2, height: 2 });
  assert.ok(faces[0].z <= faces[1].z && faces[1].z <= faces[2].z);
});
