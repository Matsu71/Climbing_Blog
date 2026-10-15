import test from 'node:test';
import assert from 'node:assert/strict';
import { mean, sd, quantile, median, summary, pearson, spearman, welch, bmi, round } from '../src/stats.mjs';

test('mean, sample SD and quantiles (type 7)', () => {
  const v = [2, 4, 4, 4, 5, 5, 7, 9];
  assert.equal(mean(v), 5);
  assert.equal(round(sd(v), 4), 2.1381);
  assert.equal(quantile([1, 2, 3, 4], 0.25), 1.75);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(summary([null, 1, 3]).n, 2);
});

test('round goes half away from zero', () => {
  assert.equal(round(1.85, 1), 1.9);
  assert.equal(round(-1.85, 1), -1.9);
  assert.equal(round(null), null);
});

test('correlations', () => {
  assert.equal(round(pearson([1, 2, 3, 4], [2, 4, 6, 8]).r, 6), 1);
  assert.equal(spearman([1, 2, 3, 4], [1, 4, 9, 16]).r, 1);
  assert.equal(spearman([1, 2, 3], [3, 2, 1]).r, -1);
});

test("Welch's t-test against a known value", () => {
  // Means 175 and 170.5, variances 14 and 3.5, n = 6 each: t = 4.5 / sqrt(14/6 + 3.5/6) = 2.635, df ≈ 7.35.
  const a = [170, 172, 174, 176, 178, 180], b = [168, 169, 170, 171, 172, 173];
  const r = welch(a, b);
  assert.equal(round(r.t, 3), 2.635);
  assert.equal(round(r.df, 2), 7.35);
  // Two-sided p from numerical integration of the t density: 0.0322.
  assert.ok(Math.abs(r.p - 0.0322) < 0.001, `p = ${r.p}`);
});

test('BMI', () => {
  assert.equal(round(bmi(170, 60), 1), 20.8);
  assert.equal(bmi(null, 60), null);
});
