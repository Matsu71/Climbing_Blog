import test from 'node:test';
import assert from 'node:assert/strict';
import {evidence as db} from '../data/evidence.mjs';
import {evidence as initial} from '../data/evidence-initial.mjs';
import {batch} from '../data/evidence-additions.mjs';
import {renderEvidence} from '../src/evidence-render.mjs';
import {csv} from '../src/core.mjs';
const by=(rows,id)=>rows.find(x=>x.id===id);
test('continuation preserves previous claims and records explicit additions',()=>{
 for(const k of ['sources','athletes','measurements','ascents','clinical'])assert.deepEqual(db[k].slice(0,initial[k].length),initial[k]);
 assert.deepEqual([batch.sources.length,batch.athletes.length,batch.measurements.length,batch.ascents.length,batch.clinical.length],[20,11,16,17,4]);
 assert.deepEqual(db.grade_claims,initial.grade_claims);assert.equal(db.queue.length,17);
});
test('new body values preserve source conflicts and six reported arm spans',()=>{
 const heights=db.measurements.filter(x=>x.athlete_id==='laura-rogora'&&x.metric==='height');
 assert.deepEqual(heights.map(x=>x.value).sort(),[152,154]);
 assert.equal(batch.measurements.filter(x=>x.metric==='wingspan').length,6);
 for(const m of batch.measurements){assert.equal(m.measured_at,null);assert.equal(m.status,'reported');assert.equal(m.unit,'cm');assert.ok(m.context&&m.raw);}
});
test('female first ascent, first ascent and onsight remain separate styles',()=>{
 for(const a of batch.ascents.filter(x=>x.raw_style))assert.equal(a.style,{FFA:'再登',FA:'初登',OS:'オンサイト'}[a.raw_style]);
 assert.equal(by(db.ascents,'anak-ciudad-enmienda').raw_grade,'9a/+');
 assert.equal(by(db.ascents,'continental-laura').style,'オンサイト');
});
test('unknown interview dates never become publication-minus-one ascent dates',()=>{
 for(const id of ['mascella-laura','continental-laura','occhio-laura','tre-mou-laura']){const a=by(db.ascents,id);assert.equal(a.ascent_date,null);assert.equal(a.date_precision,'unknown');assert.ok(a.reported_at);}
 assert.equal(by(db.ascents,'bibliographie-laura').ascent_date,'2026-08');
 assert.equal(by(db.ascents,'bibliographie-janja').ascent_date,'2026-06-06');
 assert.equal(by(db.ascents,'bibliographie-janja').reported_at,'2026-06-08');
 assert.equal(by(db.ascents,'excalibur-brooke').ascent_date,'2025-04-05');
});
test('clinical people, injuries and outcome-specific denominators are distinct',()=>{
 const p=by(db.clinical,'pulley-pps');assert.equal(p.n_people,45);assert.equal(p.n_injuries,47);assert.equal(p.outcome_counts[0].denominator,43);
 const l=by(db.clinical,'lumbrical-series');assert.equal(l.n_people,60);assert.equal(l.n_climbers,57);
 const s=by(db.clinical,'shoulder-repair');assert.equal(s.n_people,27);assert.equal(s.n_joints,30);
 const a=by(db.clinical,'physeal-algorithm');assert.equal(a.n_people,27);assert.equal(a.n_injuries,37);assert.deepEqual(a.outcome_counts,[]);assert.match(a.limit,/不整合/);
 for(const c of batch.clinical)for(const o of c.outcome_counts){assert.ok(o.numerator<=o.denominator);assert.ok(o.population&&o.unit);}
 assert.equal(batch.clinical.filter(x=>x.access==='抄録').length,2);
});
test('record filters and access status are rendered in static HTML',()=>{
 const ascent=renderEvidence('ascent-data','/');assert.match(ascent,/name="athlete"/);assert.match(ascent,/オンサイト/);assert.match(ascent,/公表 2026-06-08/);
 const medical=renderEvidence('injury-data','/');assert.match(medical,/抄録のみ/);assert.match(medical,/name="purpose"/);assert.match(medical,/本文確認/);
 const source=renderEvidence('evidence','/');assert.match(source,/data-results/);assert.match(source,/一部採録/);assert.match(source,/収録出典53件/);
});
test('nested outcome denominators survive CSV export instead of object coercion',()=>{
 const value=csv([{outcomes:[{numerator:38,denominator:43}],meta:{unit:'人'}}],['outcomes','meta']);
 assert.doesNotMatch(value,/\[object Object\]/);assert.match(value,/denominator/);assert.match(value,/43/);assert.match(value,/unit/);
});
