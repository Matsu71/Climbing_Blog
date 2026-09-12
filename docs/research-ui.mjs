import {researchSelection} from './research-model.mjs';
import {renderResearchComparison} from './research-render.mjs';

/** Preserve independent comparison state across filters, refresh and back/forward. */
export function initResearch({base,studies,toast}) {
  const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
  const metric=$('[data-measurement-select]');
  if(metric){
    const apply=()=>all('[data-measurement-panel]').forEach(panel=>{panel.hidden=panel.dataset.measurementPanel!==metric.value;});
    metric.addEventListener('change',apply);apply();
  }
  const panel=$('[data-research-comparison]'),dock=$('[data-research-dock]');
  if(!panel||!dock||!Array.isArray(studies))return;
  let selected=[];
  const syncURL=()=>{
    const u=new URL(location.href);
    if(selected.length)u.searchParams.set('compare',selected.join(','));else u.searchParams.delete('compare');
    history.replaceState(null,'',u.pathname+u.search+u.hash);
  };
  const draw=()=>{
    all('[data-research-compare]').forEach(input=>{input.checked=selected.includes(input.dataset.researchCompare);});
    panel.hidden=dock.hidden=!selected.length;
    document.body.classList.toggle('has-research-comparison',!!selected.length);
    $('[data-research-count]').textContent=`${selected.length} / 3研究を選択`;
    panel.innerHTML=renderResearchComparison(selected,studies,base);
  };
  const restore=()=>{selected=researchSelection(new URLSearchParams(location.search).get('compare'),studies);draw();};
  restore();if(new URLSearchParams(location.search).has('compare'))syncURL();
  window.addEventListener('popstate',restore);
  document.addEventListener('change',event=>{
    const input=event.target;
    if(!input.matches('[data-research-compare]'))return;
    const id=input.dataset.researchCompare;
    if(!studies.some(s=>s.id===id)){input.checked=false;return;}
    if(input.checked&&!selected.includes(id)){
      if(selected.length===3){input.checked=false;toast('研究の比較は最大3件です。先に1件外してください。');return;}
      selected.push(id);
    }else selected=selected.filter(x=>x!==id);
    draw();syncURL();
  });
  document.addEventListener('click',async event=>{
    const remove=event.target.closest('[data-research-remove]');
    if(remove){
      const id=remove.dataset.researchRemove;
      selected=selected.filter(x=>x!==id);draw();syncURL();
      // Re-rendering a table must not leave keyboard users on the body element.
      const target=$(`[data-research-compare="${id}"]`);
      if(target&&!target.closest('[hidden]'))target.focus();else if(selected.length)panel.focus();else $('[data-filter] input')?.focus();
      toast('研究の比較から外しました。');
    }
    if(event.target.closest('[data-research-show]')){panel.scrollIntoView({behavior:'auto',block:'start'});panel.focus({preventScroll:true});}
    if(event.target.closest('[data-research-clear]')){selected=[];draw();syncURL();$('[data-filter] input')?.focus();toast('研究の比較を解除しました。');}
    if(event.target.closest('[data-research-share]')){
      syncURL();try{await navigator.clipboard.writeText(location.href);toast('研究の比較リンクをコピーしました。');}
      catch{toast('コピーできませんでした。アドレスバーのURLを共有してください。');}
    }
  });
}
