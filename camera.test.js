import test from 'node:test';
import assert from 'node:assert/strict';
import { levelCamera, rotateCamera } from './camera.js';

const tilted = { eye: { x: 2, y: 1, z: 1.2 }, center: { x: .2, y: -.1, z: -.08 }, up: { x: .4, y: .3, z: .6 } };
test('level restores 30 degree elevation while preserving azimuth and zoom', () => {
  const leveled = levelCamera(tilted);
  assert.deepEqual(leveled.up, { x: 0, y: 0, z: 1 });
  const distance = c => Math.hypot(c.eye.x-c.center.x, c.eye.y-c.center.y, c.eye.z-c.center.z);
  const azimuth = c => Math.atan2(c.eye.y-c.center.y, c.eye.x-c.center.x);
  assert.ok(Math.abs(distance(leveled) - distance(tilted)) < 1e-10);
  assert.ok(Math.abs(azimuth(leveled) - azimuth(tilted)) < 1e-10);
  assert.ok(Math.abs((leveled.eye.z-leveled.center.z) / distance(leveled) - .5) < 1e-10);
  assert.notEqual(leveled.eye.z, tilted.eye.z);
  assert.deepEqual(leveled.center, tilted.center);
  assert.equal(tilted.up.x, .4);
});
test('horizontal rotation preserves height and zoom and completes a full circle', () => {
  const radius = c => Math.hypot(c.eye.x - c.center.x, c.eye.y - c.center.y);
  let camera = tilted;
  for (let i = 0; i < 24; i++) {
    camera = rotateCamera(camera, Math.PI / 12);
    assert.ok(Math.abs(radius(camera) - radius(tilted)) < 1e-10);
    assert.equal(camera.eye.z, tilted.eye.z);
    assert.deepEqual(camera.up, { x: 0, y: 0, z: 1 });
  }
  assert.ok(Math.abs(camera.eye.x - tilted.eye.x) < 1e-10);
  assert.ok(Math.abs(camera.eye.y - tilted.eye.y) < 1e-10);
  const reversed = rotateCamera(rotateCamera(tilted, .2), -.2);
  assert.ok(Math.abs(reversed.eye.x - tilted.eye.x) < 1e-10);
});
test('vertical camera gets a non-singular horizontal direction', () => {
  const camera = levelCamera({ eye: { x: 0, y: 0, z: 2 }, up: { x: 1, y: 0, z: 0 } });
  assert.ok(Math.hypot(camera.eye.x, camera.eye.y) > 0);
  assert.ok(Math.abs(Math.hypot(camera.eye.x, camera.eye.y, camera.eye.z) - 2) < 1e-10);
});
