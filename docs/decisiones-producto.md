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
