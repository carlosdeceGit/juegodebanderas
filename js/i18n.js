/* Diccionario de cadenas de la interfaz (Fase 4 de la auditoría).
   Hoy solo existe "es": el juego sigue siendo 100% español, esto es la
   infraestructura para que añadir un idioma nuevo sea solo rellenar un
   objeto más aquí, sin tocar la lógica del juego. No se traduce el
   contenido (nombres de país, capitales, continentes en countries.js),
   solo la interfaz: eso necesitaría datos traducidos aparte, algo fuera
   del alcance de esta fase. */

const STRINGS = {
  es: {
    "app.title": "Diversión con Banderas",

    "start.eyebrow": "El gran juego de banderas",
    "start.titleHtml": "Diversión con<br>Banderas",
    "start.who": "¿Cómo te llamas?",
    "start.namePlaceholder": "Escribe tu nombre",

    /* ---- Asistente de tres pasos ---- */
    "wizard.step": "Paso {n} de {total}",
    "wizard.backToStep": "Volver al paso {n}",
    "wizard.continue": "Seguir jugando",
    "wizard.moreGames": "Más juegos",
    "wizard.noPressure": "Sin prisa y sin puntos",
    "wizard.pickLevel": "Elige tu nivel",
    "wizard.pickScope": "¿Con qué banderas?",
    "wizard.whoPlays": "¿Quién juega?",
    "wizard.letsGo": "¡Vamos!",
    "wizard.playedLast": "Jugó la última",
    "wizard.someoneNew": "Alguien nuevo",
    "wizard.needName": "Escribe un nombre para poder guardar tus puntos.",
    "wizard.nameTaken": 'Ya hay un "{name}". Toca su ficha o usa otro nombre.',
    "wizard.namesArePrivate": "Estos nombres se guardan solo en este dispositivo.",
    "wizard.backToModes": "← Otro juego",
    "wizard.backToLevels": "← Nivel",

    /* ---- Catálogo de modos ---- */
    "modes.scoresHint": "Cuenta para el ranking",
    "modes.classic.label": "¿Qué bandera es?",
    "modes.classic.tagline": "Ves una bandera y dices el país",
    "modes.invert.label": "Elige la bandera",
    "modes.invert.tagline": "Te decimos el país, tú tocas su bandera",
    "modes.pairing.label": "Bandera y capital",
    "modes.pairing.tagline": "La bandera, y su ciudad más importante",
    "modes.classify.label": "Por continente",
    "modes.classify.tagline": "Adivina en qué continente está",
    "modes.survival.label": "Supervivencia",
    "modes.survival.tagline": "Una sola vida, y cada acierto aprieta más",
    "modes.daily.label": "El reto de hoy",
    "modes.daily.tagline": "Una bandera tapada, la misma para todo el mundo",
    "modes.review.label": "Repasa tus fallos",
    "modes.review.tagline": "Solo las que se te resisten",
    "modes.review.count": "Solo las {count} que se te resisten",
    "modes.learn.label": "Aprender banderas",
    "modes.learn.tagline": "Míralas todas, tranquilamente",

    /* ---- Niveles ---- */
    "level.continent": "Continente",
    "level.continentAll": "🌍 Todas",
    "level.scopeAll": "Las {count} banderas del mundo.",
    "level.scopeCount": "{scope}: {count} banderas.",
    "level.tag": "{tagline} · {rounds} rondas · {secs}s",

    "level.nene.label": "Nivel Nene",
    "level.nene.tagline": "Para empezar, con calma",
    "level.principiante.label": "Nivel Principiante",
    "level.principiante.tagline": "Ya conoces unas cuantas",
    "level.experto.label": "Nivel Experto",
    "level.experto.tagline": "Un fallo y se acaba la ronda",
    "level.dios.label": "Nivel Dios",
    "level.dios.tagline": "Banderas casi gemelas, tiempo mínimo",
    "level.review.label": "Repasa tus fallos",
    "level.invert.label": "Elige la bandera",
    "level.classify.label": "Clasifica por continente",
    "level.pairing.label": "Bandera y capital",
    "level.survival.label": "Supervivencia",

    /* ---- Ajustes ---- */
    "settings.title": "Ajustes",
    "settings.short": "⚙️ Ajustes",
    "settings.textSize": "🔠 Tamaño del texto",
    "settings.players": "👤 Jugadores de este dispositivo",
    "settings.noPlayers": "Todavía no juega nadie aquí.",
    "settings.close": "Cerrar",

    "nav.ranking": "🏆 Ranking de casa",
    "nav.rankingShort": "🏆 Ranking",
    "nav.back": "↩ Volver",
    "nav.menu": "Menú",

    "game.chooseOne": "Elige una",
    "game.scoreLabel": "Puntos",
    "game.roundLabel": "Ronda",
    "game.correctFirstTry": "¡Muy bien! +{pts} ⭐",
    "game.correctAfterRetry": "¡Esa es! +{pts} ⭐",
    "game.wasAnswer": "Era {name}",
    "game.tryAgain": "Casi… prueba otra 🤔",
    "game.timeUp": "Se acabó el tiempo: {name}",
    "game.factCapital": "🏛️ Capital: {capital}",
    "game.factCountry": "🏳️ País: {name}",
    "game.hint": "💡 Pista",
    "game.menuTitle": "Menú",
    "game.restart": "🔄 Reiniciar partida",
    "game.quit": "🚪 Terminar partida",
    "game.resume": "Seguir jugando",

    "end.excellent": "¡Increíble, {name}! 🏆",
    "end.great": "¡Muy bien, {name}! 🎉",
    "end.goodTry": "¡Buen intento, {name}! 💪",
    "end.approxMax": "aprox. de {max} puntos posibles",
    "end.survivalFinished": "¡Las viste todas! 🌍🏆",
    "end.survivalOver": "💥 ¡Racha terminada!",
    "end.survivalSubOne": "{icon} Supervivencia · sobreviviste 1 ronda",
    "end.survivalSubMany": "{icon} Supervivencia · sobreviviste {count} rondas",
    "end.noMistakes": "Ni un solo fallo. Impresionante. 🌟",
    "end.forReview": "Para repasar",
    "end.playAgain": "🔄 Otra vez",
    "end.changeLevel": "🧠 Cambiar de nivel",
    "end.changeMode": "🏳️ Otro juego",
    "end.reviewThese": "🔁 Repasar fallos",
    "end.changePlayer": "Cambiar de jugador",

    /* ---- El reto de hoy: una bandera tapada en nueve piezas ---- */
    "daily.title": "🔥 El reto de hoy",
    "daily.howTo": "Solo se ve una pieza. Cada fallo destapa otra.",
    "daily.placeholder": "País…",
    "daily.inputLabel": "Escribe el nombre de un país",
    "daily.suggestLabel": "Países sugeridos",
    "daily.guess": "🌍 Adivinar",
    "daily.attempt": "Intento {n} de {total}",
    "daily.gridHidden": "Bandera tapada: {open} de {total} piezas descubiertas",
    "daily.gridSolved": "Bandera del día, ya descubierta: {flag}",
    "daily.gotIt": "¡Esa es!",
    "daily.towards": "hacia el {dir}",
    "daily.miss": "{name} no es: te quedas a {km} km ({pct}%).",
    "daily.alreadyTried": "Ya has probado con {name}. Prueba otro país.",
    "daily.typeSomething": "Escribe el nombre de un país.",
    "daily.unknown": "No encuentro ningún país que se llame «{text}».",
    "daily.win": "¡Esa es! 🎉 La has sacado en {n} intentos.",
    "daily.winOne": "¡Esa es! 🤯 ¡A la primera!",
    "daily.lose": "Se acabaron los intentos. Mañana hay otra.",
    "daily.resultWin": "¡Acertada en {n}/{total}! 🎉",
    "daily.resultLose": "Hoy no ha podido ser 💪",
    "daily.scoreLine": "{score} ⭐ para el ranking de hoy",
    "daily.share": "📋 Compartir resultado",
    "daily.shareTitle": "Diversión con Banderas 🔥 Reto del {date}",
    "daily.copied": "Copiado. ¡Pégalo donde quieras!",
    "daily.alreadyPlayedToday": "Ya jugaste el reto de hoy: este intento no cuenta para el ranking.",

    "learn.title": "📖 Aprender banderas",
    "learn.sub": "Sin cronómetro ni puntuación",
    "learn.flagAlt": "Bandera de {name}",

    "ranking.dailyTitle": "🔥 Reto diario de hoy",
    "ranking.homeNote": "Las mejores marcas de este dispositivo. Estos nombres no salen de aquí.",
    "ranking.dailyNote": "Solo se muestra a quien juega en este dispositivo.",
    "ranking.noFamilyScores": "Aún no hay marcas. Juega una partida y aparecerás aquí.",
    "ranking.noDailyScores": "Nadie de esta casa ha hecho el reto de hoy todavía.",
    "duel.title": "⚔️ Duelo",
    "duel.sub": "Compara tu reto de hoy con alguien a quien conoces.",
    "duel.rivalPlaceholder": "Nombre del rival",
    "duel.button": "⚔️ Duelo",
    "duel.needName": "Escribe el nombre de tu rival.",
    "duel.needOwnScore": "Aún no has jugado el reto de hoy.",
    "duel.rivalNoScore": "{rivalName} no ha jugado el reto de hoy todavía.",
    "duel.win": "¡Le ganas! {mine} ⭐ vs {rival} ⭐",
    "duel.lose": "Te gana. {mine} ⭐ vs {rival} ⭐",
    "duel.tie": "¡Empate! {score} ⭐ los dos",

    "common.loading": "Cargando…",
    "progress.seenFlags": "{learned}/{total} banderas vistas",
    "error.generic": "Algo ha ido mal. Intenta recargar la página.",
  },
};

const LOCALE = "es"; // único idioma disponible hoy; ver docs/decisiones-producto.md

export function t(key, vars) {
  let str = STRINGS[LOCALE]?.[key];
  if (str === undefined) return key;
  if (vars) for (const k in vars) str = str.replaceAll(`{${k}}`, vars[k]);
  return str;
}

/* Aplica las cadenas estáticas del HTML (data-i18n / data-i18n-html /
   data-i18n-placeholder / data-i18n-aria-label) una vez al cargar. */
export function applyStaticI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll("[data-i18n-aria-label]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel)); });
  document.title = t("app.title");
}
