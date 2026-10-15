import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from '../scripts/build.mjs';
import { auditPages } from '../scripts/check.mjs';
import { load } from '../src/articles/climber-height-weight.mjs';

const { out } = await build({ write: false });
const root = new URL('..', import.meta.url).pathname;

test('every page is well formed and every internal link resolves', () => {
  const pages = new Map([...out].filter(([p]) => p.endsWith('.html')));
  const { problems, links } = auditPages(pages, (file) => out.has(file) || file.startsWith('assets/'));
  assert.deepEqual(problems, []);
  assert.ok(links > 100);
});

test('the main sections exist', () => {
  for (const path of ['index.html', 'articles/index.html', 'data/index.html', 'data/athletes/index.html', 'data/ascents/index.html', 'data/injuries/index.html', 'data/gyms/index.html', 'data/sources/index.html', 'glossary/index.html', 'about/index.html', '404.html', 'sitemap.xml', 'robots.txt']) {
    assert.ok(out.has(path), path);
  }
});

test('the body-size article quotes the computed statistics', async () => {
  const html = out.get('articles/climber-height-weight/index.html');
  const { values: v } = await load(root);
  assert.ok(html.includes(`男子${v.height.male.mean.toFixed(1)}cm、女子${v.height.female.mean.toFixed(1)}cm`));
  assert.ok(html.includes(`中央値は男子${v.bmi.male.median.toFixed(1)}、女子${v.bmi.female.median.toFixed(1)}`));
  for (const id of ['fig-height', 'fig-relative', 'fig-success', 'fig-discipline', 'fig-bmi', 'fig-bmi-compare', 'fig-ape']) assert.ok(html.includes(`id="${id}"`), id);
  assert.equal((html.match(/<li id="ref-/g) ?? []).length, 10);
});

test('weights are only used from adult registrations that agree with IFSC heights', async () => {
  const { athleteRows } = await load(root);
  for (const a of athleteRows.filter((x) => x.weight_ok)) {
    assert.ok(a.dr_height && a.dr_weight);
    if (a.height) assert.ok(Math.abs(a.height - a.dr_height) <= 2, a.name);
    assert.ok(Number(a.dr_last_competition.slice(0, 4)) - a.birth_year >= 18, a.name);
  }
});

test('old URLs are redirected from the 404 page', () => {
  const html = out.get('404.html');
  for (const key of ['"read"', '"athlete-data"', '"read/body-not-destiny"']) assert.ok(html.includes(key), key);
});
