import test from 'node:test';
import assert from 'node:assert/strict';
import { utility } from './math.js';
import { sectionUtility, marginalUtility, slopeValues, slopePlotRange } from './marginal-math.js';

test('0.4 and 0.6 exponents give the expected utility and partial derivatives', () => {
  assert.ok(Math.abs(utility(1, 32) - 8) < 1e-12);
  assert.ok(Math.abs(marginalUtility(1, 1, 32) - 3.2) < 1e-12);
  assert.ok(Math.abs(marginalUtility(2, 32, 1) - .15) < 1e-12);
});

test('enlarged slope view contains both points and tangent without rescaling as the gap changes', () => {
  for (const variable of [1, 2]) for (const fixed of [.5, 5, 9.5]) for (const a of [.5, 3, 7]) {
    const range = slopePlotRange(variable, a, fixed);
    assert.ok(range.x[1] - range.x[0] < 5);
    assert.ok(range.y[1] > range.y[0]);
    for (const gap of [0, .01, 1, 3]) {
      const s = slopeValues(variable, a, gap, fixed);
      assert.ok(s.a >= range.x[0] && s.b <= range.x[1]);
      assert.ok(s.ua >= range.y[0] && s.ub <= range.y[1]);
    }
    const ua = sectionUtility(variable, a, fixed);
    for (const x of range.x) {
      const tangentY = ua + marginalUtility(variable, a, fixed) * (x - a);
      assert.ok(tangentY >= range.y[0] && tangentY <= range.y[1]);
    }
  }
});

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
