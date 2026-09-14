const datasets=new Set(['sources','measurements','ascents','clinical']);
/** Build a reproducible selected export. visibleIds are exact record IDs, except
 * measurements, where they are athlete IDs: the table shows an athlete's whole row. */
export function prepareEvidenceExport(db,key,{scope='all',visibleIds=[],filters={}}={}){
 if(!datasets.has(key))throw new TypeError('Unknown evidence dataset');
 if(!['all','visible'].includes(scope))throw new TypeError('Unknown export scope');
 if(!Array.isArray(visibleIds)||visibleIds.some(x=>typeof x!=='string'))throw new TypeError('visibleIds must be strings');
 const ids=new Set(visibleIds),available=db[key];
 const rows=scope==='all'?[...available]:available.filter(row=>ids.has(key==='measurements'?row.athlete_id:row.id));
 const rowIds=new Set(rows.map(r=>r.id));
 const revisions=(db.revision_history??[]).filter(r=>r.entity===key&&rowIds.has(r.record_id));
 const climbs=new Set(key==='ascents'?rows.map(r=>r.climb):[]);
 const gradeClaims=(db.grade_claims??[]).filter(g=>climbs.has(g.climb));
 const sourceIds=new Set(key==='sources'?rows.map(r=>r.id):[]);
 const addSources=r=>{for(const id of [r.source_id,...(r.prior_source_ids??[])])if(id)sourceIds.add(id);};
 rows.forEach(addSources);revisions.forEach(r=>{addSources(r.before);addSources(r.after);});
 gradeClaims.forEach(g=>{addSources(g);if(g.previous_source_id)sourceIds.add(g.previous_source_id);});
 const sources=db.sources.filter(s=>sourceIds.has(s.id));
 if(sources.length!==sourceIds.size)throw new Error('Missing export source');
 const people=new Set(rows.map(r=>r.athlete_id).filter(Boolean));
 const cleanFilters=Object.fromEntries(Object.entries(filters).filter(([,v])=>typeof v==='string'&&v.trim()));
 const note=key==='measurements'?'表示中の選手について、表に含まれる全測定項目を保存します。項目フィルターは選手の抽出条件です。':'表示中の記録と、その根拠・確認範囲を保存します。';
 return {schema_version:1,dataset:key,scope,filters:scope==='visible'?cleanFilters:{},batch_id:db.batch_id,retrieved_at:db.retrieved_at,record_count:rows.length,selection_note:note,rows,sources,athletes:db.athletes.filter(a=>people.has(a.id)),grade_claims:gradeClaims,revision_history:revisions};
}
/** Add explicit provenance and selection context to selected CSV rows. */
export function evidenceCSVRows(bundle){
 const sources=new Map(bundle.sources.map(s=>[s.id,s]));
 const athletes=new Map(bundle.athletes.map(a=>[a.id,a]));
 return bundle.rows.map(row=>({...row,
  ...(row.athlete_id?{athlete_name:athletes.get(row.athlete_id)?.name??row.athlete_id}:{}),
  source_url:row.source_id?sources.get(row.source_id)?.url:row.url,
  prior_source_urls:(row.prior_source_ids??[]).map(id=>sources.get(id)?.url),
  export_scope:bundle.scope,export_filters:bundle.filters,export_note:bundle.selection_note,
  ...(bundle.revision_history.some(r=>r.record_id===row.id)?{revision_history:bundle.revision_history.filter(r=>r.record_id===row.id)}:{})
 }));
}
