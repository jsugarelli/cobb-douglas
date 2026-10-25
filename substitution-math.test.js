import test from 'node:test';
import assert from 'node:assert/strict';
import { utility } from './math.js';
import { marginalUtility } from './marginal-math.js';
import { substitutionValues, quantityOnIndifference, SUBSTITUTION_UTILITY, substitutionPlotRange } from './substitution-math.js';

test('additional good 1 increases utility and full compensation restores it exactly', () => {
  for (const a of [1.5, 3, 7]) for (const gap of [0, .01, 1, 3]) {
    let previous = Infinity;
    for (const fraction of [0, .25, .5, .75, 1]) {
      const s = substitutionValues(a, gap, fraction);
      assert.ok(s.b <= 10 && s.yA <= 10 && s.yB > 0);
      assert.ok(s.currentUtility <= previous + 1e-10);
      assert.ok(s.currentUtility >= SUBSTITUTION_UTILITY - 1e-10);
      previous = s.currentUtility;
      if (fraction === 1) assert.ok(Math.abs(s.currentUtility - s.baseUtility) < 1e-10);
      if (gap > 0) assert.ok(s.addedUtility > s.baseUtility);
    }
  }
});
test('positive MRS equals marginal utility ratio and negative curve slope', () => {
  for (const a of [1.5, 3, 7]) {
    const s = substitutionValues(a, 0);
    const ratio = marginalUtility(1, a, s.yA) / marginalUtility(2, s.yA, a);
    assert.ok(Math.abs(s.mrs - ratio) < 1e-10);
    assert.ok(Math.abs(s.slope - (quantityOnIndifference(a + .00001) - s.yA) / .00001) < .0001);
    assert.equal(s.average, null);
    let error = Infinity;
    for (const gap of [3, 1, .1, .01, .0001]) {
      const finite = substitutionValues(a, gap);
      const next = Math.abs(finite.average - s.mrs);
      assert.ok(next < error);
      assert.ok(finite.average > 0 && finite.average < s.mrs);
      error = next;
    }
    assert.ok(substitutionValues(a + .1, 0).mrs < s.mrs);
  }
});
test('zoomed exchange view contains compensated points for every gap', () => {
  for (const a of [1.5, 3, 7]) {
    const range = substitutionPlotRange(a);
    for (const gap of [0, .01, 1, 3]) {
      const s = substitutionValues(a, gap);
      assert.ok(s.a >= range.x[0] && s.b <= range.x[1]);
      assert.ok(s.yA >= range.y[0] && s.yA <= range.y[1]);
      assert.ok(s.yB >= range.y[0] && s.yB <= range.y[1]);
      assert.ok(Math.abs(utility(s.b, s.yB) - s.baseUtility) < 1e-10);
    }
  }
});
