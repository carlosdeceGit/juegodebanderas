/* Acceso a localStorage siempre tolerante a fallo: en navegación privada
   de iOS, con cookies bloqueadas o con la cuota llena, `localStorage`
   lanza excepción. El juego tiene que seguir jugándose igual, solo que
   sin recordar nada entre sesiones. */

export function lsGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
export function lsSet(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } }
export function lsDel(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }

/* Igual que lsGet pero con JSON.parse: devuelve `fallback` tanto si no
   hay nada guardado como si lo guardado es basura (versión anterior del
   formato, escritura a medias). */
export function lsGetJSON(key, fallback = null) {
  try {
    const raw = lsGet(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function lsSetJSON(key, value) { lsSet(key, JSON.stringify(value)); }
