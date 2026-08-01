# Diversión con Banderas

Juego web de "adivina el país por su bandera", en seis idiomas (español,
catalán, inglés, francés, alemán e italiano), pensado originalmente como
juego familiar. HTML + CSS + JavaScript **vanilla** (módulos ES nativos),
sin build, sin framework, sin dependencias npm.
El progreso y el ranking de casa se guardan en el propio dispositivo;
Supabase se usa solo para el reto diario compartido. El juego funciona
igual de bien sin conexión: solo se pierden el reto diario y el duelo.

Este documento es la referencia técnica del proyecto: qué hay, cómo
funciona y qué tener en cuenta antes de tocarlo. Para el historial de
por qué se tomó cada decisión, ver `docs/auditoria-juegodebanderas.md`
(la auditoría original) y `docs/decisiones-producto.md` (decisiones de
producto explícitas: fecha del reto diario, criterio de países,
evaluación del ranking global). Para todo lo relativo a idiomas, ver
`docs/idiomas.md`.

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
index.html                  Las 7 pantallas del juego (marcado, sin lógica)
style.css                   Sistema de diseño y todo el CSS (sin preprocesador)
js/
  game.js                   Estado del juego, bucle de ronda, todos los modos
  countries.js              Datos de los 195 países que NO dependen del idioma
                             (código ISO, código de continente, y etiquetas
                             pattern/palette para calcular distractores)
  levels.js                 Configuración declarativa de los 4 niveles clásicos
  distractors.js            Algoritmo de similitud para elegir opciones incorrectas
  confusables.js            Lista curada a mano de banderas clásicamente confundibles
  flagDescription.js        Genera la descripción accesible (no reveladora) de cada bandera
  i18n.js                   Motor de idiomas (elige, carga y sirve; sin cadenas dentro)
  i18n/<idioma>.js          Un archivo por idioma: interfaz, continentes, vocabulario
  i18n/names.<idioma>.js    Nombres de país y capitales de ese idioma
  db.js                     Cliente REST directo contra Supabase (sin SDK)
assets/flags/                196 SVG (proyecto flag-icons, MIT) + LICENSE-flag-icons.txt
supabase/migrations/         Esquema y políticas RLS de la base de datos, versionados
tools/check-i18n.mjs         Comprueba que los seis idiomas están completos
tools/build-names.mjs        Regenera los nombres de país de los idiomas derivados
docs/idiomas.md               Cómo funcionan los idiomas y cómo añadir uno
docs/decisiones-producto.md   Decisiones de producto explícitas (fecha UTC, países, ranking global)
docs/auditoria-juegodebanderas.md  Auditoría original y roadmap por fases (histórico)
```

No hay carpeta de tests, ni linter, ni CI configurados. La única
comprobación automática del proyecto es `node tools/check-i18n.mjs`, que
no necesita dependencias. Ver "Cómo probar cambios" más abajo para cómo se
ha verificado cada cambio hasta ahora.

## Cómo está montada la interfaz

`index.html` define 7 `<section class="screen">` (tipo de juego, nivel,
jugador, partida, fin, aprender, ranking) más dos hojas inferiores: el
menú de partida y los ajustes. Solo una pantalla tiene la clase `.on` a
la vez; `game.js` las alterna con la función `show(id)`. No hay routing
ni historial: todo vive en una sola página.

Todo el texto de la interfaz está en `js/i18n.js`, no hardcodeado en
el HTML ni en el JS — ver la sección "Internacionalización" más abajo.

### El asistente de tres pasos

Para empezar una partida se recorre siempre el mismo camino:

```
1. ¿A qué jugamos?   (s-mode)   → tipo de juego
2. ¿Cómo de difícil? (s-level)  → nivel + continente   ← solo el modo clásico
3. ¿Quién juega?     (s-who)    → ficha de jugador
```

Dos reglas que conviene respetar al tocarlo:

- **Ningún paso tiene botón de "siguiente".** Tocar una tarjeta elige y
  avanza. Así el recorrido cuesta tres toques, los mismos que costaba
  antes entrar por nombre → nivel → jugar.
- **El paso 2 solo existe si el modo tiene niveles elegibles.** Eso lo
  declara `needsLevel` en el catálogo `MODES` de `game.js`; los modos
  con dificultad fija saltan del paso 1 al 3 y el indicador de progreso
  se pinta con dos píldoras en vez de tres, sin ninguna rama especial.

**Para añadir un modo al asistente** basta con una entrada en `MODES`
(icono, claves de i18n, `needsLevel`, `usesScope`, `scoreable` y la
función `start`). La pantalla del paso 1 se genera a partir de ese
objeto; no hay que tocar el marcado.

El reto diario y "Repasa tus fallos" están en `MODES` marcados como
`hidden`: son partidas de pleno derecho (y por tanto pasan por el
asistente), pero no se pintan en la rejilla porque tienen su propio
sitio en la pantalla — tarjeta destacada arriba y bloque de "sin
puntos" abajo. "Aprender" no está en `MODES` porque no es una partida:
no tiene nivel, ni jugador, ni puntuación.

### Sistema de diseño

`style.css` está organizado en tokens → componentes → layout, y la
cabecera del fichero lista las tres reglas que no conviene romper. Las
dos que más se incumplen por descuido:

- **Nada de `style="..."` en `index.html`.** Si hace falta una variante,
  se añade como clase (`.btn--danger`, `.card--hero`, `.btn--sm`…).
- **`opacity` nunca para atenuar texto**: usar `--ink-muted`, que tiene
  un contraste medido. Con opacidad el contraste depende del fondo que
  toque debajo y deja de ser verificable.

Dos trampas que ya han mordido una vez y conviene no repetir:

- **`.btn:disabled` lleva `:not(.good):not(.bad):not(.removed)` a
  propósito.** Al resolver una ronda se deshabilitan todas las opciones,
  y esa regla pinta `background` directamente en vez de usar `--bg`, así
  que sin la exclusión se llevaba por delante el verde del acierto y el
  rojo del fallo y las dejaba todas en gris.
- **Todo lo que se oculte desde JS necesita la regla global
  `[hidden]{display:none !important}`.** El `display:none` que el
  navegador aplica a `[hidden]` viene de la hoja de usuario y lo pisa
  cualquier `display:flex` o `display:grid` propio.

**Los toques se escuchan solo con `click`, nunca con `touchend`**
(`onTap()` en `game.js`). Con `touchend`, cualquier dedo que se levantara
encima de un botón lo activaba aunque el gesto hubiera sido un scroll de
media pantalla: en el móvil era imposible recorrer la portada sin entrar
en alguna tarjeta sin querer. El navegador ya distingue el scroll del
toque y no emite `click` si el dedo se ha desplazado. No hace falta
compensar el retardo de 300ms: `touch-action:manipulation` en el `body`
ya lo elimina.

El diseño es responsive de verdad, no una columna de móvil estirada: a
partir de 640px las rejillas pasan a dos columnas, y a partir de 1024px
(o en móvil apaisado) la partida se reorganiza en dos columnas con la
bandera a la izquierda y las respuestas a la derecha. El bloqueo de
scroll (`html.is-playing`) se aplica **solo durante la partida**, donde
hay cuenta atrás; el resto de pantallas son documento normal.

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

**El cronómetro no arranca hasta que la bandera está pintada.** Antes se
lanzaba en el mismo momento en que se pedía el SVG, así que con conexión
lenta los segundos caían sobre una caja vacía — y en nivel Dios, con 6
segundos, eso se comía media ronda. `startCountdownWhenReady()` espera al
`load` de las imágenes de la ronda (la del enunciado, o las de las
opciones en "Elige la bandera"), con un tope de 3 segundos por si el SVG
no llega nunca, y un testigo de ronda para que una imagen que llega tarde
no arranque el reloj de la ronda siguiente. Además se precarga la bandera
de la ronda siguiente mientras se juega la actual. **Si se añade un modo
cuyo enunciado sea una imagen, hay que pasarla por ahí.**

### Modos de juego

| Modo | Cómo se juega | Mazo | ¿Cuenta para el ranking? |
|---|---|---|---|
| **Clásico** (4 niveles: Nene, Principiante, Experto, Dios) | Bandera → elegir el nombre del país | `buildDeck()`, prioriza banderas menos vistas, respeta el filtro de continente | Sí, en local (`dcb_scores_v1`) |
| **Reto diario** (tarjeta destacada del paso 1) | Igual que Experto, pero con semilla determinista por fecha (mismo mazo para todo el mundo el mismo día) | `buildDailyDeck()`, ignora el filtro de continente | Sí, en Supabase, máx. 1 intento/jugador/día (`daily_ranking`) |
| **Aprender** (`btnLearn`, fuera del asistente) | Lista navegable de banderas con nombre/capital/continente | Todas (o filtradas por continente), sin cronómetro ni puntuación | No |
| **Repasa tus fallos** (`btnReview`, solo visible con ≥3 fallos históricos) | Igual que Clásico, pero el mazo son las banderas más falladas | Ordenado por nº de fallos; acertar una la quita del historial | No |
| **Elige la bandera** | Se invierte el sentido: se muestra el nombre y hay que tocar la bandera | Reutiliza `pickDistractors` | No |
| **Clasifica por continente** | Bandera → elegir el continente entre 5 opciones fijas | — | No |
| **Bandera y capital** | Igual que Clásico, pero las opciones son capitales | — | No |
| **Supervivencia** | Una sola vida; el tiempo baja, las opciones suben y los distractores se endurecen con cada acierto (`survivalParamsForRound`) | Las 195 banderas, mezcladas | Sí, en local, como nivel `survival` |

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
`js/game.js` para dónde engancha cada pieza, y añadir su entrada en
`MODES` para que aparezca en el asistente (ver "El asistente de tres
pasos" más arriba).

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
  respuesta pero permite jugar con lector de pantalla. La descripción va
  en el idioma activo: su vocabulario (colores, formas, patrones con
  nombre propio como la Union Jack) está en el bloque `flag` de cada
  archivo de idioma, y `flagDescription.js` solo pone la gramática.
  **Importante:** si se añade un modo nuevo que muestre una bandera como
  pregunta, usar siempre `describeFlag(country)` para el `alt`, nunca
  `alt=""` ni el nombre del país.
- `<html lang>` se actualiza al idioma activo, para que el lector de
  pantalla lea cada idioma con su propia pronunciación. Los botones del
  selector de idioma llevan su propio `lang`, que es lo que hace que
  "Français" no se lea con acento español.
- `aria-live="polite"` en el feedback, el dato de la capital y la
  puntuación.
- Ajuste de tamaño de texto (3 pasos) en la hoja de ajustes, accesible
  desde cualquier pantalla y persistido en `localStorage`. Funciona con
  una única variable `--scale` en `:root` que multiplica toda la escala
  tipográfica y los tamaños de toque, así que **escala la aplicación
  entera**. Cualquier tamaño nuevo que se añada al CSS debe multiplicarse
  por `--scale` para no quedarse fuera del ajuste.
- Zonas de toque de 44px como mínimo. Las píldoras del asistente usan
  44px fijos, no escalados: el mínimo de toque es absoluto y escalarlo
  desbordaría la cabecera en móvil.
- Contraste verificado: foco de tinta (13.6:1), acierto `#1F7A6E`
  (5.16:1) y fallo `#C1462A` (5.03:1) sobre blanco. Los tonos claros
  `--teal-500`/`--coral-500` se quedan de decoración porque con texto
  blanco encima no llegan a 4.5:1.
- El viewport no bloquea el zoom del navegador.
- `prefers-reduced-motion` desactiva los adornos, pero mantiene el
  movimiento que informa: la barra del temporizador se sigue moviendo y
  el fallo sigue avisando, con un borde en vez de una sacudida.

## Persistencia local (`localStorage`)

| Clave | Contenido |
|---|---|
| `dcb_players_v1` | Lista de jugadores de este dispositivo (`[{name, lastPlayedAt}]`) |
| `dcb_scores_v1` | Mejor marca por jugador y nivel: **es el ranking de casa** |
| `dcb_last_v1` | Última configuración jugada, para la tarjeta "Seguir jugando" |
| `dcb_seen_v1` | Mapa código→veces vista, por bandera (progreso de aprendizaje) |
| `dcb_wrong_v1` | Mapa código→nº de fallos históricos (alimenta "Repasa tus fallos") |
| `dcb_continent` | Filtro de continente elegido, por código (solo afecta a los niveles clásicos) |
| `dcb_textsize` | Tamaño de texto (`'md'`/`'lg'`/`'xl'`) |
| `dcb_lang` | Idioma elegido a mano (`'es'`/`'ca'`/`'en'`/`'fr'`/`'de'`/`'it'`) |

Dos claves antiguas se migran solas al cargar y luego se borran, así que
nadie pierde nada al actualizar: `dcb_player` (un único nombre) siembra
`dcb_players_v1`, y `dcb_bigtext` (`'1'`/`'0'`) se convierte en
`dcb_textsize`. **Si se vuelven a necesitar esos nombres, usar claves
nuevas**: el código los borra a propósito.

El paso de un nombre único a una lista no es cosmético. Con
`dcb_player`, en un móvil compartido las partidas del segundo jugador se
guardaban en Supabase con el nombre del primero, y el ranking familiar
quedaba mal atribuido. Elegir ficha en el paso 3 es lo que lo arregla.

Todo el acceso a `localStorage` está envuelto en `try/catch`: si está
deshabilitado (modo privado estricto, cuota llena) el juego sigue
funcionando, solo sin persistir progreso.

## Ranking

Hay dos rankings y **viven en sitios distintos a propósito**:

| Ranking | Dónde | Qué contiene |
|---|---|---|
| **Ranking de casa** | `localStorage` (`dcb_scores_v1`) | Mejor marca por jugador y nivel, del modo clásico y de Supervivencia |
| **Reto diario** | Supabase | La partida diaria de todos los jugadores, y el duelo asíncrono |

El ranking de casa era antes la vista `best_scores` de Supabase, que
devolvía las **50 mejores marcas de la tabla entera, sin ningún filtro**:
se llamaba "ranking familiar" pero era un tablón de cualquiera que
hubiese jugado desde cualquier dispositivo, con los nombres a la vista.
`docs/decisiones-producto.md` ya había descartado un ranking público
entre desconocidos; esto lo hace cumplir. En local no hace falta ni
cuenta ni servidor, no cuesta nada, y los nombres no salen del
dispositivo.

**El precio, y conviene tenerlo claro:** las marcas ya no se comparten
entre el móvil y la tablet de la misma casa. Recuperar eso pide un
servidor con las partidas agrupadas por familia (una columna nueva, una
migración y cerrar la lectura directa de la tabla con una función
`SECURITY DEFINER`), y ninguna de esas piezas existe hoy.

El reto diario se queda en Supabase porque su gracia es comparar el mismo
mazo con gente que juega en otro dispositivo, y eso no se puede hacer en
local. De su tabla **solo se muestran los nombres que están en la lista
de jugadores de este dispositivo**; el resto se filtra en el cliente.
Ojo con lo que eso es y lo que no: es una decisión de qué se enseña en
pantalla, no una barrera — la clave `anon` va en el repositorio, así que
cualquiera puede consultar la tabla por su cuenta. La protección de
verdad tendría que estar en el servidor.

El duelo asíncrono no se toca: sigue comparando tu resultado con el de
alguien a quien nombras tú, aunque esa persona no aparezca en la lista.

## Supabase (reto diario)

Proyecto `diversion-con-banderas` (Supabase). El cliente (`js/db.js`)
habla directo con la API REST (PostgREST) usando la clave pública
`anon`, sin SDK ni backend propio. **No hay datos sensibles**: solo
nombre de jugador (texto libre), nivel, puntuación y fecha.

Desde el rediseño de la interfaz, el juego **solo escribe en Supabase
las partidas del reto diario**: las del modo clásico y las de
Supervivencia se quedan en `localStorage`. La vista `best_scores` sigue
existiendo en la base de datos pero ya no se consulta desde el juego.
Esto mantiene el uso dentro del plan gratuito con holgura y reduce a una
inserción por jugador y día lo que se envía fuera del dispositivo.

Aviso operativo del plan gratuito: un proyecto de Supabase sin actividad
durante unos días se pausa solo, y entonces las llamadas fallan. El juego
no se rompe por eso —`safeFetch` se traga los errores de red y el
ranking de casa es local—, pero el reto diario y el duelo dejarán de
funcionar hasta que se reactive el proyecto desde el panel de Supabase.

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

0. Comprobar de qué ranking se habla: el de casa es local y no depende
   de la red en absoluto. Si lo que falta son las marcas del modo
   clásico, mirar `dcb_scores_v1` en `localStorage`, no Supabase.
1. Comprobar en la consola del navegador si `saveScore`/`getDailyRanking`
   están fallando (network tab): sin conexión el juego sigue
   funcionando, solo no guarda ni consulta el reto diario
   (`safeFetch` en `db.js` traga los errores de red a propósito). Si
   fallan todas las llamadas, lo más probable es que el proyecto de
   Supabase esté pausado por inactividad (ver arriba).
2. Si hay conexión pero la inserción falla con 403: revisar si la
   puntuación reportada excede la cota de `games_public_rls` para ese
   nivel — puede ser una partida real que rompe la fórmula esperada
   (bug) o un intento de manipular la puntuación.
3. Si falla con 409 en el reto diario: es el comportamiento esperado,
   ya se jugó ese día.

## Internacionalización

El juego está en **seis idiomas**: español, catalán, inglés, francés,
alemán e italiano. Está traducido todo lo que ve el jugador, no solo la
interfaz: los nombres de país, las capitales, los continentes y las
descripciones de bandera para lector de pantalla.

Se detecta el del navegador la primera vez, y se cambia desde **dos sitios
que hacen lo mismo**: la fila de códigos (`ES · CA · EN · FR · DE · IT`) de
lo alto de la portada, siempre a la vista, y **Ajustes → 🌍 Idioma**, con
los nombres completos. Ambos pasan por `changeLanguage()` en `game.js`, que
recarga el paquete, repinta las cadenas fijas, repinta la pantalla en curso
y deja los dos selectores sincronizados. El de la portada es el que
resuelve el caso real: un móvil configurado en inglés en una casa que juega
en español.

`js/i18n.js` es solo el motor —elige el idioma, lo carga con `import()`
dinámico y lo sirve— y no contiene ni una cadena traducible. Cada idioma
vive entero en `js/i18n/<código>.js` (interfaz, continentes, vocabulario de
las descripciones de bandera) más su `js/i18n/names.<código>.js` (nombres de
país y capitales). Como el paquete se carga bajo demanda, un móvil se
descarga un idioma, no seis.

`index.html` marca los elementos estáticos con
`data-i18n`/`data-i18n-html`/`data-i18n-placeholder`/`data-i18n-aria-label`,
y `applyStaticI18n()` los rellena; el HTML conserva el texto en español
dentro de las etiquetas a propósito, que es lo que se ve si el JavaScript no
llega a correr. Las cadenas dinámicas se generan con `t('clave', { vars })`,
y el contenido con `countryName(c)`, `countryCapital(c)` y
`continentName(code)`.

Como el arranque tiene que esperar al idioma, `js/game.js` empieza con un
`await initI18n()` en el nivel superior del módulo. Todo lo que va debajo da
por hecho que el idioma ya está cargado.

**Reglas al tocar código:**

- Nada de texto suelto en `game.js`, `index.html` ni `flagDescription.js`:
  toda cadena nueva es una clave en los seis archivos de idioma.
- El continente es un código (`"af"`, `"am"`, `"as"`, `"eu"`, `"oc"`), nunca
  su nombre. Comparar por código, pintar con `continentName()`.
- Los países se identifican por su código ISO en todas partes (mazo,
  historial de fallos, ranking). Nunca por su nombre: cambiaría al cambiar
  de idioma y se perdería el historial.
- Después de tocar idiomas, `node tools/check-i18n.mjs` tiene que pasar.

Para añadir un idioma, de dónde salen los datos de CLDR y qué no se traduce
a propósito, ver **`docs/idiomas.md`**.

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
- Los tres pasos del asistente en móvil (390px) y en escritorio
  (1440px), incluyendo un modo con nivel y otro sin él, y que la
  migración de `dcb_player`/`dcb_bigtext` conserva jugador y ajuste.
- Si se tocan idiomas: `node tools/check-i18n.mjs`, más el juego real en
  al menos dos idiomas, cambiando de idioma **desde los dos selectores**
  (la fila de la portada y el de ajustes) y comprobando que la pantalla se
  repinta, que el otro selector queda marcado igual, que el idioma
  sobrevive a una recarga y que ninguna etiqueta se sale de su botón con
  el texto en XL (los nombres largos —"Français", "Ozeanien"— son el caso
  que lo rompe).

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
