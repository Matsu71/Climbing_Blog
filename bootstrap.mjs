import {articles,paths} from './data/articles.mjs';

const featuredArticle={
  id:'ideal-climber-body-type',
  category:'身体・能力',
  title:'理想的なクライマーの体型は？ 男子トップ選手の身長・体重・リーチ比較',
  answer:'トップクラスに単一の理想身長はありません。2024〜2025年に活躍する男子ボルダラーを中心に、身長・体重・リーチを比較します。',
  sections:[
    {title:'2025年トップ級ボルダラーの体格',text:'安楽宙斗：168 cm／約57 kg（推測）／リーチ約181 cm。Mejdi Schalck：172〜173 cm／約58 kg（推測）／約180〜181 cm。天笠颯太：175 cm／約60 kg（推測）／約180 cm（推測）。Lee Dohyun：176 cm／約60 kg（推測）／約181 cm（推測）。Hannes Van Duysen：173〜175 cm／約60 kg（推測）／約178〜180 cm（推測）。Paul Jenft：190 cm／約72 kg（推測）／約195 cm（推測）。楢﨑智亜：169〜170 cm／58〜60 kg／約180 cm。Anže Peharc：177 cm／約64 kg（推測）／約180 cm。楢﨑明智：186〜187 cm／65 kg／約192 cm（推測）。Pan Yufei：約173 cm／約60 kg（推測）／約178 cm（推測）。'},
    {title:'身長・体重の公開値を確認しやすいトップ選手',text:'楢﨑智亜：169〜170 cm・58〜60 kg。楢﨑明智：186〜187 cm・65 kg。藤井快：176 cm・64 kg。Nathaniel Coleman：約180 cm・約70 kg。Sean McColl：約169 cm・約60 kg。Jongwon Chon：約176〜177 cm・約57〜60 kg。Adam Ondra：約186 cm・約70 kg。Jakob Schubert：約176 cm・約63 kg。Stefano Ghisolfi：約170 cm・約58 kg。Alex Megos：約173〜175 cm・約57 kg。Jan Hojer：約188 cm・約77 kg。Jernej Kruder：約180 cm・約71 kg。Tom O’Halloran：約180 cm・約67〜68 kg。'},
    {title:'リーチとApe Index',text:'楢﨑智亜は約180 cmで身長差は約+10 cm、Jan Hojerも約+10 cm。Jongwon Chonは約+6〜7 cm、Stefano Ghisolfiは約+4 cm。一方、Adam Ondraは約+1 cm、Alex Megosはほぼ0 cmとされます。長いリーチは有利になる場面がありますが、世界最高水準に必須ではありません。'},
    {title:'数字から見える体型の傾向',text:'160 cm台後半から190 cm前後まで世界トップレベルの選手が存在し、単一の理想身長はありません。体重は同身長の一般男性より軽量な例が多いものの幅があります。競技力は体重そのものより、体重に対する指力・引く力、技術、可動域、協調性などとの組み合わせで考える必要があります。'},
    {title:'データを見るときの注意',text:'体重は登録時点の値で現在値とは限りません。成長期から国際大会に出る選手では古い身長・体重が残っていることがあります。Lee Dohyunは古い166 cmではなく、成人後のより新しい176 cmを採用しています。「推測」とした値は公式測定値ではなく比較用の参考値です。'}
  ],
  sources:[],tool:null,deep:null,updated:'2026-09-13',review:'AI支援による編集・公開プロフィールを基に整理'
};

// Keep the repository data intact; limit only the public runtime view.
articles.splice(0,articles.length,featuredArticle);
paths.splice(0,paths.length);

const {configureBase,render}=await import('./src/render.mjs');
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
const compact=document.createElement('link');compact.rel='stylesheet';compact.href=base+'compact.css';document.head.appendChild(compact);
const style=document.createElement('style');style.textContent='html:not(.js) .js-only{display:none!important}html.js .filters,html.js .view-controls,html.js .compare-pick{display:flex!important}html.js .grid.js-only{display:grid!important}html.js .save{display:inline-flex!important}html.js [hidden]{display:none!important}.question-strip{display:none!important}';document.head.appendChild(style);
await import('./app.mjs');
