// Restore an upright, useful viewing elevation, preserving azimuth and zoom.
// Setting `up` alone cannot repair a view tilted too far above/below the scene.
export function levelCamera(camera) {
  const next = structuredClone(camera);
  next.up = { x: 0, y: 0, z: 1 };
  const center = next.center ?? { x: 0, y: 0, z: 0 };
  const dx = next.eye.x - center.x, dy = next.eye.y - center.y;
  const dz = next.eye.z - center.z;
  const radius = Math.hypot(dx, dy, dz) || 2.5;
  const angle = Math.atan2(dy, dx);
  const elevation = Math.PI / 6;
  const horizontal = radius * Math.cos(elevation);
  next.eye = {
    x: center.x + horizontal * Math.cos(angle),
    y: center.y + horizontal * Math.sin(angle),
    z: center.z + radius * Math.sin(elevation)
  };
  return next;
}

export function rotateCamera(camera, radians) {
  const next = structuredClone(camera);
  next.up = { x: 0, y: 0, z: 1 };
  const center = next.center ?? { x: 0, y: 0, z: 0 };
  const x = next.eye.x - center.x, y = next.eye.y - center.y;
  next.eye.x = center.x + x * Math.cos(radians) - y * Math.sin(radians);
  next.eye.y = center.y + x * Math.sin(radians) + y * Math.cos(radians);
  return next;
}
