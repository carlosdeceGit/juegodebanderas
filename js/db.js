/* Guarda y consulta partidas en Supabase usando la API REST (PostgREST)
   directamente con fetch, sin depender de ninguna librería externa.
   La tabla `games` tiene RLS: solo se permite insertar y leer, con la
   puntuación acotada a lo que la fórmula de puntos del cliente puede
   producir de verdad, y un único intento por jugador y día en el reto
   diario (ver supabase/migrations/). No hay datos sensibles. */

const SUPABASE_URL = "https://qpznlfosevedkacgcluj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwem5sZm9zZXZlZGthY2djbHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjUwNjAsImV4cCI6MjEwMDc0MTA2MH0.b1qZLXIyfS5GaRtMY-B8cMJ9gBR4v8i1c-7VeZOTY0M";

function headers(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function safeFetch(url, opts) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : true;
  } catch {
    return null; // sin conexión: el juego sigue funcionando igualmente
  }
}

/* Devuelve { ok, reason } en vez de tragarse el resultado: el juego lo usa
   para avisar si el reto diario de hoy ya se había jugado antes (rechazado
   por el servidor con 409 por el índice único games_daily_one_per_player),
   sin bloquear nada más si no hay red o el servidor no responde. */
export async function saveScore({ player, level, score, rounds, errors, daily, dailyDate }) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/games`, {
      method: "POST",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        player, level, score, rounds, errors: errors || 0,
        daily: !!daily, daily_date: dailyDate || null,
      }),
    });
    if (res.status === 409) return { ok: false, reason: "duplicate" };
    return { ok: res.ok, reason: res.ok ? null : "rejected" };
  } catch {
    return { ok: false, reason: "offline" };
  }
}

export function getHistory(player, limit = 10) {
  const q = `player=eq.${encodeURIComponent(player)}&order=created_at.desc&limit=${limit}`;
  return safeFetch(`${SUPABASE_URL}/rest/v1/games?${q}`, { headers: headers() });
}

/* El ranking de casa NO se consulta aquí: vive en localStorage (ver
   "Ranking" en el README). `best_scores` devolvía las 50 mejores marcas
   de la tabla entera sin filtro alguno, así que enseñaba los nombres de
   cualquiera que hubiese jugado desde cualquier dispositivo — algo que
   docs/decisiones-producto.md ya daba por descartado. La vista sigue
   existiendo en la base de datos; simplemente el juego no la usa. */

export function getDailyRanking() {
  return safeFetch(`${SUPABASE_URL}/rest/v1/daily_ranking?order=score.desc&limit=50`, { headers: headers() });
}
