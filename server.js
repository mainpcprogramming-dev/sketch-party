const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// 難易度別のお題リスト（各50個：ひらがな・カタカナ・漢字・別称に対応）
const WORDS = {
  easy: [
    ['りんご', 'リンゴ', '林檎'],
    ['ねこ', 'ネコ', '猫'],
    ['いぬ', 'イヌ', '犬'],
    ['くるま', 'クルマ', '車', '自動車'],
    ['たいよう', 'タイヨウ', '太陽'],
    ['おにぎり', 'オニギリ', '御握り', 'おむすび'],
    ['めがね', 'メガネ', '眼鏡'],
    ['かさ', 'カサ', '傘'],
    ['さかな', 'サカナ', '魚'],
    ['バナナ', 'ばなな'],
    ['いえ', 'イエ', '家'],
    ['はな', 'ハナ', '花'],
    ['つき', 'ツキ', '月', '三日月'],
    ['ほし', 'ホシ', '星'],
    ['くも', 'クモ', '雲'],
    ['やま', 'ヤマ', '山'],
    ['うみ', 'ウミ', '海'],
    ['き', 'キ', '木'],
    ['いちご', 'イチゴ', '苺'],
    ['めだまやき', 'メダマヤキ', '目玉焼き'],
    ['たまご', 'タマゴ', '卵', '玉子'],
    ['パン', 'ぱん', '食パン'],
    ['えんぴつ', 'エンピツ', '鉛筆'],
    ['はさみ', 'ハサミ', '鋏'],
    ['ほん', 'ホン', '本'],
    ['とけい', 'トケイ', '時計'],
    ['テレビ', 'てれび'],
    ['スマホ', 'すまほ', 'スマートフォン', '携帯', '携帯電話'],
    ['くつ', 'クツ', '靴'],
    ['ぼうし', 'ボウシ', '帽子'],
    ['ハート', 'はーと'],
    ['ゆきだるま', 'ユキダルマ', '雪だるま', '雪ダルマ'],
    ['かえる', 'カエル', '蛙'],
    ['うさぎ', 'ウサギ', '兎'],
    ['ぶた', 'ブタ', '豚'],
    ['ぞう', 'ゾウ', '象'],
    ['とり', 'トリ', '鳥'],
    ['ちょうちょ', 'チョウチョ', '蝶', '蝶々', 'ちょう'],
    ['あり', 'アリ', '蟻'],
    ['たこ', 'タコ', '蛸', '章魚'],
    ['いか', 'イカ', '烏賊'],
    ['かに', 'カニ', '蟹'],
    ['かぎ', 'カギ', '鍵'],
    ['コップ', 'こっぷ', 'グラス'],
    ['スプーン', 'すぷーん'],
    ['フォーク', 'ふぉーく'],
    ['はし', 'ハシ', '箸', 'お箸'],
    ['ドーナツ', 'どーなつ', 'ドーナッツ'],
    ['アイス', 'あいす', 'アイスクリーム', 'ソフトクリーム'],
    ['ふうせん', 'フウセン', '風船']
  ],
  normal: [
    ['らいおん', 'ライオン', '獅子'],
    ['しんかんせん', 'シンカンセン', '新幹線'],
    ['ハンバーガー', 'はんばーがー'],
    ['カメラ', 'かめら'],
    ['ペンギン', 'ぺんぎん'],
    ['ギター', 'ぎたー'],
    ['じてんしゃ', 'ジテンシャ', '自転車'],
    ['すいか', 'スイカ', '西瓜'],
    ['ロボット', 'ろぼっと'],
    ['にんじゃ', 'ニンジャ', '忍者'],
    ['かぶとむし', 'カブトムシ', '兜虫', '甲虫'],
    ['パンダ', 'ぱんだ'],
    ['キリン', 'きりん', '麒麟'],
    ['コアラ', 'こあら'],
    ['ワニ', 'わに', '鰐'],
    ['サメ', 'さめ', '鮫'],
    ['クジラ', 'くじら', '鯨'],
    ['イルカ', 'いるか', '海豚'],
    ['ひこうき', 'ヒコウキ', '飛行機'],
    ['ヘリコプター', 'へりこぷたー'],
    ['ふね', 'フネ', '船'],
    ['パトカー', 'ぱとかー'],
    ['きゅうきゅうしゃ', 'キュウキュウシャ', '救急車'],
    ['ラーメン', 'らーめん', '中華そば'],
    ['すし', 'スシ', '寿司', 'お寿司'],
    ['カレーライス', 'かれーらいす', 'カレー'],
    ['ピザ', 'ぴざ'],
    ['ケーキ', 'けーき', 'ショートケーキ'],
    ['たこやき', 'タコヤキ', 'たこ焼き', '蛸焼き'],
    ['たいやき', 'タイヤキ', 'たい焼き', '鯛焼き'],
    ['やきいも', 'ヤキイモ', '焼き芋', 'さつまいも'],
    ['とうもろこし', 'トウモロコシ', '玉蜀黍'],
    ['ブロッコリー', 'ぶろっこりー'],
    ['パイナップル', 'ぱいなっぷる', 'パイン'],
    ['パイロット', 'ぱいろっと', '操縦士'],
    ['けいさつかん', 'ケイサツカン', '警察官', 'お巡りさん'],
    ['おいしゃさん', 'オイシャサン', '医者', 'お医者さん'],
    ['コック', 'こっく', '料理人', 'シェフ'],
    ['やきゅう', 'ヤキュウ', '野球'],
    ['サッカー', 'さっかー'],
    ['バスケットボール', 'ばすけっとぼーる', 'バスケ'],
    ['スキー', 'すきー'],
    ['サーフィン', 'さーふぃん'],
    ['ピアノ', 'ぴあの'],
    ['ドラム', 'どらむ', '太鼓'],
    ['れいぞうこ', 'レイゾウコ', '冷蔵庫'],
    ['せんぷうき', 'センプウキ', '扇風機'],
    ['そうじき', 'ソウジキ', '掃除機'],
    ['トイレ', 'といれ', '便器', 'お手洗い'],
    ['おばけ', 'オバケ', 'お化け', '幽霊', 'ゆうれい']
  ],
  hard: [
    ['うちゅうひこうし', 'ウチュウヒコウシ', '宇宙飛行士'],
    ['じゆうのめがみ', 'ジユウノメガミ', '自由の女神'],
    ['かんらんしゃ', 'カンランシャ', '観覧車'],
    ['ジェットコースター', 'じぇっとこーすたー'],
    ['ピラミッド', 'ぴらみっど'],
    ['タイムマシン', 'たいむましん'],
    ['とうめいにんげん', 'トウメイニンゲン', '透明人間'],
    ['でんきスタンド', 'デンキスタンド', '電気スタンド', 'デスクライト'],
    ['しょうぼうしゃ', 'ショウボウシャ', '消防車'],
    ['スフィンクス', 'すふぃんくす'],
    ['モアイぞう', 'モアイゾウ', 'モアイ像', 'モアイ'],
    ['とうきょうタワー', 'トウキョウタワー', '東京タワー'],
    ['エッフェルとう', 'エッフェルトウ', 'エッフェル塔'],
    ['ばんりのちょうじょう', 'バンリノチョウジョウ', '万里の長城'],
    ['オーロラ', 'おーろら'],
    ['しんきろう', 'シンキロウ', '蜃気楼'],
    ['ながれぼし', 'ナガレボシ', '流れ星', '流星'],
    ['ブラックホール', 'ぶらっくほーる'],
    ['うちゅうステーション', 'ウチュウステーション', '宇宙ステーション'],
    ['じんこうえいせい', 'ジンコウェイセイ', '人工衛星'],
    ['てんびん', 'テンビン', '天秤', 'はかり'],
    ['すなどけい', 'スナドケイ', '砂時計'],
    ['まんげきょう', 'マンゲキョウ', '万華鏡'],
    ['けんびきょう', 'ケンビキョウ', '顕微鏡'],
    ['ぼうえんきょう', 'ボウエンキョウ', '望遠鏡'],
    ['しょうぼうし', 'ショウボウシ', '消防士'],
    ['すもうとり', 'スモウトリ', '相撲取り', '力士', 'りきし'],
    ['かぶきやくしゃ', 'カブキヤクシャ', '歌舞伎役者', '歌舞伎'],
    ['まほうつかい', 'マホウツカイ', '魔法使い', '魔女'],
    ['ドラキュラ', 'どらきゅら', '吸血鬼', 'きゅうけつき'],
    ['フランケンシュタイン', 'ふらんけんしゅたいん'],
    ['カッパ', 'かっぱ', '河童'],
    ['てんぐ', 'テング', '天狗'],
    ['ろくろくび', 'ロクロクビ', 'ろくろ首'],
    ['ユニコーン', 'ゆにこーん', '一角獣'],
    ['ペガサス', 'ぺがさす', '天馬'],
    ['マーメイド', 'まーめいど', '人魚', 'にんぎょ'],
    ['ケンタウロス', 'けんたうろす'],
    ['メデューサ', 'めでゅーさ'],
    ['カメレオン', 'かめれおん'],
    ['カモノハシ', 'かものはし'],
    ['アルパカ', 'あるぱか'],
    ['フラミンゴ', 'ふらみんご'],
    ['ハリネズミ', 'はりねずみ', '針鼠'],
    ['タツノオトシゴ', 'たつのおとしご', '竜の落とし子'],
    ['メリーゴーランド', 'めりーごーらんど', '回転木馬'],
    ['バンジージャンプ', 'ばんじーじゃんぷ'],
    ['つなひき', 'ツナヒキ', '綱引き'],
    ['いすとりゲーム', 'イストリゲーム', '椅子取りゲーム'],
    ['かくれんぼ', 'カクレンボ', '隠れん坊']
  ]
};

// カタカナをひらがなに変換して表記ゆれを防ぐ関数
function normalizeText(str) {
  return str.trim().replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
}

const rooms = {};
// タイマーオブジェクトはSocket.IOで送信されるroomsオブジェクトの外で管理（循環参照フリーズ防止）
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
      usedWords: [],
      passesLeft: 0,
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

  // 準備OK切り替え
  socket.on('toggleReady', () => {
    const room = rooms[socket.roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) player.ready = !player.ready;
    io.to(room.id).emit('roomUpdated', room);
  });

  // ゲーム開始 / 次のゲーム（ターン）へ
  socket.on('startOrNextTurn', () => {
    const room = rooms[socket.roomId];
    if (!room) return;

    // カウントダウン中やプレイ中の重複クリックを無視
    if (room.state === 'countdown' || room.state === 'playing') return;

    if (room.state === 'lobby') {
      if (room.players.length < 2) return socket.emit('errorMsg', '2人以上必要です。');
      if (!room.players.every(p => p.ready)) return socket.emit('errorMsg', '全員が準備OKになる必要があります。');
      room.players.forEach(p => p.score = 0);
      room.drawerIndex = 0;
      room.usedWords = [];
    } else if (room.state === 'turnEnd') {
      // 勝利ポイント到達チェック
      const winner = room.players.find(p => p.score >= room.settings.winPoints);
      if (winner) {
        room.state = 'gameEnd';
        io.to(room.id).emit('roomUpdated', room);
        return;
      }
      room.drawerIndex = (room.drawerIndex + 1) % room.players.length;
    }

    startTurnCountdown(room);
  });

  function startTurnCountdown(room) {
    clearRoomTimers(room.id);
    roomTimers[room.id] = {};

    room.state = 'countdown';
    room.passesLeft = room.settings.maxPasses;
    room.currentWord = getRandomWord(room.settings.difficulty, room.usedWords);
    room.players.forEach((p, idx) => {
      p.guessesLeft = (idx === room.drawerIndex) ? 0 : room.settings.maxGuesses;
      p.answered = false;
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
      room.timeLeft--;
      io.to(room.id).emit('timerTick', room.timeLeft);
      if (room.timeLeft <= 0) {
        endTurn(room, '時間切れ！');
      }
    }, 1000);
  }

  function endTurn(room, reason) {
    if (room.state !== 'playing') return;
    room.state = 'turnEnd';
    clearRoomTimers(room.id);

    const answerText = Array.isArray(room.currentWord) ? room.currentWord[0] : String(room.currentWord || '');
    io.to(room.id).emit('turnEnded', {
      reason,
      answer: answerText,
      room
    });
  }

  // お題パス（描き手のみ）
  socket.on('passWord', () => {
    const room = rooms[socket.roomId];
    if (!room || room.state !== 'playing') return;
    const drawer = room.players[room.drawerIndex];
    if (!drawer || drawer.id !== socket.id || room.passesLeft <= 0) return;

    room.passesLeft--;
    room.currentWord = getRandomWord(room.settings.difficulty, room.usedWords);
    io.to(room.id).emit('clearCanvas');
    io.to(room.id).emit('roomUpdated', room);
    io.to(drawer.id).emit('secretWord', room.currentWord[0]);
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

  // チャット・回答判定
  socket.on('chatMessage', (msg) => {
    try {
      const room = rooms[socket.roomId];
      if (!room || typeof msg !== 'string') return;
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
            isSystem: true
          });
          io.to(room.id).emit('roomUpdated', room);

          // 回答者が1人正解したら即座にそのターンを終了
          endTurn(room, `${player.name} さんが正解！`);
          return;
        } else {
          io.to(room.id).emit('chatBroadcast', {
            name: player.name,
            text: `${msg} (残り回答権: ${player.guessesLeft}回)`
          });
          io.to(room.id).emit('roomUpdated', room);

          // 全回答者の回答制限が0になったら強制終了
          const guessers = room.players.filter((_, idx) => idx !== room.drawerIndex);
          if (guessers.length > 0 && guessers.every(g => g.guessesLeft <= 0 || g.answered)) {
            endTurn(room, '全員の回答回数が上限に達しました！');
          }
          return;
        }
      }

      // ロビーやターン終了時の通常チャット
      io.to(room.id).emit('chatBroadcast', { name: player.name, text: msg });
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
      io.to(roomId).emit('roomUpdated', room);
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));