// Shared page layout: head, header navigation and footer.
import { escapeHtml as e } from './markdown.mjs';

export const SITE = {
  name: 'CRUX',
  tagline: 'クライミングの記事とデータ',
  description: 'クライミングの体格・トレーニング・怪我・記録を、出典つきのデータと研究から解説するブログです。',
  origin: process.env.SITE_ORIGIN ?? 'https://matsu71.github.io',
  base: process.env.BASE_PATH ?? '/Climbing_Blog/',
  lang: 'ja',
};

if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(SITE.base)) throw new Error('BASE_PATH must look like /Climbing_Blog/ or /');

export const url = (path = '') => SITE.base + String(path).replace(/^\//, '');
export const absoluteUrl = (path = '') => SITE.origin + url(path);

const NAV = [
  ['articles/', '記事'],
  ['data/', 'データ'],
  ['glossary/', '用語集'],
  ['about/', 'このサイトについて'],
];

export function layout({ path, title, description, body, type = 'website', jsonLd, noindex = false, section }) {
  const pageTitle = path === '' ? `${SITE.name} | ${SITE.tagline}` : `${title} | ${SITE.name}`;
  const canonical = absoluteUrl(path);
  const nav = NAV.map(([href, label]) => {
    const current = section === href;
    return `<a href="${url(href)}"${current ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('');
  return `<!doctype html>
<html lang="${SITE.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(pageTitle)}</title>
<meta name="description" content="${e(description ?? SITE.description)}">
<link rel="canonical" href="${e(canonical)}">
${noindex ? '<meta name="robots" content="noindex,follow">\n' : ''}<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${e(title ?? SITE.name)}">
<meta property="og:description" content="${e(description ?? SITE.description)}">
<meta property="og:url" content="${e(canonical)}">
<meta property="og:locale" content="ja_JP">
<meta name="theme-color" content="#195746" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#121615" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${url('assets/favicon.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${url('assets/site.css')}">
<script src="${url('assets/site.js')}" defer></script>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>\n` : ''}</head>
<body>
<a class="skip" href="#main">本文へ移動</a>
<header class="site-header">
<div class="wrap header-inner">
<a class="brand" href="${url('')}"><span class="brand-word">CRUX<span class="brand-dot">.</span></span><span class="brand-sub">${SITE.tagline}</span></a>
<nav class="site-nav" aria-label="メインメニュー">${nav}</nav>
</div>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="site-footer">
<div class="wrap footer-inner">
<div>
<p class="footer-brand">CRUX<span class="brand-dot">.</span></p>
<p>${SITE.description}</p>
</div>
<nav aria-label="フッターメニュー">${NAV.map(([href, label]) => `<a href="${url(href)}">${label}</a>`).join('')}<a href="${url('data/sources/')}">出典一覧</a></nav>
</div>
<p class="wrap footer-note">怪我や体重に関する内容は一般的な情報です。個別の診断・治療・減量の指示ではありません。</p>
</footer>
</body>
</html>
`;
}

export function readingMinutes(text) {
  const chars = String(text).replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
  return Math.max(1, Math.round(chars / 600));
}

export function formatDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return `${y}年${m}月${d}日`;
}
