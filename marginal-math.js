import { utility, ALPHA, BETA } from './math.js';

export function sectionUtility(variable, quantity, fixed) {
  return variable === 1 ? utility(quantity, fixed) : utility(fixed, quantity);
}

export function marginalUtility(variable, quantity, fixed) {
  const exponent = variable === 1 ? ALPHA : BETA;
  const otherExponent = variable === 1 ? BETA : ALPHA;
  return exponent * quantity ** (exponent - 1) * fixed ** otherExponent;
}

export function slopeValues(variable, a, gap, fixed) {
  const ua = sectionUtility(variable, a, fixed);
  const ub = sectionUtility(variable, a + gap, fixed);
  const derivative = marginalUtility(variable, a, fixed);
  return { a, b: a + gap, ua, ub, gap, rise: ub - ua, derivative, secant: gap === 0 ? null : (ub - ua) / gap };
}
