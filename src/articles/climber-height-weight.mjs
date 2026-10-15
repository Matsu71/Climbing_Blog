// Statistics and figures for content/articles/climber-height-weight.md.
// Every number quoted in the article is computed here from content/data/climbers/*.json.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { summary, mean, median, quantile, spearman, welch, bmi, round } from '../stats.mjs';
import { histogram, scatter, dotRows, dotCompare } from '../charts.mjs';

// Weight comes from DigitalRock, where athletes registered height and weight together.
// A pair is used when (1) both values exist, (2) the athlete was at least 18 at their last
// DigitalRock competition, and (3) the registered height agrees with the IFSC profile within
// 2 cm whenever the IFSC profile has a height. BMI uses the registered pair.
export const HEIGHT_AGREEMENT_CM = 2;
export const MIN_AGE = 18;

const signedLabel = (x) => (x > 0 ? `+${x}` : x < 0 ? `−${-x}` : '0');
const SEX = { male: { label: '男子', cls: 's-1' }, female: { label: '女子', cls: 's-2' } };
const r1 = (v) => round(v, 1);

function primaryDiscipline(a) {
  if (a.group === 'speed') return 'speed';
  const b = (a.podiums.boulder ?? 0), l = (a.podiums.lead ?? 0);
  if (b > l) return 'boulder';
  if (l > b) return 'lead';
  return 'both';
}

function nationalHeight(nat, a) {
  const iso = nat.ioc_to_iso3[a.country];
  if (!iso) return null;
  const table = nat[a.sex][iso];
  if (!table) return null;
  const year = Math.min(1996, Math.max(1975, a.birth_year ?? 1996));
  return table[String(year)] ?? null;
}

function describe(values) {
  const s = summary(values);
  return { n: s.n, mean: r1(s.mean), sd: r1(s.sd), median: r1(s.median), q1: r1(s.q1), q3: r1(s.q3), min: s.min, max: s.max };
}

export async function load(root) {
  const read = async (p) => JSON.parse(await readFile(resolve(root, p), 'utf8'));
  const data = await read('content/data/climbers/athletes.json');
  const nat = await read('content/data/climbers/national-height.json');
  const ref = await read('content/data/climbers/reference.json');
  const evidence = await read('content/data/evidence.json');
  const latinToJa = new Map(evidence.athletes.map((a) => [String(a.latin).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, ''), a.name]));

  const athletes = data.athletes.map((a) => {
    const lastDr = a.dr_last_competition ? Number(a.dr_last_competition.slice(0, 4)) : null;
    const adult = a.birth_year && lastDr ? lastDr - a.birth_year >= MIN_AGE : false;
    const agrees = !a.height || (a.dr_height && Math.abs(a.height - a.dr_height) <= HEIGHT_AGREEMENT_CM);
    const weightOk = Boolean(a.dr_height && a.dr_weight && adult && agrees);
    const natH = nationalHeight(nat, a);
    const key = a.name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
    return {
      ...a,
      name_ja: latinToJa.get(key) ?? null,
      discipline: primaryDiscipline(a),
      weight_ok: weightOk,
      bmi: weightOk ? r1(bmi(a.dr_height, a.dr_weight)) : null,
      ape: a.height && a.arm_span ? a.arm_span - a.height : null,
      national_height: natH,
      relative_height: a.height && natH ? r1(a.height - natH) : null,
    };
  });

  const climbing = athletes.filter((a) => a.group === 'climbing');
  const speed = athletes.filter((a) => a.group === 'speed');
  const bySex = (list, sex) => list.filter((a) => a.sex === sex);
  const heights = (list) => list.filter((a) => a.height).map((a) => a.height);

  const v = { counts: {}, height: {}, speed: {}, rel: {}, disc: {}, success: {}, era: {}, bmi: {}, weight: {}, ape: {}, japan: ref.japan, ideal: {}, examples: {} };
  v.counts.all = athletes.length;
  v.counts.climbing = climbing.length;
  v.counts.speed = speed.length;
  v.counts.ifscResults = data.meta.counts.ifsc_results;
  v.retrieved = data.meta.retrieved_at;

  for (const sex of ['male', 'female']) {
    const c = bySex(climbing, sex);
    v.counts[sex] = c.length;
    v.height[sex] = describe(heights(c));
    v.height[sex].missing = c.length - v.height[sex].n;
    v.speed[sex] = describe(heights(bySex(speed, sex)));
    const rel = c.filter((a) => a.relative_height !== null).map((a) => a.relative_height);
    v.rel[sex] = { ...describe(rel), taller: rel.filter((x) => x > 0).length, shorter: rel.filter((x) => x < 0).length };
    v.rel[sex].tallerPct = Math.round((v.rel[sex].taller / rel.length) * 100);
    v.disc[sex] = {};
    for (const d of ['boulder', 'lead']) v.disc[sex][d] = describe(heights(c.filter((a) => a.discipline === d)));
    const t = welch(heights(c.filter((a) => a.discipline === 'boulder')), heights(c.filter((a) => a.discipline === 'lead')));
    v.disc[sex].diff = r1(t.diff);
    v.disc[sex].p = round(t.p, 2);
    const withH = c.filter((a) => a.height);
    const rho = spearman(withH.map((a) => a.height), withH.map((a) => a.podium_total));
    v.success[sex] = { rho: round(rho.r, 2), n: rho.n };
    const winners = withH.filter((a) => a.win_total >= 1);
    v.success[sex].winners = describe(winners.map((a) => a.height));
    v.success[sex].nonWinners = describe(withH.filter((a) => a.win_total === 0).map((a) => a.height));
    const early = withH.filter((a) => a.first_podium_year <= 2017), late = withH.filter((a) => a.first_podium_year >= 2018);
    v.era[sex] = { early: describe(early.map((a) => a.height)), late: describe(late.map((a) => a.height)) };
    const wt = c.filter((a) => a.weight_ok);
    v.weight[sex] = describe(wt.map((a) => a.dr_weight));
    v.bmi[sex] = describe(wt.map((a) => a.bmi));
    v.bmi[sex].under185 = wt.filter((a) => a.bmi < 18.5).length;
    v.bmi[sex].over25 = wt.filter((a) => a.bmi >= 25).length;
    const ape = c.filter((a) => a.ape !== null).map((a) => a.ape);
    v.ape[sex] = { ...describe(ape), positive: ape.filter((x) => x > 0).length };
    const sorted = withH.slice().sort((a, b) => a.height - b.height);
    v.examples[sex] = { shortest: sorted[0], tallest: sorted.at(-1) };
  }
  // Pooled ape index (both sexes) because few athletes publish arm span.
  const apeAll = climbing.filter((a) => a.ape !== null);
  v.ape.all = { ...describe(apeAll.map((a) => a.ape)), positive: apeAll.filter((a) => a.ape > 0).length };
  v.ape.all.ratio = round(mean(apeAll.map((a) => a.arm_span / a.height)), 3);
  v.ape.all.positivePct = Math.round((v.ape.all.positive / apeAll.length) * 100);
  v.weight.total = climbing.filter((a) => a.weight_ok).length;
  v.weight.matched = climbing.filter((a) => a.dr_weight).length;
  v.weight.excluded = v.weight.matched - v.weight.total;

  // "Ideal" = the statistical centre of top athletes: middle 50 % of height and BMI.
  for (const sex of ['male', 'female']) {
    const h = v.height[sex], b = v.bmi[sex];
    v.ideal[sex] = {
      heightLow: Math.round(h.q1), heightHigh: Math.round(h.q3),
      bmiLow: b.q1, bmiHigh: b.q3, bmiMedian: b.median,
      weightAtMedianHeight: Math.round(b.median * (h.median / 100) ** 2),
      weightLowAtMedian: Math.round(b.q1 * (h.median / 100) ** 2),
      weightHighAtMedian: Math.round(b.q3 * (h.median / 100) ** 2),
    };
  }
  v.ideal.table = [150, 155, 160, 165, 170, 175, 180, 185].map((cm) => ({
    cm,
    male: [Math.round(v.bmi.male.q1 * (cm / 100) ** 2), Math.round(v.bmi.male.q3 * (cm / 100) ** 2)],
    female: [Math.round(v.bmi.female.q1 * (cm / 100) ** 2), Math.round(v.bmi.female.q3 * (cm / 100) ** 2)],
  }));

  v.relAbs = { male: Math.abs(v.rel.male.mean), female: Math.abs(v.rel.female.mean) };
  v.vsJapan = { male: r1(v.height.male.mean - ref.japan.male.height), female: r1(v.height.female.mean - ref.japan.female.height) };
  const bothHeights = athletes.filter((a) => a.height && a.dr_height);
  v.agreement = { n: bothHeights.length, within: bothHeights.filter((a) => Math.abs(a.height - a.dr_height) <= HEIGHT_AGREEMENT_CM).length };
  v.agreement.other = v.agreement.n - v.agreement.within;
  const PEOPLE = { garnbret: 'Janja Garnbret', noguchi: 'Akiyo Noguchi', kim: 'Ja In Kim', schubert: 'Jakob Schubert', ondra: 'Adam Ondra', tomoa: 'Tomoa Narasaki', anraku: 'Sorato Anraku', mori: 'Ai Mori', lee: 'Dohyun Lee' };
  v.p = {};
  for (const [k, name] of Object.entries(PEOPLE)) {
    const a = athletes.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (!a) throw new Error(`climber-height-weight: ${name} is not in the dataset`);
    v.p[k] = { height: a.height, dr_height: a.dr_height, podiums: a.podium_total, wins: a.win_total };
  }

  const research = ref.research_groups.groups.map((g) => ({ ...g, bmi: g.bmi ?? r1(bmi(g.height, g.weight)), bmi_computed: g.bmi === null }));
  v.research = {
    male: describe(research.filter((g) => g.sex === 'male').map((g) => g.bmi)),
    female: describe(research.filter((g) => g.sex === 'female').map((g) => g.bmi)),
  };

  const tipOf = (a, extra = '') => `${a.name_ja ? `${a.name_ja}（${a.name}）` : a.name}・${a.country}　${extra}`;
  const heightTicks = [150, 160, 170, 180, 190].map((x) => ({ value: x, label: `${x}` }));

  const figures = {
    'height-histogram': () => histogram({
      id: 'fig-height',
      title: '表彰台経験者の身長の分布',
      subtitle: `ボルダー・リード等で表彰台に上がった選手（男子${v.height.male.n}人・女子${v.height.female.n}人）。棒の高さは人数、縦線は日本の18〜29歳の平均`,
      panels: ['male', 'female'].map((sex) => ({
        label: SEX[sex].label, cls: SEX[sex].cls,
        values: heights(bySex(climbing, sex)),
        refs: [{ value: ref.japan[sex].height, label: `日本の平均 ${ref.japan[sex].height}` }],
      })),
      bin: { start: 150, end: 192, width: 2 },
      xTicks: heightTicks, xLabel: '身長（cm）', unit: 'cm',
      note: `出典：IFSC選手プロフィール（${v.retrieved}取得）、厚生労働省 国民健康・栄養調査（2018・2019年）。`,
    }),
    'relative-height': () => dotRows({
      id: 'fig-relative',
      title: '自国の同世代の平均と比べた身長',
      subtitle: '0より右は自国の平均より高く、左は低い。帯は中央の50%、縦線は中央値',
      rows: ['male', 'female'].map((sex) => {
        const list = bySex(climbing, sex).filter((a) => a.relative_height !== null);
        const vals = list.map((a) => a.relative_height);
        return { label: SEX[sex].label, cls: SEX[sex].cls, values: list.map((a) => ({ v: a.relative_height, tip: tipOf(a, `${a.height}cm（自国平均 ${r1(a.national_height)}cm、差 ${signedLabel(a.relative_height)}cm）`) })), mean: mean(vals), median: median(vals), q1: quantile(vals, 0.25), q3: quantile(vals, 0.75) };
      }),
      domain: [-20, 20], ticks: [-20, -10, 0, 10, 20].map((x) => ({ value: x, label: signedLabel(x) })), signed: true,
      xLabel: '自国平均との差（cm）', unit: 'cm',
      note: '自国平均はNCD-RisCの出生年別の推定値（1996年生まれまで。それ以降は1996年の値）。',
    }),
    'height-discipline': () => dotRows({
      id: 'fig-discipline',
      title: '種目別の身長',
      subtitle: '表彰台の回数が多い種目で分類。帯は中央の50%、縦線は中央値',
      series: [{ cls: 's-1', label: '男子' }, { cls: 's-2', label: '女子' }],
      rows: ['male', 'female'].flatMap((sex) => [['boulder', 'ボルダー'], ['lead', 'リード'], ['speed', 'スピード']].map(([d, name]) => {
        const list = (d === 'speed' ? bySex(speed, sex) : bySex(climbing, sex).filter((a) => a.discipline === d)).filter((a) => a.height);
        const vals = list.map((a) => a.height);
        return { label: `${name}・${SEX[sex].label}`, cls: SEX[sex].cls, values: list.map((a) => ({ v: a.height, tip: tipOf(a, `${a.height}cm`) })), mean: mean(vals), median: median(vals), q1: quantile(vals, 0.25), q3: quantile(vals, 0.75) };
      })),
      domain: [148, 194], ticks: heightTicks, xLabel: '身長（cm）', unit: 'cm',
      note: 'ボルダーとリードの表彰台が同数の選手は、どちらにも含めていません。',
    }),
    'height-success': () => scatter({
      id: 'fig-success',
      title: '身長と表彰台の回数',
      subtitle: '1つの点が1人。右上ほど背が高く、表彰台が多い',
      series: [{ cls: 's-1', label: '男子' }, { cls: 's-2', label: '女子' }],
      points: climbing.filter((a) => a.height).map((a) => ({ x: a.height, y: a.podium_total, cls: SEX[a.sex].cls, tip: tipOf(a, `${a.height}cm・表彰台${a.podium_total}回（優勝${a.win_total}回）`), a })),
      xDomain: [148, 192], yDomain: [0, Math.ceil(Math.max(...climbing.map((a) => a.podium_total)) / 10) * 10],
      xTicks: heightTicks, yTicks: [0, 20, 40, 60, 80, 100].filter((t) => t <= Math.ceil(Math.max(...climbing.map((a) => a.podium_total)) / 10) * 10).map((t) => ({ value: t })),
      xLabel: '身長（cm）', yLabel: '表彰台（回）',
      tableHead: ['選手', '国', '性別', '身長 cm', '表彰台', '優勝'],
      tableRow: (p) => [p.a.name_ja ?? p.a.name, p.a.country, SEX[p.a.sex].label, String(p.a.height), String(p.a.podium_total), String(p.a.win_total)],
      note: `表彰台の回数は${data.meta.population.replace('で1回以上3位以内に入った選手', '')}の合計。`,
    }),
    'bmi-scatter': () => {
      const pts = climbing.filter((a) => a.weight_ok);
      const curve = (b) => ({ label: `BMI ${b}`, points: Array.from({ length: 50 }, (_, i) => { const h = 148 + i; return [h, b * (h / 100) ** 2]; }) });
      return scatter({
        id: 'fig-bmi',
        title: '身長と体重',
        subtitle: `体重が分かる表彰台経験者 ${pts.length}人。細い線は同じBMIを結んだ線`,
        series: [{ cls: 's-1', label: '男子' }, { cls: 's-2', label: '女子' }],
        points: pts.map((a) => ({ x: a.dr_height, y: a.dr_weight, cls: SEX[a.sex].cls, tip: tipOf(a, `${a.dr_height}cm・${a.dr_weight}kg`), a })),
        xDomain: [148, 192], yDomain: [38, 84],
        xTicks: heightTicks, yTicks: [40, 50, 60, 70, 80].map((t) => ({ value: t })),
        xLabel: '身長（cm）', yLabel: '体重（kg）',
        curves: [18.5, 20, 22, 25].map(curve),
        tableHead: ['選手', '国', '性別', '身長 cm', '体重 kg'],
        tableRow: (p) => [p.a.name_ja ?? p.a.name, p.a.country, SEX[p.a.sex].label, String(p.a.dr_height), String(p.a.dr_weight)],
        note: '身長・体重はどちらもDigitalRockに選手が登録した値（登録時期は不明）。IFSCの身長と2cmを超えて食い違う選手と、DigitalRockへの最後の出場が18歳未満だった選手は除いています。',
      });
    },
    'bmi-compare': () => dotCompare({
      id: 'fig-bmi-compare',
      title: 'BMIの比較',
      subtitle: '点は中央値または平均。帯は中央の50%（データがある場合）',
      rows: [
        { label: 'トップ選手・男子', sub: `中央値・${v.bmi.male.n}人`, value: v.bmi.male.median, range: [v.bmi.male.q1, v.bmi.male.q3], cls: 's-1' },
        { label: '研究のエリート男子', sub: `${research.filter((g) => g.sex === 'male').length}研究群の平均の中央値`, value: v.research.male.median, range: [v.research.male.min, v.research.male.max], cls: 's-0' },
        { label: '日本の18〜29歳男性', sub: '平均', value: ref.japan.male.bmi, cls: 's-0' },
        { label: 'トップ選手・女子', sub: `中央値・${v.bmi.female.n}人`, value: v.bmi.female.median, range: [v.bmi.female.q1, v.bmi.female.q3], cls: 's-2' },
        { label: '研究のエリート女子', sub: `${research.filter((g) => g.sex === 'female').length}研究群の平均`, value: v.research.female.median, range: [v.research.female.min, v.research.female.max], cls: 's-0' },
        { label: '日本の18〜29歳女性', sub: '平均', value: ref.japan.female.bmi, cls: 's-0' },
      ],
      domain: [17, 24], ticks: [17, 18.5, 20, 22, 24].map((x) => ({ value: x, label: String(x) })), xLabel: 'BMI（kg/m²）', unit: '',
      note: '研究のエリート群は、系統的レビュー（Ginszt et al. 2023）の表から成人の上級〜エリート群を抜き出したもの。帯は研究群の最小〜最大。',
    }),
    'ideal-table': () => {
      const inRange = (sex, cm) => cm >= Math.floor(v.height[sex].min / 5) * 5 && cm <= v.height[sex].max;
      const cell = (sex, row) => (inRange(sex, row.cm) ? `${row[sex][0]}〜${row[sex][1]}kg` : '—');
      return `<div class="table-wrap"><table><caption>トップ選手のBMI（中央の50%：男子${v.bmi.male.q1}〜${v.bmi.male.q3}、女子${v.bmi.female.q1}〜${v.bmi.female.q3}）を身長に当てはめた体重</caption><thead><tr><th>身長</th><th class="num">男子</th><th class="num">女子</th></tr></thead><tbody>${v.ideal.table.map((row) => `<tr><td>${row.cm}cm</td><td class="num">${cell('male', row)}</td><td class="num">${cell('female', row)}</td></tr>`).join('')}</tbody></table></div>`;
    },
    'ape-index': () => dotRows({
      id: 'fig-ape',
      title: 'リーチ（両腕を広げた長さ）と身長の差',
      subtitle: `IFSCにリーチを登録している表彰台経験者 ${v.ape.all.n}人。0より右はリーチが身長より長い`,
      series: [{ cls: 's-1', label: '男子' }, { cls: 's-2', label: '女子' }],
      rows: ['male', 'female'].map((sex) => {
        const list = bySex(climbing, sex).filter((a) => a.ape !== null);
        const vals = list.map((a) => a.ape);
        return { label: SEX[sex].label, cls: SEX[sex].cls, values: list.map((a) => ({ v: a.ape, tip: tipOf(a, `身長${a.height}cm・リーチ${a.arm_span}cm（差 ${signedLabel(a.ape)}cm）`) })), mean: mean(vals), median: vals.length ? median(vals) : null, q1: vals.length >= 4 ? quantile(vals, 0.25) : null, q3: vals.length >= 4 ? quantile(vals, 0.75) : null };
      }),
      domain: [-11, 16], ticks: [-10, -5, 0, 5, 10, 15].map((x) => ({ value: x, label: signedLabel(x) })), xLabel: 'リーチ − 身長（cm）', unit: 'cm', signed: true,
      note: 'リーチの登録は任意のため、人数が少なく偏りがある可能性があります。',
    }),
  };

  const highlights = [
    { label: '男子の平均身長', value: v.height.male.mean.toFixed(1), unit: 'cm' },
    { label: '女子の平均身長', value: v.height.female.mean.toFixed(1), unit: 'cm' },
    { label: 'BMIの中央値（男子／女子）', value: `${v.bmi.male.median?.toFixed(1) ?? '—'}／${v.bmi.female.median?.toFixed(1) ?? '—'}`, unit: '' },
  ];

  const pageCounts = [
    { label: '表彰台経験者', value: String(athletes.length), unit: '人' },
    { label: '身長が分かる選手', value: String(athletes.filter((a) => a.height).length), unit: '人' },
    { label: 'リーチが分かる選手', value: String(athletes.filter((a) => a.arm_span).length), unit: '人' },
    { label: '体重が分かる選手', value: String(athletes.filter((a) => a.weight_ok).length), unit: '人' },
  ];

  const evidenceRows = (ev) => {
    const names = new Map(ev.athletes.map((a) => [a.id, a]));
    const srcs = new Map(ev.sources.map((s) => [s.id, s]));
    const label = { height: '身長', weight: '体重', wingspan: 'リーチ' };
    return ev.measurements.filter((m) => label[m.metric] && m.status !== 'derived').map((m) => ({
      name: names.get(m.athlete_id)?.name ?? m.athlete_id, latin: names.get(m.athlete_id)?.latin ?? '',
      metric: label[m.metric], value: `${m.display_value ?? m.value}${m.unit}`, context: m.context ?? '', url: srcs.get(m.source_id)?.url, kind: srcs.get(m.source_id)?.kind ?? '出典',
    }));
  };

  const sources = [
    { id: 'ifsc-results', title: 'IFSC Results（大会結果・選手プロフィール）', url: 'https://ifsc.results.info/', kind: '競技団体', checked: data.meta.retrieved_at },
    { id: 'digitalrock', title: 'DigitalRock（IFSCの旧結果サービス、選手登録情報）', url: 'https://www.digitalrock.de/', kind: '競技結果サービス', checked: data.meta.retrieved_at },
    { id: 'ncd-risc-height', title: nat.source.title, url: `https://doi.org/${nat.source.doi}`, kind: '査読付き論文・データ', checked: nat.source.retrieved_at },
    { id: 'mhlw-nhns', title: ref.japan.title, url: ref.japan.url, kind: '公的統計', checked: ref.japan.retrieved_at },
    { id: 'ginszt-2023', title: ref.research_groups.title, url: ref.research_groups.url, kind: '系統的レビュー', checked: ref.research_groups.retrieved_at },
  ];

  return { values: v, figures, highlights, athleteRows: athletes, pageCounts, evidenceRows, sources, research };
}
