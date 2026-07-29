export const LEVELS = {
  nene: {
    key: "nene", label: "Nivel Nene", icon: "🧸",
    tagline: "Para empezar, con calma",
    rounds: 12, secs: 26, opts: 3,
    distractorMode: "easy", retry: true,
    hints: 3, mult: 1,
  },
  principiante: {
    key: "principiante", label: "Nivel Principiante", icon: "🌱",
    tagline: "Ya conoces unas cuantas",
    rounds: 16, secs: 15, opts: 3,
    distractorMode: "mixed", retry: true,
    hints: 2, mult: 1.2,
  },
  experto: {
    key: "experto", label: "Nivel Experto", icon: "🧠",
    tagline: "Un fallo y se acaba la ronda",
    rounds: 20, secs: 9, opts: 4,
    distractorMode: "hard", retry: false,
    hints: 1, mult: 1.6,
  },
  dios: {
    key: "dios", label: "Nivel Dios", icon: "🔥",
    tagline: "Banderas casi gemelas, tiempo mínimo",
    rounds: 20, secs: 6, opts: 5,
    distractorMode: "confusables", retry: false,
    hints: 0, mult: 2.2,
  },
};

/* El reto diario usa siempre la misma dificultad para que el ranking sea justo. */
export const DAILY_LEVEL_KEY = "experto";
export const DAILY_ROUNDS = 12;
