# Idiomas

El juego habla seis idiomas: **español, catalán, inglés, francés, alemán e
italiano**. No es solo la interfaz: los nombres de país, las capitales, los
continentes y las descripciones de bandera para lector de pantalla también
están traducidos. Una partida en alemán no enseña "España" por ninguna
parte, enseña "Spanien" con capital "Madrid" en el continente "Europa".

## Cómo se elige el idioma

1. Si el jugador ya eligió uno a mano, ese (`dcb_lang` en `localStorage`).
2. Si no, el del navegador, si es uno de los seis (`navigator.languages`, en
   orden de preferencia, quedándose con la parte base: `de-AT` → `de`).
3. Si no, español.

Hay **dos selectores**, y hacen exactamente lo mismo:

- **En el paso "¿Cómo te llamas?"**, junto al formulario de nombre: una
  fila con los seis códigos de dos letras (`ES · CA · EN · FR · DE · IT`).
  Solo aparece cuando ese formulario está visible, es decir, cuando alguien
  nuevo llega al juego — que es justo el momento en que puede hacer falta:
  si arranca en el idioma equivocado (lo detecta del navegador, y un móvil
  configurado en inglés en una casa que habla español es de lo más normal),
  se arregla ahí mismo. Con jugadores ya guardados desaparece de esa
  pantalla y queda solo en Ajustes. Va en código corto para no robar
  altura al formulario; el nombre entero sigue en el `aria-label`.

  **Estuvo en la portada y se quitó**: ocupaba la primera fila de la
  pantalla principal, encima del rótulo, para un ajuste que se toca una vez
  en la vida.
- **En Ajustes → 🌍 Idioma**, con los nombres completos ("Español",
  "Deutsch"), que es donde hay sitio para escribirlos.

El cambio es en caliente, sin recargar: se descarga el paquete del idioma,
se repintan las cadenas fijas del HTML y se vuelve a pintar la pantalla que
esté puesta. Los dos selectores pasan por `changeLanguage()` en `game.js`,
que además los mantiene sincronizados entre sí.

Ninguno de los dos aparece durante una partida —el botón de ajustes tampoco—
porque cambiar de idioma a media ronda, con el reloj corriendo y las
opciones ya en pantalla, no es algo que haga falta poder hacer.

**No se usan banderas para representar idiomas.** En un juego de banderas
sería confuso, y además no cuadran: el catalán no tiene bandera en emoji y
el inglés no es de ningún país en particular.

## Dónde vive cada cosa

```
js/i18n.js                Motor: elige idioma, lo carga y lo sirve.
                          NO contiene ni una cadena traducible.
js/i18n/<idioma>.js       Un archivo por idioma, escrito a mano:
                            · ui          cadenas de la interfaz
                            · continents  los cinco continentes
                            · flag        vocabulario de describeFlag()
js/i18n/names.<idioma>.js Nombres de país y capitales.
                          Solo names.es.js se edita a mano; los otros
                          cinco los genera tools/build-names.mjs.
tools/build-names.mjs     Generador de los cinco archivos de nombres.
tools/check-i18n.mjs      Comprueba que los seis idiomas están completos.
```

`js/countries.js` no tiene texto traducible: guarda el código ISO, el
continente como código (`"af"`, `"am"`, `"as"`, `"eu"`, `"oc"`) y las
etiquetas `pattern`/`palette`, que son las que usan el algoritmo de
distractores y la descripción accesible. El nombre y la capital se piden con
`countryName(c)` y `countryCapital(c)`.

## Añadir un idioma

1. Copiar `js/i18n/es.js` a `js/i18n/<código>.js` y traducirlo entero.
   Las claves y su orden no se tocan.
2. Añadir el código a `TARGETS` en `tools/build-names.mjs`, instalar sus
   dependencias y ejecutarlo para generar `js/i18n/names.<código>.js`.
   Si CLDR no trae ese idioma, se escribe el archivo a mano con el mismo
   formato: `código ISO: [nombre, capital]`.
3. Añadir `{ code, label, short }` a `LOCALES` en `js/i18n.js`. El `label` va
   escrito **en ese mismo idioma** ("Deutsch", no "alemán"): quien busca su
   idioma en la lista no sabe cómo se llama en español. `short` son las dos
   letras del selector corto. Con más de seis idiomas, esa fila deja de
   caber en una pantalla estrecha y habría que replantearla.
4. `node tools/check-i18n.mjs` tiene que pasar.

No hay que tocar `game.js`, `index.html` ni la lógica de juego.

## Comprobar que no falta nada

```bash
node tools/check-i18n.mjs
```

Compara los cinco idiomas contra el español y falla si a alguno le falta una
cadena, un país, un color o una palabra del vocabulario de banderas; si a
alguno le sobra algo que en español no existe; o si una cadena con huecos
(`{name}`, `{count}`…) no usa exactamente los mismos que el original —un
hueco de menos y el dato no sale por ningún lado, uno de más y el jugador ve
un literal `{count}` en la cara.

Sale con código 1 si algo falla, así que sirve tal cual en un hook o en CI.

## De dónde salen los nombres de país y las capitales

El español es el original y es una decisión editorial del juego: "Costa de
Marfil" y no "Côte d'Ivoire", "República del Congo" y no "Congo -
Brazzaville", el tono infantil del resto del juego. Vive en
`js/i18n/names.es.js` y se edita a mano.

Los otros cinco se generan con `tools/build-names.mjs` a partir de
[CLDR](https://github.com/unicode-org/cldr-json) (Unicode License):

- **El nombre del país**, de `territories.json`. Coincide con el español que
  ya tenía el juego en 187 de los 195 casos, lo que da bastante confianza en
  el resto.
- **La capital**, de la ciudad de referencia (`exemplarCity`) de su zona
  horaria, en `timeZoneNames.json`. Es un rodeo —una capital no es una zona
  horaria—, pero es la única lista de nombres de ciudad traducidos, revisada
  y mantenida, que se puede usar sin depender de un servicio en red. La zona
  se localiza buscando qué ciudad de referencia coincide, en español, con la
  capital que ya tiene el juego. Cubre 129 de las 195.
- **Las excepciones**, escritas a mano en el propio generador: las 60 y pico
  capitales que no dan nombre a ninguna zona horaria (Pretoria, Ottawa,
  Brasilia, Wellington…) y los 8 nombres de país donde CLDR mete una
  desambiguación que no pinta nada en un juego infantil.

El generador falla en vez de inventarse nada: si se añade un país cuya
capital no case con ninguna zona horaria, hay que añadirle su fila de
excepción a mano. Sus dependencias (`cldr-localenames-full`,
`cldr-dates-full`, `moment-timezone`) **no** están en el repositorio ni hay
`package.json`: el juego sigue sin build y sin dependencias, esto se ejecuta
a mano las contadas veces que se añade un país o un idioma.

## Lo que no se traduce, a propósito

- **Los nombres de los jugadores.** Los escribe quien juega.
- **El identificador del nivel** que se guarda en el ranking y en Supabase
  (`"experto"`, `"survival"`…). Es una clave, no texto: si se tradujera, el
  ranking de una casa que cambia de idioma se partiría en dos. Lo que se
  traduce es la etiqueta que se pinta, vía `labelKey`.
- **El mazo del reto diario**, que sale de una semilla con la fecha en UTC.
  Es el mismo mazo en los seis idiomas, así que el ranking diario y el duelo
  siguen siendo comparables entre gente que juega en idiomas distintos.

## Migraciones que ya están hechas

Quien venga de una versión anterior del juego no pierde nada:

- `dcb_continent` guardaba el continente en español (`"África"`). Ahora
  guarda un código (`"af"`); el valor viejo se traduce al arrancar y se
  vuelve a guardar. Lo mismo con el `scope` de `dcb_last_v1`.
- El historial de fallos (`dcb_wrong_v1`) y el de banderas vistas
  (`dcb_seen_v1`) ya iban por código ISO, así que sobreviven al cambio de
  idioma sin tocar nada: los fallos de una partida en español se repasan en
  alemán sin perderse.
