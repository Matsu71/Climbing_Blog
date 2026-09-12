import {esc as e} from './core.mjs';
import {gyms,sources,checkedAt} from '../data/catalog.mjs';
import {glossary} from '../data/glossary.mjs';
const unique = xs => [...new Set(xs)];
import {gymStatus,gymRows} from './gym-model.mjs';
export function renderGymIndex(h) {
  const {heading,note,filterForm,link,tag,url} = h;
  const listed=gyms.filter(g=>g.status==='listed').length;
  let filters=filterForm([['prefecture','都道府県',unique(gyms.map(g=>g.prefecture))],
    ['discipline','確認済みの種目',unique(gyms.flatMap(g=>g.disciplines))],
    ['brand','運営・ブランド',unique(gyms.map(g=>g.brand))],
    ['status','掲載状態',['営業案内あり','閉店（履歴）']]]);
  filters=filters.replace('name="status"','name="status" data-default="営業案内あり"');
  return heading('FIND YOUR NEXT WALL','次は、どこで登ろう。','種目・場所・設備を並べて、次の壁を選ぶ。公式情報まで、ひと続きに。')+
    `<div class="coverage-strip"><span><b>${listed}</b> 営業案内あり</span><span><b>${gyms.length-listed}</b> 閉店履歴</span><span><b>${unique(gyms.map(g=>g.prefecture)).length}</b> 都道府県の収録</span></div>`+
    note('収録施設の比較です。全国のジム総数ではありません。','「営業案内あり」は公式ページの確認を意味し、本日営業中という意味ではありません。未確認の設備は「なし」にしません。')+
    `<nav class="inline-actions">${link('gym-history/','開閉店履歴の読み方 →')}${link('read/choose-gym/','ジム選びの比較軸 →')}${link('data/gyms.csv','施設データをCSVで見る →')}</nav>`+
    filters+`<section data-gym-comparison class="comparison-panel js-only" id="gym-comparison" tabindex="-1" aria-label="ジムの比較" hidden></section>`+
    `<div class="grid three" data-results>${gyms.map(g=>`<article class="card gym" data-item data-search="${e([g.name,g.address,g.access,g.summary].join(' '))}" data-prefecture="${e(g.prefecture)}" data-discipline="${e(g.disciplines.join('|'))}" data-brand="${e(g.brand)}" data-status="${e(gymStatus(g))}">
      <div class="card-meta"><span class="eyebrow">${e(g.prefecture)} / ${e(g.municipality)}</span><span class="status-badge ${g.status==='closed'?'closed':''}">${e(gymStatus(g))}</span></div>
      <h2>${link('gyms/'+g.id+'/',e(g.name))}</h2><div>${g.disciplines.map(tag).join('')}</div><p>${e(g.summary)}</p><p class="micro">${e(g.address)}</p>
      ${g.closed_date?`<p class="closure-date">閉店日 ${e(g.closed_date)}</p>`:''}
      <label class="compare-pick js-only"><input type="checkbox" data-gym-compare="${e(g.id)}"> <span>${e(g.name)}を比較</span></label>
    </article>`).join('')}</div>
    <div class="compare-dock js-only" data-gym-dock hidden><span data-gym-selection-count></span><button type="button" data-gym-show class="button">比較を見る</button><button type="button" data-gym-clear class="button ghost">解除</button></div>`;
}
export function renderGym(g,h) {
  const {heading,note,link,facts,references,external} = h;
  const official=sources.find(s=>s.id===g.sources[0]);
  const map='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(g.name+' '+g.address);
  return `<div class="breadcrumbs">${link('gyms/','ジム一覧')}</div>`+
    heading('GYM / FIELD-LEVEL SOURCES',g.name,g.prefecture+' / '+g.municipality)+
    (g.status==='closed'?note('この施設は閉店しています',`${g.closed_date}の閉店を公式一覧で確認。住所は履歴で、訪問先の案内ではありません。`):'')+
    `<div class="detail-layout"><div><p class="lead">${e(g.summary)}</p>${facts(gymRows(g))}
      ${g.route_length_note?note('距離の定義',g.route_length_note):''}
      <div class="inline-actions">${external(official.url,g.status==='closed'?'閉店の公式情報へ':'公式の営業日・料金を確認')}${g.status!=='closed'?external(map,'地図で所在地を確認'):''}${link('gyms/?compare='+g.id,'比較に入れてジムを探す →')}</div>
      <details class="deep"><summary>各項目の根拠を確認</summary><dl class="field-sources">${Object.entries(g.field_sources).map(([field,ids])=>`<div><dt><code>${e(field)}</code></dt><dd>${ids.map(id=>{const s=sources.find(s=>s.id===id);return external(s.url,s.title);}).join(' / ')}</dd></div>`).join('')}</dl></details>
      ${references(g.sources)}</div><aside>${note('訪問前の確認','セット替え、利用条件、料金は変わります。掲載設備だけでビレイ技術や利用可否を判断せず、施設の指導を受けてください。')}
      ${note('未確認は「なし」ではありません','施設床面積・壁面積・クチコミ点数は、根拠を確認できるまで表示しません。')}${link('read/choose-gym/','何を比較すると選びやすい？ →')}</aside></div>`;
}
export function renderGymHistory(h) {
  const {heading,note,link,facts,references}=h;
  const closed=gyms.filter(g=>g.closed_date).sort((a,b)=>a.closed_date.localeCompare(b.closed_date));
  return heading('GYM HISTORY / A PARTIAL RECORD','閉店と、データの空白を分ける。','施設を一覧から消すのではなく、日付と出典を履歴として残します。')+
    note('国内市場の増減を示すグラフではありません','収録は選定した施設のみです。開店日が不明な施設もあり、全国の営業施設数や閉店率は算出していません。')+
    `<section><h2>公式に確認した閉店記録</h2><ol class="history-list">${closed.map(g=>`<li><time datetime="${e(g.closed_date)}">${e(g.closed_date)}</time><div><h3>${link('gyms/'+g.id+'/',e(g.name))}</h3><p>${e(g.prefecture)} / 公式店舗一覧による閉店日</p></div></li>`).join('')}</ol></section>
    <section><h2>何が揃うと、年次推移を比較できる？</h2>${facts([['開店日が不明','過去のある年に営業していたと推定しません。'],['掲載がなくなった','閉店の証拠とは区別します。移転・改名の確認も必要です。'],['年月しか分からない','1日や月末の日付を補わず、日付の精度を残します。'],['確認した範囲','特定チェーンの記録だけで、日本全体の傾向を結論づけません。']])}</section>
    ${references(['gym-gravity-list'])}<p>${link('gyms/?status=閉店（履歴）','閉店履歴を絞り込んで見る →')}</p>`;
}
export function renderGlossary(h) {
  const {heading,filterForm,link,tag,references} = h;
  return heading('THE CLIMBER’S DICTIONARY','言葉が分かると、登りが見える。','日本語・英語のどちらからでも。短い定義を読んで、気になる問いへ進みましょう。')+
    `<p class="micro">${glossary.length}語 / 定義は独自に編集。技術の実地指導や医療上の判断の代わりにはなりません。</p>`+
    filterForm([['category','テーマ',unique(glossary.map(t=>t.category))]])+
    `<div class="glossary-grid" data-results>${glossary.map(t=>`<article class="card glossary-term" id="${e(t.id)}" data-item data-search="${e([t.name,t.english,t.definition,t.caution].join(' '))}" data-category="${e(t.category)}">${tag(t.category)}<h2>${e(t.name)}</h2><p class="term-english">${e(t.english)}</p><p>${e(t.definition)}</p><p class="term-caution"><strong>混同しない：</strong>${e(t.caution)}</p>${link('read/'+t.article+'/','関連する問いを読む →','text-link')}<details class="term-sources"><summary>定義の参照元</summary>${t.sources.map(id=>{const s=sources.find(s=>s.id===id);return h.external(s.url,s.title);}).join('<br>')}</details></article>`).join('')}</div>`;
}
export function articleTerms(a,h) {
  const text=[a.title,a.answer,...a.sections.map(s=>s.text)].join(' ');
  const terms=glossary.filter(t=>text.includes(t.name)||t.article===a.id).slice(0,6);
  return terms.length?`<aside class="article-terms"><h2>この話のキーワード</h2><div class="term-chips">${terms.map(t=>h.link('glossary/#'+t.id,e(t.name),'term-chip')).join('')}</div><p class="micro">言葉の定義と、混同しやすい点を読む。</p></aside>`:'';
}
export function discoverySearchIndex() {
  return [...glossary.map(t=>({title:t.name,kind:'用語',path:'glossary/#'+t.id,description:t.definition,text:[t.name,t.english,t.category,t.definition,t.caution].join(' ')})),
    {title:'トライノート',kind:'ツール',path:'notebook/',description:'課題ごとに観察と次の一手を残す、端末内の記録。',text:'トライ ノート メモ 日記 課題 進捗 記録 セッション ログ notebook'},
    {title:'ジムの開閉店履歴',kind:'データ',path:'gym-history/',description:'公式の閉店日と、比較する際の注意点。',text:'ジム 開店 閉店 履歴 推移 施設'}];
}
