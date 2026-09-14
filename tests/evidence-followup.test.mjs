import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evidence as db} from '../data/evidence.mjs';
import {evidence as initial} from '../data/evidence-initial.mjs';
import {batch} from '../data/evidence-additions.mjs';
import {expansion} from '../data/evidence-expansion.mjs';
import {followup} from '../data/evidence-followup.mjs';
import {prepareEvidenceExport,evidenceCSVRows} from '../data/evidence-export.mjs';
import {renderEvidence} from '../src/evidence-render.mjs';
import {csv} from '../src/core.mjs';
const by=(rows,id)=>rows.find(r=>r.id===id);
test('batch 4 totals and original sources are preserved without counting full-text review as a new study',()=>{
 assert.deepEqual([followup.sources.length,followup.athletes.length,followup.measurements.length,followup.ascents.length,followup.clinical.length,followup.revisions.length],[9,5,10,15,2,1]);
 for(const key of ['sources','athletes','measurements','ascents']){
  const old=[...initial[key],...batch[key],...expansion[key]];assert.deepEqual(db[key].slice(0,old.length),old);
 }
 const oldClinical=[...initial.clinical,...batch.clinical,...expansion.clinical];
 for(const old of oldClinical){
  const history=db.revision_history.filter(r=>r.record_id===old.id);
  assert.deepEqual(history.length?history[0].before:by(db.clinical,old.id),old);
 }
 assert.equal(db.batch_id,followup.id);assert.equal(db.clinical.filter(x=>x.doi==='10.1136/bjsports-2013-092947').length,1);
 assert.equal(db.collection_complete,false);assert.equal(db.expert_reviewed,false);
});
test('official in-page height disagreement is not silently reconciled',()=>{
 const rows=followup.measurements.filter(x=>x.athlete_id==='nolwen-berthier'&&x.metric==='height');
 assert.deepEqual(rows.map(x=>x.value),[156,152]);assert.equal(new Set(rows.map(x=>x.source_id)).size,1);
 assert.notEqual(rows[0].source_locator,rows[1].source_locator);
 assert.equal(rows[1].normalization.original_value*rows[1].normalization.factor,152);
 for(const x of followup.measurements)assert.equal(x.measured_at,null);
 assert.equal(followup.measurements.some(x=>x.metric==='weight'),false);
});
test('imperial units normalize exactly without implying finer measurement precision',()=>{
 const m=by(db.measurements,'bd-kaddi-height');assert.equal(m.value,(5*12+2)*2.54);assert.equal(m.display_value,'約157');assert.equal(m.raw,'5’2”');
 assert.equal(db.measurements.some(x=>x.athlete_id==='kaddi-lehmann'&&x.metric==='wingspan'),false);
});
test('first-person month and sponsor absolute dates retain their original precision',()=>{
 const a=by(db.ascents,'kryptos-kaddi');assert.equal(a.ascent_date,'2018-05');assert.equal(a.date_precision,'month');assert.equal(a.raw_date,'middle of May 2018');assert.equal(a.reported_at,'2020-04-22');assert.equal(a.grade,'V15');
 assert.equal(by(db.ascents,'rookery-katie').ascent_date,'2024-12-21');assert.equal(by(db.ascents,'rookery-katie').style,'再登');
 assert.equal(by(db.ascents,'dark-side-aidan').ascent_date,'2025-01-05');assert.equal(by(db.ascents,'empath-tommy').ascent_date,'2025-05-17');
 for(const a of followup.ascents.filter(a=>a.source_id.startsWith('edelrid'))){assert.equal(a.ascent_date,null);assert.equal(a.date_precision,'unknown');}
 assert.equal(by(db.ascents,'disney-production-nolwen').grade,'8A/+');
});
test('full-text review preserves abstract snapshot and exact published analysis denominators',()=>{
 const r=db.revision_history[0],a=by(db.clinical,r.record_id);
 assert.deepEqual(r.before,by(expansion.clinical,'ankle-recurrence-rct'));assert.deepEqual(r.after,a);
 assert.equal(a.n_randomized,384);assert.equal(a.n_analyzed,340);assert.equal(a.n_excluded_before_analysis,44);
 assert.deepEqual(a.outcome_counts.map(x=>x.denominator),[107,113,120]);assert.equal(a.outcome_counts.reduce((s,x)=>s+x.numerator,0),69);
 assert.equal(a.analysis_counts.reduce((a,b)=>a+b),340);assert.match(a.analysis_population,/全割付384人/);
 assert.equal(a.access,'本文');assert.equal(r.before.access,'抄録');assert.deepEqual(r.before.outcome_counts,[]);
 const src=by(db.sources,a.source_id);assert.equal(src.access,'本文');
});
test('Cox estimates retain adjustment and provenance; adherence periods are not pooled',()=>{
 const a=by(db.clinical,'ankle-recurrence-rct');assert.deepEqual(a.effect_estimates.map(x=>x.value),[.53,.52]);
 assert.equal(a.effect_estimates[1].source_locator,'Table 2');assert.match(a.effect_estimates[1].adjustment,/重症度/);
 assert.deepEqual(a.adherence.map(x=>x.months),[2,12,2]);assert.ok(a.adherence.every(x=>x.denominator===null));
});
test('two tenosynovitis cohorts do not manufacture a head-to-head trial or outcome denominators',()=>{
 const c=by(db.clinical,'tenosynovitis-conservative'),i=by(db.clinical,'tenosynovitis-injection');
 assert.equal(c.n_people,65);assert.equal(i.n_people,42);assert.equal(i.outcome_counts[0].numerator,31);
 assert.equal(c.reported_statistics[0].numerator,null);assert.equal(c.reported_statistics[0].denominator,null);
 for(const x of [c,i]){assert.equal(x.access,'抄録');assert.match(x.comparator,/対照群なし/);assert.equal(x.clinical_review,false);}
 assert.match(c.limit,/症状の持続期間/);assert.match(i.limit,/無痛と元のグレード/);
});
test('selected body exports retain every displayed measurement and its unique source',()=>{
 const b=prepareEvidenceExport(db,'measurements',{scope:'visible',visibleIds:['nolwen-berthier'],filters:{q:'Nolwen',metric:'リーチ',empty:''}});
 assert.equal(b.record_count,3);assert.equal(b.sources.length,1);assert.equal(b.athletes.length,1);assert.equal(b.filters.empty,undefined);assert.match(b.selection_note,/全測定項目/);
 assert.deepEqual(prepareEvidenceExport(db,'ascents').rows,db.ascents);
 assert.equal(prepareEvidenceExport(db,'ascents',{scope:'visible',visibleIds:[]}).record_count,0);
 assert.throws(()=>prepareEvidenceExport(db,'__proto__'));assert.throws(()=>prepareEvidenceExport(db,'ascents',{scope:'invalid'}));assert.throws(()=>prepareEvidenceExport(db,'ascents',{visibleIds:[null]}));
});
test('selected clinical JSON and CSV export current and previous source claims together',()=>{
 const b=prepareEvidenceExport(db,'clinical',{scope:'visible',visibleIds:['ankle-recurrence-rct'],filters:{purpose:'再発予防'}});
 assert.equal(b.record_count,1);assert.equal(b.sources.length,2);assert.equal(b.revision_history.length,1);
 const rows=evidenceCSVRows(b);assert.equal(rows[0].export_filters.purpose,'再発予防');assert.match(rows[0].source_url,/PMC4145426/);
 const text=csv(rows,Object.keys(rows[0]));assert.match(text,/107/);assert.match(text,/before/);assert.doesNotMatch(text,/\[object Object\]/);
});
test('ascent selection also includes relevant grade disagreements and athlete names',()=>{
 const b=prepareEvidenceExport(db,'ascents',{scope:'visible',visibleIds:db.ascents.filter(a=>a.climb==='Box Therapy').map(a=>a.id)});
 assert.equal(b.record_count,3);assert.equal(b.grade_claims.length,1);assert.equal(b.athletes.length,3);
 assert.ok(b.sources.some(s=>s.id==='box-katie-2023'));
 const s=prepareEvidenceExport(db,'sources',{scope:'visible',visibleIds:['edelrid-nolwen-berthier']});assert.deepEqual(s.sources,s.rows);
});
test('HTML preserves concise controls, conversion context and review history',()=>{
 const a=renderEvidence('athlete-data','/');assert.match(a,/表記差あり/);assert.match(a,/約157/);assert.doesNotMatch(a,/157\.48/);
 assert.match(renderEvidence('ascent-data','/'),/name="precision"/);assert.match(renderEvidence('injury-data','/'),/追加確認/);
 for(const view of ['athlete-data','ascent-data','injury-data','evidence']){
  const h=renderEvidence(view,'/');assert.match(h,/data-export-scope/);assert.match(h,/value="visible">表示中/);assert.match(h,/data-record-id=/);
 }
 assert.match(readFileSync('scripts/build.mjs','utf8'),/'evidence-export'/);
});
