# 高難度アウトドアクライミング・データベース設計

## 目的

世界の高難度アウトドアクライミングについて、ローカル岩場ガイドの代替ではなく、**歴史・難易度・登攀者・地理・岩質・スタイルを横断的に分析できるデータベース**を作る。

主な問い：
- 何年に、どのグレードの課題・ルートが初登されたか
- 世界最高難度はどのように更新されてきたか
- V16以上などの高難度を複数登っているクライマーは誰か
- そのランキングは年ごとにどう変わったか
- 高難度課題は世界のどこに集中しているか
- 高難度課題にはどんな岩質・傾斜・ムーブ傾向があるか
- 初登後、どのくらいの期間で再登されるのか

低〜中難度の全課題網羅は目的にしない。現地情報・トポ・アクセス情報は既存のローカルサイトや公式ガイドを優先し、本プロジェクトでは世界的な高難度帯の分析に集中する。

---

## 1. 対象範囲

### Phase 1: Boulder
初期は高難度ボルダーを中心に整備する。

収集開始の目安：
- V14 / 8B+ 以上を広く収集候補
- V15 / 8C 以上を重点監査
- V16 / 8C+ 以上を最重要データとして高精度に監査
- V17 / 9A 等の最高難度帯は個別に詳細確認

閾値は固定せず、データ量・公開情報量に応じて調整する。

### Phase 2: Outdoor Lead / Sport Route
ボルダーの設計が安定した後、リードの高難度ルートへ拡張する。

目安：
- 9a / 5.14d 以上を収集候補
- 9b / 5.15b 以上を重点監査
- 9c / 5.15d 等の最高難度帯を最重要監査

Speed、Competition課題、Trad、Alpine等はこのデータセットでは原則分離する。

---

## 2. 課題・ルート基本データ

1課題 / 1ルートにつき以下を保持する。

### Identity
- `id`
- `name`
- `discipline`: boulder / sport_route
- `alternate_names`

### Grade
- `original_proposed_grade`
- `current_consensus_grade`
- `grade_system`
- `grade_status`: proposed / consensus / disputed / downgraded / upgraded
- `grade_history`
- `grade_confidence`

初登時の提示グレードと現在のコンセンサスを上書きせず、履歴として残す。

### First ascent
- `first_ascent_date`
- `first_ascent_year`
- `first_ascensionist_id`
- `fa_source`
- `fa_video_url`

日付が不明な場合は年・月など確認できた粒度だけを保存し、`date_precision` を持つ。

### Location
- `country`
- `region`
- `area`
- `subarea`
- `latitude`
- `longitude`
- `coordinate_precision`: exact / area / approximate
- `location_source`

アクセス上センシティブな岩場や非公開課題については正確な座標を掲載しない。原則としてエリア単位の地図表示で十分とし、正確な座標は公式・公開情報かつ公開に問題がない場合のみ扱う。

### Rock / line
- `rock_type`: granite / sandstone / limestone / gneiss / volcanic / conglomerate / other
- `formation_type`
- `height_m`
- `wall_angle_estimate`
- `line_style`
- `landing_or_route_notes`

### Climbing style
複数タグ可：
- crimp
- sloper
- pinch
- pocket
- compression
- roof
- steep
- slab
- technical
- power
- body_tension
- dyno
- coordination
- heel_hook
- toe_hook
- kneebar
- endurance
- power_endurance
- other

岩の形・ラインの特徴も文章だけでなくタグ化し、後で集計できるようにする。

### Sources / media
- `primary_source_urls`
- `secondary_source_urls`
- `youtube_urls`
- `other_video_urls`
- `photo_source_urls`
- `last_verified_at`
- `data_confidence`

動画・写真は権利条件を確認し、原則としてリンクまたは正規埋め込みを使う。無断で再配布しない。

---

## 3. 登攀記録データ

課題情報と登攀記録を別テーブルにする。

- `ascent_id`
- `climber_id`
- `climb_id`
- `ascent_date`
- `date_precision`
- `ascent_type`: FA / repeat / flash / onsight（該当時）
- `grade_at_time`
- `climber_opinion_on_grade`
- `source_url`
- `video_url`
- `verification_status`
- `confidence`

これにより、課題のグレードが後から変更されても「当時どのグレードとして登られていたか」を残せる。

---

## 4. クライマーデータ

ランキング・歴史分析に必要な最小情報を保持する。

- `climber_id`
- `name`
- `nationality`
- `birth_year`（公開情報がある場合）
- `gender`（分析上必要かつ公開情報がある場合）
- `primary_style`
- `profile_sources`

身体データ分析DBとはIDを共有できる設計にする。

---

## 5. 高難度クライマーランキング

単一のブラックボックス的な総合点だけではなく、まず透明な実績指標を表示する。

### 基本指標
ボルダー例：
- 最高完登グレード
- V17以上完登数
- V16以上完登数
- V15以上完登数
- V14以上完登数
- V16以上の初登数
- 高難度課題の総初登数
- 異なる岩場 / 国での高難度完登数

リードも同様に9c / 9b+ / 9b / 9a+ / 9a等で集計する。

### 年次ランキング
各年末時点で「その時点までに確認された実績」を集計し、ランキング推移を保存する。

例：
- 2015年末のV15+完登ランキング
- 2020年末のV16+完登ランキング
- 2026年末の高難度総合ランキング

これにより、単なる現在ランキングではなく、トップ層が歴史的にどう入れ替わったかを可視化できる。

### Experimental Elite Score
必要なら後から総合点を導入する。ただし、
- グレード
- 本数
- 初登
- 再登
- グレードの確度
をどう重み付けしたか公開し、`ranking_method_version` を保存する。

まずはグレード別本数のような解釈しやすいランキングを主表示にする。

---

## 6. 高難度ボルダー年表

年ごとに以下を集計する。

- その年に初登されたV14+課題数
- V15+課題数
- V16+課題数
- 最高提示グレード
- 現在のコンセンサスで見た最高グレード
- 主な歴史的初登
- 初めて特定グレードに到達したクライマー
- そのグレードを登った累計クライマー数

重要な課題はタイムライン上にカード表示し、課題名、クライマー、場所、グレード、動画リンクを表示する。

---

## 7. 世界地図

世界地図上に高難度課題を表示する。

### フィルタ
- Boulder / Route
- Grade
- First ascent year
- Country / Region
- Rock type
- Style
- First ascensionist
- Repeat count

### 表示
ピンを選ぶと、
- 課題名
- 現在グレード
- 初登年
- 初登者
- 岩場
- 岩質
- ライン特徴
- 確認済み再登数
- 動画リンク
を表示する。

高難度課題の「世界的な分布」を見る用途を重視し、現地トポとしての正確なアプローチ案内は目的にしない。

---

## 8. 面白い分析テーマ

### 歴史
- 世界最高難度の変遷
- V15 / V16 / V17が初めて登られた時期
- 各グレードの課題数が増える速度
- 初登から最初の再登までの期間
- 高難度帯が一般化するまで何年かかったか

### クライマー
- V16を複数本登ったクライマー
- V15+完登数ランキング
- 初登数ランキング
- 年ごとのトップクライマー推移
- 最高難度だけでなく高難度を安定して多数登る選手の比較

### 地理
- 高難度課題が多い国・地域
- 岩場別の高難度課題数
- 岩質別の高難度課題数
- 高難度ボルダーの地理的拡大

### スタイル
- V16+で多い岩質・傾斜・ホールドタイプ
- 高難度化に伴い課題スタイルがどう変化したか
- クリンプ系・コンプレッション系・ルーフ系などの割合

### Grade reliability
- 初登グレードから降格された課題の割合
- 再登者数とグレード安定度
- 長期間未再登の高難度課題

---

## 9. データ品質ルール

高難度帯はグレード論争が多いため、単一サイトの記載だけで確定しない。

優先順位の例：
1. クライマー本人の一次情報
2. 公式 / 著名クライミングメディアによるインタビュー・報道
3. 信頼できる課題データベース
4. その他二次情報

`source_count`、`confidence`、`verification_status` を持つ。

状態例：
- verified
- likely
- disputed
- insufficient_evidence

グレードは事実というより評価であることを前提にし、異論がある場合はそのまま記録する。

---

## 10. 初期実装方針

1. Boulder V16+を最優先で完全に近い形へ整備
2. V15へ拡張
3. V14へ拡張
4. 高難度クライマー別登攀記録を統合
5. 年表とランキングを生成
6. 世界地図を作成
7. 岩質・スタイル分析を追加
8. Outdoor Lead 9b+等の最高難度帯へ拡張
9. 9a以上へ拡張

まず件数を追うより、最高難度帯について課題・登攀者・日付・グレード履歴・出典を正確に揃え、スキーマを固める。