/* Guarda y consulta partidas en Supabase usando la API REST (PostgREST)
   directamente con fetch, sin depender de ninguna librería externa.
   La tabla `games` tiene RLS: solo se permite insertar y leer, con límites
   razonables (ver migración games_public_rls). No hay datos sensibles. */

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

export function saveScore({ player, level, score, rounds, errors, daily, dailyDate }) {
  return safeFetch(`${SUPABASE_URL}/rest/v1/games`, {
    method: "POST",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify({
      player, level, score, rounds, errors: errors || 0,
      daily: !!daily, daily_date: dailyDate || null,
    }),
  });
}

export function getHistory(player, limit = 10) {
  const q = `player=eq.${encodeURIComponent(player)}&order=created_at.desc&limit=${limit}`;
  return safeFetch(`${SUPABASE_URL}/rest/v1/games?${q}`, { headers: headers() });
}

export function getFamilyRanking() {
  return safeFetch(`${SUPABASE_URL}/rest/v1/best_scores?order=best_score.desc&limit=50`, { headers: headers() });
}

export function getDailyRanking() {
  return safeFetch(`${SUPABASE_URL}/rest/v1/daily_ranking?order=score.desc&limit=50`, { headers: headers() });
}
