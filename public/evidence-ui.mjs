import {prepareEvidenceExport,evidenceCSVRows} from './data/evidence-export.mjs';
// Local downloads also work on branch-based Pages, where JSON build outputs are absent.
// Deep links must also work when a query would otherwise hide the target row.
function revealRecord(){
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=document.getElementById(id);
  if(!target?.matches('[data-item]'))return;
  if(target.hidden)document.querySelector('[data-filter]')?.reset();
  if(target.matches('details'))target.open=true;
  target.tabIndex=-1;
  target.focus({preventScroll:true});
  target.scrollIntoView({block:'start'});
}
revealRecord();window.addEventListener('hashchange',revealRecord);
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-evidence-download]');if(!button)return;
  const name=button.dataset.evidenceDownload;
  if(!/^evidence(?:-(?:sources|measurements|ascents|clinical))?\.(?:json|csv)$/.test(name))return;
  const scope=button.closest('[data-export-panel]')?.querySelector('[data-export-scope]')?.value??'all';
  const visibleIds=[...document.querySelectorAll('[data-results] [data-item]')].filter(x=>!x.hidden).map(x=>x.dataset.recordId);
  const form=document.querySelector('[data-filter]');
  const filters=form?Object.fromEntries(new FormData(form)):{};
  button.disabled=true;
  try{
    const {evidence}=await import('./data/evidence.mjs');
    const {csv}=await import('./core.mjs');
    const key=name.replace(/^evidence-?/,'').replace(/\.(json|csv)$/,'');
    const bundle=key?prepareEvidenceExport(evidence,key,{scope,visibleIds,filters}):null;
    const isCSV=name.endsWith('.csv');
    const rows=bundle?(scope==='visible'?evidenceCSVRows(bundle):bundle.rows):null;
    const payload=bundle?(scope==='visible'?bundle:bundle.rows):evidence;
    const text=isCSV?csv(rows,[...new Set(rows.flatMap(Object.keys))]):JSON.stringify(payload,null,2)+'\n';
    const blob=new Blob([text],{type:isCSV?'text/csv;charset=utf-8':'application/json;charset=utf-8'});
    const address=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=address;link.download=scope==='visible'?name.replace(/\.(json|csv)$/,'-filtered.$1'):name;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(address),1000);
  }catch{const toast=document.querySelector('[data-toast]');if(toast){toast.textContent='書き出せませんでした。再読み込みしてお試しください。';toast.hidden=false;}}
  finally{button.disabled=false;syncEvidenceContext();}
});

// Keep secondary filters discoverable when restored from a shared URL.
function syncEvidenceContext(){
 const form=document.querySelector('[data-filter]');
 if(!form)return;
 for(const detail of form.querySelectorAll('.filter-extra')){
  if([...detail.querySelectorAll('[name]')].some(x=>x.value.trim()))detail.open=true;
 }
 for(const panel of document.querySelectorAll('[data-export-panel]')){
  const selected=panel.querySelector('[data-export-scope]').value==='visible';
  const count=[...document.querySelectorAll('[data-results] [data-item]')].filter(x=>!selected||!x.hidden).length;
  panel.querySelector('[data-export-count]').textContent=count+(document.querySelector('body [id^="athlete-"]')?'人':'件');
  const note=panel.nextElementSibling;if(note?.matches('[data-export-note]'))note.hidden=!selected;
  for(const button of panel.querySelectorAll('[data-evidence-download]'))button.disabled=selected&&count===0;
 }
 const history=document.querySelector('[data-grade-history]');
 if(history){
  const climbs=new Set([...document.querySelectorAll('tbody [data-item]')].filter(x=>!x.hidden).map(x=>x.dataset.climb));
  for(const claim of history.querySelectorAll('[data-grade-climb]'))claim.hidden=!climbs.has(claim.dataset.gradeClimb);
  history.hidden=![...history.querySelectorAll('[data-grade-climb]')].some(x=>!x.hidden);
 }
}
syncEvidenceContext();
for(const event of ['input','change','reset'])document.querySelector('[data-filter]')?.addEventListener(event,()=>queueMicrotask(syncEvidenceContext));
window.addEventListener('popstate',()=>queueMicrotask(syncEvidenceContext));
window.addEventListener('hashchange',()=>queueMicrotask(syncEvidenceContext));

for(const select of document.querySelectorAll('[data-export-scope]'))select.addEventListener('change',syncEvidenceContext);

// Preserve links created before the reviewed name correction. This is not fuzzy matching.
function restoreReviewedClimbAlias(){
 const params=new URLSearchParams(location.search),control=document.querySelector('[name=climb]');
 if(!control||params.get('climb')!=='Supercrackinette'||(params.get('discipline')&&params.get('discipline')!=='スポート'))return;
 control.value='Super Crackinette';control.dispatchEvent(new Event('change',{bubbles:true}));
}
if(document.documentElement.dataset.ready==='true')restoreReviewedClimbAlias();
else document.addEventListener('DOMContentLoaded',restoreReviewedClimbAlias,{once:true});
