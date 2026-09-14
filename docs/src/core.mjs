// Shared pure functions. The models are educational, not medical or performance predictions.
export const normalize=v=>String(v??'').normalize('NFKC').toLocaleLowerCase('ja').replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/\s+/g,' ').trim();
export const matches=(text,q)=>normalize(q).split(' ').filter(Boolean).every(t=>normalize(text).includes(t));
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const json=v=>JSON.stringify(v).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export function https(v){try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function number(v,min,max,label='値'){if(!['string','number'].includes(typeof v)||(typeof v==='string'&&!v.trim()))throw new RangeError(label+'を入力してください。');const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw new RangeError(`${label}は${min}〜${max}で入力してください。`);return n;}
export function support(m,x){m=number(m,1,300,'質量');x=number(x,0,1,'位置');const weight=m*9.80665;return{weight,left:weight*(1-x),right:weight*x};}
export const friction=(n,mu)=>number(n,0,2000,'法線力')*number(mu,0,2,'仮の摩擦係数');
export function load(m,a,r){m=number(m,1,300,'体重');a=number(a,0,300,'追加重量');r=number(r,0,300,'除荷重量');if(r>m+a)throw new RangeError('除荷重量が総重量を超えています。');return{total:m+a-r,percent:(m+a-r)/m*100};}
export function ape(h,s){h=number(h,50,250,'身長');s=number(s,50,300,'腕を広げた長さ');return{difference:s-h,ratio:s/h};}
export function week(days){if(!Array.isArray(days)||days.length!==7||days.some(d=>!['rest','skill','hard','volume'].includes(d)))throw new RangeError('7日分の種別を選択してください。');return{hard:days.filter(d=>d==='hard').length,rest:days.filter(d=>d==='rest').length,adjacent:days.filter((d,i)=>d==='hard'&&days[(i+1)%7]==='hard').length};}
export function validDate(v,p){if(v===null)return p==='unknown';const r={year:/^\d{4}$/,month:/^\d{4}-(0[1-9]|1[0-2])$/,day:/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/}[p];if(!r?.test(v))return false;if(p==='day'){const d=new Date(v+'T00:00:00Z');return !Number.isNaN(+d)&&d.toISOString().slice(0,10)===v;}return true;}
export function csv(rows,fields){const cell=v=>{let t=v==null?'':Array.isArray(v)?(v.some(x=>x!==null&&typeof x==='object')?JSON.stringify(v):v.join(' | ')):typeof v==='object'?JSON.stringify(v):String(v);if(/^[=+\-@\t\r]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';};return '\ufeff'+[fields,...rows.map(r=>fields.map(f=>r[f]))].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';}
