# クライミング・トレーニング記事設計

## 目的

一般クライマーが「何を、どのくらい、どの順番でやれば強くなれるか」を判断できるようにする。

単にトレーニング種目を列挙するのではなく、対象能力、競技レベル、頻度、回復、怪我リスク、エビデンス、実践例を分けて整理する。

## 中心テーマ

### 1. 週何日登るのがよいか

主要な問い：
- 初心者、中級者、上級者で最適な頻度は違うか
- 週2、3、4、5日で何が変わるか
- 連登と休養日の配置
- 高強度セッション後にどの程度回復時間を取るべきか
- 指、皮膚、腱、全身疲労を別々に考える必要があるか
- 年齢、仕事、睡眠、怪我歴でどう変えるか

結論を「全員週3日」のように固定せず、負荷量と回復能力から考える。

### 2. クライミング能力を分解する

- Finger Strength
- Contact Strength / RFD
- Pulling Strength
- Lock-off Strength
- Compression
- Body Tension
- Core
- Power
- Power-Endurance
- Aerobic Endurance
- Mobility / Flexibility
- Balance
- Footwork
- Coordination
- Technique / Movement Skill
- Route Reading / Beta Reading
- Mental / Tactical Skill

「強くなる」を一つの能力として扱わず、弱点を特定してトレーニングを選ぶ。

### 3. Fingerboard / Hangboard

記事候補：
- Hangboardは誰に必要か
- Max Hangとは何か
- Edge Sizeと追加重量の違い
- Half Crimp / Open Handの使い分け
- 片手Hangへの移行
- Density Hang / Repeaters
- 週何回行うか
- クライミングセッションとどう組み合わせるか
- 何秒Hangがよいか
- Finger Strengthを体重比でどう評価するか
- 怪我リスクと負荷進行

### 4. Campus Board

- Campus Boardの目的
- Finger StrengthとContact Strengthの違い
- Max Reach / Ladder / Double Dyno等の違い
- 誰が使うべきか
- 初中級者に必要か
- 高負荷であることと怪我リスク

### 5. 筋力トレーニング

- Pull-up / Weighted Pull-up
- One-arm Pull-up progression
- Lock-off
- Row
- Press / Push
- Shoulder stability
- Compression系
- Core / Anti-extension / Anti-rotation
- Lower body strength

クライミングそのものとのトレードオフを扱う。

### 6. 持久力・Power-Endurance

- LeadとBoulderで必要能力がどう違うか
- 4x4
- Intervals
- Circuits
- ARC
- Route laps
- Rest interval
- Pumpと前腕酸素化

### 7. テクニック

- 足使い
- 重心移動
- Drop Knee
- Flag
- Heel Hook
- Toe Hook
- Smear
- Hip positioning
- 静的 / 動的ムーブ
- Coordination
- Beta reading

可能なら競技課題データベースや力学記事と相互リンクする。

### 8. 柔軟性・可動域

- Hip mobility
- Hamstring
- Calf / ankle mobility
- Shoulder mobility
- High step
- Frog position
- Split-like positions

「柔らかいほど良い」とせず、実際にどの動作に寄与するかを整理する。

### 9. 回復

- 休養日
- 睡眠
- 栄養
- タンパク質
- 炭水化物
- 水分
- 指・腱の回復
- 皮膚の回復
- Deload
- 疲労指標

### 10. セッション設計

例：
1. Warm-up
2. Skill / Coordination
3. Max strength / Limit Boulder
4. Power
5. Volume / Endurance
6. Conditioning
7. Cool-down

目的によって順番を変える理由も説明する。

### 11. Projecting

- 高難度課題をどう分解するか
- ムーブ解決とリンク
- トライ間レスト
- セッションをまたぐ情報記録
- 動画分析
- コンディション
- 皮膚管理
- 外岩でのシーズン設計

### 12. レベル別ガイド

#### 初心者
- 登ることそのものを優先
- 動作学習
- 安全
- 過度なFingerboardを避ける

#### 中級者
- 弱点分析を開始
- Limit Boulder
- 基本筋力
- Finger Strength
- 計画的な休養

#### 上級者
- 能力ごとの定量評価
- 高強度トレーニング
- Periodization
- Project-specific training
- 負荷管理

## データ化できる項目

トレーニング記事だけでなく、研究データベースを作る。

例：
- study_id
- year
- participants
- climbing_level
- intervention
- duration_weeks
- sessions_per_week
- intensity
- control_group
- outcome
- effect
- injury/adverse_event
- DOI / URL
- evidence_level
- limitations

## 将来作れるツール

- 週のトレーニング頻度シミュレーター
- Finger Strength percentile
- 体重比Pull-up比較
- 自己評価から弱点候補を出す診断
- Boulder / Lead別のトレーニング優先度
- 怪我歴を考慮した負荷管理チェック

これらは医学的診断ではなく、一般的なトレーニング計画支援として扱う。

## 編集原則

- 研究結果とコーチ・選手の経験則を分離する
- 単一研究から断定しない
- 「最適」を一律に決めない
- レベル、年齢、目的、怪我歴、回復能力を条件として示す
- 高負荷トレーニングには適用条件とリスクを明記する
- 一般クライマーが実際に試せる形まで具体化する
