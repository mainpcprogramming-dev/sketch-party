const socket = io();

const homeScreen = document.getElementById('homeScreen');
const lobbyScreen = document.getElementById('lobbyScreen');
const gameScreen = document.getElementById('gameScreen');
const overlay = document.getElementById('overlay');
const turnEndReadyArea = document.getElementById('turnEndReadyArea');
const turnEndReadyBtn = document.getElementById('turnEndReadyBtn');
const turnEndReadyCount = document.getElementById('turnEndReadyCount');
const backLobbyBtn = document.getElementById('backLobbyBtn');
const readyBtn = document.getElementById('readyBtn');
const passPopup = document.getElementById('passPopup');
const passBtn = document.getElementById('passBtn');
const chatInput = document.getElementById('chatInput');
const chatSubmitBtn = document.getElementById('chatSubmitBtn');
const lobbyChatInput = document.getElementById('lobbyChatInput');
const lobbyChatLog = document.getElementById('lobbyChatLog');

let myId = null;
let currentRoom = null;
let isDrawer = false;
let toolMode = 'pen'; // 'pen' | 'eraser' | 'fill'
let passPopupTimer = null;

socket.on('connect', () => { myId = socket.id; });
socket.on('errorMsg', (msg) => alert(msg));

// --- ホーム画面操作 ---
document.getElementById('createRoomBtn').onclick = () => {
  const username = document.getElementById('usernameInput').value.trim() || 'ゲスト';
  lobbyChatLog.innerHTML = '';
  socket.emit('createRoom', { username });
};

document.getElementById('joinRoomBtn').onclick = () => {
  const username = document.getElementById('usernameInput').value.trim() || 'ゲスト';
  const roomId = document.getElementById('roomIdInput').value.trim();
  if (!roomId) return alert('部屋番号を入力してください');
  lobbyChatLog.innerHTML = '';
  socket.emit('joinRoom', { username, roomId });
};

document.getElementById('leaveRoomBtn').onclick = () => {
  socket.emit('leaveRoom');
  lobbyScreen.classList.add('hidden');
  homeScreen.classList.remove('hidden');
};

// --- ロビー専用チャット送信・受信（ゲーム中は完全非表示） ---
document.getElementById('lobbyChatForm').onsubmit = (e) => {
  e.preventDefault();
  const msg = lobbyChatInput.value.trim();
  if (!msg) return;
  socket.emit('lobbyChatMessage', msg);
  lobbyChatInput.value = '';
};

socket.on('lobbyChatBroadcast', ({ name, text }) => {
  if (!currentRoom || currentRoom.state !== 'lobby') return;
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<b>${name}:</b> ${text}`;
  lobbyChatLog.appendChild(div);
  lobbyChatLog.scrollTop = lobbyChatLog.scrollHeight;
});

// --- ロビー設定同期 ---
const timeSlider = document.getElementById('timeSlider');
const diffSelect = document.getElementById('diffSelect');
const guessLimitInput = document.getElementById('guessLimitInput');
const winPointsInput = document.getElementById('winPointsInput');
const passLimitInput = document.getElementById('passLimitInput');

function emitSettings() {
  socket.emit('updateSettings', {
    timeLimit: Number(timeSlider.value),
    difficulty: diffSelect.value,
    maxGuesses: Number(guessLimitInput.value),
    winPoints: Number(winPointsInput.value),
    maxPasses: Number(passLimitInput.value)
  });
}
[timeSlider, diffSelect, guessLimitInput, winPointsInput, passLimitInput].forEach(el => {
  el.onchange = emitSettings;
});
timeSlider.oninput = () => { document.getElementById('timeVal').textContent = timeSlider.value; };

// 準備OK・シャッフル・スタートボタン
readyBtn.onclick = () => socket.emit('toggleReady');
turnEndReadyBtn.onclick = () => socket.emit('toggleReady');
document.getElementById('shuffleBtn').onclick = () => socket.emit('shufflePlayers');
document.getElementById('startGameBtn').onclick = () => socket.emit('startGame', { force: false });
document.getElementById('forceStartBtn').onclick = () => socket.emit('startGame', { force: true });
backLobbyBtn.onclick = () => socket.emit('backToLobby');

// 準備OKボタンの色（未準備=赤 danger / 準備完了=緑 success）を更新
function updateReadyButtonStyle(btnElement, isReady) {
  if (isReady) {
    btnElement.classList.remove('danger');
    btnElement.classList.add('success');
    btnElement.textContent = '✅ 準備OK（解除する）';
  } else {
    btnElement.classList.remove('success');
    btnElement.classList.add('danger');
    btnElement.textContent = '準備OK';
  }
}

// パスボタンの表示・クールダウン秒数カウント・有効無効を更新
function updatePassButtonUI(room) {
  if (!room) return;
  const left = room.passesLeft;
  const cd = room.passCooldown || 0;

  if (left <= 0) {
    passBtn.disabled = true;
    passBtn.textContent = '⏭️ パス (0)';
  } else if (cd > 0) {
    passBtn.disabled = true;
    passBtn.textContent = `⏭️ パス (あと${cd}秒)`;
  } else {
    passBtn.disabled = false;
    passBtn.textContent = `⏭️ パス (${left})`;
  }
}

// チャット入力欄のロック状態（描き手・回答上限到達・通常回答）を更新
function updateChatInputState(room) {
  if (!room) return;
  const me = room.players.find(p => p.id === myId);
  const drawer = room.players[room.drawerIndex];
  const amIDrawer = drawer && drawer.id === myId;

  if (room.state === 'playing') {
    if (amIDrawer) {
      chatInput.value = '';
      chatInput.disabled = true;
      chatSubmitBtn.disabled = true;
      chatInput.placeholder = '描き手は入力できません';
    } else if (me && me.guessesLeft <= 0 && !me.answered) {
      chatInput.value = '';
      chatInput.disabled = true;
      chatSubmitBtn.disabled = true;
      chatInput.placeholder = '回答上限に達しました';
    } else {
      chatInput.disabled = false;
      chatSubmitBtn.disabled = false;
      chatInput.placeholder = '答えを入力...';
    }
  } else {
    chatInput.disabled = false;
    chatSubmitBtn.disabled = false;
    chatInput.placeholder = 'チャットを入力...';
  }
}

// --- ルーム状態更新 ---
socket.on('roomUpdated', (room) => {
  currentRoom = room;
  const isHost = room.hostId === myId;
  const me = room.players.find(p => p.id === myId);
  const readyCount = room.players.filter(p => p.ready).length;
  const totalCount = room.players.length;

  if (room.state === 'lobby') {
    homeScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    overlay.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');

    document.getElementById('displayRoomId').textContent = room.id;
    timeSlider.value = room.settings.timeLimit;
    document.getElementById('timeVal').textContent = room.settings.timeLimit;
    diffSelect.value = room.settings.difficulty;
    guessLimitInput.value = room.settings.maxGuesses;
    winPointsInput.value = room.settings.winPoints;
    passLimitInput.value = room.settings.maxPasses;

    [timeSlider, diffSelect, guessLimitInput, winPointsInput, passLimitInput].forEach(el => el.disabled = !isHost);

    document.getElementById('lobbyReadyCount').textContent = `準備OK: ${readyCount} / ${totalCount}人`;

    if (me) updateReadyButtonStyle(readyBtn, me.ready);

    const list = document.getElementById('playerList');
    list.innerHTML = room.players.map((p, index) => {
      const badge = p.ready
        ? '<span class="status-ready">✅ 準備OK</span>'
        : '<span class="status-wait">未準備</span>';
      return `<li><span><span class="order-num">${index + 1}</span>${p.name} ${p.id === room.hostId ? '👑' : ''}</span>${badge}</li>`;
    }).join('');

    const shuffleBtn = document.getElementById('shuffleBtn');
    const startBtn = document.getElementById('startGameBtn');
    const forceStartBtn = document.getElementById('forceStartBtn');

    if (isHost) {
      shuffleBtn.classList.remove('hidden');
      shuffleBtn.disabled = totalCount < 2;

      startBtn.classList.remove('hidden');
      startBtn.disabled = !(totalCount >= 2 && readyCount === totalCount);

      forceStartBtn.classList.remove('hidden');
      forceStartBtn.disabled = totalCount < 2;
    } else {
      shuffleBtn.classList.add('hidden');
      startBtn.classList.add('hidden');
      forceStartBtn.classList.add('hidden');
    }
  } else if (room.state === 'turnEnd') {
    turnEndReadyCount.textContent = `準備OK: ${readyCount} / ${totalCount}人`;
    if (me) updateReadyButtonStyle(turnEndReadyBtn, me.ready);
  } else if (room.state === 'gameEnd') {
    // 規定ポイント到達時は準備OKを挟まず、最後の正解とランキングをそのまま結果画面に表示
    drawing = false;
    lobbyScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    overlay.classList.remove('hidden');
    turnEndReadyArea.classList.add('hidden');
    backLobbyBtn.classList.remove('hidden');

    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    const topScore = sorted.length > 0 ? sorted[0].score : 0;

    const ranking = sorted.map((p, i) => {
      const crown = (p.score === topScore) ? '👑 ' : '';
      return `${i + 1}位: ${crown}${p.name} (${p.score}pt)`;
    }).join('<br>');

    const lastAnsHtml = room.lastAnswer
      ? `<div style="font-size:20px; margin: 8px 0 16px;">最後の正解は「<span style="color:#fbbf24;">${room.lastAnswer}</span>」でした！</div>`
      : '<br>';

    document.getElementById('overlayText').innerHTML = `🏆 ゲーム終了！ 🏆${lastAnsHtml}${ranking}`;
  }

  updateScoreBoard(room);
  updatePassButtonUI(room);
  updateChatInputState(room);
});

function updateScoreBoard(room) {
  const sb = document.getElementById('scoreBoard');
  sb.innerHTML = '<strong>スコア:</strong> ' + room.players.map(p => `${p.name} (<b>${p.score}pt</b>)`).join(' / ');
}

// --- パス時のクールダウン秒数更新＆1秒間ポップアップ ---
socket.on('passCooldownTick', (cd) => {
  if (currentRoom) {
    currentRoom.passCooldown = cd;
    updatePassButtonUI(currentRoom);
  }
});

socket.on('wordPassedPopup', () => {
  if (passPopupTimer) clearTimeout(passPopupTimer);
  passPopup.classList.remove('hidden');
  void passPopup.offsetWidth;
  passPopupTimer = setTimeout(() => {
    passPopup.classList.add('hidden');
    passPopupTimer = null;
  }, 1000);
});

// --- カウントダウン・ターン進行 ---
socket.on('countdown', (num) => {
  lobbyScreen.classList.add('hidden');
  lobbyChatLog.innerHTML = ''; // ゲーム開始時にロビーチャットをクリアして見えないようにする
  gameScreen.classList.remove('hidden');
  overlay.classList.remove('hidden');
  turnEndReadyArea.classList.add('hidden');
  backLobbyBtn.classList.add('hidden');
  document.getElementById('overlayText').textContent = `次のターン開始まで... ${num}`;
});

socket.on('turnStarted', ({ room }) => {
  currentRoom = room;
  overlay.classList.add('hidden');
  const drawer = room.players[room.drawerIndex];
  isDrawer = (drawer.id === myId);

  // ターン開始時はツールをペンにリセット
  setActiveTool('pen');

  document.getElementById('drawerName').textContent = drawer.name;
  document.getElementById('timerDisplay').textContent = room.timeLeft;
  document.getElementById('wordDisplay').textContent = isDrawer ? 'お題取得中...' : 'お題: ？？？';

  document.getElementById('drawTools').classList.toggle('hidden', !isDrawer);
  chatInput.value = '';
  updatePassButtonUI(room);
  updateChatInputState(room);
});

socket.on('secretWord', (word) => {
  document.getElementById('wordDisplay').textContent = `お題: 【 ${word} 】`;
});

socket.on('timerTick', (t) => {
  document.getElementById('timerDisplay').textContent = t;
});

socket.on('turnEnded', ({ reason, answer, room }) => {
  currentRoom = room;
  drawing = false;
  overlay.classList.remove('hidden');
  document.getElementById('overlayText').innerHTML = `${reason}<br>正解は「<span style="color:#fbbf24;">${answer}</span>」でした！`;

  turnEndReadyArea.classList.remove('hidden');
  backLobbyBtn.classList.add('hidden');

  const readyCount = room.players.filter(p => p.ready).length;
  const totalCount = room.players.length;
  turnEndReadyCount.textContent = `準備OK: ${readyCount} / ${totalCount}人`;

  const me = room.players.find(p => p.id === myId);
  if (me) updateReadyButtonStyle(turnEndReadyBtn, me.ready);

  updateScoreBoard(room);
});

// --- キャンバス描画・消しゴム・塗りつぶし・1つ戻る・タッチ操作 ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

let drawing = false;
let lastX = 0, lastY = 0;
let historyStack = [];
const MAX_HISTORY = 20;

const penBtn = document.getElementById('penModeBtn');
const eraserBtn = document.getElementById('eraserModeBtn');
const fillBtn = document.getElementById('fillModeBtn');
const undoBtn = document.getElementById('undoBtn');

function setActiveTool(mode) {
  toolMode = mode;
  penBtn.classList.toggle('active-tool', mode === 'pen');
  eraserBtn.classList.toggle('active-tool', mode === 'eraser');
  fillBtn.classList.toggle('active-tool', mode === 'fill');
}

function saveHistory() {
  if (historyStack.length >= MAX_HISTORY) {
    historyStack.shift();
  }
  historyStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function undoLocal() {
  if (historyStack.length === 0) return;
  const prevState = historyStack.pop();
  ctx.putImageData(prevState, 0, 0);
}

penBtn.onclick = () => setActiveTool('pen');
eraserBtn.onclick = () => setActiveTool('eraser');
fillBtn.onclick = () => setActiveTool('fill');

// カラーピッカーの色を変えたら自動的にペンモードに戻す
document.getElementById('colorPicker').addEventListener('input', () => {
  if (toolMode === 'eraser') setActiveTool('pen');
});

undoBtn.onclick = () => {
  if (!isDrawer || historyStack.length === 0) return;
  undoLocal();
  socket.emit('undo');
};

document.getElementById('clearBtn').onclick = () => {
  if (!isDrawer) return;
  saveHistory();
  clearCanvasLocal(false);
  socket.emit('clearCanvas');
};

passBtn.onclick = () => {
  if (isDrawer && !passBtn.disabled) {
    socket.emit('passWord');
  }
};

function clearCanvasLocal(resetHistory = true) {
  if (resetHistory) {
    historyStack = [];
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

socket.on('clearCanvas', () => {
  if (currentRoom && currentRoom.state === 'playing') {
    saveHistory();
    clearCanvasLocal(false);
  } else {
    clearCanvasLocal(true);
  }
});

socket.on('undo', undoLocal);

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: Math.floor((clientX - rect.left) * scaleX),
    y: Math.floor((clientY - rect.top) * scaleY)
  };
}

function getActiveStrokeColor() {
  return toolMode === 'eraser' ? '#ffffff' : document.getElementById('colorPicker').value;
}

function handleStart(e) {
  if (!isDrawer) return;
  if (e.cancelable) e.preventDefault();

  const { x, y } = getCanvasCoords(e);

  if (toolMode === 'fill') {
    const color = document.getElementById('colorPicker').value;
    saveHistory();
    floodFill(x, y, color);
    socket.emit('fill', { x, y, color });
  } else {
    saveHistory();
    drawing = true;
    [lastX, lastY] = [x, y];
    const color = getActiveStrokeColor();
    const size = document.getElementById('brushSize').value;
    drawLine(x, y, x, y, color, size);
    socket.emit('draw', { x1: x, y1: y, x2: x, y2: y, color, size, isStrokeStart: true });
  }
}

function handleMove(e) {
  if (!drawing || !isDrawer || (toolMode !== 'pen' && toolMode !== 'eraser')) return;
  if (e.cancelable) e.preventDefault();

  const { x, y } = getCanvasCoords(e);
  const color = getActiveStrokeColor();
  const size = document.getElementById('brushSize').value;

  drawLine(lastX, lastY, x, y, color, size);
  socket.emit('draw', { x1: lastX, y1: lastY, x2: x, y2: y, color, size, isStrokeStart: false });
  [lastX, lastY] = [x, y];
}

function handleEnd() {
  drawing = false;
}

canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd);
window.addEventListener('touchcancel', handleEnd);

function drawLine(x1, y1, x2, y2, color, size) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

socket.on('draw', (d) => {
  if (d.isStrokeStart) saveHistory();
  drawLine(d.x1, d.y1, d.x2, d.y2, d.color, d.size);
});

socket.on('fill', (d) => {
  saveHistory();
  floodFill(d.x, d.y, d.color);
});

function floodFill(startX, startY, fillColorHex) {
  if (startX < 0 || startX >= canvas.width || startY < 0 || startY >= canvas.height) return;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const width = canvas.width;
  const height = canvas.height;

  const targetIdx = (startY * width + startX) * 4;
  const targetR = data[targetIdx];
  const targetG = data[targetIdx + 1];
  const targetB = data[targetIdx + 2];

  const fillR = parseInt(fillColorHex.slice(1, 3), 16);
  const fillG = parseInt(fillColorHex.slice(3, 5), 16);
  const fillB = parseInt(fillColorHex.slice(5, 7), 16);

  if (Math.abs(targetR - fillR) < 5 && Math.abs(targetG - fillG) < 5 && Math.abs(targetB - fillB) < 5) return;

  const visited = new Uint8Array(width * height);
  const stack = [[startX, startY]];

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const pixelPos = y * width + x;
    if (visited[pixelPos]) continue;
    visited[pixelPos] = 1;

    const idx = pixelPos * 4;
    if (
      Math.abs(data[idx] - targetR) <= 15 &&
      Math.abs(data[idx + 1] - targetG) <= 15 &&
      Math.abs(data[idx + 2] - targetB) <= 15
    ) {
      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = 255;

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

// --- ゲーム中チャット送信 ---
document.getElementById('chatForm').onsubmit = (e) => {
  e.preventDefault();
  if (chatInput.disabled) return;
  const msg = chatInput.value.trim();
  if (!msg) return;
  socket.emit('chatMessage', msg);
  chatInput.value = '';
};

socket.on('chatBroadcast', ({ name, text, msgType }) => {
  const log = document.getElementById('chatLog');
  const div = document.createElement('div');

  if (msgType === 'correct') {
    div.className = 'chat-msg correct';
    div.textContent = text;
  } else if (msgType === 'pass') {
    div.className = 'chat-msg pass';
    div.textContent = text;
  } else {
    div.className = 'chat-msg';
    div.innerHTML = `<b>${name}:</b> ${text}`;
  }

  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
});