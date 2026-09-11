/** Research comparison is descriptive: never pool different populations or outcomes. */
export function researchSelection(value, studies) {
  const ids=new Set(studies.map(s=>s.id));
  return [...new Set(String(value??'').slice(0,500).split(',').filter(id=>ids.has(id)))].slice(0,3);
}
export function performanceLabel(study) {
  return study.performance_test===true?'登攀課題の実測あり':study.performance_test===false?'登攀課題の効果は未測定':'未分類・文献／記録解析';
}
export function researchRows(s) {
  return [['発表年',String(s.year)],['研究デザイン',s.design],['対象',s.participants],['人数の段階',s.sample_stage],
    ['期間',s.duration],['確認範囲',s.access_level],['測ったもの',s.outcomes.join(' / ')],
    ['登攀課題の実測',performanceLabel(s)],['主な結果',s.finding],['限界',s.limit],
    ['確認した箇所',s.source_locator]];
}
export function measurementRows(data) {
  return data.metrics.flatMap(m=>m.groups.flatMap(g=>['pre','post'].map(phase=>({study_id:data.study_id,source_id:data.source_id,source_locator:data.source_locator,outcome:m.label,unit:m.unit,group:g.name,n:g.n,phase:phase==='pre'?'介入前':'介入後',mean:g[phase],standard_deviation:g[phase+'_sd']}))));
}
export function validateMeasurements(data) {
  if(!data||!Array.isArray(data.metrics)||!data.metrics.length)throw new RangeError('測定項目がありません');
  const ids=new Set();
  for(const m of data.metrics){
    if(typeof m.id!=='string'||!/^[a-z0-9-]+$/.test(m.id)||ids.has(m.id))throw new RangeError('測定IDが不正です');
    ids.add(m.id);
    if(!Number.isFinite(m.axis_max)||m.axis_max<=0||!Array.isArray(m.groups)||m.groups.length!==2)throw new RangeError('測定軸または群が不正です');
    for(const g of m.groups){
      if(!Number.isInteger(g.n)||g.n<1)throw new RangeError('人数が不正です');
      for(const phase of ['pre','post']){
        const mean=g[phase],sd=g[phase+'_sd'];
        if(!Number.isFinite(mean)||!Number.isFinite(sd)||mean<0||sd<0||mean+sd>m.axis_max)throw new RangeError('測定値または軸の範囲が不正です');
      }
    }
  }
  return data;
}
