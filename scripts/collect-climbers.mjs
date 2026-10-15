// Collects the climber body dataset used by the article "climber-height-weight".
//
//   node scripts/collect-climbers.mjs [--cache DIR] [--offline]
//
// 1. IFSC results (ifsc.results.info): every World Cup, World Championship and Olympic
//    final ranking from 2010 to 2025. Athletes who finished 1st-3rd at least once form
//    the population. Height and arm span come from each athlete's IFSC profile.
// 2. DigitalRock (digitalrock.de, the former IFSC results service): the same kind of
//    events from 2005 onwards, used only to find each athlete's DigitalRock profile,
//    where athletes registered their height and weight.
//
// Raw responses are cached (default .cache/collect, ignored by Git) so the run can be
// repeated offline. Output: content/data/climbers/athletes.json and athletes.csv.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const cacheDir = resolve(args.includes('--cache') ? args[args.indexOf('--cache') + 1] : resolve(root, '.cache/collect'));
const offline = args.includes('--offline');
const UA = 'Mozilla/5.0 (CRUX climbing blog data collection; https://github.com/Matsu71/Climbing_Blog)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FIRST_YEAR = 2010;
const LAST_YEAR = 2025;

async function cached(file, fetcher) {
  const path = resolve(cacheDir, file);
  if (existsSync(path)) return JSON.parse(await readFile(path, 'utf8'));
  if (offline) return null;
  const data = await fetcher();
  if (data === null) return null;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data));
  await sleep(250);
  return data;
}

// --- IFSC -------------------------------------------------------------------------------
let ifscSession = null;
async function ifscLogin() {
  const res = await fetch('https://ifsc.results.info/', { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const token = /csrf-token" content="([^"]+)/.exec(html)?.[1];
  const cookies = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  if (!token) throw new Error('IFSC: no CSRF token on the home page');
  ifscSession = { token, cookies };
}
async function ifsc(path, file) {
  return cached(`ifsc/${file}`, async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!ifscSession) await ifscLogin();
      const res = await fetch('https://ifsc.results.info' + path, {
        headers: { 'User-Agent': UA, 'X-Csrf-Token': ifscSession.token, Cookie: ifscSession.cookies, Referer: 'https://ifsc.results.info/', Accept: 'application/json' },
      });
      if (res.ok) return res.json();
      ifscSession = null;
      await sleep(2000);
    }
    throw new Error(`IFSC request failed: ${path}`);
  });
}

const DISCIPLINE = { BOULDER: 'boulder', LEAD: 'lead', SPEED: 'speed', COMBINED: 'combined', 'BOULDER&LEAD': 'boulder_lead' };
const includeEvent = (name) => !/Group [AB]|African|European|Oceania|Pan American|Asian|Youth/i.test(name) && /World ?cup|World Championship|Olympic Games/i.test(name);

async function collectIfsc() {
  const api = await ifsc('/api/v1/', 'root.json');
  const results = [];
  for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
    const season = api.seasons.find((s) => s.name === String(year));
    for (const league of season.leagues) {
      if (!(league.name.startsWith('World Cups') || league.name === 'Games')) continue;
      const leagueData = await ifsc(league.url, `leagues/${league.url.split('/').pop()}.json`);
      for (const ev of leagueData?.events ?? []) {
        if (!includeEvent(ev.event)) continue;
        for (const dcat of ev.d_cats) {
          const m = /^(BOULDER|LEAD|SPEED|COMBINED|BOULDER&LEAD) (Men|Women)$/.exec(dcat.name.trim());
          if (!m) continue;
          const [, kind, sex] = m;
          const res = await ifsc(dcat.result_url, `results/${ev.event_id}_${dcat.id}.json`);
          for (const r of res?.ranking ?? []) {
            if (r.rank === null || r.rank === undefined) continue;
            results.push({ year, event_id: ev.event_id, event: ev.event.trim(), discipline: DISCIPLINE[kind], sex: sex === 'Men' ? 'male' : 'female', athlete_id: r.athlete_id, rank: r.rank, country: r.country });
          }
        }
      }
    }
  }
  return results;
}

// --- DigitalRock --------------------------------------------------------------------------
const DR_BASE = 'https://www.digitalrock.de/egroupware/ranking/json.php?';
async function dr(params, file) {
  return cached(`digitalrock/${file}`, async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(DR_BASE + new URLSearchParams(params), { headers: { 'User-Agent': UA } });
      if (res.ok) return res.json();
      await sleep(3000);
    }
    return null;
  });
}
const DR_CATS = new Set(['1', '2', '5', '6', '23', '24']);
async function collectDigitalRockPeople() {
  const people = new Map();
  for (let year = 2005; year <= LAST_YEAR; year++) {
    const cal = await dr({ type: 'calendar', year }, `cal/${year}.json`);
    for (const comp of cal?.competitions ?? []) {
      if (!/IFSC (Climbing )?World ?cup|World ?Championship|Worldcup|World Cup/i.test(comp.name) || /Youth|Junior|Para|Masters|Camp|Promo/i.test(comp.name)) continue;
      for (const cat of comp.cats ?? []) {
        if (!DR_CATS.has(cat.GrpId)) continue;
        const res = await dr({ comp: comp.WetId, cat: cat.GrpId }, `res/${comp.WetId}_${cat.GrpId}.json`);
        for (const p of res?.participants ?? []) if (p.PerId) people.set(p.PerId, { PerId: p.PerId, firstname: p.firstname, lastname: p.lastname, nation: p.nation, birthyear: p.birthyear });
      }
    }
  }
  return people;
}

const key = (first, last, nation) => `${String(first ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '')}|${String(last ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '')}|${nation}`;
const titleCase = (s) => String(s).toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const toNumber = (v) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

// --- Compile --------------------------------------------------------------------------------
const results = await collectIfsc();
const athletes = new Map();
for (const r of results) {
  const a = athletes.get(r.athlete_id) ?? { ifsc_id: r.athlete_id, sex: r.sex, podiums: {}, wins: {}, podium_years: [] };
  if (r.rank <= 3) {
    a.podiums[r.discipline] = (a.podiums[r.discipline] ?? 0) + 1;
    a.podium_years.push(r.year);
  }
  if (r.rank === 1) a.wins[r.discipline] = (a.wins[r.discipline] ?? 0) + 1;
  athletes.set(r.athlete_id, a);
}
const podium = [...athletes.values()].filter((a) => a.podium_years.length);
const drPeople = await collectDigitalRockPeople();
const drIndex = new Map();
for (const p of drPeople.values()) {
  const k = key(p.firstname, p.lastname, p.nation);
  drIndex.set(k, [...(drIndex.get(k) ?? []), p]);
}

const rows = [];
for (const a of podium) {
  const p = await ifsc(`/api/v1/athletes/${a.ifsc_id}`, `athletes/${a.ifsc_id}.json`);
  const matches = drIndex.get(key(p.firstname, p.lastname, p.country)) ?? [];
  const birthYear = p.birthday ? Number(p.birthday.slice(0, 4)) : null;
  const drMatch = matches.length === 1 ? matches[0] : matches.find((m) => Number(m.birthyear) === birthYear) ?? null;
  const drPerson = drMatch ? await dr({ person: drMatch.PerId }, `person/${drMatch.PerId}.json`) : null;
  const height = toNumber(p.height);
  const drHeight = toNumber(drPerson?.height);
  const drWeight = toNumber(drPerson?.weight);
  const climbing = ['boulder', 'lead', 'combined', 'boulder_lead'].some((d) => a.podiums[d]);
  rows.push({
    ifsc_id: a.ifsc_id,
    name: `${titleCase(p.firstname)} ${titleCase(p.lastname)}`.replace(/\s+/g, ' ').trim(),
    sex: a.sex,
    country: p.country,
    birth_year: birthYear,
    group: climbing ? 'climbing' : 'speed',
    podiums: a.podiums,
    wins: a.wins,
    podium_total: Object.values(a.podiums).reduce((x, y) => x + y, 0),
    win_total: Object.values(a.wins).reduce((x, y) => x + y, 0),
    first_podium_year: Math.min(...a.podium_years),
    last_podium_year: Math.max(...a.podium_years),
    height: height && height >= 140 && height <= 210 ? height : null,
    arm_span: toNumber(p.arm_span),
    ifsc_url: `https://ifsc.results.info/athlete/${a.ifsc_id}`,
    dr_id: drMatch?.PerId ?? null,
    dr_url: drMatch ? `https://www.digitalrock.de/egroupware/ranking/sitemgr/digitalrock/pstambl.html#person=${drMatch.PerId}` : null,
    dr_height: drHeight && drHeight >= 140 && drHeight <= 210 ? drHeight : null,
    dr_weight: drWeight && drWeight >= 35 && drWeight <= 110 ? drWeight : null,
    dr_last_competition: drPerson?.last_comp ?? null,
  });
}
rows.sort((x, y) => x.sex.localeCompare(y.sex) || y.podium_total - x.podium_total || x.name.localeCompare(y.name));

const outDir = resolve(root, 'content/data/climbers');
await mkdir(outDir, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const meta = {
  title: 'IFSC表彰台経験者の体格データ',
  retrieved_at: process.env.RETRIEVED_AT ?? today,
  population: `IFSCのワールドカップ・世界選手権・五輪（${FIRST_YEAR}〜${LAST_YEAR}年）で1回以上3位以内に入った選手`,
  sources: {
    ifsc: 'https://ifsc.results.info/ （選手プロフィールの height・arm_span と大会結果）',
    digitalrock: 'https://www.digitalrock.de/ （選手が登録した height・weight。登録時期は不明）',
  },
  notes: [
    '値は各サイトの掲載値で、測定日は分かりません。推測による補完はしていません。',
    'DigitalRockの選手は、名・姓・国が一致し、候補が複数あるときは生年も一致した場合だけ対応づけています。',
  ],
  provenance: { author: { actor: 'collect-climbers', model: 'claude-opus-5-5', reasoningEffort: 'max' } },
  counts: { athletes: rows.length, ifsc_results: results.length, digitalrock_people: drPeople.size },
};
await writeFile(resolve(outDir, 'athletes.json'), JSON.stringify({ meta, athletes: rows }, null, 1) + '\n');
const cols = ['ifsc_id', 'name', 'sex', 'country', 'birth_year', 'group', 'podium_total', 'win_total', 'first_podium_year', 'last_podium_year', 'height', 'arm_span', 'dr_id', 'dr_height', 'dr_weight', 'dr_last_competition', 'ifsc_url', 'dr_url'];
const csvCell = (v) => (v === null || v === undefined ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : String(v));
await writeFile(resolve(outDir, 'athletes.csv'), [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n');
console.log(JSON.stringify({ ...meta.counts, with_height: rows.filter((r) => r.height).length, with_arm_span: rows.filter((r) => r.arm_span).length, with_dr: rows.filter((r) => r.dr_id).length, with_dr_weight: rows.filter((r) => r.dr_weight).length }));
