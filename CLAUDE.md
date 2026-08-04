# Instrucciones del proyecto

Este archivo se carga solo al empezar cada sesión. Es el arranque: dice qué
es esto, qué no se toca y qué hay que leer antes de trabajar.

## Qué es

Un juego de geografía en el que se recupera, país a país, un mundo al que
le han borrado los nombres y las banderas. Web (Vercel) y apps de App Store
y Google Play con el mismo código. Seis idiomas. 195 países.

**Público: de 15 años en adelante. No es un juego infantil.**

## Lee esto antes de trabajar

**`docs/EL-JUEGO.md` es el documento base del proyecto.** Léelo antes de
proponer, diseñar o construir cualquier cosa que no sea un arreglo puntual
de código. Marca cada pieza con su estado: ✅ existe hoy · 🟡 diseñado sin
construir · ⬜ sin decidir. **No confundas lo diseñado con lo que hay.**

Después, según la tarea:

| Si vas a tocar… | Lee primero |
|---|---|
| Diseño de juego, mecánicas, retención | `docs/mecanicas-juego.md`, `docs/mecanicas-enganche.md` |
| La campaña, ligas, economía | `docs/modo-campana.md` |
| Historia, textos, arte, producción | `docs/historia-conde.md` |
| Cuentas, servidor, sincronización | `docs/ideas-app.md` |
| Compilar las apps | `docs/apps-moviles.md` |
| Idiomas | `docs/idiomas.md` |
| Código que ya existe | `README.md` (referencia técnica, archivo por archivo) |

`docs/publico-objetivo.md` manda sobre los documentos de propuesta:
varios se escribieron cuando el público eran niños. Si hay contradicción,
gana `docs/EL-JUEGO.md`.

## Cómo se escribe aquí

- **Todo en español**: comentarios de código, documentación y mensajes de
  commit.
- **Los comentarios explican por qué, no qué.** El código del proyecto
  cuenta las decisiones y las trampas, no repite lo que ya se lee.
- **Mensajes de commit largos y explicativos**, contando el motivo del
  cambio y lo que se descartó. Mira `git log` antes de escribir el primero.

## Reglas del código

- **Sitio estático puro**: HTML, CSS y módulos ES nativos. Sin build, sin
  framework, sin dependencias en tiempo de ejecución. `package.json` existe
  solo para empaquetar las apps y para los scripts de `tools/`.
- **Nada de `style="..."` en `index.html`.** Toda variante nueva se añade a
  `style.css` como clase.
- **`opacity` nunca para atenuar texto**: usar `--ink-muted`, que tiene un
  contraste conocido.
- **Todo tamaño de texto y zona de toque se multiplica por `--scale`**, que
  es lo que hace funcionar el ajuste de texto grande.
- **Contrastes medidos**: cada pantalla nueva entra con `aria-live`, lector
  de pantalla y texto XL funcionando. No por debajo de ese listón.
- **Los toques se escuchan con `click`, nunca con `touchend`** (`onTap()`
  en `js/dom.js`, con antirrebote de 500 ms sobre el mismo elemento).
- **Cada cadena nueva son seis idiomas.** Ejecuta `node tools/check-i18n.mjs`
  antes de dar nada por bueno.
- **Si añades un archivo a la raíz**, añádelo también a la lista de
  `tools/build-www.mjs` o no llegará a las apps.

## Reglas de producto que no se rompen

1. Se abre y se juega en **dos toques**. Nunca un formulario, un login ni
   un tutorial obligatorio antes de la primera bandera.
2. **El reto diario es sagrado**: uno al día, el mismo para todos, sin
   economía de juego, sin acelerarlo con dinero, sin repetirlo.
3. **El dinero no toca donde la gente se compara**: ni ligas ni reto diario.
4. **La racha se rompe al no jugar, jamás al fallar.**
5. **Nunca rivales inventados** para llenar un ranking.
6. Nada de vidas, energía ni cajas sorpresa de pago.
7. Ni contadores de urgencia, ni culpa, ni premios que caducan de noche.
8. **El catálogo de 195 países no se amplía** (criterio en
   `docs/decisiones-producto.md`). Las banderas que no son de países viven
   en la vitrina, aparte, y nunca entran en el reto diario.
9. **Cada pieza tiene que funcionar también en el navegador.** Un juego con
   dos formas de abrirlo, no dos productos.
10. La recompensa se anima; el castigo, no.

## Comandos

```bash
npm run start        # servir la web en local (python3 -m http.server 8000)
npm run check        # comprobar que los seis idiomas están completos
npm run app:www      # preparar www/ (lo que empaquetan las apps)
npm run app:android  # sincronizar y abrir Android Studio
npm run app:ios      # sincronizar y abrir Xcode (solo en un Mac)
npm run app:icons    # regenerar iconos y splash desde los SVG
```

No hay tests automatizados. Lo que se hace para verificar un cambio está
en el README, sección "Cómo probar cambios": servir el sitio y jugarlo de
verdad en Chromium headless, con al menos dos idiomas si se tocan textos.

## Cosas que se olvidan y cuestan tiempo

- La **fecha del reto diario es UTC**, no local, y es una decisión tomada a
  propósito para que todo el mundo juegue la misma bandera.
- La clave `anon` de Supabase **está en el repositorio a propósito**: es
  pública por diseño y lo que protege los datos son las políticas RLS.
- **Hoy la bandera de mañana se puede leer en el código.** Da igual mientras
  no haya ligas; en cuanto las haya, hay que servir el reto desde el
  servidor.
- El nombre "Diversión con Banderas" es el del programa de *The Big Bang
  Theory*: **riesgo de marca si se publica así en las tiendas** (ver
  `docs/EL-JUEGO.md` §14).
