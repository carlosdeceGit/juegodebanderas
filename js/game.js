import { COUNTRIES, CONTINENTS } from "./countries.js";
import { LEVELS, DAILY_LEVEL_KEY, DAILY_ROUNDS } from "./levels.js";
import { pickDistractors } from "./distractors.js";
import { saveScore, getDailyRanking } from "./db.js";
import { describeFlag } from "./flagDescription.js";
import {
  t, applyStaticI18n, initI18n, setLocale, getLocale, LOCALES,
  countryName, countryCapital, continentName, compareText,
} from "./i18n.js";

/* Lo primero de todo, y a la espera: sin idioma cargado no hay ni una
   cadena que pintar ni un nombre de país que enseñar. Todo lo que viene
   después de esta línea da por hecho que el idioma ya está. */
await initI18n();
applyStaticI18n();

/* Modo "repasa tus fallos": no es un nivel fijo, se arma con las banderas
   que más ha fallado el jugador. No cuenta para el ranking. */
const REVIEW_LEVEL = {
  key: "repaso", labelKey: "level.review.label", icon: "🔁",
  secs: 15, opts: 3, distractorMode: "mixed", retry: true, hints: 2, mult: 1,
};
const REVIEW_MIN_FAILS = 3;

/* Modos adicionales (Fase 2): reutilizan el mismo bucle y los mismos datos,
   con una única dificultad fija cada uno (nada de tutorial, un botón y a jugar). */
const INVERT_LEVEL = {
  key: "invert", labelKey: "level.invert.label", icon: "🔄",
  rounds: 16, secs: 12, opts: 3, distractorMode: "mixed", retry: true, hints: 2, mult: 1,
};
const CLASSIFY_LEVEL = {
  key: "classify", labelKey: "level.classify.label", icon: "🗺️",
  rounds: 20, secs: 8, opts: 5, distractorMode: null, retry: true, hints: 0, mult: 1,
};
const PAIRING_LEVEL = {
  key: "pairing", labelKey: "level.pairing.label", icon: "🏛️",
  rounds: 16, secs: 14, opts: 3, distractorMode: "mixed", retry: true, hints: 2, mult: 1,
};
/* Supervivencia: una sola vida, la dificultad sube con cada acierto.
   Se genera un objeto nuevo por partida porque sus campos se mutan ronda a ronda. */
function makeSurvivalLevel() {
  return {
    key: "survival", labelKey: "level.survival.label", icon: "💀",
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
const MODE_LABELS = { survival: { icon: "💀", labelKey: "level.survival.label" } };

/* ───────────────────────────────────────────────────────────────────
   Catálogo de modos.

   Es la única fuente de verdad de la pantalla "¿A qué jugamos?" y del
   asistente. `needsLevel` es lo que decide si un modo tiene 3 pasos o
   2: solo el clásico deja elegir nivel, el resto trae el suyo fijo
   (INVERT_LEVEL, CLASSIFY_LEVEL, PAIRING_LEVEL, makeSurvivalLevel).
   Añadir un modo nuevo es añadir una entrada aquí y su función de
   arranque — el asistente no necesita saber nada más.
   ─────────────────────────────────────────────────────────────────── */
const MODES = {
  classic: {
    icon: "🏳️", labelKey: "modes.classic.label", taglineKey: "modes.classic.tagline",
    needsLevel: true, usesScope: true, scoreable: true, start: () => startLevel(wizard.levelKey),
    hidden: true,
  },
  invert: {
    icon: "🔄", labelKey: "modes.invert.label", taglineKey: "modes.invert.tagline",
    needsLevel: false, usesScope: false, scoreable: false, start: startInvert,
  },
  pairing: {
    icon: "🏛️", labelKey: "modes.pairing.label", taglineKey: "modes.pairing.tagline",
    needsLevel: false, usesScope: false, scoreable: false, start: startPairing,
  },
  classify: {
    icon: "🗺️", labelKey: "modes.classify.label", taglineKey: "modes.classify.tagline",
    needsLevel: false, usesScope: false, scoreable: false, start: startClassify,
  },
  survival: {
    icon: "💀", labelKey: "modes.survival.label", taglineKey: "modes.survival.tagline",
    needsLevel: false, usesScope: false, scoreable: true, start: startSurvival,
  },
  daily: {
    icon: "🔥", labelKey: "modes.daily.label", taglineKey: "modes.daily.tagline",
    needsLevel: false, usesScope: false, scoreable: true, start: startDaily, hidden: true,
  },
  review: {
    icon: "🔁", labelKey: "modes.review.label", taglineKey: "modes.review.tagline",
    needsLevel: false, usesScope: false, scoreable: false, start: startReview, hidden: true,
  },
};
/* Los que se pintan en la rejilla de "Más juegos" del paso 1. El clásico
   y el reto diario son los dos protagonistas de la portada y tienen su
   propia tarjeta destacada arriba; el repaso vive en el bloque de "sin
   puntos". Los tres van marcados como `hidden` para no repetirse. */
const GRID_MODES = Object.entries(MODES).filter(([, m]) => !m.hidden);

window.onerror = function (m, src, l, c) {
  console.error(m, src, l, c);
  if (document.getElementById('dcb-error-banner')) return;
  const d = document.createElement('div');
  d.id = 'dcb-error-banner';
  d.className = 'errorBanner';
  d.textContent = t('error.generic');
  document.body.appendChild(d);
};

const $ = id => document.getElementById(id);
const flagSrc = code => `assets/flags/${code}.svg`;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* El bloqueo de scroll se activa solo en la partida (ver style.css). */
const show = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  document.documentElement.classList.toggle('is-playing', id === 's-game');
  window.scrollTo(0, 0);
  if (id === 's-mode') renderModeStep();
  if (id === 's-level') renderLevelStep();
  if (id === 's-who') renderWhoStep();
};

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/* Solo `click`, nunca `touchend`.

   Con `touchend` cualquier dedo que se levantase encima de un botón lo
   activaba, aunque el gesto hubiese sido un scroll de media pantalla: en
   el móvil era imposible desplazarse por la portada sin entrar en alguna
   tarjeta sin querer. El navegador ya distingue el scroll del toque y no
   emite `click` si el dedo se ha desplazado, así que hace el trabajo
   bien. No se pierde reactividad: `touch-action:manipulation` en el body
   ya elimina el retardo de 300ms que motivaba el atajo.

   Tampoco se llama a `preventDefault()`: en `click` no aporta nada y
   estropea el foco de teclado. El antirrebote de 500ms se queda, que es
   lo que evita el doble disparo. */
function onTap(el, fn) {
  let last = 0;
  el.addEventListener('click', e => {
    const now = Date.now();
    if (now - last < 500) return;
    last = now;
    fn(e);
  });
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
/* Fecha en UTC, no local: decisión de producto explícita, ver
   docs/decisiones-producto.md — es lo que mantiene un único mazo diario
   comparable entre todos los jugadores. */
function todayStr() { return new Date().toISOString().slice(0, 10); }

/* ---------- Almacenamiento local, siempre tolerante a fallo ---------- */
function lsGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function lsSet(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } }
function lsDel(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }

/* ---------- Memoria de banderas vistas (persiste entre partidas) ---------- */
const SEEN_KEY = 'dcb_seen_v1';
function loadSeen() {
  try { return new Map(JSON.parse(lsGet(SEEN_KEY)) || []); }
  catch { return new Map(); }
}
function saveSeenMap() { lsSet(SEEN_KEY, JSON.stringify([...seen])); }
const seen = loadSeen();
for (const c of COUNTRIES) if (!seen.has(c.code)) seen.set(c.code, 0);

function updateSeenProgress() {
  const learned = [...seen.values()].filter(v => v > 0).length;
  $('seenProgress').textContent = t('progress.seenFlags', { learned, total: COUNTRIES.length });
}

/* ---------- Historial de fallos (persiste entre partidas, para "Repasa tus fallos") ---------- */
const WRONG_KEY = 'dcb_wrong_v1';
function loadWrongMap() {
  try { return new Map(JSON.parse(lsGet(WRONG_KEY)) || []); }
  catch { return new Map(); }
}
function saveWrongMap() { lsSet(WRONG_KEY, JSON.stringify([...wrongMap])); }
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
function wrongCodes() {
  return [...wrongMap.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([code]) => code);
}

/* ---------- Filtro de continente (solo afecta a los niveles clásicos) ----------
   El continente se guarda como código ("af", "am"…). Antes se guardaba el
   nombre en español, así que quien ya tenía un filtro puesto lo traía
   escrito "África": se traduce al vuelo y se vuelve a guardar. */
const CONTINENT_KEY = 'dcb_continent';
const LEGACY_CONTINENTS = {
  'África': 'af', 'América': 'am', 'Asia': 'as', 'Europa': 'eu', 'Oceanía': 'oc',
};
function normalizeContinent(value) {
  if (CONTINENTS.includes(value)) return value;
  return LEGACY_CONTINENTS[value] || '';
}
let continentFilter = normalizeContinent(lsGet(CONTINENT_KEY));
lsSet(CONTINENT_KEY, continentFilter);

function poolForContinent() {
  return continentFilter ? COUNTRIES.filter(c => c.continent === continentFilter) : COUNTRIES;
}
function setContinent(value) {
  continentFilter = normalizeContinent(value);
  lsSet(CONTINENT_KEY, continentFilter);
}

/* ---------- Jugadores ----------
   Antes había un único nombre en `dcb_player`, así que en un móvil
   compartido las partidas del segundo jugador se guardaban con el
   nombre del primero y el ranking familiar quedaba mal atribuido.
   Ahora hay una lista y el paso 3 del asistente es elegir tu ficha. */
const PLAYERS_KEY = 'dcb_players_v1';
const LEGACY_PLAYER_KEY = 'dcb_player';
const AVATARS = ['🦊', '🐢', '🐙', '🐼', '🦉', '🐝', '🦁', '🐧', '🦄', '🐳', '🦖', '🐨'];

function loadPlayers() {
  try {
    const raw = JSON.parse(lsGet(PLAYERS_KEY));
    if (Array.isArray(raw)) return raw.filter(p => p && typeof p.name === 'string');
  } catch { /* ignore */ }
  return [];
}
let players = loadPlayers();
function savePlayers() { lsSet(PLAYERS_KEY, JSON.stringify(players)); }

/* Migración del nombre único anterior: nadie pierde su jugador. */
(function migratePlayer() {
  const legacy = lsGet(LEGACY_PLAYER_KEY);
  if (legacy && !players.length) {
    players = [{ name: legacy, lastPlayedAt: Date.now() }];
    savePlayers();
  }
  if (legacy && players.length) lsDel(LEGACY_PLAYER_KEY);
})();

const normName = s => String(s).trim().toLowerCase();
function avatarFor(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATARS[h % AVATARS.length];
}
function findPlayer(name) { return players.find(p => normName(p.name) === normName(name)); }
function addPlayer(name) {
  const existing = findPlayer(name);
  if (existing) return existing;
  const entry = { name, lastPlayedAt: 0 };
  players.push(entry);
  savePlayers();
  return entry;
}
function touchPlayer(name) {
  const entry = findPlayer(name);
  if (!entry) return;
  entry.lastPlayedAt = Date.now();
  savePlayers();
}
function playersByRecent() {
  return players.slice().sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
}

/* ---------- Ranking de casa, en local ----------
   Las mejores marcas se guardan en este dispositivo, no en el servidor.
   Antes se leían de la vista `best_scores`, que devolvía las 50 mejores
   de toda la tabla sin filtro: se llamaba "ranking familiar" pero era un
   tablón de cualquiera que hubiese jugado desde cualquier sitio, con los
   nombres a la vista. En local no hace falta ni cuenta ni servidor, no
   cuesta nada y los nombres no salen del dispositivo. El precio es que
   no se comparten marcas entre el móvil y la tablet: para eso haría
   falta un servidor con las partidas agrupadas por familia. */
const SCORES_KEY = 'dcb_scores_v1';
const SCORES_MAX = 100;
function loadScores() {
  try {
    const raw = JSON.parse(lsGet(SCORES_KEY));
    if (Array.isArray(raw)) return raw;
  } catch { /* ignore */ }
  return [];
}
let localScores = loadScores();

/* Una entrada por jugador y nivel, con su mejor marca — igual que hacía
   la vista `best_scores` con su `max(score) group by player, level`. */
function recordLocalScore({ player: who, level: lvl, score: pts, rounds }) {
  const i = localScores.findIndex(s => normName(s.player) === normName(who) && s.level === lvl);
  if (i >= 0) {
    if (pts <= localScores[i].score) return;
    localScores[i] = { player: who, level: lvl, score: pts, rounds, at: Date.now() };
  } else {
    localScores.push({ player: who, level: lvl, score: pts, rounds, at: Date.now() });
  }
  localScores.sort((a, b) => b.score - a.score);
  localScores = localScores.slice(0, SCORES_MAX);
  lsSet(SCORES_KEY, JSON.stringify(localScores));
}

/* ---------- Última partida, para "Seguir jugando" ---------- */
const LAST_KEY = 'dcb_last_v1';
function loadLast() {
  try {
    const raw = JSON.parse(lsGet(LAST_KEY));
    if (raw && MODES[raw.modeKey] && raw.player) return raw;
  } catch { /* ignore */ }
  return null;
}
function saveLast() {
  lsSet(LAST_KEY, JSON.stringify({
    modeKey: wizard.modeKey, levelKey: wizard.levelKey,
    scope: continentFilter, player, at: Date.now(),
  }));
}

/* ---------- Tamaño de texto ----------
   Sustituye al antiguo `body.big`, que solo escalaba cinco selectores
   de la partida. Ahora es `--scale` en :root y escala toda la interfaz. */
const TEXTSIZE_KEY = 'dcb_textsize';
const LEGACY_BIGTEXT_KEY = 'dcb_bigtext';
const TEXT_SIZES = ['md', 'lg', 'xl'];
function loadTextSize() {
  const stored = lsGet(TEXTSIZE_KEY);
  if (TEXT_SIZES.includes(stored)) return stored;
  return lsGet(LEGACY_BIGTEXT_KEY) === '1' ? 'lg' : 'md';
}
function applyTextSize(size) {
  document.documentElement.dataset.text = size;
  lsSet(TEXTSIZE_KEY, size);
  lsDel(LEGACY_BIGTEXT_KEY);
  $('textSizeSeg').querySelectorAll('[data-size]').forEach(b => {
    b.setAttribute('aria-checked', String(b.dataset.size === size));
  });
}

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

/* Selección en curso del asistente. No se persiste: al terminar una
   partida se guarda en `dcb_last_v1` y ya. */
const wizard = { modeKey: 'classic', levelKey: 'nene' };

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

/* ═══════════════════════════════════════════════════════════════════
   ASISTENTE: tipo de juego → nivel → jugador

   Cada paso se completa con un toque y avanza solo; no hay botón de
   "siguiente". Los modos sin nivel propio saltan del paso 1 al 3, y el
   indicador de progreso se pinta con dos píldoras en vez de tres.
   ═══════════════════════════════════════════════════════════════════ */

/* ---------- Paso 1: ¿A qué jugamos? ---------- */
function renderModeStep() {
  updateSeenProgress();

  const grid = $('modeGrid');
  grid.innerHTML = '';
  GRID_MODES.forEach(([key, m]) => {
    const b = document.createElement('button');
    b.className = 'card';
    b.type = 'button';
    b.innerHTML = `<span class="card__icon">${m.icon}</span>
      <span class="card__text">
        <span class="card__title">${escapeHtml(t(m.labelKey))}</span>
        <span class="card__sub">${escapeHtml(t(m.taglineKey))}</span>
      </span>` + (m.scoreable
        ? `<span class="card__badge" role="img" aria-label="${escapeHtml(t('modes.scoresHint'))}">🏆</span>`
        : '');
    onTap(b, () => chooseMode(key));
    grid.appendChild(b);
  });

  const failing = wrongCodes().length;
  const review = $('btnReview');
  review.hidden = failing < REVIEW_MIN_FAILS;
  if (!review.hidden) $('reviewSub').textContent = t('modes.review.count', { count: failing });

  const last = loadLast();
  const cont = $('btnContinue');
  cont.hidden = !last;
  if (last) {
    const m = MODES[last.modeKey];
    const parts = [`${m.icon} ${t(m.labelKey)}`];
    if (m.needsLevel && LEVELS[last.levelKey]) parts.push(t(LEVELS[last.levelKey].labelKey));
    const scope = normalizeContinent(last.scope);
    if (m.usesScope && scope) parts.push(continentName(scope));
    parts.push(last.player);
    $('continueSub').textContent = parts.join(' · ');
  }
}

function chooseMode(key) {
  wizard.modeKey = key;
  if (MODES[key].needsLevel) show('s-level');
  else show('s-who');
}

/* ---------- Paso 2: ¿Cómo de difícil? ---------- */
function renderLevelStep() {
  const m = MODES[wizard.modeKey];
  $('levelModeEcho').textContent = `${m.icon} ${t(m.labelKey)}`;

  const poolSize = poolForContinent().length;
  const cont = $('levels');
  cont.innerHTML = '';
  Object.values(LEVELS).forEach(lvl => {
    const rounds = Math.min(lvl.rounds, poolSize);
    const b = document.createElement('button');
    b.className = 'card' + (lvl.key === wizard.levelKey ? ' card--current' : '');
    b.type = 'button';
    b.innerHTML = `<span class="card__icon">${lvl.icon}</span>
      <span class="card__text">
        <span class="card__title">${escapeHtml(t(lvl.labelKey))}</span>
        <span class="card__sub">${escapeHtml(t('level.tag', { tagline: t(lvl.taglineKey), rounds, secs: lvl.secs }))}</span>
      </span>`;
    onTap(b, () => { wizard.levelKey = lvl.key; show('s-who'); });
    cont.appendChild(b);
  });

  renderContinentSeg($('continentSeg'), () => renderLevelStep());
  $('scopeNote').textContent = continentFilter
    ? t('level.scopeCount', { scope: continentName(continentFilter), count: poolSize })
    : t('level.scopeAll', { count: poolSize });
}

function renderContinentSeg(host, onChange) {
  host.innerHTML = '';
  const options = [['', t('level.continentAll')], ...CONTINENTS.map(c => [c, continentName(c)])];
  options.forEach(([value, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(value === continentFilter));
    b.textContent = label;
    onTap(b, () => { setContinent(value); onChange(); });
    host.appendChild(b);
  });
}

/* ---------- Paso 3: ¿Quién juega? ---------- */
function renderWhoStep() {
  const m = MODES[wizard.modeKey];
  const parts = [`${m.icon} ${t(m.labelKey)}`];
  if (m.needsLevel && LEVELS[wizard.levelKey]) parts.push(t(LEVELS[wizard.levelKey].labelKey));
  if (m.usesScope && continentFilter) parts.push(continentName(continentFilter));
  $('whoSummary').textContent = parts.join(' · ');
  $('whoError').textContent = '';

  $('btnWhoBack').hidden = !m.needsLevel;

  const list = playersByRecent();
  const grid = $('peopleGrid');
  grid.innerHTML = '';
  list.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'person' + (i === 0 && p.lastPlayedAt ? ' person--last' : '');
    b.type = 'button';
    b.innerHTML = `<span class="person__face">${avatarFor(p.name)}</span>
      <span class="person__name">${escapeHtml(p.name)}</span>
      <span class="person__meta">${i === 0 && p.lastPlayedAt ? escapeHtml(t('wizard.playedLast')) : ''}</span>`;
    onTap(b, () => choosePlayer(p.name));
    grid.appendChild(b);
  });

  /* Sin jugadores todavía, el formulario ES la pantalla: una ficha de
     "alguien nuevo" suelta al lado de nada sobra y confunde. */
  if (list.length) {
    const add = document.createElement('button');
    add.className = 'person person--new';
    add.type = 'button';
    add.innerHTML = `<span class="person__face">➕</span>
      <span class="person__name">${escapeHtml(t('wizard.someoneNew'))}</span>
      <span class="person__meta"></span>`;
    onTap(add, () => {
      $('newPlayerRow').hidden = false;
      $('langBarWrap').hidden = false;
      $('nameInput').focus();
    });
    grid.appendChild(add);
  }
  /* El selector de idioma acompaña al formulario de nombre: es el
     momento en que alguien nuevo llega al juego y puede necesitarlo.
     Fuera de ahí vive solo en los ajustes. */
  $('newPlayerRow').hidden = list.length > 0;
  $('langBarWrap').hidden = list.length > 0;
  renderLangBar();
  $('whoTitle').textContent = list.length ? t('wizard.whoPlays') : t('start.who');
}

function choosePlayer(name) {
  player = name;
  addPlayer(name);
  touchPlayer(name);
  saveLast();
  MODES[wizard.modeKey].start();
}

function submitNewPlayer() {
  const name = $('nameInput').value.trim().slice(0, 24);
  if (!name) { $('whoError').textContent = t('wizard.needName'); return; }
  if (findPlayer(name) && playersByRecent().length) {
    $('whoError').textContent = t('wizard.nameTaken', { name });
    return;
  }
  $('nameInput').value = '';
  choosePlayer(name);
}

onTap($('btnNameGo'), submitNewPlayer);
$('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); submitNewPlayer(); }
});

/* ---------- Navegación suelta del paso 1 ---------- */
document.querySelectorAll('[data-nav]').forEach(el => onTap(el, () => show(el.dataset.nav)));
onTap($('btnWhoBack'), () => show('s-level'));
onTap($('btnClassic'), () => chooseMode('classic'));
onTap($('btnDaily'), () => chooseMode('daily'));
onTap($('btnReview'), () => chooseMode('review'));
onTap($('btnRanking'), () => { renderRanking(); show('s-ranking'); });
onTap($('btnLearn'), () => { renderLearnList(); show('s-learn'); });
onTap($('btnLearnBack'), () => show('s-mode'));
onTap($('btnRankBack'), () => show('s-mode'));

onTap($('btnContinue'), () => {
  const last = loadLast();
  if (!last) return;
  wizard.modeKey = last.modeKey;
  wizard.levelKey = last.levelKey || wizard.levelKey;
  if (last.scope !== undefined) setContinent(last.scope);
  choosePlayer(last.player);
});

/* ---------- Ajustes ---------- */
document.querySelectorAll('[data-settings]').forEach(el => onTap(el, () => {
  const open = el.dataset.settings === 'open';
  if (open) { renderSettingsPlayers(); renderLanguageSeg(); }
  $('settingsSheet').classList.toggle('on', open);
}));

/* ---------- Idioma ----------
   Hay dos selectores y hacen lo mismo: uno en la portada, siempre a la
   vista, y otro en los ajustes. El de la portada es el que importa —
   si el juego arranca en el idioma equivocado (lo detecta del navegador),
   se arregla ahí mismo sin tener que ir a buscarlo a ningún menú.

   El cambio es en caliente: se trae el paquete nuevo, se vuelven a pintar
   las cadenas fijas del HTML y se repinta la pantalla que esté puesta.
   Cuando se cambia desde los ajustes, la hoja se queda abierta a propósito:
   así se ve el cambio sin salir de donde se ha hecho.

   Ninguno de los dos está en la partida: cambiar de idioma a media ronda,
   con el reloj corriendo y las opciones ya en pantalla, no es algo que
   haga falta poder hacer. */
async function changeLanguage(code) {
  await setLocale(code);
  applyStaticI18n();
  renderLangBar();
  renderLanguageSeg();
  renderSettingsPlayers();
  renderCurrentScreen();
}

/* Un botón de idioma. Se pinta el código corto o el nombre entero según
   quepa, pero el nombre completo va siempre en el `aria-label` y el `lang`
   propio hace que un lector de pantalla lo lea con su pronunciación —
   "Français" leído en español no lo entiende nadie. */
function languageButton({ code, label, short }, useShortLabel) {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('role', 'radio');
  b.setAttribute('aria-checked', String(code === getLocale()));
  b.setAttribute('aria-label', label);
  b.lang = code;
  b.textContent = useShortLabel ? short : label;
  if (useShortLabel) b.title = label;
  onTap(b, () => changeLanguage(code));
  return b;
}

function renderLangBar() {
  const host = $('langBar');
  host.innerHTML = '';
  LOCALES.forEach(loc => host.appendChild(languageButton(loc, true)));
}

function renderLanguageSeg() {
  const host = $('languageSeg');
  host.innerHTML = '';
  LOCALES.forEach(loc => host.appendChild(languageButton(loc, false)));
}

/* Repinta la pantalla visible sin navegar (no toca el scroll ni el paso del
   asistente). Las que no salen aquí no llevan texto que dependa del idioma
   fuera de lo que ya arregla applyStaticI18n(). */
function renderCurrentScreen() {
  const id = document.querySelector('.screen.on')?.id;
  if (id === 's-mode') renderModeStep();
  else if (id === 's-level') renderLevelStep();
  else if (id === 's-who') renderWhoStep();
  else if (id === 's-learn') renderLearnList();
  else if (id === 's-ranking') renderRanking();
}
$('textSizeSeg').querySelectorAll('[data-size]').forEach(b => {
  onTap(b, () => applyTextSize(b.dataset.size));
});
function renderSettingsPlayers() {
  const host = $('settingsPlayers');
  const list = playersByRecent();
  host.innerHTML = list.length
    ? list.map(p => `<div class="row">
        <span class="row__rank">${avatarFor(p.name)}</span>
        <span class="row__name">${escapeHtml(p.name)}</span>
        <span class="row__val"></span></div>`).join('')
    : `<div class="row row--empty">${escapeHtml(t('settings.noPlayers'))}</div>`;
}
applyTextSize(loadTextSize());

/* ---------- Arranque de cada modo ---------- */
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
  const codes = wrongCodes();
  if (codes.length < REVIEW_MIN_FAILS) { show('s-mode'); return; }
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
  renderContinentSeg($('learnSeg'), renderLearnList);
  /* El alfabético depende del idioma: "Ãland" y "Zimbabue" no caen en el
     mismo sitio en sueco que en español. */
  const pool = poolForContinent().slice()
    .sort((a, b) => compareText(countryName(a), countryName(b)));
  $('learnList').innerHTML = pool.map(c => `
    <div class="learnRow">
      <img src="${flagSrc(c.code)}" alt="${escapeHtml(t('learn.flagAlt', { name: countryName(c) }))}" loading="lazy">
      <div class="learnInfo">
        <b>${escapeHtml(countryName(c))}</b>
        <span>${escapeHtml(continentName(c.continent))} · 🏛️ ${escapeHtml(countryCapital(c))}</span>
      </div>
    </div>`).join('');
}

function beginGame() {
  idx = 0; score = 0; streak = 0; hintsLeft = level.hints; wrongList.length = 0;
  $('rounds').textContent = deck.length;
  /* El nombre va en su propio span: antes se metía tal cual en el chip y
     en un móvil estrecho desbordaba la cápsula, se montaba encima del
     contador y descuadraba todo el marcador. */
  $('whoChip').innerHTML = `<span class="chip__ico">${player ? avatarFor(player) : '✨'}</span>`
    + `<span class="chip__name">${escapeHtml(player || '')}</span>`;
  fitWhoChip();
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
  $('feedback').textContent = t('game.chooseOne');
  $('fact').textContent = '';
  updateStreakChip();
  updateHintButton();

  const box = $('flagBox');
  const optsEl = $('options');
  optsEl.innerHTML = '';
  optsEl.classList.toggle('flagOptions', mode === 'invert');

  if (mode === 'invert') {
    box.innerHTML = `<div class="promptName">${escapeHtml(countryName(answer))}</div>`;
    const distractors = pickDistractors(distractorPool, answer, level.opts - 1, level.distractorMode);
    const choices = shuffle([answer, ...distractors]);
    choices.forEach(c => {
      const b = document.createElement('button');
      b.className = 'btn opt optFlag'; b.dataset.code = c.code;
      b.innerHTML = `<img src="${flagSrc(c.code)}" alt="${escapeHtml(describeFlag(c))}">`;
      onTap(b, () => pick(b, c));
      optsEl.appendChild(b);
    });
  } else if (mode === 'classify') {
    box.innerHTML = `<img src="${flagSrc(answer.code)}" alt="${escapeHtml(describeFlag(answer))}" loading="eager">`;
    shuffle(CONTINENTS).forEach(code => {
      const b = document.createElement('button');
      b.className = 'btn opt'; b.textContent = continentName(code); b.dataset.continent = code;
      onTap(b, () => pickClassify(b, code));
      optsEl.appendChild(b);
    });
  } else {
    box.innerHTML = `<img src="${flagSrc(answer.code)}" alt="${escapeHtml(describeFlag(answer))}" loading="eager">`;
    const distractors = pickDistractors(distractorPool, answer, level.opts - 1, level.distractorMode);
    const choices = shuffle([answer, ...distractors]);
    choices.forEach(c => {
      const b = document.createElement('button');
      b.className = 'btn opt'; b.dataset.code = c.code;
      b.textContent = mode === 'pairing' ? countryCapital(c) : countryName(c);
      onTap(b, () => pick(b, c));
      optsEl.appendChild(b);
    });
  }
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');

  tLeft = level.secs; paintTimer();
  /* En "Elige la bandera" el enunciado es texto y las banderas están en
     las opciones, así que hay que esperar a esas: si no, el reloj corría
     igual sobre botones vacíos. */
  startCountdownWhenReady([...box.querySelectorAll('img'), ...optsEl.querySelectorAll('img')]);
  preloadNextFlag();
}

/* ---------- El reloj no corre hasta que se ve la bandera ----------
   Antes el cronómetro arrancaba en el mismo momento en que se pedía el
   SVG: con una conexión lenta se veían caer los segundos sobre una caja
   vacía, y en nivel Dios (6s) eso se comía media ronda. Ahora se espera
   a que la imagen esté pintada.

   El tope de 3s es la red de seguridad: si el SVG no llega (sin datos,
   404), la ronda arranca igualmente en vez de quedarse colgada para
   siempre. Y `roundToken` evita que una imagen que llega tarde arranque
   el reloj de una ronda que ya no es la actual. */
let roundToken = 0;
const READY_TIMEOUT_MS = 3000;

function startCountdown() {
  clearInterval(timer);
  timer = setInterval(() => {
    tLeft = Math.max(0, +(tLeft - 0.1).toFixed(1));
    paintTimer();
    if (tLeft <= 0) timeout();
  }, 100);
}

function startCountdownWhenReady(imgs) {
  const token = ++roundToken;
  const pending = imgs.filter(img => !img.complete);
  if (!pending.length) { startCountdown(); return; }

  let left = pending.length, started = false;
  const go = () => {
    if (started || token !== roundToken) return;
    started = true;
    clearTimeout(guard);
    startCountdown();
  };
  const one = () => { if (--left <= 0) go(); };
  const guard = setTimeout(go, READY_TIMEOUT_MS);
  pending.forEach(img => {
    img.addEventListener('load', one, { once: true });
    img.addEventListener('error', one, { once: true });
  });
}

/* La bandera de la ronda siguiente se pide mientras se juega la actual,
   así que casi siempre está en caché cuando toca enseñarla. */
function preloadNextFlag() {
  const next = deck[idx + 1];
  if (next) new Image().src = flagSrc(next.code);
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
    chip.hidden = false;
    $('streakMult').textContent = 'x' + streakMultiplier(streak);
  } else {
    chip.hidden = true;
  }
  fitWhoChip();  /* el chip de racha aparece y desaparece: cambia el sitio disponible */
}

/* El nombre del jugador se muestra solo si cabe entero. Recortado a una o
   dos letras no identifica a nadie, y el avatar —que es fijo para cada
   nombre— ya cumple esa función en un marcador estrecho. */
function fitWhoChip() {
  const name = $('whoChip').querySelector('.chip__name');
  if (!name) return;
  name.hidden = false;
  if (name.scrollWidth > name.clientWidth + 1) name.hidden = true;
}
addEventListener('resize', fitWhoChip);

function updateHintButton() {
  const btn = $('btnHint');
  if (level.hints <= 0) { btn.hidden = true; return; }
  btn.hidden = false;
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
  return mode === 'pairing'
    ? t('game.factCountry', { name: countryName(answer) })
    : t('game.factCapital', { capital: countryCapital(answer) });
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
    $('feedback').textContent = wrongCount === 0 ? t('game.correctFirstTry', { pts }) : t('game.correctAfterRetry', { pts });
    $('fact').textContent = factText();
    if (wrongCount > 0) { wrongList.push(answer.code); recordWrong(answer.code); }
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
      wrongList.push(answer.code);
      recordWrong(answer.code);
      [...$('options').children].forEach(b => b.disabled = true);
      markCorrectOption();
      $('feedback').textContent = t('game.wasAnswer', { name: countryName(answer) });
      $('fact').textContent = factText();
      if (mode === 'survival') {
        setTimeout(end, 1500);
      } else {
        idx++;
        setTimeout(nextRound, 1500);
      }
      return;
    }

    $('feedback').textContent = t('game.tryAgain');
    const box = $('flagBox');
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }
}

function pick(btn, choice) { resolveRound(btn, choice.code === answer.code); }
function pickClassify(btn, continentCode) { resolveRound(btn, continentCode === answer.continent); }

function timeout() {
  clearInterval(timer); locked = true;
  buzz(140); burst('lose');
  streak = 0; updateStreakChip();
  wrongList.push(answer.code);
  recordWrong(answer.code);
  [...$('options').children].forEach(b => b.disabled = true);
  markCorrectOption();
  $('feedback').textContent = t('game.timeUp', { name: countryName(answer) });
  $('fact').textContent = factText();
  if (mode === 'survival') {
    setTimeout(end, 1600);
  } else {
    idx++;
    setTimeout(nextRound, 1600);
  }
}

/* Reproduce el modo actual (usado por "reiniciar" y "jugar otra vez"). */
function replay() { MODES[mode].start(); }

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
  show('s-mode');
});

/* ---------- Fin de partida ---------- */
function end() {
  clearInterval(timer);
  $('endScore').textContent = score;
  if (mode === 'survival') {
    const finished = idx >= deck.length;
    $('endTitle').textContent = finished ? t('end.survivalFinished') : t('end.survivalOver');
    $('endSub').textContent = idx === 1
      ? t('end.survivalSubOne', { icon: level.icon })
      : t('end.survivalSubMany', { icon: level.icon, count: idx });
  } else {
    const max = Math.round(deck.length * 100 * level.mult);
    $('endTitle').textContent = score > max * .8 ? t('end.excellent', { name: player })
      : score > max * .5 ? t('end.great', { name: player })
      : t('end.goodTry', { name: player });
    $('endSub').textContent = `${level.icon} ${t(level.labelKey)}${mode === 'daily' ? ' ' + t('end.dailyTag') : ''} · ${t('end.approxMax', { max })}`;
  }

  const list = $('endList');
  const missed = [...new Set(wrongList)];
  list.innerHTML = missed.length === 0
    ? `<div class="row row--empty">${escapeHtml(t('end.noMistakes'))}</div>`
    : `<div class="row row--empty"><b>${escapeHtml(t('end.forReview'))}</b></div>`
      + missed.map(code => `<div class="row">
            <img class="row__flag" src="${flagSrc(code)}" alt="" loading="lazy">
            <span class="row__name">${escapeHtml(countryName(code))}</span>
            <span class="row__val">🏛️ ${escapeHtml(countryCapital(code))}</span>
          </div>`).join('');

  /* Los botones de salida apuntan a pasos concretos del asistente. */
  $('btnChangeLevel').hidden = !MODES[mode]?.needsLevel;
  $('btnEndReview').hidden = wrongCodes().length < REVIEW_MIN_FAILS;

  show('s-end');

  /* El reto diario es lo único que va al servidor: su gracia es comparar
     el mismo mazo con gente que juega en otro dispositivo, y eso no se
     puede hacer en local. Todo lo demás se queda aquí. */
  if (mode === 'daily') {
    saveScore({
      player, level: levelKey, score, rounds: deck.length,
      errors: wrongList.length, daily: true, dailyDate: dailyDateStr,
    }).then(result => {
      if (result.reason === 'duplicate') $('endSub').textContent += t('end.alreadyPlayedToday');
    });
  } else if (MODES[mode]?.scoreable) {
    recordLocalScore({
      player, level: levelKey, score,
      rounds: mode === 'survival' ? idx : deck.length,
    });
  }
}

onTap($('btnAgain'), replay);
onTap($('btnChangeLevel'), () => show('s-level'));
onTap($('btnChangeMode'), () => show('s-mode'));
onTap($('btnEndReview'), () => chooseMode('review'));
onTap($('btnEndRanking'), () => { renderRanking(); show('s-ranking'); });
onTap($('btnHome'), () => show('s-who'));

/* ---------- Ranking familiar + duelo asíncrono sobre el mazo diario ---------- */
let lastDailyRanking = [];

function levelIconAndLabel(levelKeyValue) {
  const src = LEVELS[levelKeyValue] || MODE_LABELS[levelKeyValue];
  return { icon: src?.icon || '', label: src?.labelKey ? t(src.labelKey) : levelKeyValue };
}

function emptyRow(key) { return `<div class="row row--empty">${escapeHtml(t(key))}</div>`; }

async function renderRanking() {
  /* El ranking de casa es local: se pinta al instante, sin red. */
  $('rankFamily').innerHTML = localScores.length
    ? localScores.map((r, i) => {
        const { icon, label } = levelIconAndLabel(r.level);
        return `<div class="row">
          <span class="row__rank">${i + 1}</span>
          <span class="row__name">${escapeHtml(r.player)}<small>${icon} ${escapeHtml(label)}</small></span>
          <span class="row__val">${r.score} ⭐</span>
        </div>`;
      }).join('')
    : emptyRow('ranking.noFamilyScores');

  $('rankDaily').innerHTML = emptyRow('common.loading');
  $('duelResult').textContent = '';
  lastDailyRanking = (await getDailyRanking()) || [];

  /* De la tabla del reto diario solo se enseña a quien juega en este
     dispositivo. El duelo sigue pudiendo consultar a cualquiera por su
     nombre, pero la pantalla no expone la lista de desconocidos.
     Ojo: esto es una decisión de qué se muestra, no una barrera — la
     clave `anon` va en el repositorio, así que la protección de verdad
     tendría que estar en el servidor. */
  const known = new Set(players.map(p => normName(p.name)));
  const mine = lastDailyRanking.filter(r => known.has(normName(r.player)));
  $('rankDaily').innerHTML = mine.length
    ? mine.map((r, i) => `<div class="row">
        <span class="row__rank">${i + 1}</span>
        <span class="row__name">${escapeHtml(r.player)}</span>
        <span class="row__val">${r.score} ⭐</span>
      </div>`).join('')
    : emptyRow('ranking.noDailyScores');
}

onTap($('btnDuel'), () => {
  const rivalName = $('duelName').value.trim();
  const resultEl = $('duelResult');
  if (!rivalName) { resultEl.textContent = t('duel.needName'); return; }
  const mine = lastDailyRanking.find(r => normName(r.player) === normName(player || ''));
  const rival = lastDailyRanking.find(r => normName(r.player) === normName(rivalName));
  if (!mine) { resultEl.textContent = t('duel.needOwnScore'); return; }
  if (!rival) { resultEl.textContent = t('duel.rivalNoScore', { rivalName }); return; }
  if (mine.score > rival.score) resultEl.textContent = t('duel.win', { mine: mine.score, rival: rival.score });
  else if (mine.score < rival.score) resultEl.textContent = t('duel.lose', { mine: mine.score, rival: rival.score });
  else resultEl.textContent = t('duel.tie', { score: mine.score });
});

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
    if (tLeft <= 0) { clearInterval(timer); timeout(); return; }
    paintTimer();
    startCountdown();
  }
});

/* ---------- Arranque ---------- */
const lastSession = loadLast();
if (lastSession) {
  wizard.modeKey = lastSession.modeKey;
  wizard.levelKey = lastSession.levelKey || wizard.levelKey;
}
show('s-mode');
