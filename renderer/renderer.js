// ============================================================
// 番茄钟 — 渲染进程逻辑
// ============================================================

// ---- 常量 ----
const MODES = {
  WORK: { name: '专注工作', duration: 25 * 60, color: 'work' },
  SHORT_BREAK: { name: '短休息', duration: 5 * 60, color: 'break' },
  LONG_BREAK: { name: '长休息', duration: 15 * 60, color: 'break' },
};

const POMODOROS_BEFORE_LONG_BREAK = 4;

// ---- DOM 引用 ----
const $statusLabel = document.getElementById('status-label');
const $timeDisplay = document.getElementById('time-display');
const $ringProgress = document.getElementById('ring-progress');
const $timerRing = document.getElementById('timer-ring');
const $pomodoroCount = document.getElementById('pomodoro-count');
const $progressBar = document.getElementById('progress-bar');
const $container = document.getElementById('container');
const $btnStart = document.getElementById('btn-start');
const $btnReset = document.getElementById('btn-reset');
const $btnSkip = document.getElementById('btn-skip');
const $btnPin = document.getElementById('btn-pin');
const $btnMin = document.getElementById('btn-min');
const $btnClose = document.getElementById('btn-close');

// ---- 状态 ----
const RING_CIRCUMFERENCE = 2 * Math.PI * 90; // ≈ 565.49

let state = 'IDLE';              // IDLE | RUNNING | PAUSED
let currentMode = 'WORK';        // WORK | SHORT_BREAK | LONG_BREAK
let completedPomodoros = 0;      // 已完成的番茄数
let totalSeconds = MODES.WORK.duration;
let remainingSeconds = totalSeconds;
let timerInterval = null;
let endTime = null;              // 计时结束的时间戳（用于精确计时）
let isPinned = false;

// ---- 音频上下文 ----
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * 播放提示音（用 Web Audio API 合成，无需音频文件）
 */
function playTone(frequency, duration, type = 'sine') {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // 静默处理音频错误
  }
}

/** 工作结束音效（高音） */
function playWorkEndSound() {
  playTone(880, 0.15, 'sine');
  setTimeout(() => playTone(1100, 0.2, 'sine'), 200);
  setTimeout(() => playTone(1320, 0.3, 'sine'), 400);
}

/** 休息结束音效（低音） */
function playBreakEndSound() {
  playTone(523, 0.2, 'sine');
  setTimeout(() => playTone(659, 0.2, 'sine'), 250);
  setTimeout(() => playTone(784, 0.3, 'sine'), 500);
}

// ---- UI 更新 ----

/** 格式化 mm:ss */
function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 更新圆形进度环 */
function updateRing(remaining, total) {
  const fraction = remaining / total;
  const offset = RING_CIRCUMFERENCE * (1 - fraction);
  $ringProgress.setAttribute('stroke-dashoffset', offset);
}

/** 更新底部进度条 */
function updateProgressBar(remaining, total) {
  const fraction = remaining / total;
  $progressBar.style.width = `${fraction * 100}%`;
}

/** 更新番茄计数（庭石动画） */
function updatePomodoroDots(fullCount) {
  $pomodoroCount.innerHTML = '';

  if (fullCount === 0) {
    $pomodoroCount.classList.remove('has-tomatoes');
    return;
  }

  $pomodoroCount.classList.add('has-tomatoes');

  for (let i = 0; i < fullCount; i++) {
    const dot = document.createElement('span');
    dot.className = 'tomato-dot completed';
    // 使用 animation-delay 实现逐个弹入
    dot.style.animationDelay = `${i * 0.08}s`;
    $pomodoroCount.appendChild(dot);
  }
}

/** 刷新整个 UI */
function refreshUI() {
  // 时间
  $timeDisplay.textContent = formatTime(remainingSeconds);

  // 进度环
  updateRing(remainingSeconds, totalSeconds);

  // 进度条
  updateProgressBar(remainingSeconds, totalSeconds);

  // 状态标签
  const mode = MODES[currentMode];
  $statusLabel.textContent = mode.name;
  $statusLabel.className = mode.color;

  // 进度环颜色渐变 & 发光滤镜
  if (currentMode === 'WORK') {
    $ringProgress.setAttribute('stroke', 'url(#ring-gradient)');
    $timerRing.classList.remove('break-ring');
    $progressBar.classList.remove('break-bar');
  } else {
    $ringProgress.setAttribute('stroke', 'url(#ring-gradient-break)');
    $timerRing.classList.add('break-ring');
    $progressBar.classList.add('break-bar');
  }

  // 主按钮图标
  if (state === 'RUNNING') {
    $btnStart.textContent = '⏸';
    $btnStart.classList.add('pause');
  } else {
    $btnStart.textContent = '▶';
    $btnStart.classList.remove('pause');
  }

  // 番茄计数（使用圆点动画）
  const full = Math.floor(completedPomodoros);
  updatePomodoroDots(full);

  // 托盘文字
  const statusSymbol = state === 'RUNNING' ? '▶' : '⏸';
  const trayText = `${statusSymbol} ${formatTime(remainingSeconds)} — ${MODES[currentMode].name}`;
  window.electronAPI?.updateTray(trayText);
}

// ---- 计时器引擎 ----

function startTimer() {
  if (state === 'RUNNING') return;

  if (state === 'PAUSED') {
    // 从暂停恢复：重新计算结束时间
    endTime = Date.now() + remainingSeconds * 1000;
  } else {
    // 全新开始
    totalSeconds = MODES[currentMode].duration;
    remainingSeconds = totalSeconds;
    endTime = Date.now() + remainingSeconds * 1000;
  }

  state = 'RUNNING';
  refreshUI();
  runTick(); // 立即执行一次

  timerInterval = setInterval(() => {
    runTick();
  }, 200); // 200ms 刷新以保证平滑
}

function runTick() {
  if (state !== 'RUNNING') return;

  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

  if (remaining !== remainingSeconds) {
    remainingSeconds = remaining;
    refreshUI();
  }

  if (remainingSeconds <= 0) {
    timerComplete();
  }
}

function pauseTimer() {
  if (state !== 'RUNNING') return;
  state = 'PAUSED';
  clearInterval(timerInterval);
  timerInterval = null;
  refreshUI();
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  state = 'IDLE';
  totalSeconds = MODES[currentMode].duration;
  remainingSeconds = totalSeconds;
  endTime = null;
  refreshUI();
}

/** 计时结束 */
function timerComplete() {
  clearInterval(timerInterval);
  timerInterval = null;

  // 闪烁动画
  $container.classList.add('pulse');
  setTimeout(() => $container.classList.remove('pulse'), 4200);

  if (currentMode === 'WORK') {
    // 完成一个番茄
    completedPomodoros++;
    playWorkEndSound();

    // 确定下一个休息类型
    const nextMode = (completedPomodoros % POMODOROS_BEFORE_LONG_BREAK === 0)
      ? 'LONG_BREAK'
      : 'SHORT_BREAK';

    window.electronAPI?.sendNotification(
      '🍅 番茄完成！',
      `${MODES[nextMode].name}时间到了（${completedPomodoros} 个番茄已完成）`
    );

    switchMode(nextMode);
  } else {
    // 休息结束
    playBreakEndSound();
    window.electronAPI?.sendNotification(
      '⏰ 休息结束',
      '该开始新的番茄了！'
    );
    switchMode('WORK');
  }

  // 自动开始下一阶段
  resetTimer();
  startTimer();
}

/** 切换模式 */
function switchMode(mode) {
  currentMode = mode;
  totalSeconds = MODES[mode].duration;
  remainingSeconds = totalSeconds;
  endTime = null;
}

/** 跳过当前阶段 */
function skipCurrent() {
  clearInterval(timerInterval);
  timerInterval = null;
  $container.classList.remove('pulse');

  if (currentMode === 'WORK') {
    const nextMode = (completedPomodoros % POMODOROS_BEFORE_LONG_BREAK === 0 && completedPomodoros > 0)
      ? 'LONG_BREAK'
      : 'SHORT_BREAK';
    switchMode(nextMode);
  } else {
    switchMode('WORK');
  }

  state = 'IDLE';
  totalSeconds = MODES[currentMode].duration;
  remainingSeconds = totalSeconds;
  refreshUI();
}

// ---- 窗口控制 ----

function togglePin() {
  isPinned = !isPinned;
  window.electronAPI?.setAlwaysOnTop(isPinned);
  $btnPin.classList.toggle('active', isPinned);
}

// ---- 事件绑定 ----

$btnStart.addEventListener('click', () => {
  if (state === 'RUNNING') {
    pauseTimer();
  } else {
    startTimer();
  }
});

$btnReset.addEventListener('click', () => {
  resetTimer();
  $container.classList.remove('pulse');
});

$btnSkip.addEventListener('click', () => {
  skipCurrent();
});

$btnPin.addEventListener('click', togglePin);
$btnMin.addEventListener('click', () => window.electronAPI?.minimizeWindow());
$btnClose.addEventListener('click', () => window.electronAPI?.closeWindow());

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  // 空格：开始/暂停
  if (e.code === 'Space') {
    e.preventDefault();
    $btnStart.click();
  }
  // R：重置
  if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    $btnReset.click();
  }
  // S：跳过
  if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    $btnSkip.click();
  }
});

// ---- 初始化 ----
refreshUI();
console.log('🌿 暮色枯山水 · 番茄钟已就绪');
