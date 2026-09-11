import test from 'node:test';
import assert from 'node:assert/strict';
import {studies,sources} from '../data/catalog.mjs';
import {articles} from '../data/articles.mjs';
import {extraStudies,researchMeasurements,researchSources} from '../data/research-extra.mjs';
import {researchSelection,performanceLabel,researchRows,measurementRows,validateMeasurements} from '../src/research-model.mjs';
import {renderResearchComparison} from '../src/research-render.mjs';
import {render,configureBase} from '../src/render.mjs';
test('new research records resolve to primary papers, a verified sample stage and an actual article',()=>{
  assert.equal(extraStudies.length,6);
  for(const s of studies){
    assert.ok(s.access_level&&s.duration&&s.sample_stage&&s.source_locator&&s.design_family,s.id);
    assert.ok(s.sample_n===null||Number.isInteger(s.sample_n)&&s.sample_n>0,s.id);
    assert.ok([true,false,null].includes(s.performance_test),s.id);
    assert.ok(s.outcomes.length,s.id);
    assert.ok(articles.some(a=>a.id===s.article));
    assert.ok(s.sources.every(id=>sources.some(source=>source.id===id)));
  }
  for(const source of researchSources){assert.ok(source.doi&&source.url.includes(source.doi));assert.equal(source.access,'公開本文の方法・結果・限界を確認');}
});
test('randomization, final analysis, crossover and non-intervention counts stay distinct',()=>{
  const by=id=>studies.find(s=>s.id===id);
  assert.equal(by('dynamic-2024').sample_n,31);assert.ok(by('dynamic-2024').participants.includes('37'));
  assert.equal(by('finger-extensors').sample_n,52);assert.ok(by('finger-extensors').participants.includes('78'));
  assert.equal(by('compression-sleeves').sample_n,24);assert.equal(by('compression-sleeves').design_family,'同じ人で条件を比較');
  assert.equal(by('fatigue-2026').design_family,'対照のない前後比較');
  assert.equal(by('tape').sample_n,null);assert.equal(by('grade').sample_n,null);
});
test('surrogate outcomes are not silently converted into sends or injury-prevention evidence',()=>{
  assert.deepEqual(studies.filter(s=>s.performance_test===true).map(s=>s.id),['dynamic-2024','compression-sleeves']);
  assert.equal(performanceLabel({performance_test:null}),'未分類・文献／記録解析');
  assert.equal(performanceLabel({performance_test:false}),'登攀課題の効果は未測定');
  const ext=studies.find(s=>s.id==='finger-extensors');assert.ok(ext.not_measured.includes('怪我の発生率'));
  assert.ok(studies.find(s=>s.id==='dynamic-2024').limit.includes('0.075'));
});
test('comparison IDs are bounded, deduplicated and validated without accepting arbitrary URLs',()=>{
  assert.deepEqual(researchSelection(null,studies),[]);
  assert.deepEqual(researchSelection('hang,hang,javascript:x,<img>,hang-10wk,body,tape',studies),['hang','hang-10wk','body']);
  assert.deepEqual(researchSelection('x'.repeat(501)+',hang',studies),[]);
  for(const s of studies){const rows=researchRows(s);assert.equal(rows.length,11);assert.ok(rows.every(r=>r.every(x=>typeof x==='string')));}
});
test('selected numerical outcomes preserve their source values, denominators, SD and units',()=>{
  assert.equal(validateMeasurements(researchMeasurements),researchMeasurements);
  const rows=measurementRows(researchMeasurements);assert.equal(rows.length,12);
  assert.ok(rows.every(r=>r.source_locator==='Table 3; Results'&&r.source_id==='hang-10wk'));
  assert.deepEqual(rows.find(r=>r.outcome==='23mmエッジの最大力'&&r.group==='ハングボード群'&&r.phase==='介入後'),{study_id:'hang-10wk',source_id:'hang-10wk',source_locator:'Table 3; Results',outcome:'23mmエッジの最大力',unit:'N',group:'ハングボード群',n:18,phase:'介入後',mean:515.3,standard_deviation:167.5});
  assert.ok(researchMeasurements.metrics.find(m=>m.id==='hangtime').inference.includes('0.303'));
});
test('numerical display rejects nonfinite, impossible, duplicate or off-axis values',()=>{
  for(const mutate of [d=>d.metrics[0].groups[0].pre=NaN,d=>d.metrics[0].groups[0].pre_sd=-1,d=>d.metrics[0].groups[0].n=1.5,d=>d.metrics[0].axis_max=1,d=>d.metrics[1].id=d.metrics[0].id,d=>d.metrics[0].id='"><img>',d=>d.metrics[0].groups=[]]){
    const data=structuredClone(researchMeasurements);mutate(data);assert.throws(()=>validateMeasurements(data),RangeError);
  }
});
test('all research details and plots are real static content with safe comparison HTML',()=>{
  for(const s of studies){const html=render('research',s.id);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(html.includes(s.source_locator));assert.ok(!html.includes('undefined'));}
  const html=render('research','hang-10wk');assert.ok(html.includes('標準偏差（SD）'));assert.ok(html.includes('95%信頼区間ではなく'));assert.ok(html.includes('515.3 ± 167.5'));assert.ok(html.includes('research-measurements.csv'));
  const malicious={...studies[0],title:'<img src=x onerror=alert(1)>'};const comparison=renderResearchComparison([malicious.id],[malicious],'/');assert.ok(!comparison.includes('<img'));assert.ok(comparison.includes('&lt;img'));assert.ok(comparison.includes('メタ解析ではありません'));
  assert.equal(renderResearchComparison([],studies,'/'),'');
  configureBase('/');assert.ok(render('research','hang-10wk').includes('href="/research/"'));configureBase('/Climbing_Blog/');
});
test('explanations link to their study details and no longer describe gyms as five same-chain facilities',()=>{
  for(const a of articles.filter(a=>a.study_ids)){
    assert.ok(a.study_ids.every(id=>studies.some(s=>s.id===id)));
    const html=render('read',a.id);for(const id of a.study_ids)assert.ok(html.includes('research/'+id+'/'));
  }
  assert.ok(!render('read','choose-gym').includes('5施設は同一チェーン'));
});
