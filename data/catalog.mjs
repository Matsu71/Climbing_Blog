import {extraGymSources,extraGyms} from './gyms-extra.mjs';
export const checkedAt='2026-09-11';
const S=(id,title,url,publisher,kind,access,published=null)=>({id,title,url,publisher,kind,access,published,checked_at:checkedAt});
export const sources=[
...extraGymSources,
S('rei-technique','Climbing Techniques and Moves','https://www.rei.com/learn/expert-advice/climbing-techniques.html','REI / Jay Parks','指導者による教材','該当する用語と動作の本文を確認'),
S('rei-glossary','Rock Climbing Glossary','https://www.rei.com/learn/expert-advice/rock-climbing-glossary.html','REI','運営者の用語集','該当する定義を確認'),
S('crimpd','Crimpd: climbing training application','https://www.crimpd.com/docs/','Crimpd','運営者公式','公開機能説明を確認。全アプリの実機比較ではない'),
S('hang','Hangboard training in advanced climbers: A randomized controlled trial','https://www.nature.com/articles/s41598-021-92898-2','Mundry et al. / Scientific Reports','査読付き原著','前回本文確認・今回再取得は制限','2021-06-29'),
S('body','The role of physique, strength and endurance in the achievements of elite climbers','https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0182026','Ozimek et al. / PLOS ONE','査読付き原著','本文・方法・結果を確認','2017-08-03'),
S('tape','To tape or not to tape: annular ligament (pulley) injuries in rock climbers—a systematic review','https://link.springer.com/article/10.1186/s13102-022-00539-6','Larsson et al. / BMC Sports Science, Medicine and Rehabilitation','系統的レビュー','本文・結果・限界を確認','2022-08-01'),
S('nhs','Broken finger or thumb','https://www.nhs.uk/conditions/broken-finger/','NHS','公的医療情報','本文を確認'),
S('equilibrium','Conditions for Static Equilibrium','https://openstax.org/books/university-physics-volume-1/pages/12-1-conditions-for-static-equilibrium','OpenStax / Rice University','大学教材','該当節を確認'),
S('friction','Friction','https://openstax.org/books/university-physics-volume-1/pages/6-2-friction','OpenStax / Rice University','大学教材','該当節を確認'),
S('grade-model','Bayesian inference of the climbing grade scale','https://arxiv.org/abs/2111.08140','Drummond & Popinga / arXiv','プレプリント','前回抄録のみ確認','2021-11-15'),
S('fear','The Climber’s Grip — Personalized Deep Learning Models for Fear and Muscle Activity in Climbing','https://arxiv.org/abs/2603.26575','Boeker et al. / arXiv','プレプリント','前回抄録のみ確認','2026-03-27'),
S('99','The Hardest Boulder Problems in the World (2022 Update)','https://www.99boulders.com/hardest-boulder-problems','99Boulders','専門メディア・歴史資料','2022年の一覧。現在の評価に転用しない','2022-03'),
S('megatron','Shawn Raboutou climbs Megatron - Font 9A','https://www.ukclimbing.com/news/2022/11/shawn_raboutou_climbs_megatron_-_font_9a-73196','UKClimbing','本人発表を含む報道','本文を確認。発表日と初登日は分離','2022-11-16'),
S('burden','Nalle Hukkataival puts up Burden of Dreams - Font 9A','https://www.ukclimbing.com/news/2016/10/nalle_hukkataival_puts_up_burden_of_dreams_-_font_9a-70761','UKClimbing','本人発表を含む報道','前回検索結果の抜粋のみ確認','2016-10'),
S('return','Daniel Woods sends Return of the Sleepwalker','https://www.planetmountain.com/en/videos/daniel-woods-sends-return-of-the-sleepwalker-9a-boulder-at-red-rocks.html','PlanetMountain','映像紹介','前回検索結果の抜粋のみ確認','2021-06-27'),
S('alphane','Shawn Raboutou makes first ascent of Alphane','https://www.planetmountain.com/en/videos/shawn-raboutou-makes-first-ascent-of-alphane-9a-boulder-problem-at-chironico.html','PlanetMountain','映像紹介','検索結果の抜粋のみ。本文取得403'),
S('soudain','Soudain Seul 9A/V17 × Simon Lorenzi','https://www.youtube.com/watch?v=YNqq-K0HK18','SCARPA','スポンサー映像','前回動画説明文を確認。全編監査ではない'),
S('spots','Spots of Time 9A/V17 — Aidan Roberts','https://www.youtube.com/watch?v=rnw_kyk0G5Q','Wedge Climbing','登攀映像','前回動画説明文を確認。全編監査ではない'),
S('silence','Silence | World’s Hardest Route 9c | Adam Ondra','https://www.youtube.com/watch?v=ZRTNHDd0gL8','Adam Ondra','本人映像','前回動画説明文を確認。全編監査ではない'),
S('excalibur','Stefano Ghisolfi climbs Excalibur (9b+) at Arco','https://www.planetmountain.com/en/videos/stefano-ghisolfi-climbs-excalibur-9b-plus-arco-italy.html','PlanetMountain','映像紹介','前回検索結果の抜粋のみ確認','2024-02-13'),
S('big','Jakob Schubert making first ascent of B.I.G. (9c)','https://www.planetmountain.com/en/videos/jakob-schubert-making-first-ascent-of-big-9c-at-flatanger-in-norway.html','PlanetMountain','映像紹介','検索結果の抜粋のみ。本文取得403'),
S('change','Adam Ondra climbs Change 9b+ at Flatanger','https://www.planetmountain.com/en/videos/adam-ondra-climbs-change-9b-at-flatanger-norway.html','PlanetMountain','映像紹介','検索結果の抜粋のみ。本文取得403'),
...[['ogikubo','B-PUMP OGIKUBO','bpump'],['akiba','B-PUMP TOKYO','akiba'],['yokohama','B-PUMP YOKOHAMA','bpump2'],['kawaguchi','PUMP1 KAWAGUCHI','pump1'],['kawasaki','PUMP2 KAWASAKI','pump2']].map(([id,n,p])=>S('gym-'+id,n+' 公式施設案内','https://pump-climbing.com/gym/'+p+'/','PUMP','施設公式','住所・種目を確認。営業変更は公式へ')),
...[['8a','8a.nu / Vertical-Life','https://www.8a.nu/'],['lattice','Lattice Training','https://latticetraining.com/'],['horst','Training for Climbing','https://trainingforclimbing.com/'],['beta','The Beta Angel Project','https://beta-angel.com/research/research-inventory/anthropometry-measuring-the-climber/'],['climbers','CLIMBERS','https://www.climbers-web.jp/'],['satellite','Satellite','https://www.satelliteclimbing.com/satelliteapp_jp.html']].map(([id,n,u])=>S(id,n,u,n,'運営者公式','公開ページの構成・機能を調査。アプリ全機能の実機評価ではない'))
];
const C=(id,name,discipline,country,area,person,date,grade,source,summary,snapshot=false)=>({id,name,discipline,country,area,first_ascent_by:person,first_ascent_date:date,date_precision:date?(date.length===10?'day':date.length===7?'month':'year'):'unknown',grade_at_source:grade,current_consensus:null,repeat_count:null,sources:[source],summary,snapshot_only:snapshot,checked_at:checkedAt,field_sources:Object.fromEntries(['name','area','first_ascent_by','grade_at_source',...(date?['first_ascent_date']:[])].map(k=>[k,[source]]))});
export const climbs=[
C('burden-of-dreams','Burden of Dreams','ボルダー','フィンランド','Lappnor','Nalle Hukkataival','2016-10','9A / V17','burden','9Aという提案が生まれた記録。グレードの定着を考える入口。'),
C('return-of-the-sleepwalker','Return of the Sleepwalker','ボルダー','アメリカ','Red Rocks','Daniel Woods','2021','9A / V17','return','スタートを足すと何が変わる？ 単発の核心と、つなぐ難しさを分けて見る。'),
C('alphane','Alphane','ボルダー','スイス','Chironico','Shawn Raboutou','2022-04','9A / V17','alphane','初登者と再登者の評価を、同じ一つの数値へ丸めない。'),
C('megatron','Megatron','ボルダー','アメリカ','Eldorado Canyon','Shawn Raboutou',null,'9A / V17','megatron','Tronのシットスタート。発表日を初登日にすり替えず、挑戦をたどる。'),
C('soudain-seul','Soudain Seul','ボルダー','フランス','Fontainebleau','Simon Lorenzi','2021-02-08','9A / V17（提案）','soudain','異なるグレード評価も、このラインの歴史の一部。'),
C('spots-of-time','Spots of Time','ボルダー','イギリス','Lake District','Aidan Roberts',null,'9A / V17','spots','完登の瞬間だけでなく、解決に至る過程に注目。初登日は未登録。'),
C('silence','Silence','スポート','ノルウェー','Flatanger','Adam Ondra','2017-09-03','9c（提案）','silence','9cという数字の先にある準備。本人の記録映画からプロジェクトをたどる。'),
C('excalibur','Excalibur','スポート','イタリア','Drena / Arco','Stefano Ghisolfi','2023-02-03','9b+','excalibur','短さと難しさは別の情報。小さなホールドと強傾斜に向き合う記録。'),
C('big','B.I.G.','スポート','ノルウェー','Flatanger','Jakob Schubert','2023-09','9c（提案）','big','同じFlatangerでも、別々の挑戦。数字だけで優劣を決めず比較する。'),
C('change','Change','スポート','ノルウェー','Flatanger','Adam Ondra','2012','9b+（初登時提案）','change','高難度の歴史を遡る入口。初登時の評価と現在の合意は分離する。'),
C('floatin','Floatin’','ボルダー','日本','Mizugaki','Ryuichi Murai',null,'8C+ / V16','99','日本の高難度も、海外の記録と同じ項目で見る。2022年資料の補助収録。',true),
C('united','United','ボルダー','日本','Mizugaki','Ryuichi Murai',null,'8C+ / V16','99','日本から世界の高難度史へ。再登総数は未監査。2022年資料の補助収録。',true),
C('hypnotized-minds','Hypnotized Minds','ボルダー','アメリカ','Rocky Mountain National Park','Daniel Woods',null,'8C+ / V16','99','再評価される難しさも履歴の一部。2022年の一覧を現在順位に流用しない。',true),
C('off-the-wagon-low','Off the Wagon Low','ボルダー','スイス','Val Bavona','Shawn Raboutou',null,'8C+ / V16','99','同じ岩の別スタートを混同しない。2022年資料に基づく歴史スナップショット。',true)
];
const names={'Nalle Hukkataival':'ナーレ・フッカタイヴァル','Daniel Woods':'ダニエル・ウッズ','Shawn Raboutou':'ショーン・ラバトゥ','Simon Lorenzi':'シモン・ロレンツィ','Aidan Roberts':'エイダン・ロバーツ','Adam Ondra':'アダム・オンドラ','Stefano Ghisolfi':'ステファノ・ギゾルフィ','Jakob Schubert':'ヤコブ・シューベルト','Ryuichi Murai':'村井隆一'};
export const athletes=Object.entries(names).map(([name,kana])=>({id:name.toLowerCase().replaceAll(' ','-'),name,kana,climbs:climbs.filter(c=>c.first_ascent_by===name).map(c=>c.id),height_cm:null,mass_kg:null,ape_index_cm:null}));
export const studies=[
{id:'hang',title:'ハングボードは、何を強くしたのか。',year:2021,design:'ランダム化比較試験',theme:'トレーニング',participants:'30人を割付、27人が完了',protocol:'成人中上級者。8週間、加重・エッジ縮小・通常の登攀を比較。',finding:'加重群で対照群より総合握力指標が改善。実際の完登グレードを測った研究ではありません。',limit:'小標本。介入2群の直接比較の検出力は不十分。万人に最善の方法を決める結果ではありません。',article:'hangboard-evidence',sources:['hang']},
{id:'body',title:'トップ層の体型は、そのまま目標値になる？',year:2017,design:'横断的群間比較',theme:'身体・能力',participants:'男性20人（上位群6人、比較群14人）',protocol:'RP 8b–8cと7c+–8aを比較。体格・指力・持久力を測定。',finding:'上位群で指力と懸垂持久力が高い結果。減量や筋トレの介入効果を実験したものではありません。',limit:'高グレード男性の小標本。一般層・女性・競技ボルダー全体の基準にはできません。',article:'body-not-destiny',sources:['body']},
{id:'tape',title:'テープの効果を、結果の種類ごとに読む。',year:2022,design:'系統的レビュー',theme:'怪我・回復',participants:'8研究＋1症例報告。206クライマーのほか非クライマー・献体研究',protocol:'テーピングと非テーピングを比較した異なる研究を整理。',finding:'腱の浮き上がりを抑える可能性には低〜中程度の確実性。',limit:'痛み・復帰期間・断裂予防の効果は確かではありません。力学的な変化は復帰許可を意味しません。',article:'taping-evidence',sources:['tape']},
{id:'grade',title:'グレードは筋力の目盛りなのか。',year:2021,design:'統計モデリング・プレプリント',theme:'グレード',participants:'登攀履歴データ。人数は抄録確認の範囲では未登録',protocol:'Bradley–Terry型モデルを使った尺度の推定。',finding:'モデルから難易度の性質を考える研究。必要な指力の倍率とは別の量です。',limit:'抄録のみ確認。査読済みとして扱わず、普遍的な換算則に転用しません。',article:'what-grades-measure',sources:['grade-model']},
{id:'fear',title:'怖さと疲労は、一緒に変わるのか。',year:2026,design:'実験・モデル解析・プレプリント',theme:'メンタル',participants:'クライマー19人',protocol:'リードとトップロープ中の筋活動などと恐怖の自己評価を分析。',finding:'疲労と恐怖の関連を報告。原因の方向は相関だけでは確定しません。',limit:'抄録のみ確認。個人の診断や安全判断には使えません。',article:'fear-and-fatigue',sources:['fear']}
];
const pumpGyms=[
['ogikubo','B-PUMP OGIKUBO','東京都','杉並区','東京都杉並区上荻1-10-12 荻窪東亜会館3F','荻窪駅',['ボルダー']],
['akiba','B-PUMP TOKYO','東京都','文京区','東京都文京区湯島1-1-8','秋葉原駅・御茶ノ水駅',['ボルダー']],
['yokohama','B-PUMP YOKOHAMA','神奈川県','横浜市','神奈川県横浜市西区平沼1-8-1','横浜駅・戸部駅',['ボルダー']],
['kawaguchi','PUMP1 KAWAGUCHI','埼玉県','川口市','埼玉県川口市元郷2-3-12','赤羽駅からバス案内あり',['ボルダー','リード']],
['kawasaki','PUMP2 KAWASAKI','神奈川県','川崎市','神奈川県川崎市多摩区中野島2-9-30','中野島駅',['ボルダー','リード']]
].map(([id,name,prefecture,municipality,address,access,disciplines])=>({id,name,prefecture,municipality,address,access,disciplines,sources:['gym-'+id],checked_at:checkedAt,price_yen:null,wall_area_m2:null,floor_area_m2:null,opened_date:null,closed_date:null,moonboard:null,kilterboard:null,rating:null}));

export const gyms=[...pumpGyms,...extraGyms].map(g=>{
  const row={brand:'PUMP',status:'listed',summary:'公式情報を起点に、種目とアクセスを確認。',
    checked_at:checkedAt,price_yen:null,wall_area_m2:null,floor_area_m2:null,
    opened_date:null,opened_date_precision:'unknown',closed_date:null,closed_date_precision:'unknown',
    boulder_height_m:null,rope_height_m:null,route_length_note:null,auto_belay:null,
    moonboard:null,kilterboard:null,campus_board:null,rating:null,...g};
  row.field_sources={...Object.fromEntries(['name','prefecture','municipality','address','access','disciplines','status'].map(k=>[k,[g.sources[0]]])),...g.field_sources};
  for(const field of ['boulder_height_m','rope_height_m','closed_date','route_length_note','auto_belay','campus_board']) {
    if(row[field]!==null && row[field]!==undefined && !row.field_sources[field]) row.field_sources[field]=[field==='campus_board'&&row.id==='basecamp-iruma'?'gym-base-facilities':g.sources[0]];
  }
  return row;
});

export const taxonomy=[['grip','指の保持'],['pull','引く力'],['compression','コンプレッション'],['contact','接触・瞬発'],['tension','体幹・テンション'],['legs','下半身パワー'],['balance','バランス'],['feet','足の精度'],['mobility','可動域'],['coord-upper','上半身連携'],['coord-hand-foot','手足連携'],['coord-whole','全身連携'],['coord-run','走る・跳ぶ'],['coord-redirect','勢いの方向転換'],['complexity','技術的複雑性'],['endurance','パワー持久力']].map(([id,name])=>({id,name}));
export const competitors=[['crimpd','ワークアウト・タイマー・ログ・振り返り','ログから何を学ぶかを日本語の解説につなぐ。トレーニングの網羅性や個別最適化を同等とは主張しない。'],['8a','ログとコミュニティ','記録数で競う前に、日付・グレード意見・出典を分離する。'],['99','読みやすい高難度一覧','歴史資料と現在の記録を分け、解説や比較へつなげる。'],['lattice','測定と個別コーチング','条件と研究の限界を読める教材を作る。個別指導の代替ではない。'],['horst','技術・身体・メンタルの教材','日本語の読みやすさと、操作できる力学教材を接続する。'],['beta','研究テーマ別の文献索引','対象・デザイン・結果・限界を同じ位置で比較する。'],['climbers','国内のニュース・競技・特集','速報の量ではなく、長く使える知識と再利用できるデータを作る。'],['satellite','ジム課題・ログ・動画','訪問の前後に学びをつなげる。課題ログ機能を上回ったとは主張しない。']].map(([source,strength,approach])=>({source,strength,approach}));
