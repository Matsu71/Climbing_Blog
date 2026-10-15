// Responsive HTML charts. Marks are positioned in percentages inside a plot area,
// so text keeps its real size on phones and nothing depends on JavaScript.
// Gridlines and curves use an SVG layer with non-scaling strokes.
// Colors come from CSS classes (.s-1, .s-2, .s-3) defined in assets/site.css.
import { escapeHtml as e } from './markdown.mjs';
import { round } from './stats.mjs';

const pct = (v) => `${(Math.round(v * 1000) / 1000).toFixed(3).replace(/\.?0+$/, '')}%`;
const scale = ([d0, d1]) => (v) => ((v - d0) / (d1 - d0)) * 100;
const fmt = (v, digits = 0, signed = false) => {
  if (v === null || v === undefined) return '—';
  const text = round(Number(v), digits).toFixed(digits);
  return (signed && Number(v) > 0 ? '+' : '') + text.replace(/^-/, '−');
};

function legend(series) {
  if (!series || series.length < 2) return '';
  return `<ul class="chart-legend">${series.map((s) => `<li><span class="key ${s.cls}" aria-hidden="true"></span>${e(s.label)}</li>`).join('')}</ul>`;
}

function table(caption, head, rows) {
  return `<details class="chart-table"><summary>数値を表で見る</summary><div class="table-wrap"><table><caption>${e(caption)}</caption><thead><tr>${head.map((h) => `<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}

function frame({ id, title, subtitle, series, body, note, tableHtml }) {
  return `<figure class="chart" id="${e(id)}"><figcaption><span class="chart-title">${e(title)}</span>${subtitle ? `<span class="chart-subtitle">${e(subtitle)}</span>` : ''}</figcaption>${legend(series)}${body}${note ? `<p class="chart-note">${note}</p>` : ''}${tableHtml ?? ''}</figure>`;
}

function grid({ xTicks = [], yTicks = [], x, y }) {
  const lines = [
    ...yTicks.map((t) => `<line x1="0" x2="100" y1="${100 - y(t.value)}" y2="${100 - y(t.value)}"/>`),
    ...xTicks.filter((t) => t.line).map((t) => `<line x1="${x(t.value)}" x2="${x(t.value)}" y1="0" y2="100"/>`),
  ].join('');
  return `<svg class="grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">${lines}</svg>`;
}

function axes({ xTicks = [], yTicks = [], x, y, xLabel, yLabel }) {
  const xs = xTicks.map((t) => `<span class="tick-x" style="left:${pct(x(t.value))}">${e(t.label ?? t.value)}</span>`).join('');
  const ys = yTicks.map((t) => `<span class="tick-y" style="top:${pct(100 - y(t.value))}">${e(t.label ?? t.value)}</span>`).join('');
  return `${xs}${ys}${xLabel ? `<span class="axis-label-x">${e(xLabel)}</span>` : ''}${yLabel ? `<span class="axis-label-y">${e(yLabel)}</span>` : ''}`;
}

// Labels sit on the side of the line with more room unless the caller fixes the side.
function refLine({ value, label, x, align }) {
  align = align ?? (x(value) < 40 ? 'right' : 'left');
  return `<span class="ref-line" style="left:${pct(x(value))}"></span><span class="ref-label ref-${align}" style="left:${pct(x(value))}">${e(label)}</span>`;
}

// Histogram panels that share one x scale (for example men above women).
export function histogram({ id, title, subtitle, panels, bin, xTicks, xLabel, yLabel = null, note, unit = '' }) {
  const domain = [bin.start, bin.end];
  const x = scale(domain);
  const edges = [];
  for (let v = bin.start; v < bin.end - 1e-9; v += bin.width) edges.push(v);
  const counted = panels.map((p) => {
    const counts = edges.map((lo) => p.values.filter((v) => v >= lo && v < lo + bin.width).length);
    const outside = p.values.filter((v) => v < bin.start || v >= bin.end).length;
    if (outside) throw new Error(`${id}: ${outside} values fall outside the histogram range`);
    return { ...p, counts };
  });
  const maxCount = Math.max(...counted.flatMap((p) => p.counts));
  const yMax = Math.max(4, Math.ceil(maxCount / 4) * 4);
  const y = scale([0, yMax]);
  const yTicks = [0, yMax / 2, yMax].map((v) => ({ value: v }));
  const body = counted.map((p, i) => {
    const bars = p.counts.map((c, k) => {
      if (!c) return '';
      const lo = edges[k];
      const tip = `${p.label}：${lo}〜${lo + bin.width}${unit}未満　${c}人`;
      return `<span class="bar ${p.cls}" style="left:${pct(x(lo))};width:${pct(x(lo + bin.width) - x(lo))};height:${pct(y(c))}" data-tip="${e(tip)}"></span>`;
    }).join('');
    const refs = (p.refs ?? []).map((r) => refLine({ ...r, x })).join('');
    const last = i === counted.length - 1;
    return `<div class="plot plot-hist${last ? '' : ' no-x'}"><span class="panel-label">${e(p.label)}${p.n !== false ? `（${p.values.length}人）` : ''}</span><div class="plot-area">${grid({ yTicks, x, y })}${bars}${refs}${axes({ xTicks: last ? xTicks : [], yTicks, x, y, xLabel: last ? xLabel : null, yLabel: i === 0 ? yLabel : null })}</div></div>`;
  }).join('');
  const rows = edges.map((lo, k) => [`${lo}〜${lo + bin.width}${unit}未満`, ...counted.map((p) => String(p.counts[k]))]);
  return frame({
    id, title, subtitle, note,
    series: counted.map((p) => ({ cls: p.cls, label: p.label })),
    body: `<div class="plot-stack">${body}</div>`,
    tableHtml: table(title, ['区間', ...counted.map((p) => p.label)], rows),
  });
}

// Scatter plot with optional reference curves (for example BMI lines on height × weight).
export function scatter({ id, title, subtitle, series, points, xDomain, yDomain, xTicks, yTicks, xLabel, yLabel, curves = [], note, tableHead, tableRow }) {
  const x = scale(xDomain), y = scale(yDomain);
  const inside = (p) => p.x >= xDomain[0] && p.x <= xDomain[1] && p.y >= yDomain[0] && p.y <= yDomain[1];
  const outside = points.filter((p) => !inside(p));
  if (outside.length) throw new Error(`${id}: ${outside.length} points fall outside the plot domain`);
  const curveSvg = curves.map((c) => `<polyline points="${c.points.filter(([px, py]) => px >= xDomain[0] && px <= xDomain[1] && py >= yDomain[0] && py <= yDomain[1]).map(([px, py]) => `${x(px)},${100 - y(py)}`).join(' ')}"/>`).join('');
  const curveLabels = curves.map((c) => {
    const visible = c.points.filter(([px, py]) => px >= xDomain[0] && px <= xDomain[1] && py >= yDomain[0] && py <= yDomain[1]);
    const [lx, ly] = visible.at(-1);
    return `<span class="curve-label" style="left:${pct(x(lx))};top:${pct(100 - y(ly))}">${e(c.label)}</span>`;
  }).join('');
  const dots = points.map((p) => `<span class="dot ${p.cls}" style="left:${pct(x(p.x))};top:${pct(100 - y(p.y))}" data-tip="${e(p.tip)}"></span>`).join('');
  const body = `<div class="plot plot-scatter"><div class="plot-area" data-nearest>${grid({ xTicks: xTicks.map((t) => ({ ...t, line: true })), yTicks, x, y })}<svg class="curves" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">${curveSvg}</svg>${curveLabels}${dots}${axes({ xTicks, yTicks, x, y, xLabel, yLabel })}</div></div>`;
  return frame({
    id, title, subtitle, series, note, body,
    tableHtml: table(title, tableHead, points.map(tableRow)),
  });
}

// One row per group: each value is a dot; the row also shows the median and the middle 50 %.
export function dotRows({ id, title, subtitle, rows, domain, ticks, xLabel, note, unit = '', series, signed = false }) {
  const x = scale(domain);
  const outside = rows.flatMap((r) => r.values).filter((d) => d.v < domain[0] || d.v > domain[1]);
  if (outside.length) throw new Error(`${id}: ${outside.length} values fall outside the axis range`);
  const body = rows.map((r) => {
    const sorted = [...r.values].sort((a, b) => a.v - b.v);
    const dots = sorted.map((d, i) => `<span class="dot dot-small ${r.cls}" style="left:${pct(x(d.v))};top:${pct(25 + ((i * 37) % 50))}" data-tip="${e(d.tip)}"></span>`).join('');
    const iqr = r.q1 !== null && r.q1 !== undefined ? `<span class="iqr" style="left:${pct(x(r.q1))};width:${pct(x(r.q3) - x(r.q1))}"></span><span class="median" style="left:${pct(x(r.median))}" data-tip="${e(`${r.label}：中央値 ${fmt(r.median, 1, signed)}${unit}`)}"></span>` : '';
    return `<div class="dotrow"><span class="dotrow-label">${e(r.label)}<small>${r.values.length}人・中央値 ${fmt(r.median, 1, signed)}${e(unit)}</small></span><div class="dotrow-area" data-nearest>${grid({ xTicks: ticks.map((t) => ({ ...t, line: true })), x, y: () => 0 })}${iqr}${dots}</div></div>`;
  }).join('');
  const axis = `<div class="dotrow dotrow-axis"><span class="dotrow-label"></span><div class="dotrow-area">${ticks.map((t) => `<span class="tick-x" style="left:${pct(x(t.value))}">${e(t.label ?? t.value)}</span>`).join('')}${xLabel ? `<span class="axis-label-x">${e(xLabel)}</span>` : ''}</div></div>`;
  return frame({
    id, title, subtitle, note, series,
    body: `<div class="dotrows">${body}${axis}</div>`,
    tableHtml: table(title, ['グループ', '人数', '平均', '中央値', '25%点', '75%点'], rows.map((r) => [r.label, String(r.values.length), fmt(r.mean, 1, signed), fmt(r.median, 1, signed), fmt(r.q1, 1, signed), fmt(r.q3, 1, signed)])),
  });
}

// Cleveland dot plot: one labelled value per row, for comparing averages with references.
export function dotCompare({ id, title, subtitle, rows, domain, ticks, xLabel, note, unit = '', digits = 1 }) {
  const x = scale(domain);
  const outside = rows.filter((r) => [r.value, ...(r.range ?? [])].some((v) => v < domain[0] || v > domain[1]));
  if (outside.length) throw new Error(`${id}: ${outside.length} rows fall outside the axis range`);
  const body = rows.map((r) => `<div class="dotrow dotrow-compare"><span class="dotrow-label">${e(r.label)}${r.sub ? `<small>${e(r.sub)}</small>` : ''}</span><div class="dotrow-area">${grid({ xTicks: ticks.map((t) => ({ ...t, line: true })), x, y: () => 0 })}${r.range ? `<span class="range" style="left:${pct(x(r.range[0]))};width:${pct(x(r.range[1]) - x(r.range[0]))}"></span>` : ''}<span class="dot ${r.cls}" style="left:${pct(x(r.value))};top:50%" data-tip="${e(`${r.label}：${fmt(r.value, digits)}${unit}`)}"></span><span class="value-label" style="left:${pct(x(r.value))}">${fmt(r.value, digits)}</span></div></div>`).join('');
  const axis = `<div class="dotrow dotrow-axis"><span class="dotrow-label"></span><div class="dotrow-area">${ticks.map((t) => `<span class="tick-x" style="left:${pct(x(t.value))}">${e(t.label ?? t.value)}</span>`).join('')}${xLabel ? `<span class="axis-label-x">${e(xLabel)}</span>` : ''}</div></div>`;
  return frame({
    id, title, subtitle, note,
    body: `<div class="dotrows">${body}${axis}</div>`,
    tableHtml: table(title, ['項目', '値', '範囲・補足'], rows.map((r) => [r.label, `${fmt(r.value, digits)}${unit}`, r.range ? `${fmt(r.range[0], digits)}〜${fmt(r.range[1], digits)}${unit}` : (r.sub ?? '')])),
  });
}
