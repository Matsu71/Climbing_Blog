import {configureBase,render} from './src/render.mjs';

const base='/Climbing_Blog/';
configureBase(base);

function resolveRoute(){
  let path=location.pathname;
  if(path.startsWith(base)) path=path.slice(base.length);
  path=decodeURIComponent(path).replace(/^\/+|\/+$/g,'');
  if(!path||path==='index.html') return ['home',null];
  const parts=path.split('/').filter(Boolean);
  const view=parts[0];
  const id=parts[1]||null;
  const allowed=new Set(['read','climbs','athletes','research','gyms','glossary','notebook','gym-history','tools','quiz','search','saved','quality','data','privacy']);
  if(!allowed.has(view)||parts.length>2) return ['404',null];
  return [view,id];
}

const [view,id]=resolveRoute();
let html;
try{html=render(view,id,location.origin);}catch{html=render('404',null,location.origin);}
const parsed=new DOMParser().parseFromString(html,'text/html');
parsed.querySelector('script[src$="app.mjs"]')?.remove();
document.documentElement.lang=parsed.documentElement.lang||'ja';
document.head.replaceChildren(...[...parsed.head.childNodes].map(node=>document.importNode(node,true)));
document.body.replaceWith(document.importNode(parsed.body,true));
const style=document.createElement('style');
style.textContent='html:not(.js) .js-only{display:none!important}html.js .filters,html.js .view-controls,html.js .compare-pick{display:flex!important}html.js .grid.js-only{display:grid!important}html.js .save{display:inline-flex!important}html.js [hidden]{display:none!important}';
document.head.appendChild(style);
await import('./app.mjs');
