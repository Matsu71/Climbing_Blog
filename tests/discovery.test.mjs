import test from 'node:test';
import assert from 'node:assert/strict';
import {gyms,sources,checkedAt} from '../data/catalog.mjs';
import {glossary} from '../data/glossary.mjs';
import {articles} from '../data/articles.mjs';
import {validDate} from '../src/core.mjs';
import {render,searchIndex} from '../src/render.mjs';
import {gymRows,gymSelection,displayBool,height,gymStatus} from '../src/gym-model.mjs';
import {NOTEBOOK_KEY,MAX_NOTES,validateNote,parseNotebook,mergeNotes,notebookDocument,noteSummary} from '../src/notebook-model.mjs';
const make=(id='record-0001',changes={})=>({id,date:'2026-09-11',discipline:'boulder',name:'青の3番',grade:'V5',attempts:3,result:'project',focus:'feet',observation:'右足が外れた',next:'足位置を変える',...changes});
const sourceIDs=new Set(sources.map(s=>s.id));
test('gym records preserve status, per-field evidence, calendar precision and unknown equipment',()=>{
  assert.ok(gyms.length>=21);assert.ok(new Set(gyms.map(g=>g.brand)).size>=7);
  for(const g of gyms){
    assert.ok(['listed','closed'].includes(g.status));assert.ok(validDate(g.closed_date,g.closed_date_precision),g.id);
    assert.ok(validDate(g.opened_date,g.opened_date_precision),g.id);
    assert.ok(g.checked_at<=checkedAt);
    if(g.status==='closed'){assert.ok(g.closed_date);assert.ok(g.field_sources.closed_date?.length);}
    for(const [field,ids]of Object.entries(g.field_sources)){
      assert.ok(field in g,`${g.id}.${field}`);assert.ok(ids.length);
      for(const id of ids){assert.ok(sourceIDs.has(id));assert.ok(g.sources.includes(id),`${g.id}.${field}: ${id}`);}
    }
    for(const field of ['auto_belay','campus_board','moonboard','kilterboard']){
      assert.ok([true,false,null].includes(g[field]),`${g.id}.${field}`);
      if(g[field]!==null)assert.ok(g.field_sources[field]?.length);
    }
    for(const field of ['boulder_height_m','rope_height_m']){
      if(g[field]!==null){assert.ok(g[field]>0&&g[field]<100);assert.ok(g.field_sources[field]?.length);}
    }
  }
});
test('route length is not silently treated as wall height and closed locations are not visit directions',()=>{
  const rock=gyms.find(g=>g.id==='rocklands');assert.equal(rock.rope_height_m,null);assert.ok(rock.route_length_note.includes('13'));
  const base=gyms.find(g=>g.id==='basecamp-iruma');assert.equal(base.campus_board,true);assert.deepEqual(base.field_sources.campus_board,['gym-base-facilities']);
  for(const g of gyms.filter(g=>g.status==='closed')){const html=render('gyms',g.id);assert.ok(html.includes('閉店しています'));assert.ok(!html.includes('maps/search/'));}
});
test('gym comparison sanitizes IDs, preserves order and uses exactly the static field definitions',()=>{
  assert.deepEqual(gymSelection('akiba,akiba,../x,<img>,rocklands,kawasaki,ogikubo',gyms),['akiba','rocklands','kawasaki']);
  assert.deepEqual(gymSelection(null,gyms),[]);assert.equal(displayBool(null),'未登録・未確認');assert.equal(height(null),'未登録・未確認');assert.equal(height(4.2),'4.2 m');
  for(const g of gyms){assert.equal(gymRows(g).length,12);assert.equal(gymRows(g)[0][1],gymStatus(g));assert.ok(gymRows(g).every(r=>typeof r[1]==='string'));}
});
test('glossary has unique entries, real sources, article connections and search anchors',()=>{
  assert.equal(new Set(glossary.map(t=>t.id)).size,glossary.length);assert.ok(glossary.length>=28);
  for(const term of glossary){
    assert.ok(term.name&&term.english&&term.definition&&term.caution);assert.ok(term.sources.length);
    assert.ok(term.sources.every(id=>sourceIDs.has(id)),term.id);assert.ok(articles.some(a=>a.id===term.article));
    assert.ok(searchIndex().some(x=>x.path==='glossary/#'+term.id));
  }
  assert.ok(render('read','footwork-load').includes('この話のキーワード'));
});
test('all new public routes have content without JavaScript and private notebook is not embedded in build data',()=>{
  for(const view of ['glossary','notebook','gym-history']){const html=render(view);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(!html.includes('undefined'));}
  assert.ok(render('notebook').includes('JavaScriptが必要'));
  assert.ok(render('gyms').includes('data-default="営業案内あり"'));
  assert.ok(render('privacy').includes('トライノート最大250件'));
  assert.equal(NOTEBOOK_KEY,'crux:v1:notebook');
});
test('note validation strips extra keys and rejects impossible dates, invalid enums and unsafe IDs',()=>{
  assert.deepEqual(validateNote({...make(),danger:'ignored'}),make());
  const cases=[null,[],{...make(),id:'../private'},{...make(),date:'2026-02-30'},
    {...make(),discipline:'unknown'},{...make(),result:'__proto__'},{...make(),focus:'constructor'},
    {...make(),name:'  '},{...make(),name:'a'.repeat(121)},{...make(),observation:'a'.repeat(2001)},
    {...make(),attempts:0},{...make(),attempts:1.5},{...make(),attempts:Infinity},{...make(),attempts:'2'},
    {...make(),result:'flash',attempts:2}];
  for(const row of cases)assert.throws(()=>validateNote(row),RangeError);
  assert.equal(validateNote(make('record-0002',{result:'flash',attempts:1})).result,'flash');
});
test('notebook JSON import is versioned, bounded and transactional on any invalid record',()=>{
  assert.deepEqual(parseNotebook(JSON.stringify(notebookDocument([make()]))),[make()]);
  for(const text of ['{bad',JSON.stringify({notes:[]}),JSON.stringify({schema_version:2,notes:[]}),
    JSON.stringify(notebookDocument([make(),make()])),JSON.stringify({schema_version:1,notes:[make(),{...make('record-0002'),date:'bad'}]}),
    JSON.stringify({schema_version:1,notes:Array(MAX_NOTES+1).fill(make())}),'x'.repeat(1024*1024+1)])assert.throws(()=>parseNotebook(text),RangeError);
});
test('merge never overwrites an existing ID and refuses over-limit or duplicate inputs',()=>{
  const current=[make()],incoming=[make('record-0001',{name:'changed'}),make('record-0002')];
  const merged=mergeNotes(current,incoming);assert.equal(merged.added,1);assert.equal(merged.skipped,1);assert.equal(merged.notes[0].name,'青の3番');assert.equal(current.length,1);
  assert.throws(()=>mergeNotes(current,[make(),make()]));
  const full=Array.from({length:250},(_,i)=>make('record-'+String(i).padStart(4,'0')));
  assert.throws(()=>mergeNotes(full,[make('record-new1')]));assert.equal(full.length,250);
});
test('note summaries count entries and distinct dates, not fictitious unique climbs or success rate',()=>{
  const rows=[make(),make('record-0002',{result:'sent'}),make('record-0003',{date:'2026-09-10'})];
  assert.deepEqual(noteSummary(rows),{entries:3,dates:2,projects:2,sends:1});
  assert.equal(rows[0].name,rows[1].name);
});
