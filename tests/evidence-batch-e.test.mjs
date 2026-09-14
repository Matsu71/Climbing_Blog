import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evidence as db} from '../data/evidence.mjs';
import {continuation as added} from '../data/evidence-continuation-e.mjs';
import {followup} from '../data/evidence-followup.mjs';
import {evidenceCoverage,evidenceIntegrityErrors,applyClimbIdentities,climbSearchNames,sourceFamily} from '../data/evidence-integrity.mjs';
import {prepareEvidenceExport,evidenceCSVRows} from '../data/evidence-export.mjs';
import {renderEvidence} from '../src/evidence-render.mjs';
const by=(rows,id)=>rows.find(r=>r.id===id);

test('batch E adds explicit source claims rather than planned entries',()=>{
 assert.deepEqual([added.sources.length,added.athletes.length,added.measurements.length,added.ascents.length,added.clinical.length],[9,2,8,17,3]);
 assert.equal(db.batch_id,'2026-09-14-e');assert.deepEqual(evidenceIntegrityErrors(db),[]);
 assert.equal(db.collection_complete,false);assert.equal(db.expert_reviewed,false);
 for(const a of added.ascents)assert.ok(db.sources.some(s=>s.id===a.source_id));
});
test('JOC context years and age reference days never become measurement dates',()=>{
 const expected={'mao-nakamura':[158,48],'keita-dohi':[171,60],'futaba-ito':[161,46],'shuta-tanaka':[167,55]};
 for(const [id,values] of Object.entries(expected)){
  const rows=added.measurements.filter(r=>r.athlete_id===id);
  assert.deepEqual(rows.map(r=>r.value),values);
  for(const r of rows){assert.equal(r.measured_at,null);assert.equal(r.context_year,2018);assert.match(r.context,/現在値ではない/);assert.match(r.raw,/cm\/.*kg/);}
 }
 assert.equal(added.measurements.some(r=>r.metric==='wingspan'),false);
 assert.deepEqual(db.measurements.filter(m=>m.athlete_id==='futaba-ito'&&m.metric==='height').map(m=>m.value),[160,161]);
});
test('official timeline has year precision, matching language URL and no inferred repeat totals',()=>{
 for(const a of added.ascents.filter(a=>a.athlete_id==='adam-ondra')){
  assert.match(a.ascent_date,/^\d{4}$/);assert.equal(a.date_precision,'year');assert.equal(a.current_consensus,null);assert.equal(a.repeat_total,null);
  assert.equal(a.source_id,'ondra-journey-en');assert.match(by(db.sources,a.source_id).url,/\/my-journey\/$/);
 }
 assert.equal(by(db.ascents,'water-world-ondra').style,'オンサイト');assert.equal(by(db.ascents,'pescena-ura-ondra').style,'フラッシュ');
 assert.equal(by(db.ascents,'wonderland-ondra').grade,'9b/9b+');assert.equal(by(db.ascents,'el-maquinista-ondra').grade,'9a+/9b');
});
test('podcast description is not represented as full audio verification or an exact date',()=>{
 const a=by(db.ascents,'dark-side-katie');assert.equal(a.ascent_date,'2025-03');assert.equal(a.date_precision,'month');assert.equal(a.style,'再登');assert.equal(a.reported_at,null);
 assert.match(by(db.sources,a.source_id).note,/音声全編.*未照合/);
 const rows=db.ascents.filter(a=>a.climb==='The Dark Side');assert.equal(rows.length,2);
});
test('targeted identity joins three ascents without global fuzzy merging or changing raw source files',()=>{
 const rows=db.ascents.filter(a=>a.climb==='Super Crackinette');assert.equal(rows.length,3);
 assert.equal(rows.filter(a=>a.raw_climb==='Supercrackinette').length,2);
 assert.equal(by(followup.ascents,'supercrackinette-berthe').climb,'Supercrackinette');
 const same=applyClimbIdentities([...followup.ascents,{id:'unrelated',climb:'Supercrackinette',source_id:'elsewhere',discipline:'ボルダー'}]);
 assert.equal(by(same,'unrelated').climb,'Supercrackinette');
 assert.throws(()=>applyClimbIdentities(followup.ascents.map(a=>a.id==='supercrackinette-berthe'?{...a,source_id:'wrong'}:a)),/mismatch/);
 assert.throws(()=>applyClimbIdentities([]),/Unmatched/);
});
test('selected identity exports include supporting sources and original spelling',()=>{
 const rows=db.ascents.filter(a=>a.climb==='Super Crackinette');
 const bundle=prepareEvidenceExport(db,'ascents',{scope:'visible',visibleIds:rows.map(r=>r.id)});
 assert.equal(bundle.record_count,3);assert.ok(bundle.sources.some(s=>s.id==='ondra-journey'));
 const csv=evidenceCSVRows(bundle);assert.equal(csv.filter(r=>r.raw_climb==='Supercrackinette').length,2);
 for(const r of csv.filter(r=>r.raw_climb))assert.equal(r.identity_source_urls.length,2);
});
test('nine-climber noncomparative study has no invented complete recovery or intervention-specific effect',()=>{
 const c=by(db.clinical,'elbow-climbers-multimodal');assert.equal(c.n_people,9);assert.equal(c.access,'抄録');
 assert.deepEqual(c.outcome_counts,[]);assert.deepEqual(c.effect_estimates,[]);assert.match(c.comparator,/対照群なし/);assert.match(c.limit,/復帰9\/9と読み替えない/);
 assert.equal(c.clinical_review,false);assert.equal(by(db.sources,c.source_id).published,'2011-10-21');
});
test('coverage separates reported values, source counts, date precision and medical verification',()=>{
 const c=evidenceCoverage(db);
 assert.deepEqual([c.athlete_records,c.athletes_with_measurements,c.reported_measurements,c.weight_people,c.wingspan_people],[46,37,72,10,17]);
 assert.deepEqual([c.ascents,c.climb_names,c.clinical_records,c.clinical_fulltext,c.clinical_abstract,c.sources],[96,84,17,9,8,85]);
 assert.equal(Object.values(c.ascent_date_precision).reduce((a,b)=>a+b),96);assert.equal(c.measurement_dates_known,0);
 assert.match(renderEvidence('evidence','/'),/世界全体の網羅率ではありません/);
});
test('audit detects duplicate claims, missing provenance and invalid outcome denominators',()=>{
 const copy=structuredClone(db);copy.ascents.push({...copy.ascents[0],id:'bad-duplicate'});
 copy.measurements[0].source_id='missing';copy.clinical.push({...copy.clinical[0],id:'copy'});
 copy.clinical[0].outcome_counts=[{numerator:11,denominator:9}];
 copy.clinical[1].adverse_events=[{numerator:3,denominator:1}];
 copy.clinical[2].outcome_counts=[{numerator:null,denominator:null}];
 const errors=evidenceIntegrityErrors(copy).join('\n');
 assert.match(errors,/Duplicate ascent claim/);assert.match(errors,/missing source/);assert.match(errors,/Duplicate clinical DOI/);assert.match(errors,/Invalid outcome denominator/);assert.match(errors,/adverse_events/);
});
test('original notation and aliases are available without expanding marketing copy',()=>{
 const body=renderEvidence('athlete-data','/');assert.match(body,/<summary>原表記<\/summary>/);assert.match(body,/2018年/);
 const ascents=renderEvidence('ascent-data','/');assert.match(ascents,/元表記：Supercrackinette/);assert.match(ascents,/data-search="Super Crackinette Supercrackinette/);assert.doesNotMatch(ascents,/本人公式記録supercrackinette-ondra/);
 for(const file of ['data/evidence-continuation-e.mjs','data/evidence-integrity.mjs','src/evidence-render.mjs'])assert.equal(readFileSync(file,'utf8'),readFileSync('docs/'+file,'utf8'));
});

test('literal aliases are searchable only on reviewed record identities',()=>{
 assert.deepEqual(climbSearchNames(by(db.ascents,'supercrackinette-ondra')),['Super Crackinette','Supercrackinette']);
 assert.deepEqual(climbSearchNames({id:'unrelated',climb:'Super Crackinette'}),['Super Crackinette']);
 assert.match(readFileSync('evidence-ui.mjs','utf8'),/restoreReviewedClimbAlias/);
});

test('H-tape samples are not pooled and surrogate changes are not recovery rates',()=>{
 const c=by(db.clinical,'h-tape-biomechanics');assert.equal(c.n_people,null);assert.equal(c.n_ultrasound,8);assert.equal(c.n_strength,12);assert.deepEqual(c.outcome_counts,[]);
 assert.match(c.limit,/治癒率・復帰率ではない/);assert.equal(by(db.sources,c.source_id).published,'2007-02');
});
test('surgery outcomes and adverse events retain distinct populations and time origins',()=>{
 const c=by(db.clinical,'pulley-reconstruction-series');assert.equal(c.n_eligible,53);assert.equal(c.n_people,38);assert.equal(c.n_ultrasound,31);
 assert.deepEqual(c.outcome_counts.map(o=>[o.numerator,o.denominator]),[[30,38],[18,31]]);
 assert.equal(c.follow_up_anchor,'登攀再開');assert.match(c.follow_up,/再開後平均6.4/);assert.match(c.adverse_event_note,/合算/);
 assert.match(renderEvidence('injury-data','/'),/合併症・不都合/);assert.equal(c.access,'本文');assert.equal(c.clinical_review,false);
});

test('source browsing groups existing labels without rewriting original provenance',()=>{
 assert.ok(db.sources.every(s=>sourceFamily(s)!=='未分類'));
 assert.equal(sourceFamily({kind:'unknown-new-kind'}),'未分類');
 assert.equal(sourceFamily({kind:'スポンサー発表（配信転載）'}),'スポンサー');
 assert.equal(sourceFamily({kind:'合意声明'}),'学術資料');
 assert.equal(sourceFamily({kind:'本人インタビューの番組紹介'}),'番組紹介');
 const h=renderEvidence('evidence','/');assert.match(h,/name="family"/);assert.match(h,/name="kind"/);assert.match(h,/data-family="学術資料"/);
});
