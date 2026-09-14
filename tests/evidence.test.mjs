import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evidence as db} from '../data/evidence.mjs';
import {render,configureBase,searchIndex} from '../src/render.mjs';
import {evidenceCounts,evidenceViews,evidenceSearchIndex} from '../src/evidence-render.mjs';
import {validDate,csv} from '../src/core.mjs';
const sources=new Map(db.sources.map(s=>[s.id,s]));
const people=new Set(db.athletes.map(s=>s.id));
const unique=rows=>assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
test('evidence IDs and all claim-level joins are valid',()=>{
 for(const group of ['sources','athletes','measurements','ascents','grade_claims','clinical','queue'])unique(db[group]);
 for(const group of ['measurements','ascents','grade_claims','clinical'])for(const row of db[group])assert.ok(sources.has(row.source_id),row.id);
 for(const row of [...db.measurements,...db.ascents])assert.ok(people.has(row.athlete_id),row.id);
 for(const g of db.grade_claims)if(g.previous_source_id)assert.ok(sources.has(g.previous_source_id));
 for(const s of db.sources){assert.match(s.url,/^https:\/\//);assert.ok(s.access&&s.locator);assert.equal(s.retrieved_at,'2026-09-14');}
});
test('coverage counts do not count missing, ambiguous or calculated values as source measurements',()=>{
 assert.deepEqual([evidenceCounts.athletes,evidenceCounts.measurements,evidenceCounts.ascents,evidenceCounts.clinicalStudies,evidenceCounts.clinicalSources,evidenceCounts.sources],[37,72,96,15,17,85]);
 assert.equal(db.collection_complete,false);assert.equal(db.expert_reviewed,false);
 assert.equal(db.measurements.length,74);assert.equal(db.athletes.length,46);
});
test('measurement date, original units and conflicting historical heights stay distinct',()=>{
 for(const m of db.measurements){assert.equal(m.measured_at,null);assert.ok(['height','weight','wingspan','ape_difference','ape_unresolved'].includes(m.metric));if(m.value!==null)assert.ok(Number.isFinite(m.value));}
 const tomoa=db.measurements.filter(m=>m.athlete_id==='tomoa-narasaki'&&m.metric==='height');assert.deepEqual(tomoa.map(m=>m.value).sort(),[169,170]);
 const sean=db.measurements.find(m=>m.athlete_id==='sean-mccoll'&&m.metric==='ape_unresolved');assert.equal(sean.value,null);assert.equal(sean.unit,null);assert.match(sean.raw,/5/);
 const derived=db.measurements.find(m=>m.status==='derived');assert.equal(derived.value,12);assert.equal(derived.derived_from.length,2);
 const inputs=derived.derived_from.map(id=>db.measurements.find(m=>m.id===id));assert.equal(inputs.find(m=>m.metric==='wingspan').value-inputs.find(m=>m.metric==='height').value,derived.value);
});
test('ascent dates are not publication dates or invented day-precision',()=>{
 for(const a of db.ascents){assert.ok(validDate(a.ascent_date,a.date_precision),a.id);assert.equal(a.repeat_total,null);assert.equal(a.current_consensus,null);}
 assert.equal(db.ascents.find(a=>a.id==='excalibur-bosi').ascent_date,'2025-02-03');
 assert.equal(db.ascents.find(a=>a.climb==='Captain Nemo').style,'再登');
 assert.equal(db.ascents.find(a=>a.climb==='DNA').grade,null);
 assert.ok(db.grade_claims.every(g=>g.date_role==='記事の公表日'));
});
test('medical evidence separates patient counts, study design and limitations',()=>{
 for(const c of db.clinical){assert.equal(c.clinical_review,false);assert.ok(c.limit&&c.sample&&c.comparator&&c.design&&c.access);}
 const series=db.clinical.find(c=>c.doi==='10.3389/fspor.2025.1497110');assert.equal(series.n_people,50);assert.match(series.sample,/69/);assert.equal(sources.get(series.source_id).published,'2025-01-20');
 assert.equal(db.clinical.filter(c=>c.n_people===1).length,1);
});
test('data pages are indexable HTML with single H1, real sources and bounded labels',()=>{
 configureBase('/Climbing_Blog/');
 for(const view of ['home',...evidenceViews]){const html=render(view);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.doesNotMatch(html,/理想的なクライマーの体型|未来を切り開く/);assert.match(html,/<link rel="canonical"/);}
 const h=render('athlete-data');assert.equal((h.match(/id="athlete-/g)||[]).length,37);assert.match(h,/169/);assert.match(h,/170/);assert.match(h,/測定時期/);
 assert.equal((render('ascent-data').match(/id="ascent-/g)||[]).length,96);
 assert.equal((render('evidence').match(/id="source-/g)||[]).length,85);
 for(const row of evidenceSearchIndex())assert.ok(searchIndex().some(s=>s.path===row.path));
});
test('CSV exports neutralize formula prefixes',()=>{
 const text=csv([{n:'=HYPERLINK(1)',raw:'+5 ape'}],['n','raw']);assert.ok(text.includes("'=HYPERLINK"));assert.ok(text.includes("'+5 ape"));
});
test('branch-based Pages mirrors use the same audited code and data',()=>{
 for(const path of ['bootstrap.mjs','single-article.mjs','src/render.mjs','src/knowledge-render.mjs','src/evidence-render.mjs','data/evidence.mjs','data/evidence-initial.mjs','data/evidence-additions.mjs','data/evidence-expansion.mjs','data/evidence-followup.mjs','data/evidence-export.mjs','data/evidence-continuation-e.mjs','data/evidence-integrity.mjs','src/core.mjs','core.mjs','evidence.css','evidence-ui.mjs','index.html'])assert.equal(readFileSync(path,'utf8'),readFileSync('docs/'+path,'utf8'),path);
 for(const file of ['evidence.css','evidence-ui.mjs'])assert.equal(readFileSync(file,'utf8'),readFileSync('public/'+file,'utf8'));
 for(const path of ['bootstrap.mjs','single-article.mjs','docs/single-article.mjs','index.html'])assert.doesNotMatch(readFileSync(path,'utf8'),/featuredArticle|176\.2|61\.5|182\.7|理想的なクライマー/);
});
