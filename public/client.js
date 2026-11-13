const socket = io();

const homeScreen = document.getElementById('homeScreen');
const lobbyScreen = document.getElementById('lobbyScreen');
const gameScreen = document.getElementById('gameScreen');
const overlay = document.getElementById('overlay');
const nextTurnBtn = document.getElementById('nextTurnBtn');
const backLobbyBtn = document.getElementById('backLobbyBtn');

let myId = null;
let currentRoom = null;
let isDrawer = false;
let toolMode = 'pen';

socket.on('connect', () => { myId = socket.id; });
socket.on('errorMsg', (msg) => alert(msg));

// --- ホーム画面操作 ---
document.getElementById('createRoomBtn').onclick = () => {
  const username = document.getElementById('usernameInput').value.trim() || 'ゲスト';
  socket.emit('createRoom', { username });
};

document.getElementById('joinRoomBtn').onclick = () => {
  const username = document.getElementById('usernameInput').value.trim() || 'ゲスト';
  const roomId = document.getElementById('roomIdInput').value.trim();
  if (!roomId) return alert('部屋番号を入力してください');
  socket.emit('joinRoom', { username, roomId });
};

document.getElementById('leaveRoomBtn').onclick = () => {
  socket.emit('leaveRoom');
  lobbyScreen.classList.add('hidden');
  homeScreen.classList.remove('hidden');
};

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

document.getElementById('readyBtn').onclick = () => socket.emit('toggleReady');
document.getElementById('startGameBtn').onclick = () => socket.emit('startOrNextTurn');

nextTurnBtn.onclick = () => {
  nextTurnBtn.disabled = true;
  socket.emit('startOrNextTurn');
};

backLobbyBtn.onclick = () => socket.emit('backToLobby');

// --- ルーム状態更新 ---
socket.on('roomUpdated', (room) => {
  currentRoom = room;
  const isHost = room.hostId === myId;

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

    const list = document.getElementById('playerList');
    list.innerHTML = room.players.map(p => {
      const badge = p.ready
        ? '<span class="status-ready">✅ 準備OK</span>'
        : '<span class="status-wait">待機中</span>';
      return `<li><span>${p.name} ${p.id === room.hostId ? '👑' : ''}</span>${badge}</li>`;
    }).join('');

    const startBtn = document.getElementById('startGameBtn');
    if (isHost) {
      startBtn.classList.remove('hidden');
      startBtn.disabled = !(room.players.length >= 2 && room.players.every(p => p.ready));
    } else {
      startBtn.classList.add('hidden');
    }
  } else if (room.state === 'gameEnd') {
    overlay.classList.remove('hidden');
    nextTurnBtn.classList.add('hidden');
    backLobbyBtn.classList.remove('hidden');
    const ranking = [...room.players].sort((a, b) => b.score - a.score)
      .map((p, i) => `${i + 1}位: ${p.name} (${p.score}pt)`).join('<br>');
    document.getElementById('overlayText').innerHTML = `🏆 ゲーム終了！ 🏆<br><br>${ranking}`;
  }

  updateScoreBoard(room);
  document.getElementById('passCount').textContent = room.passesLeft;
});

function updateScoreBoard(room) {
  const sb = document.getElementById('scoreBoard');
  sb.innerHTML = '<strong>スコア:</strong> ' + room.players.map(p => `${p.name} (<b>${p.score}pt</b>)`).join(' / ');
}

// --- カウントダウン・ターン進行 ---
socket.on('countdown', (num) => {
  lobbyScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  overlay.classList.remove('hidden');
  nextTurnBtn.classList.add('hidden');
  nextTurnBtn.disabled = false;
  backLobbyBtn.classList.add('hidden');
  document.getElementById('overlayText').textContent = `次のターン開始まで... ${num}`;
});

socket.on('turnStarted', ({ room }) => {
  overlay.classList.add('hidden');
  const drawer = room.players[room.drawerIndex];
  isDrawer = (drawer.id === myId);

  document.getElementById('drawerName').textContent = drawer.name;
  document.getElementById('timerDisplay').textContent = room.timeLeft;
  document.getElementById('wordDisplay').textContent = isDrawer ? 'お題取得中...' : 'お題: ？？？';

  document.getElementById('drawTools').classList.toggle('hidden', !isDrawer);
  document.getElementById('chatInput').disabled = isDrawer;
  document.getElementById('chatInput').placeholder = isDrawer ? '描き手は入力できません' : '答えを入力...';
});

socket.on('secretWord', (word) => {
  document.getElementById('wordDisplay').textContent = `お題: 【 ${word} 】`;
});

socket.on('timerTick', (t) => {
  document.getElementById('timerDisplay').textContent = t;
});

socket.on('turnEnded', ({ reason, answer, room }) => {
  drawing = false;
  overlay.classList.remove('hidden');
  document.getElementById('overlayText').innerHTML = `${reason}<br>正解は「<span style="color:#fbbf24;">${answer}</span>」でした！`;
  nextTurnBtn.classList.remove('hidden');
  nextTurnBtn.disabled = false;
  backLobbyBtn.classList.add('hidden');
  updateScoreBoard(room);
});

// --- キャンバス描画・塗りつぶし・1つ戻る・タッチ操作 ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

let drawing = false;
let lastX = 0, lastY = 0;
let historyStack = [];
const MAX_HISTORY = 20;

const penBtn = document.getElementById('penModeBtn');
const fillBtn = document.getElementById('fillModeBtn');
const undoBtn = document.getElementById('undoBtn');

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

penBtn.onclick = () => {
  toolMode = 'pen';
  penBtn.classList.add('active-tool');
  fillBtn.classList.remove('active-tool');
};

fillBtn.onclick = () => {
  toolMode = 'fill';
  fillBtn.classList.add('active-tool');
  penBtn.classList.remove('active-tool');
};

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

document.getElementById('passBtn').onclick = () => {
  if (isDrawer) socket.emit('passWord');
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

function handleStart(e) {
  if (!isDrawer) return;
  if (e.cancelable) e.preventDefault();

  const { x, y } = getCanvasCoords(e);
  const color = document.getElementById('colorPicker').value;

  if (toolMode === 'fill') {
    saveHistory();
    floodFill(x, y, color);
    socket.emit('fill', { x, y, color });
  } else {
    saveHistory();
    drawing = true;
    [lastX, lastY] = [x, y];
    const size = document.getElementById('brushSize').value;
    drawLine(x, y, x, y, color, size);
    socket.emit('draw', { x1: x, y1: y, x2: x, y2: y, color, size, isStrokeStart: true });
  }
}

function handleMove(e) {
  if (!drawing || !isDrawer || toolMode !== 'pen') return;
  if (e.cancelable) e.preventDefault();

  const { x, y } = getCanvasCoords(e);
  const color = document.getElementById('colorPicker').value;
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

// --- チャット送信 ---
document.getElementById('chatForm').onsubmit = (e) => {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  socket.emit('chatMessage', msg);
  input.value = '';
};

socket.on('chatBroadcast', ({ name, text, isSystem }) => {
  const log = document.getElementById('chatLog');
  const div = document.createElement('div');
  div.className = isSystem ? 'chat-msg system' : 'chat-msg';
  div.innerHTML = isSystem ? text : `<b>${name}:</b> ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
});