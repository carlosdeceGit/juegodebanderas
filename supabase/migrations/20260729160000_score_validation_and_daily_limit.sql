-- Fase 3 de la auditoría: cierra el hueco de "puntuación 100% confiada del
-- cliente" reforzando la validación en el propio servidor, y limita el
-- reto diario a un intento por jugador y día.

-- 1) Permite el nuevo modo "survival" (Fase 2), que hasta ahora no podía
-- guardar puntuación porque el check solo admitía los 4 niveles clásicos.
alter table public.games drop constraint games_level_check;
alter table public.games add constraint games_level_check
  check (level in ('nene', 'principiante', 'experto', 'dios', 'survival'));

-- 2) Sustituye el límite laxo (score <= 100000 fijo, sin relación con el
-- nivel ni las rondas) por la cota matemática real de la fórmula de
-- puntuación del cliente (js/game.js: computePoints). Cada ronda da como
-- máximo (50 + 50) * level.mult * streakMultiplier, y streakMultiplier
-- nunca supera x2, así que ninguna ronda puede superar 200 * level.mult
-- puntos. Por tanto score <= rounds * 200 * mult es una cota exacta, no
-- una suposición, para los niveles clásicos y el reto diario (que siempre
-- usa el nivel Experto). En "survival" el multiplicador escala con cada
-- ronda hasta un máximo de 2.5, así que se usa esa cota superior por ronda.
drop policy "anon puede insertar partidas" on public.games;
create policy "anon puede insertar partidas"
  on public.games for insert
  to anon
  with check (
    length(player) between 1 and 40
    and errors >= 0 and errors <= rounds
    and rounds >= 1
    and (
      (not daily and level = 'nene'          and rounds <= 12  and score <= rounds * 200 * 1)
      or (not daily and level = 'principiante' and rounds <= 16  and score <= rounds * 200 * 1.2)
      or (not daily and level = 'experto'      and rounds <= 20  and score <= rounds * 200 * 1.6)
      or (not daily and level = 'dios'         and rounds <= 20  and score <= rounds * 200 * 2.2)
      or (not daily and level = 'survival'     and rounds <= 195 and score <= rounds * 500)
      or (daily and level = 'experto'          and rounds <= 12  and score <= rounds * 200 * 1.6)
    )
  );

-- 3) Un intento por jugador y día en el reto diario. La comparación de
-- nombres ignora mayúsculas y espacios sobrantes para que "Ana" y "ana "
-- cuenten como el mismo jugador. Una segunda partida del reto diario el
-- mismo día para el mismo nombre es rechazada por PostgREST con 409: el
-- jugador puede seguir jugando localmente, pero solo el primer intento del
-- día se guarda y cuenta para el ranking diario.
create unique index games_daily_one_per_player
  on public.games (lower(trim(player)), daily_date)
  where daily;
