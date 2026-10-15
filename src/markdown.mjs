// A small Markdown renderer for the articles in content/articles.
// Supports: front matter, h2/h3 (with optional {#id}), paragraphs, lists,
// blockquotes, GFM tables, horizontal rules, footnotes ([^n]) and
// ":::name args" directives that the site turns into figures or notes.

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function parseFrontMatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const at = line.indexOf(':');
    if (at < 0) throw new Error(`Front matter line without a colon: ${line}`);
    const key = line.slice(0, at).trim();
    let value = line.slice(at + 1).trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
    else if (value === 'true' || value === 'false') value = value === 'true';
    else if (/^\[.*\]$/.test(value)) value = value.slice(1, -1).split(',').map((v) => v.trim()).filter(Boolean);
    meta[key] = value;
  }
  return { meta, body: text.slice(match[0].length) };
}

const CJK = /[　-ヿ㐀-鿿＀-￯]/;

function joinLines(lines) {
  let out = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!out) out = line;
    else if (CJK.test(out.at(-1)) || CJK.test(line[0])) out += line;
    else out += ' ' + line;
  }
  return out;
}

export function renderInline(text, ctx = {}) {
  const codes = [];
  let s = escapeHtml(text).replace(/`([^`]+)`/g, (_, code) => {
    codes.push(`<code>${code}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s.replace(/\[\^([\w-]+)\]/g, (_, id) => footnoteRef(id, ctx));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const external = /^https?:/.test(href);
    const url = ctx.resolveHref ? ctx.resolveHref(href) : href;
    return `<a href="${url}"${external ? ' rel="noopener"' : ''}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
}

function footnoteRef(id, ctx) {
  if (!ctx.footnotes) return `[^${id}]`;
  let n = ctx.footnoteOrder.indexOf(id);
  if (n < 0) {
    ctx.footnoteOrder.push(id);
    n = ctx.footnoteOrder.length - 1;
  }
  return `<sup class="ref"><a href="#ref-${id}" id="cite-${id}-${++ctx.citeCount}">${n + 1}</a></sup>`;
}

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function renderTable(lines, ctx) {
  const head = splitRow(lines[0]);
  const aligns = splitRow(lines[1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : null));
  const cell = (tag, value, i) => `<${tag}${aligns[i] ? ` class="align-${aligns[i]}"` : ''}>${renderInline(value, ctx)}</${tag}>`;
  const body = lines.slice(2).map((l) => `<tr>${splitRow(l).map((v, i) => cell('td', v, i)).join('')}</tr>`).join('');
  return `<div class="table-wrap"><table><thead><tr>${head.map((v, i) => cell('th', v, i)).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderList(lines, ctx) {
  const ordered = /^\d+\.\s/.test(lines[0]);
  const items = [];
  for (const line of lines) {
    const m = /^(?:[-*]|\d+\.)\s+(.*)$/.exec(line);
    if (m) items.push([m[1]]);
    else items.at(-1).push(line);
  }
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${items.map((parts) => `<li>${renderInline(joinLines(parts), ctx)}</li>`).join('')}</${tag}>`;
}

export function renderMarkdown(source, options = {}) {
  const ctx = {
    footnotes: new Map(),
    footnoteOrder: [],
    citeCount: 0,
    headings: [],
    resolveHref: options.resolveHref,
  };
  const directives = options.directives ?? {};
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const kept = [];
  for (const line of lines) {
    const fn = /^\[\^([\w-]+)\]:\s*(.*)$/.exec(line);
    if (fn) ctx.footnotes.set(fn[1], fn[2]);
    else kept.push(line);
  }
  const html = renderBlocks(kept, ctx, directives);
  const missing = ctx.footnoteOrder.filter((id) => !ctx.footnotes.has(id));
  if (missing.length) throw new Error(`Footnote definitions missing: ${missing.join(', ')}`);
  const footnotes = ctx.footnoteOrder.map((id, i) => ({ id, number: i + 1, html: renderInline(ctx.footnotes.get(id), { resolveHref: ctx.resolveHref }) }));
  return { html, headings: ctx.headings, footnotes };
}

function renderBlocks(lines, ctx, directives) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const directive = /^:::\s*([\w-]+)\s*(.*)$/.exec(line);
    if (directive) {
      const inner = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') inner.push(lines[i++]);
      if (i >= lines.length) throw new Error(`Unclosed directive :::${directive[1]}`);
      i++;
      const handler = directives[directive[1]];
      if (!handler) throw new Error(`Unknown directive :::${directive[1]}`);
      const render = (text) => renderBlocks(text.split('\n'), ctx, directives);
      out.push(handler({ args: directive[2].trim(), content: inner.join('\n'), render, inline: (t) => renderInline(t, ctx) }));
      continue;
    }
    const heading = /^(#{2,3})\s+(.*?)(?:\s+\{#([\w-]+)\})?\s*$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const id = heading[3] ?? `section-${ctx.headings.length + 1}`;
      const text = renderInline(heading[2], ctx);
      ctx.headings.push({ level, id, text });
      out.push(`<h${level} id="${id}">${text}</h${level}>`);
      i++;
      continue;
    }
    if (/^-{3,}\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    if (line.startsWith('>')) {
      const inner = [];
      while (i < lines.length && lines[i].startsWith('>')) inner.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${renderBlocks(inner, ctx, directives)}</blockquote>`);
      continue;
    }
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++]);
      out.push(renderTable(rows, ctx));
      continue;
    }
    if (/^(?:[-*]|\d+\.)\s+/.test(line)) {
      const items = [];
      while (i < lines.length && lines[i].trim() && (/^(?:[-*]|\d+\.)\s+/.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) items.push(lines[i++]);
      out.push(renderList(items, ctx));
      continue;
    }
    const para = [lines[i++]];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|:::|>|\|)/.test(lines[i]) && !/^(?:[-*]|\d+\.)\s+/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p>${renderInline(joinLines(para), ctx)}</p>`);
  }
  return out.join('\n');
}
