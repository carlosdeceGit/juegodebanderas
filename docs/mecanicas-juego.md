# Mecánicas: hacerlo más jugable y que la gente vuelva

**Propuesta, no decisión.** Mirado con ojos de diseño de juego casual y de
crecimiento, no de ingeniería. Todo lo de aquí funciona igual en el
navegador que en la app.

---

## 1. El diagnóstico incómodo

**El juego está diseñado como un concurso de preguntas, no como un juego
casual.** Son cosas distintas y se nota en seis sitios:

**1.1 Las partidas son demasiado largas.** `levels.js` manda 12 rondas en
Nene y **20 en Experto y Dios**. Veinte rondas a nueve segundos, más leer
la capital entre ronda y ronda, son tres o cuatro minutos. La sesión casual
de móvil dura entre 60 y 90 segundos. Una partida que no cabe en una cola
del súper no se juega en la cola del súper.

**1.2 Se tarda demasiado en llegar a la primera bandera.** Modo, nivel,
jugador: tres pantallas antes de jugar. Cada pantalla previa a la diversión
se lleva por delante una parte de quien abre la app por primera vez.

**1.3 No hay ninguna decisión dentro de la partida.** Ves bandera, tocas
respuesta, repites veinte veces. No hay nada que administrar, arriesgar ni
elegir. Un juego casual necesita al menos una decisión pequeña por sesión.

**1.4 Todo es predecible.** Aciertas y suma lo mismo siempre. No hay
sorpresa, y la sorpresa es el motor de casi todo juego que engancha.

**1.5 La puntuación no significa nada.** 4.320 puntos, ¿comparado con qué?
Sin un objetivo delante, un número es solo un número.

**1.6 No hay razón para una segunda partida el mismo día.** El reto diario
se acaba en un minuto y el modo clásico no lleva a ningún sitio. Las apps
que retienen dan **tres o cuatro motivos distintos** para volver a abrir.

Lo bueno: casi todo esto se arregla con mecánicas pequeñas, y el juego ya
tiene los datos que hacen falta.

---

## 2. Los tres arreglos invisibles

No se ven en una captura de pantalla y son los que más mueven la retención.

### 2.1 Partidas de 90 segundos

Bajar el modo clásico a **7 rondas** (o dejar elegir entre 7 y 15 como
"partida corta / partida larga", con la corta por defecto). Contra la
intuición, **jugar menos hace que se juegue más**: tres partidas de 90
segundos retienen muchísimo mejor que una de cinco minutos, porque cada
final es un momento natural para decidir "otra".

Y una partida corta cabe donde de verdad se juega: el autobús, la cola, los
cinco minutos antes de cenar.

### 2.2 Un botón y a jugar

Un **JUGAR** grande que arranca con lo último que jugaste, saltándose el
asistente entero. Quien quiera cambiar de modo o de nivel, que toque
"cambiar". El asistente pasa de peaje obligatorio a opción.

La tarjeta "Seguir jugando" ya existe: es exactamente esto, solo que
escondida debajo en lugar de ser lo primero.

### 2.3 Dificultad adaptativa · **la palanca más grande de todas**

Un juego casual busca que aciertes **alrededor del 80% de las veces**. Por
encima, aburre. Por debajo, se abandona. Hoy la dificultad la fija el nivel
elegido y no se mueve.

La regla, sencilla: cada mazo se construye con **70% de banderas que ya
dominas o casi, y 30% del filo de tu conocimiento**. Si fallas mucho, sube
la proporción conocida; si arrasas, la baja. El juego ya prioriza las
banderas menos vistas, así que la mitad del trabajo está hecha.

Nadie ve esto nunca. Es lo que hace que el juego "esté bien hecho".

### 2.4 La primera partida se gana

Que las tres primeras banderas de la primera partida de la vida sean
España, Francia y Japón. Una persona que gana su primera sesión vuelve; una
que la pierde, no. Es una de las cosas mejor medidas del sector y cuesta
diez líneas.

---

## 3. Que haya algo que decidir

### 3.1 El combo, con riesgo

El multiplicador por racha ya existe (x2 a partir de 3 aciertos), pero es
un adorno en una esquina. Convertirlo en tensión:

- Que se vea crecer y **que se vea lo que pierdes**: "vas x3".
- Al fallar, no se pierde entero: baja un escalón. Perderlo todo de golpe
  desanima; bajar un peldaño hace que aprietes.

### 3.2 Comodines de verdad

Las pistas ya existen (3 en Nene, 0 en Dios) pero son un botón. Hacerlas
tres objetos distintos, con decisión:

- **Media bandera** — quita dos opciones falsas.
- **Congelar** — para el reloj cinco segundos.
- **Brújula** — dice el continente.

Se ganan jugando (ver los sobres, 4.1), no se compran. Un comodín que
guardas para el momento difícil convierte una partida en una historia.

### 3.3 Última ronda: doble o nada

En la última ronda, elegir antes de verla: **te la juegas por el doble o
guardas lo que llevas**. Una decisión, dos segundos, y un final de partida
con pulso en lugar de un desvanecido.

### 3.4 Un objetivo delante

Nunca enseñar una puntuación sola. Siempre contra algo: *"tu récord: 4.320"*,
*"te faltan 300 para tu mejor marca"*, *"llevas 8 seguidas, tu récord es 11"*.
Un número con un objetivo al lado deja de ser un número.

---

## 4. La sorpresa

Es lo que hace que "una más" sea automático. Y es donde hay que tener
cuidado, porque es la misma psicología que usan las máquinas tragaperras.

### 4.1 Sobres de cromos · **la que mejor encaja con este juego**

Al terminar una partida, un sobre: tres banderas al azar para el álbum, o
un comodín, o un cromo brillante. Se abre con animación, de una en una.

Por qué esta y no otra: **abrir un sobre de cromos es exactamente lo que se
hace con las banderas en la vida real.** No es una mecánica de videojuego
pegada encima, es el tema del juego. Y da al fin una razón para la segunda
partida del día.

### 4.2 Banderas doradas

Una de cada veinte veces, la bandera sale con marco dorado: vale el triple
y en el álbum queda para siempre como **cromo brillante**. Es la psicología
del cromo raro, cuesta casi nada y hace que se juegue "a ver si sale una".

### 4.3 La línea que no cruzo

Con público de 15 en adelante ya no es una obligación legal, pero sigue
siendo lo que yo haría (`publico-objetivo.md` §3.3):

- **Los sobres se ganan jugando y no se venden.** Un juego de conocimiento
  que vende aleatoriedad se gana una reputación que no le compensa.
- **Nada de contadores de urgencia** ("¡solo 3 minutos!"), ni de culpa por
  la racha perdida, ni de recompensas que caducan mientras duermes.
- **Nada de jugadores falsos**: si el ranking dice que hay alguien, que
  haya alguien.

La diferencia entre un buen juego casual y uno depredador es exactamente
esta lista.

---

## 5. El pasaporte: la capa que lo une todo

Hace falta **un objeto** que sea "lo tuyo", donde todo lo que haces deja
marca. Para un juego de banderas ese objeto se llama solo: **un pasaporte**.

Dentro:

- **Los sellos.** Uno por continente dominado, y uno por colección temática
  completada. Un pasaporte con sellos es infinitamente más deseable que una
  lista de logros.
- **El rango**, ligado a banderas dominadas: Grumete → Explorador →
  Cartógrafo → Almirante. Una escalera visible, no una barra de experiencia
  que no significa nada.
- **Los cromos brillantes**, aparte, para presumir.
- **El mapa**, coloreándose.

Y es lo que se comparte: una foto del pasaporte es mucho mejor material que
una puntuación.

### 5.1 Las banderas se oxidan

Una bandera dominada que llevas dos meses sin ver **empieza a oxidarse** y
el pasaporte lo enseña: *"12 banderas oxidándose"*. Se recuperan repasando.

Es el repaso espaciado disfrazado de algo que quieres proteger. Y funciona
porque la gente se mueve mucho más por no perder lo que tiene que por
ganar algo nuevo.

---

## 6. El fallo como contenido

Aquí el juego tiene una mina sin explotar. `confusables.js` tiene 25 grupos
de banderas que se confunden, escritos a mano y ya explicados, y
`countries.js` etiqueta cada bandera con su patrón y su paleta.

Con eso, al fallar se puede decir **por qué**:

> Era Chad. Te has quedado con Rumanía: las dos son azul-amarillo-rojo en
> vertical y solo cambia el tono del azul.

Eso hace tres cosas a la vez: convierte el fallo en aprendizaje real,
genera la sensación de "casi" —que es la emoción que más engancha de todo
el diseño de juegos— y da material de conversación, que es lo que hace que
alguien enseñe el juego a otra persona.

Y una línea más, cuando haya datos: *"7 de cada 10 personas fallan esta"*.
Fallar en compañía consuela.

---

## 7. Lo social que de verdad retiene

### 7.1 El fantasma

Jugar contra la repetición de la partida de otra persona: su barra avanza
al lado de la tuya, en tiempo real, aunque jugara ayer. Es multijugador
asíncrono que **se siente en directo**, sin salas, sin esperas y sin que
nadie tenga que estar conectado. Es la mecánica que hizo grande a los
juegos de preguntas por turnos.

### 7.2 Modo relevo · **lo que nadie más puede hacer aquí**

Dos personas, **un solo dispositivo**, turnos alternos, una puntuación
compartida. Un padre y su hija en el sofá, con el mismo móvil.

Esto merece atención especial: casi todos los juegos casuales compiten por
la atención de una persona sola. Este juego ya es familiar —tiene fichas de
jugador en el mismo dispositivo, nivel Nene, seis idiomas— y el modo
cooperativo en el sofá es un espacio que está prácticamente vacío. Es la
mecánica más diferencial de todo el documento, y encima es la que hace que
un adulto instale la app *y* se la enseñe a alguien.

### 7.3 El reto por enlace

*"Te reto con estas diez banderas."* Quien lo recibe juega el mismo mazo en
el navegador, **sin instalar nada**. Ahí la web deja de ser un lastre y
pasa a ser la demo gratuita de la app.

---

## 8. Crecimiento: el bucle, no los trucos

### 8.1 Que compartir dé algo

Hoy compartir el resultado del reto es un acto de generosidad. Que devuelva
algo: quien comparte ve en su pasaporte quién ha jugado su reto y qué tal
le ha ido. Un bucle se cierra cuando el que empuja también recibe.

### 8.2 Un aviso, el más urgente

Con racha, liga, repaso pendiente y reto diario hay cuatro motivos para
avisar. **Mandar los cuatro es el camino más rápido a que desactiven las
notificaciones.** Uno al día, el más urgente de los cuatro, y siempre
concreto: *"te quedan 12 banderas oxidándose"* rinde mucho más que
*"¡vuelve a jugar!"*.

### 8.3 Recuperar al que se fue

A los siete días sin abrir: un solo aviso, con lo que tiene que perder, no
con lo que hay de nuevo. A los treinta, otro. Y parar. Quien no vuelve con
dos, no vuelve.

### 8.4 Qué medir

Sin esto, todo lo anterior son opiniones. Lo mínimo:

| Qué | Para qué |
|---|---|
| % que termina su primera partida | Mide 2.2 y 2.4 |
| Vuelta al día siguiente (D1) y a la semana (D7) | La salud del juego |
| Partidas por sesión | Mide los sobres y las partidas cortas |
| % de aciertos por jugador | Debe rondar el 80%: mide 2.3 |
| Retos enviados y aceptados | El único crecimiento que no se paga |
| Días de racha antes de romperse | Si es 1 o 2, la racha no funciona |

De referencia, un juego casual decente ronda un 30-40% de vuelta al día
siguiente y un 10-15% a la semana. Pero lo que importa no es acertar el
número: es que **cada mecánica de esta lista tenga una métrica que diga si
sirvió**, para poder quitarla si no.

---

## 9. Lo que no haría

- **Vidas o energía.** El mecanismo para que dejes de jugar. En un juego
  sin monetización agresiva no tiene ninguna función.
- **Sobres de pago.** Ver 4.3.
- **Rivales inventados** para que el ranking parezca lleno.
- **Cien logros.** Doce sellos que se persiguen valen más que cien que se
  ignoran.
- **Racha que se rompe al fallar.** Solo se rompe al no jugar. Castigar el
  fallo es la forma más rápida de que alguien deje de intentarlo, tenga la
  edad que tenga.
- **Anuncios.**

---

## 10. Si solo se pudieran meter tres

1. **Partidas de 90 segundos y botón de jugar directo.** No es una mecánica
   nueva: es quitar lo que estorba. Y es lo que más sube.
2. **Sobres de cromos al terminar.** La razón para la segunda partida, y la
   que mejor encaja con el tema.
3. **El pasaporte con sellos y banderas que se oxidan.** Lo que convierte
   partidas sueltas en algo que no quieres perder.

Y si hubiera una cuarta, el **modo relevo**: es lo único de esta lista que
los demás juegos de banderas no pueden copiar fácilmente, porque no están
hechos para jugarse entre dos personas en el mismo sofá.
