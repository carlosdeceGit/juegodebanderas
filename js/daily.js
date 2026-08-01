/* ═══════════════════════════════════════════════════════════════════
   EL RETO DE HOY — una bandera, tapada en nueve piezas

   Sustituye al reto diario anterior (12 rondas de opción múltiple con
   cronómetro). Ahora es un único país al día, el mismo para todo el
   mundo: la bandera empieza tapada con nueve piezas y solo se ve una.
   Cada fallo destapa una pieza más, y al terminar se ve entera.

   Por qué este formato y no el anterior: el reto diario solo tiene
   gracia si es *comparable* y da conversación ("¿por dónde ibas tú?").
   Doce rondas cronometradas medían sobre todo la velocidad de tocar la
   pantalla y no dejaban nada que contar; una sola bandera al día se
   juega en un minuto, se puede compartir el resultado sin destriparlo y
   admite escribir el país en vez de elegir entre opciones, que es
   bastante más difícil y más satisfactorio.

   Diferencias deliberadas con el resto de modos:
   - No hay cronómetro. Aquí se piensa, no se corre.
   - Se escribe el nombre del país (con sugerencias), no se elige.
   - Un solo intento al día por jugador, y el estado se guarda: cerrar
     la pestaña y volver no regala intentos nuevos.
   ═══════════════════════════════════════════════════════════════════ */

import { COUNTRIES } from "./countries.js";
import { DAILY_LEVEL_KEY } from "./levels.js";
import { saveScore } from "./db.js";
import { describeFlag } from "./flagDescription.js";
import { distanceKm, direction, proximity } from "./geo.js";
import { $, escapeHtml, onTap, normText } from "./dom.js";
import { lsGetJSON, lsSetJSON } from "./storage.js";
import { t, countryName, countryCapital, continentName, getLocale } from "./i18n.js";

const TILES = 9;        /* 3 × 3 */
const ATTEMPTS = 6;
const SUGGESTIONS = 6;

/* 300 puntos si se acierta a la primera y 40 menos por cada fallo, así
   que el peor acierto (a la sexta) todavía da 100. La cota importa: la
   política de la tabla `games` solo admite del reto diario un `score`
   de hasta `rounds * 320`, y aquí `rounds` es 1 — ver saveDailyScore. */
const WIN_SCORE = 300;
const SCORE_STEP = 40;

/* ---------- PRNG determinista: el mismo reto para todo el mundo ---------- */
function seedFrom(str) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) | 0;
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
   docs/decisiones-producto.md — es lo que mantiene un único reto diario
   comparable entre todos los jugadores. */
function todayStr() { return new Date().toISOString().slice(0, 10); }
function dayNumber(dateStr) { return Math.floor(Date.parse(`${dateStr}T00:00:00Z`) / 86400000); }

/* La bandera del día sale de barajar el catálogo entero y recorrerlo en
   orden, no de sortear un país cada día: así no puede repetirse ninguna
   bandera hasta que hayan salido las 195. Cada vuelta completa se
   baraja distinto, para que el segundo ciclo no repita el orden del
   primero. */
const GUARD = 20;

/* Se baraja siempre partiendo del catálogo ordenado por código ISO, no
   del orden en que estén escritos los países en countries.js: ese
   archivo se regenera de vez en cuando y, si el sorteo dependiera de su
   orden, reordenarlo cambiaría el reto de todo el mundo de golpe. */
const BY_CODE = [...COUNTRIES].sort((a, b) => (a.code < b.code ? -1 : 1));

/* El orden de una vuelta, con la costura entre vueltas arreglada.

   Sin esto, la garantía de "no se repite hasta que salgan las 195" solo
   valía dentro de una misma vuelta: una bandera que salía al final de
   una podía volver a salir a los pocos días, al principio de la
   siguiente (medido: hasta cinco días después). Se empujan hacia el
   fondo del orden nuevo las últimas GUARD de la vuelta anterior, lo que
   deja al menos 21 días entre repeticiones también en la costura. Es
   determinista: cualquier dispositivo calcula lo mismo para la misma
   fecha, que es lo único que el reto necesita. */
function cycleOrder(cycle) {
  const shuffleFor = c => seededShuffle(BY_CODE, mulberry32(seedFrom(`dcb-daily-${c}`)));
  const order = shuffleFor(cycle);
  if (cycle <= 0) return order;

  const recent = new Set(shuffleFor(cycle - 1).slice(-GUARD).map(c => c.code));
  for (let i = 0; i < GUARD; i++) {
    if (!recent.has(order[i].code)) continue;
    for (let j = GUARD; j < order.length; j++) {
      if (recent.has(order[j].code)) continue;
      [order[i], order[j]] = [order[j], order[i]];
      break;
    }
  }
  return order;
}

export function flagOfTheDay(dateStr) {
  const n = dayNumber(dateStr);
  const size = COUNTRIES.length;
  const cycle = Math.floor(n / size);
  return cycleOrder(cycle)[((n % size) + size) % size];
}

/* Números y fechas se escriben como toque en el idioma activo: el
   separador de miles no es el mismo en 9.704 y en 9,704, y una fecha
   numérica tampoco se ordena igual en todas partes. */
function formatKm(km) { return km.toLocaleString(getLocale()); }
function prettyDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(getLocale(), { timeZone: 'UTC' });
}

/* Qué pieza se destapa con cada fallo. También va sembrado por la fecha:
   si el orden fuese fijo, la primera pieza visible sería siempre la
   misma esquina y el reto se volvería reconocible por costumbre. */
function tileOrder(dateStr) {
  return seededShuffle([...Array(TILES).keys()], mulberry32(seedFrom(`tiles-${dateStr}`)));
}

/* ---------- Estado guardado: un intento al día y por jugador ---------- */
/* Se guarda el día entero de una vez (`{ date, players }`) y se tira
   cuando cambia la fecha: así no hace falta limpiar nada y el
   almacenamiento no crece con los días.

   Los jugadores se distinguen igual que en el resto del juego —
   minúsculas y sin espacios sobrantes, pero con las tildes intactas—
   para que coincida con el índice único del servidor
   (`lower(trim(player))`) y no haya un jugador aquí que sean dos allí. */
const DAILY_KEY = 'dcb_daily_v2';
const playerKey = name => String(name).trim().toLowerCase();

function loadDay(dateStr) {
  const raw = lsGetJSON(DAILY_KEY);
  if (raw && raw.date === dateStr && raw.players) return raw;
  return { date: dateStr, players: {} };
}
function loadProgress(dateStr, playerName) {
  const day = loadDay(dateStr);
  const entry = day.players[playerKey(playerName)];
  if (entry && Array.isArray(entry.guesses)) return entry;
  return { guesses: [], done: false, won: false, saved: false };
}
function saveProgress(dateStr, playerName, entry) {
  const day = loadDay(dateStr);
  day.players[playerKey(playerName)] = entry;
  lsSetJSON(DAILY_KEY, day);
}

/* ═══════════════════════════════════════════════════════════════════
   La pantalla

   Todo lo que este módulo no sabe hacer se lo pasa quien lo crea
   (js/game.js): navegar entre pantallas (`show`), las dos salidas de la
   pantalla (`onExit`, `onRanking`), el avatar de un jugador
   (`avatarFor`) y qué hacer con la bandera cuando el reto termina
   (`onFinish`), que es donde vive la memoria de banderas vistas y
   falladas. Este módulo solo se ocupa del juego en sí.
   ═══════════════════════════════════════════════════════════════════ */
export function createDailyChallenge({ show, onExit, onRanking, avatarFor, onFinish }) {
  let dateStr = todayStr();
  let answer = null;
  let order = [];
  let player = null;
  let guesses = [];      /* códigos de país, en orden de intento */
  let done = false, won = false, saved = false;

  const byCode = new Map(COUNTRIES.map(c => [c.code, c]));

  /* ---------- Piezas de la bandera ---------- */
  /* Se ve una pieza de salida y una más por cada fallo; al terminar, la
     bandera entera. */
  function openTiles() {
    if (done) return TILES;
    return Math.min(TILES, 1 + guesses.length);
  }

  function renderGrid() {
    const grid = $('dailyGrid');
    const open = openTiles();
    const visible = new Set(order.slice(0, open));

    if (grid.dataset.code !== answer.code) {
      grid.dataset.code = answer.code;
      grid.innerHTML = `<img class="fgrid__flag" src="assets/flags/${answer.code}.svg" alt="">`
        + [...Array(TILES).keys()].map(i => `<i class="fgrid__cover" data-tile="${i}"></i>`).join('');
    }
    grid.querySelectorAll('.fgrid__cover').forEach(cover => {
      cover.classList.toggle('is-open', visible.has(+cover.dataset.tile));
    });
    /* Con la bandera tapada, describirla en voz alta destriparía el
       juego: hasta que termina, lo único que se anuncia es cuánto se ha
       destapado. */
    grid.setAttribute('aria-label', done
      ? t('daily.gridSolved', { flag: describeFlag(answer) })
      : t('daily.gridHidden', { open, total: TILES }));
  }

  /* Quién juega y qué día es. El avatar lo pone quien nos crea, que es
     donde vive la lista de jugadores. */
  function renderMeta() {
    $('dailyMeta').textContent = `${avatarFor(player)} ${player} · ${prettyDate(dateStr)}`;
  }

  /* ---------- Lista de intentos ---------- */
  function guessRow(code) {
    const c = byCode.get(code);
    if (code === answer.code) {
      return `<div class="guess guess--hit">
        <span class="guess__name">🎯 ${escapeHtml(countryName(c))}</span>
        <span class="guess__val">${escapeHtml(t('daily.gotIt'))}</span>
      </div>`;
    }
    const km = distanceKm(c, answer);
    const dir = direction(c, answer);
    return `<div class="guess">
      <span class="guess__name">${escapeHtml(countryName(c))}</span>
      <span class="guess__val">${formatKm(km)} km</span>
      <span class="guess__val" role="img" aria-label="${escapeHtml(t('daily.towards', { dir: t(`daily.dir.${dir.key}`) }))}">${dir.arrow}</span>
      <span class="guess__val">${proximity(km)}%</span>
    </div>`;
  }

  function renderGuesses() {
    const host = $('dailyGuesses');
    const rows = guesses.map(guessRow);
    /* Los huecos que quedan solo se pintan mientras se juega: enseñan
       cuántos intentos quedan. Terminado el reto ya no informan de nada
       y solo separan el resultado de la lista. */
    for (let i = guesses.length; i < ATTEMPTS && !done; i++) {
      const isNext = i === guesses.length;
      rows.push(`<div class="guess guess--empty${isNext ? ' guess--next' : ''}">${
        isNext ? escapeHtml(t('daily.attempt', { n: i + 1, total: ATTEMPTS })) : ''
      }</div>`);
    }
    host.innerHTML = rows.join('');
  }

  /* ---------- Sugerencias mientras se escribe ---------- */
  /* Escribir "República Democrática del Congo" entero en un móvil no es
     un reto de banderas, es un reto de teclado. Las sugerencias evitan
     además que un fallo de tecleo se coma un intento. */
  function matches(query) {
    const q = normText(query);
    if (!q) return [];
    const already = new Set(guesses);
    const pool = COUNTRIES.filter(c => !already.has(c.code));
    const starts = pool.filter(c => normText(countryName(c)).startsWith(q));
    const inside = pool.filter(c => !normText(countryName(c)).startsWith(q) && normText(countryName(c)).includes(q));
    return [...starts, ...inside].slice(0, SUGGESTIONS);
  }

  function renderSuggestions() {
    const host = $('dailySuggest');
    if (done) { host.hidden = true; return; }
    const list = matches($('dailyInput').value);
    host.innerHTML = list.map(c => `<li><button type="button" class="suggest__item" data-code="${c.code}">${escapeHtml(countryName(c))}</button></li>`).join('');
    host.hidden = !list.length;
    host.querySelectorAll('.suggest__item').forEach(b => {
      onTap(b, () => submitGuess(byCode.get(b.dataset.code)));
    });
  }

  function hideSuggestions() { $('dailySuggest').hidden = true; }

  /* ---------- Intentar ---------- */
  function resolveTyped(text) {
    const q = normText(text);
    if (!q) return null;
    return COUNTRIES.find(c => normText(countryName(c)) === q) || matches(text)[0] || null;
  }

  function submitGuess(country) {
    if (done || !country) return;
    if (guesses.includes(country.code)) {
      say(t('daily.alreadyTried', { name: countryName(country) }));
      return;
    }
    guesses.push(country.code);
    $('dailyInput').value = '';
    hideSuggestions();

    if (country.code === answer.code) finish(true);
    else if (guesses.length >= ATTEMPTS) finish(false);
    else {
      const km = distanceKm(country, answer);
      say(t('daily.miss', { name: countryName(country), km: formatKm(km), pct: proximity(km) }));
      persist();
      renderGrid();
      renderGuesses();
    }
  }

  function tryTyped() {
    const text = $('dailyInput').value;
    if (!normText(text)) { say(t('daily.typeSomething')); return; }
    const country = resolveTyped(text);
    if (!country) { say(t('daily.unknown', { text: text.trim() })); return; }
    submitGuess(country);
  }

  function say(msg) { $('dailyFeedback').textContent = msg; }

  /* ---------- Final ---------- */
  function scoreFor() {
    return won ? Math.max(0, WIN_SCORE - (guesses.length - 1) * SCORE_STEP) : 0;
  }

  function winMessage() {
    if (!won) return t('daily.lose');
    return guesses.length === 1 ? t('daily.winOne') : t('daily.win', { n: guesses.length });
  }

  function finish(didWin) {
    done = true; won = didWin;
    persist();
    renderGrid();
    renderGuesses();
    renderResult();
    say(winMessage());
    saveDailyScore();
    /* El reto también enseña banderas: la del día acaba de verse entera,
       con su nombre y su capital. Que cuente en el progreso y, si no se
       ha sacado, en el repaso de fallos. */
    onFinish?.({ code: answer.code, won });
  }

  function persist() {
    saveProgress(dateStr, player, { guesses, done, won, saved });
  }

  /* La puntuación del reto diario es lo único que sale del dispositivo,
     porque su gracia es comparar el mismo reto con quien juega en otro
     sitio. Se manda como una única "ronda" (una bandera, un reto), que
     es además lo que hace que encaje en la validación del servidor:
     `score <= rounds * 200 * 1.6` con rounds = 1 deja el techo en 320 y
     el máximo posible aquí son 300. */
  function saveDailyScore() {
    if (saved) return;
    saveScore({
      player, level: DAILY_LEVEL_KEY, score: scoreFor(), rounds: 1,
      errors: won ? 0 : 1, daily: true, dailyDate: dateStr,
    }).then(result => {
      /* Solo se da por guardada si el servidor la aceptó (o ya la tenía).
         Sin esto, quien termina el reto sin cobertura perdía su
         puntuación para siempre; así el siguiente intento de abrir el
         reto ese mismo día la vuelve a mandar. */
      if (!result.ok && result.reason !== 'duplicate') return;
      saved = true;
      persist();
      if (result.reason === 'duplicate') {
        $('dailyResultNote').textContent = t('daily.alreadyPlayedToday');
      }
    });
  }

  function renderResult() {
    $('dailyForm').hidden = done;
    $('dailyResult').hidden = !done;
    if (!done) return;
    $('dailyResultTitle').textContent = won
      ? t('daily.resultWin', { n: guesses.length, total: ATTEMPTS })
      : t('daily.resultLose');
    $('dailyResultFlag').textContent =
      `${countryName(answer)} · 🏛️ ${countryCapital(answer)} · ${continentName(answer.continent)}`;
    $('dailyResultScore').textContent = t('daily.scoreLine', { score: scoreFor() });
    $('dailyResultNote').textContent = '';
  }

  /* ---------- Compartir ---------- */
  /* Sin decir cuál era la bandera: el resultado se comparte con gente
     que todavía no ha jugado el reto de hoy. */
  function shareText() {
    const squares = guesses.map(code => code === answer.code ? '🟩' : '🟥').join('');
    const tally = won ? `${guesses.length}/${ATTEMPTS}` : `X/${ATTEMPTS}`;
    return `${t('daily.shareTitle', { date: prettyDate(dateStr) })}\n${squares} ${tally} · ${scoreFor()} ⭐`;
  }

  async function share() {
    const text = shareText();
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      $('dailyResultNote').textContent = t('daily.copied');
    } catch {
      /* Sin permiso de portapapeles ni hoja de compartir (o cancelada):
         se enseña el texto para copiarlo a mano en vez de fallar en
         silencio. */
      $('dailyResultNote').textContent = text;
    }
  }

  /* Repinta lo que ya hay, sin tocar el estado del reto. Lo llama
     js/game.js al cambiar de idioma: los nombres de país de los
     intentos ya hechos, las distancias y el mensaje están en el idioma
     con el que se jugaron y hay que rehacerlos en el nuevo. */
  function repaint() {
    if (!answer) return;
    renderMeta();
    renderGrid();
    renderGuesses();
    renderSuggestions();
    renderResult();
    say(done ? winMessage() : t('daily.howTo'));
  }

  /* ---------- Arranque ---------- */
  function start(playerName) {
    player = playerName;
    dateStr = todayStr();
    answer = flagOfTheDay(dateStr);
    order = tileOrder(dateStr);

    const saved0 = loadProgress(dateStr, player);
    guesses = saved0.guesses.filter(code => byCode.has(code));
    done = !!saved0.done;
    won = !!saved0.won;
    saved = !!saved0.saved;

    renderMeta();
    $('dailyInput').value = '';
    hideSuggestions();
    renderGrid();
    renderGuesses();
    renderResult();
    say(done ? winMessage() : t('daily.howTo'));
    show('s-daily');
    /* El foco automático solo con ratón o teclado: en un móvil abriría
       el teclado encima de la bandera nada más entrar, justo cuando lo
       que hay que hacer es mirarla. */
    if (!done && matchMedia('(pointer:fine)').matches) $('dailyInput').focus({ preventScroll: true });
    /* Reintento de la puntuación que se quedó sin mandar (sin cobertura
       al terminar, servidor pausado…). */
    if (done && !saved) saveDailyScore();
  }

  /* ---------- Cableado de la pantalla (una sola vez) ---------- */
  onTap($('btnDailyGuess'), tryTyped);
  onTap($('btnDailyShare'), share);
  onTap($('btnDailyBack'), onExit);
  onTap($('btnDailyHome'), onExit);
  onTap($('btnDailyRanking'), onRanking);
  $('dailyInput').addEventListener('input', renderSuggestions);
  $('dailyInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); tryTyped(); }
    if (e.key === 'Escape') hideSuggestions();
  });
  /* El desplegable se cierra al tocar fuera, pero no al tocar dentro:
     `blur` a secas se dispararía antes del `click` en una sugerencia y
     se la comería. */
  document.addEventListener('click', e => {
    if (!e.target.closest('.combo')) hideSuggestions();
  });

  return { start, repaint };
}
