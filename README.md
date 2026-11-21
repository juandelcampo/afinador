# Afinador

Herramientas para componer con guitarra, pensadas para quien toca de oído y quiere salir de lo de siempre. La portada (`/`) muestra las herramientas para elegir; cada una se usa sola, y la barra de arriba pasa de una a otra (la marca vuelve a la portada).

- **Afinador**: 147 afinaciones, afinador por micrófono, escuchador interactivo sobre un mástil y acordes que se pueden hacer con la mano en cada afinación.
- **Armonía** (`/armonia`): acordes por emoción para armar una vuelta con las figuras de tu afinación.
- **Inversiones** (`/inversiones`): todas las maneras de hacer un acorde en el mástil, agrupadas por la nota que va en el bajo.

Salió de [Scordatura](../Afinador%20Drake), donde era una de las herramientas. Acá vive solo.

| Parte         | Qué hace                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Lista         | Las 147 afinaciones en secciones que arrancan cerradas, con búsqueda por nombre, notas, artista o canción.   |
| Ficha         | Acorde al aire, intervalos entre cuerdas, cuántas cuerdas cambian y aviso si alguna queda muy tensa o floja. |
| Afinar        | Micrófono, cuerda por cuerda o automático, con aguja en cents. Tocar una cuerda la hace sonar.               |
| Escuchar      | Mástil interactivo: trastes, capo, rasgueo a mano, arpegios y rasgueos con patrón y tempo.                   |
| Acordes       | Figuras de acordes comunes que se pueden hacer con la mano, con hasta cuatro dedos o cejilla.                |
| Se escuchó en | Temas con esa afinación, capo para tocarlos y video de YouTube que se carga recién al abrirlo.               |

### Armonía

Sale de Mauro De María, _Composición integral_ (capítulos 1 a 8), sin pentagramas ni escritura a cuatro voces. Las vueltas para arrancar, cómo transformarlas, los cambios de dos en dos, lo de cantar encima y el bajo que baja salen de Rikky Rooksby, _How to Write Songs on Guitar_.

| Parte         | Qué hace                                                                                                                                                                                                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mundo         | Mayor, las tres menores (natural, armónica, bachiana) y los modos, con su carácter. En los modos, los grados característicos y el disminuido que tira hacia otra tónica.                                                                                                                                                          |
| Acordes       | Cada grado con su emoción (ALEGRE ++, TRISTE −−, RARO) y su figura en la afinación elegida. Tocar lo hace sonar; el + lo suma a la vuelta.                                                                                                                                                                                        |
| Para arrancar | Vueltas de cuatro acordes en grados, agrupadas por lo que dan, con temas de ejemplo. Se escuchan y se cargan en tu tónica; si son de la otra familia, el mundo pasa a mayor o menor natural.                                                                                                                                      |
| Más color     | Lo prestado de otras escalas, dominantes secundarias, ♭II napolitano y los cinco enlaces de cine desde el último acorde, y qué da cada cambio de dos acordes desde el elegido.                                                                                                                                                    |
| Tu vuelta     | Séptimas, novenas y otros colores con su emoción, qué va en el bajo, notas comunes, cuerdas al aire que pueden sonar de pedal, cambiar un acorde por su relativo o al revés, qué notas se apoyan, tensan o chocan al cantar encima, desplazar o estirar la vuelta, el bajo que baja con inversiones y las ocho cadencias finales. |
| Sin centro    | Los puntos cardinales: grupos de acordes sin tónica, con el paso de grupo por el mismo polo.                                                                                                                                                                                                                                      |

La afinación, la tónica, la escala y la vuelta viven en la URL (`/armonia?afinacion=dadgad&v=D_G_A7`): se comparten con un link. El Afinador lleva a Armonía con su afinación desde Acordes.

### Inversiones

Elegís la nota y el tipo de acorde (mayor, menor, séptimas, disminuidos, aumentado, sus, sextas y add9) y aparece un bloque por cada nota que puede ir en el bajo: fundamental, 1.ª, 2.ª y 3.ª inversión, con lo que da cada una (lo de la raíz, la tercera y la quinta es de De María, como en Armonía). Cada figura va dibujada como en los cancioneros, con qué nota del acorde es cada dedo y la del bajo en naranja, y suena al tocarla.

| Parte  | Qué hace                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------- |
| Justas | Cada nota del acorde una sola vez, en cuerdas vecinas: la inversión tal cual. Van de la cejuela hacia arriba.       |
| Llenas | Con más cuerdas y notas dobladas, de la más fácil a la más difícil. Se ven las seis primeras; el resto, al pedirlo. |

Las figuras salen de recorrer el mástil hasta el traste 12 (`core/inversions.ts`): las cuerdas que suenan van de corrido, todas son notas del acorde, hasta cuatro dedos con la cejilla contando como uno y cuatro trastes de abertura. En los acordes de cuatro notas puede faltar la quinta. Una llena que es otra llena con alguna cuerda menos no se muestra. En afinaciones de solo cuartas y quintas, algunos acordes (el aumentado, el dim7) no entran en la mano, y la pantalla lo dice.

El acorde y la afinación van en la URL (`/inversiones?afinacion=dadgad&acorde=Gmaj7`). Armonía lleva acá desde el acorde elegido de la vuelta.

La barra de arriba tiene los nombres de las notas (E A D o Mi La Re) y la referencia del La. El volumen está en Escuchar, que es lo único que suena.

## Comandos

```sh
./iniciar.sh            # instala si hace falta, levanta la app y abre el navegador
npm run dev             # servidor de desarrollo
npm run build           # genera el sitio estático en build/client
npm run preview         # sirve ese build en http://localhost:4273
npm run check           # tipos, lint, tests, build y pruebas de navegador, en build y en desarrollo
npm run e2e:dev         # pruebas contra el servidor de desarrollo, donde React ejecuta los efectos dos veces
npm run check:videos    # comprueba que los videos del catálogo sigan disponibles (necesita conexión)
```

Los puertos de prueba (4273 para el build, 5373 para desarrollo) son distintos de los de Scordatura, así los dos proyectos pueden correr pruebas a la vez. `E2E_PORT=…` elige otro.

Las pruebas de navegador usan el Chrome instalado en el sistema y simulan el micrófono con audios generados en `e2e/fixtures/setup.ts`.

El micrófono solo funciona en `localhost` o por `https`, así que para usarlo desde el celular hay que publicar la app.

## Arquitectura

```text
src/
  core/        notas, detección de altura (pitch.ts), síntesis de cuerda (pluck.ts), afinaciones y figuras (tuning.ts), armonía (harmony.ts), lo de Rooksby (progressions.ts) y las figuras de cada inversión (inversions.ts). TypeScript puro.
  data/        el catálogo de afinaciones (tunings.ts) y las vueltas para arrancar (vueltas.ts). Solo datos.
  audio/       AudioContext y mezcla, instrumento (muestras de guitarra en samples.ts) y micrófono. Sin React.
  shared/      preferencias, el hook del afinador (useTuner.ts) y componentes de interfaz.
  shell/       la barra de arriba, con las herramientas.
  features/    una carpeta por pantalla: inicio/ (la portada), afinador/, armonia/ e inversiones/.
tests/         lógica y validación del catálogo (Vitest)
e2e/           pruebas en Chrome real, con micrófono simulado (Playwright)
```

### Reglas

ESLint hace cumplir las tres primeras.

1. **`core` y `data` no conocen React, el audio ni la interfaz.**
2. **`audio` no depende de React.** La interfaz observa al audio, no al revés.
3. **Las herramientas no se importan entre sí.** Cada una se usa sola y se conectan por la URL. Una herramienta nueva va en `FEATURES` de `eslint.config.js`, en `routes.ts`, en el prerender de `react-router.config.ts`, en `TOOLS` de `shell/AppShell.tsx` y en la portada (`features/inicio/InicioRoute.tsx`).
4. **Dónde va el estado:** la URL dice qué afinación está abierta y guarda la vuelta de Armonía; Zustand guarda las preferencias en `localStorage` (`shared/settings.ts`), y se validan al leerlas.
5. **Las páginas estáticas no conocen la URL.** Un componente que lee parámetros durante el render usa `useHydrated`.
6. **El catálogo se valida con esquemas** en `tests/afinador.test.ts`.

### Rutas

`/` es la portada, `/afinador` abre la afinación estándar y `/armonia` la armonía, `/inversiones` las inversiones. Cada afinación tiene su página en `/afinador/<id>`, generada como HTML estático para los buscadores. Se mantuvieron las URL de Scordatura para que sus links sigan abriendo.

### Agregar una afinación

Una entrada en `data/tunings.ts`. El acorde al aire, los intervalos, los avisos y su página estática se generan solos.

## Sobre los datos

Muchas afinaciones por canción se transcribieron de oído. Cada tema marca su confiabilidad con `conf`, y `octaves: 'est'` indica que la fuente no daba octavas y son estimadas.

Las fuentes principales:

- [Harlan L. Thompson: “Best guesses on Nick Drake tunings”](https://guitartabs.cc/tabs/d/drake_nick/tunings_tab.html)
- [Art Lee: “Unofficial Sonic Youth Guitar Tunings List” (1993)](https://www.guitartabs.cc/tabs/s/sonic_youth/guitar_tunings_tab.html)
- [Stringjoy: The Alternate Tunings of Sonic Youth](https://stringjoy.com/sonic-youth-alternate-tunings)
- [Premier Guitar: The Narrow-Range Tuning Trick](https://www.premierguitar.com/diy/joe-gores-recording-guitarist/sonic-youth-tunings)
- [Far Out: What guitar tuning did Nick Drake use?](https://faroutmagazine.co.uk/what-guitar-tuning-did-nick-drake-use/)
- [Wikipedia: Ostrich guitar](https://en.wikipedia.org/wiki/Ostrich_guitar)
- [Wikipedia: Open C tuning](https://en.wikipedia.org/wiki/Open_C_tuning)

La guitarra que suena es una acústica grabada nota por nota por los [University of Iowa Electronic Music Studios](https://theremin.music.uiowa.edu/MIS.html), tomada de [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) y recortada en `public/sonidos/guitarra/`. Cada muestra se midió con el detector del afinador y se corrige al tocarla. Con `?guitarra=sintetica` en la dirección suena la cuerda sintetizada de antes, que también suena mientras una muestra no terminó de bajar.
