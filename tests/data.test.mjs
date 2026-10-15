import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async (p) => JSON.parse(await readFile(new URL(`../${p}`, import.meta.url), 'utf8'));

test('climber dataset: one row per athlete, plausible values, sources', async () => {
  const { meta, athletes } = await read('content/data/climbers/athletes.json');
  assert.ok(meta.retrieved_at && meta.population);
  assert.equal(new Set(athletes.map((a) => a.ifsc_id)).size, athletes.length);
  for (const a of athletes) {
    assert.ok(['male', 'female'].includes(a.sex), a.name);
    assert.ok(['climbing', 'speed'].includes(a.group), a.name);
    assert.ok(a.podium_total >= 1, `${a.name} has no podium`);
    assert.match(a.ifsc_url, /^https:\/\/ifsc\.results\.info\/athlete\/\d+$/);
    if (a.height !== null) assert.ok(a.height >= 140 && a.height <= 210, `${a.name} height ${a.height}`);
    if (a.arm_span !== null && a.height !== null) assert.ok(Math.abs(a.arm_span - a.height) <= 20, `${a.name} arm span ${a.arm_span}`);
    if (a.dr_weight !== null) assert.ok(a.dr_id && a.dr_weight >= 35 && a.dr_weight <= 110, `${a.name} weight`);
  }
});

test('every country with a measured athlete has a national height reference', async () => {
  const { athletes } = await read('content/data/climbers/athletes.json');
  const nat = await read('content/data/climbers/national-height.json');
  const missing = [...new Set(athletes.filter((a) => a.height && a.country !== 'AIN').map((a) => a.country))].filter((c) => !nat.ioc_to_iso3[c] || !nat.male[nat.ioc_to_iso3[c]] || !nat.female[nat.ioc_to_iso3[c]]);
  assert.deepEqual(missing, []);
});

test('reference values match the cited tables', async () => {
  const ref = await read('content/data/climbers/reference.json');
  assert.deepEqual([ref.japan.male.height, ref.japan.male.weight, ref.japan.male.bmi], [171.6, 65.4, 22.2]);
  assert.deepEqual([ref.japan.female.height, ref.japan.female.weight, ref.japan.female.bmi], [158.0, 52.0, 20.8]);
  for (const g of ref.research_groups.groups) {
    assert.ok(ref.research_groups.citations[g.study], `citation for ${g.study}`);
    if (g.bmi !== null) assert.ok(Math.abs(g.bmi - g.weight / (g.height / 100) ** 2) < 0.3, `${g.study} BMI is consistent`);
  }
});

test('evidence records point at existing athletes and sources', async () => {
  const ev = await read('content/data/evidence.json');
  const sources = new Set(ev.sources.map((s) => s.id));
  const athletes = new Set(ev.athletes.map((a) => a.id));
  for (const m of ev.measurements) {
    assert.ok(athletes.has(m.athlete_id), m.id);
    assert.ok(sources.has(m.source_id), m.id);
  }
  for (const a of ev.ascents) {
    assert.ok(athletes.has(a.athlete_id), a.id);
    assert.ok(sources.has(a.source_id), a.id);
  }
  for (const c of ev.clinical) assert.ok(sources.has(c.source_id), c.id);
});

test('gyms and glossary have sources for every entry', async () => {
  const gyms = await read('content/data/gyms.json');
  const gymSources = new Set(gyms.sources.map((s) => s.id));
  for (const g of gyms.gyms) for (const s of g.sources) assert.ok(gymSources.has(s), `${g.id} → ${s}`);
  const glossary = await read('content/data/glossary.json');
  assert.equal(new Set(glossary.terms.map((t) => t.id)).size, glossary.terms.length);
});
