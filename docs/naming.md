# Naming y copy: por qué el juego debería cambiar de nombre

Este documento es el trabajo de naming del proyecto: qué es el juego de
verdad, qué activos de marca tiene, por qué el nombre actual es un
problema, qué nombres se han evaluado y cuáles están libres como dominio.

No cambia ni una línea de código. La decisión de nombre es del producto;
esto es el material para tomarla. La última sección tiene la copy
concreta y las claves de `js/i18n.js` que habría que tocar cuando se
tome.

## 1. Qué es este juego, en una frase

Un juego web en español para adivinar países por su bandera, pensado
para jugarse **en casa, en un mismo dispositivo, entre varias personas
de edades distintas**, con un reto diario compartido que da excusa para
volver cada día.

Eso no es lo mismo que "un quiz de banderas". Las diferencias importan
para el nombre.

## 2. Qué es lo importante (los activos reales)

Cinco cosas que el juego hace y que la competencia no hace, en orden de
fuerza. El nombre tiene que ser compatible con todas y, si puede,
apoyar alguna:

1. **Es de casa, no de una persona sola.** La lista de jugadores
   (`dcb_players_v1`), la elección de ficha en el paso 3 y el "ranking
   de casa" existen porque el móvil se pasa de mano en mano. El resto
   del mercado (Flagle, Flagdle, Worldle) es un puzzle individual de
   seis intentos. Esto es lo más diferencial que tiene el producto.
2. **Escala de edad real dentro del mismo juego.** Nivel Nene con
   reintentos y 26 segundos, y Nivel Dios con banderas casi gemelas y 6
   segundos. Un abuelo y un niño de seis años juegan lo mismo sin que
   ninguno se aburra. Ocho modos, no uno.
3. **Español nativo, no traducido.** Nombres de países y capitales en
   español de verdad. Flagle y compañía piden saberse los países en
   inglés; ese es su punto de fuga y el hueco de este juego.
4. **Enseña de verdad.** Modo Aprender, "Repasa tus fallos" alimentado
   por el historial de errores, la capital como dato tras cada ronda,
   contador de banderas vistas. Es un juego que deja poso.
5. **Limpio y accesible.** Sin cuentas, sin anuncios, sin rastreo, los
   nombres no salen del dispositivo, funciona sin conexión, contrastes
   medidos, texto escalable, lector de pantalla. Es un juego que un
   padre deja abierto sin mirar dos veces.

El nombre no puede cargar con las cinco. Lo mínimo que tiene que hacer:
**sonar a juego de casa en español y no sonar a app de trivial genérica
ni a producto americano traducido.**

## 3. El problema con "Diversión con Banderas"

Tres problemas, de mayor a menor gravedad.

### 3.1 No es un nombre, es una cita de Warner

"Diversión con Banderas" es el título del doblaje español de *Fun with
Flags*, el programa de Sheldon Cooper en *The Big Bang Theory* (T5E14 en
adelante). No es un parecido razonable: es la frase exacta, en el mismo
ámbito temático (banderas) y en el mismo registro (contenido de humor
sobre banderas). Cualquiera que reconozca la serie va a asumir que el
juego es un homenaje o un producto derivado.

Dos matices honestos, para no exagerar el riesgo:

- **No se ha encontrado un registro de marca de "Fun with Flags"** a
  nombre de Warner Bros. en las búsquedas hechas. Esto es una búsqueda
  web, no un informe de un agente de marcas: sirve para orientar, no
  para decidir. Lo que sí está claro es que el merchandising de la serie
  se vende bajo licencia oficial de Warner.
- Mientras el juego sea privado y familiar, el riesgo práctico es
  aproximadamente cero.

El problema aparece exactamente cuando se compra un dominio, que es lo
que motiva este documento. Un nombre construido sobre una propiedad
ajena **no se puede registrar como marca, no se puede defender, y es
retirable por un tercero en cualquier momento**. Es un techo puesto al
proyecto desde el día uno, y el coste de cambiarlo solo sube con el
tiempo.

### 3.2 No dice qué es

"Diversión con Banderas" describe un tono, no una acción. No dice que se
adivina, no dice que se juega en familia, no dice que es en español.
Comparado con "Flagle" (que en su categoría ya significa algo) o con
"Adivina la Bandera", pierde en las dos direcciones: ni es evocador ni
es descriptivo.

### 3.3 Está enterrado en buscadores

Toda la primera página de resultados de esa frase es *The Big Bang
Theory*: la wiki, clips de YouTube, Warner Channel, merchandising. El
juego jamás va a posicionar por su propio nombre. Es el peor escenario
posible de SEO: competir contra una serie global por una frase que ella
popularizó.

## 4. El mapa competitivo

Lo que hay hoy, y qué enseña para el nombre:

| Producto | Qué es | Lectura |
|---|---|---|
| Flagle, Flagle.io, Flagle.fun, Flagle.net, Flagle.org | Un mismo nombre repartido entre media docena de clones | El sufijo `-dle` está **saturado y sin dueño**: nadie es propietario de nada |
| Flagdle | Bandera revelada por trozos + 5 modos | Mismo patrón, misma saturación |
| Worldle | Silueta del país con distancia y dirección | Confundible con Wordle a propósito |
| adivinalabandera.com | Quiz en español, 8 modos, ranking global | **El competidor directo real**: ya ocupa el nombre descriptivo obvio |
| Banderea (Lúdilo) | Juego de mesa de cartas y dados, 5+ años, 6 modos, banderas y capitales | Competidor en la misma categoría y el mismo mercado, **en físico** |

Tres conclusiones:

1. **Nada de `-dle`.** Llegar el último a una convención saturada de
   clones es pedir que te confundan con el peor de ellos.
2. **El nombre descriptivo en español ya está cogido** ("adivina la
   bandera"). No hay que pelear esa palabra: hay que rodearla.
3. **El nombre en inglés no aporta nada aquí.** El activo #3 es
   precisamente que esto es español nativo. Un nombre en inglés lo tira.

## 5. Criterios usados para filtrar

Un candidato tiene que pasar los seis:

1. **Se dicta por teléfono sin deletrear.** Mata todo lo que lleve `ñ`
   (el punycode es un desastre y nadie lo escribe), y penaliza las
   palabras cultas de ortografía dudosa.
2. **Se entiende igual en España y en América.** Descarta los
   modismos muy locales.
3. **Dice "banderas" o "juego" sin necesidad de explicación.**
4. **Es registrable como marca**, es decir, no es un genérico puro ni la
   propiedad de otro.
5. **`.com` libre** a precio normal, sin premium.
6. **Sin colisión** con un producto existente de la misma categoría.

## 6. Territorios explorados

### Territorio A — La pregunta del juego

Coger la frase que el juego ya dice. El modo principal se llama
literalmente **"¿Qué bandera es?"** en `i18n.js`. Es la pregunta que se
hace el jugador en cada ronda.

- **QuéBandera** ✅ pasa los seis criterios
- ¿Qué Bandera Es? — mismo territorio, versión larga

### Territorio B — Verbos de bandera

Bonitos, distintivos, registrables; el riesgo es que sean cultos.

- **Enarbola** (enarbolar una bandera) — precioso, imperativo, cero
  colisiones; pero mucha gente no conoce el verbo y se confunde con
  "árbol"
- **Iza / Izabandera** (izar) — claro, pero "izabandera" pegado es duro
  de leer y "Iza" solo no está libre
- **Ondea / Ondear / Ondeo** — elegantes y cortos; **todos ocupados**

### Territorio C — Diminutivos y objetos

Era el territorio favorito a priori: el juego tiene banderines de
decoración en la portada (`.bunting`) y un aire artesanal de papel.

- **Banderín / Banderola / Banderines** ❌ **descartados**. Dos motivos
  independientes y cada uno basta: los `.com` y `.app` están cogidos, y
  sobre todo, en español "banderín" y "banderola" significan
  **señalética publicitaria**. Buscar esas palabras devuelve imprentas y
  rotulación. Es contaminación semántica y SEO envenenado.

### Territorio D — Vexilología

- **Vexi / Vexilo / Vexia** ❌ los `.com`/`.app` buenos están cogidos, y
  lo que queda es caro. Además el guiño solo lo pilla quien ya sabe qué
  es la vexilología, que es justo el público que no necesita el juego.

### Territorio E — Descriptivos y genéricos

- **banderas.fun / banderas.io / banderas.game** ✅ libres (ver tabla).
  `banderas.fun` se lee "banderas fun": es exactamente el
  posicionamiento del nombre actual **sin Warner por medio**, y cuesta
  dos dólares.
  El coste real: "banderas" es un genérico puro, así que **no se puede
  registrar como marca ni defender de nadie**, y `.fun` es un dominio de
  segunda fila cuya renovación cuesta bastante más que el reclamo del
  primer año.
- **adivinalabandera.com** ❌ ocupado por el competidor directo
- **juegodebanderas.com** ✅ libre, pero es el nombre del repositorio,
  no una marca: cero distintividad

### Colisión importante encontrada

**"Banderea" está descartado pese a tener el `.com` libre.** Es el
nombre de un juego de mesa de banderas de la editorial Lúdilo (cartas y
dados, 2-10 jugadores, 5+ años, banderas y capitales), que se vende hoy
en Zacatrus, Kinuma y media docena de jugueterías españolas. Misma
categoría, mismo público, mismo país, nombre idéntico. Que el dominio
esté libre no significa que el nombre lo esté; es un buen recordatorio
de por qué el criterio 6 existe.

## 7. Disponibilidad de dominios (comprobada)

Precios de registro de primer año vía el buscador de Vercel, julio de
2026. **Ojo con la renovación**: en `.fun`, `.io` y `.game` el precio de
renovación es muy superior al de alta.

### Libres

| Dominio | Precio 1er año | Nota |
|---|---|---|
| **quebandera.com** | **$11.25** | ⭐ recomendado |
| **quebandera.app** | **$9.99** | ⭐ HTTPS forzado por TLD |
| quebandera.es | — | Libre, pero Vercel no vende `.es`; hay que ir a un registrador español |
| quebandera.io | $37.99 | |
| quebandera.fun | $1.99 | |
| quebanderaes.com | $11.25 | Defensivo, para redirigir |
| banderas.fun | $1.99 | Genérico, no registrable como marca |
| banderas.io | $37.99 | |
| banderas.game | $349.99 | |
| enarbola.com | $11.25 | |
| enarbola.app | $9.99 | |
| izabandera.com | $11.25 | |
| izabandera.app | $9.99 | |
| banderea.com | $11.25 | ⚠️ libre pero **colisiona** con el juego de Lúdilo |
| banderin.io / .net / .org / .club / .fun | $2–38 | ⚠️ `.com` y `.app` cogidos + significado de señalética |
| banderin.game | $349.99 | |
| juegodebanderas.com | $11.25 | Sin distintividad |
| banderasencasa.com | $11.25 | |
| banderadeldia.com | $11.25 | |
| mundobandera.com | $11.25 | |
| banderio.com | $11.25 | |
| 195banderas.com | $11.25 | |
| elretodelasbanderas.com | $11.25 | |

### Ocupados

`banderin.com`, `banderin.app`, `banderitas.com`, `banderines.com`,
`banderola.com`, `banderazo.com`, `ondea.com`, `ondea.app`,
`ondear.com`, `ondeo.com`, `debandera.com`, `atodotrapo.com`,
`mastil.com`, `pabellon.com`, `vexi.app`, `vexia.com`, `vexilo.com`,
`adivinalabandera.com`.

## 8. Recomendación

### Nombre: **QuéBandera**

Escrito así en el logotipo, con los signos de interrogación cuando el
espacio lo permite: **¿Qué bandera?**

Por qué este y no otro:

- **Ya es la voz del juego.** "¿Qué bandera es?" es literalmente la
  etiqueta del modo principal en `i18n.js`. No se está inventando una
  marca desde fuera: se está ascendiendo a nombre la frase que el
  producto ya dice. Eso hace que la copy encaje sola.
- **Es una pregunta**, y una pregunta invita a responder. En una
  categoría llena de sustantivos inventados terminados en `-dle`, un
  interrogante en español destaca por contraste, no por volumen.
- **Es español de verdad y funciona en toda América.** Sin modismo
  local, sin `ñ`, sin acento en el dominio, sin palabra culta. Se dicta
  por teléfono a la primera. Cumple el activo #3 y no estorba a
  ninguno de los otros cuatro.
- **Está limpio.** Ninguna colisión encontrada con juegos, apps ni
  productos físicos. Registrable como marca, a diferencia de
  "banderas.fun", y propio, a diferencia del nombre actual.
- **El `.com` está libre a precio normal**, junto con `.app` y `.es`.

Lo que hay que aceptar del nombre, dicho claro: pegado y sin acento
("quebandera") pierde algo de la fuerza que tiene hablado, y no comunica
por sí solo el ángulo familiar, que es el activo #1. Lo segundo lo
resuelve el descriptivo (abajo); lo primero se resuelve en el logotipo,
poniendo los signos de interrogación.

### Compra sugerida

| | | |
|---|---|---|
| **quebandera.com** | $11.25 | Principal |
| **quebandera.app** | $9.99 | Donde vive el juego, si se quiere separar web y app |
| quebandera.es | ~10 € | Confianza local en España, vía registrador español |
| quebanderaes.com | $11.25 | Defensivo: quien escuche "qué bandera es" escribirá esto |

Unos 45 $ el primer año por cerrar el nombre entero. Si hay que recortar,
`quebandera.com` solo es suficiente.

### Alternativas, si QuéBandera no convence

- **Enarbola** (`enarbola.com`, $11.25) — si se prefiere una marca
  evocadora y elegante antes que descriptiva. Más bonita, más
  registrable, y con más riesgo de que haya que explicarla.
- **banderas.fun** ($1.99) — si el objetivo es tener algo hoy y no
  construir marca. Es el posicionamiento del nombre actual sin el
  problema legal, pero es indefendible: cualquiera puede lanzar
  `banderas.app` mañana y no hay nada que hacer.

## 9. Copy que cambia con el nombre

Cuando se tome la decisión, esto es lo que hay que tocar. **Todo el
texto vive en `js/i18n.js`**, no en el HTML ni en `game.js` (ver el
README, sección "Internacionalización"), así que el cambio es un
diccionario y nada más.

### Claves de `js/i18n.js`

```js
"app.title":        "QuéBandera",
"start.eyebrow":    "El juego de banderas para toda la casa",
"start.titleHtml":  "¿Qué<br>bandera?",
```

`modes.classic.label` (hoy "¿Qué bandera es?") **debe cambiar** para no
repetir el nombre del juego dentro del propio juego. Propuesta:

```js
"modes.classic.label":   "Adivina el país",
"modes.classic.tagline": "Ves una bandera y dices cuál es",
```

### Descriptivo de una línea

El nombre no comunica el ángulo familiar; el descriptivo sí. Usar
siempre debajo del logotipo, en la tienda y en el `<meta>`:

> **QuéBandera** — El juego de banderas para toda la casa.

### Meta descripción (para `index.html`)

> Adivina las banderas de los 195 países del mundo, en español y en
> familia. Un reto nuevo cada día, cuatro niveles desde los 5 años, y
> ni cuentas ni anuncios. Gratis y sin instalar nada.

Ordena a propósito los cinco activos: adivinar (qué es) → español y
familia (#3 y #1) → reto diario (retención) → niveles (#2) → limpio
(#5).

### Frases de apoyo, por si hacen falta

- Para la escala de edad (#2): *"Del Nivel Nene al Nivel Dios. Nadie se
  aburre y nadie se rinde."*
- Para el reto diario: *"Las mismas doce banderas para todo el mundo,
  cada día."*
- Para lo limpio (#5): *"Sin cuentas, sin anuncios y sin que los nombres
  salgan de tu móvil."*
- Para lo educativo (#4): *"Al final de cada ronda te quedas con la
  capital. Aunque no quieras."*

### Lo que NO hay que tocar

El tono del juego dentro de partida está bien y no depende del nombre:
"¡Muy bien!", "Casi… prueba otra 🤔", "Nivel Nene", "Nivel Dios". Ese
registro cálido y sin condescendencia es parte del activo #1 y del #2.
Un cambio de nombre no es excusa para reescribirlo.

## 10. Método y límites

Los datos de disponibilidad son consultas reales al buscador de dominios
de Vercel hechas en julio de 2026; los precios son de alta del primer
año y **cambian**, sobre todo en las renovaciones de `.fun`, `.io` y
`.game`. Comprobar antes de comprar.

La parte de marcas es investigación web, **no un informe de un agente de
la propiedad industrial**. Antes de registrar "QuéBandera" como marca
conviene una búsqueda en la OEPM y en EUIPO, que es barata y es la
única que vale. Para lanzar un juego gratuito basta con haber salido de
la propiedad de Warner, que es lo que hace este cambio.
