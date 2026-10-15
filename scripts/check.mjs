// Checks the site before publishing.
//
//   npm run check
//
// 1. The committed output (index.html, articles/, data/ ...) matches a fresh build of the sources.
// 2. Every page has one <h1>, a title, a description and a canonical URL.
// 3. Internal links and #fragments resolve, and no unfilled {{template}} or "undefined" remains.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, GENERATED } from './build.mjs';
import { SITE } from '../src/site.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

export function auditPages(pages, exists) {
  const problems = [];
  const ids = new Map();
  for (const [path, html] of pages) ids.set(path, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  let links = 0;
  for (const [path, html] of pages) {
    const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
    if (h1 !== 1) problems.push(`${path}: ${h1} <h1> elements`);
    for (const tag of ['<title>', 'name="description"', 'rel="canonical"', '<html lang="ja">']) if (!html.includes(tag)) problems.push(`${path}: missing ${tag}`);
    if (/\{\{|\bundefined\b|\bNaN\b|\[object Object\]/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) problems.push(`${path}: unfilled value in the page`);
    const dupes = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).filter((id, i, all) => all.indexOf(id) !== i);
    if (dupes.length) problems.push(`${path}: duplicate ids ${[...new Set(dupes)].join(', ')}`);
    for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const raw = m[1].replaceAll('&amp;', '&');
      if (/^(https?:|mailto:|data:)/.test(raw)) continue;
      if (raw.startsWith('#')) {
        if (!ids.get(path).has(decodeURIComponent(raw.slice(1)))) problems.push(`${path}: missing fragment ${raw}`);
        continue;
      }
      if (!raw.startsWith(SITE.base)) { problems.push(`${path}: link outside the site base ${raw}`); continue; }
      links++;
      const [target, hash] = raw.slice(SITE.base.length).split('#');
      const file = target === '' || target.endsWith('/') ? `${target}index.html` : target;
      if (!exists(file)) { problems.push(`${path}: broken link ${raw}`); continue; }
      if (hash && pages.has(file) && !ids.get(file).has(decodeURIComponent(hash))) problems.push(`${path}: missing fragment ${raw}`);
    }
  }
  return { problems, links };
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) {
  const { out } = await build({ write: false });
  // 1. Committed output is up to date.
  for (const [path, content] of out) {
    const file = resolve(root, path);
    if (!existsSync(file)) errors.push(`not built: ${path} (run npm run build)`);
    else if ((await readFile(file, 'utf8')) !== content) errors.push(`out of date: ${path} (run npm run build)`);
  }
  for (const name of GENERATED) {
    const base = resolve(root, name);
    if (!existsSync(base) || !statSync(base).isDirectory()) continue;
    for (const file of await walk(base)) {
      const rel = relative(root, file).split('\\').join('/');
      if (!out.has(rel)) errors.push(`stale generated file: ${rel}`);
    }
  }
  // 2-3. Page structure and links.
  const pages = new Map([...out].filter(([p]) => p.endsWith('.html')));
  const { problems, links } = auditPages(pages, (file) => out.has(file) || existsSync(resolve(root, file)));
  errors.push(...problems);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(`OK: ${pages.size} pages, ${links} internal links, output matches the sources.`);
}
