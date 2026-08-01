/* Rasteriza assets/icon.svg y assets/splash.svg a los PNG que necesitan
   la web (manifest, iOS Safari) y las apps nativas.

       node tools/build-icons.mjs

   No hace falta instalar nada: usa el Chrome/Chromium que ya haya en el
   sistema. Es un rodeo, pero evita meter una dependencia de imágenes
   (sharp, ImageMagick) en un proyecto que se despliega sin `npm install`.

   El SVG se dibuja en un `<canvas>` del tamaño exacto y se saca en PNG
   por `toDataURL`. La vía obvia — `chrome --screenshot --window-size` —
   no sirve: la ventana de Chrome no baja de unos 500 px, así que los
   iconos pequeños salían dibujados en una esquina de un lienzo mayor.

   Qué genera:

     assets/icons/icon-192.png          manifest (pantalla de inicio)
     assets/icons/icon-512.png          manifest (splash de Android, "maskable")
     assets/icons/apple-touch-icon.png  iOS al añadir a pantalla de inicio
     assets/icons/favicon.png           pestaña del navegador
     assets/icon.png                    1024×1024, fuente de @capacitor/assets
     assets/splash.png                  2732×2732, fuente de @capacitor/assets

   Los dos últimos son los nombres que `npx @capacitor/assets generate`
   busca por convención: de ahí salen los cientos de tamaños que piden
   Xcode y Android Studio, que no se versionan aquí. */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../", import.meta.url)));

/* Qué se genera a partir de qué. */
const TARGETS = [
  { svg: "assets/icon.svg",   out: "assets/icons/icon-192.png",         size: 192 },
  { svg: "assets/icon.svg",   out: "assets/icons/icon-512.png",         size: 512 },
  { svg: "assets/icon.svg",   out: "assets/icons/apple-touch-icon.png", size: 180 },
  { svg: "assets/icon.svg",   out: "assets/icons/favicon.png",          size: 64 },
  { svg: "assets/icon.svg",   out: "assets/icon.png",                   size: 1024 },
  { svg: "assets/splash.svg", out: "assets/splash.png",                 size: 2732 },
];

/* Los Chromium que instala Playwright, si los hay (es lo que suele haber
   en un contenedor de CI o de agente, donde no está el Chrome del sistema). */
function playwrightChromiums() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(base)) return [];
  return readdirSync(base)
    .filter(name => name.startsWith("chromium-"))
    .map(name => join(base, name, "chrome-linux", "chrome"));
}

/* Dónde puede estar el navegador. El primero que exista, vale. */
function findChrome() {
  const candidates = [
    ...(process.env.CHROME_PATH ? [process.env.CHROME_PATH] : []),
    ...playwrightChromiums(),
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  const found = candidates.find(p => existsSync(p));
  if (!found) {
    throw new Error(
      "No se ha encontrado Chrome ni Chromium. Instálalo o indica la ruta:\n" +
      "  CHROME_PATH=/ruta/a/chrome node tools/build-icons.mjs"
    );
  }
  return found;
}

/* La página que hace el trabajo: carga cada SVG como imagen, la dibuja en
   un canvas del tamaño pedido y deja los PNG en el DOM, uno por línea y
   precedidos del nombre del archivo, para poder separarlos después. */
function buildPage(targets) {
  const jobs = targets.map(t => ({
    out: t.out,
    size: t.size,
    src: "data:image/svg+xml;base64," +
      Buffer.from(readFileSync(join(ROOT, t.svg), "utf8"), "utf8").toString("base64"),
  }));

  return `<!DOCTYPE html><meta charset="utf-8"><body><pre id="out"></pre><script>
const jobs = ${JSON.stringify(jobs)};
const load = src => new Promise((ok, no) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => no(new Error("no se pudo leer " + src.slice(0, 40)));
  img.src = src;
});
(async () => {
  const lines = [];
  for (const job of jobs) {
    const img = await load(job.src);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = job.size;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, job.size, job.size);
    lines.push(job.out + " " + canvas.toDataURL("image/png"));
  }
  document.getElementById("out").textContent = lines.join("\\n");
})().catch(err => { document.getElementById("out").textContent = "FALLO " + err.message; });
</script>`;
}

const work = join(tmpdir(), `iconos-juegodebanderas-${process.pid}`);
mkdirSync(work, { recursive: true });
const page = join(work, "render.html");
writeFileSync(page, buildPage(TARGETS));

const dom = execFileSync(findChrome(), [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--virtual-time-budget=30000",
  "--dump-dom",
  `file://${page}`,
], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });

rmSync(work, { recursive: true, force: true });

/* Solo interesa lo que la página ha dejado en el `<pre>`: el volcado del
   DOM trae también el propio script, y ahí aparecen literalmente tanto la
   palabra del error como el prefijo de los data URL. */
const dumped = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!dumped) throw new Error("Chrome no ha devuelto la página esperada");

const result = dumped[1];
if (result.startsWith("FALLO ")) throw new Error(result.split("\n")[0]);

mkdirSync(join(ROOT, "assets/icons"), { recursive: true });

for (const { out, size } of TARGETS) {
  const match = result.match(new RegExp(`${out} data:image/png;base64,([A-Za-z0-9+/=]+)`));
  if (!match) throw new Error(`Chrome no ha devuelto ningún PNG para ${out}`);

  const png = Buffer.from(match[1], "base64");

  /* El ancho y el alto viven en la cabecera IHDR. Comprobarlos es barato y
     evita publicar un icono del tamaño equivocado, que no se nota hasta
     que lo rechaza la tienda. */
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== size || height !== size) {
    throw new Error(`${out} ha salido de ${width}×${height} y se esperaba ${size}×${size}`);
  }

  writeFileSync(join(ROOT, out), png);
  console.log(`  ${out}  (${size}×${size})`);
}

console.log("\nListo. Para regenerar los iconos nativos: npx @capacitor/assets generate");
