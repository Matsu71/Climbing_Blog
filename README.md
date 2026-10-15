# CRUX — クライミングの記事とデータ

公開ページ：https://matsu71.github.io/Climbing_Blog/

クライミングの体格・トレーニング・怪我・記録を、出典つきのデータと研究から解説するブログです。

## フォルダ構成

| 場所 | 中身 |
|---|---|
| `content/articles/` | 記事の原稿（Markdown）。1ファイルが1記事です |
| `content/data/` | データ（選手の体格、登攀記録・怪我の研究・出典、ジム、用語） |
| `src/` | ページを作るプログラム（レイアウト、Markdown、グラフ、統計） |
| `assets/` | CSS・JavaScript・アイコン |
| `scripts/` | ビルド・検査・プレビュー・データ収集 |
| `tests/` | テスト |
| `docs/` | 企画メモ（`ideas/`）と過去の作業記録（`history/`） |

`index.html`・`404.html`・`articles/`・`data/`・`glossary/`・`about/`・`sitemap.xml`・`robots.txt` は、`npm run build` で作る公開用のファイルです。手で編集しません。GitHub Pages が main ブランチのルートをそのまま公開するため、生成したファイルもコミットします。

## よく使うコマンド

Node.js 22以上が必要です。外部のパッケージは使っていません。

```sh
npm run build   # 公開用のファイルを作り直す
npm run check   # 生成物が最新か、リンク切れがないかを検査し、テストを実行
npm run serve   # http://127.0.0.1:4173/Climbing_Blog/ で表示を確認
```

## 記事を書く

`content/articles/<URLにする名前>.md` を作り、先頭に次の項目を書きます。

```markdown
---
title: "記事のタイトル"
category: 身体・能力
summary: "一覧やトップに出る短い説明"
published: 2026-10-15
updated: 2026-10-15
author: CRUX編集部
---
```

本文はMarkdownです。見出し（`##`・`###`）、表、箇条書き、脚注（`[^id]` と末尾の `[^id]: 出典`）が使えます。ほかに次の書き方があります。

- `:::summary` 〜 `:::` … 冒頭の「この記事の要点」
- `:::note 見出し` 〜 `:::` … 注意書きの枠
- `:::figure 名前` 〜 `:::` … グラフ。front matter に `data: 名前` を書くと、`src/articles/名前.mjs` が計算した数値とグラフを使えます
- `{{height.male.mean|1}}` … データから計算した数値の差し込み（`|1` は小数点以下の桁数）

カテゴリーは `src/pages.mjs` の `CATEGORIES` から選びます。

## データ

- `content/data/climbers/` … IFSC表彰台経験者の身長・リーチ・体重と、比較に使う統計。`npm run collect:climbers` で IFSC と DigitalRock から取り直せます（取得したデータは `.cache/collect/` に保存し、Gitには入れません）。
- `content/data/evidence.json` … 2026年9月に集めた出典つきデータ（選手の公式値、高難度の登攀記録、怪我の研究、出典）。
- `content/data/gyms.json`・`content/data/glossary.json` … ジムと用語集。

## 公開

main に push すると、GitHub Pages（main / ルート）がそのまま公開します。GitHub Actions は使いません（全プロジェクト共通の方針）。`.github/workflows/` は以前の記録として残しているだけで、現在は動いていません。

作業の方針は [AGENTS.md](AGENTS.md)、今回の再構成の記録は [docs/2026-10-15-restructure.md](docs/2026-10-15-restructure.md) にあります。
