# Decisiones de producto (Fase 4 de la auditoría)

Este documento recoge tres decisiones que la auditoría (`auditoria-juegodebanderas.md`)
señalaba como necesarias antes de seguir creciendo el juego: dos ya
implementadas y documentadas aquí, y una tercera que se evalúa
explícitamente sin implementarse.

## 1. Fecha del reto diario: UTC, no hora local

**Decisión: se mantiene la fecha en UTC** (`todayStr()` en `js/game.js`,
sin cambios respecto a como ya funcionaba).

**Alternativas consideradas:**

- **UTC (actual):** todo el mundo ve el mismo reto en el mismo instante
  absoluto. Es la opción más simple de implementar y mantener, y es
  coherente con el propio diseño del reto diario ("mismo mazo para todo
  el mundo el mismo día", ver `levels.js`). El coste es que alguien en un
  huso horario muy alejado de UTC puede ver cambiar "el reto de hoy" a
  media tarde o media mañana de su propio día, en vez de a medianoche.
- **Fecha local del dispositivo:** cada jugador vería el reto cambiar a
  medianoche en su propio huso horario, lo cual es más intuitivo
  individualmente. El coste es que dos jugadores en husos horarios
  distintos jugarían mazos *diferentes* llamándolos a ambos "el reto de
  hoy" — rompe la propiedad que hace justo al reto diario (comparar
  puntuaciones de un mismo mazo determinista) en cuanto la familia o el
  grupo de jugadores no está en el mismo huso horario.

**Razón de la decisión:** el juego es hoy un juego familiar/local (ver
`docs/` y la auditoría, sección "Variables pendientes"); en la práctica
todos los jugadores actuales están en el mismo huso horario o muy
cercanos, así que el coste de UTC (el cambio de reto a una hora rara del
día) es bajo, y el beneficio (todo el mundo compara siempre el mismo
mazo, sin ambigüedad) es más importante que la comodidad de "cambia a
medianoche para mí". Si el juego se abriera a jugadores en husos horarios
muy distintos, esta decisión debería revisarse explícitamente sabiendo
que cualquier alternativa (fecha local) sacrifica la comparabilidad
estricta del ranking diario.

## 2. Criterio de inclusión de países: miembros de la ONU + Ciudad del Vaticano

**Decisión: se mantiene y se formaliza aquí** el criterio ya usado de
facto en `js/countries.js` (hasta ahora solo documentado en un comentario
de código): el catálogo de 195 banderas incluye los **193 estados miembros
de las Naciones Unidas más los 2 estados observadores permanentes con
reconocimiento casi universal** (Ciudad del Vaticano y, si se añadiera en
el futuro, Palestina no está incluida hoy por no tener el mismo estatus
de reconocimiento diplomático universal que el Vaticano).

**Qué queda deliberadamente fuera:** territorios dependientes o no
autónomos (p. ej. Puerto Rico, Groenlandia, Hong Kong), estados con
reconocimiento internacional limitado o disputado (p. ej. Taiwán, Kosovo,
Somalilandia), y banderas históricas o de organizaciones no estatales.

**Razón de la decisión:** es el criterio más neutral y defendible
disponible — "miembro de la ONU" es un hecho verificable y objetivo, no
una opinión editorial del equipo del juego, lo que evita que el juego
tome partido en disputas de soberanía activas. Es la misma razón por la
que la auditoría lo calificaba de "razonable y defendible" pidiendo solo
que se hiciera explícito en vez de vivir únicamente en un comentario de
código. **No se añaden más países ni se cambia este criterio** sin que el
producto lo pida explícitamente (tal y como recomendaba la auditoría).

## 3. Ranking global entre desconocidos: evaluado, NO implementado

La auditoría pedía expresamente **evaluar, no implementar** esta
mecánica todavía. Esta sección es esa evaluación.

**Qué haría falta antes de poder plantearlo:**

1. **Autenticación real.** Hoy "el jugador" es solo un nombre libre en
   `localStorage`, sin cuenta ni verificación. Un ranking entre
   desconocidos con nombres libres y sin cuenta es trivialmente
   spameable (cualquiera puede aparecer con cualquier nombre, incluido
   suplantar a otros jugadores).
2. **Moderación de nombres.** Un campo de texto libre visible
   públicamente en un ranking global es una superficie de abuso
   (nombres ofensivos, spam, suplantación) que hoy no existe porque el
   ranking familiar solo lo ven las personas con el enlace del juego.
3. **Protección de menores.** El juego ya asume un público que incluye
   niños (Nivel Nene, tono infantil). Un ranking público con nombres
   visibles a desconocidos, potencialmente introducidos por menores,
   plantea consideraciones de privacidad y protección de menores que
   hoy no aplican porque el uso es privado/familiar.
4. **Anti-trampas más allá de lo ya construido.** La Fase 3 (#5) ya cierra
   el hueco más grave (la puntuación ya no se acepta sin más: se valida
   en el servidor contra el máximo matemático real de la fórmula de
   puntos). Eso es condición necesaria pero no suficiente para un
   ranking público: seguiría sin haber protección contra, por ejemplo,
   un script que juegue automáticamente muchas partidas para acumular
   entradas en el ranking (rate limiting), ni contra cuentas múltiples
   del mismo jugador.
5. **Coste de infraestructura y moderación continuos**, no solo de
   lanzamiento: alguien tendría que vigilar el ranking público de forma
   sostenida.

### Actualización: el ranking de casa pasa a ser local

La evaluación de abajo se escribió dando por supuesto que el ranking
familiar "solo lo ven las personas con el enlace del juego". **Eso no era
cierto en el código:** `getFamilyRanking()` consultaba la vista
`best_scores` pidiendo las 50 mejores marcas de la tabla entera, sin
ningún filtro, así que mostraba los nombres de cualquiera que hubiese
jugado desde cualquier dispositivo. Era, de hecho, el ranking público
entre desconocidos que esta sección descartaba — solo que sin haberlo
decidido.

**Decisión: el ranking de casa se guarda en `localStorage`** (clave
`dcb_scores_v1`) y el juego deja de consultar `best_scores` y de escribir
en Supabase las partidas que no son del reto diario.

Alternativas consideradas:

- **Código de familia** (una columna nueva en `games`, un código
  aleatorio por hogar y una función `SECURITY DEFINER` que solo devuelva
  las filas de ese código). Es la solución completa y la única que
  mantiene el ranking compartido entre el móvil y la tablet de la misma
  casa. Requiere una migración aplicada al proyecto real de Supabase y
  cerrar la lectura directa de la tabla; se descartó por ahora para no
  añadir infraestructura ni depender de un despliegue de base de datos.
- **Ranking local (elegida).** Cuesta cero, no necesita ni cuenta ni
  servidor ni migración, y los nombres no salen del dispositivo, que era
  justamente el punto 2 (moderación de nombres) y el punto 3 (protección
  de menores) de la evaluación. El coste real es que las marcas dejan de
  compartirse entre dispositivos de la misma casa.

El **reto diario sigue en Supabase**, porque su sentido es comparar el
mismo mazo determinista con gente que juega en otro dispositivo y eso no
se puede hacer en local. De su tabla el juego **solo muestra los nombres
que están en la lista de jugadores del dispositivo**; el resto se filtra
en el cliente. Conviene ser preciso sobre qué es eso: una decisión de qué
se enseña en pantalla, no una barrera de seguridad — la clave `anon` está
en el repositorio y cualquiera puede consultar la tabla por su cuenta. La
protección real seguiría necesitando el punto 1 (autenticación) o, como
mínimo, el código de familia con la lectura cerrada en el servidor.

El **duelo asíncrono** no cambia, y sigue siendo lo que esta sección
recomendaba: comparar tu resultado con el de alguien a quien nombras tú.

**Conclusión de la evaluación:** no se recomienda implementar un ranking
global entre desconocidos con la arquitectura y los recursos actuales
del proyecto (un juego familiar mantenido informalmente). El camino
intermedio de menor riesgo, si en el futuro se quisiera más alcance
competitivo, es el **duelo asíncrono** ya implementado en la Fase 3
(#5): compara tu resultado del reto diario contra alguien *que ya
conoces por nombre*, sin exponer un ranking público a desconocidos ni
requerir autenticación nueva. Si en el futuro se decide explícitamente
abrir el juego a un público más amplio que la familia actual, esta
sección debería revisarse teniendo ya resueltos los puntos 1-4 de
arriba, no antes.

## 4. Formato del reto diario: una bandera tapada, no doce rondas

**Decisión: el reto diario pasa a ser una única bandera al día,
tapada en nueve piezas, con seis intentos escribiendo el nombre del
país** (`js/daily.js`). Sustituye al formato anterior: 12 rondas de
opción múltiple con cronómetro, en dificultad Experto, con el mazo
sembrado por la fecha.

**Alternativas consideradas:**

- **Mantener las 12 rondas cronometradas.** Reutiliza el bucle de juego
  entero, así que no cuesta nada mantenerlo, y ya funcionaba. El
  problema es qué mide: con opciones dadas y cronómetro, la puntuación
  del reto depende sobre todo de la velocidad de tocar la pantalla, y
  dos personas que aciertan las mismas doce banderas quedan separadas
  por décimas de segundo. Además no deja nada que contar: no hay
  "por dónde ibas tú", solo un número.
- **Una bandera tapada en piezas, escribiendo el país (elegida).** Se
  juega en un minuto, se puede compartir el resultado sin destriparlo,
  y escribir el nombre en vez de elegir entre cuatro opciones es
  bastante más difícil y más satisfactorio. El coste es que ya no
  reutiliza el bucle de juego: es una pantalla y un módulo aparte, con
  su propio estado guardado.
- **Piezas fijas frente a 9 piezas con pista de distancia.** Sin
  ninguna pista, adivinar un país por un noveno de su bandera es casi
  imposible salvo para banderas muy reconocibles, y el reto se vuelve
  frustrante justo el día que toca una bandera difícil. La pista de
  distancia y rumbo (`js/geo.js`) convierte cada fallo en información
  útil, que es lo que hace que valga la pena seguir intentándolo.

**Razón de la decisión:** el reto diario es la pieza social del juego —
lo que hace que varias personas jueguen "lo mismo" el mismo día. Para
eso importa más que dé conversación y que se pueda comparar sin
ambigüedad que medir con precisión la destreza de cada uno. El formato
de bandera tapada cumple las dos cosas y añade una tercera que el
anterior no tenía: un resultado compartible en cuadrados (🟥🟩) que no
revela la respuesta a quien todavía no ha jugado.

**Lo que no cambia y conviene no romper:** la fecha sigue siendo UTC
(sección 1 de este documento) por el mismo motivo de siempre — que todo
el mundo juegue exactamente la misma bandera —, el límite sigue siendo
de un intento por jugador y día (ahora también reforzado en local, para
que recargar la página no regale intentos), y el catálogo de países
sigue siendo el de la sección 2. La bandera de cada día se saca
recorriendo el catálogo barajado, no sorteando: **dentro de cada vuelta
de 195 días no se repite ninguna**, y en el salto de una vuelta a la
siguiente se fuerza un margen extra, de modo que dos apariciones de la
misma bandera nunca caen a menos de tres semanas. Es lo que evita que el
reto de hoy sea la misma bandera que la de hace tres días.
