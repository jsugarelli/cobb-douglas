import test from 'node:test';
import assert from 'node:assert/strict';
import { utility, indifferenceCurve } from './math.js';

test('all slider levels produce exact intersections inside the visible goods plane', () => {
  for (let step = 5; step <= 80; step++) {
    const level = step / 10;
    const { x, y } = indifferenceCurve(level);
    assert.ok(Math.abs(y[0] - 10) < 1e-10);
    assert.ok(Math.abs(x.at(-1) - 10) < 1e-10);
    x.forEach((quantity, i) => {
      assert.ok(quantity > 0 && quantity <= 10 + 1e-10);
      assert.ok(y[i] > 0 && y[i] <= 10 + 1e-10);
      assert.ok(Math.abs(utility(quantity, y[i]) - level) < 1e-10);
      if (i > 0) assert.ok(y[i] < y[i - 1]);
    });
  }
});

test('translations have matching keys and placeholders', async () => {
  const { readFile } = await import('node:fs/promises');
  const translations = JSON.parse(await readFile(new URL('./translations.json', import.meta.url), 'utf8'));
  for (const locale of Object.values(translations)) {
    assert.deepEqual(Object.keys(locale).sort(), Object.keys(translations.de).sort());
    assert.ok(locale.insight.includes('{level}'));
  }
});
