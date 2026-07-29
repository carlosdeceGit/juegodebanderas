-- Juego familiar sin datos sensibles: se permite insertar y leer partidas
-- con la clave pública (anon), sin exponer clave secreta en el cliente.
create policy "anon puede insertar partidas"
  on public.games for insert
  to anon
  with check (
    length(player) between 1 and 40
    and score >= 0 and score <= 100000
    and rounds between 1 and 100
    and errors >= 0
  );

create policy "anon puede leer partidas"
  on public.games for select
  to anon
  using (true);
