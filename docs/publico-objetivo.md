# Público objetivo: de 15 años en adelante

**Decisión de partida.** El juego se diseña para **adolescentes y adultos,
de 15 años hasta la edad que sea**. No es un juego infantil.

Este documento **manda sobre los demás**. Varios de ellos —`ideas-app.md`,
`mecanicas-juego.md`, `mecanicas-enganche.md`, `modo-campana.md`,
`historia-conde.md`— apoyan recomendaciones en que el público eran niños.
Donde haya contradicción, vale lo que dice aquí.

---

## 1. Por qué esto cambia tanto

Casi todas las restricciones que fui poniendo en los documentos anteriores
no venían del juego: venían de la edad. Al subirla, unas desaparecen y
otras se dan la vuelta.

Y hay un cambio de fondo mucho más importante que cualquier norma:

> **A un niño se le engancha felicitándole. A un adulto se le engancha
> humillándole un poco.**

Un adulto que descubre que se sabía 41 banderas de 195 vuelve al día
siguiente. Un adulto al que le enseñan la bandera de Japón con el nombre
escrito debajo cierra la aplicación y no la abre más. Todo el diseño de la
dificultad se le da la vuelta a partir de esto — es exactamente el gancho
de Worldle y de GeoGuessr, que no son juegos para niños.

---

## 2. Lo que se cae del todo

| Restricción anterior | Estado |
|---|---|
| Categoría Niños de la App Store y sus normas | **No aplica** |
| COPPA (Estados Unidos, menores de 13) | **No aplica** |
| Consentimiento parental verificable del RGPD | **No aplica**, declarando el juego como no dirigido a menores |
| Prohibición de mandar datos a terceros | **No aplica** |
| Puerta parental antes de la tienda | **No hace falta** (los controles de Apple y Google siguen ahí) |
| "El login social es incompatible" | **Falso ya**: ver §3 |

Lo que hay que hacer en las tiendas, en concreto:

- **Declarar el juego como no dirigido a menores** en el formulario de
  público objetivo de Google Play, para quedarse fuera del programa de
  Familias y de sus normas.
- **Clasificación por edad**: con ligas, nombres de jugador y compras, lo
  razonable es 12+ en Apple y equivalente en Play. Si se quiere no pensar
  más en el asunto, declarar 16+ y se acaba la discusión.
- **La política de privacidad sigue haciendo falta.** Eso no era por los
  niños: es por el RGPD, y aplica a todo el mundo.

## 3. Lo que se da la vuelta

### 3.1 El login social pasa a ser viable

En `ideas-app.md` lo descarté sobre todo porque la categoría Niños prohíbe
mandar datos personales a terceros y porque dirigirse a menores activa el
consentimiento parental. **Con público de 15+ eso desaparece.**

Lo que **sigue** siendo verdad y no cambia:

- **Apple, directriz 4.8**: si ofreces Google o Facebook, tienes que ofrecer
  además una opción equivalente que limite los datos a nombre y correo y
  permita ocultarlo. Sign in with Apple la cumple. Siguen siendo dos.
- **Apple, 5.1.1(v)**: si hay cuenta, tiene que poder borrarse desde dentro.
- **Y el argumento que más peso tenía sigue en pie**: un login al abrir
  rompe el arranque en dos toques. La cuenta anónima con vinculación
  posterior sigue siendo la mejor arquitectura — ahora por producto, no por
  obligación legal.

Recomendación: mantener el plan (cuenta anónima → código de vinculación →
login opcional), y **añadir Apple y Google como opciones de vinculación**,
que antes iban descartadas.

### 3.2 La analítica de terceros deja de estar prohibida

Ya se puede usar una herramienta externa. Yo seguiría prefiriendo la
telemetría propia y agregada en Supabase, pero ahora **por precio y por
sencillez**, no porque las tiendas lo impidan.

### 3.3 Las cajas sorpresa de pago dejan de ser ilegales... y siguen siendo mala idea

Ya no está el agravante de vender aleatoriedad a menores. Pero **los siete
principios europeos sobre monedas de juego siguen aplicando**: son derecho
del consumidor, no protección de la infancia. Precio también en euros, sin
packs que dejan monedas sobrantes, sin obligar a pasar por la moneda.

Mi recomendación no cambia, pero ahora es una opinión y no una barrera:
**vender cosméticos y capítulos, no aleatoriedad**. Un juego de conocimiento
que vende cajas sorpresa se gana una reputación que no le compensa.

### 3.4 El descenso de liga vuelve

Quitar el suelo de la liga Jade. Se puso porque "un niño de ocho años no
tiene que aprender lo que es el descenso"; a los 15+ el descenso es
justamente lo que hace que la última semana importe. Se mantiene solo que
**no se baja más de una liga por mes**, que es equilibrio y no ternura.

### 3.5 Los cosméticos dejan de ser sombreros

Trajes y sombreros para un personaje de dibujos es lenguaje infantil. Para
este público, lo que se colecciona es **el escritorio del Conde**:

- **Tintas** de distintos colores, con las que se colorea el mapa.
- **Lacres** de distintos tonos para cerrar los capítulos.
- **Papeles** para el pasaporte: verjurado, cuadriculado, envejecido.
- **Plumillas**, que cambian el trazo con el que se escribe tu nombre.
- **Encuadernaciones** para el atlas.
- Y un **escudo de armas** propio del condado, que se compone eligiendo
  forma, partición, colores y figuras. Es el equivalente adulto del avatar,
  encaja con el tema mejor que cualquier otra cosa y da muchísimo juego.

Esto es mejor **y más barato**: son colores, texturas y formas
componibles, no dibujos de personaje. Se hacen en casa con SVG.

### 3.6 Y quizá no haga falta dibujar al Conde

Si los cosméticos son el escritorio y no el personaje, **puede que el Conde
no aparezca nunca en pantalla**: se le ve la mano, la pluma, la letra y la
mesa. Es una decisión de estilo muy adulta —y muy barata— que además evita
el riesgo de que un personaje mal dibujado infantilice todo el juego.

Eso baja el único gasto de arte del proyecto de 250-500 € a casi cero.

## 4. Lo que NO cambia

Conviene decirlo porque no todo lo que propuse era por los niños:

- **La racha se rompe al no jugar, nunca al fallar.** Los datos de Duolingo
  son de adultos. Castigar el fallo hace que la gente deje de intentarlo, a
  cualquier edad.
- **El seguro de racha.** Sube la retención un 10% en un público adulto.
- **Nada de vidas ni de energía.**
- **Nunca rivales inventados.**
- **El dinero no toca las ligas ni el reto diario.**
- **Sesiones cortas por defecto.** Un adulto también juega en la cola del
  súper. Lo que sí conviene añadir es **partida larga opcional**: un público
  de 15+ sí aguanta una sesión de cinco minutos cuando el contenido lo
  merece, y eso a un niño no.
- **Mezclar en vez de agrupar** al ordenar las fases.
- **Los siete principios europeos sobre monedas.**

## 5. La dificultad, que es lo que más hay que rehacer

### 5.1 El primer capítulo, otra vez

"Las diez más famosas del mundo, con su nombre a la vista" es una fase de
tutorial para un niño de siete años. Para este público es un insulto: se
resuelve en noventa segundos y transmite que el juego no va en serio.

El primer capítulo pasa a llamarse **"Las que crees que sabes"** y funciona
al revés — no enseña, **mide**:

| # | Fase | Modo |
|---|---|---|
| 1 | Diagnóstico: doce banderas del mundo, sin ayuda ninguna | Bandera |
| 2 | Las que acabas de fallar, con su nombre y por qué se confunden | Aprender |
| 3 | Capitales que no son la ciudad más grande: Ottawa, Canberra, Abuya | Capital |
| 4 | Sitúa los quince países más grandes del mundo | Ubicación |
| 5 | Las cinco cruces nórdicas, seguidas | Bandera |
| 6 | 👑 **El Impostor** — Chad y Rumanía, Indonesia y Mónaco | Jefe |
| 7 | Los tricolores verticales, de Italia a Guinea | Bandera |
| 8 | Chile, Italia, India: reconoce el país por su forma | Silueta |
| 9 | ¿Cuál **no** limita con Brasil? *(son solo dos en toda Sudamérica)* | Vecinos |
| 10 | Las que suenan parecido: Níger y Nigeria, Austria y Australia | Bandera |
| 11 | Doce del mundo en sesenta segundos | Contrarreloj |
| 12 | 👑 **El Puzle del Borrón** | Jefe |

Y el capítulo **termina con un número, no con una felicitación**:

> Sabías 41 de 195.

Ese número es el gancho. Es lo que hace que alguien vuelva mañana y lo que
hace que se lo enseñe a un amigo para ver si él lo hace mejor.

### 5.2 La fase 1 hace doble trabajo

Un diagnóstico sin ayuda al principio no es solo tono: **es lo que calibra
la dificultad adaptativa desde el minuto uno**. Doce banderas bien elegidas
bastan para saber si quien juega anda por las 30 banderas o por las 150, y
todo el resto del juego se ajusta a partir de ahí.

Es la ventaja de tratar al jugador como un adulto: se le puede preguntar
directamente en vez de ir tanteando durante tres capítulos.

### 5.3 Los niveles clásicos y el "Nivel Nene"

El juego actual tiene cuatro niveles y el primero se llama **Nivel Nene**.
Con este público hay que renombrarlo: no por corrección, sino porque nadie
de 15 años elige un nivel que se llama así, y el que necesitaría esa
dificultad se irá a uno más difícil, lo pasará mal y se marchará.

Los cuatro pasan a ser algo como **Aprendiz · Viajero · Cartógrafo ·
Almirante**, que dice lo mismo sin infantilizar y encaja con el Condado.

Y `docs/decisiones-producto.md` está escrito entero desde el supuesto de
que esto es un juego familiar para niños. **No hay que borrarlo** —sus
decisiones sobre la fecha UTC y el criterio de países siguen siendo
buenas—, pero conviene añadirle una nota de que el público cambió, para que
dentro de un año nadie razone a partir de una premisa vieja.

## 6. Dónde está ahora el crecimiento

Cambia el canal por completo, y esto es de las cosas más útiles de todo el
documento:

- Un juego infantil crece **por los padres**: boca a boca lento, escuelas,
  recomendaciones entre familias.
- Un juego de conocimiento para adultos crece **por el resultado
  compartido**: el cuadrito diario en un grupo de mensajes, en redes, en la
  comunidad de juegos diarios que ya existe alrededor de Wordle, Worldle y
  GeoGuessr. Es un público enorme, ya formado y acostumbrado a probar un
  juego diario nuevo cada semana.

Consecuencia práctica: **la tarjeta de resultado del reto diario deja de
ser un detalle y pasa a ser la función de crecimiento más importante del
juego.** Antes de las ligas, antes de la tienda y antes de la campaña.

## 7. Lo que hay que revisar en cada documento

| Documento | Qué hay que cambiar |
|---|---|
| `ideas-app.md` | §4.3 y §9: el login social ya no está descartado; desaparece la sección de COPPA |
| `mecanicas-juego.md` | §4.3: la línea de las cajas sorpresa deja de ser legal y pasa a ser criterio |
| `mecanicas-enganche.md` | Nada sustancial: los datos del sector son de juegos de adultos |
| `modo-campana.md` | Capítulo 1 (§5), suelo de liga (§9.4), puerta parental (§8) |
| `historia-conde.md` | El Conde puede no dibujarse; cosméticos de escritorio (§9) |

---

## 8. Una cosa que no cambia y conviene proteger

Que el público sea de 15 en adelante **no significa que un niño no pueda
jugar**. Significa que el juego no se diseña para él.

La diferencia importa en un sitio concreto: el **reto diario**, con sus
pistas de distancia, es la única parte del juego que un padre y un hijo
pueden jugar de verdad juntos, y eso es una virtud rara que no conviene
perder por hacer todo lo demás más adulto. Que siga siendo jugable por
cualquiera, aunque el resto del juego suba el listón.
