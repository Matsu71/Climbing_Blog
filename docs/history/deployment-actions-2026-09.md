# 公開・検証・復旧

## 状態を分ける

1. コードがGitHubに保存されている。
2. 当該コミットの `verify` ジョブが成功している。
3. `pages_preflight` が `configured` と報告している。
4. `deploy` ジョブが成功している。
5. 実際の公開URLを開き、対象コミットの内容を確認している。

1〜3だけでは一般公開済みとは扱いません。ブラウザー検証はローカルのHTTPサーバーを使った実エンジンの検証です。

## GitHub Pages初回設定

調査時点（2026-09-11）はリポジトリの `has_pages` が `false` でした。現在の状態はワークフローの `crux-publishing-state-<SHA>` アーティファクトにある `deployment-status.json` を優先してください。

リポジトリ管理者が一度だけ、GitHubの次の設定を行います。

**Climbing_Blog → Settings → Pages → Build and deployment → Source → GitHub Actions**

次に **Actions → Verify CRUX → Run workflow → Branch: main** を実行します。以後の `main` 更新は、検証・公開状態確認・デプロイを順に実行します。

予定URLは `https://matsu71.github.io/Climbing_Blog/` です。これは公開確認済みのURLという意味ではありません。

標準の `GITHUB_TOKEN` は初回有効化用の管理者権限を代替しません。この実装は追加の個人トークンを収集せず、既存の公開設定を読み取るだけです。

## 自動処理

- 全ブランチ・PR：Nodeのテスト、静的生成、内部リンク検査、Pythonの公開状態判定テスト、Chromium、WebKit。
- `main` のpush・手動実行：すべての検証を通過した `dist/` をPagesアーティファクトに梱包。
- Pages設定が存在し、公開元がworkflowで、URLが検証済みの生成先と一致した場合だけ `deploy`。
- 未有効化：`initial_configuration_required` と記録し、デプロイをスキップ。テスト成功と公開成功を混同しない。
- 権限不足やサーバー障害：設定確認の失敗として扱う。未有効化と断定しない。
- 独自ドメイン・公開パスが違う：`origin_review_required`。URLとビルドの設定を揃えて再検証する。

## 証跡

`crux-verification-<SHA>`：`artifacts/commit.txt`、`artifacts/source.zip`、Nodeログ、Chromiumの `browser-tests.json`、WebKitの `webkit/tests.json`、各スクリーンショット、`dist/`。

`crux-publishing-state-<SHA>`：PagesのHTTP応答コード、設定状態、対象コミット、確認時点。秘密のトークンは保存しません。

Actionsの証跡保持は14日です。長期保存が必要なリリースでは、対応するアーティファクトを別途保管してください。

## 他のホストへ配置

Nodeで静的ファイルを生成し、`dist/` の内容だけをホストに配置できます。

```sh
BASE_PATH=/ SITE_ORIGIN=https://example.org npm run check
npm run serve
```

変更後はURL・404・内部リンク・両ブラウザーを再検証してください。単に `file://` でHTMLを開くと、ESモジュールのブラウザー制約により一部機能が動作しません。

## 復旧

不具合のある変更は、履歴を強制上書きせずrevertして通常のCIで検証します。失敗したビルドはデプロイされません。個人ノートの保存形式は `schema_version: 1`。形式変更には移行テストが必要で、破損したデータを空配列で上書きしません。

## 公式仕様

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://github.com/actions/configure-pages/blob/v5/action.yml

確認日：2026-09-11。
