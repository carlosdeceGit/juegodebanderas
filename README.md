# Diversión con Banderas

Juego web de "adivina el país por su bandera", en español, pensado
originalmente como juego familiar. HTML + CSS + JavaScript **vanilla**
(módulos ES nativos), sin build, sin framework, sin dependencias npm.
Persistencia opcional en Supabase para rankings; el juego funciona
igual de bien sin conexión (solo se pierde el ranking).

Este documento es la referencia técnica del proyecto: qué hay, cómo
funciona y qué tener en cuenta antes de tocarlo. Para el historial de
por qué se tomó cada decisión, ver `docs/auditoria-juegodebanderas.md`
(la auditoría original) y `docs/decisiones-producto.md` (decisiones de
producto explícitas: fecha del reto diario, criterio de países,
evaluación del ranking global).

## Cómo ejecutarlo

Es un sitio estático puro. Cualquier servidor HTTP sirve:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000/index.html
```

No hace falta `npm install` ni build de ningún tipo. Al abrir el
`index.html` directamente desde el sistema de archivos (`file://`) los
módulos ES pueden fallar por CORS en algunos navegadores; usar un
servidor local evita ese problema.

## Estructura del repositorio

```
index.html                  Las 6 pantallas del juego (marcado, sin lógica)
style.css                   Todo el CSS (sin preprocesador)
js/
  game.js                   Estado del juego, bucle de ronda, todos los modos
  countries.js              Datos de los 195 países (nombre, capital, continente,
                             y etiquetas pattern/palette para calcular distractores)
  levels.js                 Configuración declarativa de los 4 niveles clásicos
  distractors.js            Algoritmo de similitud para elegir opciones incorrectas
  confusables.js            Lista curada a mano de banderas clásicamente confundibles
  flagDescription.js        Genera la descripción accesible (no reveladora) de cada bandera
  i18n.js                   Diccionario de cadenas de la interfaz (solo "es" por ahora)
  db.js                     Cliente REST directo contra Supabase (sin SDK)
assets/flags/                196 SVG (proyecto flag-icons, MIT) + LICENSE-flag-icons.txt
supabase/migrations/         Esquema y políticas RLS de la base de datos, versionados
docs/decisiones-producto.md   Decisiones de producto explícitas (fecha UTC, países, ranking global)
docs/auditoria-juegodebanderas.md  Auditoría original y roadmap por fases (histórico)
```

No hay carpeta de tests, ni linter, ni CI configurados. Ver
"Cómo probar cambios" más abajo para cómo se ha verificado cada cambio
hasta ahora.

## Cómo está montada la interfaz

`index.html` define 6 `<section class="screen">` (una por pantalla:
inicio, nivel, partida, fin, aprender, ranking) más el overlay del
menú de partida. Solo una tiene la clase `.on` a la vez; `game.js`
las alterna con la función `show(id)`. No hay routing ni historial:
todo vive en una sola página.

Todo el texto de la interfaz está en `js/i18n.js`, no hardcodeado en
el HTML ni en el JS — ver la sección "Internacionalización" más abajo.

## El bucle de juego

Por cada ronda: se elige una bandera de un mazo (`deck`), se generan
opciones (la correcta + distractores), corre un temporizador, y al
elegir se calcula la puntuación y se muestra la capital como dato
educativo. El bucle es el mismo objeto compartido (`js/game.js`) para
**todos** los modos; lo que cambia entre modos es cómo se construye el
mazo, qué se muestra como pregunta/opciones, y qué cuenta como acierto.
Esto se controla con una única variable de estado, `mode`:

```
'classic' | 'daily' | 'review' | 'survival' | 'invert' | 'classify' | 'pairing'
```

Casi toda la lógica de ronda (`nextRound`, `resolveRound`, `timeout`,
`end`) hace `if (mode === '...')` en los puntos donde un modo concreto
necesita comportarse distinto; el resto del bucle es compartido.

### Modos de juego

| Modo | Cómo se juega | Mazo | ¿Cuenta para el ranking? |
|---|---|---|---|
| **Clásico** (4 niveles: Nene, Principiante, Experto, Dios) | Bandera → elegir el nombre del país | `buildDeck()`, prioriza banderas menos vistas, respeta el filtro de continente | Sí (`best_scores`) |
| **Reto diario** (`btnDaily`) | Igual que Experto, pero con semilla determinista por fecha (mismo mazo para todo el mundo el mismo día) | `buildDailyDeck()`, ignora el filtro de continente | Sí, máx. 1 intento/jugador/día (`daily_ranking`) |
| **Aprender** (`btnLearn`) | Lista navegable de banderas con nombre/capital/continente | Todas (o filtradas por continente), sin cronómetro ni puntuación | No |
| **Repasa tus fallos** (`btnReview`, solo visible con ≥3 fallos históricos) | Igual que Clásico, pero el mazo son las banderas más falladas | Ordenado por nº de fallos; acertar una la quita del historial | No |
| **Elige la bandera** (`btnInvert`) | Se invierte el sentido: se muestra el nombre y hay que tocar la bandera | Reutiliza `pickDistractors` | No |
| **Clasifica por continente** (`btnClassify`) | Bandera → elegir el continente entre 5 opciones fijas | — | No |
| **Bandera y capital** (`btnPairing`) | Igual que Clásico, pero las opciones son capitales | — | No |
| **Supervivencia** (`btnSurvival`) | Una sola vida; el tiempo baja, las opciones suben y los distractores se endurecen con cada acierto (`survivalParamsForRound`) | Las 195 banderas, mezcladas | Sí, como nivel `survival` |

Los 4 niveles clásicos están definidos declarativamente en
`js/levels.js` (rondas, segundos, nº de opciones, modo de distractor,
si hay reintento, pistas, multiplicador de puntos). Los "niveles" de
los demás modos (`REVIEW_LEVEL`, `INVERT_LEVEL`, `CLASSIFY_LEVEL`,
`PAIRING_LEVEL`, y `makeSurvivalLevel()`) están declarados igual, pero
directamente en `js/game.js` porque no son elegibles desde la lista de
niveles.

**Para añadir un modo nuevo:** casi siempre se puede reutilizar el
patrón de "Elige la bandera"/"Bandera y capital" (mismo bucle, cambia
solo qué se muestra como pregunta y opciones) sin tocar el temporizador,
la puntuación ni el HUD. Mirar `nextRound()` y `resolveRound()` en
`js/game.js` para dónde engancha cada pieza.

### Puntuación

```
computePoints = round(max(10, (50 + tLeftRatio·50 − wrongCount·20) × level.mult × streakMultiplier) × (hintUsed ? 0.85 : 1))
```

`streakMultiplier`: x1 (racha <3), x1.2 (≥3), x1.5 (≥6), x2 (≥10). El
máximo teórico de una ronda es `200 × level.mult` (con tiempo perfecto,
sin fallos, racha máxima) — esta cota es la que valida el servidor (ver
"Supabase" más abajo), así que si se cambia esta fórmula hay que
actualizar también la política RLS de inserción.

### Distractores

`distractors.js` ordena el resto de países por similitud a la
respuesta correcta usando dos etiquetas manuales de `countries.js`:
`pattern` (forma/diseño de la bandera) y `palette` (colores). 4 modos:
`easy` (menos parecidos primero), `mixed`, `hard` (más parecidos
primero), y `confusables` (usa primero la lista curada a mano de
`confusables.js`, y si no hay suficientes cae a `hard`). Estas
etiquetas son heurísticas manuales, no derivadas de los píxeles reales
del SVG — ver la auditoría para más detalle.

### Accesibilidad

- La imagen de cada bandera lleva un `alt` generado por
  `flagDescription.js` a partir de `pattern`/`palette` (p. ej. "Bandera
  con franjas horizontales y tres colores, en rojo y amarillo") —
  describe la forma sin nombrar el país, así que no revela la
  respuesta pero permite jugar con lector de pantalla. **Importante:**
  si se añade un modo nuevo que muestre una bandera como pregunta, usar
  siempre `describeFlag(country)` para el `alt`, nunca `alt=""` ni el
  nombre del país.
- `aria-live="polite"` en el feedback, el dato de la capital y la
  puntuación.
- Ajuste de "texto grande" (`bigToggle`) independiente del nivel,
  persistido en `localStorage`.
- El viewport no bloquea el zoom del navegador.
- `prefers-reduced-motion` desactiva las animaciones.

## Persistencia local (`localStorage`)

| Clave | Contenido |
|---|---|
| `dcb_player` | Nombre del jugador actual |
| `dcb_seen_v1` | Mapa código→veces vista, por bandera (progreso de aprendizaje) |
| `dcb_wrong_v1` | Mapa código→nº de fallos históricos (alimenta "Repasa tus fallos") |
| `dcb_continent` | Filtro de continente elegido (solo afecta a los niveles clásicos) |
| `dcb_bigtext` | Ajuste de texto grande (`'1'`/`'0'`) |

Todo el acceso a `localStorage` está envuelto en `try/catch`: si está
deshabilitado (modo privado estricto, cuota llena) el juego sigue
funcionando, solo sin persistir progreso.

## Supabase (ranking)

Proyecto `diversion-con-banderas` (Supabase). El cliente (`js/db.js`)
habla directo con la API REST (PostgREST) usando la clave pública
`anon`, sin SDK ni backend propio. **No hay datos sensibles**: solo
nombre de jugador (texto libre), nivel, puntuación y fecha.

### Esquema

Una única tabla, `public.games`, y dos vistas de solo lectura sobre
ella (`best_scores`, `daily_ranking`). Todo versionado en
`supabase/migrations/` — **cualquier cambio de esquema o de políticas
RLS debe hacerse como una migración nueva ahí**, y aplicarse al
proyecto real (hoy eso requiere acceso al proyecto de Supabase; no hay
CI que lo haga automáticamente).

- `games_public_rls` (política de INSERT para `anon`): valida
  `length(player)`, y que `score` no supere lo que la fórmula de puntos
  puede producir de verdad para ese `level`/`rounds`/`daily` — no es un
  tope arbitrario, es la cota matemática exacta de `computePoints`. Si
  se cambia la fórmula de puntos o se añade un modo que guarda
  puntuación, esta política necesita una migración nueva a juego.
- `games_daily_one_per_player` (índice único parcial): un jugador solo
  puede guardar una partida de reto diario por día (`daily=true`);
  una segunda inserción del mismo jugador el mismo día se rechaza con
  409. El cliente lo detecta (`saveScore` devuelve
  `{ ok:false, reason:'duplicate' }`) y lo muestra en pantalla sin
  bloquear que se siga jugando localmente.
- Solo hay política de `INSERT` y `SELECT` para `anon` — no hay
  `UPDATE` ni `DELETE`: las partidas guardadas son inmutables.

### Si el juego deja de guardar puntuaciones

1. Comprobar en la consola del navegador si `saveScore`/`getFamilyRanking`/
   `getDailyRanking` están fallando (network tab): sin conexión el
   juego sigue funcionando, solo no guarda ni consulta ranking
   (`safeFetch` en `db.js` traga los errores de red a propósito).
2. Si hay conexión pero la inserción falla con 403: revisar si la
   puntuación reportada excede la cota de `games_public_rls` para ese
   nivel — puede ser una partida real que rompe la fórmula esperada
   (bug) o un intento de manipular la puntuación.
3. Si falla con 409 en el reto diario: es el comportamiento esperado,
   ya se jugó ese día.

## Internacionalización

`js/i18n.js` tiene un diccionario `STRINGS.es` con **todas** las
cadenas de la interfaz; `index.html` marca los elementos estáticos con
`data-i18n`/`data-i18n-html`/`data-i18n-placeholder`/`data-i18n-aria-label`,
y `applyStaticI18n()` los rellena al cargar. Las cadenas dinámicas
(feedback de ronda, pantalla de fin, ranking, duelo) se generan con
`t('clave', { variables })` directamente en `game.js`.

**Para añadir un idioma nuevo:** añadir un objeto hermano de `es` en
`STRINGS` con las mismas claves traducidas, y cambiar la constante
`LOCALE` (o convertirla en configurable) — no hace falta tocar
`game.js`, `index.html` ni la lógica de juego. Lo que **no** está
traducido todavía son los datos de contenido (nombre/capital/continente
de cada país en `countries.js`, y las descripciones generadas por
`flagDescription.js`): eso requeriría su propio conjunto de datos
traducidos, ver `docs/decisiones-producto.md`.

## Decisiones de producto a respetar

Antes de cambiar cualquiera de estos tres puntos, leer el razonamiento
completo en `docs/decisiones-producto.md`:

- La fecha del reto diario usa **UTC**, no la hora local del
  dispositivo (a propósito, para que el mazo sea el mismo para todos).
- El catálogo de países es **miembros de la ONU + Ciudad del
  Vaticano** — no añadir territorios, banderas históricas ni estados
  de reconocimiento limitado sin que el producto lo pida
  explícitamente.
- Un ranking público entre desconocidos **se evaluó y no se
  recomienda** con la arquitectura actual (falta autenticación,
  moderación de nombres y protección de menores). Si se retoma, leer
  esa evaluación primero.

## Cómo probar cambios

No hay tests automatizados. Cada fase de la auditoría se verificó
igual: sirviendo el sitio con un servidor estático local y ejecutando
el juego real en Chromium headless vía Playwright (Node ya tiene
Playwright instalado globalmente en algunos entornos de desarrollo; si
no, `npm i -D playwright` y `npx playwright install chromium`), cubriendo
como mínimo:

- El bucle completo de cada modo tocado (elegir jugador → nivel/modo →
  rondas → fin de partida) sin errores de consola.
- Que el `alt` de la bandera no revela la respuesta.
- Que las validaciones de Supabase (si se tocan) se comportan igual
  simulando las respuestas con `page.route(...)` cuando no hay acceso
  de red real al proyecto.
- Regresión rápida de accesibilidad: zoom no bloqueado, `aria-live`
  presente, texto grande funcionando en cualquier nivel.

## Historial

El proyecto pasó por una auditoría completa
(`docs/auditoria-juegodebanderas.md`) y un roadmap de 5 fases, todas ya
implementadas y mergeadas:

- **Fase 0** — quick wins de accesibilidad, justicia (exploit del
  temporizador) y rendimiento.
- **Fase 1** — descripción accesible de banderas, modo Aprender, modo
  Repasa tus fallos, selección por continente.
- **Fase 2** — Supervivencia, Elige la bandera, Clasifica por
  continente, Bandera y capital, ampliación de `CONFUSABLES`.
- **Fase 3** — validación real de puntuación en servidor, límite de un
  intento diario por jugador, esquema de Supabase versionado, duelo
  asíncrono.
- **Fase 4** — infraestructura de internacionalización y las
  decisiones de producto documentadas.

Para el detalle de cada hallazgo y por qué se decidió cada cosa, la
auditoría original sigue siendo la referencia más completa.
