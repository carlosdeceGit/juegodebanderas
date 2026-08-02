# Enganche real: qué dicen los datos y hasta dónde puede crecer el juego

**Propuesta, no decisión.** Continuación de `mecanicas-juego.md`, pero esta
vez contrastada con lo que se sabe del sector, no con intuición. Al final
hay una parte incómoda sobre el nombre del juego.

---

## 1. Los números con los que hay que comparar

Retención en juegos de móvil, informe de GameAnalytics 2026:

| | Día 1 | Día 7 | Día 30 |
|---|---|---|---|
| Media de todos los géneros | 26% | 10% | <4% |
| **Juegos de puzle** | **32%** | **12%** | **5,4%** |
| Objetivo sano | 30-40% | 10-20% | 5-10% |

Tres de cada cuatro juegos no llegan al 3% al mes. Esto no es para
desanimar: es para que "que la gente vuelva" deje de ser una sensación y
sea un número. **Si en cuatro semanas el D7 está en 12%, el juego está en
la media alta del sector.**

Y el orden importa: no se optimiza la vuelta al séptimo día hasta que la
primera partida se termina. Primero el embudo del principio, luego el
hábito.

---

## 2. La tensión que hay que resolver antes de añadir nada

Al estudiar por qué funcionan los juegos diarios aparece algo que contradice
la mitad de lo que propuse en el documento anterior:

> Wordle te daba exactamente un puzle al día, el mismo que a todo el mundo,
> y luego se paraba. Sin scroll infinito, sin barra de energía, sin darte
> la lata para que volvieras. **Esa contención es lo que lo convirtió en un
> ritual en lugar de en un sumidero de tiempo.**

Y la propiedad que persiguen todos los juegos diarios y casi ninguno
consigue: **que jugadores de niveles muy distintos se enganchen con el
mismo puzle**. El reto de hoy de este juego ya la tiene — con las pistas de
distancia, un niño y un adulto pueden jugar la misma bandera y los dos
tienen partido.

Eso choca de frente con sobres de cromos, comodines y ligas. Y la solución
no es elegir un bando: es **separar el juego en dos velocidades y no
mezclarlas nunca**.

### El ritual (sagrado)

Uno al día, el mismo para todo el mundo, se acaba en dos minutos, se
comparte y **no da recompensas de progresión**. Nada de sobres, nada de
comodines, nada de multiplicadores. Su premio es el cuadrito para el grupo
de WhatsApp y la racha. Si se le mete economía de juego, se rompe justo lo
que lo hace funcionar.

### La práctica (ilimitada)

Ahí sí: partidas cortas, dificultad adaptativa, sobres, comodines, álbum,
ligas, repaso. Es donde vive todo lo que se propuso antes.

Un jugador puede quedarse solo con el ritual durante años y estar
perfectamente. Ese es el objetivo, no un fallo.

---

## 3. El cambio de fondo: la unidad no es la bandera, es el país

Aquí está el techo real del juego, y conviene verlo pronto.

**Cuando alguien se sabe las 195 banderas, el juego se ha terminado.** No
hay nivel 196. Todo lo que se añada encima —ligas, sobres, rachas— alarga
la partida, pero no cambia que el contenido es finito y bastante pequeño.

La salida no es añadir mecánicas: es **dejar de coleccionar banderas y
empezar a coleccionar países**.

Cada país deja de ser una carta y pasa a ser una ficha con cinco sellos:

| Sello | Qué hay que saber | De dónde salen los datos |
|---|---|---|
| 🏳️ Bandera | Reconocerla | Ya está |
| 🏛️ Capital | Nombrarla | **Ya está** (`names.<idioma>.js`) |
| 📍 Ubicación | Señalarla en el mapa | **Ya está** (lat/lon en `countries.js`) |
| 🗺️ Silueta | Reconocer su forma | Natural Earth (dominio público) |
| 🤝 Vecinos | Con quién limita | GeoNames (CC-BY) |

**195 países × 5 sellos = 975 cosas que dominar**, contra 195 de hoy. Cinco
veces el contenido, con datos gratis y de licencia limpia, sin cambiar el
bucle de juego ni una línea de la pantalla de partida.

Y hace mucho más rico todo lo demás: el pasaporte pasa a tener 195 páginas
con cinco sellos cada una, el repaso espaciado tiene cinco dimensiones por
país, y "país dominado" pasa a significar algo de verdad.

Es exactamente lo que hacen los juegos de geografía que funcionan: Worldle
usa la silueta, Globle la distancia, Tradle las exportaciones, Travle las
rutas. **Los mismos 195 países, otro eje de datos.**

---

## 4. Los modos nuevos, por lo que cuestan

Ordenados por lo que dan dividido entre lo que cuestan:

### 4.1 ¿Dónde está? — señalar en el mapa · **el más barato de todos**

Sale un nombre de país y hay que tocar dónde está. Se puntúa por lo cerca
que caes. **Las coordenadas de los 195 ya están en `countries.js`** (se
metieron para las pistas del reto diario), así que lo único que falta es el
mapa. Funciona con cualquier edad: para un niño, acertar el continente ya
es ganar.

*Coste: 2 días, contando meter el mapa.*

### 4.2 La silueta

La forma del país sin nombre ni color. Es el corazón de Worldle y es de los
formatos que mejor envejecen porque nunca deja de ser difícil. Natural
Earth es dominio público: sin atribución ni licencia.

*Coste: 1 día una vez que el mapa está.*

### 4.3 La cuadrícula diaria · **la mejor idea de este documento**

Una rejilla de 3×3. Cada fila y cada columna es una categoría, y en cada
casilla hay que poner un país que cumpla las dos a la vez. Diez intentos,
cada país solo una vez.

Por ejemplo: fila "África", columna "bandera con estrella" → hay que
nombrar un país africano con una estrella en la bandera.

Por qué esto es especialmente bueno **aquí**:

- **Los datos ya están etiquetados.** `countries.js` guarda el patrón
  (`crescent-star`, `vertical-tricolor`, `triangle-hoist`…) y la paleta de
  cada bandera, más el continente. Las categorías se generan solas: no hay
  que escribir puzles a mano, salen del catálogo.
- Es **el formato diario que más se comparte** después de Wordle, porque
  cada persona rellena la misma rejilla de forma distinta y eso da
  conversación.
- Y trae un truco de puntuación buenísimo: **se puntúa por rareza**. Si
  para "África + estrella" pones Senegal como todo el mundo, sumas mucho;
  si pones Burkina Faso, sumas poco y ganas. Convierte saber más en jugar
  distinto, no solo en acertar antes. Necesita servidor para contar qué
  elige la gente — que es justo lo que da el cimiento del otro documento.

*Coste: 3 días. Es el modo con más recorrido de los cinco.*

### 4.4 Mayor o menor

Dos países, ¿cuál tiene más población? Se encadena hasta fallar. Es un
formato viral probado, cuesta casi nada y el dato es una columna nueva.

*Coste: 1 día.*

### 4.5 Vecinos y rutas

*"¿Cuál de estos NO limita con Brasil?"* Y su versión larga: llegar de
Portugal a Polonia cruzando fronteras. La lista de países limítrofes de
GeoNames es un archivo pequeño y da para dos modos.

*Coste: día y medio.*

---

## 5. Siete días, siete rituales

Con esos modos, el reto diario deja de ser siempre lo mismo **sin dejar de
ser un solo reto al día**:

| | |
|---|---|
| Lunes | Bandera tapada (el de ahora) |
| Martes | Silueta |
| Miércoles | La cuadrícula |
| Jueves | ¿Dónde está? |
| Viernes | Capital |
| Sábado | Ruta entre países |
| Domingo | El difícil de la semana: cinco países seguidos |

Es la misma contención de Wordle —uno al día, el mismo para todos, se
acaba— pero con variedad suficiente para que no canse en tres semanas.
Cada día tiene su propio cuadrito para compartir.

Y aparece un efecto útil: quien es malo con las siluetas vuelve el
miércoles porque la cuadrícula se le da bien. **Siete puertas de entrada en
lugar de una.**

---

## 6. Lo que los datos dicen de la racha

Los números de Duolingo, que es quien más ha medido esto:

- Quien llega a **7 días de racha retiene 2,4 veces más** que quien nunca
  empieza una.
- **El seguro de racha subió la retención a largo plazo un 10%** y redujo
  el abandono un 21%, precisamente porque quita la ansiedad al que está a
  punto de dejarlo.
- Su gamificación entera llevó la retención del 12% al 55%.

Traducido a decisiones concretas:

1. **La racha es la mecánica más rentable de todo el documento.** Va
   primero.
2. **El seguro no es un extra, es parte de la racha.** Un día de gracia al
   mes, automático y sin pedir nada. La versión sin seguro rinde bastante
   peor.
3. **Los primeros siete días son los que importan.** Es donde hay que poner
   los avisos y la ayuda, no en el día 40.

---

## 7. Lo que no añadiría, y por qué

- **Himnos.** Las composiciones son de dominio público, pero **las
  grabaciones no**. Habría que encargarlas o buscar una a una las que tengan
  licencia libre. Mucho trabajo legal para un modo secundario.
- **Monumentos y comida típica.** Requieren fotos con licencia, revisión
  una a una y traen problemas de representación ("la comida de España es
  la paella"). Caro y espinoso.
- **Escudos nacionales.** Muchos tienen derechos de uso restringidos por
  ley de cada país, al contrario que las banderas.
- **Idiomas o monedas como modo propio.** El dato es fácil, pero la
  pregunta no engancha: nadie juega a adivinar el franco CFA.
- **Diez modos a medias.** Tres modos redondos baten a diez que se prueban
  una vez. El propio catálogo del juego ya tiene ocho modos y los
  interesantes son dos.

---

## 8. Una cosa incómoda: el nombre

"Diversión con Banderas" es el nombre del programa de Sheldon en *The Big
Bang Theory*. Como juego familiar en una web es un guiño simpático; como
**marca en la App Store y en Google Play**, es un problema en dos frentes:

1. **Legal.** La serie es propiedad de Warner. No soy abogado y no sé si
   llegaría a haber conflicto, pero publicar bajo el nombre de una marca
   ajena en una tienda es un riesgo que se materializa en forma de retirada
   de la app, no de carta de aviso. Y sería después de haber pagado, montado
   y publicado.
2. **De producto.** El nombre encierra el juego en las banderas justo
   cuando la propuesta es dejar de ser solo de banderas.

Un nombre propio que hable de países y no de banderas resuelve las dos
cosas a la vez, y cambiarlo cuesta mucho menos ahora que con dos mil
descargas. La web puede seguir llamándose como quiera: el guiño se
mantiene, la ficha de la tienda no.

---

## 9. Por dónde empezaría, con este documento y el anterior encima

1. **Medir.** Sin saber cuánta gente termina la primera partida, todo lo
   demás es a ciegas. *(medio día)*
2. **Quitar fricción**: botón de jugar directo y partidas de 90 segundos.
   Sube el número que peor está. *(1 día)*
3. **Racha con seguro.** La mecánica con mejor retorno demostrado.
   *(medio día)*
4. **¿Dónde está?**, que usa coordenadas que ya están guardadas. El primer
   contenido nuevo de verdad y el más barato. *(2 días)*
5. **El pasaporte con cinco sellos por país.** Convierte lo anterior en una
   colección. *(3 días)*
6. **La cuadrícula diaria.** El modo con más recorrido y el que más se
   comparte. *(3 días)*
7. **La semana de siete rituales**, según vayan entrando los modos.

Alrededor de dos semanas de trabajo hasta tener un juego que ya no es "el
de las banderas" sino uno de países, con un motivo distinto para abrirlo
cada día de la semana.
