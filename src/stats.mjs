// Descriptive statistics used by the articles and data pages.

const finite = (values) => values.filter((v) => typeof v === 'number' && Number.isFinite(v));

export function mean(values) {
  const v = finite(values);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// Sample standard deviation (n - 1).
export function sd(values) {
  const v = finite(values);
  if (v.length < 2) return null;
  const m = mean(v);
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1));
}

// Quantile with linear interpolation between order statistics (type 7, as in R and NumPy).
export function quantile(values, q) {
  const v = finite(values).sort((a, b) => a - b);
  if (!v.length) return null;
  const pos = (v.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return v[lo] + (v[hi] - v[lo]) * (pos - lo);
}

export const median = (values) => quantile(values, 0.5);

export function summary(values) {
  const v = finite(values);
  return {
    n: v.length,
    mean: mean(v),
    sd: sd(v),
    min: v.length ? Math.min(...v) : null,
    q1: quantile(v, 0.25),
    median: median(v),
    q3: quantile(v, 0.75),
    max: v.length ? Math.max(...v) : null,
  };
}

// Pearson correlation for paired values; pairs with a missing side are dropped.
export function pearson(xs, ys) {
  const pairs = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 3) return null;
  const mx = mean(pairs.map((p) => p[0]));
  const my = mean(pairs.map((p) => p[1]));
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of pairs) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  return { r: sxy / Math.sqrt(sxx * syy), n: pairs.length };
}

// Spearman rank correlation (average ranks for ties).
export function spearman(xs, ys) {
  const pairs = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 3) return null;
  const rank = (vals) => {
    const order = vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const ranks = new Array(vals.length);
    for (let i = 0; i < order.length;) {
      let j = i;
      while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
      for (let k = i; k <= j; k++) ranks[order[k][1]] = (i + j) / 2 + 1;
      i = j + 1;
    }
    return ranks;
  };
  return { r: pearson(rank(pairs.map((p) => p[0])), rank(pairs.map((p) => p[1]))).r, n: pairs.length };
}

// Welch's t statistic and an approximate two-sided p-value (normal approximation for df > 30,
// otherwise a Student-t series). Enough for describing differences; not a replacement for a stats package.
export function welch(a, b) {
  const x = finite(a), y = finite(b);
  if (x.length < 2 || y.length < 2) return null;
  const va = sd(x) ** 2 / x.length, vb = sd(y) ** 2 / y.length;
  const t = (mean(x) - mean(y)) / Math.sqrt(va + vb);
  const df = (va + vb) ** 2 / (va ** 2 / (x.length - 1) + vb ** 2 / (y.length - 1));
  return { t, df, p: 2 * (1 - studentCdf(Math.abs(t), df)), diff: mean(x) - mean(y) };
}

function studentCdf(t, df) {
  // Regularized incomplete beta via continued fraction (Numerical Recipes).
  const x = df / (df + t * t);
  const ibeta = incompleteBeta(x, df / 2, 0.5);
  return 1 - 0.5 * ibeta;
}

function logGamma(z) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const k of c) ser += k / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function incompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  const cf = (xx, aa, bb) => {
    let c = 1, d = 1 - (aa + bb) * xx / (aa + 1);
    d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d);
    let h = d;
    for (let m = 1; m <= 200; m++) {
      const m2 = 2 * m;
      let aa1 = m * (bb - m) * xx / ((aa + m2 - 1) * (aa + m2));
      d = 1 + aa1 * d; d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d);
      c = 1 + aa1 / c; c = Math.abs(c) < 1e-30 ? 1e-30 : c;
      h *= d * c;
      aa1 = -(aa + m) * (aa + bb + m) * xx / ((aa + m2) * (aa + m2 + 1));
      d = 1 + aa1 * d; d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d);
      c = 1 + aa1 / c; c = Math.abs(c) < 1e-30 ? 1e-30 : c;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  };
  return x < (a + 1) / (a + b + 2) ? bt * cf(x, a, b) / a : 1 - bt * cf(1 - x, b, a) / b;
}

export const bmi = (heightCm, weightKg) => (Number.isFinite(heightCm) && Number.isFinite(weightKg) ? weightKg / (heightCm / 100) ** 2 : null);

// Rounds half away from zero (so -1.85 becomes -1.9, the same way as 1.85 becomes 1.9).
export function round(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const f = 10 ** digits;
  return (Math.sign(value) * Math.round(Math.abs(value) * f + 1e-9)) / f;
}
