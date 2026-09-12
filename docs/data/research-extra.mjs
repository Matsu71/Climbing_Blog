// Targeted primary-paper extraction, not a systematic review or a training prescription.
const verified='2026-09-11';
const paper=(id,title,doi,published,authors,journal)=>({id,title,doi,published,publisher:authors+' / '+journal,kind:'査読付き原著',access:'公開本文の方法・結果・限界を確認',checked_at:verified,url:'https://www.frontiersin.org/journals/'+(journal==='Frontiers in Physiology'?'physiology':'sports-and-active-living')+'/articles/'+doi+'/full'});
export const researchSources=[
  paper('dynamic-2024','Five weeks of dynamic finger flexor strength training on bouldering performance and climbing-specific strength tests. A randomized controlled trial','10.3389/fphys.2024.1461820','2024-10-10','Saeterbakken, Bratland, Andersen & Stien','Frontiers in Physiology'),
  paper('hang-10wk','The Effects of 10 Weeks Hangboard Training on Climbing Specific Maximal Strength, Explosive Strength, and Finger Endurance','10.3389/fspor.2022.888158','2022-04-27','Hermans et al.','Frontiers in Sports and Active Living'),
  paper('hang-intensity','Effects of Different Hangboard Training Intensities on Finger Grip Strength, Stamina, and Endurance','10.3389/fspor.2022.862782','2022-04-12','Devise, Lechaptois, Berton & Vigouroux','Frontiers in Sports and Active Living'),
  paper('finger-extensors','Finger flexion to extension ratio in healthy climbers: a proposal for evaluation and rebalance','10.3389/fspor.2023.1243354','2023-11-23','Devise, Pasek, Goislard de Monsabert & Vigouroux','Frontiers in Sports and Active Living'),
  paper('compression-sleeves','Effects of Forearm Compression Sleeves on Muscle Hemodynamics and Muscular Strength and Endurance Parameters in Sports Climbing: A Randomized, Controlled Crossover Trial','10.3389/fphys.2022.888860','2022-06-03','Limmer, de Marées & Roth','Frontiers in Physiology'),
  paper('fatigue-2026','Acute motor–cognitive responses to a bouldering fatigue protocol in indoor recreational climbers','10.3389/fphys.2026.1712130','2026-03-05','Wilczyński, Nowosad, Poniatowski, Gerwann & Zorena','Frontiers in Physiology')
];
const R=(id,title,year,design,theme,participants,protocol,finding,limit,article,metadata)=>({id,title,year,design,theme,participants,protocol,finding,limit,article,sources:[id],checked_at:verified,access_level:'本文確認',...metadata});
export const extraStudies=[
 R('dynamic-2024','指の力が伸びても、ボルダー成績は伸びる？',2024,'ランダム化比較試験','トレーニング','37人参加、31人完了（介入17・対照14）','成人の中上級〜エリート。動的な指屈筋トレーニングを5週間・週3回。両群とも通常のボルダーを継続。','指力の群内改善を報告。ただし、ボルダー成績の群間差は検出されませんでした（p = 0.39）。','動的指力の群間比較もp = 0.075。短期間・小標本で、一般的な「指を鍛えても無意味」の証明ではありません。','stronger-fingers-not-sends',{
   design_family:'群を分けた介入',population:'成人・中上級以上',sample_n:31,sample_stage:'完了者',duration:'5週間',performance_test:true,
   outcomes:['ボルダー課題の成績','動的・等尺性の指力'],not_measured:['長期の完登グレード推移','怪我の予防効果'],source_locator:'Materials and methods / Participants; Results; Table 4',
   takeaways:['測定した指力と、課題を登る成績は別々に確認します。','群内の前後差と、対照群との差を混同しません。']
 }),
 R('hang-10wk','10週間のハングボード：測定値の変化を並べる。',2022,'ランダム化比較試験','トレーニング','35人（ハングボード群18・対照群17）','中級〜上級者。10週間・週2回のプログラム。23mmエッジでの等尺性懸垂と持続ハングを測定。','23mmエッジの最大力・平均力で対照群との有意差を報告。実際の課題成績は測っていません。','通常の登攀セッション数が群間で異なります。持続ハング時間の変化量の群間差はp = 0.303でした。','read-training-change',{
   design_family:'群を分けた介入',population:'成人・中上級以上',sample_n:35,sample_stage:'群分け対象者',duration:'10週間',performance_test:false,
   outcomes:['23mmエッジの等尺性懸垂力','力の立ち上がり','持続ハング時間'],not_measured:['実際の完登成績','万人に共通する最適プログラム'],source_locator:'Methods; Results; Tables 2–3',
   takeaways:['棒の長さは平均値です。個人の目標値ではありません。','平均±標準偏差のばらつきと、群間効果の検定を分けて読みます。']
 }),
 R('hang-intensity','最大力と持久力は、同じ強度で伸びる？',2022,'ランダム化比較試験','トレーニング','経験者54人（女性13・男性41）','12mmの計測ホールドを使用。最大指力に対する100%・80%・60%の強度と対照を、4週間・週2回で比較。','最大力は100%・80%群、研究内のスタミナ・持久力指標は80%・60%群で前後の改善を報告。','異なる目的の測定です。群内の有意差だけで最強の強度を決めたり、ルート完登率へ置き換えたりはできません。','intensity-and-outcomes',{
   design_family:'群を分けた介入',population:'経験者・上級以上',sample_n:54,sample_stage:'群分け対象者',duration:'4週間',performance_test:false,
   outcomes:['最大指力','計測課題のスタミナ・持久力'],not_measured:['実際のルート完登率','全レベルの最適強度'],source_locator:'Abstract; Materials and Methods; Results',
   takeaways:['「持久力」がどのテストの結果なのかを確かめます。','研究者が用いた強度は、読者への処方ではありません。']
 }),
 R('finger-extensors','指を開く力と、怪我予防を分けて考える。',2023,'横断測定＋介入比較','トレーニング','横断測定78人、うち介入52人','指を曲げる力と開く力を測定し、4週間の屈筋・伸筋・併用・対照条件を比較。','伸筋のトレーニング群で伸展力の増加を報告。怪我の発生率を比較した研究ではありません。','78人全員の介入ではありません。提案された力の比率を、検証済みの怪我リスク判定値として使えません。','extensor-strength-not-prevention',{
   design_family:'複数段階の研究',population:'健康なクライマー',sample_n:52,sample_stage:'介入対象者（横断測定は78人）',duration:'4週間',performance_test:false,
   outcomes:['指の屈曲力・伸展力','屈曲力と伸展力の比'],not_measured:['怪我の発生率','実際の完登成績'],source_locator:'Methods; Study 1; Study 2; Results',
   takeaways:['力の変化が確認されても、予防効果が確認されたとは限りません。','測定人数・介入人数・解析人数は同じとは限りません。']
 }),
 R('compression-sleeves','血流指標が変わると、長く登れる？',2022,'ランダム化クロスオーバー試験','パフォーマンス','26人参加、24人完了（女性12・男性12）','同じ人が圧迫スリーブ・模擬スリーブ・装着なしの条件を経験。保持測定とトップロープの反復登攀を比較。','一部の血液動態指標が変化。一方、筋力・持久力・登攀反復回数の条件間差は検出されませんでした。','小標本・決められた装着条件での急性効果です。すべての製品や長期使用に一般化しません。','blood-flow-not-performance',{
   design_family:'同じ人で条件を比較',population:'成人・一般クライマー',sample_n:24,sample_stage:'完了者',duration:'単回条件を比較',performance_test:true,
   outcomes:['反復登攀','保持力・保持持久力','筋の血液動態'],not_measured:['長期のトレーニング効果','すべての製品の効果'],source_locator:'Methods / Participants and Study Design; Results; Discussion',
   takeaways:['24人×3条件を、72人の独立した対象とは数えません。','生理指標の変化と、登る課題の結果を別々に見ます。']
 }),
 R('fatigue-2026','疲労の前後で、すべての能力は同じに変わる？',2026,'非ランダム化・前後比較','疲労・認知','解析対象28人（男性18・女性10、15〜34歳）','屋内ボルダーの疲労プロトコル前後で、保持・引く力・バランス・視空間ワーキングメモリー等を測定。','保持持久力などの低下と、視空間ワーキングメモリー課題の成績向上を報告。指標によって変化は異なりました。','対照条件のない前後比較です。練習効果などを排除できず、疲労が学習を改善するという推奨には使えません。','fatigue-not-one-number',{
   design_family:'対照のない前後比較',population:'若年者を含む一般層',sample_n:28,sample_stage:'最終解析対象者',duration:'疲労課題の前後',performance_test:false,
   outcomes:['保持持久力・ピンチ力','引くパワー・バランス','視空間ワーキングメモリー'],not_measured:['長期の学習定着','疲労による改善の因果効果'],source_locator:'Methods / Participants and recruitment; Results; Discussion',
   takeaways:['疲労を一つの点数だけで評価しない例として読みます。','再テストで良くなったことと、疲れるほど良いことは別です。']
 })
];
// Existing entries retain their original verification scope; null means not yet classified.
export const existingResearchMetadata={
 hang:{design_family:'群を分けた介入',population:'成人・中上級以上',sample_n:27,sample_stage:'完了者（30人割付）',duration:'8週間',performance_test:false,access_level:'過去の本文確認',outcomes:['総合握力指標'],not_measured:['実際の完登グレード'],source_locator:'既存の本文確認記録。今回は再取得制限あり'},
 body:{design_family:'横断的な関連',population:'男性・高グレード',sample_n:20,sample_stage:'測定対象者',duration:'横断測定',performance_test:false,access_level:'本文確認',outcomes:['体格・指力・懸垂持久力','自己申告のRPグレードによる群分け'],not_measured:['減量の介入効果'],source_locator:'Methods; Results'},
 tape:{design_family:'複数文献の整理',population:'異なる対象を含む',sample_n:null,sample_stage:'複数研究。単一の解析人数に統合しません',duration:'研究によって異なる',performance_test:null,access_level:'本文確認',outcomes:['テーピングに関する複数の指標'],not_measured:[],source_locator:'Results; Discussion'},
 grade:{design_family:'統計モデル',population:'登攀履歴データ',sample_n:null,sample_stage:'未登録',duration:'未登録',performance_test:null,access_level:'抄録のみ',outcomes:['グレード尺度の推定'],not_measured:['指力の倍率'],source_locator:'Abstractのみ'},
 fear:{design_family:'実験・モデル解析',population:'クライマー（抄録確認）',sample_n:19,sample_stage:'抄録の記載人数',duration:'未登録',performance_test:null,access_level:'抄録のみ',outcomes:['筋活動・恐怖の自己評価'],not_measured:[],source_locator:'Abstractのみ'}
};
// Selected Table 3 outcomes from Hermans et al. 2022 (CC BY). Replotted, not an image copy.
export const researchMeasurements={study_id:'hang-10wk',source_id:'hang-10wk',source_locator:'Table 3; Results',uncertainty:'標準偏差（SD）',metrics:[
 {id:'peak',label:'23mmエッジの最大力',unit:'N',axis_max:800,groups:[{name:'ハングボード群',n:18,pre:425.5,pre_sd:181.5,post:515.3,post_sd:167.5},{name:'対照群',n:17,pre:442.2,pre_sd:212.2,post:462.2,post_sd:188.0}],inference:'事前値を調整した事後の群間比較：p = 0.008。保持力の測定であり、完登成績ではありません。'},
 {id:'average',label:'23mmエッジの平均力',unit:'N',axis_max:500,groups:[{name:'ハングボード群',n:18,pre:282.0,pre_sd:135.3,post:343.2,post_sd:149.5},{name:'対照群',n:17,pre:289.8,pre_sd:147.7,post:302.3,post_sd:141.2}],inference:'事前値を調整した事後の群間比較：p = 0.009。異なる測定項目を合成した能力点ではありません。'},
 {id:'hangtime',label:'持続ハング時間',unit:'秒',axis_max:100,groups:[{name:'ハングボード群',n:18,pre:49.4,pre_sd:17.2,post:56.2,post_sd:16.8},{name:'対照群',n:17,pre:55.8,pre_sd:25.6,post:58.0,post_sd:18.5}],inference:'変化量の群間比較：p = 0.303。有意差を検出しなかったことは、完全に同じ効果という証明ではありません。'}
]};
