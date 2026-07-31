/* Helpers de interfaz compartidos por las pantallas del juego.
   Vivían dentro de js/game.js; se sacan aquí porque el reto diario
   (js/daily.js) es otra pantalla y necesita exactamente los mismos, y
   dos copias de `onTap` es justo el tipo de duplicado que acaba
   divergiendo. */

export const $ = id => document.getElementById(id);

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* Solo `click`, nunca `touchend`.

   Con `touchend` cualquier dedo que se levantase encima de un botón lo
   activaba, aunque el gesto hubiese sido un scroll de media pantalla: en
   el móvil era imposible desplazarse por la portada sin entrar en alguna
   tarjeta sin querer. El navegador ya distingue el scroll del toque y no
   emite `click` si el dedo se ha desplazado, así que hace el trabajo
   bien. No se pierde reactividad: `touch-action:manipulation` en el body
   ya elimina el retardo de 300ms que motivaba el atajo.

   Tampoco se llama a `preventDefault()`: en `click` no aporta nada y
   estropea el foco de teclado. El antirrebote de 500ms se queda, que es
   lo que evita el doble disparo. */
export function onTap(el, fn) {
  let last = 0;
  el.addEventListener('click', e => {
    const now = Date.now();
    if (now - last < 500) return;
    last = now;
    fn(e);
  });
}

/* Comparación de texto escrita por una persona: sin mayúsculas, sin
   tildes y sin espacios de más. Es lo que permite aceptar "peru",
   "PERÚ" y " Perú " como el mismo país en el reto diario. */
export function normText(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}
