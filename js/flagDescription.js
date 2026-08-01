/* Descripción textual de una bandera para lectores de pantalla, a partir de
   las etiquetas `pattern`/`palette` ya existentes en countries.js.
   Deliberadamente NO nombra el país: es la alternativa no visual al mismo
   puzzle que ve una persona vidente (identificar la bandera), no la solución.

   Aquí no hay ni una palabra escrita: la gramática (cómo se enumera, cómo se
   arma la frase) es común a los seis idiomas y el vocabulario lo pone el
   paquete del idioma activo, en su bloque `flag` — ver js/i18n/es.js. */

import { flagVocabulary } from "./i18n.js";

/* Patrones que no se entienden partiéndolos en trozos: la Union Jack no es
   "una unión" más "un gato". Se detectan enteros y se sacan de la cadena
   antes de trocear el resto. La clave apunta al vocabulario del idioma. */
const SPECIALS = [
  [/union-jack/, "unionJack"],
  [/star-of-david/, "starOfDavid"],
  [/canton-stars-southern-cross/, "southernCross"],
  [/taegeuk/, "taegeuk"],
  [/cross-nordic/, "nordicCross"],
];

/* Restos de los patrones especiales que ya no significan nada por su cuenta. */
const DROPPED_TOKENS = ["of", "david", "union", "jack", "southern"];

function joinList(items, and) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + and + items[items.length - 1];
}

function describePattern(pattern, vocab) {
  let rest = pattern;
  const parts = [];
  for (const [re, key] of SPECIALS) {
    if (re.test(rest)) { parts.push(vocab.specials[key]); rest = rest.replace(re, ""); }
  }
  const tokens = rest.split("-").filter(tok => tok && !DROPPED_TOKENS.includes(tok));
  for (const tok of tokens) {
    const phrase = vocab.tokens[tok];
    if (phrase) parts.push(phrase);
  }
  return parts.length ? joinList(parts, vocab.and) : vocab.fallback;
}

export function describeFlag(country) {
  const vocab = flagVocabulary();
  const colors = country.palette.split("-").map(c => vocab.colors[c] || c);
  return vocab.sentence
    .replace("{shapes}", describePattern(country.pattern, vocab))
    .replace("{colors}", joinList(colors, vocab.and));
}
