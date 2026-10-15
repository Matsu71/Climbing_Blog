// Page renderers. Each returns the HTML string for one page.
import { escapeHtml as e } from './markdown.mjs';
import { layout, url, absoluteUrl, formatDate, SITE } from './site.mjs';

export const CATEGORIES = [
  { name: '身体・能力', slug: 'body', description: '身長・体重・リーチや指の力。体格と登りの関係' },
  { name: 'トレーニング', slug: 'training', description: '研究から読む、練習と効果の測り方' },
  { name: '怪我・回復', slug: 'injury', description: '指の痛み、テーピング、復帰の考え方' },
  { name: '力学', slug: 'mechanics', description: '足・摩擦・回転。保持を物理で考える' },
  { name: 'グレード', slug: 'grades', description: '高難度の記録とグレードの読み方' },
  { name: '競技を読む', slug: 'competition', description: '競技ボルダーの見方' },
  { name: '研究の読み方', slug: 'research', description: '論文の結果を正しく受け取るために' },
  { name: 'ジム・入門', slug: 'beginners', description: 'ジム選びと最初のセッション' },
];
const categoryOf = (name) => CATEGORIES.find((c) => c.name === name) ?? { name, slug: 'other', description: '' };

const byDate = (a, b) => (b.updated > a.updated ? 1 : b.updated < a.updated ? -1 : a.title.localeCompare(b.title, 'ja'));

function articleMeta(a) {
  return `${formatDate(a.updated)}・約${a.minutes}分`;
}

function articleCard(a) {
  return `<article class="card"><span class="tag">${e(a.category)}</span><h3><a href="${url(`articles/${a.slug}/`)}">${e(a.title)}</a></h3><p>${e(a.summary)}</p><p class="meta">${articleMeta(a)}</p></article>`;
}

function pageHead(title, lead, eyebrow) {
  return `<header class="page-head">${eyebrow ? `<a class="eyebrow" href="${url(eyebrow.href)}">${e(eyebrow.label)}</a>` : ''}<h1>${e(title)}</h1>${lead ? `<p>${lead}</p>` : ''}</header>`;
}

export function homePage({ articles, featured, dataCards }) {
  const latest = [...articles].filter((a) => a !== featured).sort(byDate).slice(0, 6);
  const counts = CATEGORIES.map((c) => ({ ...c, count: articles.filter((a) => a.category === c.name).length })).filter((c) => c.count);
  const stats = featured.highlights ?? [];
  const body = `<div class="wrap">
<h1 class="visually-hidden">${SITE.name}：${SITE.tagline}</h1>
<section class="feature" aria-labelledby="feature-title">
<div><span class="tag">${e(featured.category)}・新着</span><h2 id="feature-title"><a href="${url(`articles/${featured.slug}/`)}">${e(featured.title)}</a></h2><p>${e(featured.summary)}</p><p><a class="read-more" href="${url(`articles/${featured.slug}/`)}">記事を読む →</a></p></div>
${stats.length ? `<dl class="stat-row">${stats.map((s) => `<div class="stat"><dt>${e(s.label)}</dt><dd>${e(s.value)}<small>${e(s.unit ?? '')}</small></dd></div>`).join('')}</dl>` : ''}
</section>
<div class="section-head"><h2>新しい記事</h2><a href="${url('articles/')}">記事一覧へ</a></div>
<div class="card-grid">${latest.map(articleCard).join('')}</div>
<div class="section-head"><h2>テーマから探す</h2></div>
<ul class="category-list">${counts.map((c) => `<li><a href="${url(`articles/#${c.slug}`)}">${e(c.name)}<small>${c.count}本</small></a></li>`).join('')}</ul>
<div class="section-head"><h2>データで調べる</h2><a href="${url('data/')}">データの一覧へ</a></div>
<div class="card-grid data-cards">${dataCards.map((d) => `<article class="card"><h3><a href="${url(d.href)}">${e(d.title)}</a></h3><p class="count">${e(d.count)}</p><p>${e(d.description)}</p></article>`).join('')}</div>
</div>`;
  return layout({
    path: '', title: SITE.name, description: SITE.description, body,
    jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: absoluteUrl(''), inLanguage: 'ja' },
  });
}

export function articlesIndexPage({ articles }) {
  const groups = CATEGORIES.map((c) => ({ ...c, items: articles.filter((a) => a.category === c.name).sort(byDate) })).filter((g) => g.items.length);
  const body = `<div class="wrap">
${pageHead('記事一覧', `${articles.length}本の記事をテーマ別にまとめています。`)}
<ul class="category-list">${groups.map((g) => `<li><a href="#${g.slug}">${e(g.name)}<small>${g.items.length}</small></a></li>`).join('')}</ul>
${groups.map((g) => `<section class="article-group" id="${g.slug}" aria-labelledby="h-${g.slug}"><h2 id="h-${g.slug}">${e(g.name)}</h2><ul class="article-list">${g.items.map((a) => `<li><a href="${url(`articles/${a.slug}/`)}">${e(a.title)}</a><p>${e(a.summary)}</p><span class="meta">${articleMeta(a)}</span></li>`).join('')}</ul></section>`).join('\n')}
</div>`;
  return layout({ path: 'articles/', section: 'articles/', title: '記事一覧', description: 'CRUXの記事一覧。体格、トレーニング、怪我、力学、グレードなどのテーマ別に読めます。', body });
}

// The table of contents goes right after the summary box when there is one.
function placeToc(html, toc) {
  return html.includes('<!--toc-->') ? html.replace('<!--toc-->', toc) : toc + html;
}

export function articlePage({ article: a, related }) {
  const cat = categoryOf(a.category);
  const toc = a.headings.filter((h) => h.level === 2 && h.id !== 'references');
  const refs = a.footnotes.length ? `<section class="references" aria-labelledby="refs-title"><h2 id="refs-title">出典</h2><ol>${a.footnotes.map((f) => `<li id="ref-${e(f.id)}">${f.html}</li>`).join('')}</ol></section>` : '';
  const body = `<article class="article">
<header class="article-head wrap-narrow">
<nav class="breadcrumb" aria-label="現在位置"><a href="${url('articles/')}">記事</a> › <a href="${url(`articles/#${cat.slug}`)}">${e(a.category)}</a></nav>
<h1>${e(a.title)}</h1>
<p class="lead">${e(a.summary)}</p>
<p class="meta">${a.published && a.published !== a.updated ? `公開 ${formatDate(a.published)}・更新 ${formatDate(a.updated)}` : formatDate(a.updated)}・約${a.minutes}分で読めます</p>
</header>
<div class="wrap-narrow">
<div class="prose">
${placeToc(a.html, toc.length >= 4 ? `<nav class="toc" aria-label="目次"><p>目次</p><ol>${toc.map((h) => `<li><a href="#${h.id}">${h.text}</a></li>`).join('')}</ol></nav>` : '')}
</div>
${refs}
<p class="article-foot">${e(a.author)}${a.review ? `／${e(a.review)}` : ''}</p>
${related.length ? `<section class="related" aria-labelledby="related-title"><h2 id="related-title">関連する記事</h2><div class="card-grid">${related.map(articleCard).join('')}</div></section>` : ''}
</div>
</article>`;
  return layout({
    path: `articles/${a.slug}/`, section: 'articles/', title: a.title, description: a.summary, type: 'article', body,
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.summary,
      datePublished: a.published, dateModified: a.updated, inLanguage: 'ja',
      author: { '@type': 'Organization', name: a.author }, mainEntityOfPage: absoluteUrl(`articles/${a.slug}/`),
    },
  });
}

export function dataHubPage({ cards, downloads }) {
  const body = `<div class="wrap">
${pageHead('データ', '記事の根拠にしているデータです。数値ごとに出典を付けています。')}
<div class="card-grid data-cards">${cards.map((d) => `<article class="card"><h3><a href="${url(d.href)}">${e(d.title)}</a></h3><p class="count">${e(d.count)}</p><p>${e(d.description)}</p></article>`).join('')}</div>
<h2 class="section-title">ダウンロード</h2>
<p>同じデータをCSV・JSONで取得できます。利用するときは各行の出典も確認してください。</p>
<ul class="downloads">${downloads.map((d) => `<li><a href="${url(d.href)}" download>${e(d.label)}</a></li>`).join('')}</ul>
<h2 class="section-title">データの扱い</h2>
<div class="prose-block"><p>公式サイト、競技団体、論文など、確認できた出典の値だけを載せています。写真からの推定や、足りない値の補完はしていません。測定日が分からない値は、その旨を表示しています。</p><p>収集は途中です。掲載数は世界全体の網羅率ではありません。</p></div>
</div>`;
  return layout({ path: 'data/', section: 'data/', title: 'データ', description: 'クライマーの体格、高難度の登攀記録、怪我の研究、ジムのデータ。出典つきでCSV・JSONも取得できます。', body });
}

function filterBar(id, options = [], placeholder = '名前・国など') {
  return `<form class="filter-bar" data-filter-for="${id}" role="search" onsubmit="return false"><label>キーワード<input type="search" name="q" autocomplete="off" placeholder="${e(placeholder)}"></label>${options.map((o) => `<label>${e(o.label)}<select name="${o.name}"><option value="">すべて</option>${o.values.map(([v, t]) => `<option value="${e(v)}">${e(t)}</option>`).join('')}</select></label>`).join('')}</form><p class="result-count" data-count-for="${id}" aria-live="polite"></p>`;
}

const link = (href, label) => `<a href="${e(href)}" rel="noopener">${e(label)}</a>`;
const num = (v, digits = 0) => (v === null || v === undefined ? '—' : Number(v).toFixed(digits));

const DISCIPLINE_JA = { boulder: 'ボルダー', lead: 'リード', speed: 'スピード', combined: '複合', boulder_lead: 'ボルダー&リード' };

export function athletesPage({ athletes, generatedAt, retrievedAt, counts, evidenceRows }) {
  const rows = athletes.map((a) => {
    const disciplines = Object.entries(a.podiums).filter(([, n]) => n).sort((x, y) => y[1] - x[1]).map(([d, n]) => `${DISCIPLINE_JA[d] ?? d} ${n}`).join('・');
    const search = [a.name, a.country, a.name_ja ?? ''].join(' ').toLowerCase();
    return `<tr data-q="${e(search)}" data-sex="${a.sex}" data-group="${a.group}"><td class="name">${e(a.name)}${a.name_ja ? `<small>${e(a.name_ja)}</small>` : ''}</td><td class="nowrap">${e(a.country)}</td><td class="nowrap">${a.sex === 'male' ? '男子' : '女子'}</td><td>${e(disciplines)}</td><td class="num">${num(a.height)}</td><td class="num">${num(a.arm_span)}</td><td class="num">${a.weight_ok ? num(a.dr_weight) : a.dr_weight ? `<span title="古い登録の可能性があるため集計外">(${num(a.dr_weight)})</span>` : '—'}</td><td class="src">${link(a.ifsc_url, 'IFSC')}${a.dr_url ? `・${link(a.dr_url, 'DigitalRock')}` : ''}</td></tr>`;
  }).join('');
  const evRows = evidenceRows.map((r) => `<tr data-q="${e((r.name + ' ' + r.latin).toLowerCase())}"><td class="name">${e(r.name)}<small>${e(r.latin)}</small></td><td>${e(r.metric)}</td><td class="num">${e(r.value)}</td><td>${e(r.context)}</td><td class="src">${r.url ? link(r.url, r.kind) : e(r.kind)}</td></tr>`).join('');
  const body = `<div class="wrap">
${pageHead('トップクライマーの体格', `IFSCのワールドカップ・世界選手権・五輪で表彰台に上がった選手（2010〜2025年）の身長・リーチ・体重です。分析は<a href="${url('articles/climber-height-weight/')}">「クライマーに最適な身長・体重は？」</a>にまとめています。`, { href: 'data/', label: 'データ' })}
<dl class="stat-row">${counts.map((c) => `<div class="stat"><dt>${e(c.label)}</dt><dd>${e(c.value)}<small>${e(c.unit ?? '')}</small></dd></div>`).join('')}</dl>
<h2 class="section-title">選手の一覧</h2>
<p>身長・リーチはIFSC公式の選手プロフィール（${e(retrievedAt)}取得）。体重はDigitalRock（IFSCの以前の結果サービス）に選手が登録した値で、登録した時期は分かりません。DigitalRockの身長がIFSCの身長と2cmを超えて違う選手や、DigitalRockへの最後の出場が18歳未満だった選手の体重は、成長期の古い登録の可能性があるため括弧で示し、集計には使っていません。</p>
${filterBar('athletes-table', [{ label: '性別', name: 'sex', values: [['male', '男子'], ['female', '女子']] }, { label: '種目', name: 'group', values: [['climbing', 'ボルダー・リード'], ['speed', 'スピードのみ']] }])}
<div class="table-wrap"><table class="data-table" id="athletes-table"><thead><tr><th>選手</th><th>国</th><th>性別</th><th>表彰台（種目・回数）</th><th class="num">身長 cm</th><th class="num">リーチ cm</th><th class="num">体重 kg</th><th>出典</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2 class="section-title">公式サイト等で確認した値</h2>
<p>選手本人・競技団体・スポンサーの公開ページで確認した値です（2026年9月の調査）。外岩中心の選手も含みます。</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>選手</th><th>項目</th><th class="num">値</th><th>掲載の状況</th><th>出典</th></tr></thead><tbody>${evRows}</tbody></table></div>
<ul class="downloads"><li><a href="${url('data/downloads/climber-body.csv')}" download>CSVをダウンロード</a></li><li><a href="${url('data/downloads/climber-body.json')}" download>JSONをダウンロード</a></li></ul>
<p class="result-count">データ生成日：${e(generatedAt)}</p>
</div>`;
  return layout({ path: 'data/athletes/', section: 'data/', title: 'トップクライマーの体格', description: 'IFSCワールドカップ・世界選手権・五輪の表彰台経験者の身長・リーチ・体重。出典つき。', body });
}

const PRECISION = { year: '年のみ公表', month: '月まで公表' };

export function ascentsPage({ evidence }) {
  const athletes = new Map(evidence.athletes.map((a) => [a.id, a]));
  const sources = new Map(evidence.sources.map((s) => [s.id, s]));
  const rows = [...evidence.ascents].sort((a, b) => String(b.ascent_date ?? '').localeCompare(String(a.ascent_date ?? ''))).map((r) => {
    const who = athletes.get(r.athlete_id);
    const src = sources.get(r.source_id);
    const q = [r.climb, who?.name, who?.latin, r.area, r.grade].join(' ').toLowerCase();
    const date = r.ascent_date ? `${r.ascent_date}${PRECISION[r.date_precision] ? `<small>${PRECISION[r.date_precision]}</small>` : ''}` : '不明';
    return `<tr data-q="${e(q)}" data-discipline="${e(r.discipline ?? '')}"><td class="name">${e(r.climb)}<small>${e(r.area ?? '')}</small></td><td>${e(r.grade ?? '—')}</td><td>${e(who?.name ?? r.athlete_id)}<small>${e(who?.latin ?? '')}</small></td><td>${date}${r.reported_at ? `<small>報道 ${e(r.reported_at)}</small>` : ''}</td><td class="nowrap">${e(r.style ?? '—')}</td><td class="nowrap">${e(r.discipline ?? '')}</td><td class="src">${src ? link(src.url, src.kind ?? '出典') : '—'}</td></tr>`;
  }).join('');
  const climbs = new Set(evidence.ascents.map((a) => a.climb)).size;
  const body = `<div class="wrap">
${pageHead('高難度の登攀記録', `世界の高難度ボルダー・ルートの登攀記録${evidence.ascents.length}件（${climbs}課題）です。登攀日と報道日、登攀時に提案されたグレードを分けて記録しています。`, { href: 'data/', label: 'データ' })}
${filterBar('ascents-table', [{ label: '種目', name: 'discipline', values: [['ボルダー', 'ボルダー'], ['スポート', 'ルート（スポート）']] }], '課題名・登攀者・地域')}
<div class="table-wrap"><table class="data-table" id="ascents-table"><thead><tr><th>課題・ルート</th><th>グレード</th><th>登攀者</th><th>登攀日</th><th>スタイル</th><th>種目</th><th>出典</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="result-count">確認日：${e(evidence.retrieved_at)}。グレードは資料に載った時点の評価で、のちに変わることがあります。</p>
</div>`;
  return layout({ path: 'data/ascents/', section: 'data/', title: '高難度の登攀記録', description: '世界の高難度ボルダー・ルートの登攀記録。登攀日・スタイル・グレード・出典つき。', body });
}

export function injuriesPage({ evidence }) {
  const sources = new Map(evidence.sources.map((s) => [s.id, s]));
  const items = evidence.clinical.map((c) => {
    const src = sources.get(c.source_id);
    const field = (label, value) => (value ? `<tr><th scope="row">${label}</th><td>${e(value)}</td></tr>` : '');
    return `<article class="card"><span class="tag">${e(c.condition ?? '研究')}</span><h3>${e(c.title)}</h3><div class="table-wrap"><table>${field('研究の種類', c.design)}${field('対象', c.sample)}${field('治療・介入', c.intervention)}${field('比較', c.comparator)}${field('結果', c.outcomes)}${field('追跡', c.follow_up)}${field('確実性', c.certainty)}${field('限界', c.limit)}</table></div><p class="meta">${src ? link(src.url, src.title) : ''}${c.doi ? `<br>DOI: ${e(c.doi)}` : ''}</p></article>`;
  }).join('');
  const body = `<div class="wrap">
${pageHead('怪我の研究', `指・肩・肘・足首などの怪我について、治療や復帰を調べた研究${evidence.clinical.length}件の要点です。`, { href: 'data/', label: 'データ' })}
<div class="note-box"><p>医療情報について</p><p>専門家による監修はまだ受けていません。研究の要点の紹介であり、個別の診断・治療・復帰の判断には使えません。痛みや腫れ、しびれがあるときは医療機関で相談してください。</p></div>
<div class="card-grid card-grid-wide">${items}</div>
</div>`;
  return layout({ path: 'data/injuries/', section: 'data/', title: '怪我の研究', description: 'クライミングの怪我（指・肩・肘・足首など）の治療と復帰に関する研究の要点。対象・結果・限界つき。', body });
}

export function gymsPage({ gyms }) {
  const sources = new Map(gyms.sources.map((s) => [s.id, s]));
  const rows = gyms.gyms.map((g) => {
    const src = (g.sources ?? []).map((id) => sources.get(id)).filter(Boolean);
    return `<tr data-q="${e([g.name, g.prefecture, g.municipality, g.brand].join(' ').toLowerCase())}" data-pref="${e(g.prefecture)}"><td class="name">${e(g.name)}<small>${e(g.brand ?? '')}</small></td><td>${e(g.prefecture)}<small>${e(g.municipality ?? '')}</small></td><td>${e((g.disciplines ?? []).join('・'))}</td><td>${e(g.status === 'closed' ? `閉店（${g.closed_date ?? '時期不明'}）` : g.address ?? '')}</td><td class="src">${src.map((s) => link(s.url, '公式')).join('・')}</td></tr>`;
  }).join('');
  const prefs = [...new Set(gyms.gyms.map((g) => g.prefecture))];
  const body = `<div class="wrap">
${pageHead('クライミングジム', `公式情報で確認したジム${gyms.gyms.length}件です。営業時間・料金は変わることがあるので、訪問前に公式サイトで確認してください。`, { href: 'data/', label: 'データ' })}
${filterBar('gyms-table', [{ label: '都道府県', name: 'pref', values: prefs.map((p) => [p, p]) }], '施設名・地域')}
<div class="table-wrap"><table class="data-table" id="gyms-table"><thead><tr><th>施設</th><th>所在地</th><th>種目</th><th>住所・状況</th><th>出典</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="result-count">確認日：${e(gyms.checked_at)}</p>
</div>`;
  return layout({ path: 'data/gyms/', section: 'data/', title: 'クライミングジム', description: '公式情報で確認したクライミングジムの所在地と種目。', body });
}

export function sourcesPage({ groups }) {
  const body = `<div class="wrap">
${pageHead('出典一覧', 'データと記事で使っている出典です。', { href: 'data/', label: 'データ' })}
${filterBar('sources-table', [], '出典名・種類')}
<div class="table-wrap"><table class="data-table" id="sources-table"><thead><tr><th>出典</th><th>種類</th><th>使っている場所</th><th>確認日</th></tr></thead><tbody>${groups.map((s) => `<tr data-q="${e([s.title, s.kind, s.used].join(' ').toLowerCase())}" id="src-${e(s.id)}"><td>${s.url ? link(s.url, s.title) : e(s.title)}</td><td>${e(s.kind ?? '—')}</td><td>${e(s.used)}</td><td class="nowrap">${e(s.checked ?? '—')}</td></tr>`).join('')}</tbody></table></div>
</div>`;
  return layout({ path: 'data/sources/', section: 'data/', title: '出典一覧', description: 'CRUXの記事とデータで使っている出典の一覧。', body });
}

export function glossaryPage({ glossary, articleSlugs }) {
  const groups = [...new Set(glossary.terms.map((t) => t.category))];
  const body = `<div class="wrap">
${pageHead('用語集', `記事に出てくるクライミング用語${glossary.terms.length}語の意味です。`)}
<ul class="category-list">${groups.map((g, i) => `<li><a href="#g-${i + 1}">${e(g)}</a></li>`).join('')}</ul>
${groups.map((g, i) => `<section class="article-group" id="g-${i + 1}"><h2>${e(g)}</h2><dl class="glossary">${glossary.terms.filter((t) => t.category === g).map((t) => `<div class="glossary-item" id="${e(t.id)}"><dt>${e(t.name)}<small>${e(t.english ?? '')}</small></dt><dd>${e(t.definition)}</dd>${t.caution ? `<dd>${e(t.caution)}</dd>` : ''}${t.article && articleSlugs.has(t.article) ? `<dd><a href="${url(`articles/${t.article}/`)}">関連する記事 →</a></dd>` : ''}</div>`).join('')}</dl></section>`).join('')}
</div>`;
  return layout({ path: 'glossary/', section: 'glossary/', title: '用語集', description: 'ベータ、クリンプ、ランジなど、クライミング用語の意味。', body });
}

export function aboutPage({ counts }) {
  const body = `<div class="wrap-narrow">
${pageHead('このサイトについて')}
<div class="prose">
<p>CRUXは、クライミングの「よくある疑問」を、出典のあるデータと研究から考えるブログです。体格、トレーニング、怪我、力学、高難度の記録などを扱います。現在、記事${counts.articles}本と、選手${counts.athletes}人分の体格データなどを公開しています。</p>
<h2 id="policy">編集の方針</h2>
<ul>
<li>数値には出典を付けます。確認できない値は推測で補いません。</li>
<li>研究で分かったことと、分かっていないことを分けて書きます。相関を因果として扱いません。</li>
<li>統計は「トップ選手の多くがどうか」を示すもので、個人の目標値ではありません。</li>
<li>新しい情報で内容を見直したときは、記事の更新日を変えます。</li>
</ul>
<h2 id="ai">AIの利用</h2>
<p>記事の調査・執筆・データの集計には、AI（OpenAIのモデルやAnthropicのClaude）を使っています。各記事の末尾に執筆の体制を記載しています。数値は出典と照合していますが、誤りに気づいた場合はGitHubのリポジトリでお知らせください。</p>
<h2 id="medical">医療・健康の情報について</h2>
<p>怪我や体重に関する記事は、医療の専門家による監修を受けていません。一般的な情報であり、個別の診断・治療・減量の指示ではありません。痛みが続く、しびれる、腫れが引かないといったときは、医療機関に相談してください。</p>
<h2 id="privacy">プライバシー</h2>
<p>このサイトはアクセス解析・広告・Cookieを使っていません。入力欄の内容も外部へ送信しません。</p>
<h2 id="source">ソースコードとデータ</h2>
<p>サイトの原稿・データ・生成プログラムは<a href="https://github.com/Matsu71/Climbing_Blog" rel="noopener">GitHubのリポジトリ</a>で公開しています。データはCSV・JSONでも<a href="${url('data/')}">ダウンロード</a>できます。</p>
</div>
</div>`;
  return layout({ path: 'about/', section: 'about/', title: 'このサイトについて', description: 'CRUXの編集方針、AIの利用、医療情報の扱い、プライバシーについて。', body });
}

export function notFoundPage({ redirects }) {
  const body = `<div class="wrap-narrow">
${pageHead('ページが見つかりません', 'URLが変わったか、ページが削除された可能性があります。')}
<p data-redirect-note hidden>新しいページへ移動しています…</p>
<ul><li><a href="${url('')}">トップページ</a></li><li><a href="${url('articles/')}">記事一覧</a></li><li><a href="${url('data/')}">データ</a></li></ul>
</div>
<script>
(function () {
  var base = ${JSON.stringify(SITE.base)};
  var map = ${JSON.stringify(redirects)};
  var path = location.pathname.indexOf(base) === 0 ? location.pathname.slice(base.length) : '';
  path = path.replace(/^\\/+|\\/+$/g, '');
  var target = null;
  if (Object.prototype.hasOwnProperty.call(map, path)) target = map[path];
  else {
    var parts = path.split('/');
    if (parts[0] === 'read' && parts[1]) target = map['read/' + parts[1]] || 'articles/' + parts[1] + '/';
    else if (Object.prototype.hasOwnProperty.call(map, parts[0])) target = map[parts[0]];
  }
  if (target !== null && target !== undefined) {
    var note = document.querySelector('[data-redirect-note]');
    if (note) note.hidden = false;
    location.replace(base + target + location.hash);
  }
})();
</script>`;
  return layout({ path: '404.html', title: 'ページが見つかりません', description: 'お探しのページは見つかりませんでした。', body, noindex: true });
}
