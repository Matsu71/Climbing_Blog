---
title: "クライマーに最適な身長・体重は？ 世界大会の表彰台279人をデータで分析"
category: 身体・能力
summary: "ワールドカップや五輪で表彰台に立った279人の身長・体重・リーチを集めて統計をとりました。身長は「平均的」で成績とはほぼ無関係。体重はBMI 20前後の「身長に対して軽め」が中心でした。"
published: 2026-10-15
updated: 2026-10-15
author: CRUX編集部（調査・集計・執筆：Claude Opus 5.5）
review: "専門家の監修は受けていません"
featured: true
data: climber-height-weight
---

:::summary
- 世界のトップ選手（ボルダー・リードの表彰台経験者）の平均身長は、男子{{height.male.mean|1}}cm、女子{{height.female.mean|1}}cmでした。真ん中の半数は、男子{{height.male.q1|0}}〜{{height.male.q3|0}}cm、女子{{height.female.q1|0}}〜{{height.female.q3|0}}cmです。
- 自国の同世代の平均と比べると、男女とも平均で約2cm低い程度でした。背が高いほど、あるいは低いほど表彰台に多く立っている、という関係はほとんど見られません。
- 体重はBMIの中央値で男子{{bmi.male.median|1}}、女子{{bmi.female.median|1}}。日本の18〜29歳の平均（男性{{japan.male.bmi|1}}、女性{{japan.female.bmi|1}}）より軽めです。
- 統計上の「中心像」は、男子なら身長{{ideal.male.heightLow}}〜{{ideal.male.heightHigh}}cm・BMI {{ideal.male.bmiLow|1}}〜{{ideal.male.bmiHigh|1}}、女子なら{{ideal.female.heightLow}}〜{{ideal.female.heightHigh}}cm・BMI {{ideal.female.bmiLow|1}}〜{{ideal.female.bmiHigh|1}}。強い選手に多い体格であって、目指すべき目標値ではありません。
:::

## 結論：身長はほぼ関係なく、体重は「軽め」が多い {#conclusion}

「クライミングは背が低いほうが有利？」「何kgまで絞れば強くなれる？」——ジムでよく聞く疑問です。この記事では、一部の有名選手の印象ではなく、**世界大会で表彰台に立った選手全員**の身長・体重・リーチを集めて、統計で確かめました。

分かったことは3つです。

1. **身長は「平均的」でよい。** トップ選手の身長は自国の同世代とほとんど変わらず（平均で約2cm低い程度）、身長と表彰台の回数にはほとんど関係がありません。
2. **体重は、身長に対して軽めの人が多い。** BMIは男子で20前後、女子で19〜20前後と、一般の若い世代より1〜2ほど低めです。研究者が実際に測ったエリートクライマーの値も、BMI 20〜22に収まっています。
3. **リーチは身長より長い人が多い。** 両腕を広げた長さは、身長より6cmほど長い人が中心でした。ただし研究では、リーチの長さと実力の関係は確認されていません。

以下、データの集め方と、それぞれの結果を詳しく見ていきます。

## データの集め方 {#method}

対象は、2010〜2025年の**IFSC（国際スポーツクライミング連盟）**のワールドカップと世界選手権、東京2020・パリ2024五輪で、1回以上3位以内に入った選手です[^ifsc]。IFSCは2025年12月に「World Climbing」へ名称を変えています[^rename]。公式の大会結果（選手ごとの順位{{counts.ifscResults}}件）から抜き出すと、{{counts.all}}人になりました。このうち、ボルダー・リード（複合を含む）で表彰台に立った{{counts.climbing}}人を「トップクライマー」として分析し、スピードだけで表彰台に立った{{counts.speed}}人は比較に使っています。

| 項目 | 出典 | 使えた人数 |
|---|---|---|
| 身長・リーチ | IFSC公式の選手プロフィール | 身長：男子{{height.male.n}}人・女子{{height.female.n}}人／リーチ：{{ape.all.n}}人 |
| 体重 | DigitalRock（IFSCの以前の結果サービス）に選手が登録した身長・体重 | 男子{{bmi.male.n}}人・女子{{bmi.female.n}}人 |
| 比べる相手 | 日本の18〜29歳の平均、自国の同世代の平均身長、研究で測定されたエリートクライマー | — |

IFSCのプロフィールには体重の欄がないため、体重はDigitalRockの登録値を使いました[^dr]。登録した時期が分からないため、次の3つを満たす{{weight.total}}人だけを集計しています。

- 身長と体重の両方が登録されている
- DigitalRockで最後に大会に出たとき、18歳以上だった
- IFSCのプロフィールに身長がある場合は、その値と2cm以内で一致する

両方のサイトに身長がある{{agreement.n}}人のうち、{{agreement.within}}人は差が2cm以内でした。残る1人は、IFSCでは{{p.lee.height}}cm、DigitalRockでは{{p.lee.dr_height}}cmと10cm違い、成長期に登録した値が残っていたとみられます（この選手の体重は集計に使っていません）。

どの値も選手や競技団体が公開しているもので、測定した日付は分かりません。値が分からない選手を推測で補うことはしていません。選手ごとの値と出典は「[トップクライマーの体格](/data/athletes/)」のページで確認できます。

## 身長：日本の平均と大きくは変わらない {#height}

:::figure height-histogram
:::

ボルダー・リードの表彰台経験者の身長は、男子が平均{{height.male.mean|1}}cm（標準偏差{{height.male.sd|1}}cm）、女子が平均{{height.female.mean|1}}cm（同{{height.female.sd|1}}cm）でした。日本の18〜29歳の平均（男性{{japan.male.height|1}}cm、女性{{japan.female.height|1}}cm）[^mhlw]と比べると、男子は{{vsJapan.male|1}}cm、女子は{{vsJapan.female|1}}cm高い程度です。

分布の幅は広く、男子は{{height.male.min}}〜{{height.male.max}}cm、女子は{{height.female.min}}〜{{height.female.max}}cmの選手が表彰台に立っています。真ん中の半数（下から25〜75%）に入るのは、男子{{height.male.q1|0}}〜{{height.male.q3|0}}cm、女子{{height.female.q1|0}}〜{{height.female.q3|0}}cmです。

ただし、トップ選手は日本だけでなく、フランス、ロシア、中国、アメリカ、インドネシア、スロベニアなど世界中から集まっています。国によって平均身長が違うので、日本の平均とだけ比べるのは十分ではありません。

## 自国の同世代と比べると、平均で約2cm低い {#national}

:::figure relative-height
:::

各選手の身長を、同じ国・同じ生まれ年の人たちの平均身長（NCD-RisCの推定値[^ncd]）と比べました。すると、自国の平均より低い選手のほうが多く、平均すると男子で{{relAbs.male|1}}cm、女子で{{relAbs.female|1}}cm低くなっていました。自国の平均より背が高い選手は、男子で{{rel.male.tallerPct}}%、女子で{{rel.female.tallerPct}}%です。

ただ、この約2cmの差は、選手どうしのばらつき（標準偏差で男子{{rel.male.sd|1}}cm、女子{{rel.female.sd|1}}cm）よりずっと小さなものです。「トップ選手にはやや小柄な人が多い」とは言えますが、「背が高いと不利」と言えるほどの差ではありません。

## 身長と成績は、ほとんど関係しない {#success}

:::figure height-success
:::

表彰台に立った回数と身長の関係を調べると、順位相関係数（−1〜1の値で、0に近いほど関係がない）は男子{{success.male.rho|2}}、女子{{success.female.rho|2}}と、ほぼ0でした。優勝経験のある選手とない選手の平均身長も、男子で{{success.male.winners.mean|1}}cmと{{success.male.nonWinners.mean|1}}cm、女子で{{success.female.winners.mean|1}}cmと{{success.female.nonWinners.mean|1}}cmと、ほとんど同じです。

表彰台の回数が特に多い選手を見ても、身長はさまざまです。女子で最も多いヤンヤ・ガンブレット（{{p.garnbret.podiums}}回）は{{p.garnbret.height}}cm、野口啓代（{{p.noguchi.podiums}}回）は{{p.noguchi.height}}cm、キム・ジャイン（{{p.kim.podiums}}回）は{{p.kim.height}}cmです。男子で最も多いヤコブ・シューベルト（{{p.schubert.podiums}}回）は{{p.schubert.height}}cm、アダム・オンドラ（{{p.ondra.podiums}}回）は{{p.ondra.height}}cm、楢﨑智亜（{{p.tomoa.podiums}}回）は{{p.tomoa.height}}cmでした。

研究でも同じ傾向が報告されています。44人のクライマーの実力の差を分析した研究では、トレーニングに関わる要素で説明できた割合が58.9%だったのに対し、身長や体重などの体格の要素はわずか0.3%でした[^mermier]。

## 種目で見ると、ボルダーの選手はやや背が高い {#discipline}

:::figure height-discipline
:::

選手を、表彰台の回数が多い種目で分けて比べると、ボルダーの選手はリードの選手より、男子で平均{{disc.male.diff|1}}cm、女子で{{disc.female.diff|1}}cm背が高いという差がありました（統計的な検定の結果は、それぞれp={{disc.male.p}}、p={{disc.female.p}}）。

現在の競技ボルダーには、大きく跳ぶ動きや遠いホールドをつなぐ動きが多く、リードは長い壁を登り続ける持久力が中心です。こうした違いが身長の差に表れている可能性はあります。ただし、それぞれ20〜30人ほどの比較で、種目によって選手の国の構成も違うため、はっきりした結論ではありません。スピードの男子は{{speed.male.min}}〜{{speed.male.max}}cmと、特に幅が広くなっています。

## 体重：BMIは20前後 {#weight}

:::figure bmi-scatter
:::

体重が分かった{{weight.total}}人では、体重の中央値が男子{{weight.male.median|1}}kg、女子{{weight.female.median|0}}kgでした。身長の違いをならすために**BMI**（体重kg÷身長mの2乗）で見ると、中央値は男子{{bmi.male.median|1}}、女子{{bmi.female.median|1}}です。日本の18〜29歳の平均（男性{{japan.male.bmi|1}}、女性{{japan.female.bmi|1}}）と比べると、男子で約2、女子で約1低く、同じ身長なら数kg軽い計算になります。

:::figure bmi-compare
:::

この値は選手が登録した値なので、研究者が実際に測ったデータとも比べました。クライマーの体格に関する研究をまとめた系統的レビュー[^ginszt]から、成人の上級〜エリートの群を選ぶと、BMIは男子で{{research.male.min|1}}〜{{research.male.max|1}}、女子で{{research.female.min|1}}〜{{research.female.max|1}}でした。登録値より少し高めですが、どちらも「BMI 20〜22前後」に集まっています。

このレビューでは、上級者ほど体重と体脂肪が少ない傾向が報告されています。一方で、BMIそのものはクライマーと一般の人で差がなかった研究も多く、体重の軽さは「筋肉が多く、脂肪が少ない」という体の組成の結果でもあります。

日本では、BMI 18.5未満が「低体重」とされています[^bmi]。今回のデータでも、男子{{bmi.male.n}}人中{{bmi.male.under185}}人、女子{{bmi.female.n}}人中{{bmi.female.under185}}人がこの基準を下回っていました。トップ選手の中にも、健康面で注意が必要なほど体重の軽い選手がいるということです。

## リーチ：身長より6cmほど長い人が多い {#reach}

:::figure ape-index
:::

IFSCにリーチ（両腕を横に広げた長さ）を登録している{{ape.all.n}}人では、リーチから身長を引いた値の中央値が+{{ape.all.median|0}}cmでした。{{ape.all.positivePct}}%の選手は、リーチが身長より長くなっています。リーチ÷身長の比（エイプインデックス）にすると、平均で約{{ape.all.ratio|2}}です。

ただし、リーチを登録しているのは一部の選手だけで、リーチの長い選手ほど登録しやすいといった偏りがあるかもしれません。また研究では、上級者とそれ以外のクライマーの間で、エイプインデックスに差は見つかっていません[^ginszt]。リーチが長いと届く範囲は広がりますが、強さを決める要素とまでは言えません。なお、1人だけリーチが身長より9cm短い選手がいます。入力の誤りかどうかを確認できないため、掲載値のまま使っています。

## 統計から推定する「最適な体型」 {#ideal}

ここまでの結果を、トップクライマーの「中心像」としてまとめます。数値は、分布の真ん中の半数（下から25〜75%）の範囲です。

| | 男子 | 女子 |
|---|---|---|
| 身長 | {{ideal.male.heightLow}}〜{{ideal.male.heightHigh}}cm | {{ideal.female.heightLow}}〜{{ideal.female.heightHigh}}cm |
| BMI | {{ideal.male.bmiLow|1}}〜{{ideal.male.bmiHigh|1}}（中央値{{ideal.male.bmiMedian|1}}） | {{ideal.female.bmiLow|1}}〜{{ideal.female.bmiHigh|1}}（中央値{{ideal.female.bmiMedian|1}}） |
| 体重（身長の中央値の場合） | 約{{ideal.male.weightLowAtMedian}}〜{{ideal.male.weightHighAtMedian}}kg（{{height.male.median|0}}cm） | 約{{ideal.female.weightLowAtMedian}}〜{{ideal.female.weightHighAtMedian}}kg（{{height.female.median|0}}cm） |
| リーチ | 身長＋{{ape.all.q1|0}}〜{{ape.all.q3|0}}cm程度 | 登録が{{ape.female.n}}人と少なく、推定できません |

身長ごとに、トップ選手のBMI（真ん中の半数）を当てはめた体重は次のとおりです。

:::figure ideal-table
:::

この表は「この身長のトップ選手は、だいたいこの体重の範囲に多い」という統計の要約です。読むときには、次の点に注意してください。

- **目標体重ではありません。** トップ選手の体重は、長年のトレーニングで力をつけた結果としての体重です。力が同じまま体重だけを落としても、同じように登れるわけではありません。
- **原因と結果は区別できません。** 表彰台の選手に体重の軽い人が多いのは、軽いから勝てたのか、練習量が多い結果として軽くなったのか、このデータからは分かりません。
- **身長は気にしなくてよい。** 身長と成績にほとんど関係が見られない以上、身長を理由に向き不向きを決める必要はありません。

:::note 体重を落とす前に知っておきたいこと
クライミングでは「軽いほど有利」という考えから、食事を減らしすぎる問題が以前から指摘されています。リードクライマー498人を対象にした調査では、摂食障害の傾向がある人が女性で16.5%、男性で6.3%いて、女性ではレベルの高い人ほど多い傾向がありました[^joubert]。IFSCは2024年から、エネルギー不足による体調不良（RED-S）を防ぐため、質問票や各国連盟の健康証明、BMI・心拍数・血圧の抜き打ちの確認などを組み合わせた仕組みを競技に取り入れています[^reds]。体重を急に減らすと、けがや体調不良、かえって成績の低下につながることもあります。体重を変えたいときは、医師や管理栄養士などの専門家に相談してください。
:::

## まとめ：体型より先に伸ばせるもの {#summary}

統計から見えた「最適な体型」は、「平均的な身長で、身長に対して体重がやや軽い」というものでした。ただし、その差は小さく、身長と成績にはほとんど関係がありません。研究でも、実力の差の大部分は、体格ではなくトレーニングで変えられる要素で説明されています[^mermier]。

体格が気になるなら、体重を減らすより先に、体重あたりの力（指の力など）を「力を伸ばす側」から高めるのが確実です。指の力の比べ方は「[指力の数字を比較する前に、揃えるもの。](/articles/measure-finger-strength/)」、リーチの違いとムーブの考え方は「[リーチが違えば、正解のムーブも違う。](/articles/reach-and-beta/)」も参考にしてください。

## データの限界 {#limits}

- **測定日が分かりません。** どれも公開されているプロフィールの値で、測定した時期や方法は分かりません。
- **身長が分からない選手がいます。** 表彰台経験者のうち、男子{{height.male.missing}}人・女子{{height.female.missing}}人は身長が掲載されていませんでした。2010年代前半に活躍した選手に多く、時代による偏りがあるかもしれません。
- **体重は人数が少なめです。** 体重を使えたのは{{weight.total}}人で、主に2019年ごろまでに活躍した選手です。
- **国の偏りがあります。** 日本、フランス、ロシア、中国などの選手が多くを占めています。
- **強い選手の体格であって、体格が強さを生む証拠ではありません。** 表彰台に立った選手だけを見ているため、同じ体格で表彰台に届かなかった選手は含まれていません。

この記事は、2026年9月に公開した推定値を含む旧記事を、出典のあるデータだけで作り直したものです。集計に使ったデータは[CSVでダウンロード](/data/downloads/climber-body.csv)でき、集計の手順はGitHubの[リポジトリ](https://github.com/Matsu71/Climbing_Blog)で公開しています。

[^ifsc]: [IFSC Results](https://ifsc.results.info/)（大会結果と選手プロフィール）。2010〜2025年のワールドカップ・世界選手権・五輪の順位と、各選手の身長・リーチを2026年10月15日に取得。
[^rename]: [About WORLD CLIMBING](https://www.worldclimbing.com/ifsc)（World Climbing公式）。2025年12月10日に名称を変更。
[^dr]: [DigitalRock](https://www.digitalrock.de/)（IFSCの以前の結果サービス）。選手が登録した身長・体重を2026年10月15日に取得。選手は名前・国（必要に応じて生年）が一致した場合だけ対応づけています。
[^mhlw]: [厚生労働省「平成30年・令和元年国民健康・栄養調査」特別集計](https://www.mhlw.go.jp/bunya/kenkou/dl/kenkou_eiyou_chousa_tokubetsushuukei_h30-r01.pdf)。18〜29歳（男性382人・女性348人）の平均値。
[^ncd]: NCD Risk Factor Collaboration. [A century of trends in adult human height](https://doi.org/10.7554/eLife.13410). eLife 2016;5:e13410。出生年別・国別の成人の平均身長（[Our World in Data](https://ourworldindata.org/grapher/average-height-of-men)経由、1996年生まれまで。それ以降の生まれには1996年の値を使用）。
[^mermier]: Mermier CM, et al. [Physiological and anthropometric determinants of sport climbing performance](https://doi.org/10.1136/bjsm.34.5.359). Br J Sports Med 2000;34:359-365。44人（男性24人・女性20人）を対象に、成績の差をトレーニング・体格・柔軟性の要素に分けて分析。
[^ginszt]: Ginszt M, et al. [Body Composition, Anthropometric Parameters, and Strength-Endurance Characteristics of Sport Climbers: A Systematic Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10212580/). J Strength Cond Res 2023;37:1339-1348。表2から成人の上級〜エリート群（男子{{research.male.n}}群・女子{{research.female.n}}群）を抜き出し、BMIが載っていない群は身長と体重の平均から計算。表の身長・体重とBMIが合わない1群（Limonta et al. 2016）は除外。
[^bmi]: [医学的に理想の体重とは](https://www.tyojyu.or.jp/net/kenkou-tyoju/koureisha-shokuji/tyojyu-eiyou.html)（健康長寿ネット、公益財団法人長寿科学振興財団）。日本肥満学会の判定基準で、BMI 18.5未満を「低体重」とする。
[^joubert]: Joubert LM, et al. [Prevalence of Disordered Eating Among International Sport Lead Rock Climbers](https://doi.org/10.3389/fspor.2020.00086). Front Sports Act Living 2020;2:86。オンライン調査（EAT-26で20点以上を「傾向あり」）。
[^reds]: [New competition policy places IFSC at forefront of fight against REDs](https://www.worldclimbing.com/news/new-competition-policy-places-ifsc-at-forefront-of-fight-against-reds)（World Climbing公式、2024年2月7日）。
