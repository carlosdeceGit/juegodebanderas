# Diversión con Banderas

Juego web de "adivina el país por su bandera", en seis idiomas (español,
catalán, inglés, francés, alemán e italiano), pensado originalmente como
juego familiar. HTML + CSS + JavaScript **vanilla** (módulos ES nativos),
sin build, sin framework, sin dependencias npm.
El progreso y el ranking de casa se guardan en el propio dispositivo;
Supabase se usa solo para el ranking del reto diario. El juego funciona
igual de bien sin conexión —el reto de hoy incluido, porque la bandera
del día se calcula en local—: lo único que se pierde es que la
puntuación del reto llegue al ranking compartido, y el duelo.

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

Hay un `package.json`, pero **la web no lo usa**: está solo para empaquetar
las apps de iPhone y Android (ver "Apps para iPhone y Android" más abajo).
`vercel.json` se encarga de que Vercel no intente instalar ni compilar nada
al ver ese `package.json`.

## Estructura del repositorio

```
index.html                  Las 8 pantallas del juego (marcado, sin lógica)
style.css                   Sistema de diseño y todo el CSS (sin preprocesador)
js/
  game.js                   Estado del juego, bucle de ronda, todos los modos por turnos
  daily.js                  El reto de hoy: una bandera tapada en 9 piezas (pantalla propia)
  countries.js              Datos de los 195 países que NO dependen del idioma
                             (código ISO, código de continente, coordenadas
                             lat/lon, y etiquetas pattern/palette para calcular
                             distractores)
  levels.js                 Configuración declarativa de los 4 niveles clásicos
  distractors.js            Algoritmo de similitud para elegir opciones incorrectas
  confusables.js            Lista curada a mano de banderas clásicamente confundibles
  flagDescription.js        Genera la descripción accesible (no reveladora) de cada bandera
  geo.js                    Distancia, rumbo y proximidad entre países (pistas del reto)
  dom.js                    Helpers de interfaz compartidos ($, escapeHtml, onTap, normText)
  storage.js                localStorage tolerante a fallo (lsGet/lsSet/lsGetJSON…)
  i18n.js                   Motor de idiomas (elige, carga y sirve; sin cadenas dentro)
  i18n/<idioma>.js          Un archivo por idioma: interfaz, continentes, vocabulario
  i18n/names.<idioma>.js    Nombres de país y capitales de ese idioma
  db.js                     Cliente REST directo contra Supabase (sin SDK)
  pwa.js                    Registra el service worker (nunca en las apps nativas)
manifest.webmanifest        Nombre, iconos y colores para instalar la web como app
sw.js                       Service worker: el juego sin conexión (solo web)
assets/flags/                196 SVG (proyecto flag-icons, MIT) + LICENSE-flag-icons.txt
assets/icon.svg              El icono de la app, editable, fuente de todo lo demás
assets/splash.svg            La pantalla de arranque de las apps nativas
assets/icons/                PNG del manifest y de iOS (generados)
capacitor.config.json        Identificador, nombre y color de las apps nativas
package.json                 Dependencias y scripts SOLO del empaquetado móvil
vercel.json                  Le dice a Vercel que esto se sirve tal cual, sin build
supabase/migrations/         Esquema y políticas RLS de la base de datos, versionados
tools/check-i18n.mjs         Comprueba que los seis idiomas están completos
tools/build-names.mjs        Regenera los nombres de país de los idiomas derivados
tools/build-icons.mjs        Rasteriza los SVG de icono y splash a PNG
tools/build-www.mjs          Copia el sitio a www/, que es lo que empaquetan las apps
docs/idiomas.md               Cómo funcionan los idiomas y cómo añadir uno
docs/decisiones-producto.md   Decisiones de producto explícitas (fecha UTC, países, ranking global)
docs/apps-moviles.md          Cómo llevar el juego a App Store y Google Play
docs/ideas-app.md             Propuesta (sin decidir) para pasar de juego web a producto
docs/auditoria-juegodebanderas.md  Auditoría original y roadmap por fases (histórico)
```

No hay carpeta de tests, ni linter, ni CI configurados. La única
comprobación automática del proyecto es `node tools/check-i18n.mjs`, que
no necesita dependencias. Ver "Cómo probar cambios" más abajo para cómo se
ha verificado cada cambio hasta ahora.

## Cómo está montada la interfaz

`index.html` define 8 `<section class="screen">` (tipo de juego, nivel,
jugador, partida, fin, reto de hoy, aprender, ranking) más dos hojas
inferiores: el menú de partida y los ajustes. Solo una pantalla tiene la
clase `.on` a la vez; `game.js` las alterna con la función `show(id)`.
No hay routing ni historial: todo vive en una sola página.

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
  con dificultad fija saltan del paso 1 al 3, sin ninguna rama especial.
- **No hay indicador de progreso.** Se probó con píldoras bajo la
  cabecera y lo que transmitían era "aquí hay unos puntos", no en qué
  paso estabas. Lo que sitúa al jugador es el botón de volver
  (`← Otro juego`, `← Nivel`) y el resumen de lo ya elegido que cada
  paso enseña bajo su título. Si se retoma la idea, que no sea con
  puntos mudos.

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

### La cabecera

Todas las pantallas menos la partida llevan la misma `<header class="topbar">`,
con la misma forma: **acción a la izquierda, ajustes a la derecha, las dos
con etiqueta y con las mismas clases** (`.btn .btn--sm`). La acción de la
izquierda cambia según dónde estés — `🏆 Ranking` en la portada y en el
fin de partida, `← Otro juego` / `← Nivel` en los pasos del asistente,
`↩ Volver` en aprender y en el ranking — pero el marco es idéntico.

Dos cosas que conviene no deshacer:

- **Nada de botones que sean solo un emoji en un círculo.** Se probaron y
  no se entendían. Si hace falta una acción nueva en la cabecera, va con
  su etiqueta.
- **La cabecera no lleva nada en medio.** Ahí estuvieron las píldoras de
  progreso y hubo que sacarlas dos veces: primero porque se desbordaba
  la barra en un móvil de 390px, y después porque nadie entendía qué
  eran esos puntos.

La partida es la excepción a propósito: su cabecera es el HUD (marcador,
rondas, tiempo) y ahí el `☰` sí va sin etiqueta porque compite por el
espacio con cinco indicadores.

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
(`onTap()` en `js/dom.js`). Con `touchend`, cualquier dedo que se levantara
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
**todos** los modos por turnos; lo que cambia entre modos es cómo se
construye el mazo, qué se muestra como pregunta/opciones, y qué cuenta
como acierto. Esto se controla con una única variable de estado, `mode`:

```
'classic' | 'review' | 'survival' | 'invert' | 'classify' | 'pairing'
```

**El reto de hoy es la excepción y no pasa por aquí**: no tiene rondas,
ni cronómetro, ni opciones que elegir, así que vive en su propio módulo
y su propia pantalla (`js/daily.js`, ver más abajo). Del bucle solo
comparte la entrada — el asistente elige jugador y le cede el control.

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
| **El reto de hoy** (tarjeta destacada del paso 1) | Pantalla aparte (`js/daily.js`): una bandera tapada en 9 piezas, se escribe el país y cada fallo destapa una pieza | Una sola bandera, determinista por fecha (la misma para todo el mundo) | Sí, en Supabase, máx. 1 intento/jugador/día (`daily_ranking`) |
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

## El reto de hoy (`js/daily.js`)

Una bandera al día, la misma para todo el mundo, tapada con **nueve
piezas** (3 × 3). Se ve una pieza de salida; se escribe el nombre de un
país y, si no es, se destapa otra pieza. Hay **6 intentos**. Al terminar
—se acierte o no— se ve la bandera entera.

Sustituye al reto diario anterior, que eran 12 rondas de opción múltiple
con cronómetro (nivel Experto con mazo sembrado por fecha). El motivo
está en `docs/decisiones-producto.md`: el reto diario solo tiene gracia
si es comparable y da conversación, y doce rondas cronometradas medían
sobre todo la velocidad de tocar la pantalla.

Piezas que conviene conocer antes de tocarlo:

- **Qué bandera toca hoy** (`flagOfTheDay`): no se sortea un país cada
  día. Se baraja el catálogo entero con una semilla fija y se recorre en
  orden según el número de día UTC, así que **dentro de cada vuelta de
  195 días no se repite ninguna bandera**. Cada vuelta usa una semilla
  distinta para no repetir el orden de la anterior, y la costura entre
  vueltas está cosida a mano (`cycleOrder`, constante `GUARD`): sin eso,
  una bandera del final de una vuelta podía reaparecer cinco días
  después al principio de la siguiente; ahora la separación mínima
  medida es de 22 días. El orden en que se destapan las piezas también
  va sembrado por la fecha.
- **Las pistas de distancia** (`js/geo.js`): cada intento fallido dice a
  cuántos km está el país acertado, en qué dirección (flecha + nombre
  del rumbo para lectores de pantalla) y un % de proximidad. Sin esto,
  adivinar un país por un noveno de su bandera es casi imposible. Usa
  los campos `lat`/`lon` de `countries.js`, que son **centroides
  aproximados** de cada país, no capitales.
- **Se escribe, no se elige**, con sugerencias filtradas sin tildes ni
  mayúsculas (`normText`). Un país que no existe o uno ya probado
  **no gasta intento**: gastarlo por una errata sería injusto cuando
  solo hay un intento al día.
- **En el idioma que se esté jugando.** Los nombres se comparan contra
  los del idioma activo (`countryName`), no contra los españoles, y los
  rumbos, las distancias y la fecha se escriben con las reglas de ese
  idioma. La bandera del día, en cambio, **no depende del idioma**: sale
  del código ISO, así que media familia puede jugarlo en catalán y la
  otra media en inglés y seguir comparando el mismo reto.
- **El estado se guarda** en `dcb_daily_v2`, por fecha y jugador:
  recargar la página no regala intentos. Se guarda el día entero en una
  sola clave y se descarta cuando cambia la fecha, así que el
  almacenamiento no crece.
- **Puntuación**: 300 al acierto a la primera, −40 por cada fallo
  (mínimo 100), y 0 si se agotan los intentos. Se envía como **una sola
  "ronda"**, que es lo que hace que encaje en la validación del
  servidor sin migración: `score <= rounds * 200 * 1.6` con `rounds = 1`
  deja el techo en 320. Por lo mismo, viaja etiquetado con el `level`
  `experto` (ver el comentario en `js/levels.js`): la política RLS solo
  admite cinco valores en esa columna, y el ranking diario lista
  jugador y puntos, no niveles.
- **Cuenta para el progreso del juego.** Al terminar, la bandera del día
  suma en "banderas vistas" (se acaba enseñando entera, con nombre y
  capital) y, si no se ha sacado, entra en `dcb_wrong_v1` para que
  aparezca en "Repasa tus fallos": es exactamente una bandera que no se
  supo reconocer. Acertarla **no** la quita del repaso, al revés que en
  el modo de repaso — allí se acierta viendo la bandera entera, y aquí se
  puede llegar al país por descarte y por las pistas de distancia. El
  reto no toca esos mapas por su cuenta: los actualiza `onFinish`, que le
  pasa `js/game.js`, que es donde viven.
- **Compartir** genera cuadrados 🟥/🟩 con el número de intentos, **sin
  decir qué bandera era** — se comparte con gente que aún no ha jugado.
  Usa `navigator.share` si existe, si no el portapapeles, y si tampoco,
  enseña el texto para copiarlo a mano.

Quién juega y de qué día es el reto van en una línea bajo el título, no
en la cabecera. Estuvieron ahí, en una cápsula, y con el texto en XL y un
nombre largo empujaban los ajustes fuera de la pantalla en un móvil de
320px: la cabecera es solo acción + ajustes en todas las pantallas y no
tiene sitio para nada más. Que se vea de quién es el intento importa
porque el reto es de uno por persona y día, y el móvil suele ser
compartido.

La bandera va en un único `<img>` con nueve tapas por encima que se
apagan una a una (`.fgrid__cover.is-open`). Pintar nueve trozos con
`background-position` era la alternativa obvia, pero dejaba costuras
claras entre piezas por el redondeo de subpíxeles. La caja es 4:3
porque todos los SVG de flag-icons lo son: así las tapas caen
exactamente sobre sus novenos.

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
- Zonas de toque de 44px como mínimo. El selector de idioma usa 44px
  fijos, no escalados: el mínimo de toque es absoluto y escalarlo con el
  texto en XL desbordaría la fila de seis idiomas.
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
| `dcb_daily_v2` | El reto de hoy en curso: `{date, players:{jugador:{guesses,done,won,saved}}}`. Se descarta entero al cambiar la fecha |
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
| **Reto de hoy** | Supabase | El resultado del reto de hoy de todos los jugadores, y el duelo asíncrono |

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

El reto de hoy se queda en Supabase porque su gracia es comparar la misma
bandera con gente que juega en otro dispositivo, y eso no se puede hacer
en local. De su tabla **solo se muestran los nombres que están en la lista
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

- Nada de texto suelto en `game.js`, `daily.js`, `geo.js`, `index.html` ni
  `flagDescription.js`: toda cadena nueva es una clave en los seis archivos
  de idioma. `geo.js` devuelve la *clave* del rumbo (`"ne"`), no su nombre;
  quien lo pinta busca `daily.dir.ne` en el idioma activo.
- **Toda pantalla que genere texto desde JavaScript tiene que estar en
  `renderCurrentScreen()`.** `applyStaticI18n()` solo arregla lo que está
  marcado con `data-i18n` en el HTML; lo que pinta el JS se queda en el
  idioma anterior si nadie lo repinta. Ya pasó con el fin de partida
  —título, resumen y lista de banderas falladas se quedaban en el idioma
  con el que se había jugado— y por eso pintar y "terminar la partida"
  son ahora dos funciones separadas (`paintEnd()` y `end()`).
- Los números y las fechas también son idioma: `toLocaleString(getLocale())`
  y `toLocaleDateString(getLocale())`, no un formato fijo. El separador de
  miles de 9.704 no vale para todos.
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
  dispositivo (a propósito, para que la bandera del día sea la misma
  para todos).
- El reto diario es **una bandera tapada en 9 piezas**, no una partida
  del bucle normal. El formato anterior (12 rondas cronometradas) se
  cambió a propósito; el razonamiento está documentado.
- El catálogo de países es **miembros de la ONU + Ciudad del
  Vaticano** — no añadir territorios, banderas históricas ni estados
  de reconocimiento limitado sin que el producto lo pida
  explícitamente.
- Un ranking público entre desconocidos **se evaluó y no se
  recomienda** con la arquitectura actual (falta autenticación,
  moderación de nombres y protección de menores). Si se retoma, leer
  esa evaluación primero.

## Apps para iPhone y Android

El mismo juego, sin reescribir nada, por dos vías que conviven:

- **Instalable desde el navegador (PWA).** Ya funciona en la web
  desplegada: `manifest.webmanifest` + `sw.js` + `js/pwa.js`. Quien entre
  desde el móvil puede añadirlo a la pantalla de inicio y jugar sin
  conexión. Gratis y sin tiendas de por medio.
- **Apps de App Store y Google Play (Capacitor).** El sitio viaja entero
  dentro de un proyecto nativo de Xcode y de Android Studio:

  ```bash
  npm install                # solo la primera vez
  npm run app:icons          # iconos y splash desde assets/icon.svg
  npm run app:add:android    # crea android/  (y app:add:ios en un Mac)
  npm run app:android        # sincroniza el juego y abre Android Studio
  ```

Todo lo que hay que saber —requisitos, costes, firma, números de versión,
qué declarar en las tiendas y por qué Apple rechaza las apps que son "solo
una web"— está en **`docs/apps-moviles.md`**.

Dos cosas que no cambian al empaquetar: las puntuaciones siguen yendo a
Supabase con la misma clave `anon` pública (lo que protege los datos son
las políticas RLS, no el secreto de la clave), y el ranking de casa sigue
en `localStorage`, que dentro de la app es un almacén distinto del del
navegador. Quien juegue en la web y en la app tendrá dos rankings de casa.

Cambios que rompen el empaquetado, por si aparecen en una revisión: meter
un archivo nuevo en la raíz y no añadirlo a la lista de `tools/build-www.mjs`
(no llegaría a la app), o hacer que el juego dependa de una ruta absoluta
del dominio (dentro de la app no hay dominio).

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

**Trampa al guionizar los tests:** `onTap()` ignora dos toques seguidos
sobre el mismo elemento en menos de 500ms (antirrebote). Un guion que
encadena clics sin pausa se come la mitad y parece un fallo del juego;
hay que dejar ~600ms entre toques, como haría una persona.

Al probar el reto de hoy conviene además interceptar las llamadas a
Supabase con `page.route(...)`: si no, cada ejecución del guion mete una
partida de prueba en la tabla real de ese día.

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

Después de esas cinco fases, el **reto diario cambió de formato**: de 12
rondas cronometradas a una bandera tapada en nueve piezas
(`js/daily.js`). El razonamiento está en la sección 4 de
`docs/decisiones-producto.md`.

Para el detalle de cada hallazgo y por qué se decidió cada cosa, la
auditoría original sigue siendo la referencia más completa.
