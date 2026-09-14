// Curated continuation batch. Each value is a source claim, not a current measurement or grade consensus.
const checked='2026-09-14';
const sources=[];
function source(id,title,url,kind,published,access,locator,note=''){
  sources.push({id,title,url,kind,published,retrieved_at:checked,access,locator,note});return id;
}
const athletes=[
 ['angela-eiter','アンジェラ・アイター','Angela Eiter'],
 ['laura-rogora','ローラ・ロゴラ','Laura Rogora'],
 ['yoshiyuki-ogata','緒方良行','Yoshiyuki Ogata'],
 ['natsuki-tanii','谷井菜月','Natsuki Tanii'],
 ['mao-nakamura','中村真緒','Mao Nakamura'],
 ['matty-hong','マティ・ホン','Matty Hong'],
 ['dani-andrada','ダニ・アンドラダ','Dani Andrada'],
 ['sonnie-trotter','ソニー・トロッター','Sonnie Trotter'],
 ['siebe-vanhee','シーベ・ヴァンヒー','Siebe Vanhee'],
 ['anak-verhoeven','アナック・ヴァーホーヴェン','Anak Verhoeven'],
 ['brooke-raboutou','ブルック・ラバトゥ','Brooke Raboutou']
].map(([id,name,latin])=>({id,name,latin}));
const measurements=[];
function measure(athlete_id,metric,value,source_id,raw,context){
 measurements.push({id:source_id+'-'+metric,athlete_id,metric,value,unit:'cm',raw,source_id,measured_at:null,context,status:'reported',derived_from:[]});
}
for(const [person,slug,h,w] of [
 ['angela-eiter','angy-eiter',154,158],['laura-rogora','laura-rogora',154,156],
 ['matty-hong','matty-hong',178,188],['dani-andrada','daniel-andrada-jimenez',176,190],
 ['sonnie-trotter','sonnie-trotter',180,180],['siebe-vanhee','siebe-vanhee',184,188]
]){
 const s=source('edelrid-'+person,'EDELRID：'+athletes.find(a=>a.id===person).latin,
  'https://edelrid.com/eu-de/vertical-freedom/edelrid-athleten/'+slug,'公式スポンサー',null,'本文','プロフィールの Größe / Armspanne',
  '掲載時期・測定日・測定方法は未記載。スポンサー契約開始日を測定日として扱わない。');
 measure(person,'height',h,s,h+'cm','公式掲載・測定時期不明');
 measure(person,'wingspan',w,s,w+'cm','Armspanne・測定時期不明');
}
for(const [person,h] of [['yoshiyuki-ogata',172],['natsuki-tanii',154],['mao-nakamura',157]]){
 const s=source('jmsca-'+person,'JMSCA：'+athletes.find(a=>a.id===person).name,
  'https://www.jma-climbing.org/athlete/profile/'+person+'/','競技団体',null,'本文','選手プロフィール「身長」','更新日・測定日・測定方法は未確認。');
 measure(person,'height',h,s,h+'cm','JMSCA掲載・測定時期不明');
}
const anak=source('anak-routes','Anak Verhoeven：Routes on rock','https://www.anakverhoeven.be/?page_id=194','本人記録',null,'本文','9b〜9aの各行、およびGorilas en la NieblaのOS表記',
 'FAとFFAは別。FFAは女性初登であり、課題全体では再登。月表記を日付へ補完しない。');
const janja=source('janja-bibliographie-2026','Red Bull：Janja Garnbret / Bibliographie','https://www.redbull.com/int-en/janja-garnbret-climbs-bibliographie','スポンサー取材','2026-06-08','本文','冒頭の完登日・課題・グレード、本人への取材',
 '記事全体のランキング・再登総数は採録しない。女性初登を課題全体の初登にしない。');
const lauraBibli=source('laura-bibliographie-2026','8a.nu：Laura Rogora / Bibliographie','https://www.8a.nu/news/laura-rogora-does-bibliography-vv9l8','本人インタビュー','2026-08-16','本文','冒頭と本人回答：8月1日到着、6日間の試登',
 '8月の滞在中の完登と確認できるが、完登した日は未確定。休養日を足して日付を推測しない。');
const lauraArco=source('laura-arco-2026','8a.nu：Laura Rogora / Mascella Serrata・Continental','https://www.8a.nu/news/laura-rogora-ticks-9a-and-onsights-8b%2B-36v0p','本人インタビュー','2026-05-05','本文','冒頭の身長152cm、RP/OSの区別、本人回答',
 '身長は記者による紹介値で測定日不明。EDELRIDの154cmと統合しない。相対日付は取材日未確認のため換算しない。');
measure('laura-rogora','height',152,lauraArco,'152 cm','2026年取材記事の紹介値・測定日不明');
const lauraOcchio=source('laura-occhio-2025','8a.nu：Laura Rogora / Il Terzo Occhio','https://www.8a.nu/news/laura-rogora-climbs-il-terzio-occhio-9a','本人インタビュー','2025-10-09','本文','冒頭と本人回答。課題名は本文の Il terzo occhio に合わせる',
 '回答中の「昨日」は取材日が不明。公表日前日を完登日として登録しない。');
const lauraTre=source('laura-tre-mou-2025','8a.nu：Laura Rogora / Tre Mou Polacche','https://www.8a.nu/news/laura-rogora-ticks-tre-mou-polacche-9a-fge4p','本人インタビュー','2025-03-07','本文','冒頭の再登、本人回答の試登と完登',
 '回答中の「昨日」は取材日が不明。公表日と完登日を分離。');
const brooke=source('brooke-excalibur-2025','EL PAÍS：Brooke Raboutou / Excalibur','https://elpais.com/deportes/el-montanista/2025-04-11/brooke-raboutou-la-primera-mujer-en-alcanzar-el-9b-hace-historia-al-escalar-tan-duro-como-los-mejores-hombres.html','専門報道','2025-04-11','本文','冒頭の2025年4月5日、Excalibur・9b+・Arcoと、後段の初登者',
 '二次報道。完登日・課題・登攀者・資料の評価のみ採録し、世界順位や全再登者数を確定しない。');
const ascents=[];
function ascent(id,climb,athlete_id,ascent_date,date_precision,style,grade,area,source_id,note='',raw_grade=grade){
 ascents.push({id,climb,athlete_id,ascent_date,date_precision,discipline:'スポート',style,grade,raw_grade,
  grade_status:'資料時点の掲載評価',area,source_id,locator:sources.find(s=>s.id===source_id).locator,note,
  reported_at:sources.find(s=>s.id===source_id).published,current_consensus:null,repeat_total:null});
}
for(const [id,name,date,style,grade,area,mark] of [
 ['planta','La Planta de Shiva','2024-05','完登','9b','Villanueva del Rosario',''],
 ['no-pain','No Pain No Gain','2022-10','再登','9a+','Rodellar','FFA'],
 ['joe-mama','Joe Mama','2019-11','再登','9a+','Oliana','FFA'],
 ['sweet-neuf','Sweet Neuf','2017-09','初登','9a+','Pierrot Beach','FA'],
 ['ciudad-enmienda','Ciudad de Dios pa la Enmienda','2017-12','初登','9a/+','Santa Linya','FA'],
 ['de-battre','De Battre mon cœur s’est Arrêté','2023-10','再登','9a/+','Rodellar','FFA'],
 ['inferno','Inferno','2022-07','再登','9a/+','Gimmelwald','FFA'],
 ['rainshadow','Rainshadow','2025-05','完登','9a','Malham Cove',''],
 ['sang-neuf','Sang Neuf','2017-09','初登','9a','Pierrot Beach','FA'],
 ['gorilas','Gorilas en la Niebla','2019-11','オンサイト','8b+','Oliana','OS']
]){
 ascent('anak-'+id,name,'anak-verhoeven',date,'month',style,grade,area,anak,
  mark==='FFA'?'本人の女性初登表記。課題全体の初登ではない。':mark==='FA'?'本人の初登表記。':mark==='OS'?'本人のOS表記。事前情報の有無を区別し、フラッシュとは別枠。':'本人ログは月まで。初登・再登の内訳はこの行だけでは確定しない。');
 ascents.at(-1).raw_style=mark||null;
}
ascent('bibliographie-janja','Bibliographie','janja-garnbret','2026-06-06','day','再登','9b+','Céüse',janja,'取材元が女性初登と報道。世界全体の初登は別。');
ascent('bibliographie-laura','Bibliographie','laura-rogora','2026-08','month','再登','9b+','Céüse',lauraBibli,'8月1日からの滞在中に完登。暦日は未確定。6日間は試登日数であり連続暦日ではない。');
ascent('mascella-laura','Mascella Serrata','laura-rogora',null,'unknown','再登','9a','Arco',lauraArco,'本人がレッドポイントを説明。取材日未確認のため相対日付を換算しない。');
ascent('continental-laura','Continental','laura-rogora',null,'unknown','オンサイト','8b+','Arco',lauraArco,'本人がオンサイトを明示。公表日を完登日に流用しない。');
ascent('occhio-laura','Il Terzo Occhio','laura-rogora',null,'unknown','再登','9a','Arco',lauraOcchio,'本文の課題名を採用。取材文の「昨日」の基準日は未確認。');
ascent('tre-mou-laura','Tre Mou Polacche','laura-rogora',null,'unknown','再登','9a','Arco',lauraTre,'再登を明示。取材文の「昨日」の基準日は未確認。');
ascent('excalibur-brooke','Excalibur','brooke-raboutou','2025-04-05','day','再登','9b+','Arco',brooke,'登攀日と4月11日の報道日を別々に記録。');
const pulley=source('pulley-pps-2016','Schneeberger・Schweizer：プーリー保護スプリント','https://pubmed.ncbi.nlm.nih.gov/27067301/','原著論文','2016-04-06','抄録','Abstract Methods / Results・Epub日付',
 '47損傷・45人。質問票43人、超音波39人、可動域42人、筋力22人を混同しない。本文未確認。');
const lumbrical=source('lumbrical-2018','Lumbrical muscle tear: clinical presentation, imaging findings and outcome','https://d-nb.info/1209741490/34','原著論文','2018-03-28','本文','ドイツ国立図書館公開PDFの対象・方法・結果・Table 1、PubMed 29591320のEpub日付',
 '60人中クライマーは57人。図表を画像で照合。PDFの論文は引用・事実抽出のみで再配布しない。');
const shoulder=source('shoulder-repair-2023','Simonら：クライマーの初回肩関節脱臼と手術後の復帰','https://journals.sagepub.com/doi/10.1016/j.wem.2023.05.001','原著論文','2023-09-01','本文','Methods / Results / Limitations、出版社の公開日',
 '27人・30肩。再脱臼者と登攀未再開者を同一人物群と推測しない。');
const physeal=source('physeal-algorithm-2021','Schöfflら：成長期クライマーの指骨端成長板損傷','https://journals.sagepub.com/doi/abs/10.1177/03635465211056956','原著論文','2021-11-24','抄録','Abstract Methods / Results / Conclusion・初回オンライン公開日',
 '掲載号は2022年1月。27人・37損傷。成績34+3をpatientsと記す抄録は人数と整合しないため、その割合は抽出保留。');
const clinical=[
 {id:'pulley-pps',title:'プーリー断裂と保護スプリント',condition:'プーリー',role:'治療・復帰',design:'後ろ向き症例集積',source_id:pulley,doi:'10.1016/j.wem.2015.12.017',
  sample:'45人・47完全断裂。質問票回答43人。',n_people:45,n_injuries:47,
  intervention:'プーリー保護スプリントを用いた保存療法。',comparator:'独立した治療対照群なし。機能の一部を反対側の指と比較。',
  outcomes:'質問票回答43人中38人が従来の登攀水準に復帰。復帰までの平均は受傷後8.8か月。',
  outcome_counts:[{outcome:'従来の登攀水準に復帰',numerator:38,denominator:43,unit:'人',population:'質問票回答者'}],
  follow_up:'復帰まで平均8.8か月。研究全体の追跡期間分布は抄録から未確認。',certainty:'比較治療に対する優越性は判断できない。',
  limit:'対照群なし。評価項目ごとの人数が異なる。可動域・筋力には自己測定を含み、手術との直接比較ではない。',clinical_review:false,access:'抄録'},
 {id:'lumbrical-series',title:'虫様筋損傷と保存療法',condition:'虫様筋',role:'治療・復帰',design:'後ろ向き症例集積',source_id:lumbrical,doi:'10.1177/1753193418765716',
  sample:'60人（クライマー57人、その他3人）。重症度I/II/III＝18/32/10人。',n_people:60,n_climbers:57,
  intervention:'重症度に応じた機能的保存療法。負荷調整、運動、テーピング、重症例の短期固定など。',comparator:'対照群なし。重症度別の観察。',
  outcomes:'全例が12週以内に疼痛消失。クライマーの回復は受傷前水準・無症状、非クライマーは日常機能で評価。',
  outcome_counts:[{outcome:'12週以内の疼痛消失',numerator:60,denominator:60,unit:'人',population:'クライマー以外3人を含む全対象'}],
  follow_up:'6週・12週。',certainty:'無作為化比較ではなく、個々の治療成分の効果は分離できない。',
  limit:'混合集団で回復の定義が異なる。4人は自家調整血漿を併用したが、その効果を検証した試験ではない。',clinical_review:false,access:'本文'},
 {id:'shoulder-repair',title:'肩関節脱臼の手術と登攀復帰',condition:'肩関節脱臼',role:'治療・復帰',design:'後ろ向き症例集積',source_id:shoulder,doi:'10.1016/j.wem.2023.05.001',
  sample:'27人・30肩（両側3人）。年齢34±11歳、範囲17〜61歳。',n_people:27,n_joints:30,
  intervention:'初回外傷性脱臼に対する関節鏡下の関節唇・靱帯複合体修復と術後リハビリ。',comparator:'保存療法群・無治療群なし。',
  outcomes:'25/27人が登攀再開。21/27人が従来水準の±0.33 UIAA以内またはそれ以上。再脱臼2/27人。',
  outcome_counts:[{outcome:'登攀再開',numerator:25,denominator:27,unit:'人',population:'対象クライマー'},
   {outcome:'従来水準の±0.33 UIAA以内またはそれ以上',numerator:21,denominator:27,unit:'人',population:'対象クライマー'},
   {outcome:'再脱臼',numerator:2,denominator:27,unit:'人',population:'対象クライマー'}],
  follow_up:'術後53±29か月（12〜103か月）。',certainty:'手術を受けた選択集団の成績。手術の一律推奨はできない。',
  limit:'単施設・小規模・後ろ向き。複合損傷と追加処置を含み、保存療法に対する優越性や万人共通の復帰時期は示さない。',clinical_review:false,access:'本文'},
 {id:'physeal-algorithm',title:'成長期の指の疲労損傷と復帰',condition:'骨端成長板',role:'治療・復帰',design:'前向き症例集積',source_id:physeal,doi:'10.1177/03635465211056956',
  sample:'27人・37損傷。平均14.7±1.5歳。',n_people:27,n_injuries:37,
  intervention:'診断・治療アルゴリズムに従い、28損傷を非手術、9損傷を手術で治療。',comparator:'無作為割付なし。重症度等で治療が選択され、手術対保存療法の比較試験ではない。',
  outcomes:'全例の骨性癒合と再発なしを報告。治療開始からスポーツ復帰まで40.1±65.2日。',
  outcome_counts:[],follow_up:'4年間の症例登録。個々の追跡期間分布は抄録では未確認。',certainty:'アルゴリズムに従った症例集積。成人プーリー損傷には直接適用できない。',
  limit:'37損傷と27人を分離。成績区分34+3をpatientsと記す不整合があり、区分別成功率は本文照合まで保留。平均復帰日数を休養指示にしない。',clinical_review:false,access:'抄録'}
];
const queue_updates={
 'pulley-splint':{status:'一部採録',reason:'原著抄録から45人・47損傷と結果別分母を採録。全文、分類別成績、追跡期間分布の照合は未完了。'},
 'lumbrical':{status:'一部採録',url:'https://doi.org/10.1177/1753193418765716',reason:'60人中57クライマーの原著本文を採録。独立した比較試験・長期復帰データを追加収集する。'},
 'physeal':{status:'一部採録',url:'https://doi.org/10.1177/03635465211056956',reason:'27人・37損傷の原著抄録を採録。本文の人数表記、治療選択基準、追跡期間を照合する。'},
 'shoulder':{status:'一部採録',url:'https://doi.org/10.1016/j.wem.2023.05.001',reason:'初回脱臼手術27人の原著本文を採録。腱板・不安定症の非手術療法や比較研究は未収集。'},
 'reach':{status:'一部採録',reason:'スポンサー公式プロフィール6人のリーチを追加。測定日は未確認。本人実測動画・計測条件・Seanの単位は引き続き照合する。'},
 'female-ascents':{status:'一部採録',reason:'Anak、Janja、Laura、Brookeの17登攀を採録。女性ボルダー、他の登攀者、旧記録・再評価は未網羅。'}
};
const queue=[
 {id:'elbow-climbers-2011',title:'クライマーの肘外側痛・9人の症例集積',url:'https://doi.org/10.1016/j.jmpt.2011.09.003',status:'本文確認待ち',priority:1,reason:'原著候補を同定。PubMed・出版社・代替経路で全文確認に至らず、検索抜粋から治療効果を確定していない。'},
 {id:'ankle-return-2019',title:'足・足首を含む怪我と登攀復帰',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6476799/',status:'本文確認待ち',priority:1,reason:'Rock climbing injuries and time to return to sport in the recreational climber。本文を取得し、部位別分母と治療選択による交絡を照合する。'},
 {id:'female-boulders',title:'女性の8C以上・ボルダーのグレード再評価',url:null,status:'未完了',priority:1,reason:'Katie Lamb、Brooke Raboutou、Ashima Shiraishi等を本人記録から収集。課題名・スタート差・ホールド変化・提案評価を分離する。'},
 {id:'laura-height-conflict',title:'Laura Rogoraの身長・測定時期',url:'https://edelrid.com/eu-de/vertical-freedom/edelrid-athleten/laura-rogora',status:'要照合',priority:2,reason:'EDELRID154cmと2026年取材記事152cmを併記。どちらが現在値かは断定しない。'},
 {id:'elbow-prevention-2022',title:'肘の運動介入・予防試験の原文照合',url:'https://doi.org/10.5114/pq.2023.112871',status:'要照合',priority:2,reason:'予防試験を既存の怪我の治療試験と混同しない。抄録で題名と結論の対象部位が一致しないため、効果量の採録は保留。'}
];
export const batch={id:'2026-09-14-b',sources,athletes,measurements,ascents,clinical,queue_updates,queue};
