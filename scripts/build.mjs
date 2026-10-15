// Builds the static site into the repository root (GitHub Pages serves main /(root)).
//
//   npm run build
//
// Sources: content/articles/*.md, content/data/**, src/**, assets/**.
// Output (generated, do not edit by hand): index.html, 404.html, articles/, data/,
// glossary/, about/, sitemap.xml, robots.txt.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFrontMatter, renderMarkdown, escapeHtml } from '../src/markdown.mjs';
import { SITE, url, absoluteUrl, readingMinutes } from '../src/site.mjs';
import * as pages from '../src/pages.mjs';
import { round } from '../src/stats.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const GENERATED = ['index.html', '404.html', 'articles', 'data', 'glossary', 'about', 'sitemap.xml', 'robots.txt'];
const readJson = async (p) => JSON.parse(await readFile(resolve(root, p), 'utf8'));

// --- Articles ----------------------------------------------------------------------------
function fill(template, values, file) {
  return template.replace(/\{\{\s*([\w.]+)(?:\|(\d))?\s*\}\}/g, (_, path, digits) => {
    const value = path.split('.').reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), values);
    if (value === undefined || value === null) throw new Error(`${file}: no value for {{${path}}}`);
    if (typeof value !== 'number') return String(value);
    const text = digits === undefined ? String(value) : round(value, Number(digits)).toFixed(Number(digits));
    // Thousands separators for large whole numbers; a real minus sign for negatives.
    return (Number.isInteger(value) && Math.abs(value) >= 10000 ? value.toLocaleString('en-US') : text).replace(/^-/, '−');
  });
}

const baseDirectives = (extra = {}) => ({
  summary: ({ content, render }) => `<div class="summary-box"><p>この記事の要点</p>${render(content)}</div>\n<!--toc-->`,
  note: ({ args, content, render }) => `<div class="note-box">${args ? `<p>${escapeHtml(args)}</p>` : ''}${render(content)}</div>`,
  ...extra,
});

async function loadArticles() {
  const dir = resolve(root, 'content/articles');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort();
  const articles = [];
  for (const file of files) {
    const raw = await readFile(resolve(dir, file), 'utf8');
    const { meta, body } = parseFrontMatter(raw);
    for (const key of ['title', 'category', 'summary', 'published', 'updated']) if (!meta[key]) throw new Error(`${file}: front matter "${key}" is required`);
    const slug = file.replace(/\.md$/, '');
    let module = null;
    if (meta.data) module = await import(pathToFileURL(resolve(root, 'src/articles', `${meta.data}.mjs`)).href).then((m) => m.load(root));
    const text = module ? fill(body, module.values, file) : body;
    const rendered = renderMarkdown(text, {
      directives: baseDirectives({
        figure: ({ args }) => {
          const fn = module?.figures?.[args];
          if (!fn) throw new Error(`${file}: unknown figure "${args}"`);
          return fn();
        },
      }),
      resolveHref: (href) => (href.startsWith('/') ? url(href) : href),
    });
    articles.push({
      slug, ...meta, author: meta.author ?? 'CRUX編集部',
      html: rendered.html, headings: rendered.headings, footnotes: rendered.footnotes,
      minutes: readingMinutes(rendered.html.replace(/<figure[\s\S]*?<\/figure>/g, '').replace(/<table[\s\S]*?<\/table>/g, '')), highlights: module?.highlights ?? null,
      featured: meta.featured === true,
    });
  }
  return articles;
}

// --- Downloads ------------------------------------------------------------------------------
const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
const toCsv = (rows) => {
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n';
};

// --- Build ----------------------------------------------------------------------------------
export async function build({ write = true } = {}) {
  const articles = await loadArticles();
  const evidence = await readJson('content/data/evidence.json');
  const gyms = await readJson('content/data/gyms.json');
  const glossary = await readJson('content/data/glossary.json');
  const climbers = await readJson('content/data/climbers/athletes.json');
  const climberModule = await import(pathToFileURL(resolve(root, 'src/articles/climber-height-weight.mjs')).href).then((m) => m.load(root));

  const featured = articles.find((a) => a.featured) ?? articles[0];
  const athleteRows = climberModule.athleteRows;
  const dataCards = [
    { href: 'data/athletes/', title: 'トップクライマーの体格', count: `${athleteRows.length}人`, description: 'IFSC表彰台経験者の身長・リーチ・体重' },
    { href: 'data/ascents/', title: '高難度の登攀記録', count: `${evidence.ascents.length}件`, description: '誰が、いつ、どのスタイルで登ったか' },
    { href: 'data/injuries/', title: '怪我の研究', count: `${evidence.clinical.length}件`, description: '治療・復帰の研究の対象・結果・限界' },
    { href: 'data/gyms/', title: 'クライミングジム', count: `${gyms.gyms.length}件`, description: '公式情報で確認した所在地と種目' },
  ];

  const out = new Map();
  const add = (path, html) => out.set(path, html);
  add('index.html', pages.homePage({ articles, featured, dataCards }));
  add('articles/index.html', pages.articlesIndexPage({ articles }));
  for (const a of articles) {
    const related = articles.filter((b) => b !== a && b.category === a.category).sort((x, y) => (y.updated > x.updated ? 1 : -1)).slice(0, 3);
    add(`articles/${a.slug}/index.html`, pages.articlePage({ article: a, related }));
  }
  const downloads = [
    { href: 'data/downloads/climber-body.csv', label: '体格データ（CSV）' },
    { href: 'data/downloads/climber-body.json', label: '体格データ（JSON）' },
    { href: 'data/downloads/ascents.csv', label: '登攀記録（CSV）' },
    { href: 'data/downloads/injury-studies.csv', label: '怪我の研究（CSV）' },
    { href: 'data/downloads/evidence.json', label: '登攀・研究・出典（JSON）' },
    { href: 'data/downloads/gyms.json', label: 'ジム（JSON）' },
  ];
  add('data/index.html', pages.dataHubPage({ cards: dataCards, downloads }));
  add('data/athletes/index.html', pages.athletesPage({ athletes: athleteRows, generatedAt: climbers.meta.retrieved_at, retrievedAt: climbers.meta.retrieved_at, counts: climberModule.pageCounts, evidenceRows: climberModule.evidenceRows(evidence) }));
  add('data/ascents/index.html', pages.ascentsPage({ evidence }));
  add('data/injuries/index.html', pages.injuriesPage({ evidence }));
  add('data/gyms/index.html', pages.gymsPage({ gyms }));

  const usedBy = new Map();
  const use = (id, where) => usedBy.set(id, [...new Set([...(usedBy.get(id) ?? []), where])]);
  for (const m of evidence.measurements) use(m.source_id, '選手の体格');
  for (const a of evidence.ascents) use(a.source_id, '登攀記録');
  for (const c of evidence.clinical) use(c.source_id, '怪我の研究');
  const sourceRows = [
    ...climberModule.sources.map((s) => ({ ...s, used: '体格の記事・データ' })),
    ...evidence.sources.filter((s) => usedBy.has(s.id)).map((s) => ({ id: s.id, title: s.title, url: s.url, kind: s.kind, checked: s.retrieved_at, used: usedBy.get(s.id).join('・') })),
    ...gyms.sources.map((s) => ({ id: s.id, title: s.title, url: s.url, kind: s.kind, checked: s.checked_at, used: 'ジム' })),
  ];
  add('data/sources/index.html', pages.sourcesPage({ groups: sourceRows }));
  add('glossary/index.html', pages.glossaryPage({ glossary, articleSlugs: new Set(articles.map((a) => a.slug)) }));
  add('about/index.html', pages.aboutPage({ counts: { articles: articles.length, athletes: athleteRows.length } }));
  const redirects = {
    read: 'articles/', 'read/body-not-destiny': 'articles/climber-height-weight/', 'read/ideal-climber-body-type': 'articles/climber-height-weight/',
    'articles/male-top-climbers-body-size.md': 'articles/climber-height-weight/',
    'athlete-data': 'data/athletes/', athletes: 'data/athletes/', 'ascent-data': 'data/ascents/', climbs: 'data/ascents/',
    'injury-data': 'data/injuries/', evidence: 'data/sources/', research: 'articles/#training', gyms: 'data/gyms/', 'gym-history': 'data/gyms/',
    quality: 'about/', privacy: 'about/', notebook: '', tools: '', quiz: '', search: '', saved: '',
  };
  add('404.html', pages.notFoundPage({ redirects }));

  // Downloads.
  add('data/downloads/climber-body.json', JSON.stringify({ meta: climbers.meta, athletes: athleteRows }, null, 1) + '\n');
  add('data/downloads/climber-body.csv', toCsv(athleteRows.map(({ podiums, wins, ...r }) => ({ ...r, podiums: JSON.stringify(podiums), wins: JSON.stringify(wins) }))));
  add('data/downloads/ascents.csv', toCsv(evidence.ascents));
  add('data/downloads/injury-studies.csv', toCsv(evidence.clinical));
  add('data/downloads/evidence.json', JSON.stringify(evidence, null, 1) + '\n');
  add('data/downloads/gyms.json', JSON.stringify(gyms, null, 1) + '\n');

  const htmlPaths = [...out.keys()].filter((p) => p.endsWith('index.html'));
  add('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${htmlPaths.map((p) => {
    const path = p.replace(/index\.html$/, '');
    const art = articles.find((a) => path === `articles/${a.slug}/`);
    return `<url><loc>${absoluteUrl(path)}</loc>${art ? `<lastmod>${art.updated}</lastmod>` : ''}</url>`;
  }).join('\n')}\n</urlset>\n`);
  add('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl('sitemap.xml')}\n`);

  if (!write) return { out, pages: htmlPaths.length + 1, files: out.size, articles: articles.length };

  // Everything rendered without errors: replace the previous output.
  for (const name of GENERATED) await rm(resolve(root, name), { recursive: true, force: true });
  for (const [path, content] of out) {
    const target = resolve(root, path);
    if (!GENERATED.some((g) => relative(root, target) === g || relative(root, target).startsWith(g + '/'))) throw new Error(`Refusing to write outside generated paths: ${path}`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return { out, pages: htmlPaths.length + 1, files: out.size, articles: articles.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await build();
  console.log(`Built ${result.pages} pages (${result.files} files, ${result.articles} articles) for ${SITE.origin}${SITE.base}`);
}
