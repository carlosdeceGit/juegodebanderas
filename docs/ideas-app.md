# Qué le falta para que parezca un juego-app

**Propuesta, no decisión.** Nada de esto está implementado ni acordado. Es
el análisis de qué separa hoy al juego de sentirse como una app de verdad,
qué cuesta cada cosa y cuál choca con `decisiones-producto.md`.

## De qué depende que "parezca una app"

No de las funciones grandes. Un juego se siente nativo por tres cosas, y
están ordenadas por lo que dan a cambio de cada hora de trabajo:

1. **Cómo responde al dedo.** Vibración, sonido, transiciones, el botón
   atrás, que la pantalla no rebote al llegar al final. Es invisible
   descrito en una lista y es exactamente lo que delata a una web metida
   en una app durante los primeros diez segundos.
2. **Por qué vuelves mañana.** Una racha y un aviso. Sin esto, una app
   instalada es un icono más en la pantalla.
3. **Qué se acumula.** Algo que crece y que no quieres perder. En un juego
   de banderas eso se llama álbum de cromos.

El *login social* y el *ranking global* no están en esa lista, y no es un
olvido: están analizados abajo, en "Lo que pediste explícitamente".

---

## 1. Cómo responde al dedo

Lo más barato y lo que más se nota. Casi todo son pocas líneas y un plugin.

### 1.1 El botón atrás de Android · **imprescindible**

Hoy, dentro de la app, el botón atrás del sistema **cierra el juego** desde
cualquier pantalla, incluso a mitad de una partida. En Android eso no se
lee como un fallo menor: se lee como que la app está rota. Con
`@capacitor/app` se engancha el evento y se manda al paso anterior del
asistente, o se pide confirmación si hay una partida en curso.

*Coste: media hora. Toca `js/game.js` (navegación entre pantallas).*

### 1.2 Vibración · **la mejor relación impacto/esfuerzo de toda la lista**

Un golpecito corto al acertar, uno doble y seco al fallar, un patrón al
completar el reto diario. `@capacitor/haptics`. Es lo que hace que tocar
una respuesta se sienta físico. Con un ajuste para apagarla.

*Coste: una hora. Toca `resolveRound()` en `js/game.js` y `js/daily.js`.*

### 1.3 Que la pantalla no rebote

El rebote elástico de iOS al llegar al final del scroll, el "tirar para
recargar" de Android, la lupa y el menú de "Copiar / Buscar" al mantener el
dedo sobre una bandera. Los tres gritan *esto es un navegador*. Se quitan
con CSS (`overscroll-behavior`, `-webkit-touch-callout`, `user-select`)
**sin tocarlo en los campos de texto**, donde seleccionar tiene que seguir
funcionando.

*Coste: media hora en `style.css`.*

### 1.4 El teclado del reto diario

El reto se juega escribiendo el nombre del país, y en un móvil el teclado
tapa medio juego. Con `@capacitor/keyboard`: que la vista se recoloque al
abrirse, y en el `<input>` los atributos que evitan que el sistema
"ayude" — `autocapitalize`, `autocorrect="off"`, `enterkeyhint="go"`. Es un
detalle diminuto que cambia por completo jugar el reto en la mano.

*Coste: una hora. Toca `index.html` y `js/daily.js`.*

### 1.5 Arranque sin costuras

El splash ya está generado, pero conviene ocultarlo **cuando el juego está
listo**, no a los dos segundos por reloj: así no hay ni pantalla en blanco
ni salto. Y la barra de estado en color papel con iconos oscuros
(`@capacitor/status-bar`), que hoy queda de un gris que no es de nadie.

*Coste: una hora entre `js/game.js` y `capacitor.config.json`.*

### 1.6 Transiciones entre pantallas

Las ocho pantallas ya se intercambian con `.screen.on`. Falta que entren y
salgan con una transición corta y consistente — respetando
`prefers-reduced-motion`, que el juego ya honra en todo lo demás.

*Coste: dos horas en `style.css`.*

### 1.7 Sonido

Cuatro sonidos cortos: acierto, fallo, últimos segundos, fanfarria final.
Para niños esto es la mitad de la sensación de juego. Hay que hacerlo con
WebAudio y no con `<audio>` (la latencia se nota), respetar el interruptor
de silencio de iOS y dejar un ajuste para apagarlo — en una casa, un juego
que suena sin permiso se desinstala.

*Coste: medio día, más encontrar o hacer los sonidos.*

### 1.8 Modo oscuro

`style.css` declara hoy `color-scheme: light only`. Una app de móvil que
solo existe en claro se nota vieja, y este juego se va a abrir de noche.
El sistema de diseño está hecho con tokens semánticos, así que es
factible; el trabajo de verdad es **volver a verificar los contrastes**,
que hoy están medidos uno a uno.

*Coste: un día bien hecho. Es la única cosa de esta sección que no es barata.*

---

## 2. Por qué vuelves mañana

### 2.1 Racha de días · **el gancho, y no cuesta nada**

Días seguidos jugando el reto diario. Un 🔥 con el número en la portada.
Vive en `localStorage`, no necesita ni servidor ni cuenta, y se calcula con
la **misma fecha UTC** que ya usa el reto (sección 1 de
`decisiones-producto.md`), así que no abre ninguna ambigüedad nueva.

La decisión fina: si se rompe la racha al fallar el reto o solo al no
jugarlo. Para un juego familiar, **solo al no jugarlo** — castigar el fallo
en un juego de niños es exactamente cómo se consigue que lo abandonen.

*Coste: dos horas. Clave nueva `dcb_streak_v1`.*

### 2.2 Aviso diario · **lo que pediste, y es más fácil de lo que parece**

Aquí hay una distinción que ahorra mucho dinero: **no hacen falta
notificaciones push**. Push significa servidor, tokens, certificados de
Apple, Firebase y una cuenta por dispositivo. Lo que este juego necesita
son **notificaciones locales** (`@capacitor/local-notifications`): el móvil
se avisa a sí mismo a la hora que la familia elija. Cero infraestructura,
cero datos personales, y funciona sin conexión.

Cómo hacerlo bien:

- Pedir el permiso **después del primer reto jugado**, nunca al arrancar.
  Un permiso pedido antes de que nadie entienda para qué se deniega, y en
  iOS solo se pide una vez: quien lo deniegue no lo vuelve a ver.
- Programar 30 días por adelantado y reprogramar al abrir la app.
- El texto va en los seis idiomas, y **al cambiar de idioma hay que volver
  a programarlas** (están escritas en el idioma que hubiera al programarlas).
- Un ajuste con hora, y apagado por defecto hasta que alguien lo encienda.

*Coste: medio día.*

### 2.3 El calendario del mes

Una cuadrícula con los días jugados y en cuántos intentos. Da historial,
alimenta la racha visualmente y es lo que hace que no quieras dejar un
hueco. Todo local, con lo que ya se guarda.

*Coste: medio día.*

### 2.4 "Cómo le fue al mundo hoy"

Al terminar el reto, la distribución de intentos de toda la gente que lo ha
jugado: cuántos lo sacaron en 1, en 2, en 3… Sin un solo nombre, solo
números agregados.

Esto es interesante porque **da sensación de multijugador sin exponer a
nadie**: es exactamente lo que `decisiones-producto.md` protege (los
nombres no salen) y aun así se siente poblado. Necesita una vista agregada
nueva en Supabase (`COUNT(*) GROUP BY intentos`), que es una migración
corta.

*Coste: medio día, incluida la migración.*

---

## 3. Qué se acumula

### 3.1 El álbum de banderas · **la mejor idea de todo el documento**

195 cromos. Cada bandera con su estado: sin ver, vista, acertada,
**dominada** (tres aciertos sin fallo). Se rellena solo con lo que el juego
**ya guarda hoy** (`dcb_seen_v1` y `dcb_wrong_v1`), agrupado por
continente, con un contador grande arriba: *dominadas 47/195*.

Por qué esta y no otra:

- Es la mecánica de progresión que mejor encaja con el tema. Un álbum de
  cromos de banderas no es una metáfora forzada de videojuego: es
  literalmente lo que hacen los niños con las banderas.
- No necesita servidor, ni cuenta, ni infraestructura nueva.
- Reutiliza la pantalla "Aprender", que ya existe y ya pinta las 195.
- Convierte cada partida suelta en progreso hacia algo, que es justo lo
  que hoy no pasa.

*Coste: dos días bien hechos (pantalla, estados, animación de cromo nuevo).*

### 3.2 Medallas, pocas y buenas

"África completa", "Los cinco continentes tocados", "Diez días seguidos",
"Cien dominadas". **Diez o doce, no ochenta.** Una lista infinita de logros
vacíos es el sello de las apps que rellenan; unas pocas bien elegidas se
persiguen de verdad.

*Coste: un día.*

### 3.3 Avatares para las fichas de casa

Hoy un jugador es un nombre escrito. Que cada uno elija un emoji y un color
al crear su ficha, y que eso aparezca en el HUD, en el ranking de casa y en
el calendario. Es identidad sin cuenta, sin servidor y sin dato personal
ninguno — y es de las cosas que más rápido hacen que algo "parezca una app"
en lugar de un formulario.

*Coste: medio día.*

### 3.4 El mapa que se colorea

Los países dominados se van pintando en un mapa del mundo. Visualmente es
el mayor "toma ya" de la lista, y para un juego de geografía cierra el
círculo: no coleccionas cromos, coleccionas mundo.

El coste es que hay que meter un SVG de mapa mundial (150-250 KB) y
mapearlo a los códigos ISO que ya usa `countries.js`.

*Coste: día y medio, y una dependencia de asset nueva.*

### 3.5 Lo que NO metería como progresión

**Puntos de experiencia y niveles de jugador.** Es el relleno por defecto
de todo juego móvil y aquí no mide nada: el álbum ya dice cuánto sabes, y
una barra de XP encima solo añade un número que no significa nada. Si hay
una sola métrica de progreso, que sea *dominadas / 195*.

---

## 4. Lo que pediste explícitamente

### 4.1 Notificaciones diarias → **sí, y son baratas**

Ver 2.2. Locales, no push. Es la que yo haría primero de las tres.

### 4.2 Rankings → **sí, pero no el que parece**

El proyecto ya evaluó el ranking global entre desconocidos y lo descartó
(`decisiones-producto.md`, sección 3), y no por pereza: hacía falta
autenticación, moderación de nombres, protección de menores y anti-trampas.
Esa evaluación sigue en pie.

Lo que sí se puede hacer, de menos a más caro:

1. **La distribución mundial de hoy** (2.4). Sensación de comunidad, cero
   riesgo, media jornada.
2. **Código de familia.** Un código aleatorio por hogar y una función
   `SECURITY DEFINER` que solo devuelva las filas de ese código. Recupera
   el ranking compartido entre el móvil y la tablet de la misma casa, que
   es lo que se perdió al hacerlo local, **sin exponer nada a
   desconocidos**. Ya está descrito y descartado "por ahora" en
   `decisiones-producto.md`; es la pieza que más sentido tiene reactivar.
   *Coste: un día, con migración de Supabase.*
3. **Ranking global de verdad.** Sigue necesitando todo lo del punto 4.3.

### 4.3 Login social → **es la pieza más cara de la lista y la que menos aporta**

Merece la respuesta larga, porque suena a "una tarde" y no lo es.

Lo que arrastra, en orden de aparición:

- **Apple, directriz 4.8.** Si ofreces login con Google o Facebook, estás
  obligado a ofrecer *además* una opción equivalente que limite los datos
  al nombre y el email, permita ocultar el email y no rastree para
  publicidad. Sign in with Apple la cumple. O sea: no es un login, son dos.
- **Apple, 5.1.1(v).** Si la app permite crear cuenta, tiene que permitir
  **borrarla desde dentro de la app**. Eso es pantalla, confirmación y
  borrado real en la base de datos.
- **Es un juego para niños.** Aquí está el problema de verdad. Las apps de
  la categoría Niños no pueden enviar información personal a terceros, lo
  que hace un login social de terceros directamente incompatible. Y aunque
  se publique fuera de esa categoría, dirigirse a menores activa COPPA en
  Estados Unidos y el consentimiento parental verificable del RGPD en
  Europa. Eso no se resuelve con código.
- **Supabase habría que rehacerlo.** Hoy las políticas RLS están escritas
  para una clave `anon` que inserta y lee. Con usuarios reales hay que
  reescribirlas contra `auth.uid()`, migrar las partidas existentes y
  cerrar la lectura abierta.
- **Y lo que se pierde:** hoy abres el juego y estás jugando en dos
  toques. Con cuentas, abres el juego y rellenas un formulario. En un
  juego familiar de tres minutos por partida, ese peaje resta más de lo
  que suma. Las apps que se sienten mejor son las que **no** piden nada
  para empezar.

**Lo que da el 80% del login por el 5% del coste:** ficha local con avatar
(3.3) + código de familia (4.2) + el duelo asíncrono que ya existe.

Si algún día el juego deja de ser familiar y quiere ser competitivo de
verdad, el login es el primer paso obligatorio — pero entonces es un
proyecto distinto, con moderación y con alguien vigilándolo.

---

## 5. Lo que no haría nunca aquí

- **Vidas o energía.** El mecanismo para que dejes de jugar y vuelvas. En
  un juego familiar sin monetización no tiene ninguna función.
- **Anuncios.** Incompatibles con la categoría Niños y con el tono. Y por
  cuatro euros al mes.
- **Compras dentro de la app.** Nada que vender, y traen consigo controles
  parentales, restauración de compras y soporte.
- **Chat o mensajes entre jugadores.** Moderación 24/7 desde el día uno.
- **Racha que se rompe al fallar.** Ver 2.1.

---

## 6. Un coste que se olvida siempre

**Cada cadena nueva son seis.** El juego está en español, catalán, inglés,
francés, alemán e italiano, y `tools/check-i18n.mjs` no deja pasar un
idioma incompleto. Una pantalla de álbum con veinte textos son 120 cadenas.
No es un problema — es el precio real de cada función de esta lista, y hay
que contarlo al estimar.

Lo mismo con la accesibilidad: el juego tiene contrastes medidos, `aria-live`,
lector de pantalla y tamaño de texto XL funcionando en todas las pantallas.
Cada pantalla nueva entra con ese listón, no por debajo.

---

## 7. El orden que propongo

**Fase A — que se sienta app (2 días).** Botón atrás, vibración, rebote y
menú contextual, teclado del reto, splash y barra de estado, transiciones.
Ninguna función nueva: el mismo juego, que de repente se siente otro. Es
además el mejor argumento frente a la directriz 4.2 de Apple, la que
rechaza las apps que son "solo una web".

**Fase B — volver mañana (2 días).** Racha, calendario del mes, aviso
diario local con su ajuste.

**Fase C — el álbum (3 días).** Los 195 cromos con sus estados, las
medallas, los avatares de las fichas.

**Fase D — lo social sin cuentas (2 días).** Distribución mundial del reto
de hoy y código de familia.

**Fase E — solo si el juego cambia de ambición.** Cuentas, ranking global,
ligas. Con los cinco requisitos de `decisiones-producto.md` resueltos
antes, no después.

Si solo hubiera tiempo para una: **la Fase A**. Es la que contesta
literalmente a "que parezca un juego-app".
