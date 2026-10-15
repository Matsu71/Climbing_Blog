import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontMatter, renderMarkdown, renderInline } from '../src/markdown.mjs';

test('front matter: strings, quotes, booleans and lists', () => {
  const { meta, body } = parseFrontMatter('---\ntitle: "A: B"\nfeatured: true\ntags: [a, b]\n---\nBody');
  assert.deepEqual(meta, { title: 'A: B', featured: true, tags: ['a', 'b'] });
  assert.equal(body, 'Body');
});

test('headings get ids, explicit ids win', () => {
  const { html, headings } = renderMarkdown('## 見出し {#first}\n\n### 小見出し');
  assert.match(html, /<h2 id="first">見出し<\/h2>/);
  assert.equal(headings[1].id, 'section-2');
});

test('Japanese lines in one paragraph are joined without a space', () => {
  const { html } = renderMarkdown('一行目です。\n二行目です。\n\nEnglish line\nnext');
  assert.match(html, /<p>一行目です。二行目です。<\/p>/);
  assert.match(html, /<p>English line next<\/p>/);
});

test('tables, lists and alignment', () => {
  const { html } = renderMarkdown('| a | b |\n|---|--:|\n| 1 | 2 |\n\n- x\n- y\n\n1. one\n2. two');
  assert.match(html, /<th>a<\/th><th class="align-right">b<\/th>/);
  assert.match(html, /<ul><li>x<\/li><li>y<\/li><\/ul>/);
  assert.match(html, /<ol><li>one<\/li><li>two<\/li><\/ol>/);
});

test('footnotes are numbered in order of first citation', () => {
  const { html, footnotes } = renderMarkdown('B[^b] then A[^a] and B again[^b].\n\n[^a]: Source A\n[^b]: Source B');
  assert.deepEqual(footnotes.map((f) => [f.id, f.number]), [['b', 1], ['a', 2]]);
  assert.equal((html.match(/href="#ref-b"/g) ?? []).length, 2);
});

test('a missing footnote definition is an error', () => {
  assert.throws(() => renderMarkdown('Text[^x]'), /Footnote definitions missing: x/);
});

test('directives call their handler; unknown or unclosed ones fail', () => {
  const { html } = renderMarkdown(':::box hello\ninside\n:::', { directives: { box: ({ args, content }) => `<div>${args}|${content}</div>` } });
  assert.equal(html, '<div>hello|inside</div>');
  assert.throws(() => renderMarkdown(':::nope\nx\n:::'), /Unknown directive/);
  assert.throws(() => renderMarkdown(':::box\nx', { directives: { box: () => '' } }), /Unclosed directive/);
});

test('inline HTML is escaped and links are resolved', () => {
  assert.equal(renderInline('<b>&'), '&lt;b&gt;&amp;');
  assert.equal(renderInline('[x](/data/)', { resolveHref: (h) => '/base' + h }), '<a href="/base/data/">x</a>');
  assert.equal(renderInline('**強調**と*斜体*と`code`'), '<strong>強調</strong>と<em>斜体</em>と<code>code</code>');
});
