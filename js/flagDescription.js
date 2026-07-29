/* Descripción textual de una bandera para lectores de pantalla, a partir de
   las etiquetas `pattern`/`palette` ya existentes en countries.js.
   Deliberadamente NO nombra el país: es la alternativa no visual al mismo
   puzzle que ve una persona vidente (identificar la bandera), no la solución. */

const COLOR_ES = {
  black: "negro", blue: "azul", gold: "dorado", green: "verde",
  maroon: "granate", orange: "naranja", red: "rojo", white: "blanco", yellow: "amarillo",
};

const TOKEN_ES = {
  arrowhead: "una punta de flecha", band: "una banda de color", bicolor: "dos colores",
  bird: "un ave", block: "bloques de color", border: "un borde de color",
  canton: "un recuadro en una esquina", carpet: "un patrón repetido",
  center: "un elemento centrado", circle: "un círculo", complex: "un diseño elaborado",
  crescent: "una media luna", cross: "una cruz", crown: "una corona",
  diagonal: "una diagonal", diamonds: "rombos", disc: "un disco",
  double: "un elemento doble", dragon: "un dragón", eagle: "un águila",
  emblem: "un emblema central", globe: "un globo terráqueo",
  hoist: "un detalle junto al asta", horizontal: "franjas horizontales",
  leaf: "una hoja", lion: "un león", map: "un mapa", mixed: "un diseño mixto",
  multi: "varios colores", nutmeg: "una semilla de nuez moscada",
  other: "", outline: "un contorno", pattern: "un patrón decorativo",
  pennant: "forma de banderín, no rectangular", plain: "un fondo liso",
  quartered: "cuatro cuadrantes", rays: "rayos", rectangle: "un rectángulo central",
  red: "", saltire: "una cruz en aspa (diagonal)", serrated: "un borde dentado",
  shield: "un escudo", single: "un único elemento", star: "una estrella",
  stars: "varias estrellas", stripe: "una franja", stripes: "franjas",
  sun: "un sol", text: "texto o escritura", trapezoid: "un trapecio",
  tree: "un árbol", triangle: "un triángulo", tricolor: "tres colores",
  trident: "un tridente", vertical: "franjas verticales", wheel: "una rueda", y: "una forma en Y",
};

const SPECIALS = [
  [/union-jack/, "la Union Jack en una esquina"],
  [/star-of-david/, "una estrella de David"],
  [/canton-stars-southern-cross/, "estrellas y una cruz austral en una esquina"],
  [/taegeuk/, "un círculo con curvas enlazadas, tipo yin-yang"],
  [/cross-nordic/, "una cruz descentrada hacia el asta (estilo nórdico)"],
];

function joinList(items) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + " y " + items[items.length - 1];
}

function describePattern(pattern) {
  let rest = pattern;
  const parts = [];
  for (const [re, phrase] of SPECIALS) {
    if (re.test(rest)) { parts.push(phrase); rest = rest.replace(re, ""); }
  }
  const tokens = rest.split("-").filter(t => t && t !== "of" && t !== "david" && t !== "union" && t !== "jack" && t !== "southern");
  for (const t of tokens) {
    const phrase = TOKEN_ES[t];
    if (phrase) parts.push(phrase);
  }
  return parts.length ? joinList(parts) : "un diseño de bandera";
}

export function describeFlag(country) {
  const colors = country.palette.split("-").map(c => COLOR_ES[c] || c);
  return `Bandera con ${describePattern(country.pattern)}, en ${joinList(colors)}.`;
}
