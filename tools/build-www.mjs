/* Prepara la carpeta www/ que empaquetan las apps nativas.

       node tools/build-www.mjs      (o: npm run app:www)

   Capacitor no sabe servir el repositorio tal cual: necesita una carpeta
   con el sitio y nada más, porque su contenido se copia entero dentro del
   .ipa y del .apk. Copiar la raíz metería el .git, node_modules, las
   migraciones de Supabase y los PNG gigantes de los iconos.

   Esto no es un "build": no compila, no minifica y no transforma nada.
   Copia los mismos archivos que sirve Vercel, sin tocarlos, para que la
   app y la web sean exactamente el mismo juego. www/ no se versiona: se
   regenera de una pasada.

   Lo que queda fuera, y por qué:

     sw.js                  El service worker es de la web. Dentro de la
                            app todo es local; una caché ahí solo puede
                            servir para dejar pegada una versión vieja.
     manifest.webmanifest   Lo lee el navegador para instalar la web. La
                            app ya tiene su nombre y sus iconos nativos.
     assets/icon.png        Fuentes de los iconos nativos (1024 y 2732 px).
     assets/splash.png      Ya están dentro del proyecto de Xcode y de
                            Android Studio en todos sus tamaños. */

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../", import.meta.url)));
const WWW = join(ROOT, "www");

/* Se copia por lista explícita y no por exclusión: si mañana aparece una
   carpeta nueva en la raíz, lo peor que puede pasar es que falte en la
   app (se ve al probarla), no que se cuele algo que no debería viajar
   dentro de un paquete que se sube a una tienda. */
const COPIAR = [
  "index.html",
  "style.css",
  "js",
  "assets/flags",
  "assets/icons",
  "assets/icon.svg",
];

rmSync(WWW, { recursive: true, force: true });
mkdirSync(WWW, { recursive: true });

for (const rel of COPIAR) {
  const origen = join(ROOT, rel);
  if (!existsSync(origen)) {
    throw new Error(`Falta ${rel}. ¿Se ha movido o renombrado?`);
  }
  cpSync(origen, join(WWW, rel), { recursive: true });
  console.log(`  ${rel}`);
}

/* Aviso temprano: sin los iconos generados, `npx @capacitor/assets
   generate` no tiene de dónde sacar los tamaños nativos. */
if (!existsSync(join(ROOT, "assets/icon.png"))) {
  console.warn("⚠ No está assets/icon.png. Genera los iconos: npm run app:icons");
}

console.log("\nwww/ preparada. Siguiente paso: npx cap sync");
