import { depth, project } from "./projection.js";

export function cubeFaces(box, camera = {}) {
  const { id = "cube", x = 0, y = 0, z = 0, width = 1, depth: length = 1, height = 1 } = box;
  const corners = {
    a: { x, y, z }, b: { x: x + width, y, z },
    c: { x: x + width, y: y + length, z }, d: { x, y: y + length, z },
    e: { x, y, z: z + height }, f: { x: x + width, y, z: z + height },
    g: { x: x + width, y: y + length, z: z + height },
    h: { x, y: y + length, z: z + height }
  };
  const faces = [
    { id: "top", points: [corners.e, corners.f, corners.g, corners.h] },
    { id: "front", points: [corners.a, corners.b, corners.f, corners.e] },
    { id: "side", points: [corners.b, corners.c, corners.g, corners.f] }
  ];
  return faces.map((face) => ({
    ...face,
    key: `${id}:${face.id}`,
    projected: face.points.map((point) => project(point, camera)),
    z: face.points.reduce((sum, point) => sum + depth(point, camera), 0) / face.points.length
  })).sort((a, b) => a.z - b.z);
}

export function pointsAttribute(points) {
  return points.map(({ x, y }) => `${x},${y}`).join(" ");
}

export function linePath(points) {
  if (!points.length) return "";
  return points.map(({ x, y }, i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
}
