const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// 難易度別のお題リスト（各150個・合計450個：ひらがな・カタカナ・漢字・別称に対応）
const WORDS = {
  easy: [
    ['りんご', 'リンゴ', '林檎'], ['ねこ', 'ネコ', '猫'], ['いぬ', 'イヌ', '犬'],
    ['くるま', 'クルマ', '車', '自動車'], ['たいよう', 'タイヨウ', '太陽'], ['おにぎり', 'オニギリ', '御握り', 'おむすび'],
    ['めがね', 'メガネ', '眼鏡'], ['かさ', 'カサ', '傘'], ['さかな', 'サカナ', '魚'],
    ['バナナ', 'ばなな'], ['いえ', 'イエ', '家'], ['はな', 'ハナ', '花'],
    ['つき', 'ツキ', '月', '三日月'], ['ほし', 'ホシ', '星'], ['くも', 'クモ', '雲'],
    ['やま', 'ヤマ', '山'], ['うみ', 'ウミ', '海'], ['き', 'キ', '木'],
    ['いちご', 'イチゴ', '苺'], ['めだまやき', 'メダマヤキ', '目玉焼き'], ['たまご', 'タマゴ', '卵', '玉子'],
    ['パン', 'ぱん', '食パン'], ['えんぴつ', 'エンピツ', '鉛筆'], ['はさみ', 'ハサミ', '鋏'],
    ['ほん', 'ホン', '本'], ['とけい', 'トケイ', '時計'], ['テレビ', 'てれび'],
    ['スマホ', 'すまほ', 'スマートフォン', '携帯', '携帯電話'], ['くつ', 'クツ', '靴'], ['ぼうし', 'ボウシ', '帽子'],
    ['ハート', 'はーと'], ['ゆきだるま', 'ユキダルマ', '雪だるま', '雪ダルマ'], ['かえる', 'カエル', '蛙'],
    ['うさぎ', 'ウサギ', '兎'], ['ぶた', 'ブタ', '豚'], ['ぞう', 'ゾウ', '象'],
    ['とり', 'トリ', '鳥'], ['ちょうちょ', 'チョウチョ', '蝶', '蝶々', 'ちょう'], ['あり', 'アリ', '蟻'],
    ['たこ', 'タコ', '蛸', '章魚'], ['いか', 'イカ', '烏賊'], ['かに', 'カニ', '蟹'],
    ['かぎ', 'カギ', '鍵'], ['コップ', 'こっぷ', 'グラス'], ['スプーン', 'すぷーん'],
    ['フォーク', 'ふぉーく'], ['はし', 'ハシ', '箸', 'お箸'], ['ドーナツ', 'どーなつ', 'ドーナッツ'],
    ['アイス', 'あいす', 'アイスクリーム', 'ソフトクリーム'], ['ふうせん', 'フウセン', '風船'],
    ['みかん', 'ミカン', '蜜柑'], ['ぶどう', 'ブドウ', '葡萄'], ['もも', 'モモ', '桃'],
    ['さくらんぼ', 'サクランボ', '桜桃'], ['レモン', 'れもん', '檸檬'], ['メロン', 'めろん'],
    ['にんじん', 'ニンジン', '人参'], ['だいこん', 'ダイコン', '大根'], ['トマト', 'とまと'],
    ['きゅうり', 'キュウリ', '胡瓜'], ['なす', 'ナス', '茄子'], ['たまねぎ', 'タマネギ', '玉ねぎ', '玉葱'],
    ['じゃがいも', 'ジャガイモ', '馬鈴薯'], ['きのこ', 'キノコ', '茸'], ['たけのこ', 'タケノコ', '筍'],
    ['あめ', 'アメ', '雨'], ['ゆき', 'ユキ', '雪'], ['かみなり', 'カミナリ', '雷'],
    ['にじ', 'ニジ', '虹'], ['かわ', 'カワ', '川'], ['いけ', 'イケ', '池'],
    ['しま', 'シマ', '島'], ['もり', 'モリ', '森'], ['くさ', 'クサ', '草'],
    ['はっぱ', 'ハッパ', '葉', '葉っぱ'], ['たね', 'タネ', '種'], ['ひまわり', 'ヒマワリ', '向日葵'],
    ['チューリップ', 'ちゅーりっぷ'], ['ばら', 'バラ', '薔薇'], ['さくら', 'サクラ', '桜'],
    ['くま', 'クマ', '熊'], ['さる', 'サル', '猿'], ['うま', 'ウマ', '馬'],
    ['うし', 'ウシ', '牛'], ['ひつじ', 'ヒツジ', '羊'], ['ねずみ', 'ネズミ', '鼠'],
    ['りす', 'リス', '栗鼠'], ['へび', 'ヘビ', '蛇'], ['かめ', 'カメ', '亀'],
    ['あひる', 'アヒル', '家鴨'], ['にわとり', 'ニワトリ', '鶏'], ['ひよこ', 'ヒヨコ', '雛'],
    ['ふくろう', 'フクロウ', '梟'], ['からす', 'カラス', '烏'], ['はと', 'ハト', '鳩'],
    ['とんぼ', 'トンボ', '蜻蛉'], ['せみ', 'セミ', '蝉'], ['はち', 'ハチ', '蜂'],
    ['てんとうむし', 'テントウムシ', '天道虫'], ['かたつむり', 'カタツムリ', '蝸牛'], ['えび', 'エビ', '海老'],
    ['かい', 'カイ', '貝'], ['ひとで', 'ヒトデ', '海星'], ['くらげ', 'クラゲ', '海月'],
    ['でんしゃ', 'デンシャ', '電車'], ['バス', 'ばす'], ['トラック', 'とらっく'],
    ['ヨット', 'よっと'], ['ロケット', 'ろけっと'], ['UFO', 'ユーフォー', 'ゆーふぉー'],
    ['いす', 'イス', '椅子'], ['つくえ', 'ツクエ', '机'], ['ベッド', 'べっど'],
    ['ドア', 'どあ', '扉'], ['まど', 'マド', '窓'], ['かがみ', 'カガミ', '鏡'],
    ['まくら', 'マクラ', '枕'], ['ふとん', 'フトン', '布団'], ['タオル', 'たおる'],
    ['はブラシ', 'ハブラシ', '歯ブラシ'], ['せっけん', 'セッケン', '石鹸'], ['トイレットペーパー', 'といれっとぺーぱー'],
    ['けしごむ', 'ケシゴム', '消しゴム'], ['じょうぎ', 'ジョウギ', '定規'], ['ノート', 'のーと'],
    ['かばん', 'カバン', '鞄'], ['さいふ', 'サイフ', '財布'], ['おかね', 'オカネ', 'お金', 'コイン'],
    ['ゆびわ', 'ユビワ', '指輪'], ['ネックレス', 'ねっくれす'], ['りぼん', 'リボン'],
    ['くつした', 'クツシタ', '靴下'], ['てぶくろ', 'テブクロ', '手袋'], ['マフラー', 'まふらー'],
    ['シャツ', 'しゃつ', 'Tシャツ'], ['ズボン', 'ずぼん', 'パンツ'], ['スカート', 'すかーと'],
    ['王冠', 'おうかん', 'オウカン', 'クラウン'], ['けん', 'ケン', '剣', '刀'], ['たて', 'タテ', '盾'],
    ['ゆみ', 'ユミ', '弓', '弓矢'], ['ばくだん', 'バクダン', '爆弾'], ['たからばこ', 'タカラバコ', '宝箱'],
    ['プレゼント', 'ぷれぜんと', '贈り物'], ['ろうそく', 'ロウソク', '蝋燭'], ['電球', 'でんきゅう', 'デンキュウ'],
    ['でんち', 'デンチ', '電池'], ['じしゃく', 'ジシャク', '磁石'], ['サイコロ', 'さいころ']
  ],
  normal: [
    ['らいおん', 'ライオン', '獅子'], ['しんかんせん', 'シンカンセン', '新幹線'], ['ハンバーガー', 'はんばーがー'],
    ['カメラ', 'かめら'], ['ペンギン', 'ぺんぎん'], ['ギター', 'ぎたー'],
    ['じてんしゃ', 'ジテンシャ', '自転車'], ['すいか', 'スイカ', '西瓜'], ['ロボット', 'ろぼっと'],
    ['にんじゃ', 'ニンジャ', '忍者'], ['かぶとむし', 'カブトムシ', '兜虫', '甲虫'], ['パンダ', 'ぱんだ'],
    ['キリン', 'きりん', '麒麟'], ['コアラ', 'こあら'], ['ワニ', 'わに', '鰐'],
    ['サメ', 'さめ', '鮫'], ['クジラ', 'くじら', '鯨'], ['イルカ', 'いるか', '海豚'],
    ['ひこうき', 'ヒコウキ', '飛行機'], ['ヘリコプター', 'へりこぷたー'], ['ふね', 'フネ', '船'],
    ['パトカー', 'ぱとかー'], ['きゅうきゅうしゃ', 'キュウキュウシャ', '救急車'], ['ラーメン', 'らーめん', '中華そば'],
    ['すし', 'スシ', '寿司', 'お寿司'], ['カレーライス', 'かれーらいす', 'カレー'], ['ピザ', 'ぴざ'],
    ['ケーキ', 'けーき', 'ショートケーキ'], ['たこやき', 'タコヤキ', 'たこ焼き', '蛸焼き'], ['たいやき', 'タイヤキ', 'たい焼き', '鯛焼き'],
    ['やきいも', 'ヤキイモ', '焼き芋', 'さつまいも'], ['とうもろこし', 'トウモロコシ', '玉蜀黍'], ['ブロッコリー', 'ぶろっこりー'],
    ['パイナップル', 'ぱいなっぷる', 'パイン'], ['パイロット', 'ぱいろっと', '操縦士'], ['けいさつかん', 'ケイサツカン', '警察官', 'お巡りさん'],
    ['おいしゃさん', 'オイシャサン', '医者', 'お医者さん'], ['コック', 'こっく', '料理人', 'シェフ'], ['やきゅう', 'ヤキュウ', '野球'],
    ['サッカー', 'さっかー'], ['バスケットボール', 'ばすけっとぼーる', 'バスケ'], ['スキー', 'すきー'],
    ['サーフィン', 'さーふぃん'], ['ピアノ', 'ぴあの'], ['ドラム', 'どらむ', '太鼓'],
    ['れいぞうこ', 'レイゾウコ', '冷蔵庫'], ['せんぷうき', 'センプウキ', '扇風機'], ['そうじき', 'ソウジキ', '掃除機'],
    ['トイレ', 'といれ', '便器', 'お手洗い'], ['おばけ', 'オバケ', 'お化け', '幽霊', 'ゆうれい'],
    ['とら', 'トラ', '虎'], ['ちーたー', 'チーター'], ['ごりら', 'ゴリラ'],
    ['ちんぱんじー', 'チンパンジー'], ['かば', 'カバ', '河馬'], ['さい', 'サイ', '犀'],
    ['しまうま', 'シマウマ', '縞馬'], ['らくだ', 'ラクダ', '駱駝'], ['となかい', 'トナカイ', '馴鹿'],
    ['かんがるー', 'カンガルー'], ['らっこ', 'ラッコ', '海獺'], ['あざらし', 'アザラシ', '海豹'],
    ['せいうち', 'セイウチ', '海象'], ['まんぼう', 'マンボウ', '翻車魚'], ['えい', 'エイ', '鱏'],
    ['うつぼ', 'ウツボ', '鱓'], ['くわがた', 'クワガタ', '鍬形', 'クワガタムシ'], ['かまきり', 'カマキリ', '蟷螂'],
    ['ばった', 'バッタ', '飛蝗'], ['くも', 'クモ', '蜘蛛'], ['さそり', 'サソリ', '蠍'],
    ['だちょう', 'ダチョウ', '駝鳥'], ['くじゃく', 'クジャク', '孔雀'], ['白鳥', 'はくちょう', 'ハクチョウ', 'スワン'],
    ['オムライス', 'おむらいす'], ['スパゲッティ', 'すぱげってぃ', 'パスタ'], ['ぎょうざ', 'ギョウザ', '餃子'],
    ['しゅうまい', 'シュウマイ', '焼売'], ['にくまん', 'ニクマン', '肉まん'], ['てんぷら', 'テンプラ', '天ぷら'],
    ['とんかつ', 'トンカツ', '豚カツ'], ['えびフライ', 'エビフライ', '海老フライ'], ['ステーキ', 'すてーき'],
    ['サンドイッチ', 'さんどいっち'], ['ホットドッグ', 'ほっとどっぐ'], ['フライドポテト', 'ふらいどぽてと', 'ポテト'],
    ['ポップコーン', 'ぽっぷこーん'], ['パンケーキ', 'ぱんけーき', 'ホットケーキ'], ['プリン', 'ぷりん'],
    ['パフェ', 'ぱふぇ'], ['クレープ', 'くれーぷ'], ['かきごおり', 'カキゴオリ', 'かき氷'],
    ['だんご', 'ダンゴ', '団子', 'お団子'], ['もち', 'モチ', '餅', 'お餅'], ['せんべい', 'センベイ', '煎餅'],
    ['ばいく', 'バイク', 'オートバイ'], ['ききゅう', 'キキュウ', '気球', '熱気球'], ['せんすいかん', 'センスイカン', '潜水艦'],
    ['ブルドーザー', 'ぶるどーざー'], ['ショベルカー', 'しょべるかー'], ['クレーン車', 'くれーんしゃ'],
    ['たんかー', 'タンカー'], ['ごんどら', 'ゴンドラ'], ['ケーブルカー', 'けーぶるかー'],
    ['テニス', 'てにす'], ['たっきゅう', 'タッキュウ', '卓球', 'ピンポン'], ['ゴルフ', 'ごるふ'],
    ['ボーリング', 'ぼーりんぐ', 'ボウリング'], ['すいえい', 'スイエイ', '水泳'], ['スケート', 'すけーと', 'フィギュアスケート'],
    ['スノーボード', 'すのーぼーど', 'スノボ'], ['ボクシング', 'ぼくしんぐ'], ['けんどう', 'ケンドウ', '剣道'],
    ['じゅうどう', 'ジュウドウ', '柔道'], ['からて', 'カラテ', '空手'], ['アーチェリー', 'あーちぇりー'],
    ['バイオリン', 'ばいおりん'], ['トランペット', 'とらんぺっと'], ['フルート', 'ふるーと'],
    ['サックス', 'さっくす'], ['ハーモニカ', 'はーもにか'], ['マイク', 'まいく'],
    ['ヘッドホン', 'へっどほん', 'ヘッドフォン'], ['パソコン', 'ぱそこん', 'PC', 'ノートパソコン'], ['キーボード', 'きーぼーど'],
    ['マウス', 'まうす'], ['プリンター', 'ぷりんたー'], ['でんしレンジ', 'デンシレンジ', '電子レンジ'],
    ['せんたくき', 'センタクキ', '洗濯機'], ['エアコン', 'えあこん', 'クーラー'], ['こたつ', 'コタツ', '炬燵'],
    ['ストーブ', 'すとーぶ'], ['ドライヤー', 'どらいやー'], ['アイロン', 'あいろん'],
    ['ミシン', 'みしん'], ['なべ', 'ナベ', '鍋'], ['フライパン', 'ふらいぱん'],
    ['やかん', 'ヤカン', '薬缶'], ['ほうちょう', 'ホウチョウ', '包丁'], ['まな板', 'まないた', 'マナイタ'],
    ['しょうぼうしゃ', 'ショウボウシャ', '消防車'], ['サンタクロース', 'さんたくろーす', 'サンタ'], ['がいこつ', 'ガイコツ', '骸骨', 'スケルトン'],
    ['ミイラ', 'みいら', 'ミイラ男'], ['ゾンビ', 'ぞんび'], ['かいぞく', 'カイゾク', '海賊']
  ],
  hard: [
    ['うちゅうひこうし', 'ウチュウヒコウシ', '宇宙飛行士'], ['じゆうのめがみ', 'ジユウノメガミ', '自由の女神'],
    ['かんらんしゃ', 'カンランシャ', '観覧車'], ['ジェットコースター', 'じぇっとこーすたー'],
    ['ピラミッド', 'ぴらみっど'], ['タイムマシン', 'たいむましん'],
    ['とうめいにんげん', 'トウメイニンゲン', '透明人間'], ['でんきスタンド', 'デンキスタンド', '電気スタンド', 'デスクライト'],
    ['スフィンクス', 'すふぃんくす'], ['モアイぞう', 'モアイゾウ', 'モアイ像', 'モアイ'],
    ['とうきょうタワー', 'トウキョウタワー', '東京タワー'], ['エッフェルとう', 'エッフェルトウ', 'エッフェル塔'],
    ['ばんりのちょうじょう', 'バンリノチョウジョウ', '万里の長城'], ['オーロラ', 'おーろら'],
    ['しんきろう', 'シンキロウ', '蜃気楼'], ['ながれぼし', 'ナガレボシ', '流れ星', '流星'],
    ['ブラックホール', 'ぶらっくほーる'], ['うちゅうステーション', 'ウチュウステーション', '宇宙ステーション'],
    ['じんこうえいせい', 'ジンコウェイセイ', '人工衛星'], ['てんびん', 'テンビン', '天秤', 'はかり'],
    ['すなどけい', 'スナドケイ', '砂時計'], ['まんげきょう', 'マンゲキョウ', '万華鏡'],
    ['けんびきょう', 'ケンビキョウ', '顕微鏡'], ['ぼうえんきょう', 'ボウエンキョウ', '望遠鏡'],
    ['しょうぼうし', 'ショウボウシ', '消防士'], ['すもうとり', 'スモウトリ', '相撲取り', '力士', 'りきし'],
    ['かぶきやくしゃ', 'カブキヤクシャ', '歌舞伎役者', '歌舞伎'], ['まほうつかい', 'マホウツカイ', '魔法使い', '魔女'],
    ['ドラキュラ', 'どらきゅら', '吸血鬼', 'きゅうけつき'], ['フランケンシュタイン', 'ふらんけんしゅたいん'],
    ['カッパ', 'かっぱ', '河童'], ['てんぐ', 'テング', '天狗'],
    ['ろくろくび', 'ロクロクビ', 'ろくろ首'], ['ユニコーン', 'ゆにこーん', '一角獣'],
    ['ペガサス', 'ぺがさす', '天馬'], ['マーメイド', 'まーめいど', '人魚', 'にんぎょ'],
    ['ケンタウロス', 'けんたうろす'], ['メデューサ', 'めでゅーさ'],
    ['カメレオン', 'かめれおん'], ['カモノハシ', 'かものはし'],
    ['アルパカ', 'あるぱか'], ['フラミンゴ', 'ふらみんご'],
    ['ハリネズミ', 'はりねずみ', '針鼠'], ['タツノオトシゴ', 'たつのおとしご', '竜の落とし子'],
    ['メリーゴーランド', 'めりーごーらんど', '回転木馬'], ['バンジージャンプ', 'ばんじーじゃんぷ'],
    ['つなひき', 'ツナヒキ', '綱引き'], ['いすとりゲーム', 'イストリゲーム', '椅子取りゲーム'],
    ['かくれんぼ', 'カクレンボ', '隠れん坊'], ['だるまさんがころんだ', 'ダルマサンガコロンダ'],
    ['しりとり', 'シリトリ'], ['あっちむいてほい', 'アッチムイテホイ'],
    ['じゃんけん', 'ジャンケン'], ['あやとり', 'アヤトリ'],
    ['けんだま', 'ケンダマ', '剣玉'], ['こま', 'コマ', '独楽'],
    ['たこあげ', 'タコアゲ', '凧揚げ'], ['はごいた', 'ハゴイタ', '羽子板'],
    ['ししまい', 'シシマイ', '獅子舞'], ['なまはげ', 'ナマハゲ'],
    ['かまくら', 'カマクラ'], ['いぐるー', 'イグルー'],
    ['ピサのしゃとう', 'ピサノシャトウ', 'ピサの斜塔'], ['コロッセオ', 'ころっせお'],
    ['凱旋門', 'がいせんもん', 'ガイセンモン'], ['タージマハル', 'たーじまはる'],
    ['きんかくじ', 'キンカクジ', '金閣寺'], ['ふじさん', 'フジサン', '富士山'],
    ['なるとのうずしお', 'ナルトノウズシオ', '鳴門の渦潮', 'うずしお'], ['たき', 'タキ', '滝'],
    ['かざん', 'カザン', '火山', 'ふんか'], ['じしん', 'ジシン', '地震'],
    ['たいふう', 'タイフウ', '台風'], ['たつまき', 'タツマキ', '竜巻'],
    ['いんせき', 'インセキ', '隕石'], ['日食', 'にっしょく', 'ニッショク'],
    ['無重力', 'むじゅうりょく', 'ムジュウリョク'], ['テレポーテーション', 'てれぽーてーしょん', '瞬間移動'],
    ['とうしめがね', 'トウシメガネ', '透視メガネ'], ['うそつき', 'ウソツキ', '嘘つき', 'ピノキオ'],
    ['ねぼすけ', 'ネボスケ', '寝坊'], ['あわてんぼう', 'アワテンボウ'],
    ['ひとめぼれ', 'ヒトメボレ', '一目惚れ'], ['しつれん', 'シツレン', '失恋'],
    ['プロポーズ', 'ぷろぽーず'], ['けっこんしき', 'ケッコンシキ', '結婚式'],
    ['そつぎょうしき', 'ソツギョウシキ', '卒業式'], ['にゅうがくしき', 'ニュウガクシキ', '入学式'],
    ['うんどうかい', 'ウンドウカイ', '運動会'], ['たま入れ', 'たまいれ', 'タマイレ', '玉入れ'],
    ['きばせん', 'キバセン', '騎馬戦'], ['リレー', 'りれー'],
    ['マラソン', 'まらそん'], ['トライアスロン', 'とらいあすろん'],
    ['スカイダイビング', 'すかいだいびんぐ'], ['パラグライダー', 'ぱらぐらいだー'],
    ['スキューバダイビング', 'すきゅーばだいびんぐ', 'ダイビング'], ['ロッククライミング', 'ろっくくらいみんぐ'],
    ['キャンプファイヤー', 'きゃんぷふぁいやー'], ['バーベキュー', 'ばーべきゅー', 'BBQ'],
    ['きもだめし', 'キモダメシ', '肝試し'], ['はなびたいかい', 'ハナビタイカイ', '花火大会', '打ち上げ花火'],
    ['おまつり', 'オマツリ', 'お祭り', '夏祭り'], ['みこし', 'ミコシ', '神輿', 'お神輿'],
    ['盆踊り', 'ぼんおどり', 'ボンオドリ'], ['かきぞめ', 'カキゾメ', '書き初め'],
    ['まめまき', 'マメマキ', '豆まき', '節分'], ['ひなまつり', 'ヒナマツリ', '雛祭り'],
    ['こいのぼり', 'コイノボリ', '鯉のぼり'], ['たなばた', 'タナバタ', '七夕'],
    ['ハロウィン', 'はろうぃん'], ['クリスマスツリー', 'くりすますつりー'],
    ['おしょうがつ', 'オショウガツ', 'お正月'], ['はつもうで', 'ハツモウデ', '初詣'],
    ['おみくじ', 'オミクジ'], ['えま', 'エマ', '絵馬'],
    ['まねきねこ', 'マネキネコ', '招き猫'], ['だるま', 'ダルマ', '達磨'],
    ['こけし', 'コケシ'], ['おりがみ', 'オリガミ', '折り紙', '折り鶴'],
    ['さどう', 'サドウ', '茶道', 'お茶会'], ['いけばな', 'イケバナ', '生け花'],
    ['しょどう', 'ショドウ', '書道', '習字'], ['とうげい', 'トウゲイ', '陶芸', 'ろくろ'],
    ['ちょうこく', 'チョウコク', '彫刻'], ['油絵', 'あぶらえ', 'アブラエ'],
    ['まんがか', 'マンガカ', '漫画家'], ['しょうせつか', 'ショウセツカ', '小説家', '作家'],
    ['えいがかんとく', 'エイガカントク', '映画監督'], ['しきしゃ', 'シキシャ', '指揮者'],
    ['オーケストラ', 'おーけすとら'], ['バレリーナ', 'ばれりーな', 'バレエ'],
    ['サーカス', 'さーかす'], ['ピエロ', 'ぴえろ', '道化師'],
    ['てじなし', 'テジナシ', '手品師', 'マジシャン'], ['うらないし', 'ウラナイシ', '占い師'],
    ['たんてい', 'タンテイ', '探偵', '名探偵'], ['怪盗', 'かいとう', 'カイトウ'],
    ['スパイ', 'すぱい'], ['ボディガード', 'ぼでぃがーど'],
    ['うちゅうじん', 'ウチュウジン', '宇宙人', 'エイリアン'], ['みらいじん', 'ミライジン', '未来人'],
    ['タイムトラベル', 'たいむとらべる'], ['パラレルワールド', 'ぱられるわーるど'],
    ['しんかいぎょ', 'シンカイギョ', '深海魚'], ['ちょうちんあんこう', 'チョウチンアンコウ', '提灯鮟鱇'],
    ['ダイオウイカ', 'だいおういか'], ['シーラカンス', 'しーらかんす'],
    ['ティラノサウルス', 'てぃらのさうるす', '恐竜'], ['トリケラトプス', 'とりけらとぷす'],
    ['プテラノドン', 'ぷてらのどん'], ['マンモス', 'まんもす']
  ]
};

function normalizeText(str) {
  return str.trim().replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
}

const rooms = {};
const roomTimers = {};

function generateRoomId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getRandomWord(difficulty, usedWords) {
  const list = WORDS[difficulty] || WORDS.easy;
  const available = list.filter(w => !usedWords.includes(w[0]));
  const pool = available.length > 0 ? available : list;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  usedWords.push(selected[0]);
  return selected;
}

function clearRoomTimers(roomId) {
  if (roomTimers[roomId]) {
    if (roomTimers[roomId].timer) clearInterval(roomTimers[roomId].timer);
    if (roomTimers[roomId].cdInterval) clearInterval(roomTimers[roomId].cdInterval);
    delete roomTimers[roomId];
  }
}

io.on('connection', (socket) => {
  // 部屋作成
  socket.on('createRoom', ({ username }) => {
    let roomId = generateRoomId();
    while (rooms[roomId]) roomId = generateRoomId();

    rooms[roomId] = {
      id: roomId,
      hostId: socket.id,
      players: [{ id: socket.id, name: username, ready: false, score: 0, guessesLeft: 0, answered: false }],
      settings: {
        timeLimit: 60,
        difficulty: 'easy',
        maxGuesses: 3,
        winPoints: 5,
        maxPasses: 2
      },
      state: 'lobby', // lobby, countdown, playing, turnEnd, gameEnd
      drawerIndex: -1,
      currentWord: null,
      lastAnswer: '',
      usedWords: [],
      passesLeft: 0,
      passCooldown: 0,
      timeLeft: 0
    };

    socket.join(roomId);
    socket.roomId = roomId;
    io.to(roomId).emit('roomUpdated', rooms[roomId]);
  });

  // 部屋参加
  socket.on('joinRoom', ({ username, roomId }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('errorMsg', '部屋が見つかりません。');
    if (room.state !== 'lobby') return socket.emit('errorMsg', 'すでにゲームが進行中です。');

    room.players.push({ id: socket.id, name: username, ready: false, score: 0, guessesLeft: 0, answered: false });
    socket.join(roomId);
    socket.roomId = roomId;
    io.to(roomId).emit('roomUpdated', room);
  });

  // 設定変更（ホストのみ）
  socket.on('updateSettings', (newSettings) => {
    const room = rooms[socket.roomId];
    if (!room || room.hostId !== socket.id) return;
    room.settings = { ...room.settings, ...newSettings };
    io.to(room.id).emit('roomUpdated', room);
  });

  // ロビー専用チャット（ロビー待機中のみ送信・表示可能）
  socket.on('lobbyChatMessage', (msg) => {
    const room = rooms[socket.roomId];
    if (!room || room.state !== 'lobby' || typeof msg !== 'string') return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const cleanMsg = msg.trim();
    if (!cleanMsg) return;

    io.to(room.id).emit('lobbyChatBroadcast', {
      name: player.name,
      text: cleanMsg
    });
  });

  // 描画順シャッフル（ホストのみ・ロビー中）
  socket.on('shufflePlayers', () => {
    const room = rooms[socket.roomId];
    if (!room || room.hostId !== socket.id || room.state !== 'lobby') return;
    if (room.players.length < 2) return;

    for (let i = room.players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [room.players[i], room.players[j]] = [room.players[j], room.players[i]];
    }
    io.to(room.id).emit('roomUpdated', room);
  });

  // 準備OK切り替え（ロビー ＆ ターン終了後の次ゲーム待機）
  socket.on('toggleReady', () => {
    const room = rooms[socket.roomId];
    if (!room) return;
    if (room.state !== 'lobby' && room.state !== 'turnEnd') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    player.ready = !player.ready;

    io.to(room.id).emit('roomUpdated', room);

    // ターン終了画面で全員が準備OKになったら強制的に次のターンへ自動開始
    if (room.state === 'turnEnd' && room.players.length > 0 && room.players.every(p => p.ready)) {
      room.drawerIndex = (room.drawerIndex + 1) % room.players.length;
      startTurnCountdown(room);
    }
  });

  // ゲーム開始（通常スタート / 強制スタート共通）
  socket.on('startGame', ({ force } = {}) => {
    const room = rooms[socket.roomId];
    if (!room || room.state !== 'lobby') return;
    if (room.hostId !== socket.id) return;
    if (room.players.length < 2) return socket.emit('errorMsg', '2人以上必要です。');
    if (!force && !room.players.every(p => p.ready)) {
      return socket.emit('errorMsg', '全員が準備OKになる必要があります。');
    }

    room.players.forEach(p => { p.score = 0; });
    room.drawerIndex = 0;
    room.usedWords = [];
    room.lastAnswer = '';
    startTurnCountdown(room);
  });

  function startTurnCountdown(room) {
    clearRoomTimers(room.id);
    roomTimers[room.id] = {};

    room.state = 'countdown';
    room.passesLeft = room.settings.maxPasses;
    room.passCooldown = 0;
    room.currentWord = getRandomWord(room.settings.difficulty, room.usedWords);
    room.players.forEach((p, idx) => {
      p.guessesLeft = (idx === room.drawerIndex) ? 0 : room.settings.maxGuesses;
      p.answered = false;
      p.ready = false;
    });

    io.to(room.id).emit('clearCanvas');
    io.to(room.id).emit('roomUpdated', room);

    let count = 3;
    io.to(room.id).emit('countdown', count);
    roomTimers[room.id].cdInterval = setInterval(() => {
      count--;
      if (count > 0) {
        io.to(room.id).emit('countdown', count);
      } else {
        if (roomTimers[room.id] && roomTimers[room.id].cdInterval) {
          clearInterval(roomTimers[room.id].cdInterval);
          roomTimers[room.id].cdInterval = null;
        }
        beginDrawingTurn(room);
      }
    }, 1000);
  }

  function beginDrawingTurn(room) {
    room.state = 'playing';
    room.timeLeft = room.settings.timeLimit;
    room.passCooldown = 0;
    const drawer = room.players[room.drawerIndex];
    if (!drawer) return;

    io.to(room.id).emit('turnStarted', { room });
    io.to(drawer.id).emit('secretWord', room.currentWord[0]);

    if (!roomTimers[room.id]) roomTimers[room.id] = {};
    roomTimers[room.id].timer = setInterval(() => {
      if (room.state !== 'playing') {
        clearRoomTimers(room.id);
        return;
      }

      if (room.passCooldown > 0) {
        room.passCooldown--;
        io.to(room.id).emit('passCooldownTick', room.passCooldown);
      }

      room.timeLeft--;
      io.to(room.id).emit('timerTick', room.timeLeft);
      if (room.timeLeft <= 0) {
        endTurn(room, '時間切れ！');
      }
    }, 1000);
  }

  function endTurn(room, reason) {
    if (room.state !== 'playing') return;
    clearRoomTimers(room.id);

    const answerText = Array.isArray(room.currentWord) ? room.currentWord[0] : String(room.currentWord || '');
    room.lastAnswer = answerText;

    // 1人以上のプレイヤーが勝利ポイントに到達しているかチェック
    const hasWinner = room.players.some(p => p.score >= room.settings.winPoints);
    if (hasWinner) {
      room.state = 'gameEnd';
      io.to(room.id).emit('chatBroadcast', {
        name: 'システム',
        text: `🏆 規定ポイント到達！正解は「${answerText}」でした！`,
        msgType: 'correct'
      });
      io.to(room.id).emit('roomUpdated', room);
      return;
    }

    room.state = 'turnEnd';
    room.players.forEach(p => { p.ready = false; });

    io.to(room.id).emit('turnEnded', {
      reason,
      answer: answerText,
      room
    });
    io.to(room.id).emit('roomUpdated', room);
  }

  // お題パス（描き手のみ・クールダウン0のときのみ実行可能）
  socket.on('passWord', () => {
    const room = rooms[socket.roomId];
    if (!room || room.state !== 'playing') return;
    const drawer = room.players[room.drawerIndex];
    if (!drawer || drawer.id !== socket.id) return;
    if (room.passesLeft <= 0 || room.passCooldown > 0) return;

    room.passesLeft--;
    room.passCooldown = 10;
    room.currentWord = getRandomWord(room.settings.difficulty, room.usedWords);

    io.to(room.id).emit('clearCanvas');
    io.to(room.id).emit('roomUpdated', room);
    io.to(room.id).emit('passCooldownTick', room.passCooldown);
    io.to(drawer.id).emit('secretWord', room.currentWord[0]);

    io.to(room.id).emit('chatBroadcast', {
      name: 'システム',
      text: `⏭️ ${drawer.name} さんがパスをしました！`,
      msgType: 'pass'
    });
    io.to(room.id).emit('wordPassedPopup');
  });

  // 描画データのブロードキャスト
  socket.on('draw', (data) => {
    socket.to(socket.roomId).emit('draw', data);
  });

  socket.on('fill', (data) => {
    socket.to(socket.roomId).emit('fill', data);
  });

  socket.on('clearCanvas', () => {
    socket.to(socket.roomId).emit('clearCanvas');
  });

  socket.on('undo', () => {
    socket.to(socket.roomId).emit('undo');
  });

  // ゲーム中のチャット・回答判定（ロビーチャットとは完全分離）
  socket.on('chatMessage', (msg) => {
    try {
      const room = rooms[socket.roomId];
      if (!room || room.state === 'lobby' || typeof msg !== 'string') return;
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      const drawer = room.players[room.drawerIndex];

      // ゲーム中かつ回答者の場合
      if (room.state === 'playing' && drawer && drawer.id !== socket.id) {
        if (player.answered || player.guessesLeft <= 0) return;

        player.guessesLeft--;
        const normalizedInput = normalizeText(msg);
        const wordCandidates = Array.isArray(room.currentWord) ? room.currentWord : [room.currentWord];
        const isCorrect = wordCandidates.some(ans => normalizeText(String(ans)) === normalizedInput);

        if (isCorrect) {
          player.answered = true;
          player.score += 1;
          drawer.score += 1;

          io.to(room.id).emit('chatBroadcast', {
            name: 'システム',
            text: `🎉 ${player.name} さんが正解しました！（+1pt）`,
            msgType: 'correct'
          });
          io.to(room.id).emit('roomUpdated', room);

          endTurn(room, `${player.name} さんが正解！`);
          return;
        } else {
          io.to(room.id).emit('chatBroadcast', {
            name: player.name,
            text: `${msg} (残り回答権: ${player.guessesLeft}回)`,
            msgType: 'normal'
          });
          io.to(room.id).emit('roomUpdated', room);

          const guessers = room.players.filter((_, idx) => idx !== room.drawerIndex);
          if (guessers.length > 0 && guessers.every(g => g.guessesLeft <= 0 || g.answered)) {
            endTurn(room, '全員の回答回数が上限に達しました！');
          }
          return;
        }
      }

      // ターン終了時などの通常チャット
      io.to(room.id).emit('chatBroadcast', { name: player.name, text: msg, msgType: 'normal' });
    } catch (err) {
      console.error('chatMessage error:', err);
    }
  });

  // ロビーに戻る（ゲーム終了後）
  socket.on('backToLobby', () => {
    const room = rooms[socket.roomId];
    if (!room) return;
    clearRoomTimers(room.id);
    room.state = 'lobby';
    room.players.forEach(p => { p.ready = false; p.score = 0; });
    io.to(room.id).emit('roomUpdated', room);
  });

  // 切断・ホームに戻る処理
  socket.on('leaveRoom', handleLeave);
  socket.on('disconnect', handleLeave);

  function handleLeave() {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(roomId);
    socket.roomId = null;

    if (room.players.length === 0) {
      clearRoomTimers(roomId);
      delete rooms[roomId];
    } else {
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
      }
      if (room.drawerIndex >= room.players.length) {
        room.drawerIndex = 0;
      }

      if (room.state === 'turnEnd' && room.players.every(p => p.ready)) {
        room.drawerIndex = (room.drawerIndex + 1) % room.players.length;
        startTurnCountdown(room);
        return;
      }

      io.to(roomId).emit('roomUpdated', room);
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));