/* Español — idioma de referencia.

   Cada idioma del juego es un archivo como este: las cadenas de la interfaz
   (`ui`), los nombres de los continentes, el vocabulario con el que se
   describe una bandera a un lector de pantalla (`flag`) y, importados del
   archivo generado de al lado, los nombres de país y capitales.

   El español es el original: si una clave nueva aparece aquí, tiene que
   aparecer en los otros cinco archivos. `npm test` no existe en este
   proyecto, pero tools/check-i18n.mjs comprueba exactamente eso. */

import { NAMES } from "./names.es.js";

export default {
  code: "es",

  continents: { af: "África", am: "América", as: "Asia", eu: "Europa", oc: "Oceanía" },

  ui: {
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
    "modes.daily.tagline": "Las mismas banderas para toda la familia",
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
    "settings.language": "🌍 Idioma",
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
    "end.dailyTag": "· Reto diario 🔥",
    "end.survivalFinished": "¡Las viste todas! 🌍🏆",
    "end.survivalOver": "💥 ¡Racha terminada!",
    "end.survivalSubOne": "{icon} Supervivencia · sobreviviste 1 ronda",
    "end.survivalSubMany": "{icon} Supervivencia · sobreviviste {count} rondas",
    "end.noMistakes": "Ni un solo fallo. Impresionante. 🌟",
    "end.forReview": "Para repasar",
    "end.alreadyPlayedToday": " · Ya jugaste hoy: este intento no cuenta para el ranking",
    "end.playAgain": "🔄 Otra vez",
    "end.changeLevel": "🧠 Cambiar de nivel",
    "end.changeMode": "🏳️ Otro juego",
    "end.reviewThese": "🔁 Repasar fallos",
    "end.changePlayer": "Cambiar de jugador",

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

  /* Vocabulario de la descripción accesible de una bandera. Describe la
     bandera sin nombrar el país: es la alternativa no visual al mismo
     puzzle, no la solución. Ver js/flagDescription.js. */
  flag: {
    sentence: "Bandera con {shapes}, en {colors}.",
    fallback: "un diseño de bandera",
    and: " y ",
    colors: {
      black: "negro", blue: "azul", gold: "dorado", green: "verde",
      maroon: "granate", orange: "naranja", red: "rojo", white: "blanco", yellow: "amarillo",
    },
    specials: {
      unionJack: "la Union Jack en una esquina",
      starOfDavid: "una estrella de David",
      southernCross: "estrellas y una cruz austral en una esquina",
      taegeuk: "un círculo con curvas enlazadas, tipo yin-yang",
      nordicCross: "una cruz descentrada hacia el asta (estilo nórdico)",
    },
    tokens: {
      arrowhead: "una punta de flecha", band: "una banda de color", bicolor: "dos colores",
      bird: "un ave", block: "bloques de color", border: "un borde de color",
      canton: "un recuadro en una esquina", carpet: "un patrón repetido",
      center: "un elemento centrado", circle: "un círculo", complex: "un diseño elaborado",
      crescent: "una media luna", cross: "una cruz", crown: "una corona",
      diagonal: "una diagonal", diamonds: "rombos", disc: "un disco",
      double: "un elemento doble", dragon: "un dragón", eagle: "un águila",
      emblem: "un emblema central", globe: "un globo terráqueo",
      hoist: "un detalle junto al asta", horizontal: "franjas horizontales",
      leaf: "una hoja", lion: "un león", map: "un mapa", mixed: "un diseño mixto",
      multi: "varios colores", nutmeg: "una semilla de nuez moscada",
      other: "", outline: "un contorno", pattern: "un patrón decorativo",
      pennant: "forma de banderín, no rectangular", plain: "un fondo liso",
      quartered: "cuatro cuadrantes", rays: "rayos", rectangle: "un rectángulo central",
      red: "", saltire: "una cruz en aspa (diagonal)", serrated: "un borde dentado",
      shield: "un escudo", single: "un único elemento", star: "una estrella",
      stars: "varias estrellas", stripe: "una franja", stripes: "franjas",
      sun: "un sol", text: "texto o escritura", trapezoid: "un trapecio",
      tree: "un árbol", triangle: "un triángulo", tricolor: "tres colores",
      trident: "un tridente", vertical: "franjas verticales", wheel: "una rueda",
      y: "una forma en Y",
    },
  },

  names: NAMES,
};
