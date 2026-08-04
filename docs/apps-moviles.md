# Apps para iPhone y Android

Cómo llevar el juego, que hoy vive en Vercel como sitio web, a la App Store
y a Google Play sin reescribirlo.

## Resumen

El juego es HTML, CSS y módulos ES. Las 196 banderas son SVG que ya viajan
en el repositorio y lo único que sale a la red son las puntuaciones del
reto diario contra Supabase. No hay servidor propio, ni sesión, ni nada que
dependa de estar en un dominio concreto: **el juego entero cabe dentro de
una app**.

Eso deja tres caminos, y no son excluyentes:

| | Qué es | Coste | Esfuerzo | Está en la tienda |
|---|---|---|---|---|
| **PWA** | La web de siempre, instalable desde el navegador | 0 € | Ya está hecho | No |
| **Capacitor** | La misma web dentro de una app nativa de verdad | 99 €/año + 25 € | Un par de tardes | Sí |
| **Nativo** | Reescribir el juego en Swift y Kotlin | Lo mismo | Meses | Sí |

Lo montado en el repositorio es **PWA + Capacitor**. Reescribirlo nativo no
tiene sentido aquí: no se usa cámara, ni GPS, ni notificaciones, ni nada
que el navegador no sepa hacer, y significaría mantener tres versiones del
mismo juego.

## 1. PWA: instalable hoy, sin tiendas

Ya funciona en la web desplegada. Quien entre desde el móvil puede añadir
el juego a la pantalla de inicio y le queda un icono igual que el de
cualquier app, a pantalla completa y sin barra del navegador.

Lo que lo hace posible:

- `manifest.webmanifest` — nombre, iconos, colores y `display: standalone`.
- `sw.js` — el service worker: guarda el juego para que se pueda jugar sin
  conexión después de la primera visita.
- `js/pwa.js` — registra el service worker (y no lo hace dentro de las apps
  nativas, donde estorbaría).
- `assets/icons/` — los PNG del manifest y el de iOS.

Cómo se instala, para explicárselo a alguien:

- **Android (Chrome):** menú ⋮ → *Instalar aplicación*.
- **iPhone (Safari):** botón de compartir → *Añadir a pantalla de inicio*.
  Tiene que ser Safari; desde Chrome en iPhone la opción no aparece.

Es gratis, se actualiza solo al desplegar en Vercel y no lo revisa nadie.
Lo que no da: no aparece buscando "banderas" en la App Store, y en iOS el
juego instalado guarda sus datos aparte de los de Safari (el ranking de
casa y los jugadores empiezan vacíos ahí).

## 2. Capacitor: la app para las tiendas

[Capacitor](https://capacitorjs.com) mete el sitio dentro de un proyecto
nativo de Xcode y de Android Studio: el juego se ejecuta en un WebView a
pantalla completa, con sus archivos dentro del paquete de la app (no se
descarga nada al abrirla) y con acceso a las APIs del sistema por plugins.
Es lo que usan, por ejemplo, muchas apps que también son web.

### Lo que hace falta

- **iPhone:** un Mac con Xcode. No hay forma de generar un `.ipa` sin macOS.
  Cuenta de Apple Developer: **99 €/año**.
- **Android:** cualquier ordenador con Android Studio. Cuenta de Google Play
  Console: **25 €, pago único**.
- Node 20 o superior, para el empaquetado.

Se puede empezar por Android y dejar el iPhone para después: son
independientes.

### Cómo está montado aquí

```
package.json              Dependencias de Capacitor y los scripts npm
capacitor.config.json     Identificador, nombre y color de fondo de la app
tools/build-www.mjs       Copia el sitio a www/, que es lo que se empaqueta
tools/build-icons.mjs     Genera los PNG de iconos y splash desde los SVG
assets/icon.svg           El icono, en un solo archivo editable
assets/splash.svg         La pantalla de arranque
www/                      Generada, no se versiona
ios/ · android/           Proyectos nativos, los genera `npx cap add`
```

`www/` es una copia literal de lo que sirve Vercel: mismos archivos, sin
compilar ni minificar nada. La app y la web son el mismo juego, no dos
ramas que se van separando.

### Primera vez

```bash
npm install                  # solo para empaquetar; la web sigue sin dependencias
npm run app:icons            # PNG de iconos y splash desde los SVG
npm run app:add:android      # crea android/
npm run app:add:ios          # crea ios/  (solo en un Mac)
npx @capacitor/assets generate   # mete los iconos en los proyectos nativos
```

### Cada vez que cambia el juego

```bash
npm run app:android          # copia el sitio y abre Android Studio
npm run app:ios              # copia el sitio y abre Xcode
```

Los dos hacen lo mismo por debajo: regeneran `www/`, sincronizan los
proyectos nativos (`cap sync`) y abren el entorno correspondiente. Desde
ahí, botón de *play* para probar en el emulador o en un móvil enchufado, y
*Archive* (Xcode) o *Generate Signed Bundle* (Android Studio) para el
archivo que se sube a la tienda.

### Antes de subir nada

- **Identificador de la app.** `capacitor.config.json` trae
  `com.juegodebanderas.app`. Se puede cambiar, pero **solo antes de la
  primera subida**: una vez publicado, ese identificador es para siempre.
- **Número de versión.** Vive en los proyectos nativos, no en
  `package.json`: en Xcode (*Version* y *Build*) y en
  `android/app/build.gradle` (`versionCode` y `versionName`). Cada subida a
  la tienda tiene que llevar uno más alto que la anterior.
- **Firma.** Android necesita un *keystore* propio: hay que guardarlo y no
  perderlo nunca, porque sin él no se puede volver a actualizar la app.
  iOS lo gestiona Xcode con la cuenta de Apple Developer.
- **Permisos.** El juego no pide ninguno. Android solo necesita internet,
  que Capacitor ya declara. Si algún día se añaden notificaciones o sonido
  en segundo plano, eso cambia.
- **Versionar `ios/` y `android/`.** Ahora están en `.gitignore` porque se
  regeneran con un comando. En cuanto se toque algo a mano dentro (firma,
  iconos retocados, un plugin configurado), hay que quitarlos de ahí y
  empezar a versionarlos: eso ya no se puede regenerar.

### La revisión de Apple, que es lo que más falla

La [directriz 4.2](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality)
de Apple rechaza las apps que son "solo una web metida en una app". No
prohíbe usar un WebView — prohíbe que la app no aporte nada frente a abrir
el navegador. A favor del juego juega que:

- funciona **sin conexión** desde el primer arranque, porque las 196
  banderas viajan dentro de la app;
- usa la **hoja de compartir del sistema** para el resultado del reto
  diario (`js/daily.js` llama al plugin `@capacitor/share` cuando está);
- no hay ningún enlace que saque al navegador ni ninguna pantalla que sea
  un formulario web.

Si aun así la rechazan, lo que más suele desatascar es añadir algo que solo
tenga sentido en un móvil: vibración al acertar (`@capacitor/haptics`) o
un aviso diario de que hay reto nuevo (`@capacitor/local-notifications`).
Ambos son un plugin y unas pocas líneas.

Google Play es bastante menos exigente en esto, pero pide desde 2024 una
[declaración de seguridad de los datos](https://support.google.com/googleplay/android-developer/answer/10787469).
Lo que hay que declarar es corto y conviene tenerlo claro antes de empezar
el formulario:

- Se envía a un servidor (Supabase) el **nombre o apodo** que se escribe
  para el ranking, junto con la puntuación. Nada más.
- Todo lo demás — jugadores de casa, banderas vistas, ajustes — se queda en
  el dispositivo, en `localStorage`.
- No hay publicidad, ni analítica, ni compras, ni cuentas de usuario.

Si la app se dirige a menores (y este juego lo hace), las dos tiendas piden
además una **política de privacidad accesible por URL**. Vale con una
página del propio sitio que diga exactamente lo de arriba.

## 3. Qué NO cambia al empaquetar

Vale la pena tenerlo claro, porque suele ser la sorpresa:

- **Las puntuaciones siguen yendo a Supabase.** Las apps hacen las mismas
  peticiones REST que la web. La clave `anon` de `js/db.js` viaja dentro
  del paquete de la app, igual que hoy viaja en el JavaScript de la web:
  es pública por diseño y lo que protege los datos son las políticas RLS
  de `supabase/migrations/`, no el secreto de la clave.
- **El ranking de casa sigue siendo local.** En `localStorage`, que dentro
  de la app es un almacén distinto del del navegador. Quien juegue en la
  web y en la app tendrá dos rankings de casa separados. No hay forma de
  unirlos sin cuentas de usuario.
- **El reto diario sigue usando la fecha UTC**, como está decidido en
  `docs/decisiones-producto.md`.
- **Los idiomas siguen saliendo del sistema**: el WebView informa del
  idioma del móvil igual que lo hace un navegador.

## 4. Vercel, después de esto

Aparecen en la raíz un `package.json` y un `vercel.json`. El segundo está
justamente por culpa del primero: al ver un `package.json`, Vercel asume
que hay algo que compilar y se pone a instalar dependencias. `vercel.json`
le dice que no, que esto se sirve tal cual desde la raíz.

La web se despliega exactamente igual que antes. Lo único que gana es el
manifest, el service worker y los iconos, que la hacen instalable.

## Resumen de comandos

```bash
npm run start          # servir la web en local (igual que antes: python3 -m http.server)
npm run check          # comprobar que los seis idiomas están completos
npm run app:icons      # regenerar iconos y splash desde los SVG
npm run app:www        # preparar www/ (lo que se empaqueta)
npm run app:sync       # www/ + sincronizar los proyectos nativos
npm run app:android    # ...y abrir Android Studio
npm run app:ios        # ...y abrir Xcode (solo en un Mac)
```
