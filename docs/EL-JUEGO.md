# EL JUEGO · documento base

**Empieza siempre por aquí.** Este documento define qué es el juego, qué
tiene hoy y hacia dónde va. Todo lo demás en `docs/` es el detalle y el
porqué de alguna de estas piezas.

Cada cosa lleva su estado:

| | |
|---|---|
| ✅ | **Existe hoy** en el código, funcionando |
| 🟡 | **Diseñado y acordado**, sin construir |
| ⬜ | **Sin decidir** |

Si algo aquí contradice a otro documento de `docs/`, **manda este**.

---

## 1. Qué es

> Un juego de geografía en el que recuperas, país a país, un mundo al que
> alguien le ha borrado los nombres y las banderas.

Se puede jugar de tres maneras que no se estorban: **dos minutos al día**,
**una partida rápida**, o **una campaña larga con historia**.

- **Web** (Vercel) y **apps** de App Store y Google Play, con el mismo
  código. ✅
- **Seis idiomas**: español, catalán, inglés, francés, alemán, italiano. ✅
- **195 países** — los 193 miembros de la ONU más Ciudad del Vaticano y
  Palestina no incluida (criterio en `decisiones-producto.md`). ✅

## 2. Para quién

**De 15 años en adelante.** No es un juego infantil.

La consecuencia de diseño más importante, que se aplica en todas partes:

> **A un niño se le engancha felicitándole. A un adulto se le engancha
> humillándole un poco.**

Nadie ve una bandera con su nombre escrito debajo. El juego mide, dice la
verdad ("sabías 41 de 195") y sube el listón. Detalle en
`publico-objetivo.md`.

Un niño puede jugar perfectamente —sobre todo el reto diario, que con sus
pistas de distancia lo juegan un padre y un hijo por igual— pero el juego
no se diseña para él.

## 3. Las once reglas que no se rompen

1. **Se abre y se juega en dos toques.** Nunca un formulario, un login ni
   un tutorial obligatorio delante de la primera bandera.
2. **El reto diario es sagrado**: uno al día, el mismo para todo el mundo,
   sin economía de juego, sin acelerarlo con dinero, sin repetirlo.
3. **El dinero no toca donde la gente se compara**: ni ligas, ni reto
   diario.
4. **La racha se rompe al no jugar, jamás al fallar.**
5. **Nunca rivales inventados.** Si el ranking dice que hay alguien, hay
   alguien.
6. **Nada de vidas ni de energía.**
7. **Nada de cajas sorpresa de pago.**
8. **Ni contadores de urgencia, ni culpa, ni premios que caducan mientras
   duermes.**
9. **El catálogo de 195 países no se amplía.** Las banderas que no son de
   países viven en la vitrina, aparte.
10. **Cada pieza tiene que funcionar también en el navegador.** Un juego
    con dos formas de abrirlo, no dos productos.
11. **Cada cadena nueva son seis.** `tools/check-i18n.mjs` no deja
    desplegar un idioma incompleto.

---

## 4. La estructura: tres puertas

La pantalla de inicio tiene tres tarjetas y ninguna estorba a las otras.

| Puerta | Qué es | Dura | Estado |
|---|---|---|---|
| 🔥 **El reto de hoy** | El ritual: una bandera tapada, la misma para todos | 2 min | ✅ |
| 🏳️ **Partida rápida** | Jugar y ya, con el último modo usado | 90 s | 🟡 |
| 👑 **El Condado** | La campaña con historia, y la temporada del mes | Meses | 🟡 |

Quien solo juegue el reto diario durante dos años está perfectamente
servido. Eso es un éxito del diseño, no un fallo.

### Dos velocidades que no se mezclan

- **El ritual** (reto diario): contención total. Su premio es el cuadrito
  para compartir y la racha. Nada de sobres, comodines ni multiplicadores.
- **La práctica** (partida rápida y Condado): ilimitada, adaptativa, con
  progresión, recompensas y ligas.

Mezclarlas rompe las dos. Razón completa en `mecanicas-enganche.md` §2.

---

## 5. Los modos

### Existen hoy ✅

| Modo | Cómo se juega |
|---|---|
| **Clásico** | Bandera → elegir el país |
| **El reto de hoy** | Una bandera tapada en 9 piezas, 6 intentos escribiendo el país, con pistas de distancia y rumbo |
| **Aprender** | Lista navegable con nombre, capital y continente |
| **Repasa tus fallos** | Como el clásico, con las más falladas |
| **Elige la bandera** | Al revés: nombre → tocar la bandera |
| **Clasifica por continente** | Bandera → continente |
| **Bandera y capital** | Bandera → capital |
| **Supervivencia** | Una vida, todo sube con cada acierto |

### Por construir 🟡

| Modo | Datos que necesita |
|---|---|
| **¿Dónde está?** — señalar en el mapa | Coordenadas: **ya están** en `countries.js` |
| **Silueta** — reconocer la forma | Natural Earth (dominio público) |
| **La cuadrícula 3×3** — país que cumple dos categorías | Etiquetas `pattern` y `palette`: **ya están** |
| **Vecinos y rutas** | GeoNames (CC-BY) |
| **Frío o caliente** | Distancia: **ya está** en `geo.js` |
| **Alfabetos perdidos** — reconocer la escritura | Tabla de ~30 palabras, a mano |
| **Mayor o menor** — población y superficie | GeoNames |
| **Rarezas** — banderas que no son de países | Lista a mano |

**Los modos nuevos no aparecen en un menú: los reparten los jefes de la
campaña** (§7). Un modo que te dan cuando lo ganas vale más que el mismo
modo escondido en una lista.

---

## 6. Dificultad

### Niveles clásicos

Declarados en `js/levels.js`. ✅ Los nombres actuales son de cuando el
juego era infantil y **hay que renombrarlos** 🟡:

| Hoy | Pasa a ser | Rondas | Segundos | Opciones |
|---|---|---|---|---|
| Nene 🧸 | **Aprendiz** | 12 | 26 | 3 |
| Principiante 🌱 | **Viajero** | 16 | 15 | 3 |
| Experto 🧠 | **Cartógrafo** | 20 | 9 | 4 |
| Dios 🔥 | **Almirante** | 20 | 6 | 5 |

### Tres correcciones acordadas 🟡

1. **Partidas de 90 segundos.** Bajar el clásico a ~7 rondas, con "partida
   larga" opcional. Veinte rondas no caben en una cola del súper.
2. **Dificultad adaptativa**, apuntando a **~80% de aciertos**: cada mazo
   se arma con 70% de lo que dominas y 30% del filo de tu conocimiento.
   Es la palanca más grande y no se ve nunca.
3. **La primera fase de la campaña es un diagnóstico**: doce banderas sin
   ayuda que calibran todo lo demás desde el minuto uno.

---

## 7. El Condado (campaña) 🟡

### Estructura

**72 fases · un jefe cada 6 · 12 jefes · jefe final.** Seis capítulos de
doce fases.

**Los capítulos NO son continentes**: se ordenan por dificultad y cada uno
recorre el mundo entero. Agrupar por continente mata la variedad, esconde
las mejores banderas y se aprende peor.

| Cap. | Tema | De dónde sale |
|---|---|---|
| 1 | **Las que crees que sabes** | Las más reconocibles del planeta |
| 2 | **Las que se confunden** | `confusables.js`, 25 grupos ya escritos |
| 3 | **Las que cuentan algo** — lunas, estrellas, animales | Etiquetas `pattern` |
| 4 | **Las islas** | Tres océanos |
| 5 | **Las familias de colores** — panafricanas, panárabes, nórdicas | Etiquetas `palette` |
| 6 | **Las que nadie recuerda** | La cola difícil |

### Las fases se componen, no se escriben

```
fase = MODO + zona del mundo + objetivo + restricción
```

**El modo cambia en cada fase.** La zona sí puede ser local ("las
nórdicas", "el Cono Sur"); el capítulo, no. Con seis modos, treinta zonas y
cinco objetivos salen cientos de fases sin escribir contenido nuevo.

**A mano solo se diseñan los doce jefes.**

### Los jefes y lo que abren

| Jefe | Fase | Formato | Abre |
|---|---|---|---|
| 1 | 6 | **El Impostor** — dos banderas casi idénticas *(gratis: `confusables.js`)* | Elige la bandera |
| 2 | 12 | **El Puzle del Borrón** — recomponer banderas rotas *(casi gratis: las 9 piezas de `daily.js`)* | Siluetas |
| 3 | 18 | Frío o caliente *(`geo.js`)* | ¿Dónde está? |
| 4 | 24 | La curiosidad | Bandera y capital |
| 5 | 30 | La cuadrícula | La cuadrícula 3×3 |
| 6 | 36 | Fronteras | Vecinos y rutas |
| 7 | 42 | Rutas largas | Frío o caliente |
| 8 | 48 | **El alfabeto perdido** | Alfabetos |
| 9 | 54 | Contrarreloj | Supervivencia |
| 10 | 60 | Comparaciones | Mayor o menor |
| 11 | 66 | El cajón de abajo | **Rarezas** |
| 12 | 72 | 👑 **El Borrón** | Modo sin fin |

### El tablero es el mapa

Empieza **gris y sin nombres**, con todas las banderas en blanco. Cada país
recuperado vuelve al color como una gota de tinta. Como los capítulos
recorren el mundo, **el mapa se enciende salpicado desde el primer día**.

El mapa, el álbum y el pasaporte son **el mismo objeto**.

Detalle completo en `modo-campana.md`.

---

## 8. La historia 🟡

**El Conde** es quien pone los nombres, los colores y las banderas del
mundo. No es un héroe: es alguien meticuloso que lleva toda la vida
haciendo bien un trabajo que nadie mira.

**El Borrón** es una mancha de tinta que borra. Y salió de la pluma del
propio Conde, un día que se le cayó sobre la mesa y no le dio importancia.

> El Conde recupera el mundo que le han borrado, y descubre que la mancha
> no quería destruir el atlas: **quería estar dentro de él.** Y como el
> poder del Conde es poner nombres, la historia no se resuelve ganando: se
> resuelve **nombrando**.

Doce escenas, una por jefe, de dos o tres frases, contadas **en el
pasaporte** con tipografía y un sello — sin ilustraciones, que es lo que
más dinero ahorra de todo el proyecto.

Cada mecánica tiene su motivo dentro del cuento:

| Mecánica | Por qué existe |
|---|---|
| El mapa gris | El Borrón lo borró |
| El álbum vacío | Aún no lo has recuperado |
| La vitrina de rarezas | El cajón de abajo del archivo |
| Las banderas se oxidan | La tinta se apaga si no se repasa |
| **Las temporadas mensuales** | **El Borrón esconde doce banderas cada mes** |

Y al terminar, **el jugador le pone nombre a su condado**.

Texto completo de las doce escenas y reglas de escritura en
`historia-conde.md`.

---

## 9. El pasaporte 🟡

El objeto donde queda todo lo que haces, y lo que se comparte.

- **El álbum**: 195 fichas. Cada país con hasta cinco sellos — bandera,
  capital, ubicación, silueta, vecinos. **975 cosas que dominar**, no 195.
- **Los sellos de capítulo y de temporada.**
- **El rango**, ligado a países dominados.
- **La gema** de la mejor liga alcanzada, para siempre.
- **El escudo de armas** del condado, que compone cada jugador: forma,
  partición, colores y figuras. Es el avatar, en versión adulta.
- **El mapa**, coloreándose.
- **La vitrina**: las banderas que no son de países (olímpica, ONU, UE,
  Cruz Roja, pirata, cuadros, Everest, Antártida, Tíbet, Esperanto). Se
  juegan una vez desbloqueadas, **nunca en el reto diario**, y **no cuentan
  en el 195/195**.

### Las banderas se oxidan

Una bandera dominada que llevas dos meses sin ver empieza a oxidarse, y el
pasaporte lo enseña. Es repaso espaciado disfrazado de algo que no quieres
perder — y la gente se mueve mucho más por no perder que por ganar.

---

## 10. Ligas y temporadas 🟡

### Historia y Temporada son cosas distintas

| | **La Historia** | **La Temporada** |
|---|---|---|
| Qué es | Las 72 fases del Conde | 12 fases nuevas cada mes |
| Ritmo | El tuyo | El del calendario |
| ¿Caduca? | **Nunca** | Al acabar el mes |
| ¿Puntúa? | No | **Sí** |

Quien empiece en el mes ocho tiene que poder vivir la historia desde el
principio. Y la temporada empieza a cero para todos cada mes, así que
llevar un año jugando no da ventaja.

**Esto es también lo que pasa después del jefe final:** se acaba la
historia y las temporadas siguen.

### Puntuación

| De dónde | Cuánto |
|---|---|
| Jefe de temporada | Muchos — el gran salto |
| Fase de temporada | Bastantes |
| Reto de hoy | **Fijo, generoso, igual para todos** |
| Partida libre | Pocos, con tope diario |

> **El ritual te mantiene. La campaña te sube.**

### La escalera de gemas

Cuarzo · Ámbar · Turquesa · Jade · Amatista · Topacio · Esmeralda ·
Zafiro · Rubí · **Diamante**. De tonos pálidos a saturados y termina en
brillante: se lee por color sin leer el nombre.

### Se construye hacia arriba

**Al principio existe solo Cuarzo y todo el mundo está dentro.** Las demás
se abren de una en una, por encima, **cuando la de arriba llega a 90
jugadores activos en un mes**. La primera promoción a una liga recién
abierta sube diez por grupo en vez de cinco, para que nazca llena. **Una
liga abierta no se cierra nunca.**

**Liga y grupo no son lo mismo**: la liga es el escalón, el grupo son las
~30 personas con las que compites. Con 200 jugadores en Cuarzo se hacen
siete grupos de treinta y nadie es el número 147.

Y las ligas bloqueadas se enseñan con lo que falta —*"faltan 23 jugadores
para abrir Ámbar"*—, que convierte "somos pocos" en un objetivo compartido
y en el único motivo honesto para invitar a alguien. No antes de tener una
base mínima (~50), y siempre como barra que se llena.

Sube y baja: cinco arriba y cinco abajo, **nunca más de una liga por mes**.
Terminar el mes siempre da algo.

Detalle en `modo-campana.md` §9.

---

## 11. Economía 🟡

**Una moneda: escudos.** Se ganan con fases, jefes, racha y reto diario.

| Se gastan en | No se gastan nunca en |
|---|---|
| Tintas, lacres, papeles, plumillas | Saltarse fases |
| Encuadernaciones y escudo de armas | Ventaja en las ligas |
| Reliquias de más (pista, dos respuestas, congelar) | Nada del reto diario |
| Adelantar una bandera de la vitrina | Aleatoriedad de pago |

**Los cosméticos son el escritorio del Conde, no trajes de un personaje.**
Son colores, texturas y formas componibles: mejor para este público y más
barato de producir.

### Reglas europeas de obligado cumplimiento

Los siete principios de la red de protección al consumidor (marzo 2025)
aplican a cualquier edad:

- **Precio en euros además de en escudos.**
- **Nada de packs que dejan monedas sobrantes.**
- **No obligar a pasar por la moneda** para comprar algo.
- Nada de cajas sorpresa de pago.

### Y el consejo de negocio

En este tipo de juego el dinero suele venir de **una compra única** —un
"Pase del Condado" que abra capítulos y dé cosméticos— antes que de packs
de monedas. Montar primero los escudos que se ganan; la tienda, después.

---

## 12. Los datos

| Qué | Dónde | Estado |
|---|---|---|
| 195 países: ISO, continente, lat/lon, `pattern`, `palette` | `js/countries.js` | ✅ |
| 195 banderas SVG (flag-icons, MIT) | `assets/flags/` | ✅ |
| Nombres y capitales en 6 idiomas | `js/i18n/names.*.js` | ✅ |
| 25 grupos de banderas confundibles, explicados | `js/confusables.js` | ✅ |
| Siluetas de países | Natural Earth · dominio público | 🟡 |
| Fronteras, población, superficie | GeoNames · CC-BY | 🟡 |
| Alfabetos | ~30 palabras a mano | 🟡 |

Los datos externos se convierten a un `.js` estático con un script en
`tools/`, como ya hace `tools/build-names.mjs` con CLDR. **La app no llama
a ninguna API en ejecución.**

---

## 13. La técnica

### Hoy ✅

- **Sitio estático puro**: HTML, CSS y módulos ES. Sin build, sin
  dependencias en tiempo de ejecución.
- **Vercel** sirve la raíz tal cual (`vercel.json`).
- **PWA**: `manifest.webmanifest`, `sw.js`, `js/pwa.js`. Instalable y
  jugable sin conexión.
- **Apps nativas con Capacitor 8**: `capacitor.config.json`,
  `tools/build-www.mjs`, scripts `npm run app:*`.
- **Supabase** solo para el reto diario, por REST, con RLS y validación de
  puntuación en el servidor.
- **Ranking de casa** en `localStorage`.

### El cimiento que falta 🟡

**Hoy no hay jugadores: hay un nombre en el `localStorage` de un móvil.**
Eso bloquea el ranking, cambiar de dispositivo, reinstalar sin perderlo
todo y saber si alguien vuelve. En la web pasa exactamente lo mismo.

1. **Cuenta anónima** desde el primer toque (`signInAnonymously()`), sin
   pedir nada. Con Turnstile, que Supabase exige para no llenarse de
   usuarios fantasma.
2. **Código de vinculación** de seis caracteres para cambiar de
   dispositivo. Login con Apple, Google o correo **opcional y después**.
3. **Progreso en el servidor**; `localStorage` pasa a ser caché offline.
4. **RLS de verdad** contra `auth.uid()`. Hoy la clave `anon` del
   repositorio puede leer la tabla entera.
5. **El reto diario lo tiene que servir el servidor.** Hoy la bandera de
   mañana está en el código y cualquiera puede leerla: con ligas de por
   medio, eso es lo primero que alguien rompería.
6. **Rate limiting** y borrado/exportación de cuenta desde dentro.

Detalle en `ideas-app.md`.

---

## 14. Identidad

### Visual: "Papel & Tinta" ✅

Papel crema `#FFF8E7`, tinta `#1B2A41`, y tres acentos: sol `#F4A261`,
turquesa `#2A9D8F`, coral `#E76F51`. Tokens y reglas en `style.css`.
Contrastes medidos uno a uno; **cada pantalla nueva entra con ese listón**,
incluido el texto XL y el lector de pantalla.

### El jugo, en ese mismo lenguaje 🟡

- **La tinta que se extiende** al recuperar un país.
- **El sello de goma** al guardar una bandera en el pasaporte.
- **El lacre de cera** al cerrar un capítulo.
- **Las monedas volando** al contador, de una en una y acelerando.
- **El "casi"**: al fallar, la correcta al lado de la elegida y la
  diferencia marcada.

> **La recompensa se anima; el castigo, no.**

### Sonido 🟡

Seis efectos (acierto, fallo, sello, moneda, lacre, sobre) de bancos CC0.
Música de dominio público. Siempre con ajuste para apagarlo.

### El nombre ⬜

"Diversión con Banderas" es el programa de Sheldon en *The Big Bang
Theory*, marca de Warner. Como web es un guiño; **como ficha de tienda es
un riesgo que se materializa en retirada, no en carta de aviso** — y encima
encierra el juego en las banderas. La historia da un nombre propio
evidente: **El Condado**. La web puede seguir llamándose como quiera.

---

## 15. Qué se mide

Sin esto, todo lo anterior son opiniones. Telemetría propia y agregada en
Supabase, sin herramientas de terceros.

| Métrica | Para qué | Referencia del sector |
|---|---|---|
| % que termina la primera partida | El embudo de entrada | — |
| Vuelta al día siguiente (D1) | Salud del juego | Puzles: **32%** |
| Vuelta a la semana (D7) | Salud del juego | Puzles: **12%** |
| Vuelta al mes (D30) | Salud del juego | Puzles: **5,4%** |
| % de aciertos por jugador | Valida la dificultad adaptativa | Debe rondar el **80%** |
| Partidas por sesión | Valida sobres y partidas cortas | — |
| Días de racha antes de romperse | Si es 1 o 2, la racha no funciona | 7+ multiplica por **2,4** la retención |
| Retos enviados y aceptados | El único crecimiento que no se paga | — |
| % que termina el capítulo 1 | Decide si la campaña se amplía | — |

**Cada mecánica tiene que tener una métrica que diga si sirvió**, para
poder quitarla si no.

---

## 16. Presupuesto

| Concepto | Coste | ¿Necesario? |
|---|---|---|
| Apple Developer | 99 €/año | Sí, para iPhone |
| Google Play | 25 € una vez | Sí, para Android |
| **Supabase Pro** | ~23 €/mes | **Sí en cuanto se publique**: el plan gratis pausa el proyecto tras una semana sin actividad |
| Dominio | ~12 €/año | Recomendable |
| Arte | 0-500 € | Puede que **cero**: si los cosméticos son el escritorio, el Conde no necesita dibujarse |
| Sonido | 0 € | CC0 |
| Datos (Natural Earth, GeoNames) | 0 € | — |
| Revisión de traducciones | 50-100 €/idioma | Inglés y catalán primero |

**Primer año: 400-700 €.**

### El orden de gasto

1. **0 €** — el capítulo 1 con un Conde provisional y sonidos CC0.
2. **Solo si la gente lo termina** — arte, si se decide que hace falta.
3. **Cuando haya jugadores** — traducciones revisadas.
4. **Cuando haya liga** — Supabase de pago.

Si la campaña no funciona, se han perdido dos semanas y cero euros.

---

## 17. Orden de construcción

| | Qué | Por qué ahí |
|---|---|---|
| **0** | Telemetría mínima | Sin saber quién termina la primera partida, todo lo demás es a ciegas |
| **1** | Partida rápida en un botón · partidas de 90 s · renombrar niveles | Sube el número que peor está y no depende de nada |
| **2** | Racha con seguro · avisos | La mecánica con mejor retorno medido |
| **3** | **Capítulo 1 del Condado** con sus dos jefes gratuitos y el mapa gris | La apuesta de dos semanas que decide el resto |
| **4** | Cuenta anónima · sincronización · RLS · borrado de cuenta | El cimiento. No se ve nada y sin él no hay nada más |
| **5** | Pasaporte, álbum y repaso espaciado | Donde el juego pasa a ser útil |
| **6** | Reto diario en el servidor · rate limiting · nombres generados | **Antes de la liga, no después** |
| **7** | Ligas, temporadas y economía | |
| **8** | Modos nuevos, capítulos 2-6, vitrina | |

---

## 18. Lo que sigue sin decidir ⬜

- **El nombre del juego** en las tiendas.
- **Si el Conde se dibuja** o solo se ven su mano, su pluma y su letra.
- **Si hay Conde y Condesa** (casi gratis si el texto evita adjetivos
  referidos al personaje).
- **Si se vende algo**, y si es una compra única o packs de escudos.
- **Qué pasa con `decisiones-producto.md`**, escrito entero desde el
  supuesto de que esto era un juego familiar para niños. Sus decisiones
  sobre la fecha UTC y el criterio de países siguen siendo buenas; la
  premisa del público, no.

---

## 19. Dónde está el detalle

| Documento | Qué contiene |
|---|---|
| `publico-objetivo.md` | El público de 15+ y todo lo que cambió por eso. **Manda sobre los de abajo** |
| `modo-campana.md` | La campaña completa: capítulos, fases, jefes, ligas, economía |
| `historia-conde.md` | Las doce escenas, las reglas de escritura y el plan de producción |
| `mecanicas-juego.md` | Mecánicas de sesión, sorpresa, pasaporte, social |
| `mecanicas-enganche.md` | Datos del sector, las dos velocidades, modos más allá de banderas |
| `ideas-app.md` | El cimiento técnico: cuentas, sincronización, notificaciones |
| `apps-moviles.md` | Cómo se compilan las apps de iPhone y Android |
| `decisiones-producto.md` | Fecha UTC, criterio de países, ranking *(premisa de público antigua)* |
| `idiomas.md` | Cómo funcionan los seis idiomas y cómo añadir otro |
| `auditoria-juegodebanderas.md` | Auditoría original y roadmap por fases (histórico) |
| `../README.md` | Cómo está hecho el juego que existe hoy, archivo por archivo |
