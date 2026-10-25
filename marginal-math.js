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

// Anchor the enlarged view to A and the largest possible gap, rather than the
// current gap. This keeps the scale stable while B approaches A.
export function slopePlotRange(variable, a, fixed) {
  const x = [Math.max(0, a - .75), Math.min(10, a + 3.75)];
  const ua = sectionUtility(variable, a, fixed);
  const derivative = marginalUtility(variable, a, fixed);
  const ordinates = x.flatMap(quantity => [
    sectionUtility(variable, quantity, fixed),
    ua + derivative * (quantity - a)
  ]);
  const low = Math.min(...ordinates), high = Math.max(...ordinates);
  const padding = Math.max(.12, (high - low) * .12);
  return { x, y: [Math.max(0, low - padding), high + padding] };
}
