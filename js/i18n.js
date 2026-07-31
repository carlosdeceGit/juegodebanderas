/* Motor de idiomas.

   El juego habla seis idiomas: español, catalán, inglés, francés, alemán e
   italiano. Cada uno vive entero en un archivo de js/i18n/ (cadenas de
   interfaz, continentes, vocabulario de las descripciones de bandera) más su
   archivo generado de nombres de país y capitales. Aquí no hay ni una sola
   cadena traducible: esto solo elige el idioma, lo carga y lo sirve.

   El paquete del idioma se carga con `import()` dinámico, así que un móvil
   solo se descarga el idioma que usa, no los seis. La contrapartida es que
   arrancar el juego pasa a ser asíncrono: game.js hace `await initI18n()`
   antes de pintar nada.

   Añadir un séptimo idioma es crear js/i18n/<código>.js y su
   names.<código>.js, y añadir el código a LOCALES. Nada más. */

/* Los seis idiomas, en el orden en que se pintan en el selector. El nombre
   de cada uno está escrito en ese mismo idioma y no se traduce nunca: un
   selector de idioma se lee en el idioma de destino, no en el de origen —
   quien busca "Deutsch" no sabe que en español eso pone "alemán". Por eso
   los nombres viven aquí y no dentro de cada paquete: hay que poder
   pintarlos todos sin haber cargado los seis. */
export const LOCALES = [
  { code: "es", label: "Español" },
  { code: "ca", label: "Català" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
];
export const LOCALE_CODES = LOCALES.map(l => l.code);
export const DEFAULT_LOCALE = "es";

const LOCALE_KEY = "dcb_lang";

let locale = DEFAULT_LOCALE;
let pack = null;

/* Idioma inicial: el que se eligió a mano gana; si no, el del navegador si
   lo hablamos; si no, español. `navigator.languages` viene ordenado por
   preferencia, así que se recorre en orden. */
function detectLocale() {
  let stored = null;
  try { stored = localStorage.getItem(LOCALE_KEY); } catch { /* ignore */ }
  if (LOCALE_CODES.includes(stored)) return stored;

  const wanted = navigator.languages?.length ? navigator.languages : [navigator.language || ""];
  for (const tag of wanted) {
    const base = String(tag).toLowerCase().split("-")[0];
    if (LOCALE_CODES.includes(base)) return base;
  }
  return DEFAULT_LOCALE;
}

async function loadPack(code) {
  /* La ruta se construye con una plantilla sobre una lista cerrada de
     códigos, nunca con texto que venga de fuera. */
  const mod = await import(`./i18n/${code}.js`);
  return mod.default;
}

/* Carga el idioma inicial. Devuelve el código que ha quedado activo. */
export async function initI18n() {
  const wanted = detectLocale();
  try {
    pack = await loadPack(wanted);
    locale = wanted;
  } catch {
    /* Si el paquete elegido no carga (red, archivo movido) el juego tiene
       que arrancar igual: se cae al español, y si ni eso, que reviente
       arriba, porque sin cadenas no hay juego que enseñar. */
    pack = await loadPack(DEFAULT_LOCALE);
    locale = DEFAULT_LOCALE;
  }
  applyDocumentLang();
  return locale;
}

/* Cambia de idioma en caliente. No recarga la página: quien llama repinta. */
export async function setLocale(code) {
  if (!LOCALE_CODES.includes(code) || code === locale) return locale;
  pack = await loadPack(code);
  locale = code;
  try { localStorage.setItem(LOCALE_KEY, code); } catch { /* ignore */ }
  applyDocumentLang();
  return locale;
}

export function getLocale() { return locale; }

function applyDocumentLang() { document.documentElement.lang = locale; }

/* ---------- Cadenas de interfaz ---------- */
export function t(key, vars) {
  let str = pack?.ui?.[key];
  if (str === undefined) return key;
  if (vars) for (const k in vars) str = str.replaceAll(`{${k}}`, vars[k]);
  return str;
}

/* ---------- Contenido: países, capitales, continentes ---------- */
/* Todos aceptan el objeto de countries.js o directamente el código ISO, que
   es como lo tienen guardado el historial de fallos y el mazo. */
const codeOf = c => (typeof c === "string" ? c : c?.code);

export function countryName(country) {
  return pack.names[codeOf(country)]?.[0] || codeOf(country) || "";
}
export function countryCapital(country) {
  return pack.names[codeOf(country)]?.[1] || "";
}
export function continentName(code) {
  return pack.continents[code] || code;
}

/* Vocabulario con el que js/flagDescription.js arma la descripción de una
   bandera para lectores de pantalla. */
export function flagVocabulary() { return pack.flag; }

/* Compara textos con las reglas del idioma activo (la eñe, los acentos y
   las ligaduras no ordenan igual en todas partes). */
export function compareText(a, b) { return String(a).localeCompare(String(b), locale); }

/* ---------- Cadenas estáticas del HTML ---------- */
/* Se puede llamar tantas veces como haga falta: al arrancar y cada vez que
   se cambia de idioma. Por eso el HTML conserva el texto en español dentro
   de las etiquetas — es lo que se ve si el JavaScript no llega a correr. */
export function applyStaticI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll("[data-i18n-aria-label]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel)); });
  document.title = t("app.title");
}
