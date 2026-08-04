# De juego web a producto: qué hace falta de verdad

**Propuesta, no decisión.** Escrita asumiendo que hay presupuesto y sin dar
por buenas las decisiones anteriores: lo que sigue es lo que haría falta
para que esto sea una app de verdad, no una web empaquetada.

> ⚠️ Escrito cuando el público eran familias con niños. El público es ahora
> de 15 años en adelante: manda `docs/publico-objetivo.md`.

**Regla que se aplica a todo lo de abajo:** cada pieza tiene que tener
sentido también jugando en el navegador. Un juego con dos formas de
abrirlo, no dos productos que mantener.

---

## El diagnóstico, en una frase

**Hoy no hay jugadores: hay un nombre escrito en el `localStorage` de un
móvil.**

Todo lo demás se estrella contra eso. No se puede tener ranking porque
cualquiera puede llamarse como quiera. No se puede cambiar de móvil sin
perderlo todo. No se puede reinstalar la app sin empezar de cero. No se
puede retar a nadie. No se puede saber si alguien vuelve al día siguiente.

Y no es un problema de las tiendas ni de Capacitor: **en la web pasa
exactamente lo mismo**. Por eso arreglarlo sirve para las dos.

---

## 1. El cimiento: cuenta anónima desde el primer toque

Lo único de este documento que, si no se hace, bloquea todo lo demás.

Supabase Auth permite **entrar sin pedir nada** (`signInAnonymously()`):
al abrir el juego por primera vez, el dispositivo obtiene un usuario real
con su `auth.uid()`, sin email, sin contraseña, sin formulario y sin un
solo dato personal. Se mantiene intacto lo mejor que tiene el juego hoy:
**abres y estás jugando en dos toques.**

Lo que cambia por dentro:

- El progreso (álbum, marcas, rachas, banderas falladas) pasa a vivir en el
  servidor. `localStorage` deja de ser la verdad y pasa a ser la caché para
  jugar sin conexión, que es su papel natural.
- Las políticas RLS pasan a ser de verdad. Hoy la clave `anon` del
  repositorio puede leer la tabla entera: eso ya está identificado en el
  README y con `auth.uid()` deja de ser posible.
- Y aparece lo que hoy no existe: **saber cuánta gente juega y si vuelve.**

### Cómo se cambia de dispositivo sin pedir un email

Aquí está la parte que merece pensarse, porque es donde casi todos los
juegos meten un login social y se comen los problemas que trae.

**Propuesta: código de vinculación.** En el móvil donde ya juegas, un botón
enseña un código de seis caracteres que caduca en diez minutos. En el
dispositivo nuevo se escribe ese código y los dos quedan en la misma
cuenta. Sin email, sin contraseña, sin recordar nada, sin un solo dato
personal en la base de datos. Es exactamente cómo se enlaza una tele o una
consola, y cualquier niño sabe hacerlo.

Encima de eso, **opcional y para quien quiera**: vincular la cuenta a Apple,
Google o un email con enlace mágico. Sirve para recuperar el progreso si se
pierde el móvil, que es lo único que el código no cubre. El `uid` no cambia
al vincular, así que no se pierde nada.

Ese orden — código primero, login opcional después — es el que deja el
juego jugable desde el primer toque sin pedirle una cuenta a nadie. Con el
público en 15+ ya no hay obligación legal de evitar el login social, así
que **también puede ofrecerse**; sigue siendo mejor que llegue después y no
en la pantalla de bienvenida.

### Lo que hay que hacer bien

- **Protección anti-abuso obligatoria.** Supabase lo advierte
  explícitamente: sin un CAPTCHA invisible (Turnstile de Cloudflare, que es
  gratis), cualquiera puede llamar al endpoint en bucle y llenarte la base
  de datos de usuarios fantasma.
- **Migración de los que ya juegan.** Lo que hay hoy en `localStorage` se
  sube a la cuenta anónima la primera vez y luego se borra. Nadie pierde su
  álbum.
- **Conflictos.** Dos dispositivos con progreso distinto que se vinculan:
  la regla más simple y la que menos enfada es quedarse con el máximo de
  cada cosa (mejor marca, más banderas dominadas, racha más larga).

*Web ✓ · App ✓ · Coste: 4-6 días. Es el trabajo más aburrido y el único
que no se puede saltar.*

---

## 2. Lo que hace que vuelvas mañana

### 2.1 Ligas semanales, no un ranking mundial

Un top mundial parece lo lógico y es exactamente lo que no funciona: contra
todo el mundo pierdes siempre, y a la segunda semana dejas de mirarlo.

**Grupos de treinta jugadores, con ascenso y descenso semanal.** Cada lunes
te agrupan con otros veintinueve de nivel parecido; los cinco primeros
suben de división, los cinco últimos bajan. Siempre estás a tres puntos de
algo. Es lo que hace Duolingo y es la mecánica de retención más eficaz que
existe para un juego diario.

Y de propina resuelve solo el problema que hace difícil un ranking
público: **no ves los nombres del mundo, ves veintinueve.** La superficie de
abuso baja de "todo internet" a "un grupo pequeño y rotativo".

*Web ✓ · App ✓ · Coste: 3 días, más el trabajo de servidor del punto 5.*

### 2.2 Racha, con un seguro

Días seguidos jugando el reto. Con **un día de gracia al mes**, que se
recupera solo. Sin eso, la primera vez que alguien se salta un día por un
viaje pierde 40 días de racha y no vuelve nunca. El seguro es lo que
convierte la racha en un hábito en lugar de en una trampa.

*Web ✓ · App ✓ · Coste: medio día.*

### 2.3 Avisos

Dos tecnologías distintas para el mismo botón:

- **En la app:** notificaciones locales. El móvil se avisa a sí mismo, sin
  servidor ni tokens.
- **En la web:** Web Push, que funciona en Android y en escritorio, y en
  iPhone **solo si el juego está añadido a la pantalla de inicio** (desde
  iOS 16.4). Es la única pieza de este documento que en web pide instalar.

Con servidor ya se pueden mandar los avisos que de verdad traen gente:
*"tu liga acaba en dos horas y vas quinto"*, *"te han retado"*. Ese segundo
tipo vale diez veces más que un recordatorio genérico.

*Web ✓ (instalada) · App ✓ · Coste: 2 días las dos vías.*

---

## 3. Lo que hace que te quedes

### 3.1 El álbum, ahora sincronizado

195 cromos con estado: sin ver, vista, acertada, dominada. Ya se puede
rellenar con lo que el juego guarda hoy, y con cuenta deja de perderse al
cambiar de móvil. Es la progresión que mejor encaja con el tema: un álbum
de cromos de banderas no es una metáfora de videojuego, es literalmente lo
que hacen los niños con las banderas.

*Web ✓ · App ✓ · Coste: 2 días.*

### 3.2 Repaso espaciado · **la idea que convierte el juego en algo útil**

La bandera que fallaste vuelve a aparecer a los dos días. Si la aciertas,
a los cinco. Luego a los quince, luego al mes. La que dominas desaparece
del repaso hasta que toca refrescarla.

Por qué esto y no otra cosa:

- El juego ya guarda los fallos por bandera (`dcb_wrong_v1`) y ya tiene el
  modo "Repasa tus fallos". La mitad del trabajo está hecha.
- Da una razón para abrir el juego **distinta de la racha**: no vienes
  porque te lo recuerden, vienes porque hoy tocan tus doce banderas.
- Y cambia lo que el producto es: de pasatiempo a *"mi hijo se ha aprendido
  las 195 banderas con esto"*. Eso es lo que hace que un padre lo
  recomiende a otro padre, que es el único marketing que va a tener esto.

*Web ✓ · App ✓ · Coste: 2 días.*

### 3.3 Colecciones temáticas semanales

`js/countries.js` ya etiqueta cada bandera con su patrón y su paleta —
está ahí para calcular distractores. Con eso ya escrito se pueden generar
colecciones: *las que llevan estrellas*, *tres franjas verticales*, *las
que todo el mundo confunde*, *las de un solo color y un símbolo*.

Una nueva cada semana, generada sola. **Contenido nuevo indefinidamente sin
que nadie tenga que escribirlo.** Para una app, no morir de aburrimiento a
las tres semanas es media batalla.

*Web ✓ · App ✓ · Coste: día y medio.*

### 3.4 El mapa que se colorea

Los países dominados se pintan sobre un mapa del mundo. Es el mayor golpe
visual de la lista y cierra el círculo: no coleccionas cromos, coleccionas
mundo. Requiere meter un SVG de mapa (150-250 KB) y cruzarlo con los
códigos ISO que ya existen.

*Web ✓ · App ✓ · Coste: día y medio.*

---

## 4. Lo que trae gente nueva

Sin esto, todo lo anterior lo disfrutan las mismas cuatro personas.

### 4.1 Reto por enlace

*"Te reto con estas diez banderas."* Se genera un enlace, quien lo recibe
juega **exactamente el mismo mazo** y ve el resultado de los dos.

Aquí tener web es una ventaja enorme, no un lastre: **quien recibe el
enlace juega en el navegador, sin instalar nada.** Y desde ahí se le
propone la app. La web se convierte en la demo gratuita de la app, que es
justo lo que la mayoría de juegos móviles no puede tener.

En la app hay que configurar enlaces universales (Universal Links en iOS,
App Links en Android) para que el enlace abra la app y no el navegador.

*Web ✓ · App ✓ · Coste: 2 días, más un rato peleando con la configuración
de los enlaces universales.*

### 4.2 La tarjeta de resultado, como imagen

Hoy el reto diario se comparte como texto con cuadrados. Una imagen
generada al vuelo (canvas → PNG → hoja de compartir del sistema) se ve
diez veces mejor en WhatsApp, lleva el nombre del juego dentro y sigue sin
destripar la respuesta.

*Web ✓ · App ✓ · Coste: 1 día.*

---

## 5. Lo que no se ve, y sin lo cual no hay app seria

### 5.1 El reto diario lo tiene que servir el servidor · **crítico**

Hoy la bandera de cada día se calcula en el cliente a partir de la fecha:
**la bandera de mañana está en el código y cualquiera puede leerla.**

Mientras el ranking era de casa, daba exactamente igual. Con una liga y
puntos, no: la primera semana alguien mira el JavaScript y gana siempre.
Hay que mover el reto a una Edge Function que entregue la bandera del día
y valide el intento en el servidor.

**Y el orden importa:** si la liga sale antes que esto, nace rota.

*Coste: 2 días.*

### 5.2 Nombres, resuelto por diseño

Nombre generado por defecto — *Águila Veloz 🦅*, *Brújula Serena 🧭* —
combinando dos listas cortas ya traducidas a los seis idiomas.
Personalizarlo es opcional y pasa por un filtro de palabrotas y un botón
de denunciar.

La mayoría de la gente no cambia el nombre por defecto, así que el
problema de moderación se reduce a una minoría diminuta. Cuesta cero y
evita el trabajo continuo de vigilar un tablón.

*Coste: 1 día.*

### 5.3 Borrar y exportar la cuenta, desde dentro

Apple lo exige si hay cuentas, y el RGPD lo exige siempre. Un botón que
borra de verdad y otro que se descarga tu progreso.

*Coste: medio día. No es negociable.*

### 5.4 Telemetría propia, agregada, sin terceros

Qué modos se juegan, en qué pantalla se abandona, cuánta gente vuelve al
día siguiente. **Guardado en vuestro propio Supabase**, en contadores
agregados, sin ninguna herramienta externa.

Sin esto se decide a ciegas. Con público adulto ya se puede usar una
herramienta externa —la prohibición era de la categoría Niños—, pero
hacerlo en casa sigue saliendo más barato *y* más limpio, y no obliga a
declarar un tercero en la ficha de privacidad.

*Coste: 1 día.*

### 5.5 Rate limiting y validación de puntuaciones

Ya hay validación de la puntuación contra el máximo matemático. Falta
limitar cuántas partidas por hora acepta el servidor de una misma cuenta.

*Coste: medio día.*

---

## 6. El pulido que se nota en los primeros diez segundos

Barato, y es literalmente lo que separa "web empaquetada" de "app":

- **El botón atrás de Android**, que hoy cierra el juego a mitad de partida.
- **Vibración** al acertar y al fallar. En web también existe (Android).
- **Sonido**: cuatro sonidos cortos, con su ajuste para apagarlos.
- **Modo oscuro**: hoy el CSS declara `color-scheme: light only`.
- **Que la pantalla no rebote** ni salga el menú de "Copiar" al mantener el
  dedo sobre una bandera.
- **Onboarding de veinte segundos** la primera vez.
- **Transiciones** entre pantallas.

*Coste: 3 días todo junto. Web ✓ (salvo la vibración en iPhone) · App ✓*

---

## 7. El dinero, en concreto

| Concepto | Coste | ¿Necesario? |
|---|---|---|
| Apple Developer | 99 €/año | Sí, para publicar en iPhone |
| Google Play | 25 € una vez | Sí, para publicar en Android |
| Supabase Pro | ~23 €/mes | **Sí, en cuanto se publique** |
| Dominio propio | ~12 €/año | Recomendable |
| Sonidos e ilustración | 100-300 € una vez | Recomendable |
| Cloudflare Turnstile | 0 € | Sí |
| Notificaciones | 0 € | — |

**Por qué Supabase de pago no es opcional:** en el plan gratuito, un
proyecto **se pausa tras una semana sin actividad suficiente**. En una app
publicada eso significa que un día alguien la abre y no funciona. Son 23 €
al mes por que eso no pueda pasar.

**Primer año: unos 550-750 €. Años siguientes: unos 400 €.**

Lo que **no** hay que pagar: servidor propio, Firebase, notificaciones push
(las locales y Web Push son gratis), herramientas de analítica, ni backend
a medida. Supabase cubre autenticación, base de datos y funciones.

---

## 8. En qué orden, y por qué ese

1. **Cimiento** — cuenta anónima, sincronización, RLS, borrado de cuenta.
   No se ve nada nuevo en pantalla y sin esto no hay nada más. *(1 semana)*
2. **Que se sienta app** — el pulido del punto 6, más racha y avisos
   locales. Es lo que se nota el primer día y lo que mejor contesta a la
   directriz de Apple que rechaza las apps que son "solo una web".
   *(1 semana)*
3. **Que enganche** — álbum sincronizado y repaso espaciado. Aquí es donde
   el juego pasa a ser útil, no solo entretenido. *(1 semana)*
4. **Que aguante trampas** — reto diario servido por el servidor, rate
   limiting, nombres generados, telemetría. **Antes de la liga, no
   después.** *(1 semana)*
5. **Que crezca** — ligas semanales, reto por enlace, tarjeta de resultado
   como imagen. *(1-2 semanas)*
6. **Extras** — mapa que se colorea, colecciones temáticas, modo oscuro,
   sonido.

Unas cinco o seis semanas de trabajo hasta tener algo que se sostenga solo.

---

## 9. Lo que queda de restricción legal

**Esta sección decía que el juego se dirigía a niños y que eso era ley y no
preferencia. Ya no aplica**: el público es de 15 años en adelante
(`docs/publico-objetivo.md`). Se caen COPPA, el consentimiento parental y
la categoría Niños con todas sus normas.

Lo que queda, que es bastante menos:

- **Declarar el juego como no dirigido a menores** en Google Play, y una
  clasificación por edad coherente: 12+ con ligas y compras, o 16+ si se
  quiere cerrar el asunto del todo.
- **Política de privacidad.** Eso es RGPD y no depende de la edad.
- **Borrado y exportación de cuenta desde dentro**, que exigen Apple y el
  RGPD por igual.
- **Los siete principios europeos sobre monedas de juego**, que son derecho
  del consumidor.

La cuenta anónima sigue siendo la mejor arquitectura, pero ahora **por
producto y no por obligación**: mantiene el arranque en dos toques y no
recoge ni un dato que después haya que proteger, declarar o borrar.
