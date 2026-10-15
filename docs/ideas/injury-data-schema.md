# 怪我データ設計

## 目的

クライミングにおける怪我について、

- 学術研究から得られる疫学データ
- トップクライマー / プロ選手の公開された怪我事例
- 怪我の発生状況
- 復帰までの経過

を分けて保存し、後から集計・可視化できるようにする。

---

## 1. 選手の怪我事例データ

推奨カラム：

| field | 内容 |
|---|---|
| athlete_id | 選手ID |
| athlete_name | 選手名 |
| sex | 性別 |
| birth_year | 生年 |
| injury_date | 怪我発生日または時期 |
| age_at_injury | 怪我当時の年齢 |
| primary_discipline | 主カテゴリー |
| environment | outdoor / competition / gym / training |
| injury_region | finger / wrist / elbow / shoulder / back / knee / ankle / foot 等 |
| injury_structure | pulley / tendon / ligament / joint / bone / muscle 等 |
| diagnosis | 公開情報で確認できる診断名 |
| finger | 指の場合の対象指 |
| side | left / right / bilateral |
| acute_or_overuse | acute / overuse / unclear |
| mechanism | 発生機序 |
| move_type | crimp / pocket / dyno / heel hook / fall / landing 等 |
| hold_type | edge / pocket / sloper / pinch 等 |
| wall_angle | slab / vertical / overhang 等 |
| surgery | 手術の有無 |
| treatment_summary | 公表された治療概要 |
| rehab_summary | 公表されたリハビリ概要 |
| return_date | 復帰時期 |
| return_time_days | 復帰までの日数（算出可能な場合） |
| post_return_performance | 復帰後の主な実績 |
| primary_source | 本人・チーム・大会等の一次情報 |
| secondary_source | 記事等の二次情報 |
| source_date | 情報公開日 |
| confidence | high / medium / low |
| notes | 補足 |

### 信頼度

- **high**: 本人、公式チーム、競技団体、医師・医療機関等が具体的に公表
- **medium**: 信頼できる専門メディアが本人発言等を引用
- **low**: SNS上の推測、第三者の未確認情報等。原則として統計分析の主要データから除外

「怪我をしたらしい」といった情報から診断名を推測しない。

---

## 2. 学術研究データ

研究単位で保存する項目：

| field | 内容 |
|---|---|
| study_id | 研究ID |
| title | 論文タイトル |
| year | 発表年 |
| study_design | systematic review / cohort / cross-sectional / case series 等 |
| participants | 対象者数 |
| population | elite / recreational / youth / competition 等 |
| discipline | boulder / lead / mixed 等 |
| exposure_definition | 怪我率の分母・曝露量 |
| injury_definition | 研究内の怪我定義 |
| injury_count | 怪我件数 |
| injury_rate | 報告された発生率 |
| body_region_distribution | 部位別割合 |
| diagnosis_distribution | 診断別割合 |
| key_findings | 主結果 |
| limitations | 限界 |
| doi_or_url | DOI / URL |

研究ごとに「怪我」の定義が異なるため、割合を単純結合しない。

---

## 3. 集計したい指標

- 全怪我に占める指の割合
- 上肢 / 下肢の割合
- 急性外傷 / オーバーユースの割合
- Outdoor / Competition / Gym / Training の比較
- Boulder / Lead の比較
- エリートと一般クライマーの比較
- 指では pulley / tendon / joint / ligament 等の比較
- ボルダリング着地による足首・膝等の割合
- トップ選手の復帰期間分布
- 手術例と保存療法例の比較（公開データの範囲内）

---

# 医療系記事の根拠ルール

## 情報源の優先順位

1. Systematic Review / Meta-analysis
2. Consensus statement / clinical guideline
3. Prospective cohort 等の質の高い原著研究
4. クライミング医学を扱う査読論文
5. 症例報告・case series
6. 専門医療機関・競技団体による解説
7. 選手本人の経験談
8. 一般ブログ・SNS

下位の情報だけで一般的な治療法を断定しない。

## 記事内で区別するもの

- **分かっていること**：比較的根拠が強い
- **可能性があること**：研究はあるが確定的ではない
- **臨床で使われることがある方法**：適応が個人で異なる
- **選手の実例**：個別事例であり一般化できない

## 医療記事の基本構造

1. どこを傷める怪我か
2. どういう動作で起こりやすいか
3. 典型的な症状
4. 他の怪我との区別
5. 医療機関でどのように評価されるか
6. 保存療法の考え方
7. 手術が検討されるケース
8. リハビリの考え方
9. クライミング負荷の戻し方
10. 再発予防
11. 受診を優先すべき兆候
12. 根拠となる文献

## 禁止する書き方

- 症状だけで「あなたはA2プーリー断裂です」と診断する
- 一つの治療法を全員に推奨する
- 復帰日数を固定値として断定する
- トップ選手の治療例をそのまま一般クライマーへ適用する
- 痛みの消失だけを組織治癒と同一視する

最終的には、医療情報として安全性を保ちながら、クライマーが「何が起きている可能性があり、どのように評価・復帰していくのか」を理解できる記事を目指す。
