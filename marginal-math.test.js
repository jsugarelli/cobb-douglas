import test from 'node:test';
import assert from 'node:assert/strict';
import { utility } from './math.js';
import { sectionUtility, marginalUtility, slopeValues } from './marginal-math.js';

test('both vertical slices retain the original quantities and utility', () => {
  for (const variable of [1, 2]) for (const fixed of [.5, 5, 9.5]) {
    for (const x of [0, .5, 3, 7, 10]) {
      assert.equal(sectionUtility(variable, x, fixed), variable === 1 ? utility(x, fixed) : utility(fixed, x));
    }
  }
});
test('secants converge to the correct partial derivative for both goods', () => {
  for (const variable of [1, 2]) for (const fixed of [.5, 5, 9.5]) for (const a of [.5, 3, 7]) {
    const exact = marginalUtility(variable, a, fixed);
    let previousError = Infinity;
    for (const gap of [3, 1, .1, .01, .0001]) {
      const s = slopeValues(variable, a, gap, fixed);
      const error = Math.abs(s.secant - exact);
      assert.ok(error < previousError);
      assert.ok(s.secant > 0 && s.secant < exact);
      assert.ok(s.b <= 10);
      previousError = error;
    }
    assert.ok(previousError / exact < .0001);
    const limit = slopeValues(variable, a, 0, fixed);
    assert.equal(limit.secant, null);
    assert.equal(limit.rise, 0);
    assert.equal(limit.derivative, exact);
    assert.ok(marginalUtility(variable, a + 1, fixed) < exact);
  }
});
