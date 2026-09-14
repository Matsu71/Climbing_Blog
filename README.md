# CRUX — クライミングブログ

最終目標は、世界一のクライミングブログを作ること。現在は**記事の量産より、データ収集と出典確認・見やすさの改善を優先**しています。

## 作業版の収録データ（2026-09-14・第5バッチ）

**このコピーには未公開の変更を含みます。** 確認したGitHub mainは第3バッチ `ad0e7c6`、第4バッチの作業ブランチは `9639a2a` です。この作業版をmainへ反映したことや、最新変更のリモート検証・公開が完了したことを意味しません。

| 領域 | 公開済みmain → 作業版 |
|---|---|
| 身体数値のある選手 | 30人 → 37人 |
| 出典付き掲載数値 | 54件 → 72件 |
| 登攀記録 | 56課題64登攀 → 84課題96登攀 |
| 医療研究 | 10件 → 15件。別に合意声明1件・公的資料1件 |
| 出典台帳 | 67件 → 85件（別言語版や同じ論文の別URLを含む） |

今回の新規採録は第4バッチに対し、身体数値8件、登攀17件、医療研究3件、出典9件です。課題名の表記差2レコードを同一課題に照合し、原表記も残しています。新しい記事は0本です。

身体値は身長37人・体重10人・リーチ17人、正確な測定日が確認できた掲載値は0件です。2018年大会名鑑の値は現在値として扱いません。医療資料17件は本文9件・抄録8件で、医学的監修は未実施です。既存記事28本を今回と同じ出典監査済みとは扱いません。

[今回の採録・検証・未反映の状態](project-docs/evidence-continuation-e-2026-09-14.md) / [第4バッチ](project-docs/evidence-followup-2026-09-14.md) / [第3バッチ](project-docs/evidence-expansion-2026-09-14.md)

## 主な入口

`athlete-data/` 選手の身体データ / `ascent-data/` 登攀記録 / `injury-data/` 怪我の資料 / `evidence/` 出典と未収集項目。

具体的な短い見出しと検索・絞り込みを中心に再設計しました。旧「理想体型」記事に含まれた、出典のない推定値・平均値は撤回しています。

## 資料とソース

- [作業方針](AGENTS.md)
- [最終目標](project-docs/site-vision.md)
- [今回の比較調査・構成・編集基準](project-docs/data-first-2026-09-14.md)
- [状態と残課題](project-docs/implementation/STATUS.md)
- [元の構想全文](project-docs/original-brief.md)

`data/evidence.mjs` が収録データの統合入口です。初回の正本は `data/evidence-initial.mjs`、第2バッチは `data/evidence-additions.mjs`、第3バッチは `data/evidence-expansion.mjs`、第4バッチは `data/evidence-followup.mjs`、第5バッチは `data/evidence-continuation-e.mjs` に保持します。課題名の照合・整合性・収集範囲は `data/evidence-integrity.mjs` で管理します。本文追加確認の前後は統合データの `revision_history` に残します。出典ごとの数値、原表記、欠損、日付精度、研究の限界、未解決項目を保存しています。`data/catalog.mjs` 等は既存資料です。

## 起動・検証

Node.js 22以上。サイト本体に外部npm依存はありません。

```sh
npm run check
npm run serve
# http://127.0.0.1:4173/Climbing_Blog/
python -m unittest discover -s tests -p 'test_*.py'
# Playwrightとブラウザーを用意した環境:
python tests/browser_smoke.py
python tests/webkit_smoke.py
```

`dist/` は104経路の静的出力です。本文と出典はJavaScriptなしでも閲覧可能です。JSON/CSVを同時に生成します。画面からは全件／表示中を選択でき、表示中のJSONは出典・確認履歴も保持します。ルート・旧docsの互換公開は同じ元データからブラウザーで描画し、書き出しも端末内で行います。公開設定は変更しません。

ソースの反映・検証成功・公開成功は別状態です。CIの `Verify CRUX` とPagesの結果をそれぞれ確認してください。[公開手順](project-docs/implementation/DEPLOYMENT.md)

## 編集・プライバシー

未確認の値は推測で補いません。古い体重や成長期の身長を現在値にしません。医療情報は専門家監修前で、個別の診断・治療・復帰許可ではありません。理想体型や減量目標を提示するデータでもありません。

トライノートは明示操作でブラウザー内に保存します。クラウド送信・同期・アカウントはありません。第三者の文章・写真・動画を丸ごと転載しません。
