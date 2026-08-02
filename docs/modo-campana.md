# El Condado: modo campaña

**Propuesta, no decisión.** Desarrollo de la idea del conde que puso los
nombres y las banderas al mundo, se lo han quitado todo, y tiene que
recuperarlo fase a fase.

---

## 1. Por qué esta idea es mejor de lo que parece

La mayoría de los juegos casuales pegan una historia encima de una mecánica
que no la necesita. Aquí pasa lo contrario, y es raro: **la trama y la
mecánica son la misma cosa.**

Si el conde es quien puso los nombres y las banderas y se lo han quitado,
acertar una bandera **no es puntuar, es recuperarla**. El álbum deja de ser
una pantalla de estadísticas y pasa a ser el objetivo del juego.

Y resuelve de paso los tres problemas peores:

| Problema | Cómo lo resuelve la campaña |
|---|---|
| Tres pantallas antes de jugar | El tablero dice cuál es la siguiente fase. Un toque |
| La puntuación no significa nada | Ya no puntúas: liberas un trozo de mundo |
| Ocho modos que nadie descubre | Cada jefe desbloquea uno. El menú se llena solo |
| El contenido se acaba a las 195 banderas | 72 fases con objetivos distintos sobre el mismo catálogo |

---

## 2. Tres puertas desde el primer día

La campaña **no puede ser la única forma de jugar**. La pantalla de inicio
tiene tres tarjetas desde el minuto uno:

| Puerta | Para quién | Cuánto dura |
|---|---|---|
| 👑 **El Condado** | Quien quiere el juego grande | Meses |
| 🔥 **El reto de hoy** | Quien solo quiere su ritual diario | 2 minutos |
| 🏳️ **¿Qué bandera es?** | Quien quiere jugar y ya | 90 segundos |

Son tres tipos de jugador distintos y ninguno molesta a los otros. Una
persona puede jugar solo el reto diario durante dos años y estar
perfectamente servida: eso es un éxito, no un fallo.

**El resto de modos empiezan cerrados.** Y ese es el truco.

---

## 3. Los jefes reparten el juego

Hoy el juego tiene ocho modos y casi nadie descubre más de dos, porque
están en una lista. En la campaña, **cada jefe derrotado abre un modo nuevo
en el menú libre**, para siempre.

| Jefe | Fase | Abre en juego libre |
|---|---|---|
| 1 | 6 | Elige la bandera *(ya existe)* |
| 2 | 12 | Siluetas |
| 3 | 18 | ¿Dónde está? (el mapa) |
| 4 | 24 | Bandera y capital *(ya existe)* |
| 5 | 30 | La cuadrícula 3×3 |
| 6 | 36 | Vecinos y rutas |
| 7 | 42 | Frío o caliente |
| 8 | 48 | Alfabetos perdidos |
| 9 | 54 | Supervivencia *(ya existe)* |
| 10 | 60 | Mayor o menor |
| 11 | 66 | **Rarezas** (las banderas que no son de países) |
| 12 | 72 | 👑 **Jefe final** → modo sin fin |

Cuatro de esos modos **ya están escritos** (`js/game.js`). La campaña no los
inventa: los convierte en recompensas. Un modo que te dan cuando lo ganas
vale mucho más que el mismo modo escondido en una lista.

Y da la respuesta a "¿por qué seguir en el Condado?": porque cada seis
fases el juego se hace más grande.

---

## 4. El tablero es el mapa, y empieza en gris

Propongo que el tablero no sea un camino abstracto: **que sea el mapa del
mundo, borrado.**

El Borrón ha vaciado el atlas. Al empezar, el mundo es gris, sin nombres, y
todas las banderas están en blanco. Cada fase ganada devuelve el color a un
trozo. Al terminar una región, se colorea entera de golpe.

- **El progreso se ve sin explicarlo.** No hace falta una barra: se ve
  cuánto mundo queda gris.
- **Unifica tres pantallas en una**: el mapa que se colorea, el álbum y el
  pasaporte pasan a ser el mismo objeto.
- **Da escenario al jefe final**: el mundo entero de una vez.
- **Y abarata el arte**: no hay que ilustrar un tablero, hay que hacer un
  mapa que pase de gris a color.

La bandera en blanco es, además, la mejor casilla vacía posible para un
álbum, y es un chiste visual que un niño entiende sin que se lo cuenten.

---

## 5. Cada fase tiene su propio modo

Esto es importante y en la versión anterior lo expliqué mal: **no propongo
que todas las fases sean iguales.** Justo lo contrario. Una fase se define
así:

```
fase = MODO + zona del mundo + objetivo + restricción
```

El **modo cambia constantemente**. Lo que propongo es que las fases se
*compongan* de esas cuatro piezas en vez de inventarse una por una desde
cero — igual que `js/levels.js` ya define los cuatro niveles clásicos con
parámetros en vez de con código propio para cada uno.

Así se ve la primera región entera:

| # | Fase | Modo |
|---|---|---|
| 1 | Las banderas del oeste de Europa, con su nombre a la vista | Aprender |
| 2 | Las mismas, ahora de memoria | Bandera |
| 3 | Sus capitales | Capital |
| 4 | Señálalas en el mapa | Ubicación |
| 5 | Mezcla de las tres, sin fallar dos veces seguidas | Mixto |
| 6 | 👑 **El Impostor** — los tricolores que se confunden | Jefe |
| 7 | Las cruces del norte: nórdicas y bálticas | Bandera |
| 8 | Reconoce el país por su forma | Silueta |
| 9 | Capitales del este de Europa | Capital |
| 10 | ¿Cuál **no** limita con Alemania? | Vecinos |
| 11 | Diez banderas de Europa en sesenta segundos | Contrarreloj |
| 12 | 👑 **El Puzle del Borrón** — recomponer tres banderas rotas | Jefe |

Doce fases, ocho modos distintos, y ninguna escrita a mano: todas salen de
combinar piezas. Con seis modos, treinta zonas y cinco objetivos salen
cientos de combinaciones sin escribir contenido nuevo.

**A mano solo se diseñan los doce jefes.** Doce sí las hace bien una
persona; setenta y dos, no.

### Enseñar antes de examinar

Fíjate en el orden de la región: las primeras fases **enseñan** (la bandera
con su nombre a la vista, como el modo Aprender) y las siguientes van
quitando ayuda hasta pedirlo de memoria. Eso convierte la campaña en el
tutorial del juego entero y en el motor de aprendizaje, sin que parezca
ninguna de las dos cosas.

---

## 6. Los jefes, y lo que cuesta cada uno

Cada jefe **presenta un formato nuevo**, que es lo que justifica el
desbloqueo. Ordenados por lo que cuestan:

### 6.1 El puzle de bandera · **casi gratis**

Recomponer una bandera rota en piezas. `js/daily.js` **ya parte las
banderas en nueve piezas** para el reto diario.

### 6.2 El impostor · **gratis**

Dos banderas casi idénticas, elige la buena. `js/confusables.js` tiene
**25 grupos ya escritos a mano**, con la explicación de en qué se
diferencian. Un jefe entero sacado de un archivo que ya existe.

### 6.3 Frío o caliente

Nombras países y el juego solo dice a qué distancia estás. `js/geo.js` ya
calcula distancia y rumbo.

### 6.4 El alfabeto perdido

Tu idea era una frase en un idioma. Le daría una vuelta: **que sea el
alfabeto, no la lengua.** Una palabra en georgiano, tailandés, amárico,
coreano, griego o armenio.

Reconocer una escritura es **visual**, como una bandera: un niño de siete
años puede jugarlo sin saber ningún idioma. Y no tiene la ambigüedad del
idioma hablado (¿el español es España o México?). Con el georgiano no hay
duda posible.

*Coste: una tabla de treinta palabras.*

### 6.5 La cuadrícula 3×3

Rejilla donde cada casilla cruza dos categorías. Las categorías salen solas
de las etiquetas de patrón y paleta que `js/countries.js` ya guarda.

### 6.6 La curiosidad · **el único caro, y tiene arreglo**

Escribir doscientas curiosidades **por seis idiomas** es un trabajo enorme.
Arreglo: que la mayoría **se deduzcan de los datos** — *"el único país que
limita con otros diez"*, *"el país sin salida al mar más grande"* — porque
así salen infinitas y solo hay que traducir la plantilla. Y encima, doce
escritas a mano, una por jefe, que son las que dan personalidad.

---

## 7. Que sea visual: el jugo, en Papel & Tinta

"Que enganche" no es una mecánica: es que **cada toque devuelva algo**. Pero
en vez de confeti genérico, el juego ya tiene un lenguaje visual propio
("Papel & Tinta") y el jugo debería salir de ahí:

- **La tinta que se extiende.** Al acertar, el país se colorea como una
  mancha de tinta que se expande por el mapa. No es un relleno: es un gesto.
- **El sello de goma.** Cada bandera recuperada se sella en el pasaporte con
  el golpe seco y el ligerísimo temblor de un sello de verdad.
- **El lacre.** Derrotar a un jefe cierra la región con un sello de cera
  roja. Sonido, peso, y una animación que se ve una vez cada seis fases y
  por eso no cansa.
- **Los números que saltan.** `+150` sale grande, encoge y se va. Siempre
  *después* del acierto, nunca antes.
- **Las monedas que vuelan al contador** al terminar la fase, de una en una
  y acelerando. Es de las animaciones más satisfactorias que existen y
  cuesta veinte líneas.
- **La barra que se llena delante de ti**, nunca ya llena al entrar.
- **El "casi".** Cuando falles por poco, que se note: la bandera correcta se
  enseña al lado de la que elegiste, con la diferencia marcada.
- **La anticipación del cofre**: que tarde en abrirse. La espera de dos
  segundos vale más que el premio.

Regla general: **la recompensa se anima, el castigo no.** Un fallo se
resuelve rápido y sin drama; un acierto se celebra. En un juego de niños
esa asimetría es todo.

---

## 8. El dinero

Quieres una moneda que se gane jugando y que también se pueda comprar. Se
puede hacer, y hay una forma correcta de hacerlo.

### Cómo la diseñaría

**Una sola moneda: escudos.** Se ganan terminando fases, derrotando jefes,
manteniendo la racha y con el reto diario.

**Se gastan en:**

- Sombreros, trajes y músicas para el conde.
- Marcos y sellos para el pasaporte.
- Reliquias de más: una pista, dejar solo dos respuestas, congelar el
  tiempo, repetir un jefe sin esperar.
- Adelantar una bandera de la vitrina.

**No se gastan nunca en:** saltarse fases, ventaja en las ligas, ni nada
que toque el reto diario. Ese es el límite, y conviene escribirlo antes de
que alguien proponga cruzarlo: **el dinero no entra donde la gente se
compara.**

### Las reglas que hay que cumplir (y son nuevas)

Desde marzo de 2025 la red europea de protección al consumidor tiene siete
principios sobre monedas de juego, pensados justo para juegos con menores.
Los que afectan al diseño:

- **Los precios se enseñan en euros además de en escudos.** Si el sombrero
  cuesta 450 escudos, tiene que verse también cuánto es eso en dinero.
- **Nada de packs pensados para que sobren monedas.** Vender de 500 en 500
  cuando todo cuesta 450 es exactamente la práctica que señalan.
- **No se puede obligar a pasar por la moneda** para comprar algo.
- **Nada de cajas sorpresa de pago.** Los sobres se ganan jugando; si se
  venden con dinero y el contenido es aleatorio, entras en el terreno más
  vigilado que hay ahora mismo en Europa, y con menores de por medio.
- **Puerta parental antes de la tienda**, además del control que ya ponen
  Apple y Google.

### Y un consejo de negocio, no de diseño

En juegos familiares el dinero casi nunca viene de los packs de monedas:
viene de **una compra única que hace un adulto**. Un "Pase del Condado" que
abra todos los capítulos, quite cualquier espera y regale un sombrero
exclusivo, por un precio de una cifra, rinde normalmente más que una
tienda de monedas — y da mucho menos trabajo, menos problemas con las
tiendas y ninguna mala conciencia.

Yo montaría las dos cosas, pero en este orden: primero los escudos que se
ganan (sin tienda), y la compra opcional después, cuando ya se sepa qué
compra la gente. Las tiendas se quedan entre el 15 y el 30% en cualquier
caso.

---

## 9. Las banderas que no son de países

Tu idea de desbloquearlas resuelve una tensión documentada:
`decisiones-producto.md` fija el catálogo en los 195 de la ONU y prohíbe
ampliarlo para no meterse en disputas de soberanía.

**Como contenido desbloqueable el problema desaparece**, y una vez
desbloqueadas entran en el juego de verdad, como pides:

- **Se juegan** en el modo Rarezas (jefe 11), en fases especiales de la
  última región y en las partidas libres una vez abiertas.
- **Viven en la vitrina del conde**, una sección aparte del pasaporte.
- **Nunca aparecen en el reto diario**, que es compartido y tiene que ser
  igual y justo para todo el mundo.
- **No cuentan en el 195/195** del álbum. Son un extra, no parte del atlas.

Qué metería: la olímpica, la de la ONU, la Unión Europea, la Cruz Roja, la
pirata, la de cuadros de las carreras, la del Everest, la de la Antártida,
las banderas históricas famosas, la del Tíbet, la de Esperanto.

Qué evitaría de entrada: los territorios en disputa activa. No por
cobardía, sino porque cada uno trae su propia discusión y el objetivo de la
vitrina es que sea divertida. Si alguna vez se meten, que sea una decisión
tomada a propósito y escrita en `decisiones-producto.md`, no un efecto
lateral de necesitar contenido.

---

## 10. Lo de "12 fases o 72", explicado bien

Aquí me expliqué mal. **La campaña son 72 fases.** Eso no está en duda.

Los 12 no son un diseño alternativo: son **por dónde empezar a construir**.
Es la diferencia entre diseñar la carta entera de un restaurante —que hay
que hacerla— y cocinar solo los entrantes la primera noche para ver si la
gente vuelve.

En concreto: construir **la primera región completa** (las once fases de
Europa y su jefe), con el mapa que se colorea y el conde con su sombrero.
Eso ya es jugable de principio a fin y contesta la única pregunta que
importa: **¿cuánta gente llega al final de la primera región?**

- Si la mitad la termina, la campaña funciona: se construyen las otras
  cinco regiones con confianza.
- Si abandonan en la cuarta fase, hay algo que arreglar en el ritmo — y es
  mucho mejor arreglarlo una vez que seis.

Son dos semanas para saberlo, en vez de dos meses. Las 72 se hacen igual;
lo único que cambia es que se hacen sabiendo.

---

## 11. Lo que hay que decidir antes de empezar

**11.1 Qué pasa tras el jefe final.** Decidirlo *antes* de la primera fase.
Lo natural: el mundo queda restaurado, el conde recupera el título y se abre
el modo sin fin con las regiones repetibles en difícil. Si no está pensado,
el juego se acaba de golpe justo con quien más lo ha jugado.

**11.2 La campaña no toca el reto diario.** El ritual va aparte, no reparte
reliquias y no se puede acelerar con dinero.

**11.3 Doce escenas de historia, no una por fase.** Tres frases por escena,
por seis idiomas, son 216 traducciones. Asumible si son doce; imposible si
son setenta y dos.

**11.4 El conde hay que dibujarlo.** Es el único gasto de arte real:
un personaje y ocho complementos, en el estilo que ya tiene el juego.

**11.5 Cuánto cuesta cada fase.** Objetivo medible: las fases normales se
ganan a la primera cuatro de cada cinco veces; los jefes, al segundo o
tercer intento. Un jefe que se gana a la primera no es un jefe; uno que
atasca cinco veces echa a la gente.

---

## 12. Referencias que valen para este caso

**El camino de Duolingo.** Cambiaron un árbol lleno de opciones por un
camino con **una sola siguiente cosa que hacer**. Lección: al abrir, el
tablero no ofrece decisiones, ofrece un botón.

**El mapa de Candy Crush.** Robar el ritmo: la fase difícil se ve venir, y
verla venir es media emoción. **No robar** las vidas ni los muros de pago.

**Las medallas de Pokémon.** Cada jefe con su tema y su medalla, no solo
más difícil. Es el precedente exacto de un jefe por región.

**Los mapas de roguelike.** Para la segunda versión: que el camino se
bifurque entre la ruta fácil y la difícil que da mejor reliquia. Añade
decisión sin añadir contenido.
