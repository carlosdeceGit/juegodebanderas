/* Service worker: hace que el juego se pueda instalar desde el navegador
   y que siga funcionando sin conexión.

   Solo afecta a la web (Vercel). Las apps de App Store y Google Play no
   dependen de esto: Capacitor mete el sitio entero dentro del paquete de
   la app, así que ahí todo es local desde el primer arranque.

   Dos estrategias, y ninguna toca Supabase:

   - Navegación (abrir el juego): primero la red, y si no hay, la copia
     guardada. Así un despliegue nuevo se ve al recargar, no dos visitas
     después.
   - Todo lo demás del mismo origen (CSS, módulos, banderas): se sirve la
     copia guardada al instante y se pide la de la red por detrás para la
     próxima vez. Los nombres de archivo no llevan hash, así que esta es
     la única forma de ser rápido sin quedarse pegado a una versión vieja.
   - Peticiones a otros dominios (las puntuaciones de Supabase): ni se
     miran. Guardar en caché un ranking sería peor que no tenerlo.

   Al tocar los archivos de arranque hay que subir VERSION: es lo que
   borra las cachés antiguas. */

const VERSION = "v1";
const SHELL_CACHE = `banderas-shell-${VERSION}`;
const ASSET_CACHE = `banderas-assets-${VERSION}`;

/* Lo mínimo para que el juego arranque sin red la primera vez que se
   abre estando ya instalado. El resto (módulos y banderas) entra solo en
   cuanto se usa: si esta lista fallara en un solo archivo, la instalación
   entera del service worker se caería. */
const SHELL = [
  "./",
  "index.html",
  "style.css",
  "manifest.webmanifest",
  "assets/icons/icon-192.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(name => name.startsWith("banderas-") && name !== SHELL_CACHE && name !== ASSET_CACHE)
        .map(name => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return (await cache.match(request))
      || (await cache.match("index.html"))
      || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  /* Si no había copia, se espera a la red; si la red también falla, se
     devuelve un error de red normal y corriente, que es lo que el juego
     ya sabe manejar. */
  return cached || (await network) || Response.error();
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
