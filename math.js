export const MAX_QUANTITY = 10;
export const ALPHA = 0.7;
export const BETA = 0.3;

export function utility(x1, x2) {
  return x1 ** ALPHA * x2 ** BETA;
}

// Exact intersection U(x1,x2) = level within the visible square [0,10]².
export function indifferenceCurve(level, count = 180) {
  if (!(level > 0 && level <= MAX_QUANTITY)) throw new RangeError('Utility level must be in (0, 10].');
  const minimumX = (level / MAX_QUANTITY ** BETA) ** (1 / ALPHA);
  const x = Array.from({ length: count }, (_, i) => minimumX * (MAX_QUANTITY / minimumX) ** (i / (count - 1)));
  const y = x.map(value => (level / value ** ALPHA) ** (1 / BETA));
  return { x, y };
}
