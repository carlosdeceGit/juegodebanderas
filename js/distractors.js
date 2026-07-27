import { confusablesFor } from "./confusables.js";

function paletteOverlap(p1, p2) {
  const s2 = new Set(p2.split("-"));
  let n = 0;
  for (const c of p1.split("-")) if (s2.has(c)) n++;
  return n;
}

function similarity(a, b) {
  return (a.pattern === b.pattern ? 3 : 0) + paletteOverlap(a.palette, b.palette) + (a.continent === b.continent ? 1 : 0);
}

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function ranked(pool, answer, dir) {
  return shuffle(pool)
    .map(c => ({ c, s: similarity(answer, c) }))
    .sort((a, b) => (dir === "desc" ? b.s - a.s : a.s - b.s))
    .map(x => x.c);
}

/* Elige n distractores para `answer` según el modo de dificultad del nivel. */
export function pickDistractors(countries, answer, n, mode) {
  const pool = countries.filter(c => c.code !== answer.code);
  let ordered;

  if (mode === "confusables") {
    const confCodes = confusablesFor(answer.code);
    const conf = shuffle(pool.filter(c => confCodes.includes(c.code)));
    const rest = ranked(pool.filter(c => !confCodes.includes(c.code)), answer, "desc");
    ordered = [...conf, ...rest];
  } else if (mode === "hard") {
    ordered = ranked(pool, answer, "desc");
  } else if (mode === "mixed") {
    const half = Math.ceil(n / 2);
    const hard = ranked(pool, answer, "desc").slice(0, half * 3);
    const easy = ranked(pool, answer, "asc").slice(0, (n - half) * 3);
    ordered = shuffle([...shuffle(hard).slice(0, half), ...shuffle(easy).slice(0, n - half)]);
  } else {
    ordered = ranked(pool, answer, "asc");
  }

  const seen = new Set();
  const out = [];
  for (const c of ordered) {
    if (seen.has(c.code)) continue;
    seen.add(c.code);
    out.push(c);
    if (out.length >= n) break;
  }
  return out;
}
