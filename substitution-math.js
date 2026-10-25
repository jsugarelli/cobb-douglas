import { ALPHA, BETA, utility } from './math.js';

export const SUBSTITUTION_UTILITY = utility(3, 5);

export function quantityOnIndifference(x1, level = SUBSTITUTION_UTILITY) {
  return (level / x1 ** ALPHA) ** (1 / BETA);
}

export function substitutionValues(a, gap, compensation = 1) {
  const yA = quantityOnIndifference(a);
  const b = a + gap;
  const yB = quantityOnIndifference(b);
  const yCurrent = yA + compensation * (yB - yA);
  const mrs = ALPHA / BETA * yA / a;
  return { a, b, yA, yB, yCurrent, gap, sacrifice: yA - yB,
    average: gap === 0 ? null : (yA - yB) / gap, mrs, slope: -mrs,
    baseUtility: SUBSTITUTION_UTILITY, addedUtility: utility(b, yA), currentUtility: utility(b, yCurrent) };
}

export function substitutionPlotRange(a) {
  const domainStart = (SUBSTITUTION_UTILITY / 10 ** BETA) ** (1 / ALPHA);
  const x = [Math.max(domainStart, a - .75), Math.min(10, a + 3.75)];
  const yA = quantityOnIndifference(a);
  const mrs = ALPHA / BETA * yA / a;
  const ys = x.flatMap(x1 => [quantityOnIndifference(x1), yA - mrs * (x1 - a)]);
  const low = Math.min(...ys), high = Math.max(...ys);
  const padding = Math.max(.2, .1 * (high - low));
  return { x, y: [Math.max(0, low - padding), high + padding] };
}
