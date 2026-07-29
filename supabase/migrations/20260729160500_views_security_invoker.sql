-- Corrige un hallazgo de seguridad detectado por el linter de Supabase
-- (preexistente, no introducido en esta fase): las vistas se crean por
-- defecto sin `security_invoker`, así que se ejecutan con los permisos de
-- quien las creó en vez de los de quien las consulta. No filtraban nada
-- adicional en la práctica (la tabla ya permite SELECT público a anon),
-- pero es la forma correcta de exponer vistas públicas sobre una tabla
-- con RLS.
alter view public.best_scores set (security_invoker = true);
alter view public.daily_ranking set (security_invoker = true);
