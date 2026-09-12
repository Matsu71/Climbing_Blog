import {esc as e} from './core.mjs';
import {performanceLabel,researchRows,validateMeasurements} from './research-model.mjs';
const unique=xs=>[...new Set(xs)];
export function renderResearchIndex(studies,h){
  const {heading,note,filterForm,link,tag}=h;
  const abstracts=studies.filter(s=>s.access_level==='抄録のみ').length;
  return heading('THE EVIDENCE DESK','「効く」の先に、何を測った？','指の力、登れた課題、怪我の予防。同じ「効果」という言葉を、同じ結果だと思わないために。')+
    `<div class="coverage-strip"><span><b>${studies.length}</b>研究の収録</span><span><b>${studies.filter(s=>s.performance_test===true).length}</b>登攀課題の実測あり</span><span><b>${abstracts}</b>抄録のみ</span></div>`+
    note('選定した研究の比較です。網羅的レビュー・専門家監修ではありません。','対象者・測定・期間が違うため、効果の大きさで研究やトレーニング方法をランキングしません。研究の設定をそのまま自分の練習量にしないでください。')+
    `<nav class="research-shortcuts" aria-label="研究を読む入口">${link('research/?compare=hang-10wk,dynamic-2024','保持力と完登成績の違いを比べる →')}${link('research/hang-10wk/#measurements','平均とばらつきを動かして見る →')}${link('read/reading-research/','研究の読み方から始める →')}</nav>`+
    filterForm([['theme','テーマ',unique(studies.map(s=>s.theme))],['design','研究の比べ方',unique(studies.map(s=>s.design_family))],['performance','登攀課題の実測',unique(studies.map(performanceLabel))],['access','確認範囲',unique(studies.map(s=>s.access_level))]])+
    `<section data-research-comparison id="research-comparison" class="research-comparison js-only" tabindex="-1" aria-label="選択した研究の比較" hidden></section>
    <div class="study-list research-list" data-results>${studies.map(s=>`<article class="card study" id="study-${e(s.id)}" data-item data-search="${e([s.title,s.design,s.protocol,s.finding,s.limit,s.participants,...s.outcomes].join(' '))}" data-theme="${e(s.theme)}" data-design="${e(s.design_family)}" data-performance="${e(performanceLabel(s))}" data-access="${e(s.access_level)}">
      <div class="study-year">${s.year}<span>${e(s.theme)}</span></div><div><div class="study-badges">${tag(s.design_family)}${tag(s.access_level)}</div><h2>${link('research/'+s.id+'/',e(s.title))}</h2><p class="study-question">${e(s.finding)}</p>
      <dl class="study-summary"><div><dt>対象・期間</dt><dd>${e(s.participants)} / ${e(s.duration)}</dd></div><div><dt>測定したもの</dt><dd>${e(s.outcomes.join(' / '))}</dd></div><div><dt>限界</dt><dd>${e(s.limit)}</dd></div></dl>
      <div class="inline-actions">${link('research/'+s.id+'/','方法・根拠まで読む →')}${link('read/'+s.article+'/','日本語の解説 →')}</div>
      <label class="compare-pick js-only"><input type="checkbox" data-research-compare="${e(s.id)}"> <span>この研究を比較に追加</span></label></div></article>`).join('')}</div>
    <div class="research-dock js-only" data-research-dock hidden><span data-research-count></span><button type="button" class="button" data-research-show>比較を見る</button><button type="button" class="button ghost" data-research-clear>解除</button></div>`;
}
function metricFigure(metric){
  const pct=n=>(n/metric.axis_max*100).toFixed(4);
  return `<section data-measurement-panel="${e(metric.id)}"><h3>${e(metric.label)}</h3><p class="micro">軸は0〜${metric.axis_max} ${e(metric.unit)}。棒は平均、横線は平均±標準偏差です。</p><div class="measurement-chart" aria-hidden="true">${metric.groups.flatMap(g=>['pre','post'].map(phase=>`<div class="measurement-row"><div>${e(g.name)}<small>${phase==='pre'?'介入前':'介入後'}</small></div><div class="measurement-track"><span class="measurement-bar ${phase}" style="width:${pct(g[phase])}%"></span><span class="measurement-spread" style="left:${pct(Math.max(0,g[phase]-g[phase+'_sd']))}%;width:${pct(g[phase]+g[phase+'_sd']-Math.max(0,g[phase]-g[phase+'_sd']))}%"></span><i style="left:${pct(g[phase])}%"></i></div></div>`)).join('')}<div class="measurement-axis"><span>0</span><span>${metric.axis_max} ${e(metric.unit)}</span></div></div>
      <div class="table-scroll" role="region" aria-label="${e(metric.label)}の元数値" tabindex="0"><table class="measurement-table"><caption>${e(metric.label)}：平均±標準偏差（人数は各群の人数）</caption><thead><tr><th scope="col">群</th><th scope="col">人数</th><th scope="col">介入前（${e(metric.unit)}）</th><th scope="col">介入後（${e(metric.unit)}）</th></tr></thead><tbody>${metric.groups.map(g=>`<tr><th scope="row">${e(g.name)}</th><td>${g.n}</td><td>${g.pre.toFixed(1)} ± ${g.pre_sd.toFixed(1)}</td><td>${g.post.toFixed(1)} ± ${g.post_sd.toFixed(1)}</td></tr>`).join('')}</tbody></table></div><p class="inference-note">${e(metric.inference)}</p></section>`;
}
export function renderMeasurements(data,h){
  validateMeasurements(data);
  return `<section id="measurements" class="measurements"><p class="eyebrow">READ THE NUMBERS</p><h2>平均の変化と、個人差を分けて見る。</h2><p>同じ研究の異なる測定項目です。別の研究の効果量を混ぜていません。横線は95%信頼区間ではなく、対象者間のばらつきを表す<strong>標準偏差（SD）</strong>です。</p>
    <label class="metric-select js-only">表示する測定項目<select data-measurement-select>${data.metrics.map(m=>`<option value="${e(m.id)}">${e(m.label)}</option>`).join('')}</select></label>
    ${data.metrics.map(metricFigure).join('')}
    <p class="micro">出典：Hermans et al.（2022）, Table 3。数値からCRUXが再描画。原論文：CC BY。個別の到達目標・グレード換算には使いません。</p>
    <p>${h.link('data/research-measurements.csv','表示した数値をCSVで確認 →')}</p></section>`;
}
export function renderResearchDetail(study,studies,measurements,h){
  const {heading,note,facts,link,references}=h;
  const related=studies.filter(s=>s.id!==study.id&&(s.theme===study.theme||s.performance_test===true)).slice(0,3);
  return `<div class="breadcrumbs">${link('research/','研究一覧')} <span>/ ${study.year}</span></div>`+
    heading('STUDY / METHODS & LIMITS',study.title,study.design+' / '+study.year)+
    `<div class="answer"><span>この研究で分かった範囲</span><p>${e(study.finding)}</p></div>`+
    note('ここまでは言えません',study.limit)+
    `<div class="research-detail"><section><h2>誰に、何を、どの条件で。</h2>${facts([['対象',study.participants],['人数の段階',study.sample_stage],['期間',study.duration],['方法',study.protocol],['測定したもの',study.outcomes.join(' / ')],['登攀課題の実測',performanceLabel(study)],['確認範囲',study.access_level],['原文の確認箇所',study.source_locator]])}
      ${study.not_measured.length?`<div class="not-measured"><h3>この結果から直接答えられないこと</h3><ul>${study.not_measured.map(t=>`<li>${e(t)}</li>`).join('')}</ul></div>`:''}
      ${study.id===measurements.study_id?renderMeasurements(measurements,h):''}
      ${study.takeaways?.length?`<section><h2>自分の登りへ持ち帰る前に。</h2>${study.takeaways.map(t=>`<p>${e(t)}</p>`).join('')}<p class="micro">上記は結果の読み方についての編集上の整理です。個人への運動・治療の処方ではありません。</p></section>`:''}
      ${references(study.sources)}</section><aside class="research-aside"><h2>読んだ先へ。</h2>${link('read/'+study.article+'/','問いから読む日本語の解説 →','button')}
      <p>${link('research/?compare='+study.id,'他の研究と比べる →')}</p><h3>比較すると見える違い</h3>${related.map(s=>`<p>${link('research/'+s.id+'/',e(s.title))}</p>`).join('')}
      ${note('研究への選定基準と限界','公開の一次資料を、対象・方法・結果・限界の単位で編集しています。文献検索は選択的で、収録数を根拠の強さに換算しません。専門家の監修は未実施です。')}</aside></div>`;
}
export function renderResearchComparison(selected,studies,base){
  const rows=selected.map(id=>studies.find(s=>s.id===id)).filter(Boolean);
  if(!rows.length)return '';
  const fields=researchRows(rows[0]);
  return `<div class="section-head"><div><p class="eyebrow">COMPARE THE QUESTION, NOT A SCORE</p><h2>同じ「効果」を比べていますか。</h2></div><button class="button ghost" type="button" data-research-share>比較リンクをコピー</button></div><p>${rows.length===1?'あと1〜2件を追加すると、対象と測定の違いを比較できます。':'対象・方法・測定条件が違います。人数を合算したり、有意差の有無で順位を付けたりしません。'}</p>
    <div class="table-scroll" role="region" tabindex="0" aria-label="選択した研究の比較表"><table class="research-comparison-table"><caption>選定した${rows.length}研究の記述的比較（メタ解析ではありません）</caption><thead><tr><th scope="col">比較項目</th>${rows.map(s=>`<th scope="col"><a href="${e(base+'research/'+s.id+'/')}">${e(s.title)}</a><button type="button" data-research-remove="${e(s.id)}" aria-label="${e(s.title)}を比較から外す">比較から外す</button></th>`).join('')}</tr></thead><tbody>${fields.map(([label],i)=>`<tr><th scope="row">${e(label)}</th>${rows.map(s=>`<td>${e(researchRows(s)[i][1])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
