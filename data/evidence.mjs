import {evidence as initial} from './evidence-initial.mjs';
import {batch} from './evidence-additions.mjs';
import {expansion} from './evidence-expansion.mjs';
import {followup} from './evidence-followup.mjs';
import {continuation} from './evidence-continuation-e.mjs';
import {applyClimbIdentities,climbIdentityCorrections} from './evidence-integrity.mjs';

// Batches are immutable inputs; later reviews and queue progress are explicit overlays.
const batches=[initial,batch,expansion,followup,continuation];
const collect=key=>batches.flatMap(b=>b[key]??[]);
const revisions=collect('revisions');
const revisionHistory=[];
const clinical=collect('clinical').map(original=>{
 let current=original;
 for(const revision of revisions.filter(r=>r.entity==='clinical'&&r.record_id===original.id)){
  if(current.source_id!==revision.expected_source_id)throw Error('Revision source mismatch: '+revision.id);
  const before=structuredClone(current);
  current={...current,...revision.changes};
  revisionHistory.push({...revision,before,after:structuredClone(current)});
 }
 return current;
});
if(revisionHistory.length!==revisions.length)throw Error('Unmatched evidence revision');
let queue=[];
for(const b of batches)queue=[...queue.map(q=>({...q,...b.queue_updates?.[q.id]})),...(b.queue??[])];
export const evidence={
 ...initial,
 coverage:'対象を絞った収集途中のデータ。世界全体の順位・再登総数・理想体型ではない。',
 batch_id:continuation.id,collection_complete:false,expert_reviewed:false,
 sources:collect('sources'),athletes:collect('athletes'),measurements:collect('measurements'),
 ascents:applyClimbIdentities(collect('ascents')),clinical,
 revision_history:revisionHistory,climb_identity_corrections:climbIdentityCorrections,
 design_references:collect('design_references'),grade_claims:collect('grade_claims'),queue,
 batches:batches.map((b,i)=>i===0?{id:b.batch_id}:{id:b.id,added_sources:b.sources.length,added_athletes:b.athletes.length,added_measurements:b.measurements.length,added_ascents:b.ascents.length,added_clinical:b.clinical.length,...(b.revisions?{reviewed_clinical:b.revisions.length}:{}),...(b.grade_claims?{added_grade_claims:b.grade_claims.length}:{})})
};
