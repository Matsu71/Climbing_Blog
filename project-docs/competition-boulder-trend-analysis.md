# 競技ボルダー課題トレンド分析・データベース設計

## 目的

World Climbing / IFSC 系列のワールドレベル大会、Continental Championship / Series、主要国際大会等の公式映像を基に、インドア競技ボルダーの課題を構造化データとして蓄積する。

単に「コーディネーション課題」「保持課題」と1種類に分類するのではなく、1課題を複数の能力軸・動作軸・壁構造軸で数値化し、年ごとのセット傾向、男女差、大会レベル差、地域差を分析できるようにする。

主な問い：
- 競技ボルダーは過去10〜20年でどう変化したか
- 保持力系課題は減っている / 増えているか
- コーディネーション課題の割合はどう推移しているか
- スラブ、垂壁、強傾斜の割合は変化しているか
- 男子と女子で要求能力の構成は違うか
- World / Europe / Asia / Pan America / Oceania等でセット傾向に差があるか
- 決勝と予選では課題タイプがどう違うか
- 現代の競技で必要な能力は何か

---

## 1. 分析対象

### 優先順位
1. World-level Boulder events（World Series / World Cup相当、World Championships等）
2. Continental Championships
3. Continental Series / Cups
4. Olympic / Asian Games等の主要総合大会
5. Youth World / Continental Championships（別データセットとして扱う）

### 基本単位
`大会 > ラウンド > 性別 > 課題 > 選手の各トライ`

課題そのものの特徴と、選手が実際に採用したムーブは別テーブルにする。

---

## 2. 最重要方針：単一カテゴリではなく多軸スコア

各課題を0〜5で評価する。0はほぼ不要、5は課題の核心となる能力。

### A. Finger / Grip Demand：保持力要求
- 0: 大きなジャグ・ボリューム中心で保持難度が低い
- 1: 軽い保持力
- 2: 一般的な競技保持
- 3: 明確な保持力要求
- 4: 小さいエッジ、悪いスローパー等が核心
- 5: 世界トップレベルでも保持そのものが主要リミット

補助項目：
- crimp
- pinch
- sloper
- pocket
- volume friction
- undercling
- sidepull
- gaston
- compression hold

### B. Pulling / Upper-body Strength：上半身筋力
ロックオフ、片腕での引き付け、大きな引き動作等。

### C. Compression Strength：コンプレッション力
両手・両腕で挟み込む力、肩・胸郭・体幹を使う圧縮動作。

### D. Contact Strength / Explosive Power：瞬発的な保持・接触力
デッドポイント、ランジ、飛びつきで接触直後に保持する能力。

### E. Body Tension / Core：ボディテンション
強傾斜、足切れ耐性、遠い足位置、水平姿勢等。

### F. Lower-body Power：下半身パワー
ジャンプ、蹴り出し、大きなステップアップ等。

### G. Balance：バランス
重心制御、低摩擦フット、スラブ等。

### H. Foot Precision / Footwork：足技・精度
小さいフット、スメア、足位置変更、トゥ・ヒール等。

### I. Mobility / Flexibility：可動域
ハイステップ、開脚、股関節可動域、肩可動域等。

### J. Coordination：コーディネーション
単一値に加えて以下を細分化する。

#### J1. Upper-body Coordination
手から手、パドル、連続キャッチ等、主に上半身で完結。

#### J2. Hand-Foot Coordination
手と足を同時または連続して正確に合わせる。

#### J3. Whole-body Coordination
上肢・下肢・体幹を連動させる動的ムーブ。

#### J4. Run / Jump / Parkour
ランニングスタート、ステップ、壁・ボリュームを走る動き。

#### J5. Redirect / Momentum Control
振られ、反動、方向転換、スイング制御。

### K. Technical Complexity：技術的複雑性
単純な力発揮ではなく、身体位置・方向・順序・ベータ理解が要求される度合い。

### L. Power-Endurance：パワー持久力
1〜2手ではなく、複数の高強度ムーブを連続して実施する要求。

---

## 3. 課題の壁・形状データ

### Base Wall Angle
可能なら実角度を記録。分からない場合は映像から推定し `estimated=true` とする。

目安：
- slab: < 90°
- vertical: 約90°
- slight overhang: 91〜105°
- moderate overhang: 106〜120°
- steep: 121〜140°
- roof / near-horizontal: > 140°

ただし競技壁はボリュームで実効角度が大きく変わるため、基礎壁角度と `effective_surface_angle` を分離する。

### Wall Geometry
- flat
- dihedral
- arete
- corner
- prow
- roof
- volume-dominant
- multi-plane

### Hold Composition
各課題に含まれる主要ホールドの比率・有無：
- crimp / edge
- sloper
- pinch
- jug
- pocket
- volume
- dual-texture
- macro
- foothold

---

## 4. 動作タグ

複数選択可能。

- static
- lockoff
- deadpoint
- dyno
- paddle
- double-dyno
- run-and-jump
- step-up
- skate / slide
- toe hook
- heel hook
- bicycle
- drop knee
- flag
- smear
- mantle
- press
- compression
- campus
- swing
- cut-loose
- rose move
- cross-through
- match
- hand-foot match
- foot swap
- no-hand / low-hand balance
- pogo
- coordination jump
- redirect

タグは固定辞書を基本にしつつ、将来追加可能にする。

---

## 5. 「課題要求」と「選手ベータ」を分離

### problem table
課題自体の要求能力、ホールド、壁角度、想定ムーブを保存。

### athlete_attempt table
各選手について：
- athlete_id
- attempt_no
- start_timestamp
- end_timestamp
- success / fail
- zone / top
- beta tags
- dynamic/static ratio
- alternative_beta
- key_failed_move
- fall_reason
- time_to_top

同じ課題でも長身選手と小柄な選手、男子と女子でベータが変わるため、最低でも複数選手の成功トライを確認して課題スコアを決める。

---

## 6. 難しさを「要求能力」と分離する

能力要求スコアとは別に、課題の実績ベース難易度を保存する。

- top_rate
- zone_rate
- flash_rate
- attempts_per_top
- median_attempts_to_top
- finalist_top_rate
- no_top_flag

これにより、例えば「コーディネーション要求5だがトップ率80%」と「保持力要求5でトップ率5%」を別物として分析できる。

---

## 7. AI映像分析パイプライン案

### Step 1: 公式大会・映像メタデータ収集
保存項目：
- event_id
- event_name
- year
- date
- city / country
- region
- competition_tier
- round
- gender
- official_event_url
- official_video_url
- video_id

### Step 2: 課題ごとのタイムスタンプ抽出
- problem_start_time
- problem_end_time
- observation_time（ある場合）
- athlete attempt timestamps

動画ファイルを無断再配布する前提にはせず、基本は公式URL、video_id、タイムスタンプ、分析結果を保存する。

### Step 3: AIによる一次アノテーション
映像から：
- 壁角度推定
- ホールド種別
- 動作タグ
- 能力要求スコア
- 成功 / 失敗ムーブ
を仮付与。

### Step 4: 人間による監査
AI分類は主観が入りやすいため、重要大会・決勝課題を優先して手動監査する。

保存：
- ai_confidence
- reviewer_status
- reviewer_notes
- taxonomy_version

### Step 5: 複数選手比較で最終スコア確定
1選手だけの登り方を課題特性と誤認しない。

---

## 8. 推奨データスキーマ

### events.json / events.csv
- event_id
- event_name
- season
- date_start
- date_end
- city
- country
- continent
- competition_tier
- organiser
- official_url

### problems.json / problems.csv
- problem_id
- event_id
- round
- gender
- problem_number
- official_video_url
- start_timestamp
- end_timestamp
- wall_angle_deg
- wall_angle_estimated
- effective_surface_angle
- wall_geometry
- hold_types
- move_tags
- grip_demand
- pulling_strength
- compression_strength
- contact_strength
- body_tension
- lower_body_power
- balance
- footwork
- mobility
- coordination_upper
- coordination_hand_foot
- coordination_whole_body
- coordination_parkour
- coordination_redirect
- technical_complexity
- power_endurance
- top_rate
- zone_rate
- flash_rate
- attempts_per_top
- setter_intent_notes
- ai_confidence
- reviewer_status
- taxonomy_version

### attempts.json / attempts.csv
- attempt_id
- problem_id
- athlete_id
- attempt_no
- success
- zone
- top
- beta_tags
- key_move
- fall_move
- alternative_beta
- attempt_timestamp

---

## 9. 年代トレンドとして出したい指標

各年について：
- 平均壁角度
- slab / vertical / overhang比率
- dynamic moveを含む課題率
- coordination score平均
- grip demand平均
- balance平均
- compression平均
- body tension平均
- parkour系課題率
- dual-texture / volume中心課題率
- トップ率
- フラッシュ率

さらに男女別・大会レベル別・地域別で比較する。

---

## 10. 記事候補

1. 「競技ボルダーは本当にコーディネーション化しているのか」
2. 「10年前と現在のWorld Cup課題を数値で比較する」
3. 「男子と女子では要求される能力が違うのか」
4. 「スラブは増えたのか：壁角度の20年変化」
5. 「保持力課題は競技から消えたのか」
6. 「ヨーロッパとアジアで課題傾向は違うのか」
7. 「World-levelとContinental-levelではセットがどう違うか」
8. 「最もフィジカルだった大会 / 最もテクニカルだった大会」
9. 「トップ率から見る歴代最難課題」
10. 「現代競技ボルダー選手に必要な能力構成」

---

## 11. 注意点

- 課題分類には主観が入るため、定義と採点例を固定する。
- taxonomy_version を保存し、基準変更時に再評価できるようにする。
- 映像だけでは壁角度・ホールドの摩擦・実際の保持感等を完全には判定できない。
- 競技結果は課題難度だけでなく選手層にも依存するため、大会間比較では競技レベルを考慮する。
- セッターの意図と実際の選手ベータは一致しない場合がある。
- YouTube等の公式映像はURL・タイムスタンプを中心に扱い、映像そのものの保存・再配布は各サービスの利用条件と権利を確認する。

## 12. 初期実装方針

まずは決勝課題に限定してデータ品質を優先する。

推奨初期サンプル：
- 直近5〜10シーズン
- World-level Boulder Finals
- Men / Women
- 1大会あたり4課題前後

100〜300課題を手動監査付きで作れば、最初のトレンド記事には十分な分析量になる。その後、Semifinal、Qualification、Continental Championshipsへ広げる。
