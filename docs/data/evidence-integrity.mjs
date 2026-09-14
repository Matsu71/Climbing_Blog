/** Only reviewed identities are merged; punctuation similarity is not evidence. */
export const climbIdentityCorrections=[
 {record_id:'supercrackinette-berthe',source_id:'edelrid-sebastien-berthe',raw_climb:'Supercrackinette',climb:'Super Crackinette',reference_record_id:'supercrackinette-ondra',basis:'同じサン・レジェの9a+として、本人の公式年表と照合。'},
 {record_id:'supercrackinette-nolwen',source_id:'edelrid-nolwen-berthier',raw_climb:'Supercrackinette',climb:'Super Crackinette',reference_record_id:'supercrackinette-ondra',basis:'同じサン・レジェの9a+として、本人の公式年表と照合。'}
];
export function applyClimbIdentities(records){
 const matched=new Set();
 const result=records.map(record=>{
  const c=climbIdentityCorrections.find(x=>x.record_id===record.id);
  if(!c)return record;
  if(record.climb!==c.raw_climb||record.source_id!==c.source_id)throw Error('Route identity source mismatch: '+record.id);
  matched.add(record.id);
  return {...record,climb:c.climb,raw_climb:c.raw_climb,identity_note:c.basis,identity_source_ids:[record.source_id,'ondra-journey']};
 });
 if(matched.size!==climbIdentityCorrections.length)throw Error('Unmatched route identity correction');
 return result;
}
/** Counts describe this dataset, never world coverage or verification certainty. */
export function evidenceCoverage(db){
 const reported=db.measurements.filter(m=>Number.isFinite(m.value)&&m.status==='reported');
 const peopleFor=metric=>new Set(reported.filter(m=>m.metric===metric).map(m=>m.athlete_id)).size;
 return {
  athlete_records:db.athletes.length,athletes_with_measurements:new Set(reported.map(m=>m.athlete_id)).size,
  reported_measurements:reported.length,height_people:peopleFor('height'),weight_people:peopleFor('weight'),wingspan_people:peopleFor('wingspan'),
  measurement_dates_known:reported.filter(m=>typeof m.measured_at==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(m.measured_at)).length,
  ascents:db.ascents.length,climb_names:new Set(db.ascents.map(a=>a.climb)).size,
  ascent_date_precision:Object.fromEntries(['day','month','year','unknown'].map(v=>[v,db.ascents.filter(a=>a.date_precision===v).length])),
  clinical_records:db.clinical.length,clinical_fulltext:db.clinical.filter(s=>s.access==='本文').length,clinical_abstract:db.clinical.filter(s=>s.access==='抄録').length,
  sources:db.sources.length,expert_reviewed:db.expert_reviewed===true,collection_complete:db.collection_complete===true
 };
}
export function evidenceIntegrityErrors(db){
 const errors=[];const sourceIds=new Set(db.sources.map(s=>s.id));const athleteIds=new Set(db.athletes.map(a=>a.id));
 for(const key of ['sources','athletes','measurements','ascents','clinical','grade_claims','queue']){
  const seen=new Set();for(const r of db[key]){if(seen.has(r.id))errors.push(key+': duplicate ID '+r.id);seen.add(r.id);}
 }
 for(const key of ['measurements','ascents','clinical','grade_claims'])for(const r of db[key]){
  for(const id of [r.source_id,...(r.prior_source_ids??[]),...(r.identity_source_ids??[])])if(!sourceIds.has(id))errors.push(r.id+': missing source '+id);
  if(r.athlete_id&&!athleteIds.has(r.athlete_id))errors.push(r.id+': missing athlete');
 }
 const doi=new Set();for(const r of db.clinical){if(!r.doi)continue;if(doi.has(r.doi))errors.push('Duplicate clinical DOI '+r.doi);doi.add(r.doi);}
 const claims=new Set();for(const r of db.ascents){
  const key=JSON.stringify([r.athlete_id,r.climb,r.discipline,r.style,r.ascent_date,r.source_id]);
  if(claims.has(key))errors.push('Duplicate ascent claim '+r.id);claims.add(key);
 }
 for(const r of db.clinical)for(const key of ['outcome_counts','adverse_events'])for(const o of r[key]??[]){
  if(key==='adverse_events'&&o.numerator==null&&o.denominator==null)continue;
  if(!Number.isInteger(o.numerator)||!Number.isInteger(o.denominator)||o.denominator<=0||o.numerator<0||o.numerator>o.denominator)errors.push('Invalid outcome denominator '+r.id+' / '+key);
 }
 return errors;
}

export function climbSearchNames(record){
 const reviewed=['supercrackinette-ondra',...climbIdentityCorrections.map(c=>c.record_id)];
 return reviewed.includes(record.id)?[record.climb,'Supercrackinette']:[record.climb,record.raw_climb].filter(Boolean);
}

// A short browsing classification; original source types remain unchanged.
const sourceFamilies=new Map([
 ['競技団体','競技団体'],['競技団体公式','競技団体'],['大会主催者','競技団体'],
 ['本人公式','本人発信'],['本人寄稿','本人発信'],['本人記録','本人発信'],['本人執筆（スポンサー掲載）','本人発信'],
 ['独自取材','取材・報道'],['本人インタビュー','取材・報道'],['登攀報道','取材・報道'],['専門報道','取材・報道'],
 ['スポンサー公式','スポンサー'],['公式スポンサー','スポンサー'],['スポンサー取材','スポンサー'],['スポンサー発表','スポンサー'],['スポンサー発表（配信転載）','スポンサー'],
 ['原著論文','学術資料'],['査読論文','学術資料'],['合意声明','学術資料'],
 ['公的医療情報','公的医療情報'],['本人インタビューの番組紹介','番組紹介']
]);
export const sourceFamily=source=>sourceFamilies.get(source.kind)??'未分類';
