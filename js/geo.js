/* Pistas geográficas del reto diario.

   Sin pistas, adivinar un país viendo un noveno de su bandera es
   prácticamente imposible: con la distancia y la dirección al país
   acertado, cada intento fallido acerca de verdad al siguiente. Las
   coordenadas son el centroide aproximado de cada país (campos `lat` y
   `lon` de js/countries.js), no su capital: para una pista de "estás a
   9.000 km hacia el sureste" el error de unos pocos cientos de
   kilómetros no cambia nada. */

const R_KM = 6371;                 /* radio medio de la Tierra */
export const MAX_DIST_KM = 20015;  /* media circunferencia: la distancia máxima posible */

const rad = deg => deg * Math.PI / 180;

/* Distancia del círculo máximo (haversine), en kilómetros enteros. */
export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h))));
}

/* Rumbo inicial de `a` hacia `b`, en grados desde el norte. */
function bearing(a, b) {
  const dLon = rad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat))
    - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/* Los ocho rumbos, con su nombre para quien navegue con lector de
   pantalla (una flecha suelta no dice nada en voz alta). */
const ARROWS = [
  ['⬆️', 'norte'], ['↗️', 'noreste'], ['➡️', 'este'], ['↘️', 'sureste'],
  ['⬇️', 'sur'], ['↙️', 'suroeste'], ['⬅️', 'oeste'], ['↖️', 'noroeste'],
];

export function direction(a, b) {
  const i = Math.round(bearing(a, b) / 45) % 8;
  const [arrow, label] = ARROWS[i];
  return { arrow, label };
}

/* "Lo cerca que estás", de 0 a 100. Es lineal sobre la distancia máxima
   posible, igual que en Worldle: no pretende ser una probabilidad, solo
   una forma de leer la distancia de un vistazo. */
export function proximity(km) {
  return Math.max(0, Math.round((1 - km / MAX_DIST_KM) * 100));
}
