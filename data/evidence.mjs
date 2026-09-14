import {evidence as initial} from './evidence-initial.mjs';
import {batch} from './evidence-additions.mjs';
import {expansion} from './evidence-expansion.mjs';
// Previous source claims remain intact. Only progress metadata is updated by ID.
export const evidence={
 ...initial,
 coverage:"対象を絞った収集途中のデータ。世界全体の順位・再登総数・理想体型ではない。",
 batch_id:expansion.id,
 collection_complete:false,
 expert_reviewed:false,
 sources:[...initial.sources,...batch.sources,...expansion.sources],
 athletes:[...initial.athletes,...batch.athletes,...expansion.athletes],
 measurements:[...initial.measurements,...batch.measurements,...expansion.measurements],
 ascents:[...initial.ascents,...batch.ascents,...expansion.ascents],
 clinical:[...initial.clinical,...batch.clinical,...expansion.clinical],
 grade_claims:[...initial.grade_claims,...expansion.grade_claims],
 queue:[...[...initial.queue.map(q=>({...q,...batch.queue_updates[q.id]})),...batch.queue].map(q=>({...q,...expansion.queue_updates[q.id]})),...expansion.queue],
 batches:[{id:initial.batch_id},{id:batch.id,added_sources:batch.sources.length,added_athletes:batch.athletes.length,added_measurements:batch.measurements.length,added_ascents:batch.ascents.length,added_clinical:batch.clinical.length},{id:expansion.id,added_sources:expansion.sources.length,added_athletes:expansion.athletes.length,added_measurements:expansion.measurements.length,added_ascents:expansion.ascents.length,added_clinical:expansion.clinical.length,added_grade_claims:expansion.grade_claims.length}]
};
