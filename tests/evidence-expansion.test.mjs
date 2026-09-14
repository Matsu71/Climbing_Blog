import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evidence as db} from '../data/evidence.mjs';
import {batch} from '../data/evidence-additions.mjs';
import {evidence as initial} from '../data/evidence-initial.mjs';
import {expansion} from '../data/evidence-expansion.mjs';
import {renderEvidence,clinicalScope,evidenceCounts} from '../src/evidence-render.mjs';
const by=(list,id)=>list.find(x=>x.id===id);
test('third batch appends claims without rewriting either earlier batch',()=>{
 for(const key of ['sources','athletes','measurements','ascents','clinical'])assert.deepEqual(db[key].slice(0,initial[key].length+batch[key].length),[...initial[key],...batch[key]]);
 assert.deepEqual([expansion.sources.length,expansion.athletes.length,expansion.measurements.length,expansion.ascents.length,expansion.clinical.length],[14,8,12,23,4]);
 assert.equal(db.batch_id,expansion.id);assert.equal(db.collection_complete,false);
});
test('six official profiles retain raw height and span without manufactured dates or weights',()=>{
 for(const [id,height,span] of [['tommy-caldwell',178,178],['melissa-le-neve',168,175],['kilian-fischhuber',175,176],['ryuichi-murai',167,173],['jenya-kazbekova',164,168],['solveig-korherr',154,156]]){
  const rows=expansion.measurements.filter(x=>x.athlete_id===id);
  assert.deepEqual(rows.map(x=>x.value),[height,span]);
  for(const x of rows){assert.equal(x.measured_at,null);assert.equal(x.status,'reported');assert.equal(x.unit,'cm');assert.ok(x.source_locator);}
 }
 assert.equal(expansion.measurements.some(x=>x.metric==='weight'),false);
});
test('boulder and sport style conventions remain distinct, not inferred from uppercase alone',()=>{
 const murai=expansion.ascents.filter(x=>x.athlete_id==='ryuichi-murai');assert.equal(murai.length,10);assert.equal(murai.filter(x=>x.style==='初登').length,3);
 for(const a of murai)assert.equal(a.ascent_date,null);
 assert.equal(by(db.ascents,'directa-jabali-jenya').style,'完登');assert.equal(by(db.ascents,'semental-jenya').style,'フラッシュ');
 assert.equal(by(db.ascents,'pati-naso-jenya').raw_grade,'8c/c+');assert.equal(by(db.ascents,'partage-jenya').ascent_date,'2022');
 assert.equal(by(db.ascents,'mecanique-melissa').discipline,'ボルダー');
});
test('Box Therapy preserves source-era grade conflict and never borrows a sibling grade',()=>{
 assert.equal(by(db.ascents,'box-therapy-katie').grade,'8C+');assert.equal(by(db.ascents,'box-therapy-brooke').grade,'8C');assert.equal(by(db.ascents,'box-therapy-shawn').grade,null);
 for(const a of db.ascents.filter(x=>x.climb==='Box Therapy')){assert.equal(a.ascent_date,null);assert.equal(a.date_precision,'unknown');assert.equal(a.current_consensus,null);assert.equal(a.repeat_total,null);}
 const g=by(db.grade_claims,'g-box-therapy-brooke');assert.equal(g.previous_reported,'8C+');assert.equal(g.claim_date,'2023-10-13');assert.equal(g.date_role,'記事の公表日');
});
test('absolute ascent date and press release date stay separate',()=>{
 const a=by(db.ascents,'horizon-ashima');assert.equal(a.ascent_date,'2016-03-22');assert.equal(a.reported_at,'2016-03-23');assert.equal(a.style,'再登');
 assert.equal(by(db.ascents,'nascondino-brooke').grade,'8A+/B');assert.equal(by(db.ascents,'nascondino-brooke').ascent_date,null);
});
test('clinical trial allocation is not reconstructed outcome denominator',()=>{
 for(const id of ['elbow-injection-rct','ankle-recurrence-rct']){
  const c=by(db.clinical,id);assert.equal(c.allocation_counts.reduce((a,b)=>a+b,0),c.n_people);assert.equal(c.access,'抄録');assert.deepEqual(c.outcome_counts,[]);
  for(const x of c.reported_statistics)assert.equal(x.denominator,null);
 }
 assert.equal(by(db.clinical,'elbow-injection-rct').effect_estimates[0].ci_level,99);
 assert.equal(by(db.clinical,'ankle-recurrence-rct').effect_estimates[0].ci_level,95);
 assert.equal(by(db.clinical,'ankle-recurrence-rct').reported_statistics.reduce((n,x)=>n+x.numerator,0),69);
});
test('survey inconsistencies and expert counts cannot be presented as treatment success',()=>{
 const s=by(db.clinical,'climber-return-survey');assert.equal(s.n_people,237);assert.equal(s.n_injuries,432);assert.equal(s.region_counts[0].denominator,432);assert.ok(s.data_issues.length>=2);assert.deepEqual(s.outcome_counts,[]);
 const p=by(db.clinical,'ankle-paass');assert.equal(p.n_people,null);assert.equal(p.n_experts,155);assert.equal(p.role,'復帰評価');assert.deepEqual(p.outcome_counts,[]);
 assert.equal(evidenceCounts.clinicalStudies,10);assert.equal(evidenceCounts.clinicalConsensus,1);
});
test('applicability is explicit; climber-mixed studies are not relabeled climber-only',()=>{
 assert.equal(clinicalScope(by(db.clinical,'taping')),'クライマーを含む');assert.equal(clinicalScope(by(db.clinical,'lumbrical-series')),'クライマーを含む');
 assert.equal(clinicalScope(by(db.clinical,'elbow-injection-rct')),'一般患者');assert.equal(clinicalScope(by(db.clinical,'ankle-paass')),'一般スポーツ');assert.equal(clinicalScope({id:'new-unclassified'}),'未分類');
});
test('compact filters, exact climb links, grade history and medical scopes reach static output',()=>{
 const a=renderEvidence('ascent-data','/Climbing_Blog/');assert.match(a,/name="climb"/);assert.match(a,/class="filter-extra"/);assert.match(a,/data-grade-climb="Box Therapy"/);assert.match(a,/climb=Box%20Therapy&amp;discipline=/);
 const m=renderEvidence('injury-data','/');assert.match(m,/name="scope"/);assert.match(m,/data-purpose="再発予防"/);assert.match(m,/data-purpose="復帰評価"/);assert.match(m,/原文の不一致/);
 for(const html of [a,m])assert.match(html,/download-scope">全件/);
 assert.match(readFileSync('scripts/build.mjs','utf8'),/'evidence-expansion'/);
});
