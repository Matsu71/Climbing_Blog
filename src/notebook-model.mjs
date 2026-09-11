import {validDate} from './core.mjs';
export const NOTEBOOK_KEY='crux:v1:notebook';
export const MAX_NOTES=250;
export const MAX_IMPORT_BYTES=1024*1024;
export const noteStates={project:'取り組み中',sent:'完登',flash:'フラッシュ'};
export const noteFocus={unknown:'まだ分からない',feet:'足・重心',grip:'ホールドの保持',link:'ムーブをつなぐ',fear:'怖さ・迷い'};
const clean=(v,max,label,required=false)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new RangeError(label+'の入力を確認してください。');return v.trim();};
export function validateNote(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new RangeError('記録の形式が正しくありません。');
  const id=clean(raw.id,80,'記録ID',true);
  if(!/^[a-z0-9-]{8,80}$/.test(id))throw new RangeError('記録IDの形式が正しくありません。');
  const date=clean(raw.date,10,'日付',true);
  if(!validDate(date,'day'))throw new RangeError('実在する日付を入力してください。');
  if(!['boulder','sport'].includes(raw.discipline))throw new RangeError('種目を選んでください。');
  if(!Object.hasOwn(noteStates,raw.result))throw new RangeError('結果を選んでください。');
  if(!Object.hasOwn(noteFocus,raw.focus))throw new RangeError('気になった点を選んでください。');
  if(!Number.isInteger(raw.attempts)||raw.attempts<1||raw.attempts>9999)throw new RangeError('トライ数は1〜9999の整数で入力してください。');
  if(raw.result==='flash'&&raw.attempts!==1)throw new RangeError('フラッシュのトライ数は1です。その課題への初回完登を意味します。');
  return {id,date,discipline:raw.discipline,name:clean(raw.name,120,'課題名',true),grade:clean(raw.grade,30,'グレード'),attempts:raw.attempts,result:raw.result,focus:raw.focus,observation:clean(raw.observation,2000,'観察メモ'),next:clean(raw.next,1000,'次に試すこと')};
}
export function parseNotebook(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>MAX_IMPORT_BYTES)throw new RangeError('読み込めるJSONは1MBまでです。');
  let doc;try{doc=JSON.parse(text);}catch{throw new RangeError('JSONとして読み込めませんでした。');}
  if(!doc||doc.schema_version!==1||!Array.isArray(doc.notes)||doc.notes.length>MAX_NOTES)throw new RangeError('対応しているノート形式ではありません。最大250件です。');
  const notes=doc.notes.map(validateNote);
  if(new Set(notes.map(x=>x.id)).size!==notes.length)throw new RangeError('ファイル内で記録IDが重複しています。');
  return notes;
}
export function mergeNotes(existing,incoming){
  const old=existing.map(validateNote),fresh=incoming.map(validateNote),ids=new Set(old.map(n=>n.id));
  const additions=fresh.filter(n=>!ids.has(n.id));
  if(new Set(fresh.map(n=>n.id)).size!==fresh.length||ids.size!==old.length)throw new RangeError('記録IDの重複を確認してください。');
  if(old.length+additions.length>MAX_NOTES)throw new RangeError('統合後に250件を超えます。既存の記録は変更していません。');
  return {notes:[...old,...additions],added:additions.length,skipped:fresh.length-additions.length};
}
export const notebookDocument=notes=>({schema_version:1,notes:notes.map(validateNote)});
export function noteSummary(notes){
  const rows=notes.map(validateNote);
  return {entries:rows.length,dates:new Set(rows.map(n=>n.date)).size,projects:rows.filter(n=>n.result==='project').length,sends:rows.filter(n=>n.result!=='project').length};
}
