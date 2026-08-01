/* Genera js/i18n/names.<idioma>.js para los cinco idiomas que no son el
   español, a partir de CLDR.

       npm install cldr-localenames-full cldr-dates-full moment-timezone
       node tools/build-names.mjs

   Las dependencias no están en el repositorio a propósito: esto se ejecuta
   a mano cuando se añade un país o un idioma, no en cada carga del juego.

   El español es el original y NO se genera: sus nombres y capitales son
   decisiones editoriales del juego ("Nivel Nene", tono infantil, formas
   asentadas como "Costa de Marfil" en vez del "Côte d'Ivoire" de CLDR).
   js/i18n/names.es.js es la entrada de este script, no su salida.

   De dónde sale cada cosa:

   - El nombre del país, de `territories.json` de CLDR.
   - La capital, de la ciudad de referencia (`exemplarCity`) de la zona
     horaria de esa capital en `timeZoneNames.json`. Es un rodeo, pero es la
     única lista de nombres de ciudad traducidos, revisada y mantenida, que
     existe sin depender de un servicio en red. La zona se localiza buscando
     qué ciudad de referencia coincide, en español, con la capital que ya
     tiene el juego; las que no coinciden con ninguna van en las tablas de
     excepciones de abajo.
   - Las excepciones, escritas a mano aquí: capitales que no dan nombre a
     ninguna zona horaria (Pretoria, Ottawa, Brasilia…) y nombres de país
     donde CLDR mete una desambiguación que no pinta nada en un juego
     infantil ("Congo - Kinshasa"). */

import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SOURCE = "es";
const TARGETS = [
  ["ca", "catalán"], ["en", "inglés"], ["fr", "francés"],
  ["de", "alemán"], ["it", "italiano"],
];
const ALL = [SOURCE, ...TARGETS.map(([code]) => code)];

/* ---------- Nombres de país donde no vale CLDR tal cual ---------- */
const NAME_OVERRIDES = {
  cg: { ca: "República del Congo", en: "Republic of the Congo", fr: "République du Congo", de: "Republik Kongo", it: "Repubblica del Congo" },
  cd: { ca: "República Democràtica del Congo", en: "Democratic Republic of the Congo", fr: "République démocratique du Congo", de: "Demokratische Republik Kongo", it: "Repubblica Democratica del Congo" },
  ci: { ca: "Costa d'Ivori", en: "Ivory Coast", fr: "Côte d'Ivoire", de: "Elfenbeinküste", it: "Costa d'Avorio" },
  mm: { ca: "Myanmar", en: "Myanmar", fr: "Myanmar", de: "Myanmar", it: "Myanmar" },
  ps: { ca: "Palestina", en: "Palestine", fr: "Palestine", de: "Palästina", it: "Palestina" },
  tl: { ca: "Timor Oriental", en: "East Timor", fr: "Timor oriental", de: "Osttimor", it: "Timor Est" },
  va: { ca: "Vaticà", en: "Vatican City", fr: "Vatican", de: "Vatikanstadt", it: "Vaticano" },
  tr: { ca: "Turquia", en: "Turkey", fr: "Turquie", de: "Türkei", it: "Turchia" },
};

/* ---------- Capitales que no dan nombre a ninguna zona horaria ---------- */
/* Orden de las columnas: es, ca, en, fr, de, it. El español está solo para
   poder comprobar que la fila sigue hablando de la capital que cree. */
const CAPITAL_OVERRIDES = {
  bi: ["Gitega", "Gitega", "Gitega", "Gitega", "Gitega", "Gitega"],
  cv: ["Praia", "Praia", "Praia", "Praia", "Praia", "Praia"],
  cm: ["Yaundé", "Yaoundé", "Yaoundé", "Yaoundé", "Jaunde", "Yaoundé"],
  km: ["Moroni", "Moroni", "Moroni", "Moroni", "Moroni", "Moroni"],
  ci: ["Yamusukro", "Yamussukro", "Yamoussoukro", "Yamoussoukro", "Yamoussoukro", "Yamoussoukro"],
  mw: ["Lilongüe", "Lilongwe", "Lilongwe", "Lilongwe", "Lilongwe", "Lilongwe"],
  mu: ["Port Louis", "Port Louis", "Port Louis", "Port-Louis", "Port Louis", "Port Louis"],
  ma: ["Rabat", "Rabat", "Rabat", "Rabat", "Rabat", "Rabat"],
  ng: ["Abuya", "Abuja", "Abuja", "Abuja", "Abuja", "Abuja"],
  za: ["Pretoria", "Pretòria", "Pretoria", "Pretoria", "Pretoria", "Pretoria"],
  tz: ["Dodoma", "Dodoma", "Dodoma", "Dodoma", "Dodoma", "Dodoma"],
  bh: ["Manama", "Manama", "Manama", "Manama", "Manama", "Manama"],
  bn: ["Bandar Seri Begawan", "Bandar Seri Begawan", "Bandar Seri Begawan", "Bandar Seri Begawan", "Bandar Seri Begawan", "Bandar Seri Begawan"],
  cn: ["Pekín", "Pequín", "Beijing", "Pékin", "Peking", "Pechino"],
  in: ["Nueva Delhi", "Nova Delhi", "New Delhi", "New Delhi", "Neu-Delhi", "Nuova Delhi"],
  kz: ["Astaná", "Astanà", "Astana", "Astana", "Astana", "Astana"],
  mv: ["Malé", "Malé", "Malé", "Malé", "Malé", "Malé"],
  mm: ["Naipyidó", "Naypyidaw", "Naypyidaw", "Naypyidaw", "Naypyidaw", "Naypyidaw"],
  pk: ["Islamabad", "Islamabad", "Islamabad", "Islamabad", "Islamabad", "Islamabad"],
  ps: ["Ramala", "Ramal·la", "Ramallah", "Ramallah", "Ramallah", "Ramallah"],
  qa: ["Doha", "Doha", "Doha", "Doha", "Doha", "Doha"],
  lk: ["Sri Jayawardenapura Kotte", "Sri Jayawardenapura Kotte", "Sri Jayawardenapura Kotte", "Sri Jayawardenapura Kotte", "Sri Jayawardenapura Kotte", "Sri Jayawardenapura Kotte"],
  tr: ["Ankara", "Ankara", "Ankara", "Ankara", "Ankara", "Ankara"],
  ae: ["Abu Dabi", "Abu Dhabi", "Abu Dhabi", "Abou Dabi", "Abu Dhabi", "Abu Dhabi"],
  vn: ["Hanói", "Hanoi", "Hanoi", "Hanoï", "Hanoi", "Hanoi"],
  ye: ["Saná", "Sanà", "Sanaa", "Sanaa", "Sanaa", "Sanaa"],
  ad: ["Andorra la Vieja", "Andorra la Vella", "Andorra la Vella", "Andorre-la-Vieille", "Andorra la Vella", "Andorra la Vella"],
  mt: ["La Valeta", "La Valletta", "Valletta", "La Valette", "Valletta", "La Valletta"],
  ch: ["Berna", "Berna", "Bern", "Berne", "Bern", "Berna"],
  va: ["Ciudad del Vaticano", "Ciutat del Vaticà", "Vatican City", "Cité du Vatican", "Vatikanstadt", "Città del Vaticano"],
  ca: ["Ottawa", "Ottawa", "Ottawa", "Ottawa", "Ottawa", "Ottawa"],
  us: ["Washington D. C.", "Washington DC", "Washington, D.C.", "Washington", "Washington, D.C.", "Washington"],
  bz: ["Belmopán", "Belmopan", "Belmopan", "Belmopan", "Belmopan", "Belmopan"],
  cr: ["San José", "San José", "San José", "San José", "San José", "San José"],
  sv: ["San Salvador", "San Salvador", "San Salvador", "San Salvador", "San Salvador", "San Salvador"],
  gt: ["Ciudad de Guatemala", "Ciutat de Guatemala", "Guatemala City", "Guatemala", "Guatemala-Stadt", "Città del Guatemala"],
  pa: ["Ciudad de Panamá", "Ciutat de Panamà", "Panama City", "Panama", "Panama-Stadt", "Città di Panama"],
  ag: ["Saint John's", "Saint John's", "Saint John's", "Saint John's", "Saint John's", "Saint John's"],
  bs: ["Nasáu", "Nassau", "Nassau", "Nassau", "Nassau", "Nassau"],
  bb: ["Bridgetown", "Bridgetown", "Bridgetown", "Bridgetown", "Bridgetown", "Bridgetown"],
  dm: ["Roseau", "Roseau", "Roseau", "Roseau", "Roseau", "Roseau"],
  gd: ["Saint George's", "Saint George's", "Saint George's", "Saint George's", "Saint George's", "Saint George's"],
  jm: ["Kingston", "Kingston", "Kingston", "Kingston", "Kingston", "Kingston"],
  kn: ["Basseterre", "Basseterre", "Basseterre", "Basseterre", "Basseterre", "Basseterre"],
  lc: ["Castries", "Castries", "Castries", "Castries", "Castries", "Castries"],
  vc: ["Kingstown", "Kingstown", "Kingstown", "Kingstown", "Kingstown", "Kingstown"],
  bo: ["Sucre", "Sucre", "Sucre", "Sucre", "Sucre", "Sucre"],
  br: ["Brasilia", "Brasília", "Brasília", "Brasilia", "Brasília", "Brasilia"],
  cl: ["Santiago", "Santiago", "Santiago", "Santiago", "Santiago", "Santiago"],
  ec: ["Quito", "Quito", "Quito", "Quito", "Quito", "Quito"],
  gy: ["Georgetown", "Georgetown", "Georgetown", "Georgetown", "Georgetown", "Georgetown"],
  fj: ["Suva", "Suva", "Suva", "Suva", "Suva", "Suva"],
  ki: ["Tarawa Sur", "Tarawa Sud", "South Tarawa", "Tarawa-Sud", "Süd-Tarawa", "Tarawa Sud"],
  fm: ["Palikir", "Palikir", "Palikir", "Palikir", "Palikir", "Palikir"],
  nr: ["Yaren", "Yaren", "Yaren", "Yaren", "Yaren", "Yaren"],
  nz: ["Wellington", "Wellington", "Wellington", "Wellington", "Wellington", "Wellington"],
  pw: ["Ngerulmud", "Ngerulmud", "Ngerulmud", "Ngerulmud", "Ngerulmud", "Ngerulmud"],
  sb: ["Honiara", "Honiara", "Honiara", "Honiara", "Honiara", "Honiara"],
  to: ["Nukualofa", "Nukualofa", "Nukualofa", "Nukualofa", "Nukualofa", "Nukualofa"],
  vu: ["Port Vila", "Port Vila", "Port Vila", "Port-Vila", "Port Vila", "Port Vila"],
};

/* Capitales cuya zona horaria en español se escribe distinto que en el
   juego, pero es la misma ciudad ("Nom Pen" / "Phnom Penh"). */
const ZONE_BY_CODE = {
  bj: "Africa/Porto-Novo", kh: "Asia/Phnom_Penh", jo: "Asia/Amman",
  kg: "Asia/Bishkek", kp: "Asia/Pyongyang", ss: "Africa/Juba",
};

/* Retoques finales sobre CLDR: formas de ordenación ("Caire, el") y
   desambiguaciones ("Tripoli (Libye)"). */
const CAPITAL_FIX = { eg: { ca: "el Caire" }, ly: { fr: "Tripoli" } };

/* ─────────────────────────── CLDR ─────────────────────────── */
const territories = {};
const exemplarCities = {};
for (const code of ALL) {
  territories[code] = require(`cldr-localenames-full/main/${code}/territories.json`)
    .main[code].localeDisplayNames.territories;

  /* Cada idioma solo trae las ciudades que se escriben distinto de la raíz;
     el resto se hereda, y la raíz es el nombre del segmento de la zona. */
  const cities = {};
  (function walk(node, path) {
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (!value || typeof value !== "object") continue;
      if (value.exemplarCity) cities[[...path, key].join("/")] = value.exemplarCity;
      else walk(value, [...path, key]);
    }
  })(require(`cldr-dates-full/main/${code}/timeZoneNames.json`).main[code].dates.timeZoneNames.zone, []);
  exemplarCities[code] = cities;
}
const moment = require("moment-timezone");
const cityOf = (lang, zone) => exemplarCities[lang][zone] || zone.split("/").pop().replace(/_/g, " ");

const zoneByEsCity = {};
for (const zone of moment.tz.names()) {
  if (!zone.includes("/") || zone.startsWith("Etc/")) continue;
  const city = cityOf(SOURCE, zone);
  if (!(city in zoneByEsCity)) zoneByEsCity[city] = zone;
}

/* ─────────────────────── Entrada del juego ─────────────────────── */
const countryCodes = [...readFileSync(resolve(ROOT, "js/countries.js"), "utf8")
  .matchAll(/"code":"([a-z]{2})"/g)].map(m => m[1]);
const { NAMES: SPANISH } = await import(`file://${resolve(ROOT, "js/i18n/names.es.js")}`);

/* ─────────────────────────── Salida ─────────────────────────── */
const clean = s => String(s).replace(/­/g, "").trim();  /* guiones blandos */
const problems = [];
const out = Object.fromEntries(TARGETS.map(([code]) => [code, {}]));

for (const cc of countryCodes) {
  const spanish = SPANISH[cc];
  if (!spanish) { problems.push(`${cc}: no está en names.es.js`); continue; }
  const [, esCapital] = spanish;

  const manual = CAPITAL_OVERRIDES[cc];
  if (manual && manual[0] !== esCapital) {
    problems.push(`${cc}: la excepción dice "${manual[0]}" y names.es.js dice "${esCapital}"`);
  }
  const zone = manual ? null : (ZONE_BY_CODE[cc] || zoneByEsCity[esCapital]);
  if (!manual && !zone) problems.push(`${cc}: sin zona horaria para "${esCapital}", hace falta una excepción`);

  TARGETS.forEach(([lang], i) => {
    const name = NAME_OVERRIDES[cc]?.[lang] || territories[lang][cc.toUpperCase()];
    const capital = CAPITAL_FIX[cc]?.[lang]
      || (manual ? manual[i + 1] : (zone ? cityOf(lang, zone) : esCapital));
    if (!name) problems.push(`${cc}/${lang}: sin nombre`);
    if (!capital) problems.push(`${cc}/${lang}: sin capital`);
    out[lang][cc] = [clean(name), clean(capital)];
  });
}

if (problems.length) {
  console.error(`✖ ${problems.length} problema(s):`);
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
}

const header = language => `/* Nombres de país y capitales en ${language}, uno de los seis idiomas del juego.

   ARCHIVO GENERADO: no se edita a mano, los cambios se pierden. Sale de
   \`node tools/build-names.mjs\`, que lo saca de CLDR (unicode-org/cldr-json,
   Unicode License) tomando js/i18n/names.es.js como original. Ver
   docs/idiomas.md.

   Formato: código ISO 3166-1 alfa-2 → [nombre del país, capital]. */
export const NAMES = {
`;

for (const [lang, language] of TARGETS) {
  const body = countryCodes
    .map(cc => `  ${cc}: [${JSON.stringify(out[lang][cc][0])}, ${JSON.stringify(out[lang][cc][1])}],`)
    .join("\n");
  writeFileSync(resolve(ROOT, `js/i18n/names.${lang}.js`), header(language) + body + "\n};\n");
}
console.log(`✔ ${TARGETS.length} idiomas · ${countryCodes.length} países`);
