import { COUNTRIES } from "./countries.js";
import { LEVELS, DAILY_LEVEL_KEY, DAILY_ROUNDS } from "./levels.js";
import { pickDistractors } from "./distractors.js";
import { saveScore, getFamilyRanking, getDailyRanking } from "./db.js";
import { describeFlag } from "./flagDescription.js";

/* Modo "repasa tus fallos": no es un nivel fijo, se arma con las banderas
   que más ha fallado el jugador. No cuenta para el ranking. */
const REVIEW_LEVEL = {
  key: "repaso", label: "Repasa tus fallos", icon: "🔁",
  secs: 15, opts: 3, distractorMode: "mixed", retry: true, hints: 2, mult: 1,
};
const REVIEW_MIN_FAILS = 3;

/* Modos adicionales (Fase 2): reutilizan el mismo bucle y los mismos datos,
   con una única dificultad fija cada uno (nada de tutorial, un botón y a jugar). */
const INVERT_LEVEL = {
  key: "invert", label: "Elige la bandera", icon: "🔄",
  rounds: 16, secs: 12, opts: 3, distractorMode: "mixed", retry: true, hints: 2, mult: 1,
};
const CLASSIFY_LEVEL = {
  key: "classify", label: "Clasifica por continente", icon: "🗺️",
  rounds: 20, secs: 8, opts: 5, distractorMode: null, retry: true, hints: 0, mult: 1,
};
const PAIRING_LEVEL = {
  key: "pairing", label: "Bandera y capital", icon: "🏛️",
  rounds: 16, secs: 14, opts: 3, distractorMode: "mixed", retry: true, hints: 2, mult: 1,
};
const CONTINENTS = ["África", "América", "Asia", "Europa", "Oceanía"];

/* Supervivencia: una sola vida, la dificultad sube con cada acierto.
   Se genera un objeto nuevo por partida porque sus campos se mutan ronda a ronda. */
function makeSurvivalLevel() {
  return {
    key: "survival", label: "Supervivencia", icon: "💀",
    retry: false, hints: 0, secs: 12, opts: 3, distractorMode: "easy", mult: 1,
  };
}
function survivalParamsForRound(n) {
  return {
    secs: Math.max(3, 12 - n * 0.4),
    opts: n < 5 ? 3 : n < 12 ? 4 : 5,
    distractorMode: n < 4 ? "easy" : n < 10 ? "mixed" : n < 18 ? "hard" : "confusables",
    mult: Math.min(2.5, 1 + n * 0.05),
  };
}
const MODE_LABELS = { survival: { icon: "💀", label: "Supervivencia" } };
const WHOCHIP_ICON = { daily: "🔥", review: "🔁", survival: "💀", invert: "🔄", classify: "🗺️", pairing: "🏛️" };

window.onerror = function (m, src, l, c) {
  console.error(m, src, l, c);
  if (document.getElementById('dcb-error-banner')) return;
  const d = document.createElement('div');
  d.id = 'dcb-error-banner';
  d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#E76F51;color:#fff;font:14px system-ui,sans-serif;padding:10px;text-align:center';
  d.textContent = 'Algo ha ido mal. Intenta recargar la página.';
  document.body.appendChild(d);
};

const $ = id => document.getElementById(id);
const show = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  if (id === 's-level') { updateSeenProgress(); updateReviewAvailability(); }
};
const flagSrc = code => `assets/flags/${code}.svg`;

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function onTap(el, fn) {
  let last = 0;
  const handler = e => {
    const now = Date.now();
    if (now - last < 500) return;
    last = now;
    if (e.cancelable) e.preventDefault();
    fn(e);
  };
  el.addEventListener('click', handler);
  el.addEventListener('touchend', handler, { passive: false });
}

/* ---------- PRNG determinista para el reto diario ---------- */
function seedFromDate(d) {
  let h = 0;
  for (const ch of d) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return h;
}
function mulberry32(seed) {
  let t = seed;
  return function () {
    t |= 0; t = (t + 0x6D2B79F5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle(arr, rand) {
  const r = arr.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
function todayStr() { return new Date().toISOString().slice(0, 10); }

/* ---------- Memoria de banderas vistas (persiste entre partidas) ---------- */
const SEEN_KEY = 'dcb_seen_v1';
function loadSeen() {
  try { return new Map(JSON.parse(localStorage.getItem(SEEN_KEY)) || []); }
  catch { return new Map(); }
}
function saveSeenMap() {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch { /* ignore */ }
}
const seen = loadSeen();
for (const c of COUNTRIES) if (!seen.has(c.code)) seen.set(c.code, 0);

function updateSeenProgress() {
  const learned = [...seen.values()].filter(v => v > 0).length;
  $('seenProgress').textContent = `${learned}/${COUNTRIES.length} banderas vistas`;
}

/* ---------- Historial de fallos (persiste entre partidas, para "Repasa tus fallos") ---------- */
const WRONG_KEY = 'dcb_wrong_v1';
function loadWrongMap() {
  try { return new Map(JSON.parse(localStorage.getItem(WRONG_KEY)) || []); }
  catch { return new Map(); }
}
function saveWrongMap() {
  try { localStorage.setItem(WRONG_KEY, JSON.stringify([...wrongMap])); } catch { /* ignore */ }
}
const wrongMap = loadWrongMap();
function recordWrong(code) {
  wrongMap.set(code, (wrongMap.get(code) || 0) + 1);
  saveWrongMap();
}
function clearWrong(code) {
  if (!wrongMap.has(code)) return;
  wrongMap.delete(code);
  saveWrongMap();
}
function updateReviewAvailability() {
  const count = [...wrongMap.values()].filter(v => v > 0).length;
  $('btnReview').style.display = count >= REVIEW_MIN_FAILS ? '' : 'none';
}

/* ---------- Filtro de continente (solo afecta a los niveles clásicos) ---------- */
const CONTINENT_KEY = 'dcb_continent';
let continentFilter = '';
try { continentFilter = localStorage.getItem(CONTINENT_KEY) || ''; } catch { /* ignore */ }
function poolForContinent() {
  return continentFilter ? COUNTRIES.filter(c => c.continent === continentFilter) : COUNTRIES;
}
$('continentSelect').value = continentFilter;
$('continentSelect').addEventListener('change', () => {
  continentFilter = $('continentSelect').value;
  try { localStorage.setItem(CONTINENT_KEY, continentFilter); } catch { /* ignore */ }
  renderLevels();
});

const PLAYER_KEY = 'dcb_player';

/* ---------- Texto grande: ajuste de accesibilidad, independiente del nivel ---------- */
const BIGTEXT_KEY = 'dcb_bigtext';
function isBigTextEnabled() { return localStorage.getItem(BIGTEXT_KEY) === '1'; }
$('bigToggle').checked = isBigTextEnabled();
document.body.classList.toggle('big', isBigTextEnabled());
$('bigToggle').addEventListener('change', () => {
  const on = $('bigToggle').checked;
  try { localStorage.setItem(BIGTEXT_KEY, on ? '1' : '0'); } catch { /* ignore */ }
  document.body.classList.toggle('big', on);
});

/* ---------- Estado de juego ---------- */
/* mode: 'classic' | 'daily' | 'review' | 'survival' | 'invert' | 'classify' | 'pairing' */
let player = null;
let levelKey = null, level = null;
let mode = 'classic', dailyDateStr = null;
let distractorPool = COUNTRIES;
let deck = [], idx = 0, score = 0, streak = 0, hintsLeft = 0;
let answer = null, locked = false, wrongCount = 0, hintUsedThisRound = false;
let tLeft = 0, timer = null;
const wrongList = [];

function streakMultiplier(s) {
  if (s >= 10) return 2;
  if (s >= 6) return 1.5;
  if (s >= 3) return 1.2;
  return 1;
}
function computePoints(tLeftVal, wrongC, streakBefore, hintUsed) {
  const base = 50 + (tLeftVal / level.secs) * 50 - wrongC * 20;
  let pts = Math.max(10, Math.round(base * level.mult * streakMultiplier(streakBefore)));
  if (hintUsed) pts = Math.round(pts * 0.85);
  return pts;
}

/* ---------- Construcción de mazos ---------- */
function buildDeck(lvl) {
  const source = poolForContinent();
  const pool = shuffle(source).sort((a, b) => (seen.get(a.code) || 0) - (seen.get(b.code) || 0));
  const chosen = shuffle(pool.slice(0, Math.min(lvl.rounds, source.length)));
  chosen.forEach(c => seen.set(c.code, (seen.get(c.code) || 0) + 1));
  saveSeenMap();
  return chosen;
}
function buildDailyDeck() {
  const dateStr = todayStr();
  const rand = mulberry32(seedFromDate(dateStr));
  const shuffled = seededShuffle(COUNTRIES, rand);
  return { deck: shuffled.slice(0, DAILY_ROUNDS), dateStr };
}

/* ---------- Pantalla de inicio ---------- */
(function initCoverFlags() {
  const picks = shuffle(COUNTRIES).slice(0, 5);
  $('coverFlags').innerHTML = picks.map(c => `<span><img src="${flagSrc(c.code)}" alt="" loading="lazy"></span>`).join('');
})();

onTap($('btnNameGo'), () => {
  const name = $('nameInput').value.trim().slice(0, 24);
  if (name) selectPlayer(name);
});
$('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('btnNameGo').click();
});

function selectPlayer(name) {
  player = name;
  try { localStorage.setItem(PLAYER_KEY, name); } catch { /* ignore */ }
  $('lvlWho').textContent = name;
  renderLevels();
  show('s-level');
}

/* Si ya hay un nombre guardado, se entra directo sin volver a preguntar. */
const savedPlayer = localStorage.getItem(PLAYER_KEY);
if (savedPlayer) {
  $('nameInput').value = savedPlayer;
  selectPlayer(savedPlayer);
} else {
  $('nameInput').focus();
}

/* ---------- Pantalla de nivel ---------- */
function renderLevels() {
  const cont = $('levels');
  const poolSize = poolForContinent().length;
  cont.innerHTML = '';
  Object.values(LEVELS).forEach(lvl => {
    const rounds = Math.min(lvl.rounds, poolSize);
    const b = document.createElement('button');
    b.className = 'level';
    b.innerHTML = `<span class="lIcon">${lvl.icon}</span>
      <span><span class="lLabel">${lvl.label}</span>
      <span class="lTag">${lvl.tagline} · ${rounds} rondas · ${lvl.secs}s</span></span>`;
    onTap(b, () => startLevel(lvl.key));
    cont.appendChild(b);
  });
}
onTap($('btnDaily'), startDaily);
onTap($('btnRanking'), () => { renderRanking(); show('s-ranking'); });
onTap($('btnLearn'), () => { renderLearnList(); show('s-learn'); });
onTap($('btnLearnBack'), () => show('s-level'));
onTap($('btnReview'), startReview);
onTap($('btnInvert'), startInvert);
onTap($('btnClassify'), startClassify);
onTap($('btnPairing'), startPairing);
onTap($('btnSurvival'), startSurvival);
onTap($('btnBackStart'), () => show('s-start'));
onTap($('btnRankBack'), () => show('s-level'));

function startLevel(key) {
  levelKey = key; level = LEVELS[key]; mode = 'classic'; dailyDateStr = null;
  distractorPool = poolForContinent();
  deck = buildDeck(level);
  beginGame();
}
function startDaily() {
  levelKey = DAILY_LEVEL_KEY; level = LEVELS[DAILY_LEVEL_KEY]; mode = 'daily'; dailyDateStr = null;
  distractorPool = COUNTRIES;
  const d = buildDailyDeck();
  deck = d.deck; dailyDateStr = d.dateStr;
  beginGame();
}
function startReview() {
  const codes = [...wrongMap.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([code]) => code);
  if (codes.length < REVIEW_MIN_FAILS) { show('s-level'); return; }
  const bySpeed = codes.map(code => COUNTRIES.find(c => c.code === code)).filter(Boolean);
  levelKey = null; level = REVIEW_LEVEL; mode = 'review'; dailyDateStr = null;
  distractorPool = COUNTRIES;
  deck = bySpeed.slice(0, Math.min(bySpeed.length, 20));
  beginGame();
}
function startInvert() {
  levelKey = null; level = INVERT_LEVEL; mode = 'invert'; dailyDateStr = null;
  distractorPool = COUNTRIES;
  deck = shuffle(COUNTRIES).slice(0, level.rounds);
  beginGame();
}
function startClassify() {
  levelKey = null; level = CLASSIFY_LEVEL; mode = 'classify'; dailyDateStr = null;
  distractorPool = COUNTRIES;
  deck = shuffle(COUNTRIES).slice(0, level.rounds);
  beginGame();
}
function startPairing() {
  levelKey = null; level = PAIRING_LEVEL; mode = 'pairing'; dailyDateStr = null;
  distractorPool = COUNTRIES;
  deck = shuffle(COUNTRIES).slice(0, level.rounds);
  beginGame();
}
function startSurvival() {
  levelKey = 'survival'; level = makeSurvivalLevel(); mode = 'survival'; dailyDateStr = null;
  distractorPool = COUNTRIES;
  deck = shuffle(COUNTRIES);
  beginGame();
}

/* ---------- Pantalla "Aprender sin prisa" (sin cronómetro ni puntuación) ---------- */
function renderLearnList() {
  const pool = poolForContinent().slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  $('learnList').innerHTML = pool.map(c => `
    <div class="learnRow">
      <img src="${flagSrc(c.code)}" alt="Bandera de ${escapeHtml(c.name)}" loading="lazy">
      <div class="learnInfo">
        <b>${escapeHtml(c.name)}</b>
        <span>${escapeHtml(c.continent)} · 🏛️ ${escapeHtml(c.capital)}</span>
      </div>
    </div>`).join('');
}

function beginGame() {
  idx = 0; score = 0; streak = 0; hintsLeft = level.hints; wrongList.length = 0;
  $('rounds').textContent = deck.length;
  $('whoChip').textContent = WHOCHIP_ICON[mode] || '✨';
  $('score').textContent = 0;
  show('s-game');
  nextRound();
}

/* ---------- Ronda de juego ---------- */
function nextRound() {
  if (idx >= deck.length) return end();
  clearInterval(timer);
  locked = false; wrongCount = 0; hintUsedThisRound = false;
  answer = deck[idx];
  if (mode === 'survival') Object.assign(level, survivalParamsForRound(idx));
  $('round').textContent = idx + 1;
  $('feedback').textContent = 'Elige una';
  $('fact').textContent = '';
  updateStreakChip();
  updateHintButton();

  const box = $('flagBox');
  const optsEl = $('options');
  optsEl.innerHTML = '';
  optsEl.classList.toggle('flagOptions', mode === 'invert');

  if (mode === 'invert') {
    box.innerHTML = `<div class="promptName">${escapeHtml(answer.name)}</div>`;
    const distractors = pickDistractors(distractorPool, answer, level.opts - 1, level.distractorMode);
    const choices = shuffle([answer, ...distractors]);
    choices.forEach(c => {
      const b = document.createElement('button');
      b.className = 'opt optFlag'; b.dataset.code = c.code;
      b.innerHTML = `<img src="${flagSrc(c.code)}" alt="${escapeHtml(describeFlag(c))}">`;
      onTap(b, () => pick(b, c));
      optsEl.appendChild(b);
    });
  } else if (mode === 'classify') {
    box.innerHTML = `<img src="${flagSrc(answer.code)}" alt="${escapeHtml(describeFlag(answer))}" loading="eager">`;
    shuffle(CONTINENTS).forEach(name => {
      const b = document.createElement('button');
      b.className = 'opt'; b.textContent = name; b.dataset.continent = name;
      onTap(b, () => pickClassify(b, name));
      optsEl.appendChild(b);
    });
  } else {
    box.innerHTML = `<img src="${flagSrc(answer.code)}" alt="${escapeHtml(describeFlag(answer))}" loading="eager">`;
    const distractors = pickDistractors(distractorPool, answer, level.opts - 1, level.distractorMode);
    const choices = shuffle([answer, ...distractors]);
    choices.forEach(c => {
      const b = document.createElement('button');
      b.className = 'opt'; b.dataset.code = c.code;
      b.textContent = mode === 'pairing' ? c.capital : c.name;
      onTap(b, () => pick(b, c));
      optsEl.appendChild(b);
    });
  }
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');

  tLeft = level.secs; paintTimer();
  timer = setInterval(() => {
    tLeft = Math.max(0, +(tLeft - 0.1).toFixed(1));
    paintTimer();
    if (tLeft <= 0) timeout();
  }, 100);
}

function paintTimer() {
  $('time').textContent = Math.ceil(tLeft);
  const fill = $('barFill');
  fill.style.width = (tLeft / level.secs * 100) + '%';
  fill.classList.toggle('low', tLeft <= level.secs * 0.3);
  $('timeChip').classList.toggle('warn', tLeft <= level.secs * 0.3);
}

function updateStreakChip() {
  const chip = $('streakChip');
  if (streak >= 3) {
    chip.style.display = '';
    $('streakMult').textContent = 'x' + streakMultiplier(streak);
  } else {
    chip.style.display = 'none';
  }
}

function updateHintButton() {
  const btn = $('btnHint');
  if (level.hints <= 0) { btn.style.display = 'none'; return; }
  btn.style.display = '';
  btn.disabled = hintsLeft <= 0 || hintUsedThisRound;
  $('hintCount').textContent = hintsLeft;
}

onTap($('btnHint'), () => {
  if (hintsLeft <= 0 || hintUsedThisRound || locked) return;
  const wrongBtns = [...$('options').children].filter(b => b.dataset.code !== answer.code && !b.disabled);
  if (!wrongBtns.length) return;
  const target = wrongBtns[Math.floor(Math.random() * wrongBtns.length)];
  target.disabled = true; target.classList.add('removed');
  hintsLeft--; hintUsedThisRound = true;
  updateHintButton();
});

/* ---------- Lluvia de emojis ---------- */
const HEARTS = ["❤️", "💖", "💕", "💗", "💓", "🧡", "💛", "💚", "💙", "💜", "🩷", "✨", "🎉", "⭐"];
const TEARS = ["😢", "😭", "💧", "😿", "🥺"];

function burst(kind) {
  const fx = $('fx');
  const box = $('flagBox').getBoundingClientRect();
  const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
  const win = kind === 'win';
  const set = win ? HEARTS : TEARS;
  const n = win ? 26 : 12;

  for (let i = 0; i < n; i++) {
    const e = document.createElement('i');
    e.textContent = set[Math.floor(Math.random() * set.length)];

    if (win) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 230;
      e.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
      e.style.setProperty('--dy', `${Math.sin(ang) * dist - 70}px`);
      e.style.setProperty('--d', `${1000 + Math.random() * 700}ms`);
      e.style.fontSize = `${26 + Math.random() * 24}px`;
    } else {
      e.style.setProperty('--dx', `${(Math.random() - .5) * 160}px`);
      e.style.setProperty('--dy', `${140 + Math.random() * 130}px`);
      e.style.setProperty('--d', `${900 + Math.random() * 500}ms`);
      e.style.fontSize = `${24 + Math.random() * 16}px`;
    }
    e.style.setProperty('--r1', `${(Math.random() - .5) * 40}deg`);
    e.style.setProperty('--r2', `${(Math.random() - .5) * 240}deg`);
    e.style.left = `${cx + (Math.random() - .5) * box.width * .55}px`;
    e.style.top = `${cy + (Math.random() - .5) * box.height * .4}px`;
    e.style.animationDelay = `${i * (win ? 22 : 38)}ms`;

    e.addEventListener('animationend', () => e.remove());
    fx.appendChild(e);
  }
}
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch { /* ignore */ } };

/* ---------- Resolución de ronda ---------- */
function factText() {
  return mode === 'pairing' ? `🏳️ País: ${answer.name}` : `🏛️ Capital: ${answer.capital}`;
}
function markCorrectOption() {
  const opts = [...$('options').children];
  const target = mode === 'classify'
    ? opts.find(b => b.dataset.continent === answer.continent)
    : opts.find(b => b.dataset.code === answer.code);
  if (target) target.classList.add('good');
}

function resolveRound(btn, isCorrect) {
  if (locked) return;
  if (isCorrect) {
    buzz([28, 50, 28]);
    burst('win');
    locked = true; clearInterval(timer);
    const pts = computePoints(tLeft, wrongCount, streak, hintUsedThisRound);
    score += pts; $('score').textContent = score;
    streak = wrongCount === 0 ? streak + 1 : 0;
    updateStreakChip();
    btn.classList.add('good');
    [...$('options').children].forEach(b => b.disabled = true);
    $('feedback').textContent = wrongCount === 0 ? `¡Muy bien! +${pts} ⭐` : `¡Esa es! +${pts} ⭐`;
    $('fact').textContent = factText();
    if (wrongCount > 0) { wrongList.push(answer.name); recordWrong(answer.code); }
    if (mode === 'review') clearWrong(answer.code);
    idx++;
    setTimeout(nextRound, 1000);
  } else {
    buzz(140);
    burst('lose');
    wrongCount++;
    btn.classList.add('bad'); btn.disabled = true;

    if (!level.retry) {
      locked = true; clearInterval(timer);
      streak = 0; updateStreakChip();
      wrongList.push(answer.name);
      recordWrong(answer.code);
      [...$('options').children].forEach(b => b.disabled = true);
      markCorrectOption();
      $('feedback').textContent = `Era ${answer.name}`;
      $('fact').textContent = factText();
      if (mode === 'survival') {
        setTimeout(end, 1500);
      } else {
        idx++;
        setTimeout(nextRound, 1500);
      }
      return;
    }

    $('feedback').textContent = 'Casi… prueba otra 🤔';
    const box = $('flagBox');
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }
}

function pick(btn, choice) { resolveRound(btn, choice.code === answer.code); }
function pickClassify(btn, continentName) { resolveRound(btn, continentName === answer.continent); }

function timeout() {
  clearInterval(timer); locked = true;
  buzz(140); burst('lose');
  streak = 0; updateStreakChip();
  wrongList.push(answer.name);
  recordWrong(answer.code);
  [...$('options').children].forEach(b => b.disabled = true);
  markCorrectOption();
  $('feedback').textContent = `Se acabó el tiempo: ${answer.name}`;
  $('fact').textContent = factText();
  if (mode === 'survival') {
    setTimeout(end, 1600);
  } else {
    idx++;
    setTimeout(nextRound, 1600);
  }
}

/* Reproduce el modo actual (usado por "reiniciar" y "jugar otra vez"). */
function replay() {
  if (mode === 'daily') startDaily();
  else if (mode === 'review') startReview();
  else if (mode === 'survival') startSurvival();
  else if (mode === 'invert') startInvert();
  else if (mode === 'classify') startClassify();
  else if (mode === 'pairing') startPairing();
  else startLevel(levelKey);
}

/* ---------- Menú en partida (reiniciar / terminar, sin pausa) ---------- */
onTap($('btnMenu'), () => $('menuOverlay').classList.add('on'));
onTap($('btnMenuClose'), () => $('menuOverlay').classList.remove('on'));
onTap($('btnRestart'), () => {
  $('menuOverlay').classList.remove('on');
  replay();
});
onTap($('btnQuit'), () => {
  $('menuOverlay').classList.remove('on');
  clearInterval(timer);
  show('s-level');
});

/* ---------- Fin de partida ---------- */
function end() {
  clearInterval(timer);
  $('endScore').textContent = score;
  if (mode === 'survival') {
    const finished = idx >= deck.length;
    $('endTitle').textContent = finished ? '¡Las viste todas! 🌍🏆' : '💥 ¡Racha terminada!';
    $('endSub').textContent = `${level.icon} Supervivencia · sobreviviste ${idx} ${idx === 1 ? 'ronda' : 'rondas'}`;
  } else {
    const max = Math.round(deck.length * 100 * level.mult);
    $('endTitle').textContent = score > max * .8 ? '¡Increíble! 🏆' : score > max * .5 ? '¡Muy bien! 🎉' : '¡Buen intento! 💪';
    $('endSub').textContent = `${level.icon} ${level.label}${mode === 'daily' ? ' · Reto diario 🔥' : ''} · aprox. de ${max} puntos posibles`;
  }
  const list = $('endList');
  list.innerHTML = wrongList.length === 0
    ? '<div>Ni un solo fallo. Impresionante. 🌟</div>'
    : '<div><b>Para repasar:</b></div>' + [...new Set(wrongList)].map(n => `<div>• ${n}</div>`).join('');
  show('s-end');
  if (mode === 'classic' || mode === 'daily' || mode === 'survival') {
    saveScore({
      player, level: levelKey, score, rounds: mode === 'survival' ? idx : deck.length,
      errors: wrongList.length, daily: mode === 'daily', dailyDate: dailyDateStr,
    }).then(result => {
      if (mode === 'daily' && result.reason === 'duplicate') {
        $('endSub').textContent += ' · Ya jugaste hoy: este intento no cuenta para el ranking';
      }
    });
  }
}

onTap($('btnAgain'), replay);
onTap($('btnChangeLevel'), () => show('s-level'));
onTap($('btnHome'), () => show('s-start'));

/* ---------- Ranking familiar + duelo asíncrono sobre el mazo diario ---------- */
let lastDailyRanking = [];
const normName = s => String(s).trim().toLowerCase();

async function renderRanking() {
  $('rankFamily').innerHTML = '<div>Cargando…</div>';
  $('rankDaily').innerHTML = '<div>Cargando…</div>';
  $('duelResult').textContent = '';
  const [fam, daily] = await Promise.all([getFamilyRanking(), getDailyRanking()]);
  lastDailyRanking = daily || [];

  $('rankFamily').innerHTML = (fam && fam.length)
    ? fam.map(r => `<div><span>${LEVELS[r.level]?.icon || MODE_LABELS[r.level]?.icon || ''} ${escapeHtml(r.player)} · ${LEVELS[r.level]?.label || MODE_LABELS[r.level]?.label || r.level}</span><b>${r.best_score} ⭐</b></div>`).join('')
    : '<div>Aún no hay partidas guardadas.</div>';

  $('rankDaily').innerHTML = (lastDailyRanking.length)
    ? lastDailyRanking.map(r => `<div><span>${escapeHtml(r.player)}</span><b>${r.score} ⭐</b></div>`).join('')
    : '<div>Nadie ha jugado el reto de hoy todavía.</div>';
}

onTap($('btnDuel'), () => {
  const rivalName = $('duelName').value.trim();
  const resultEl = $('duelResult');
  if (!rivalName) { resultEl.textContent = 'Escribe el nombre de tu rival.'; return; }
  const mine = lastDailyRanking.find(r => normName(r.player) === normName(player || ''));
  const rival = lastDailyRanking.find(r => normName(r.player) === normName(rivalName));
  if (!mine) { resultEl.textContent = 'Aún no has jugado el reto de hoy.'; return; }
  if (!rival) { resultEl.textContent = `${rivalName} no ha jugado el reto de hoy todavía.`; return; }
  if (mine.score > rival.score) resultEl.textContent = `¡Le ganas! ${mine.score} ⭐ vs ${rival.score} ⭐`;
  else if (mine.score < rival.score) resultEl.textContent = `Te gana. ${mine.score} ⭐ vs ${rival.score} ⭐`;
  else resultEl.textContent = `¡Empate! ${mine.score} ⭐ los dos`;
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- Si se bloquea el móvil o se cambia de app, se descuenta el tiempo real transcurrido ---------- */
let hiddenAt = null;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    clearInterval(timer);
  } else if (!locked && $('s-game').classList.contains('on') && tLeft > 0) {
    if (hiddenAt !== null) {
      tLeft = Math.max(0, +(tLeft - (Date.now() - hiddenAt) / 1000).toFixed(1));
      hiddenAt = null;
    }
    clearInterval(timer);
    if (tLeft <= 0) { timeout(); return; }
    paintTimer();
    timer = setInterval(() => {
      tLeft = Math.max(0, +(tLeft - 0.1).toFixed(1));
      paintTimer();
      if (tLeft <= 0) timeout();
    }, 100);
  }
});
