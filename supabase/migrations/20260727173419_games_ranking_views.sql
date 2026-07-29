create view public.best_scores as
select
  player,
  level,
  max(score) as best_score,
  count(*) as games_played,
  max(created_at) as last_played
from public.games
group by player, level;

create view public.daily_ranking as
select player, level, score, errors, created_at
from public.games
where daily = true and daily_date = current_date
order by score desc;

grant select on public.best_scores to anon;
grant select on public.daily_ranking to anon;
