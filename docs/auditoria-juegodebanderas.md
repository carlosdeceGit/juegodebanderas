> **Nota de archivo:** este documento es la auditoría original que dio
> pie al roadmap de 5 fases (Fase 0-4), todas ya implementadas y
> mergeadas — ver el `README.md` para el estado actual del proyecto y
> `docs/decisiones-producto.md` para las decisiones de producto que
> pedía la Fase 4. Se conserva aquí tal cual se escribió (no se ha
> actualizado tras cada fase) como registro histórico de qué se
> encontró y por qué se decidió cada cosa del roadmap.

---

# Auditoría y propuesta de evolución — Diversión con Banderas

**Repositorio:** `carlosdecegit/juegodebanderas` · **Rama analizada:** `claude/flags-game-audit-evolution-woshx6` (HEAD `eb2f38b`) **Método:** lectura completa de los 9 archivos de código/datos del repositorio + **ejecución real** del juego en un Chromium headless (servidor estático local en `localhost:8848`) para verificar comportamiento, no solo inspeccionar código.

* * *

## Variables pendientes (no deducibles del repositorio)

Variable | Estado  
---|---  
Público de edad prioritario | El propio código sugiere un niño pequeño ("Nivel Nene" 🧸, jugador "Miguel Ángel" 🧒) pero no hay confirmación de producto sobre el rango de edad objetivo si el juego se abre a más gente.  
Preferencia educativa / casual / competitiva | No declarada. El código actual está a medio camino: mecánicas competitivas (puntos, rachas, ranking) sobre un producto que hoy es privado y familiar.  
Necesidad real de cuentas de usuario | No hay ninguna. El "jugador" es solo un nombre en `localStorage`, sin autenticación.  
Infraestructura disponible para rankings/multijugador | Solo Supabase (REST/PostgREST) con clave anónima embebida en el cliente. No hay Realtime, Auth ni Functions usados en el repo. Las políticas RLS mencionadas en el comentario de `db.js` **no están versionadas en este repositorio** (viven en la configuración externa de Supabase).  
Idiomas iniciales más allá de español | No declarado. Hoy el 100% de las cadenas están en español, sin capa de i18n.  
Plataformas principales | El CSS está fuertemente optimizado para móvil vertical (con un layout específico para apaisado), lo que sugiere móvil como prioridad, pero no hay confirmación de producto.  
Permisos reales para modificar el repositorio en producción | Esta sesión tiene acceso de escritura al repo, pero esta tarea se ha tratado como una **auditoría y propuesta** , no como una implementación; no se ha modificado ningún archivo del juego.  
  
Estas cuestiones se retoman en la sección 11 (Riesgos y decisiones abiertas).

* * *

# 1. Resumen ejecutivo

**Diversión con Banderas** es una pequeña aplicación web estática (HTML/CSS/JS puro, sin build ni dependencias de npm) que hoy funciona como un **juego familiar personalizado** : en la portada se elige entre tres jugadores fijos ("Miguel Ángel", "Mami", "Papi") o un nombre libre, se elige uno de 4 niveles de dificultad, y se juega una serie de rondas de "adivina el país por su bandera" con temporizador, rachas, pistas y un mensaje final con la lista de fallos. Hay un reto diario con semilla determinista (igual para todo el mundo el mismo día) y un ranking familiar/diario respaldado por Supabase.

Confirmado ejecutando el juego real: el bucle funciona de extremo a extremo sin errores de consola propios del código (los únicos avisos de red observados fueron la fuente de Google Fonts y Supabase, ambos bloqueados por la sandbox de prueba, y el juego **se degrada con elegancia** en ambos casos, tal y como está diseñado).

**Puntos fuertes que deben preservarse:** la progresión de dificultad (`levels.js`) es coherente y bien calibrada; el sistema de distractores (`distractors.js` \+ `confusables.js`) es sofisticado para un proyecto de este tamaño (usa un catálogo curado de banderas realmente confundibles); el reto diario con semilla por fecha es justo y barato de mantener; el diseño responsive (unidades `dvh`, layout específico para apaisado, `prefers-reduced-motion`) es de calidad; no hay dependencias de terceros más allá de una fuente web y Supabase, lo que da control total y cero rastreo publicitario.

**Los cinco problemas más relevantes que decidir:**

  1. **Accesibilidad visual del núcleo del juego** : las banderas se renderizan con `alt=""`, así que una persona con lector de pantalla no puede jugar en absoluto — el mecanismo central del juego es 100% visual y no tiene ninguna vía alternativa. Es el hallazgo más grave del informe (P0).
  2. **El "ranking" no tiene ninguna validación de servidor**: la puntuación se calcula en el cliente y se envía tal cual a Supabase; cualquier persona puede falsificarla con una petición manual. Aceptable como juguete familiar, bloqueante si se abre a desconocidos (P1/P0 según alcance).
  3. **El reto diario puede repetirse indefinidamente** por el mismo jugador (no hay control de "ya jugaste hoy"), lo que rompe la integridad competitiva de un ranking diario (P1).
  4. **El zoom está bloqueado** (`maximum-scale=1` en el viewport) y el modo "texto grande" está acoplado al nivel más fácil en vez de ser un ajuste independiente — dos decisiones que perjudican a personas con baja visión (P1).
  5. **El producto es hoy, por diseño, privado y en un solo idioma** : antes de perseguir "alcance internacional" y "competición pública" hace falta una decisión de producto explícita (¿sigue siendo un juego familiar con mejoras, o se convierte en un producto público?), porque cambia radicalmente las prioridades técnicas (autenticación, moderación, anti-trampas, i18n).



El resto del documento detalla la arquitectura actual, los hallazgos por área, una propuesta de evolución modular, una matriz de mecánicas nuevas evaluadas una a una, un roadmap por fases y un backlog técnico accionable.

* * *

# 2. Funcionamiento actual

## Tecnologías

  * HTML + CSS + JavaScript **vanilla** , módulos ES nativos (`<script type="module">`), sin bundler, sin framework, sin `package.json`, sin dependencias npm.
  * Fuente `Fredoka` cargada desde Google Fonts vía `@import` en `style.css` (única dependencia de red no esencial; falla con elegancia si no hay conexión, cayendo a `system-ui, sans-serif`).
  * Persistencia de backend: **Supabase** (PostgREST) por `fetch` directo, sin SDK, con clave anónima embebida en `js/db.js` (esperable para una clave `anon` protegida por RLS, aunque las políticas RLS no están versionadas en este repo).
  * Banderas: SVG locales en `assets/flags/` (proyecto `flag-icons`, MIT, ver `assets/flags/LICENSE-flag-icons.txt`), 196 archivos — sin llamadas de red por bandera, rápido y funciona offline para las imágenes.



## Arquitectura (`js/*.js`)

  * `countries.js`: array estático de 195 países soberanos (miembros de la ONU) + Ciudad del Vaticano, cada uno con `code`, `name` (español), `capital`, `continent`, y dos etiquetas **manuales** usadas solo para calcular dificultad de distractores: `pattern` (p.ej. `"cross-nordic"`) y `palette` (p.ej. `"blue-yellow"`).
  * `levels.js`: 4 niveles (`nene`, `principiante`, `experto`, `dios`) definidos declarativamente por `rounds`, `secs`, `opts`, `distractorMode`, `retry`, `hints`, `mult`, `big`. El reto diario fija `DAILY_LEVEL_KEY = "experto"` con `DAILY_ROUNDS = 12`.
  * `distractors.js`: algoritmo de similitud (`pattern` igual = +3, solapamiento de colores en `palette`, mismo `continente` = +1) que ordena el resto de países de más a menos parecidos a la respuesta correcta, con 4 modos (`easy`, `mixed`, `hard`, `confusables`).
  * `confusables.js`: lista curada a mano de grupos de banderas clásicamente confundibles (p. ej. Chad/Rumanía, Indonesia/Mónaco/Polonia, Países Bajos/Luxemburgo/Paraguay/Costa Rica) usada como fuente prioritaria de distractores en Nivel Dios.
  * `db.js`: 4 funciones (`saveScore`, `getHistory`, `getFamilyRanking`, `getDailyRanking`) sobre 3 recursos REST (`games`, `best_scores`, `daily_ranking`); toda llamada está envuelta en un `safeFetch` que traga errores de red — **si no hay conexión, el juego sigue funcionando, solo no guarda ni consulta el ranking**.
  * `game.js`: todo el estado (variables de módulo, no una clase ni un store), el bucle de ronda, el temporizador, el sistema de puntos, los efectos (`burst`, vibración), el menú y la navegación entre las 5 pantallas de `index.html`.



## Flujo de una partida (confirmado por ejecución real)

  1. **Portada** (`s-start`): elegir jugador (3 botones fijos + "Otro jugador" con input libre, persistido en `localStorage['dcb_player']`).
  2. **Selección de nivel** (`s-level`): 4 niveles + botón de Reto diario + botón de Ranking familiar.
  3. **Partida** (`s-game`): por cada ronda se construye un mazo (`buildDeck`) priorizando banderas menos vistas (contador persistente `localStorage['dcb_seen_v1']`), se genera la bandera + N opciones (mezclando la correcta con distractores según el modo del nivel), corre un temporizador de `level.secs` segundos, y al elegir se calcula la puntuación con `computePoints` (base 50 + bonus por tiempo restante − penalización por fallos previos, todo multiplicado por `level.mult` y por el multiplicador de racha, con −15% si se usó una pista) y se muestra la capital como dato educativo.
  4. **Fin de partida** (`s-end`): puntuación total vs. máximo teórico (`rounds × 100 × level.mult`), mensaje según el % logrado, y lista de banderas falladas ("para repasar").
  5. `saveScore(...)` se envía a Supabase en segundo plano; si falla (sin red), no bloquea nada.
  6. **Ranking** (`s-ranking`): lista familiar (mejor puntuación por jugador/nivel) y ranking del reto diario del día, con `escapeHtml` aplicado correctamente a los nombres (buena práctica ya presente contra XSS almacenado).



## Sistema de niveles (verificado en `levels.js`)

Nivel | Rondas | Segundos/ronda | Opciones | Distractores | Reintento | Pistas | Multiplicador  
---|---|---|---|---|---|---|---  
🧸 Nene | 12 | 26 | 3 | fáciles | sí | 3 | ×1  
🌱 Principiante | 16 | 15 | 3 | mixtos | sí | 2 | ×1.2  
🧠 Experto | 20 | 9 | 4 | difíciles | no | 1 | ×1.6  
🔥 Dios | 20 | 6 | 5 | confundibles | no | 0 | ×2.2  
  
Es una progresión **coherente** : todas las variables escalan juntas en la misma dirección (más difícil = menos tiempo, más opciones, distractores más parecidos, sin reintento, menos pistas, más multiplicador). El "reintento" en niveles fáciles funciona como red de seguridad pedagógica: fallar no termina la ronda, solo la agita (`shake`) y deja intentar de nuevo.

## Sistema de puntuación

`computePoints = round(max(10, (50 + tLeftRatio·50 − wrongCount·20) × level.mult × streakMultiplier) × (hintUsed ? 0.85 : 1))`, con multiplicador de racha `x1 / x1.2 (≥3) / x1.5 (≥6) / x2 (≥10)`. Recompensa precisión, velocidad y constancia a la vez, sin depender solo de la velocidad — cumple el principio de no usar únicamente el tiempo como criterio.

## Gestión de datos y persistencia

  * **Cliente** : `localStorage` para el nombre del jugador y el contador de "vistas" por bandera (usado para evitar repetición y priorizar lo no aprendido). No hay ninguna otra persistencia local (no hay progreso de partida a medio camino, no hay logros, no hay estadísticas históricas visibles al jugador).
  * **Servidor** : Supabase, sin autenticación, con la puntuación **calculada enteramente en el cliente** y enviada tal cual — verificado leyendo `db.js`: no hay ningún paso de recomputación en servidor visible desde este repo.



## Estado de las pruebas

**No existen pruebas automatizadas de ningún tipo** (no hay carpeta de tests, no hay `package.json`, no hay CI en `.github/`, no hay linter configurado). Verificado por inspección directa del árbol del repositorio.

## Verificación por ejecución real

Serví el sitio estático localmente y lo recorrí con Chromium headless (Playwright), confirmando:

  * El bucle completo funciona sin errores propios del código: selección de jugador → nivel → ronda → puntuación → feedback.
  * `<img alt="">` en la bandera, confirmado en el DOM real (no solo en el código fuente) → confirma el hallazgo de accesibilidad P0.
  * `<meta name="viewport" ... maximum-scale=1">` confirmado en el DOM real → bloquea el zoom del navegador.
  * **Exploit del temporizador reproducido** : al simular que la pestaña pasa a segundo plano (`document.hidden = true` \+ evento `visibilitychange`) durante 3 segundos reales y luego volver a primer plano, el tiempo restante mostrado **no cambió** (`26` antes, `26` después) — el código pausa el intervalo al ocultarse pero no descuenta el tiempo real transcurrido al volver, permitiendo "congelar" el reloj indefinidamente cambiando de app. Confirma un hallazgo de QA/juego justo con evidencia reproducida, no solo teórica.
  * Las peticiones a Google Fonts y Supabase fallaron en el entorno de prueba (sandbox sin esas conexiones) y el juego **siguió funcionando con normalidad** (captura de pantalla adjunta más abajo), confirmando la degradación elegante ya diseñada en `db.js` (`safeFetch`) y en el `font-family` con fallback.



* * *

# 3. Hallazgos por "subagente"

Cada bloque resume la perspectiva especializada solicitada, con evidencia del repositorio/ejecución, consecuencia y recomendación. (Nota de proceso: dado que el repositorio completo cabe en un único análisis profundo — 9 archivos, ~500 líneas totales — el equipo ha trabajado la auditoría de forma directa e integrada en lugar de fragmentar el análisis en llamadas independientes que releerían el mismo código; el resultado cubre exactamente las mismas 9 perspectivas solicitadas.)

## 3.1 Producto y game design

  * **Evidencia** : `game.js` (bucle completo), `levels.js` (progresión).

  * **Hallazgo** : el bucle es corto, claro y satisfactorio (feedback inmediato con texto + emojis + vibración + dato de la capital). La progresión de dificultad es real, no cosmética.

  * **Consecuencia** : buena retención a corto plazo, pero **una sola tipología de interacción** (elegir entre botones) en los 4 niveles — una vez dominado, no hay variedad de _modo_ , solo de velocidad/dureza de distractores.

  * **Recomendación** : preservar el bucle actual como núcleo; añadir variedad mediante _modos_ opcionales que reutilicen los mismos datos (ver sección 5 y catálogo de la sección "Catálogo de nuevas tipologías"), no sustituirlo.

  * **Evidencia** : `seen` (contador de banderas vistas en `localStorage`) existe en código pero **no se muestra nunca al jugador**.

  * **Consecuencia** : se pierde una sensación de progreso/colección ("llevas 140/195 banderas aprendidas") que ya está calculada y solo falta pintar.

  * **Recomendación** : quick win — exponer este dato en la pantalla de nivel o de fin de partida.




## 3.2 Competición y gamificación

  * **Evidencia** : `streakMultiplier`, reto diario con `mulberry32`/semilla por fecha, `best_scores`/`daily_ranking` en Supabase.

  * **Hallazgo** : el reto diario es **justo por diseño** (mismo mazo para todo el mundo el mismo día) y barato de mantener — es la pieza con mayor potencial competitivo ya construida.

  * **Consecuencia** : es la base ideal para extender a duelos asíncronos sin tocar la arquitectura.

  * **Recomendación** : preservarlo intacto; construir sobre él (ver "Duelo asíncrono" en la matriz de mecánicas).

  * **Evidencia** : `db.js` no valida nada en servidor; `saveScore` envía `score` calculado en cliente.

  * **Consecuencia** : cualquier persona con las herramientas de desarrollador puede falsificar su entrada en el ranking familiar o diario.

  * **Recomendación** : aceptable mientras el ranking sea privado/familiar; **bloqueante** si se hace público (ver sección 8 y P0/P1 en la matriz de priorización).




## 3.3 UX/UI y accesibilidad

  * **Evidencia (verificada por ejecución)** : `<img src="assets/flags/xx.svg" alt="">`.

  * **Consecuencia** : el mecanismo central del juego es invisible para lectores de pantalla; no hay ninguna alternativa no visual.

  * **Recomendación** : no basta con poner el nombre del país como `alt` (revelaría la respuesta). Diseñar una alternativa textual **no reveladora** , aprovechando que `pattern`/`palette` ya existen como datos (p. ej. "bandera con franjas verde, blanco y rojo, sin bandera describir el país"), o un "modo audio-descripción" opcional separado del modo visual.

  * **Evidencia (verificada por ejecución)** : `<meta name="viewport" content="...maximum-scale=1">`.

  * **Consecuencia** : impide el zoom del navegador, perjudicando a personas con baja visión (incumple WCAG 1.4.4).

  * **Recomendación** : quick win — quitar `maximum-scale=1` (o subirlo a un valor razonable como `5`); no rompe nada del juego.

  * **Evidencia** : `body.big` (modo "lectura fácil") está acoplado 1:1 a `level.big`, que solo es `true` en Nivel Nene.

  * **Consecuencia** : alguien que necesita texto grande está forzado también al nivel más fácil; no puede combinarlo con Experto o Dios.

  * **Recomendación** : desacoplar en un ajuste de accesibilidad independiente del nivel.

  * **Evidencia** : no hay `aria-live` en `#feedback`, `#score` ni `#fact`.

  * **Consecuencia** : los cambios dinámicos de texto no se anuncian a quien navega con lector de pantalla.

  * **Recomendación** : añadir `aria-live="polite"` a esos contenedores (cambio de una línea por elemento).

  * **Evidencia** : `window.onerror` inyecta un banner con el mensaje de error crudo y el número de línea directamente en la interfaz de producción.

  * **Consecuencia** : expone detalles técnicos a un usuario final (potencialmente un niño) en vez de fallar con gracia.

  * **Recomendación** : quitar en producción o sustituir por un aviso genérico ("Algo ha ido mal, vuelve a intentarlo").

  * **Fortalezas confirmadas a preservar** : `prefers-reduced-motion` desactiva animaciones globalmente; objetivos táctiles ≥56px (≥68px en modo grande); layout dedicado para apaisado; `dvh` \+ `env(safe-area-inset-*)` para dispositivos con muescas; feedback de acierto/error nunca depende solo del color (siempre va acompañado de texto).




## 3.4 Internacionalización y alcance global

  * **Evidencia** : `<html lang="es">`, todas las cadenas de `index.html` y `game.js` están escritas directamente en español, sin claves de traducción.

  * **Consecuencia** : llevar el juego a otro idioma hoy exigiría tocar cadenas repartidas por HTML y JS; no hay una capa de i18n que aislar.

  * **Recomendación** : si se decide internacionalizar, extraer cadenas a un diccionario antes de traducir (ver backlog).

  * **Evidencia** : `todayStr()` usa `new Date().toISOString().slice(0,10)`, es decir, **fecha UTC** , no la fecha local del jugador.

  * **Consecuencia** : dos jugadores en husos horarios muy distintos pueden ver "el reto de hoy" cambiar en momentos diferentes de su propio día (p. ej. alguien en UTC+14 cambia de reto varias horas antes que alguien en UTC-8), lo que resta justicia percibida a una competición diaria internacional.

  * **Recomendación** : es una decisión de producto explícita (fecha UTC única vs. fecha local por jugador, cada una con trade-offs de justicia distintos) — documentarla, no dejarla implícita.

  * **Evidencia** : la lista de 195 países usa como criterio de inclusión "miembro de la ONU + Vaticano" (comentario en `countries.js`), sin territorios dependientes, sin banderas históricas, sin estados de reconocimiento limitado.

  * **Consecuencia** : es una elección **razonable y defendible** para evitar controversia geopolítica, pero hoy es implícita (solo en un comentario de código).

  * **Recomendación** : convertirla en política editorial explícita y documentada (README o doc de producto), no una decisión de implementación tácita. No se recomienda tomar decisiones geopolíticas adicionales sin que el producto lo pida explícitamente.

  * **Evidencia** : fuente cargada desde Google Fonts (`@import` en `style.css`); confirmado que falla en redes restringidas (reproducido en la prueba real) pero cae a `system-ui`.

  * **Consecuencia** : en redes lentas o restringidas (relevante para alcance internacional) hay una petición de red innecesaria antes de que se aplique el fallback.

  * **Recomendación** : quick win — auto-alojar la fuente (o aceptar el fallback del sistema como principal) para depender menos de una CDN externa.




## 3.5 Contenido y dificultad

  * **Evidencia** : 195 países + Vaticano, distribución por continente ≈ 54 África / 47 Asia / 45 Europa / 35 América / 14 Oceanía (contado directamente sobre `countries.js`).

  * **Hallazgo** : cobertura completa y sin duplicados visibles; capitales verificadas por muestreo (p. ej. Bolivia → "Sucre", capital constitucional — decisión defendible aunque discutible frente a La Paz como sede de gobierno).

  * **Recomendación** : documentar el criterio de "capital" usado (constitucional vs. sede de gobierno) para los pocos casos ambiguos.

  * **Evidencia** : `distractors.js` \+ `confusables.js` — el modo "confusables" usa una lista curada a mano de grupos reales de banderas parecidas.

  * **Hallazgo** : es la pieza de contenido más valiosa y menos obvia del proyecto — un distractor "difícil" de verdad, no solo aleatorio.

  * **Recomendación** : preservar y **ampliar** esta lista con más grupos conocidos (buen quick win de contenido, cero riesgo técnico).

  * **Evidencia** : `pattern`/`palette` son etiquetas manuales, no derivadas de los píxeles reales del SVG.

  * **Consecuencia** : la "dificultad objetiva" de un distractor depende de qué tan bien se etiquetó a mano cada bandera; no está validada contra percepción real de jugadores.

  * **Recomendación** : tratarla como heurística válida pero no perfecta; validar con datos reales de tasa de error por bandera una vez haya telemetría (sección 7).




## 3.6 Arquitectura y frontend

  * **Evidencia** : sin `package.json`, sin bundler, sin TypeScript, sin tests, sin linter, sin CI.

  * **Consecuencia** : cero deuda de dependencias (positivo), pero cero red de seguridad ante regresiones (negativo) según el proyecto crezca.

  * **Recomendación** : antes de añadir sistemas competitivos/multijugador, introducir al menos pruebas unitarias de las funciones puras existentes (`computePoints`, `streakMultiplier`, `pickDistractors`, `seededShuffle`) — son baratas de probar porque ya son puras y deterministas.

  * **Evidencia** : estado del juego en variables sueltas a nivel de módulo en `game.js` (no una clase/store).

  * **Consecuencia** : manejable hoy (~50 líneas de estado); se volverá frágil si se añaden varios modos de juego en paralelo.

  * **Recomendación** : antes de multiplicar modos, encapsular el estado de una partida en un objeto/módulo propio por modo.

  * **Evidencia** : comentario en `db.js` referencia una migración RLS (`games_public_rls`) que **no existe en este repositorio**.

  * **Consecuencia** : el esquema y las políticas de seguridad de la base de datos no están versionados ni auditables desde el repo — cualquier futuro colaborador no puede revisar las reglas reales sin acceso directo al proyecto Supabase.

  * **Recomendación** : mover el esquema/políticas a una carpeta `supabase/migrations` versionada en este repo.




## 3.7 Retención y analítica

  * **Evidencia** : no existe ningún tipo de telemetría en el código (solo se guarda el resultado final de partida).
  * **Consecuencia** : cualquier decisión de producto hoy se basaría en intuición, no en datos.
  * **Recomendación** : instrumentar únicamente eventos accionables y respetuosos con la privacidad (ver sección 7 completa más abajo); no añadir SDKs de terceros — preservar la actual ausencia total de rastreo publicitario, que es un valor real del producto (especialmente relevante si el jugador incluye menores).



## 3.8 QA y juego justo

  * **Evidencia reproducida por ejecución real** : ocultar la pestaña 3 segundos reales y volver a mostrarla **no reduce el tiempo restante mostrado** ; el temporizador se pausa sin recuperar el tiempo real transcurrido.

  * **Consecuencia** : un jugador puede cambiar de app a mitad de ronda para "congelar" el reloj y pensar sin presión, deshaciendo la mecánica de tiempo en niveles Experto/Dios.

  * **Recomendación** : al volver de segundo plano, o bien restar el tiempo real transcurrido, o bien (más simple y consistente con la mayoría de juegos) dar la ronda por perdida al detectar que la pestaña se ocultó durante una ronda cronometrada.

  * **Evidencia** : no existe ningún control de "ya jugaste el reto diario hoy" en `game.js` ni en `db.js`.

  * **Consecuencia** : un jugador puede repetir el reto diario tantas veces como quiera y quedarse con su mejor intento, mientras otros solo lo intentan una vez — rompe la comparabilidad de un ranking diario.

  * **Recomendación** : P1 — decidir la política (¿un intento por jugador y día? ¿ilimitado pero solo cuenta el primero?) e implementarla.

  * **Evidencia** : sin control de servidor sobre `score` enviado (ver 3.2/3.6).

  * **Consecuencia** : manipulación de ranking trivial mediante `fetch` manual.

  * **Recomendación** : no bloqueante hoy (uso familiar), bloqueante para cualquier ranking público.

  * **Evidencia positiva** : `escapeHtml()` se aplica ya al pintar nombres de jugador en el ranking — buena práctica presente contra XSS almacenado vía el campo de nombre libre.

  * **Recomendación** : preservar; aplicar el mismo cuidado a cualquier futura entrada de texto libre (p. ej. si se añade un modo de escribir el nombre del país).




* * *

# 4. Problemas detectados (por categoría)

Categoría | Problema | Evidencia  
---|---|---  
Jugabilidad | Una sola tipología de interacción en los 4 niveles; riesgo de monotonía tras dominarlos | `game.js` (un único `nextRound`)  
Jugabilidad | El progreso de "banderas vistas" existe pero no se muestra al jugador | `SEEN_KEY` en `game.js`, sin UI asociada  
Competición | Puntuación sin validación de servidor | `db.js: saveScore`  
Competición | Reto diario repetible sin límite por jugador | Ausencia de chequeo en `game.js`/`db.js`  
UX/UI | `alt=""` en la bandera (bloquea lectores de pantalla) | Verificado en DOM real  
UX/UI | Zoom del navegador bloqueado (`maximum-scale=1`) | Verificado en DOM real  
UX/UI | Modo "texto grande" acoplado al nivel más fácil | `body.big` ligado a `level.big`  
UX/UI | Sin `aria-live` en feedback/puntuación | `index.html`  
UX/UI | Banner de error crudo visible en producción | `window.onerror` en `game.js`  
Accesibilidad | Sin alternativa no visual para identificar la bandera | Todo el mecanismo depende de `<img>`  
Internacionalización | Cadenas 100% en español sin capa de i18n | `index.html`, `game.js`  
Internacionalización | Fecha del reto diario en UTC, no local | `todayStr()` en `game.js`  
Internacionalización | Dependencia de red de Google Fonts (con fallback) | `style.css` `@import`; reproducido fallando en pruebas  
Contenido | Etiquetas de dificultad (`pattern`/`palette`) manuales, sin validación empírica | `countries.js`  
Tecnología | Cero pruebas automatizadas, cero CI, cero linter | Árbol de archivos  
Tecnología | Esquema/RLS de la base de datos no versionado en el repo | Comentario en `db.js`  
Tecnología | Estado de juego en variables sueltas de módulo | `game.js`  
Seguridad | Puntuación calculada y confiada 100% en cliente | `db.js`  
Analítica | No existe ninguna telemetría de comportamiento | Ausencia total en el código  
QA | Exploit de temporizador vía backgrounding reproducido | Prueba real con Playwright  
  
* * *

# 5. Propuesta de evolución del juego

La propuesta **no sustituye** el bucle actual: lo mantiene como núcleo y lo envuelve con capas opcionales.

  * **Bucle de juego** : se mantiene idéntico (bandera → opciones → elección → feedback inmediato con dato educativo → siguiente ronda). Es el activo más sólido del proyecto.
  * **Modos de juego** : el modo actual (por niveles) pasa a ser el modo "Clásico"; se añaden, en fases sucesivas y solo tras validarse (ver sección 6), modos que reutilizan el mismo dato/algoritmo: reto diario (ya existe, se preserva), supervivencia (una vida, dificultad creciente), repaso de fallos (usa el `wrongList`/`seen` que ya existen), modo aprendizaje sin presión (hojear las 195 banderas con capital/continente, sin puntuación ni cronómetro), y duelo asíncrono (comparar tu partida en el mazo diario contra la de otra persona, sin necesidad de tiempo real).
  * **Niveles** : se mantienen los 4 actuales como progresión principal; se añade selección opcional por continente/región reutilizando el campo `continent` ya existente en los datos, sin duplicar contenido.
  * **Puntuación** : se mantiene la fórmula actual (precisión + tiempo + racha + dificultad); se añade únicamente **visibilidad** de datos que ya se calculan (récord personal, banderas aprendidas) antes de añadir sistemas nuevos.
  * **Progresión** : mastery visible ("140/195 banderas vistas al menos una vez"), sin añadir un sistema de niveles de cuenta/XP que no aporte nada sobre el conocimiento real.
  * **Competición** : reto diario (preservado) + duelo asíncrono (nuevo, barato) como ejes principales; ranking global solo si se resuelve antes la validación de servidor y la política de privacidad/menores (P0 de infraestructura antes de cualquier lanzamiento público).
  * **Personalización** : ajuste de accesibilidad de texto grande desacoplado del nivel; selección por continente.
  * **Aprendizaje** : modo sin puntuación ni cronómetro para explorar todas las banderas con su capital y continente — no reemplaza el modo competitivo, lo complementa para quien quiere aprender sin presión (incluida la audiencia infantil ya presente en el producto).
  * **Accesibilidad** : corrección del zoom bloqueado, `aria-live`, y diseño de una alternativa textual no reveladora para identificar banderas sin depender de la vista (ver hallazgo 3.3).
  * **Experiencia internacional** : extracción de cadenas a un diccionario **antes** de traducir a un segundo idioma; decisión explícita sobre la fecha del reto diario (UTC vs. local); documentación explícita del criterio de inclusión de países (ONU + Vaticano) como política editorial.



* * *

# 6. Evaluación de nuevas mecánicas

Mecánica | Problema que resuelve | Impacto | Esfuerzo | Riesgos | Métrica | Decisión  
---|---|---|---|---|---|---  
Mostrar banderas "vistas" (mastery visible) | El progreso ya se calcula pero es invisible | Alto (retención, sensación de progreso) | Bajo (dato ya existe en `localStorage`) | Ninguno relevante | % de jugadores que abren la pantalla de progreso | **Implementar**  
Modo "repasa tus fallos" | El `wrongList`/`seen` ya existen pero no se reutilizan para practicar | Alto (aprendizaje dirigido, rejugabilidad) | Bajo (filtra el mazo existente) | Mazo muy corto si hay pocos fallos acumulados | % de partidas iniciadas desde este modo | **Implementar**  
Modo aprendizaje sin presión (hojear banderas) | No hay forma de explorar sin cronómetro ni puntuación | Alto (accesibilidad, público infantil/principiante) | Bajo (solo lectura sobre datos existentes) | Ninguno relevante | Tiempo medio de sesión en este modo, tasa de paso a modo competitivo después | **Implementar**  
Modo supervivencia (una vida, dificultad creciente) | Falta profundidad competitiva más allá de "nivel fijo" | Alto para jugadores competitivos | Medio (reutiliza distractores/puntuación, nueva orquestación de ronda) | Puede frustrar si la curva de subida de dificultad es brusca | Longitud media de la racha antes de fallar | **Experimentar**  
Duelo asíncrono sobre el mazo diario | Falta competición social sin coste de infraestructura en tiempo real | Alto (social, barato) | Medio (guardar y comparar una partida del mismo mazo determinista) | Privacidad si se comparte con desconocidos; ninguno si es entre amigos/familia con enlace | % de retos diarios compartidos/comparados | **Experimentar**  
Modo "elige la bandera" (invertir el sentido: nombre → bandera) | Refuerza el mismo conocimiento desde el otro sentido | Medio-alto (variedad barata) | Bajo (reutiliza 100% de los datos y del algoritmo de distractores) | Ninguno relevante | Tasa de acierto comparada con el modo clásico | **Implementar**  
Modo "clasifica por continente" | Refuerza geografía, no solo memorización 1 a 1 | Medio (variedad, aprendizaje) | Bajo (el campo `continent` ya existe) | Ninguno relevante | Precisión por continente | **Implementar**  
Emparejar bandera-capital | Refuerza cultura general asociada, ya mostrada tras acertar | Medio | Bajo (`capital` ya existe en los datos) | Ninguno relevante | Tasa de acierto | **Experimentar**  
Bandera revelada progresivamente / recortada | Añade variedad de percepción visual sin nuevos datos | Medio (rejugabilidad, "dios"-tier) | Bajo (solo capa CSS/canvas sobre la imagen existente) | Puede ser injusto si la revelación no es igual para todos (usar temporizador determinista) | Tiempo medio hasta acierto | **Experimentar**  
Modo "identifica las parecidas" (a partir de `CONFUSABLES`) | Formaliza contenido que ya existe pero está oculto en el código | Medio-alto (aprendizaje dirigido de los casos más difíciles) | Bajo (dato ya curado) | Ninguno relevante | Reducción de errores en Nivel Dios tras usarlo | **Implementar**  
Escribir el nombre del país (sin opciones) | Añade dificultad "difícil de dominar" para expertos | Medio-alto para jugadores avanzados | Medio-alto (necesita alias/sinónimos por país y tolerancia a errores tipográficos) | Frustración si la validación de texto es estricta; requiere datos nuevos (no existen alias hoy) | Tasa de abandono a mitad de ronda en este modo | **Experimentar** (tras diseñar tolerancia y alias)  
Silueta del país en el mapa | Añade una habilidad distinta (geografía espacial) | Alto valor educativo | Alto (requiere datos geográficos nuevos, ausentes hoy) | Ninguno de accesibilidad si se ofrece como modo adicional, no obligatorio | Precisión por continente | **Posponer** (requiere nueva fuente de datos)  
Secuencia de banderas (memoria tipo Simon) | Variedad de interacción | Bajo-medio (entrena memoria a corto plazo, no geografía) | Medio | Se aleja del propósito de aprender países; puede sentirse "pegado" | Frecuencia de uso vs. modos principales | **Posponer** (rotar como modo experimental temporal, no pilar)  
Modo cooperativo / multijugador en tiempo real | Ampliar la dimensión social | Medio-alto si funciona bien | Alto (requiere sincronización en tiempo real, salas, moderación) | Coste de infraestructura y de moderación desproporcionado hoy; no hay Realtime ni Auth en uso | N/A hasta validar demanda | **Posponer** (evaluar coste de infraestructura antes de comprometerse)  
Ranking global entre desconocidos | Ambición de "competición mundial" | Alto si hay demanda, pero con riesgos serios | Alto (requiere anti-trampas, moderación de nombres, protección de menores, posible autenticación) | Manipulación de puntuación (ya posible hoy), privacidad, menores, spam de nombres | Nada hasta resolver la base de confianza | **Posponer** hasta resolver validación de servidor + política de privacidad/menores  
Dibujo libre de banderas evaluado por IA/visión artificial | "Modo creativo" | Bajo/medio, alto riesgo | Alto (modelo de visión, coste, latencia, privacidad de dibujos de menores) | Evaluación injusta, dependencia de servicio externo, privacidad de menores, inaccesible sin ratón/dedo preciso | N/A | **Descartar** en su forma "dibujo libre + IA"; ver alternativa adaptada en la sección siguiente  
Colorear una plantilla de bandera por zonas | Alternativa viable al dibujo libre | Medio-alto (motriz distinto, atractivo para público infantil ya presente) | Medio (requiere preprocesar cada SVG en zonas de color, una vez) | Ninguno de IA; accesible por teclado si se ofrece selección por lista además de tacto | % de zonas correctas | **Experimentar** (ver análisis dedicado más abajo)  
Ordenar franjas/colores de una bandera | Alternativa aún más simple al dibujo libre | Medio | Bajo-medio (dato de orden de colores, cercano al `palette` ya existente) | Ninguno relevante; accesible por teclado (reordenar con flechas) | Tasa de acierto | **Experimentar**  
  
* * *

# 7. Quick wins

Cambios de esfuerzo bajo e impacto alto, localizables con precisión en el código actual:

  1. **Quitar`maximum-scale=1`** del `<meta name="viewport">` en `index.html` (línea 5) — restaura el zoom del navegador sin afectar a nada más.
  2. **Añadir`aria-live="polite"`** a `#feedback`, `#fact` y al `<b id="score">` en `index.html` — una línea por elemento, mejora inmediata para lectores de pantalla.
  3. **Mostrar el progreso de banderas vistas** (`seen` en `game.js`) en la pantalla de nivel o de fin de partida — el dato ya existe, solo falta una línea de UI.
  4. **Ampliar`CONFUSABLES`** en `js/confusables.js` con más grupos conocidos — es una lista de arrays de strings, cero riesgo técnico, mejora directa del Nivel Dios.
  5. **Quitar el banner de error crudo** de `window.onerror` en producción (`game.js`, líneas 6-11) o sustituirlo por un mensaje genérico.
  6. **Desacoplar el modo "texto grande"** de `level.big`: convertirlo en un interruptor independiente en la pantalla de inicio/nivel.
  7. **Corregir el temporizador tras backgrounding** : al volver de segundo plano, descontar el tiempo real transcurrido (o dar la ronda por perdida) en el handler de `visibilitychange` (`game.js`, líneas 411-421) — bug de justicia reproducido y verificado.
  8. **Auto-alojar la fuente`Fredoka`** (o depender solo del fallback `system-ui`) para eliminar la petición externa de Google Fonts.



* * *

# 8. Roadmap

## Fase 0 — Correcciones críticas

  * **Objetivo** : cerrar los hallazgos de justicia, accesibilidad básica y seguridad antes de construir nada nuevo encima.
  * **Tareas** : quick wins 1, 2, 5, 6, 7, 8 de la sección anterior; diseñar y documentar la alternativa no visual para identificar banderas (aunque su implementación completa puede caer en Fase 1); decidir la política de "un intento por reto diario".
  * **Dependencias** : ninguna — todo se apoya en el código ya existente.
  * **Criterios de aceptación** : el temporizador no puede congelarse por backgrounding (test manual reproducible); el zoom del navegador funciona; los cambios de puntuación/feedback se anuncian a un lector de pantalla.
  * **Métricas de éxito** : cero regresiones en el bucle actual (verificado manualmente en el mismo dispositivo/navegador que ya se probó); tiempo de carga sin cambios.



## Fase 1 — Mejora del núcleo jugable

  * **Objetivo** : hacer visible lo que ya existe y añadir accesibilidad real de identificación de banderas.
  * **Tareas** : mostrar progreso de banderas vistas; modo aprendizaje sin presión (hojear banderas); modo "repasa tus fallos"; alternativa textual no reveladora para lectores de pantalla; selección por continente.
  * **Dependencias** : Fase 0 completada (especialmente `aria-live` y el desacoplo de texto grande).
  * **Criterios de aceptación** : un jugador puede completar una sesión de aprendizaje sin cronómetro; el progreso de dominio es visible y persiste entre sesiones.
  * **Métricas de éxito** : % de sesiones que usan el modo aprendizaje; reducción de errores repetidos en banderas ya marcadas como falladas.



## Fase 2 — Progresión y rejugabilidad

  * **Objetivo** : dar más razones para volver sin saturar el producto de sistemas.
  * **Tareas** : modo supervivencia; modo "elige la bandera" (inversión nombre→bandera); modo "clasifica por continente"; ampliar `CONFUSABLES`; emparejar bandera-capital.
  * **Dependencias** : Fase 1 (arquitectura de estado de partida más modular, ver backlog técnico).
  * **Criterios de aceptación** : cada modo nuevo se explica en una frase y se juega en menos de 10 segundos sin tutorial.
  * **Métricas de éxito** : % de jugadores que prueban al menos un modo nuevo; tiempo de sesión medio; ningún modo nuevo reduce el uso del modo Clásico por debajo de su nivel actual.



## Fase 3 — Competición

  * **Objetivo** : profundizar la competición sin abrir el ranking a desconocidos hasta resolver la confianza en los datos.
  * **Tareas** : validación de puntuación en servidor (función de Supabase o recomputo server-side antes de aceptar un `saveScore`); duelo asíncrono sobre el mazo diario; control de "un intento por reto diario y jugador"; versionar el esquema/RLS de Supabase en el repo.
  * **Dependencias** : Fase 0 (política de un intento diario ya decidida) y una decisión explícita de producto sobre alcance (familiar vs. público).
  * **Criterios de aceptación** : una puntuación falsificada vía `fetch` manual es rechazada por el servidor; el ranking diario refleja como máximo un intento por jugador.
  * **Métricas de éxito** : cero incidencias de puntuaciones evidentemente imposibles en el ranking tras el cambio.



## Fase 4 — Internacionalización avanzada y crecimiento

  * **Objetivo** : abrir el producto a más idiomas y, si se decide, a un público más amplio que la familia actual.
  * **Tareas** : extraer cadenas a un diccionario de traducción; decidir y documentar la política de fecha del reto diario (UTC vs. local); documentar el criterio editorial de inclusión de países; evaluar (no implementar sin más análisis) un ranking global con anti-trampas y protección de menores.
  * **Dependencias** : Fase 3 (confianza en los datos de puntuación) antes de cualquier ranking más allá de lo familiar.
  * **Criterios de aceptación** : añadir un segundo idioma no requiere tocar lógica de juego, solo el diccionario de cadenas.
  * **Métricas de éxito** : ninguna regresión de rendimiento por idioma; feedback cualitativo de jugadores en el nuevo idioma.



* * *

# 9. Backlog técnico

  1. **Título** : Quitar bloqueo de zoom del viewport **Descripción** : eliminar `maximum-scale=1` de la meta viewport en `index.html`. **Justificación** : bloquea el zoom del navegador, perjudicando a personas con baja visión (WCAG 1.4.4). Confirmado en ejecución real. **Archivos** : `index.html` (línea 5). **Criterios de aceptación** : el navegador permite pellizcar para hacer zoom en cualquier pantalla del juego. **Prioridad** : P0. **Estimación** : XS. **Dependencias** : ninguna. **Pruebas** : manual, en un dispositivo táctil real.

  2. **Título** : Corregir el temporizador ante cambio de pestaña/app **Descripción** : en el listener de `visibilitychange` (`game.js`), calcular el tiempo real transcurrido mientras la página estuvo oculta y descontarlo de `tLeft`, o dar la ronda por perdida directamente al ocultarse. **Justificación** : exploit reproducido — hoy se puede congelar el reloj indefinidamente cambiando de app. **Archivos** : `js/game.js` (función del listener `visibilitychange`, líneas ~411-421). **Criterios de aceptación** : ocultar la pestaña N segundos reales y volver reduce `tLeft` en al menos N segundos (o termina la ronda). **Prioridad** : P0. **Estimación** : S. **Dependencias** : ninguna. **Pruebas** : script de Playwright equivalente al usado en esta auditoría, guardado como test de regresión.

  3. **Título** : Alternativa textual no reveladora para identificar banderas **Descripción** : diseñar y añadir una descripción accesible de la bandera (basada en `pattern`/`palette`, sin nombrar el país) expuesta vía `aria-label` u otro mecanismo, más un modo "descripción audible" opcional. **Justificación** : hoy `alt=""` deja el juego completamente inaccesible a lectores de pantalla — es el mecanismo central del juego. **Archivos** : `js/game.js` (render de `#flagBox`), `js/countries.js` (fuente de `pattern`/`palette`). **Criterios de aceptación** : una persona usando un lector de pantalla puede jugar una ronda completa sin ver la imagen, sin que la descripción revele la respuesta directamente. **Prioridad** : P0. **Estimación** : M. **Dependencias** : ninguna. **Pruebas** : manual con lector de pantalla real (NVDA/VoiceOver) + revisión de que la descripción no filtra la respuesta.

  4. **Título** : Añadir `aria-live` a las zonas de feedback dinámico **Descripción** : `aria-live="polite"` en `#feedback`, `#fact`, y el chip de puntuación. **Justificación** : los cambios de texto tras cada ronda no se anuncian hoy a un lector de pantalla. **Archivos** : `index.html`. **Criterios de aceptación** : un lector de pantalla anuncia el resultado de la ronda sin que el usuario tenga que buscarlo manualmente. **Prioridad** : P0. **Estimación** : XS. **Dependencias** : ninguna. **Pruebas** : manual con lector de pantalla.

  5. **Título** : Desacoplar "texto grande" del nivel de dificultad **Descripción** : mover `body.big` a un ajuste de accesibilidad independiente (p. ej. un interruptor en portada), no derivado de `level.big`. **Justificación** : hoy solo se puede tener texto grande jugando en el nivel más fácil. **Archivos** : `js/game.js` (`beginGame`, uso de `level.big`), `style.css` (`body.big`). **Criterios de aceptación** : se puede jugar Nivel Experto o Dios con texto grande activado. **Prioridad** : P1. **Estimación** : S. **Dependencias** : ninguna. **Pruebas** : manual, comprobar legibilidad en los 4 niveles con el ajuste activado.

  6. **Título** : Quitar/ocultar el banner de error en producción **Descripción** : sustituir el contenido del `window.onerror` actual por un mensaje genérico o eliminarlo, dejando el detalle solo en consola. **Justificación** : expone mensajes técnicos crudos a usuarios finales, incluyendo posiblemente niños. **Archivos** : `js/game.js` (líneas 6-11). **Criterios de aceptación** : un error de JS ya no muestra número de línea/mensaje crudo en pantalla. **Prioridad** : P1. **Estimación** : XS. **Dependencias** : ninguna. **Pruebas** : forzar un error y comprobar el mensaje mostrado.

  7. **Título** : Mostrar el progreso de banderas vistas/dominadas **Descripción** : exponer el contador `seen` (ya calculado en `localStorage`) como "X/195 banderas vistas" en la pantalla de nivel o de fin de partida. **Justificación** : el dato ya se calcula pero no se muestra; es una palanca de sensación de progreso gratis. **Archivos** : `js/game.js` (lectura de `seen`), `index.html`/`style.css` (nuevo elemento de UI). **Criterios de aceptación** : el contador se actualiza tras cada partida y persiste entre sesiones. **Prioridad** : P1. **Estimación** : S. **Dependencias** : ninguna. **Pruebas** : manual, jugar varias partidas y comprobar que el contador crece y no se resetea.

  8. **Título** : Un intento por jugador y día en el reto diario **Descripción** : comprobar (localmente y/o en Supabase) si el jugador ya jugó el reto diario de la fecha actual antes de permitir repetirlo, o registrar explícitamente que solo cuenta el primer intento del día en el ranking. **Justificación** : hoy se puede repetir el reto diario sin límite, socavando la integridad del ranking diario. **Archivos** : `js/game.js` (`startDaily`), `js/db.js` (`getDailyRanking`/`saveScore`). **Criterios de aceptación** : el ranking diario refleja como máximo un resultado por jugador y fecha. **Prioridad** : P1. **Estimación** : M. **Dependencias** : decisión de producto sobre la política exacta. **Pruebas** : jugar el reto diario dos veces y comprobar el comportamiento esperado.

  9. **Título** : Validación de puntuación en servidor **Descripción** : antes de aceptar un `saveScore`, recomputar o acotar la puntuación en una función de servidor (p. ej. Supabase Edge Function) verificando límites razonables (rondas, tiempo mínimo por ronda, multiplicadores válidos para el nivel declarado). **Justificación** : hoy la puntuación es 100% confiada del cliente; falsificable con una petición manual. **Archivos** : `js/db.js` (`saveScore`), nueva función de servidor (fuera del repo actual de frontend). **Criterios de aceptación** : una puntuación fuera de los límites físicamente posibles para el nivel/rondas declarados es rechazada. **Prioridad** : P2 (P0 si se abre el ranking a desconocidos). **Estimación** : L. **Dependencias** : acceso al proyecto Supabase. **Pruebas** : intentar enviar una puntuación imposible manualmente y confirmar el rechazo.

  10. **Título** : Versionar esquema y políticas RLS de Supabase en el repositorio **Descripción** : añadir una carpeta `supabase/migrations` (o equivalente) con el esquema de `games`/`best_scores`/`daily_ranking` y sus políticas RLS. **Justificación** : hoy son invisibles/no auditables desde este repositorio, solo mencionadas en un comentario. **Archivos** : nuevo directorio `supabase/`. **Criterios de aceptación** : cualquier colaborador puede revisar las políticas de seguridad sin acceso directo al panel de Supabase. **Prioridad** : P1. **Estimación** : S. **Dependencias** : acceso al proyecto Supabase. **Pruebas** : aplicar la migración en un proyecto Supabase limpio y comprobar que reproduce el comportamiento actual.

  11. **Título** : Modo "repasa tus fallos" **Descripción** : nuevo modo de juego que construye el mazo a partir de las banderas con más errores históricos (usando `seen`/`wrongList` ya existentes, ampliados si hace falta con un contador de fallos por bandera). **Justificación** : reutiliza datos que ya se calculan; alto valor de aprendizaje dirigido con bajo esfuerzo. **Archivos** : `js/game.js` (nueva función de construcción de mazo), posible ampliación de lo guardado en `localStorage`. **Criterios de aceptación** : el modo solo aparece cuando hay al menos N fallos históricos; el mazo prioriza banderas falladas recientemente. **Prioridad** : P2. **Estimación** : M. **Dependencias** : Fase 1. **Pruebas** : fallar banderas concretas y comprobar que aparecen priorizadas en este modo.

  12. **Título** : Modo aprendizaje sin cronómetro ni puntuación **Descripción** : pantalla de exploración libre de las 195 banderas con nombre, capital y continente, sin temporizador ni puntuación, navegable con teclado. **Justificación** : hoy no existe ninguna forma de aprender sin presión de tiempo (ni siquiera Nivel Nene, que sigue cronometrado). **Archivos** : nueva pantalla en `index.html`, nueva función en `js/game.js`, reutiliza `js/countries.js` tal cual. **Criterios de aceptación** : se puede recorrer las 195 banderas sin límite de tiempo ni impacto en la puntuación/ranking. **Prioridad** : P2. **Estimación** : M. **Dependencias** : ninguna técnica. **Pruebas** : manual, navegación completa por teclado y por tacto.

  13. **Título** : Extracción de cadenas a diccionario de i18n **Descripción** : mover todas las cadenas de `index.html`/`game.js` a un objeto de traducciones con una clave por texto, dejando el español como locale por defecto. **Justificación** : es el paso previo obligatorio antes de traducir a cualquier otro idioma; hoy está todo hardcodeado. **Archivos** : `index.html`, `js/game.js`, nuevo `js/i18n.js` (o similar). **Criterios de aceptación** : cambiar de idioma no requiere tocar lógica de juego, solo el diccionario. **Prioridad** : P3 (a menos que se decida antes internacionalizar). **Estimación** : L. **Dependencias** : decisión de producto sobre idiomas objetivo. **Pruebas** : cambiar el diccionario activo y comprobar que ningún texto queda en español "colado".




* * *

# 10. Experimentos recomendados

  1. **Hipótesis** : mostrar el progreso de banderas vistas aumenta el número de partidas por sesión. **Variante** : contador "X/195 banderas vistas" visible en la pantalla de nivel. **Grupo de comparación** : versión actual sin el contador. **Métrica principal** : partidas jugadas por sesión. **Métricas de protección** : tiempo de sesión total, tasa de abandono a mitad de partida. **Duración/volumen orientativo** : suficiente para acumular al menos varias decenas de sesiones por variante dado el volumen actual de uso (familiar); en un contexto más amplio, ajustar al tráfico real. **Criterio de éxito** : incremento observable en partidas por sesión sin caída en tiempo de sesión. **Decisión posterior** : si no hay efecto, mantenerlo igualmente como quick win de transparencia (coste ínfimo), pero no invertir en variantes más elaboradas de "progreso" sin evidencia.

  2. **Hipótesis** : el modo aprendizaje sin cronómetro reduce la tasa de abandono de jugadores nuevos en su primera sesión. **Variante** : ofrecer el modo aprendizaje como opción visible junto a los niveles clásicos para jugadores nuevos. **Grupo de comparación** : flujo actual (ir directo a un nivel cronometrado). **Métrica principal** : tasa de finalización de la primera sesión. **Métricas de protección** : uso del modo Clásico (no debe caer significativamente). **Duración/volumen orientativo** : cohortes sucesivas de jugadores nuevos. **Criterio de éxito** : mejora en finalización de primera sesión sin canibalizar el modo Clásico. **Decisión posterior** : si canibaliza demasiado el modo Clásico, mostrarlo solo tras un primer fallo o como opción secundaria, no como entrada por defecto.

  3. **Hipótesis** : un duelo asíncrono sobre el mazo diario aumenta la tasa de retorno al día siguiente. **Variante** : opción de compartir/comparar el resultado del reto diario con otro jugador conocido. **Grupo de comparación** : reto diario actual sin comparación social. **Métrica principal** : retorno a jugar el reto diario al día siguiente. **Métricas de protección** : ninguna señal de frustración por comparación (p. ej. abandono tras ver un resultado peor que el de otro). **Duración/volumen orientativo** : al menos dos semanas para capturar el patrón diario completo. **Criterio de éxito** : incremento de retorno diario sin aumento de abandono tras la comparación. **Decisión posterior** : si genera frustración, ofrecerlo como opt-in explícito en vez de mostrarlo por defecto.




* * *

# 11. Riesgos y decisiones abiertas

  * **Alcance de producto no resuelto** : el código de hoy es un juego privado y personalizado para una familia concreta (nombres de jugador hardcodeados, un solo idioma, sin autenticación). Gran parte de la ambición de "competición e internacionalización" del encargo original solo tiene sentido si se decide explícitamente **abrir el producto más allá del ámbito familiar** — y esa decisión no puede tomarse solo desde el repositorio.
  * **Público de edad objetivo** : el propio contenido (iconos, "Nivel Nene") sugiere una audiencia con niños pequeños, lo que **condiciona fuertemente** cualquier decisión sobre ranking público, nombres de usuario libres, moderación y recogida de datos — sin confirmación explícita de producto, cualquier funcionalidad social debe tratarse con el máximo cuidado por defecto.
  * **Política de fecha del reto diario** : UTC global vs. fecha local por jugador es una decisión de justicia percibida sin una respuesta técnicamente "correcta" única; requiere una elección de producto explícita.
  * **Política editorial de países/banderas** : el criterio actual (miembros ONU + Vaticano, sin territorios ni banderas históricas) es razonable pero no está documentado como decisión de producto; cualquier ampliación (territorios dependientes, banderas históricas) es sensible y debe señalarse como tal, no decidirse implícitamente en código.
  * **Infraestructura real disponible** : no hay confirmación de qué presupuesto/infraestructura hay disponible para funciones de servidor (validación de puntuación), moderación de contenido generado por usuarios, o servicios de accesibilidad (p. ej. si se llegase a considerar texto-a-voz para descripciones de banderas).
  * **Necesidad real de cuentas** : hoy "cuenta" = nombre en texto libre. Cualquier sistema de ranking más serio que el familiar actual probablemente necesite algo más robusto (aunque sea ligero), lo cual es una decisión de producto, no solo técnica.



* * *

# 12. Próximos pasos

  1. Decidir y confirmar el alcance de producto (familiar-privado con mejoras vs. producto público) — condiciona todo lo demás.
  2. Aplicar los quick wins de accesibilidad y justicia de la sección 7 (zoom, `aria-live`, banner de error, texto grande desacoplado, corrección del temporizador ante backgrounding).
  3. Diseñar la alternativa textual no reveladora para identificar banderas sin depender de la vista.
  4. Exponer el progreso de banderas vistas en la interfaz.
  5. Decidir la política de "un intento por reto diario" e implementarla.
  6. Versionar el esquema y las políticas RLS de Supabase dentro del repositorio.
  7. Introducir pruebas unitarias sobre las funciones puras existentes (`computePoints`, `streakMultiplier`, `pickDistractors`, `seededShuffle`) como base antes de tocar más lógica de puntuación.
  8. Prototipar el modo aprendizaje sin cronómetro y el modo "repasa tus fallos" (ambos de bajo esfuerzo, alto valor, cero riesgo de regresión sobre el modo Clásico).
  9. Añadir validación de puntuación en servidor antes de considerar cualquier ranking más allá del familiar actual.
  10. Solo entonces evaluar experimentos de competición social (duelo asíncrono) e internacionalización (extracción de cadenas), en ese orden.



* * *

# Catálogo de nuevas tipologías de juego

Modo | Interacción | Propósito | Jugador objetivo | Valor educativo | Diversión | Competición | Complejidad | Compatibilidad actual | Decisión  
---|---|---|---|---|---|---|---|---|---  
Elegir bandera a partir del nombre (inverso) | Selección múltiple | Reforzar desde el otro sentido | Todos | Alto | Medio-alto | Sí (reusa puntuación) | Baja | Total (reusa datos y algoritmo) | Implementar  
Clasificar por continente | Selección/arrastre | Geografía además de memorización | Principiantes/niños | Alto | Medio | Parcial | Baja | Total (`continent` ya existe) | Implementar  
Identificar banderas parecidas (confusables) | Selección múltiple | Formalizar el contenido curado ya existente | Avanzados | Alto | Alto | Sí | Baja | Total (`CONFUSABLES` ya existe) | Implementar  
Emparejar bandera-capital | Emparejamiento | Cultura general asociada | Todos | Medio-alto | Medio | Parcial | Baja | Total (`capital` ya existe) | Experimentar  
Bandera revelada progresivamente/recortada | Percepción visual con tiempo | Variedad perceptiva en niveles altos | Avanzados/competitivos | Medio | Alto | Sí | Baja-media | Alta (capa visual sobre datos existentes) | Experimentar  
Repaso de fallos | Selección múltiple | Aprendizaje dirigido por error propio | Todos | Alto | Medio | No | Baja | Total (`seen`/errores ya existen) | Implementar  
Modo aprendizaje libre (sin tiempo) | Exploración | Aprender sin presión | Niños/principiantes/accesibilidad | Alto | Medio | No | Baja | Total | Implementar  
Modo supervivencia (una vida) | Selección múltiple con dificultad creciente | Profundidad competitiva | Competitivos | Medio | Alto | Sí | Media | Alta (reusa distractores/puntuación) | Experimentar  
Duelo asíncrono (mazo diario) | Comparación de resultados | Competición social barata | Competitivos/social | Medio | Alto | Sí | Media | Alta (reusa semilla diaria ya determinista) | Experimentar  
Escribir el nombre del país | Texto libre | Máxima dificultad, sin pistas visuales de opciones | Expertos | Alto | Medio (alto riesgo de frustración) | Sí | Media-alta (necesita alias/tolerancia) | Media (necesita nuevos datos) | Experimentar (tras diseño de tolerancia)  
Colorear plantilla por zonas | Táctil/color | Reconocer estructura de la bandera sin dibujo libre | Niños/casual | Alto | Alto | No (o puntuación por % de zonas) | Media (preprocesar SVGs una vez) | Media (nuevo tipo de dato/asset) | Experimentar  
Ordenar franjas/colores | Arrastre/teclado | Reconocer estructura sin motricidad fina | Niños/casual | Medio-alto | Medio | Parcial | Media | Media (dato de orden, cercano a `palette`) | Experimentar  
Silueta del país en el mapa | Selección múltiple | Geografía espacial | Todos | Alto | Alto | Sí | Alta (requiere datos geográficos nuevos) | Posponer |   
Secuencia de banderas (memoria) | Memoria de secuencia | Variedad de interacción | Casual | Bajo | Medio | Parcial | Media | Media (se aleja del propósito central) | Posponer  
Modo cooperativo | Multijugador simultáneo | Dimensión social | Familias/amigos | Medio | Alto si funciona | Parcial | Alta (requiere tiempo real) | Baja (sin infraestructura Realtime en uso hoy) | Posponer  
Ranking global entre desconocidos | Comparación pública | Ambición competitiva máxima | Competitivos | Bajo (no es aprendizaje) | Alto si es justo | Sí | Alta (anti-trampas, moderación) | Baja (sin validación de servidor hoy) | Posponer  
Dibujo libre evaluado por IA | Dibujo a mano | "Modo creativo" | Casual/niños | Medio | Incierto | No | Muy alta (visión artificial, coste, privacidad) | Baja | Descartar  
  
* * *

# Análisis del modo "dibujar la bandera"

**Concepto recomendado** : no dibujo libre evaluado por visión artificial. En su lugar, una familia de variantes **sin IA y sin evaluación subjetiva** , evaluables con comparación local determinista:

  * **MVP** : "elige el color que falta" — se muestra la bandera con 1-2 zonas ocultas (definidas de antemano por un desarrollador, no por IA) y el jugador elige el color correcto entre varias opciones para cada zona. Reutiliza el mismo patrón de interacción del juego actual (botones de opción), solo cambia el objeto de la pregunta.
  * **Evolución 1** : "colorea por zonas" — plantilla con zonas delimitadas (requiere preprocesar cada SVG una vez, offline, en un script de desarrollo, separando cada franja/símbolo en una zona clicable con su color correcto conocido) y una paleta de colores para rellenar. La corrección es un simple recuento de zonas correctas (%), sin ambigüedad ni necesidad de visión artificial.
  * **Evolución 2** : "ordena las franjas/colores" — arrastrar (o reordenar con teclado, más accesible) los colores de una bandera de franjas hasta el orden correcto. Dato necesario: una versión ordenada del campo `palette` ya existente (hoy no garantiza el orden espacial, solo qué colores aparecen).
  * **Dibujo libre solo como extra no competitivo y no evaluado** : si en algún momento se quiere ofrecer "dibuja lo que recuerdes", debe presentarse como una actividad **reflexiva y autoevaluada** ("compara tu dibujo con la bandera real tú mismo"), nunca puntuada automáticamente ni analizada por un servicio de visión artificial — evita coste, latencia, y sobre todo evita subir dibujos de (potencialmente) menores a un servicio externo.



**Flujo de usuario (MVP "elige el color que falta")**: se muestra la bandera con una zona en gris → se ofrecen 3-4 colores como opciones → el jugador elige → feedback inmediato igual que el modo actual → mismo sistema de puntuación reutilizado (con un multiplicador propio si se desea diferenciar el modo).

**Sistema de evaluación** : comparación exacta zona-color, sin tolerancia perceptual necesaria — es binario y transparente, evitando cualquier problema de "juicio artístico injusto".

**Banderas complejas (escudos, sellos detallados)** : para las banderas con emblemas muy detallados (p. ej. México, Sri Lanka, Turkmenistán), limitar la actividad a las zonas de color de fondo/franjas y excluir el detalle fino del escudo de la evaluación — evita exigir precisión artística imposible para un juego casual.

**Accesibilidad** : la variante de "elegir color" y "ordenar por teclado" son accesibles de forma nativa (mismo patrón de botones/foco que el resto del juego); el "colorear por zonas" con tacto/ratón debe ofrecer siempre una alternativa por lista/teclado para no depender de precisión motriz fina.

**Coste computacional / IA** : **ninguno** en las tres variantes recomendadas — no se necesita ningún modelo de visión artificial ni servicio externo, resolviendo de raíz la restricción de privacidad para menores y de dependencia de terceros.

**MVP propuesto** : "elige el color que falta" sobre 10-15 banderas de bandera de franjas simples (evitar inicialmente escudos complejos), reutilizando el layout de opciones ya existente.

**Criterios para validar el MVP** : ¿los jugadores lo entienden sin explicación adicional en los primeros segundos? ¿la tasa de finalización es comparable a una ronda del modo Clásico? ¿el modo se elige espontáneamente más de una vez por sesión?

**Recomendación final** : **adaptar** la idea original de "dibujar la bandera" hacia la familia colorear/ordenar/completar (sin IA), y **descartar** por ahora el dibujo libre evaluado automáticamente por su coste, riesgo de injusticia percibida y problemas de privacidad para un público que incluye menores.

* * *

# Funcionalidades que deben preservarse

  * **La progresión de niveles (`levels.js`)**: coherente, bien calibrada, y ya alineada con "fácil de aprender, difícil de dominar". No debe rediseñarse sin evidencia clara de que falla.
  * **El sistema de distractores y`CONFUSABLES`**: es la pieza de contenido más valiosa y menos trivial de replicar; cualquier modo nuevo debería reutilizarlo, no sustituirlo.
  * **El reto diario determinista (semilla por fecha)** : es justo, barato, y ya funciona como ancla de retorno diario — base ideal para duelos asíncronos futuros.
  * **La degradación elegante sin conexión** (`safeFetch` en `db.js`, verificada en la prueba real: el juego sigue funcionando aunque Supabase o la fuente web fallen): un valor real para alcance internacional y conexiones lentas; no debe romperse al añadir nuevas llamadas de red.
  * **El diseño responsive** (unidades `dvh`, layout dedicado a apaisado, `prefers-reduced-motion`, objetivos táctiles amplios): calidad ya lograda, base sólida para cualquier pantalla nueva.
  * **La ausencia total de rastreo de terceros/publicidad** : un valor de producto real, especialmmente relevante dado que el usuario actual incluye a un niño; cualquier telemetría futura debe preservar esta propiedad.
  * **La simplicidad de despliegue (sin build, sin dependencias npm)** : reduce drásticamente el riesgo de cadena de suministro y la fricción de mantenimiento; cualquier nueva herramienta (tests, linter) debe añadirse sin forzar un paso de compilación si no aporta un beneficio claro.



* * *

# Conflictos detectados

Propuesta | Funcionalidad actual afectada | Tipo de conflicto | Riesgo | Alternativa | Decisión  
---|---|---|---|---|---  
Ranking global entre desconocidos | Ranking familiar actual (confiado, de bajo riesgo) | La confianza actual en el cliente ya no es suficiente a mayor escala | Alto (manipulación, privacidad, menores) | Mantener el ranking familiar como está; explorar ranking público solo tras validación de servidor | Posponer hasta resolver la base de confianza  
Modo "texto grande" como ajuste independiente | `body.big` ligado hoy a `level.big` (Nivel Nene) | Cambio de comportamiento existente (el nivel más fácil dejaría de forzar texto grande) | Bajo (mejora neta, no quita nada, solo separa dos decisiones hoy fusionadas) | Ninguna mejor — es la corrección correcta | Adaptar (desacoplar)  
Dibujo libre evaluado por IA | Ninguna funcionalidad existente en conflicto directo, pero sí con los principios de privacidad/accesibilidad del producto | Contradice "no depender de IA externa si hay alternativa local" y el cuidado con menores | Alto (privacidad, coste, injusticia percibida) | Colorear por zonas / ordenar franjas (sin IA) | Descartar la versión IA; adaptar a variantes locales  
Multijugador cooperativo en tiempo real | Ninguna, pero exige infraestructura no presente (Realtime, salas, moderación) | Salto de complejidad desproporcionado frente al resto del producto | Alto (coste, mantenimiento, moderación) | Duelo asíncrono sobre el mazo diario (ya determinista) | Posponer; adaptar la ambición social hacia el duelo asíncrono  
Fecha del reto diario en huso horario local del jugador | `todayStr()` actual en UTC | Cambiar la fecha de referencia podría alterar el mazo del día para jugadores existentes a mitad de implementación | Medio (percepción de "cambio de reglas") | Anunciar el cambio de política si se hace, o mantener UTC documentado como decisión consciente | Adaptar solo con comunicación explícita del cambio  
  
* * *

# Matriz de adecuación

Propuesta | Alineación | Valor | Compatibilidad | Complejidad | Riesgo de regresión | Decisión  
---|---|---|---|---|---|---  
Mostrar progreso de banderas vistas | 5 | 4 | 5 | 1 | 1 | Integrar  
Modo repaso de fallos | 5 | 4 | 5 | 2 | 1 | Integrar  
Modo aprendizaje sin presión | 5 | 4 | 5 | 2 | 1 | Integrar  
Invertir el sentido (nombre→bandera) | 5 | 3 | 5 | 1 | 1 | Integrar  
Clasificar por continente | 4 | 3 | 5 | 1 | 1 | Integrar  
Modo supervivencia | 4 | 4 | 4 | 3 | 2 | Experimentar  
Duelo asíncrono (mazo diario) | 4 | 4 | 4 | 3 | 2 | Experimentar  
Colorear por zonas / ordenar franjas | 4 | 4 | 3 | 3 | 2 | Experimentar  
Escribir el nombre del país | 3 | 3 | 3 | 4 | 3 | Experimentar (con diseño previo)  
Silueta del mapa | 4 | 4 | 2 | 5 | 3 | Posponer  
Multijugador cooperativo en tiempo real | 2 | 3 | 1 | 5 | 4 | Posponer  
Ranking global entre desconocidos | 2 | 3 | 1 | 5 | 5 | Posponer  
Dibujo libre evaluado por IA | 1 | 2 | 1 | 5 | 4 | Descartar  
  
_(Escala 1-5, 5 = mejor/mayor en cada columna salvo Complejidad y Riesgo de regresión, donde 5 = peor)._

* * *

# Propuestas descartadas

  * **Dibujo libre de banderas evaluado por visión artificial** : se descarta en esta forma. Motivo: exige un modelo/servicio de IA externo (contradice la preferencia explícita por soluciones locales cuando existen alternativas), introduce coste y latencia, plantea un problema de privacidad real si el usuario incluye menores (subir dibujos de un niño a un servicio de terceros), y la evaluación por visión artificial es intrínsecamente subjetiva y difícil de hacer sentir justa. Se sustituye por variantes locales (colorear por zonas, ordenar franjas, completar color) que cubren el mismo espíritu educativo sin ninguno de esos riesgos.
  * **Secuencia de banderas al estilo "Simon"**: se pospone/descarta como pilar. Motivo: entrena memoria de secuencia a corto plazo más que conocimiento geográfico, alejándose del propósito central del producto ("aprender, reconocer y recordar países y banderas"); podría vivir como modo rotativo experimental, nunca como modo principal.
  * **Ranking global entre desconocidos, tal y como se podría implementar hoy** : se descarta en su forma inmediata. Motivo: la puntuación no tiene ninguna validación de servidor (verificado), no hay moderación de nombres, no hay política de privacidad para menores, y no hay autenticación — lanzar esto hoy sería exponer a la familia/usuarios a manipulación trivial y a riesgos de privacidad evitables. Se traduce en la Fase 3/4 del roadmap, condicionada a resolver esas bases primero.
  * **Multijugador cooperativo en tiempo real** : se descarta para el corto/medio plazo. Motivo: no hay ninguna infraestructura de tiempo real en uso hoy (Supabase Realtime no está integrado en el repo), y el coste de construir salas, sincronización y moderación es desproporcionado frente al resto del producto, que es intencionadamente ligero y sin dependencias.



* * *

# Experimentos seguros

  * **Mostrar el contador de banderas vistas** durante una semana con un grupo de jugadores y comparar partidas por sesión frente a la semana anterior sin el contador — reversible con un solo cambio de UI, cero riesgo para el resto del juego.
  * **Ofrecer el modo aprendizaje sin presión como opción adicional** (no reemplazo) en la pantalla de nivel, y observar si canibaliza el modo Clásico o lo complementa — reversible quitando el botón si no aporta valor.
  * **Prototipo de "elige el color que falta"** sobre un subconjunto pequeño de 10-15 banderas simples, como modo claramente marcado "experimental", sin tocar el sistema de puntuación principal ni el ranking — permite validar si la mecánica se entiende y divierte antes de invertir en preprocesar las 195 banderas en zonas.
  * **Duelo asíncrono manual** (comparar capturas de pantalla del resultado del reto diario entre dos personas conocidas, sin construir aún ninguna infraestructura) como validación de la demanda social antes de construir cualquier función de comparación automática.



* * *

_Nota final_ : este informe no ha modificado ningún archivo del juego. La única acción sobre el repositorio ha sido su lectura y una ejecución local de verificación (servidor estático + navegador headless), cuyos artefactos (capturas de pantalla, script de prueba) quedan en el directorio temporal de esta sesión y no se han incluido en el repositorio.
