import {esc,matches} from './core.mjs';
import {NOTEBOOK_KEY,MAX_NOTES,MAX_IMPORT_BYTES,noteStates,noteFocus,validateNote,parseNotebook,mergeNotes,notebookDocument,noteSummary} from './notebook-model.mjs';

/** Explicit local storage only. Corrupt or concurrently edited records are never overwritten. */
export function initNotebook({base,download}) {
  const root=document.querySelector('[data-notebook]');
  if(!root)return;
  const $=s=>root.querySelector(s),form=$('[data-note-form]'),status=$('[data-note-status]');
  const field=name=>form.elements.namedItem(name);
  let editing=null,dirty=false;
  const say=text=>{status.textContent=text;};
  const read=()=>{
    const value=localStorage.getItem(NOTEBOOK_KEY);
    return value===null?[]:parseNotebook(value);
  };
  const write=notes=>{
    if(notes.length>MAX_NOTES)throw new RangeError('最大250件です。必要な記録を書き出して整理してください。');
    localStorage.setItem(NOTEBOOK_KEY,JSON.stringify(notebookDocument(notes)));
  };
  const newID=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():[...crypto.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const clearForm=()=>{
    form.reset();field('id').value='';field('date').value=today();editing=null;dirty=false;
    $('#note-form-title').textContent='トライを記録';$('[data-note-save]').textContent='記録を保存';
  };
  const canDiscard=()=>!dirty||confirm('未保存の入力を破棄して切り替えますか？');
  const errorText=error=>'記録を変更していません。'+(error instanceof RangeError?error.message:'保存領域を利用できません。ブラウザーの設定を確認してください。');
  const render=()=>{
    let notes;
    try{notes=read();}
    catch(error){$('[data-note-list]').innerHTML='<div class="empty"><h3>保存した記録を読み込めません。</h3><p>破損した記録や保存設定を確認してください。元の保存を上書きしません。</p></div>';say(errorText(error));return;}
    const sum=noteSummary(notes);
    $('[data-note-summary]').innerHTML=`<span><b>${sum.entries}</b>記録</span><span><b>${sum.dates}</b>記録した日</span><span><b>${sum.projects}</b>取り組み中の記録</span>`;
    const q=$('[data-note-query]').value,result=$('[data-note-result]').value;
    const rows=notes.filter(n=>(!result||n.result===result)&&matches([n.name,n.grade,n.observation,n.next,noteFocus[n.focus]].join(' '),q)).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
    $('[data-note-count]').textContent=`${rows.length} / ${notes.length}件を表示。件数は課題数・能力・完登率ではありません。`;
    $('[data-note-list]').innerHTML=rows.length?rows.map(n=>`<article class="note-card" data-note-id="${esc(n.id)}"><div class="card-meta"><time datetime="${esc(n.date)}">${esc(n.date)}</time><span class="badge">${esc(noteStates[n.result])}</span></div><h3>${esc(n.name)}</h3><p class="micro">${n.discipline==='boulder'?'ボルダー':'リード・スポート'}${n.grade?' / '+esc(n.grade):''} / この日のトライ ${n.attempts}回</p><p class="micro">観察：${esc(noteFocus[n.focus])}</p>${n.observation?`<p class="note-text">${esc(n.observation)}</p>`:''}${n.next?`<div class="next-move"><strong>次に、一つ試すなら</strong><p class="note-text">${esc(n.next)}</p></div>`:''}<div class="inline-actions"><button type="button" data-note-edit="${esc(n.id)}" class="button ghost" aria-label="${esc(n.name)}の記録を編集">編集</button><button type="button" data-note-delete="${esc(n.id)}" class="text-button" aria-label="${esc(n.name)}の記録を削除">削除</button></div></article>`).join(''):`<div class="empty"><h3>${notes.length?'一致する記録がありません。':'最初の発見を、ここに。'}</h3><p>${notes.length?'検索語や結果の条件を変えてください。':'登れた日も、登れなかった日も。次に試すことを一つだけ記録しましょう。'}</p><a href="${esc(base+'read/projecting-notes/')}">観察メモの残し方を読む →</a></div>`;
  };
  clearForm();render();
  form.addEventListener('input',()=>{dirty=true;});
  form.addEventListener('change',()=>{dirty=true;});
  form.addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const raw=Object.fromEntries(new FormData(form));
      raw.id=editing?.id??newID();raw.attempts=Number(raw.attempts);
      const note=validateNote(raw),notes=read();
      if(editing){
        const index=notes.findIndex(n=>n.id===editing.id);
        if(index===-1||JSON.stringify(notes[index])!==JSON.stringify(editing))throw new RangeError('別のタブで記録が更新・削除されました。最新版を開き直してください。入力は残しています。');
        notes[index]=note;
      }else notes.push(note);
      write(notes);clearForm();render();say('このブラウザーに記録を保存しました。');
    }catch(error){say(errorText(error));}
  });
  $('[data-note-new]').addEventListener('click',()=>{if(canDiscard()){clearForm();say('新しい記録を入力できます。');field('name').focus();}});
  for(const event of ['input','change'])for(const name of ['[data-note-query]','[data-note-result]'])$(name).addEventListener(event,render);
  root.addEventListener('click',event=>{
    const edit=event.target.closest('[data-note-edit]'),del=event.target.closest('[data-note-delete]');
    if(edit){
      if(!canDiscard())return;
      try{
        const note=read().find(n=>n.id===edit.dataset.noteEdit);
        if(!note)throw new RangeError('この記録は別のタブで削除されました。');
        editing=note;for(const [key,value] of Object.entries(note))field(key).value=value;
        dirty=false;$('#note-form-title').textContent='記録を編集';$('[data-note-save]').textContent='編集を保存';say('保存すると、この記録だけを更新します。');
        $('#note-form-title').scrollIntoView({block:'start',behavior:'auto'});field('name').focus({preventScroll:true});
      }catch(error){say(errorText(error));}
    }
    if(del){
      if(!confirm('この1件の記録を削除しますか？元に戻せません。'))return;
      try{const notes=read();write(notes.filter(n=>n.id!==del.dataset.noteDelete));if(editing?.id===del.dataset.noteDelete)clearForm();render();say('1件の記録を削除しました。');}catch(error){say(errorText(error));}
    }
  });
  $('[data-note-export]').addEventListener('click',()=>{
    try{const notes=read();download('crux-notebook-'+today()+'.json',notebookDocument(notes));say(`${notes.length}件を書き出しました。未保存の入力は含みません。`);}catch(error){say(errorText(error));}
  });
  $('[data-note-import]').addEventListener('change',async event=>{
    const input=event.target,file=input.files?.[0];if(!file)return;
    try{
      if(file.size>MAX_IMPORT_BYTES)throw new RangeError('読み込めるJSONは1MBまでです。');
      const incoming=parseNotebook(await file.text()),preview=mergeNotes(read(),incoming);
      if(!confirm(`${preview.added}件を追加、${preview.skipped}件は同じIDのため変更しません。読み込みますか？`)){say('読み込みを取り消しました。');return;}
      const merged=mergeNotes(read(),incoming); // Re-read after confirmation, do not replace concurrent changes.
      write(merged.notes);render();say(`${merged.added}件を追加しました。同じIDの${merged.skipped}件は変更していません。`);
    }catch(error){say(errorText(error));}finally{input.value='';}
  });
  window.addEventListener('storage',event=>{if(event.key===NOTEBOOK_KEY||event.key===null){render();say('別のタブの変更を一覧へ反映しました。編集中の入力は残しています。');}});
}
