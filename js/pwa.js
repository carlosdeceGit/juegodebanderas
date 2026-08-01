/* Registra el service worker (sw.js) para que el juego se pueda instalar
   desde el navegador y funcione sin conexión.

   Va aparte de game.js a propósito: no tiene nada que ver con el juego y
   así se puede quitar entero borrando una línea del index.html.

   No se registra nunca en dos sitios:

   - Abriendo el index.html con doble clic (`file://`), donde no hay
     origen seguro y el navegador lo rechazaría con un error en consola.
   - Dentro de las apps nativas de App Store y Google Play, donde el sitio
     ya viaja completo dentro del paquete: un service worker ahí solo
     puede servir para dejar cacheada una versión vieja de algo que no
     necesita caché. Capacitor deja `window.Capacitor` puesto, y eso es
     justo lo que se mira. */

const esNativo = !!window.Capacitor?.isNativePlatform?.();
const origenSeguro = location.protocol === "https:" || location.protocol === "http:";

if ("serviceWorker" in navigator && origenSeguro && !esNativo) {
  /* Después de `load` para no competir por ancho de banda con las
     banderas de la primera partida. */
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* Sin service worker el juego funciona exactamente igual, solo que
         hace falta conexión. No merece ni un aviso en pantalla. */
    });
  });
}
