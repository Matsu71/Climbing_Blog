import {esc} from './core.mjs';
import {gymRows,gymSelection} from './gym-model.mjs';

/** Gym selection remains independent of list filters and is encoded in the URL. */
export function initGymComparison({base,gyms,toast}) {
  const panel=document.querySelector('[data-gym-comparison]');
  if (!panel || !Array.isArray(gyms)) return;
  const all=s=>[...document.querySelectorAll(s)];
  const dock=document.querySelector('[data-gym-dock]');
  let selected=[];
  const syncURL=()=>{
    const u=new URL(location.href);
    if(selected.length)u.searchParams.set('compare',selected.join(','));
    else u.searchParams.delete('compare');
    history.replaceState(null,'',u.pathname+u.search+u.hash);
  };
  const render=()=>{
    all('[data-gym-compare]').forEach(el=>{el.checked=selected.includes(el.dataset.gymCompare);});
    panel.hidden=dock.hidden=!selected.length;
    document.body.classList.toggle('has-gym-comparison',!!selected.length);
    document.querySelector('[data-gym-selection-count]').textContent=`${selected.length} / 3施設を選択`;
    if(!selected.length){panel.innerHTML='';return;}
    const rows=selected.map(id=>gyms.find(g=>g.id===id));
    const fields=gymRows(rows[0]).map(([name])=>name);
    panel.innerHTML=`<div class="section-head"><div><p class="eyebrow">COMPARE YOUR NEXT WALL</p><h2>選んだジムを並べる。</h2></div><button type="button" data-gym-share class="button ghost">比較リンクをコピー</button></div>
      <p class="micro">${rows.length===1?'あと1〜2施設を選ぶと比較できます。':''}横にスクロールして比較。未確認の設備を「なし」とは扱いません。</p>
      <div class="table-scroll" role="region" tabindex="0" aria-label="選択したジムの比較表"><table class="comparison-table gym-comparison-table"><caption class="sr-only">選択した${rows.length}施設の公式情報</caption><thead><tr><th scope="col">比較項目</th>${rows.map(g=>`<th scope="col"><a href="${esc(base+'gyms/'+g.id+'/')}">${esc(g.name)}</a><button type="button" data-gym-remove="${esc(g.id)}" aria-label="${esc(g.name)}を比較から外す">比較から外す</button></th>`).join('')}</tr></thead><tbody>${fields.map((label,i)=>`<tr><th scope="row">${esc(label)}</th>${rows.map(g=>`<td>${esc(gymRows(g)[i][1])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  };
  const fromURL=()=>{selected=gymSelection(new URLSearchParams(location.search).get('compare'),gyms);render();};
  fromURL();
  // Discard invalid/duplicate IDs without changing filter defaults.
  if(new URLSearchParams(location.search).has('compare'))syncURL();
  window.addEventListener('popstate',fromURL);
  document.addEventListener('change',event=>{
    const input=event.target;
    if(!input.matches('[data-gym-compare]'))return;
    const id=input.dataset.gymCompare;
    if(input.checked&&!selected.includes(id)){
      if(selected.length===3){input.checked=false;toast('比較できるのは最大3施設です。先に1施設外してください。');return;}
      selected.push(id);
    }else selected=selected.filter(x=>x!==id);
    render();syncURL();
  });
  document.addEventListener('click',async event=>{
    const remove=event.target.closest('[data-gym-remove]');
    if(remove){selected=selected.filter(id=>id!==remove.dataset.gymRemove);render();syncURL();toast('比較から外しました。');}
    if(event.target.closest('[data-gym-clear]')){selected=[];render();syncURL();toast('ジムの比較を解除しました。');}
    if(event.target.closest('[data-gym-show]')){panel.scrollIntoView({behavior:'auto',block:'start'});panel.focus({preventScroll:true});}
    if(event.target.closest('[data-gym-share]')){
      syncURL();try{await navigator.clipboard.writeText(location.href);toast('比較リンクをコピーしました。');}
      catch{toast('コピーできませんでした。アドレスバーのURLを共有してください。');}
    }
  });
}
