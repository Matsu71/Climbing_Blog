import {configureBase,render} from './src/render.mjs';
const base='/Climbing_Blog/';
configureBase(base);
function route(){
  let path=location.pathname.startsWith(base)?location.pathname.slice(base.length):location.pathname;
  try{path=decodeURIComponent(path).replace(/^\/+|\/+$/g,'');}catch{return ['404',null];}
  if(!path||path==='index.html')return ['home',null];
  const parts=path.split('/');
  const allowed=new Set(['read','climbs','athletes','research','gyms','glossary','notebook','gym-history','tools','quiz','search','saved','quality','data','privacy','athlete-data','ascent-data','injury-data','evidence']);
  return allowed.has(parts[0])&&parts.length<=2?[parts[0],parts[1]||null]:['404',null];
}
const [view,id]=route();
let html;
try{html=render(view,id,location.origin);}catch{html=render('404',null,location.origin);}
const parsed=new DOMParser().parseFromString(html,'text/html');
parsed.querySelectorAll('script[type="module"]').forEach(n=>n.remove());
document.documentElement.lang='ja';
document.head.replaceChildren(...[...parsed.head.childNodes].map(n=>document.importNode(n,true)));
document.body.replaceWith(document.importNode(parsed.body,true));
const style=document.createElement('style');
style.textContent='html:not(.js) .js-only{display:none!important}html.js .filters,html.js .view-controls,html.js .compare-pick{display:flex!important}html.js .grid.js-only{display:grid!important}html.js .save{display:inline-flex!important}html.js [hidden]{display:none!important}';
document.head.appendChild(style);
await import('./app.mjs');
await import('./evidence-ui.mjs');
