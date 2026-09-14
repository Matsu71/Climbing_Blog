import {evidence as initial} from './evidence-initial.mjs';
import {batch} from './evidence-additions.mjs';
import {expansion} from './evidence-expansion.mjs';
import {followup} from './evidence-followup.mjs';

// Full-text reviews are explicit revisions, never silent edits to earlier source claims.
const clinicalOriginals=[...initial.clinical,...batch.clinical,...expansion.clinical,...followup.clinical];
const revisionHistory=[];
const clinical=clinicalOriginals.map(original=>{
 let current=original;
 for(const revision of followup.revisions.filter(r=>r.entity==='clinical'&&r.record_id===original.id)){
  if(current.source_id!==revision.expected_source_id)throw Error('Revision source mismatch: '+revision.id);
  const before=structuredClone(current);
  current={...current,...revision.changes};
  revisionHistory.push({...revision,before,after:structuredClone(current)});
 }
 return current;
});
if(revisionHistory.length!==followup.revisions.length)throw Error('Unmatched evidence revision');
// Previous source claims remain intact. Only progress metadata is updated by ID.
export const evidence={
 ...initial,
 coverage:"対象を絞った収集途中のデータ。世界全体の順位・再登総数・理想体型ではない。",
 batch_id:followup.id,
 collection_complete:false,
 expert_reviewed:false,
 sources:[...initial.sources,...batch.sources,...expansion.sources,...followup.sources],
 athletes:[...initial.athletes,...batch.athletes,...expansion.athletes,...followup.athletes],
 measurements:[...initial.measurements,...batch.measurements,...expansion.measurements,...followup.measurements],
 ascents:[...initial.ascents,...batch.ascents,...expansion.ascents,...followup.ascents],
 clinical,
 revision_history:revisionHistory,
 design_references:[...initial.design_references,...followup.design_references],
 grade_claims:[...initial.grade_claims,...expansion.grade_claims,...followup.grade_claims],
 queue:[...[...[...initial.queue.map(q=>({...q,...batch.queue_updates[q.id]})),...batch.queue].map(q=>({...q,...expansion.queue_updates[q.id]})),...expansion.queue].map(q=>({...q,...followup.queue_updates[q.id]})),...followup.queue],
 batches:[{id:initial.batch_id},{id:batch.id,added_sources:batch.sources.length,added_athletes:batch.athletes.length,added_measurements:batch.measurements.length,added_ascents:batch.ascents.length,added_clinical:batch.clinical.length},{id:expansion.id,added_sources:expansion.sources.length,added_athletes:expansion.athletes.length,added_measurements:expansion.measurements.length,added_ascents:expansion.ascents.length,added_clinical:expansion.clinical.length,added_grade_claims:expansion.grade_claims.length},{id:followup.id,added_sources:followup.sources.length,added_athletes:followup.athletes.length,added_measurements:followup.measurements.length,added_ascents:followup.ascents.length,added_clinical:followup.clinical.length,reviewed_clinical:followup.revisions.length}]
};
