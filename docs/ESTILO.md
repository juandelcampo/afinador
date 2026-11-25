# Guía de estilo para herramientas nuevas

Todas las herramientas tienen que hablar el mismo idioma: quien aprende a usar una ya sabe usar las demás. Esta guía dice qué piezas usar, cómo se ordenan y qué no hacer. Ante la duda, copiá cómo lo resuelve **¿Qué acorde?** (`src/features/acorde/`), que es la herramienta más chica y la que sigue todo esto.

## 1. Antes de escribir código

Una herramienta nueva tiene que cumplir el criterio del proyecto (ver CLAUDE.md):

- **Se usa sola.** No depende de lo que hiciste en otra herramienta. Lo que pasa de una a otra viaja por la URL.
- **Sirve en treinta segundos.** Al entrar ya hay algo para tocar y escuchar, sin configurar nada.
- **Primero suena, después se explica.** La explicación va debajo de lo que suena, chica y en gris.
- **En el celular no hay textos de explicación.** Debajo de 960 px el `PageTitle` pierde el copete y la descripción (y el título entero si lleva `toolName`, porque el botón Menú ya dice la herramienta), y los `ui.hint` no se ven. Un `ui.hint` que dice algo de lo que elegiste o de lo que suena (notas en común, el capo, el compás que viene) lleva `data-keep` y queda.
- **Para gente con oído y poca teoría.** Nada de pentagramas. Los nombres técnicos van acompañados de lo que se siente ("TRISTE", "en su casa").
- **Una por vez.** Se suma una herramienta nueva recién cuando la anterior está pulida.

Para darla de alta:

1. Agregar la ruta en `src/routes.ts`.
2. Agregarla en `TOOLS` de `src/shell/AppShell.tsx` (la barra) y de `src/features/inicio/InicioRoute.tsx` (la portada).
3. Agregar su spec en `e2e/` y su fila en el README.

## 2. El esqueleto

```tsx
import { Browse, Button, PageTitle, Setup, Slab, Toggle } from '~/shared/ui/ui';
import { TuneLink, TuningField } from '~/shared/TuningField';
import ui from '~/shared/ui/ui.module.css';
import styles from './nueva.module.css';

export default function NuevaRoute() {
  return (
    <div className={`${styles.page} ${ui.frame}`}>
      {/* 1. Qué es y qué se elige */}
      <Slab>
        <PageTitle eyebrow="Lo que hace, en pocas palabras" title="Nueva">
          <p>Cómo se usa, en una o dos oraciones. Se lee sin bajar.</p>
        </PageTitle>
        <Setup summary={`${tuning.name} · ${lo que se eligió}`}>
          <TuningField tuning={tuning} onChange={…} />
          <TuneLink tuning={tuning} />
        </Setup>
      </Slab>

      {/* 2. Lo que suena */}
      <Slab>
        {/* el diapasón, la figura, lo que sea */}
        <div className={ui.actions}>
          <Button variant="primary" on={playing} onClick={play}>
            {playing ? '■ Parar' : '▶ Escuchar'}
          </Button>
          {/* secundarios y elecciones */}
        </div>
        <p className={ui.hint}>La explicación, después.</p>
      </Slab>
    </div>
  );
}
```

- `ui.frame` hace que todas las herramientas tengan el mismo ancho y las mismas rayas a los costados. Va siempre.
- Cada bloque es un `Slab`. Si lleva título, usá `SlabHead`; lo que va a la derecha del título (botones chicos) va como hijo.
- `Setup` es la fila de lo que se elige arriba: la afinación primero (`TuningField`, que toma el lugar ancho) y el link para afinarla. En el celular (hasta 719 px) se pliega en un renglón que dice lo elegido (`summary`, por ejemplo "Estándar · Menor natural"), así lo principal de la herramienta queda arriba; tocarlo despliega los campos ahí mismo.
- `ui.actions` es la fila de escuchar: el botón principal primero, después los secundarios y al final las elecciones.

## 3. Color y estados

Hay un solo color de acento. Cada color dice siempre lo mismo:

| Color         | Token                          | Qué dice                                                          |
| ------------- | ------------------------------ | ----------------------------------------------------------------- |
| Gris          | `--soft`                       | El mouse está encima (hover).                                     |
| Tinta (negro) | `--ink` fondo, `--paper` letra | Lo elegido: la opción marcada, la pestaña abierta, algo prendido. |
| Naranja       | `--accent` / `--on-accent`     | Lo que suena, o la acción principal.                              |
| Gris medio    | `--muted`                      | Explicaciones y datos secundarios.                                |

- Usá siempre los tokens de `src/styles/global.css`, nunca un color escrito a mano: la app tiene modo oscuro y los tokens se dan vuelta solos.
- El diapasón y lo que va sobre él tienen sus propios tokens (`--neck`, `--neck-ink`, `--neck-line`, `--neck-muted`…).

## 4. Bordes, sombras y letra

- **Bordes:** 3 px de contorno (`var(--rule)`) y 2 px para dividir adentro de un recuadro. Esquinas siempre rectas.
- **Sombra:** solo en el botón principal (`--lift`) y en el modal o panel flotante. En nada más.
- **Letra:** tres voces.
  - `--heavy` (Archivo ancha y negra): títulos.
  - `--ui` (Archivo): botones y rótulos, en mayúsculas.
  - `--mono` (Plex Mono): datos (notas, trastes, números, intervalos) y el texto corrido.
- **Barra de scroll:** una sola para toda la app, definida en `global.css` (riel de papel con raya de 2 px y bloque de tinta, gris al pasar el mouse; ancho en `--scrollbar`). Cualquier `overflow: auto` la usa solo: no la estilices en la herramienta ni la escondas.
- **Foco del teclado:** va adentro del recuadro (3 px del color de la letra, a 6 px del borde), definido en `global.css`. Nunca afuera: se monta sobre las rayas vecinas o lo recorta el contenedor. La excepción son los círculos del diapasón, que llevan un anillo naranja alrededor.
- **Rótulos:** los rótulos chicos de los campos van a 12 px, en mayúsculas y con letra espaciada. No los armes a mano: usá `Field`.

## 5. Las piezas compartidas

Todo está en `src/shared/`. Antes de escribir CSS para un control, fijate si ya existe acá.

| Para…                                     | Usá                                          | Dónde              |
| ----------------------------------------- | -------------------------------------------- | ------------------ |
| Título de la herramienta                  | `PageTitle` (eyebrow, title, texto)          | `ui/ui.tsx`        |
| Un bloque de la página                    | `Slab`, `SlabHead`                           | `ui/ui.tsx`        |
| Un campo con su rótulo                    | `Field` (`as="div"` si adentro hay botones)  | `ui/ui.tsx`        |
| Lo que se elige arriba (plegado en celu)  | `Setup` (summary, y los campos adentro)      | `ui/ui.tsx`        |
| Elegir la afinación                       | `TuningField` + `TuneLink`                   | `TuningField.tsx`  |
| La acción principal                       | `Button variant="primary"`                   | `ui/ui.tsx`        |
| Una acción secundaria                     | `Button variant="ghost"`                     | `ui/ui.tsx`        |
| Un botón angosto (−1, ×2, un ícono)       | `Button variant="mini"`                      | `ui/ui.tsx`        |
| Algo que se prende y se apaga             | `Button` con `ariaPressed`                   | `ui/ui.tsx`        |
| Elegir entre dos                          | `Toggle`                                     | `ui/ui.tsx`        |
| Elegir entre tres a cinco                 | `Segmented` (`stretch` para llenar el ancho) | `ui/ui.tsx`        |
| Cambiar de vista dentro de la herramienta | `Tabs`                                       | `ui/ui.tsx`        |
| Subir y bajar un valor de a uno           | `Stepper`                                    | `ui/ui.tsx`        |
| Recorrer una lista de a uno (◀ ▶)         | `Browse`                                     | `ui/ui.tsx`        |
| Una columna plegada a un costado          | `Rail`                                       | `ui/ui.tsx`        |
| Un modal                                  | `Sheet`                                      | `ui/Sheet.tsx`     |
| Guardar con nombre y abrir lo guardado    | `Guardados`                                  | `Guardados.tsx`    |
| El diapasón                               | `Diapason`                                   | `Diapason.tsx`     |
| Rasgueo o arpegio de un acorde suelto     | `ShapeStyleToggle`                           | `ShapeStyle.tsx`   |
| Explicación chica en gris                 | `className={ui.hint}`                        | `ui/ui.module.css` |
| Link a otra herramienta ("… →")           | `className={ui.bridge}` en un `Link`         | `ui/ui.module.css` |

Si una herramienta necesita algo que no está en la tabla y le puede servir a otra, se hace en `src/shared/` desde el principio. El CSS propio de una herramienta es para lo que es solo suyo (la figura de Ritmo, el círculo de quintas), no para botones ni campos.

## 6. Cómo elegir el control

- **Dos opciones** (letras o solfeo, rasgueo o arpegio): un solo `Toggle`, que muestra la elegida y al tocarlo pasa a la otra. Nunca dos botones pegados.
- **Algo que se prende y se apaga** (Repetir, el drone): un `Button` con `ariaPressed`, nunca una casilla de verificación. Si lo prendido suena, pasale también `on` y va en naranja.
- **Una acción que todos reconocen por su dibujo** (deshacer, rehacer, repetir, volver a lo de siempre): un cuadrado, `Button variant="mini"` con solo el `Icon` adentro, `ariaLabel` con el nombre y `title` con lo que hace (y el atajo, si tiene). Si la palabra es lo que explica qué pasa (Inventar, Pasar a la batería, Soltar), va la palabra.
- **De tres a cinco opciones cortas:** `Segmented`.
- **Muchas opciones cortas** (presets, compases): botones `mini` con `ariaPressed` dentro de un grupo con `role="group"` y `aria-label`, como hacen los `Chips` de Ritmo.
- **Una lista larga** (afinaciones, escalas): un `<select>` dentro de un `Field`.
- **Un número:** un `Stepper` si se mueve de a uno, o un `input type="range"` dentro de un `Field` si se recorre un rango (tempo).

## 7. Escuchar

- **Un solo botón principal por panel**, y es el que hace sonar: `▶ Escuchar` (o `▶ Tocar`). Mientras suena dice `■ Parar` y lleva `on`.
- Todos los botones de una fila miden lo mismo. El principal se distingue por el naranja y la sombra, no por el tamaño.
- **El volumen no va en las herramientas.** Hay uno solo, en la barra de arriba (`Fader`, montado en `AppShell`). Nunca pongas otro.
- Lo que se toca en el diapasón suena al tocarlo, sin pasar por Escuchar.

## 8. Espacio

- Primero en el celular (390 px), después en pantalla ancha. A ningún ancho tiene que aparecer barra horizontal.
- **En el celular la barra de arriba es una sola fila:** la marca y el botón Menú, que dice en qué herramienta estás y abre las herramientas y los ajustes. Cerrada mide `--bar`; una herramienta puede contar con eso para llenar el alto (como el Afinador, que en el celular ocupa toda la pantalla con lo que se usa: la afinación elegida es un renglón chico arriba).
- **En escritorio no se scrollea.** Desde una ventana de 1280 × 800, la herramienta entra entera, en cada una de sus pestañas. Para que entre: columnas en lo ancho, rótulos al costado, figuras que se achican con el alto de la ventana (`100dvh`) y lo secundario plegado. En el celular sí se baja.
- **La disposición no salta.** Al pasar de una pestaña a otra de la misma herramienta, lo que tienen en común queda en el mismo lugar y con la misma forma; lo que cambia va al final.
- Todo lo que se toca mide al menos 44 × 44 px (`--touch`).
- Lo esencial a la vista. Lo secundario va en un `<details>` cerrado o en un `Sheet`. **Un modal por vez:** nunca un modal encima de otro.
- Si la herramienta tiene columnas a los costados, en pantalla ancha arrancan plegadas (`Rail`), como en el Afinador y Armonía.

## 9. Estado y URL

- **Lo que define lo que se ve** (afinación, acorde, escala, forma) va en la URL, con `useSearchParams`. Así un link abre exactamente lo mismo, y las herramientas se pasan cosas con un link (`TuneLink`, "Sus acordes en Armonía →"). En la URL no van los valores por defecto: `?afinacion=` se omite si es la estándar.
- Hasta hidratar, la página no conoce la URL: usá `useHydrated()` y los valores por defecto, como hace ¿Qué acorde?.
- **Las preferencias** (`src/shared/settings.ts`, guardadas en `localStorage` bajo `afinador`) son solo para lo que vale en varias herramientas o se elige una vez: notación, La de referencia, volumen, rasgueo o arpegio. Todo lo que se agregue ahí pasa por `sanitize`.
- **Donde la dejaste** (`src/shared/memoria.ts`): cada herramienta anota su última URL. La barra y la portada llevan ahí, y abrir una herramienta sin nada después del `?` la restaura antes de hidratar (en el Afinador, `/afinador` vuelve a la última afinación). No es estado compartido: cada una se acuerda solo de lo suyo, y un link con algo en la URL manda. Para que ande, la herramienta tiene que poder abrirse con cualquier URL en cualquier momento, también estando ya adentro (Ritmo carga lo que llega por la URL aunque no lo haya escrito él).
- **Lo guardado con nombre** (`Guardados`, en `src/shared/Guardados.tsx`): un botón "Mis …" que abre un modal para guardar lo de ahora y abrir lo guardado. Cada cosa guardada es el link, así que abrirla es lo mismo que abrir un link compartido. Hasta diez por herramienta, para que el modal entre sin bajar. Va en la fila de arriba (`ui.setup`) o, si no hay, junto al título; nunca suma una fila.
- Ningún estado compartido entre herramientas fuera de estas vías.

## 10. Textos

- En español rioplatense, de vos: "Tocá", "Elegí", "Poné". También los comentarios del código y los nombres de los tests.
- Rótulos cortos y en mayúsculas (los pone el CSS): AFINACIÓN, CAPO, VELOCIDAD.
- Los botones dicen lo que hacen: "Todas al aire", "Armar la mía". No uses "OK" ni "Aceptar".
- Cada botón que es solo un ícono o una flecha lleva `ariaLabel` con la frase completa ("Posición siguiente, más arriba en el mástil").

## 11. Lo que no

- No hagas CSS propio para botones, rótulos o campos: usá las piezas de `src/shared/ui/`.
- No uses colores fuera de los tokens, esquinas redondeadas ni sombras fuera del botón principal y el modal.
- No pongas un segundo volumen, ni dos botones principales en un mismo panel.
- No apiles modales.
- No pongas botones de tamaños distintos en una misma fila.

## 12. Antes de dar por terminado

1. `npm run check`. Si hay otras sesiones en paralelo, los e2e van en otros puertos (`E2E_PORT=… E2E_DEV_PORT=…`).
2. Capturas en celular (390 px) y en escritorio (1280 px y 1680 px, donde cambia la barra de arriba). En escritorio, a 1280 × 800, ninguna pestaña scrollea.
3. Un inventario rápido: `grep` del CSS de la herramienta buscando `button`, `font:` y colores escritos a mano. Lo que aparezca es candidato a pieza compartida.

## Pendientes conocidos (2026-11-22)

Cosas que todavía no siguen esta guía. Si tocás alguna, de paso arreglala:

- **Armonía** todavía muestra su propio volumen (dos veces), y la figura Cuadrado o Triángulo debería ser un `Toggle`.
- **El tempo** se elige con tres controles distintos (Afinador, Armonía y Ritmo). Falta una pieza compartida.
- **Escuchar / Parar** se arma a mano en cada herramienta. Falta una pieza compartida.
- **Los colapsables** (`<details>`) tienen estilo propio en Armonía. Falta una pieza compartida.
- **Los `Chips`** de Ritmo deberían pasar a `src/shared/ui/`.
- Quedan unos 30 botones con CSS propio, sobre todo en el Afinador y Armonía.
