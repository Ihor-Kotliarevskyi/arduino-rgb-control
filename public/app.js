const socket = io();

// --- DOM refs ---
const badge      = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const logBox     = document.getElementById('log');
const logEmpty   = document.getElementById('log-empty');
const preview    = document.getElementById('color-preview');
const hexLabel   = document.getElementById('color-hex');
const valR       = document.getElementById('val-r');
const valG       = document.getElementById('val-g');
const valB       = document.getElementById('val-b');
const canvas     = document.getElementById('color-wheel');
const ctx        = canvas.getContext('2d');

// --- Color wheel ---
function drawWheel() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = cx;

  // Hue ring
  for (let angle = 0; angle < 360; angle++) {
    const start = (angle - 1) * Math.PI / 180;
    const end   = (angle + 1) * Math.PI / 180;
    const grad  = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0,   'white');
    grad.addColorStop(0.5, `hsl(${angle}, 100%, 50%)`);
    grad.addColorStop(1,   `hsl(${angle}, 100%, 50%)`);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Dark center overlay for brightness
  const darkGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  darkGrad.addColorStop(0,   'rgba(0,0,0,0)');
  darkGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
  darkGrad.addColorStop(1,   'rgba(0,0,0,0.55)');
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fillStyle = darkGrad;
  ctx.fill();
}

function getColorAt(x, y) {
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  return { r: pixel[0], g: pixel[1], b: pixel[2] };
}

function isInsideCircle(x, y) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= cx * cx;
}

function toHex(v) { return v.toString(16).padStart(2, '0'); }

function applyColor(r, g, b) {
  const hex = '#' + toHex(r) + toHex(g) + toHex(b);
  preview.style.background = hex;
  hexLabel.textContent = hex.toUpperCase();
  valR.value = r;
  valG.value = g;
  valB.value = b;
  return hex;
}

let isSending = false;

function onPick(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.round((e.clientX - rect.left) * scaleX);
  const y = Math.round((e.clientY - rect.top)  * scaleY);

  if (!isInsideCircle(x, y)) return;

  const { r, g, b } = getColorAt(x, y);
  applyColor(r, g, b);

  // throttle: надсилаємо не частіше ніж раз на 50мс
  if (!isSending) {
    isSending = true;
    const cmd = `RGB ${r} ${g} ${b}`;
    socket.emit('command', cmd);
    addLog('out', cmd);
    setTimeout(() => { isSending = false; }, 50);
  }
}

let isDragging = false;
canvas.addEventListener('mousedown', e => { isDragging = true; onPick(e); });
canvas.addEventListener('mousemove', e => { if (isDragging) onPick(e); });
window.addEventListener('mouseup',   () => { isDragging = false; });

// Touch support
canvas.addEventListener('touchstart', e => { e.preventDefault(); onPick(e.touches[0]); }, { passive: false });
canvas.addEventListener('touchmove',  e => { e.preventDefault(); onPick(e.touches[0]); }, { passive: false });

// --- Turn off ---
function turnOff() {
  applyColor(0, 0, 0);
  socket.emit('command', 'OFF');
  addLog('out', 'OFF');
}

// --- Custom command ---
function sendCustom() {
  const inp = document.getElementById('custom-cmd');
  const val = inp.value.trim();
  if (!val) return;
  socket.emit('command', val);
  addLog('out', val);
  inp.value = '';
}

// --- Log ---
function now() {
  return new Date().toLocaleTimeString('uk-UA', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function addLog(dir, msg) {
  logEmpty.style.display = 'none';
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML =
    '<span class="log-time">' + now() + '</span>' +
    '<span class="log-dir ' + dir + '">' + (dir === 'out' ? '→' : dir === 'in' ? '←' : '·') + '</span>' +
    '<span class="log-msg">' + msg + '</span>';
  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;
  if (logBox.children.length > 102) logBox.children[1].remove();
}

function clearLog() {
  while (logBox.children.length > 1) logBox.lastChild.remove();
  logEmpty.style.display = '';
}

// --- Socket ---
socket.on('connect', () => {
  badge.className = 'status-badge connected';
  statusText.textContent = 'підключено';
  addLog('sys', "WebSocket з'єднання встановлено");
});

socket.on('disconnect', () => {
  badge.className = 'status-badge disconnected';
  statusText.textContent = 'відключено';
  addLog('sys', "З'єднання розірвано");
});

socket.on('arduino-data', data => addLog('in', data));

// --- Single channel ---
function sendSingle(channel) {
  const colors = { r: [255, 0, 0], g: [0, 255, 0], b: [0, 0, 255] };
  const [r, g, b] = colors[channel];
  applyColor(r, g, b);
  const cmd = `RGB ${r} ${g} ${b}`;
  socket.emit('command', cmd);
  addLog('out', cmd);
}

// --- Manual RGB input ---
function clamp(v) { return Math.min(255, Math.max(0, parseInt(v) || 0)); }

function onManualInput() {
  const r = clamp(valR.value);
  const g = clamp(valG.value);
  const b = clamp(valB.value);
  applyColor(r, g, b);
  const cmd = `RGB ${r} ${g} ${b}`;
  socket.emit('command', cmd);
  addLog('out', cmd);
}

[valR, valG, valB].forEach(inp => {
  inp.addEventListener('change', onManualInput);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { inp.blur(); onManualInput(); } });
});

// --- Init ---
drawWheel();
