/* Comprueba que los seis idiomas están completos: mismas claves de interfaz,
   mismo vocabulario de banderas, los mismos 195 países y ni un hueco vacío.

   Es lo único que evita el fallo típico de un juego multiidioma: alguien
   añade una cadena en español, se olvida de los otros cinco archivos y ahí
   se queda, saliendo por pantalla el nombre de la clave en vez del texto.

       node tools/check-i18n.mjs

   Sale con código 1 si algo falta, así que sirve tal cual en un hook o en
   integración continua. No necesita ninguna dependencia. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REFERENCE = "es";

/* Los idiomas se leen de js/i18n.js para no tener dos listas que mantener. */
const engine = readFileSync(resolve(ROOT, "js/i18n.js"), "utf8");
const CODES = [...engine.matchAll(/\{ code: "([a-z]{2})", label:/g)].map(m => m[1]);

const problems = [];
const packs = {};
for (const code of CODES) {
  packs[code] = (await import(`file://${resolve(ROOT, `js/i18n/${code}.js`)}`)).default;
}

const countryCodes = [...readFileSync(resolve(ROOT, "js/countries.js"), "utf8")
  .matchAll(/"code":"([a-z]{2})"/g)].map(m => m[1]);

function compareKeys(what, reference, actual, code) {
  for (const key of Object.keys(reference)) {
    if (!(key in actual)) problems.push(`${code}: falta ${what} "${key}"`);
    else if (actual[key] === undefined || actual[key] === null) problems.push(`${code}: ${what} "${key}" sin valor`);
  }
  for (const key of Object.keys(actual)) {
    if (!(key in reference)) problems.push(`${code}: sobra ${what} "${key}" (no está en ${REFERENCE})`);
  }
}

const ref = packs[REFERENCE];
if (!ref) throw new Error(`falta el idioma de referencia (${REFERENCE})`);

for (const code of CODES) {
  const pack = packs[code];
  if (pack.code !== code) problems.push(`${code}: el paquete dice ser "${pack.code}"`);

  compareKeys("cadena", ref.ui, pack.ui, code);
  compareKeys("continente", ref.continents, pack.continents, code);
  compareKeys("color de bandera", ref.flag.colors, pack.flag.colors, code);
  compareKeys("patrón especial", ref.flag.specials, pack.flag.specials, code);
  compareKeys("palabra de bandera", ref.flag.tokens, pack.flag.tokens, code);

  for (const field of ["sentence", "fallback", "and"]) {
    if (!pack.flag[field]) problems.push(`${code}: falta flag.${field}`);
  }
  if (!String(pack.flag.sentence).includes("{shapes}") || !String(pack.flag.sentence).includes("{colors}")) {
    problems.push(`${code}: flag.sentence tiene que usar {shapes} y {colors}`);
  }

  /* Las cadenas con hueco ({name}, {count}…) tienen que traer los mismos
     huecos que el original: uno de menos y el dato no sale por ninguna
     parte, uno de más y sale el literal "{count}" en la cara del jugador. */
  const holes = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(",");
  for (const key of Object.keys(ref.ui)) {
    if (!(key in pack.ui)) continue;
    if (holes(ref.ui[key]) !== holes(pack.ui[key])) {
      problems.push(`${code}: "${key}" no usa los mismos huecos que ${REFERENCE} (${holes(ref.ui[key])} → ${holes(pack.ui[key])})`);
    }
  }

  /* Países: los mismos que countries.js, con nombre y capital rellenos. */
  for (const cc of countryCodes) {
    const entry = pack.names[cc];
    if (!entry) { problems.push(`${code}: falta el país "${cc}"`); continue; }
    if (!entry[0]) problems.push(`${code}: el país "${cc}" no tiene nombre`);
    if (!entry[1]) problems.push(`${code}: el país "${cc}" no tiene capital`);
  }
  for (const cc of Object.keys(pack.names)) {
    if (!countryCodes.includes(cc)) problems.push(`${code}: sobra el país "${cc}" (no está en countries.js)`);
  }

  /* Todas las palabras que usa js/flagDescription.js tienen que existir. */
  for (const key of Object.keys(ref.flag.tokens)) {
    if (ref.flag.tokens[key] !== "" && pack.flag.tokens[key] === "") {
      problems.push(`${code}: la palabra "${key}" está vacía y en ${REFERENCE} no lo está`);
    }
  }
}

if (problems.length) {
  console.error(`✖ ${problems.length} problema(s):`);
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
}
console.log(`✔ ${CODES.length} idiomas (${CODES.join(", ")}) · ${Object.keys(ref.ui).length} cadenas · ${countryCodes.length} países`);
