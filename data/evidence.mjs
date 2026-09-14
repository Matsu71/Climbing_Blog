import {evidence as initial} from './evidence-initial.mjs';
import {batch} from './evidence-additions.mjs';
// Previous source claims remain intact. Only progress metadata is updated by ID.
export const evidence={
 ...initial,
 coverage:"対象を絞った収集途中のデータ。世界全体の順位・再登総数・理想体型ではない。",
 batch_id:batch.id,
 collection_complete:false,
 expert_reviewed:false,
 sources:[...initial.sources,...batch.sources],
 athletes:[...initial.athletes,...batch.athletes],
 measurements:[...initial.measurements,...batch.measurements],
 ascents:[...initial.ascents,...batch.ascents],
 clinical:[...initial.clinical,...batch.clinical],
 queue:[...initial.queue.map(q=>({...q,...batch.queue_updates[q.id]})),...batch.queue],
 batches:[{id:initial.batch_id},{id:batch.id,added_sources:batch.sources.length,added_athletes:batch.athletes.length,added_measurements:batch.measurements.length,added_ascents:batch.ascents.length,added_clinical:batch.clinical.length}]
};
