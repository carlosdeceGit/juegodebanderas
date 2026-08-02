# El Condado: modo campaña

**Propuesta, no decisión.** Desarrollo de la idea del conde que perdió los
nombres y las banderas del mundo y tiene que recuperarlos fase a fase.

---

## 1. Por qué esta idea es mejor de lo que parece

La mayoría de los juegos casuales pegan una historia encima de una mecánica
que no la necesita. Aquí pasa lo contrario, y es raro: **la trama y la
mecánica son la misma cosa.**

Si el conde es quien puso los nombres y las banderas al mundo y se lo han
quitado todo, entonces acertar una bandera **no es puntuar, es recuperarla**.
El álbum deja de ser una pantalla de estadísticas y pasa a ser el objetivo
del juego. Los tres documentos anteriores buscaban una razón para
coleccionar; esta idea la trae puesta de fábrica.

Y resuelve de paso los tres problemas que peor pinta tenían:

| Problema detectado antes | Cómo lo resuelve la campaña |
|---|---|
| Tres pantallas antes de jugar | El tablero dice dónde estás y cuál es la siguiente. Un toque |
| La puntuación no significa nada | Ya no puntúas: liberas un trozo de mundo |
| Ocho modos que nadie descubre | Cada fase presenta uno. El menú desaparece |
| El contenido se acaba a las 195 banderas | 72 fases con objetivos distintos sobre el mismo catálogo |

---

## 2. El giro que yo le daría: **el tablero es el mapa**

En la idea original el tablero es un camino de fases. Propongo algo más
fuerte: **el tablero es el mapa del mundo, y empieza en blanco.**

El Borrón —o como se llame el villano— ha borrado el atlas. Al empezar, el
mundo es gris, sin nombres, y todas las banderas están en blanco. Cada fase
ganada devuelve el color a un trozo de mapa. Al final de una región,
Sudamérica entera pasa de gris a color de golpe.

Lo que se gana con eso:

- **El progreso se ve de un vistazo y sin explicarlo.** No hace falta una
  barra: se ve cuánto mundo te queda gris.
- **Unifica tres cosas que iban por separado** en los documentos
  anteriores: el mapa que se colorea, el álbum de cromos y el pasaporte
  pasan a ser el mismo objeto.
- **Da la escena del jefe final**: el mundo entero, de una vez.
- **Y abarata el arte.** No hace falta un tablero ilustrado: hace falta un
  mapa que pase de gris a color. Eso ya es bonito.

La bandera en blanco, además, es la mejor imagen posible para una casilla
vacía del álbum. Y es un chiste visual que un niño entiende sin que nadie
se lo cuente.

---

## 3. Estructura: 72 fases que no hay que diseñar a mano

**Aquí está el mayor riesgo del proyecto.** Candy Crush ajusta sus niveles
uno a uno con un equipo dedicado. Si cada una de las 72 fases hay que
inventarla, el proyecto muere en la fase 20 — no por difícil, por aburrido
de hacer.

La solución es que las fases **se generen a partir de una plantilla**, como
ya hace `levels.js` con los cuatro niveles clásicos:

```
fase = modo + zona del mundo + objetivo + restricción
```

- **Modo**: bandera, capital, silueta, ubicación, vecinos, mezcla.
- **Zona**: África Occidental, los Balcanes, el Caribe…
- **Objetivo**: acertar 8 de 10, encadenar 5 seguidas, terminar en 60s.
- **Restricción**: sin pistas, sin fallar dos veces, a contrarreloj.

Con seis modos, treinta zonas y cinco objetivos salen cientos de fases
distintas sin escribir ninguna. **Solo los doce jefes se diseñan a mano**, y
doce sí es un número que una persona puede hacer bien.

### El reparto

Seis regiones de doce fases. Once normales y una de jefe, con un jefe
intermedio en la sexta: **jefe cada 6 fases, 12 jefes, 72 fases.**

| Región | Por qué ahí |
|---|---|
| 1. Europa | Casi todo el mundo reconoce algo. Se gana pronto |
| 2. América | Sigue habiendo terreno conocido |
| 3. Asia | Empieza lo difícil de verdad |
| 4. África | La región donde más se aprende: 54 países |
| 5. Oceanía | Pocos países y muy parecidos: exige precisión |
| 6. El mundo | Todo mezclado. Aquí vive el jefe final |

Los cinco continentes son exactamente los que ya existen en
`countries.js` (`af`, `am`, `as`, `eu`, `oc`), así que las zonas salen de
datos que ya están.

### Enseñar antes de examinar

Dentro de cada región, las tres primeras fases deberían **enseñar** —las
banderas se ven con su nombre, como en el modo "Aprender"— y las siguientes
ir quitando ayuda hasta pedir el nombre de memoria.

Eso convierte la campaña en el tutorial de todo el juego *y* en el motor de
aprendizaje, sin que parezca ninguna de las dos cosas. Es también donde
encaja sin ruido el repaso espaciado: una fase de cada cuatro repesca lo
que fallaste hace días.

---

## 4. Los jefes: formatos nuevos, y cuánto cuesta cada uno

Aquí es donde la idea brilla, porque cada jefe **presenta un formato nuevo
sin necesidad de un menú de modos**. Ordenados por lo que cuestan:

### 4.1 El puzle de bandera · **prácticamente gratis**

Ordenar las piezas de una bandera desordenada. `js/daily.js` **ya parte las
banderas en nueve piezas** para el reto diario: la mitad del trabajo está
escrita.

### 4.2 El impostor · **gratis**

Dos banderas casi idénticas y hay que elegir la correcta. `confusables.js`
tiene **25 grupos ya escritos a mano** con la explicación de en qué se
diferencian. Es un jefe entero sacado de un archivo que ya existe.

### 4.3 Frío o caliente

Vas nombrando países y el juego solo dice a qué distancia estás. `geo.js`
ya calcula distancia y rumbo para las pistas del reto.

### 4.4 El alfabeto perdido · **mejor que "el idioma"**

Tu idea era una frase en un idioma y adivinar el país. Le daría una vuelta:
**que no sea el idioma, que sea el alfabeto.** Una palabra en georgiano, en
tailandés, en amárico, en coreano, en griego, en armenio.

Por qué es mejor: reconocer una escritura es **visual**, como una bandera,
así que un niño de siete años puede jugarlo sin saber ni un idioma. Con el
idioma hablado, además, la respuesta es ambigua (¿el español es España o
México?); con el alfabeto georgiano no hay duda posible. Y la parte
educativa es preciosa: hay quince alfabetos que casi nadie sabe que existen.

*Coste: una tabla de treinta palabras. Barato y muy vistoso.*

### 4.5 La cuadrícula

La rejilla 3×3 del documento anterior. Las categorías salen solas de las
etiquetas de patrón y paleta que `countries.js` ya guarda.

### 4.6 La curiosidad · **el único jefe caro, y tiene arreglo**

Tu idea de "una definición y adivinar el país" es la más divertida y la más
cara: escribir doscientas curiosidades **por seis idiomas** es un trabajo
enorme.

El arreglo: que la mayoría **se deduzcan de los datos** en lugar de
escribirse. *"El único país que limita con otros diez"*, *"el país sin
salida al mar más grande"*, *"el que tiene más vecinos de África"*. Se
generan solas de la tabla de fronteras y superficies, salen infinitas y no
hay que traducir nada más que la plantilla de la frase.

Y encima de eso, **doce curiosidades escritas a mano**, una por jefe, que
son las que dan personalidad. Doce sí se escriben; doscientas no.

---

## 5. La economía: dos monedas, y una es muy lista

Tu instinto de separar los premios de los jefes de los premios normales es
correcto, y es exactamente cómo se diseña esto bien.

### De los jefes: reliquias (sirven para algo)

Pista, dejar solo dos respuestas, congelar el tiempo, una segunda
oportunidad. **Se ganan solo derrotando jefes**, así que un jefe no da
puntos: da una herramienta que cambia cómo juegas las siguientes fases.

Y ahí hay una decisión fina: que las reliquias **se recarguen jugando** en
lugar de gastarse para siempre. Un objeto que no se gasta nunca deja de
tener decisión; uno que se gasta y no vuelve, no se usa nunca "por si
acaso". Que se recarguen cada día es el punto medio.

### De las fases normales: cosas que no sirven para nada (y por eso valen)

Músicas, sombreros y trajes para el conde, sellos para el pasaporte, marcos
para las banderas. **Nada que dé ventaja.** Los premios cosméticos son los
que se pueden repartir a manos llenas sin desequilibrar nada, y son los que
la gente enseña.

Empezaría con ocho o diez sombreros y complementos antes que con trajes
enteros: un sombrero es un dibujo pequeño y se reconoce igual.

### Y la mejor idea de tu lista: **las banderas que no son de países**

Proponías desbloquear banderas de organizaciones y territorios. Eso resuelve
una tensión que está documentada en el proyecto: `decisiones-producto.md`
fija el catálogo en los 195 de la ONU y prohíbe ampliarlo, precisamente
para no meterse en disputas de soberanía.

**Como premio, no como catálogo, el problema desaparece.** La bandera
olímpica, la de la ONU, la de la Unión Europea, la pirata, la de a cuadros
de las carreras, la del Everest: viven en *la vitrina del conde*, que es
explícitamente un cajón de curiosidades y no el atlas. Nadie tiene que
decidir si Kosovo es un país para poder enseñar la bandera del Tíbet en una
vitrina de rarezas.

Es un sitio donde meter todas las banderas divertidas del mundo sin tocar
ni una línea de la política editorial.

---

## 6. Formatos parecidos, y qué robar de cada uno

Pediste referencias. Estas son las que valen para este caso:

**El camino de Duolingo.** En 2022 cambiaron un árbol lleno de opciones por
un camino con **una sola siguiente cosa que hacer**, y les fue mucho mejor.
La lección: el tablero no debe ofrecer decisiones al abrir la app, debe
ofrecer un botón. La elección se pone *después*, dentro de la partida.

**El mapa de Candy Crush.** Robar el ritmo: la fase difícil llega con una
cadencia reconocible, y se ve venir. Ver que se acerca un jefe es la mitad
de la emoción. **No robar**: las vidas, los muros de pago y la fricción
artificial.

**Las medallas de Pokémon.** Ocho gimnasios, ocho jefes temáticos, una
medalla cada uno. Es el precedente exacto de "un jefe por región con su
sello", y funciona porque cada jefe **tiene tema**, no es solo más difícil.

**Los mapas de los roguelike** (tipo *Slay the Spire*). Un día, cuando la
campaña ya funcione, se puede añadir que el camino se bifurque: la ruta
fácil o la difícil que da mejor reliquia. Es una capa de decisión que no
cuesta contenido nuevo, solo estructura. **Para la segunda versión, no para
la primera.**

**Los tres estrellas de casi todo el género.** Terminar una fase da una
estrella, hacerlo perfecto da tres. Es lo que hace que alguien vuelva a una
fase ya ganada. Con cuidado: si abrir la región siguiente exige demasiadas
estrellas, se convierte en un peaje y la gente lo abandona. Usarlo para
premios extra, no para bloquear el camino.

---

## 7. Lo que hay que resolver antes de empezar

**7.1 Qué pasa después del jefe final.** Hay que decidirlo *antes* de
construir la primera fase, no después. Lo natural aquí: al derrotarlo, el
mundo queda restaurado y el conde recupera el título — y entonces se abre
el modo sin fin, con el mapa ya en color y las regiones repetibles con
dificultad mayor. Si esto no está pensado, el juego se acaba de golpe justo
con quien más lo ha jugado.

**7.2 La campaña no puede tocar el reto diario.** Según la regla del
documento anterior: el ritual va aparte y no reparte premios de campaña. La
campaña es la parte de "práctica". Si el reto diario empieza a dar reliquias,
se rompe lo que lo hace funcionar.

**7.3 El texto de la historia son seis idiomas.** Doce escenas de tres
frases son 36 frases × 6 = 216 traducciones. Es asumible, pero solo si la
historia se cuenta en doce escenas y no en cada fase.

**7.4 El conde hay que dibujarlo.** Es el único gasto de arte de verdad de
toda la propuesta. En el estilo "Papel & Tinta" que ya tiene el juego, un
personaje y ocho complementos es un encargo pequeño y acotado.

**7.5 Cuánto tiene que costar cada fase.** Objetivo: las fases normales se
ganan a la primera **cuatro de cada cinco veces**, y los jefes se ganan al
segundo o tercer intento. Un jefe que se gana a la primera no es un jefe;
uno que se atasca cinco veces echa a la gente. Esto hay que medirlo, no
adivinarlo.

---

## 8. Cómo lo sacaría sin arriesgar tres meses

**No construir 72 fases. Construir 12.**

La primera región —Europa, once fases y un jefe— con dos formatos de jefe:
el puzle de bandera y el impostor, que son los dos que salen casi gratis de
código que ya existe. El mapa en gris que se va coloreando. El conde con un
sombrero.

Eso es una versión jugable de principio a fin, y contesta la única pregunta
que importa: **¿cuánta gente llega al final de la primera región?** Si la
mitad de quien empieza termina las doce fases, la campaña funciona y se
construyen las otras cinco regiones con confianza. Si abandonan en la
cuarta, se arregla la primera región antes de multiplicar el problema por
seis.

Es la diferencia entre apostar dos semanas y apostar dos meses, y la
respuesta es exactamente igual de buena.

---

## 9. Resumen honesto

Lo que más me gusta de la idea: **la trama justifica la colección**, que es
justo lo que a este juego le faltaba, y **los jefes justifican los modos
nuevos** sin un menú. Son dos problemas grandes resueltos por una sola
decisión creativa.

Lo que hay que vigilar: que las 72 fases se generen y no se escriban, que
la curiosidad no se convierta en un trabajo de redacción de doscientas
entradas por seis idiomas, y que el final esté decidido antes que el
principio.

Y lo que hay que aprovechar, porque ya está escrito y pagado: las nueve
piezas del reto diario, los veinticinco grupos de banderas confundibles, la
distancia y el rumbo, las etiquetas de patrón y paleta, y los cinco
continentes.
