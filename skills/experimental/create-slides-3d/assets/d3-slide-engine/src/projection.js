/** Pure 2.5D/isometric projection helpers. */

export function project(point, camera = {}) {
  const { x = 0, y = 0, z = 0 } = point;
  const {
    originX = 600,
    originY = 350,
    xScale = 1,
    yScale = 0.55,
    zScale = 0.8,
    yaw = 1
  } = camera;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const rx = x * cos - y * sin;
  const ry = x * sin + y * cos;
  return {
    x: originX + (rx - ry) * xScale,
    y: originY + (rx + ry) * yScale - z * zScale
  };
}

export function depth(point, camera = {}) {
  const { x = 0, y = 0, z = 0 } = point;
  const yaw = camera.yaw ?? 1;
  return (x + y) * Math.cos(yaw) + (y - x) * Math.sin(yaw) + z;
}

export function fitCamera(width, height, logicalWidth = 1200, logicalHeight = 675) {
  if (!(width > 0) || !(height > 0)) throw new RangeError("viewport must be positive");
  return Math.min(width / logicalWidth, height / logicalHeight);
}
