# Afinador

Herramientas para componer con guitarra, pensadas para quien toca de oído y quiere salir de lo de siempre. La portada (`/`) muestra las herramientas para elegir; cada una se usa sola, y la barra de arriba pasa de una a otra (la marca vuelve a la portada).

- **Afinador**: 147 afinaciones, afinador por micrófono, escuchador interactivo sobre un mástil y acordes que se pueden hacer con la mano en cada afinación.
- **Armonía** (`/armonia`): acordes por emoción para armar una vuelta con las figuras de tu afinación.
- **Escalas** (`/escalas`): dónde cae cada nota de una escala en tu afinación, posición por posición, con un drone para tocar encima.
- **Inversiones** (`/inversiones`): todas las maneras de hacer un acorde en el mástil, agrupadas por la nota que va en el bajo.
- **¿Qué acorde?** (`/acorde`): ponés los dedos en el diapasón y te dice qué acorde suena.
- **¿Qué tonalidad?** (`/tonalidad`): escribís los acordes o la melodía de un tema y te dice en qué tonalidad está; después lo llevás a otra.
- **Ritmo** (`/ritmo`): metrónomo para compases raros, ritmos euclidianos dibujados como figuras, polirritmias y una caja de ritmos.

Cada herramienta se acuerda de dónde la dejaste: volver desde la barra o la portada, o abrirla de nuevo, trae la afinación, la escala, la forma o el ritmo que tenías (un link con algo en la URL manda). En Armonía, ¿Qué acorde? y Ritmo, "Mis vueltas", "Mis formas" y "Mis ritmos" guardan lo de ahora con un nombre, hasta diez en cada una. Todo queda en este navegador (`localStorage`, clave `afinador`); para llevarlo a otro lado, se comparte el link.

Salió de [Scordatura](../Afinador%20Drake), donde era una de las herramientas. Acá vive solo.

En el celular es una tarea por pantalla, con cuatro pestañas abajo (Afinar, Acordes, Figuras, Temas) y la lista se abre desde la ficha. Desde 900 px son tres columnas: la lista a la izquierda y los temas a la derecha, las dos plegadas al entrar, y en el centro la ficha con Afinar o Acordes; Acordes entra sin scrollear.

| Parte   | Qué hace                                                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Lista   | Las 147 afinaciones en secciones que arrancan cerradas, con búsqueda por nombre, notas, artista o canción. Elegir una la hace sonar.           |
| Ficha   | Acorde al aire, intervalos entre cuerdas, cuántas cuerdas cambian y aviso si alguna queda muy tensa o floja.                                   |
| Afinar  | Micrófono, cuerda por cuerda o automático, con aguja en cents. Tocar una cuerda la hace sonar.                                                 |
| Acordes | Los acordes que entran en la mano y el mástil interactivo: trastes, capo, rasgueo a mano, arpegios y rasgueos con patrón y tempo.              |
| Figuras | Las figuras dibujadas como en un cancionero, con filtro por mayores, menores y otros (en pantallas anchas los acordes están todos en Acordes). |
| Temas   | Dónde se escuchó, con capo para tocarlos y video de YouTube que se carga recién al abrirlo, y las afinaciones a una cuerda de distancia.       |

### Armonía

Sale de Mauro De María, _Composición integral_ (capítulos 1 a 8), sin pentagramas ni escritura a cuatro voces. Las vueltas de cuatro acordes para arrancar, cómo transformarlas, los cambios de dos en dos y lo de cantar encima salen de Rikky Rooksby, _How to Write Songs on Guitar_.

En el celular va todo en una columna. Desde 860 px son tres: más acordes a la izquierda y tu vuelta a la derecha, las dos plegadas al entrar, y el mundo ocupando todo el medio; si no entran las tres abiertas, abrir un costado pliega el otro.

| Parte              | Qué hace                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mundo              | En tres familias: las tonales (mayor y las tres menores: natural, armónica, bachiana), los modos (con el Simpson, lidio y mixolidio a la vez) y las exóticas (mayor armónica, frigio dominante, árabe y húngara), cada una con su carácter. En los modos y las exóticas, los grados característicos; en los modos, el disminuido que tira hacia otra tónica.                                                                                                                                                                                                                                  |
| Círculo de quintas | En pantalla ancha, la rueda sola a la derecha del mundo y del tamaño que entre sin bajar (en el celular, desplegable debajo de los acordes): los doce mayores afuera y sus relativos adentro, cada uno escrito en su tono. El color es el círculo cromático puesto sobre el de quintas: la tónica naranja y cada quinta 30° más, así que los vecinos tienen colores vecinos y el tritono cae en el complementario; lo del mundo va más fuerte. Los números marcan la vuelta. Tocar una casilla suena, el + del medio la suma, dice cuántas notas tiene de afuera y lleva el mundo a ese tono. |
| Acordes            | Cada grado con su emoción (ALEGRE ++, TRISTE −−, RARO) y su figura en la afinación elegida. Tocar lo hace sonar; el + lo suma a la vuelta.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Para arrancar      | Vueltas en grados, agrupadas por lo que dan, con temas de ejemplo: las de cuatro acordes de Rooksby, y además por el círculo de quintas (en mayor y en menor), con séptimas de jazz, largas (Pachelbel, blues de doce) y con una voz que baja. Se escuchan y se cargan en tu tónica; si son de la otra familia, el mundo pasa a mayor o menor natural.                                                                                                                                                                                                                                        |
| Más color          | Lo prestado de otras escalas, dominantes secundarias, ♭II napolitano y los cinco enlaces de cine desde el último acorde, y qué da cada cambio de dos acordes desde el elegido.                                                                                                                                                                                                                                                                                                                                                                                                                |
| Tu vuelta          | Séptimas, novenas y otros colores con su emoción, qué va en el bajo, notas comunes, cuerdas al aire que pueden sonar de pedal, cambiar un acorde por otro de su misma función (tónica, subdominante o dominante, con el sustituto tritonal sobre el V7), por su relativo o al revés, qué notas se apoyan, tensan o chocan al cantar encima, reordenar la vuelta arrastrando y las ocho cadencias finales.                                                                                                                                                                                     |
| Sin centro         | Los puntos cardinales: grupos de acordes sin tónica, con el paso de grupo por el mismo polo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

La afinación, la tónica, la escala y la vuelta viven en la URL (`/armonia?afinacion=dadgad&v=D_G_A7`): se comparten con un link.

La vuelta puede sonar con un **ritmo de fondo**: el campo Ritmo, al lado de la velocidad, abre los de siempre (4/4, 3/4, 6/8, 7/8 y unas baterías) y los que guardaste en Ritmo. Elegir uno lo hace sonar con la vuelta. Manda el ritmo: su tempo es el de la velocidad, y los pulsos son los de su compás (`pulseGrid` en `core/rhythm.ts`). En /4 cada negra es un pulso; en /8 cada grupo, así un 6/8 tiene dos y un 7/8 de 2+2+3, tres desparejos. La vuelta rasguea en cada pulso, cambia de acorde contándolos y arranca en el primer golpe del ritmo, con el mismo reloj (`audio/transport.ts`). El rótulo de los pulsos dice cuántos tiene el compás, para ver cuánto dura cada acorde. El ritmo va en la URL con lo mismo que lleva el link de Ritmo (`ritmo=m%3Dmeter%26bpm%3D96…`), así que se guarda en Mis vueltas y se comparte. La pieza para elegirlo es `shared/RitmoDeFondo.tsx`.

### Escalas

Armada como Inversiones y ¿Qué acorde?: el mismo encabezado y el diapasón en el mismo lugar. Arriba, la afinación y la escala, un desplegable con las familias como grupos, igual que el de la afinación. Sobre el diapasón, las doce tónicas y las notas de la escala con su grado (1, ♭3, ♯4); tocar una la hace sonar. Debajo, en una sola fila, las posiciones, Escuchar, el drone, grados o notas y el volumen; en pantalla ancha entra todo sin bajar. Al final, el carácter de la escala y "Comparar".

Pariente de Armonía: las mismas escalas, con el mismo carácter, y los mismos parámetros en la URL (`/escalas?afinacion=dadgad&tono=2&escala=mixolidio`), así un link abre la misma tonalidad en las dos; si Armonía la conoce, un link al lado de "Afinar en…" lleva a sus acordes. Además de las catorce de Armonía tiene pentatónicas y blues, más exóticas (napolitanas, rumana, persa, hindú, enigmática, japonesas), de jazz (bebop, alterada, lidio aumentado) y simétricas (tonos enteros, disminuidas, aumentada): 38 en seis familias.

Las marcadas con ★ son las que la separan de la mayor o de la menor natural, según su tercera; "Comparar" toca primero esa y después la elegida. En el diapasón van todas las notas de la escala: la tónica en naranja y las de color con aro blanco. Con ◀ ▶ se recorren las posiciones, una caja de cuatro trastes (cinco si la escala tiene siete notas o más) por cada nota de la escala en la cuerda más grave; lo de afuera se apaga. "Escuchar" la toca de tónica a tónica dentro de la caja, subiendo y bajando, y el diapasón va marcando cada nota. El drone deja sonando la tónica grave con su quinta (`audio/drone.ts`) hasta que se apaga o te vas de la página.

El fondo puede ser también **una vuelta**: el botón partido del drone toca lo que se elija en su modal (Drone o Una vuelta). La vuelta es la de Armonía, que la manda con "Tocar encima en Escalas" (`v=`, con su ritmo en `ritmo=` y `fondo=vuelta`); sin vuelta, arranca con una de las de siempre en la tónica, y el modal ofrece otras, la velocidad, el ritmo y cómo se toca. Mientras suena, en el diapasón y en la fila de notas se apagan un poco las que no son del acorde de ese momento: las que quedan fuertes son las que se apoyan. Escuchar la escala no corta la vuelta. La vuelta (leerla de la URL y lo que suena de cada acorde) está en `core/vuelta.ts`, y tocarla con su ritmo, en `shared/useAcompanamiento.ts`, que usan Armonía y Escalas.

Las escalas, los grados, el deletreo y las posiciones están en `core/scales.ts`.

### Inversiones

Elegís la nota y el tipo de acorde, en cuatro grupos: tríadas (mayor, menor, dim, aug, sus), con séptima, sextas y add9 (también 6/9), y extendidos (9, maj9, m9, 7♭9, 7♯9 y maj7♯11). Hay un botón por cada nota que puede ir en el bajo: fundamental, 1.ª, 2.ª, 3.ª y, en los extendidos, 4.ª inversión, con lo que da cada una (lo de la raíz, la tercera y la quinta es de De María, como en Armonía).

Todo pasa en un diapasón, como el del Afinador: tenues, las notas del acorde en todo el mástil; encima, la forma elegida, con qué nota del acorde es cada dedo (R, 3, ♭7) y la del bajo en naranja. Con ◀ ▶ se recorren las formas de esa inversión del aire hacia el cuerpo; cada cambio suena, y tocar un punto hace sonar esa nota sola. En el celular el diapasón se desplaza de costado hasta la forma. "Escuchar" toca una de cada una, y el diapasón las va siguiendo.

También se puede armar una forma propia: tocar una nota tenue pone un dedo ahí (y la hace sonar), tocar un dedo lo saca y tocar el nombre de una cuerda la deja al aire. La pantalla dice qué inversión quedó según la nota del bajo, qué nota del acorde falta, si la mano no llega y si esa forma ya está en la lista. La forma va en la URL (`forma=x-3-2-0-1-0`), así se comparte con un link.

Las figuras salen de recorrer el mástil hasta el traste 12 (`core/inversions.ts`): las cuerdas que suenan van de corrido, todas son notas del acorde, hasta cuatro dedos con la cejilla contando como uno y cuatro trastes de abertura. En los acordes de cuatro notas o más puede faltar la quinta. La ♯9 suena como la ♭3 y la ♯11 como la ♭5, pero en el 7♯9 y el maj7♯11 se nombran como color, igual que la 9. Entran las justas (cada nota una vez, en cuerdas vecinas) y las llenas (con notas dobladas); una llena que es otra con alguna cuerda menos no se muestra. En afinaciones de solo cuartas y quintas, algunos acordes (el aumentado, el dim7) no entran en la mano, y la pantalla lo dice.

El acorde, la afinación y la forma propia van en la URL (`/inversiones?afinacion=dadgad&acorde=Gmaj7`). Armonía lleva acá desde el acorde elegido de la vuelta, ¿Qué acorde? desde la forma que armaste y el Afinador desde Acordes ("Más acordes"), con la afinación y la figura que tengas puesta.

### ¿Qué acorde?

Para cuando ponés los dedos de oído, te gusta cómo suena y no sabés qué es. Arranca con todas las cuerdas al aire (en la estándar, un Em11). Tocar un casillero pone el dedo ahí y lo hace sonar; tocar el dedo lo saca y la cuerda vuelve al aire; tocar el nombre de la cuerda la apaga (×) o la vuelve a prender. Es el mismo diapasón de Inversiones, sin notas tenues: se puede tocar en cualquier lado.

Arriba del diapasón, el nombre grande (tocarlo hace sonar la forma, rasgueada o arpegiada), el tipo en palabras y la tab. Cada dedo pasa a decir qué es en el acorde (R, 3, ♭7, 9). Debajo: las notas que suenan de grave a agudo, qué va en el bajo (con lo de De María, como en Inversiones), qué falta si falta la quinta y otras maneras de leer las mismas notas (C6 también es Am7/C). Siempre le encuentra una lectura: si no calza justo con un acorde conocido, busca uno que esté entero y nombra lo que sobra como tensión, con lo que le hace al sonido (Am7(♯11): la ♯11 brilla y flota). Dos notas a una tercera o una sexta se leen como el acorde que insinúan (Mi y Sol, un Em); las que no, como lo que son (un tritono, un choque de semitono), y las notas pegadas que no se apilan en terceras, como un racimo.

El nombre sale de `core/identify.ts`: se prueba cada nota que suena como raíz contra los acordes de `CHORD_STEPS`, con la quinta (y en los de oncena, la novena) opcional; si ninguno calza, contra un acorde base con tensiones encima (♭9, 9, ♯9, 11, ♯11, ♭13, 13). Gana la lectura con la raíz en el bajo, después la que menos agrega u omite y después la más común. La afinación y la forma van en la URL (`/acorde?afinacion=dadgad&forma=0-0-0-2-0-0`); si el acorde es de los que abre Inversiones, un link lleva ahí con la misma forma.

### ¿Qué tonalidad?

Para cuando sacás un tema de oído y querés saber en qué tonalidad está, o llevarlo a otra para cantarlo cómodo. Se escriben los acordes como salgan (Am, lam, F#m7, Sol7, C/E, Bø; separados por espacios, comas o barras) o, con el botón Acordes ⇄ Melodía, las notas de una melodía (do re mi, E G A, con o sin octava). Lo que no se entiende queda dicho en un renglón chico y no rompe lo demás. Sin nada escrito, hay ejemplos para tocar.

Arriba sale la tonalidad grande (tocarla hace sonar la tónica), cuántos acordes o notas son de ahí y por qué: si arranca o termina en la tónica, si la dominante lleva a ella. Debajo, cada acorde con su grado; los de afuera, marcados. "También puede ser" ofrece las que cierran igual de bien (casi siempre la relativa), para elegirla a mano. Escuchar toca la vuelta y cada acorde se enciende en naranja cuando suena.

Transportar: las doce tónicas en el mismo modo; elegir una da los mismos acordes ahí, cuántos semitonos se movió y, si hace falta, con qué cejilla se tocan con las formas de siempre (Bb F Gm Eb: cejilla en el 3, G D Em C). Si sin cejilla ya hay tres de cada cuatro formas abiertas, no sugiere nada. Las dos filas llevan a Armonía con la tonalidad y la vuelta.

Sale de `core/tonalidad.ts`. Con acordes, se prueban las 24 tonalidades mayores y menores: cuenta cuántos acordes entran enteros en la escala (en menor también la dominante con la sensible, E7 en La menor) y suma por arrancar o terminar en la tónica y por la cadencia de la dominante. Con notas, compara cuánto suena cada nota con el perfil de las tonalidades (Krumhansl y Kessler), y la nota del final pesa más. Todo va en la URL (`/tonalidad?t=Am+F+C+G&a=2`; `modo=melodia` para las notas y `tono=9m` si se eligió otra a mano).

### Ritmo

Vino de Scordatura y se rehízo para que suene solo: arranca en 4/4 con ▶ Tocar grande, y al irse de la página para (no hay barra de abajo ni estado compartido con las otras herramientas). "Con una vuelta →", arriba, lleva este ritmo a Armonía como fondo de la vuelta que tenías (si no había ninguna, arranca con una de las de siempre). El tempo se cambia con el deslizador, con ÷2 / −1 / +1 / ×2, o marcándolo: se toca el botón Marcar con el mouse (o la T) y toma el promedio de los últimos ocho golpes; una pausa de dos segundos empieza de nuevo.

Hay cinco tipos de ritmo:

- **Compás**: agrupaciones como 2+2+3, con el primer golpe de cada grupo acentuado.
- **Batería**: la caja de ritmos.
- **Euclidiano**: k golpes repartidos parejo en n pulsos. Se dibuja como una rueda: cada golpe es un vértice y juntos forman una figura, con una aguja que gira mientras suena.
- **Polirritmia**: dos figuras en la misma rueda, la de más golpes afuera y la otra adentro, cada una con su instrumento.
- **Mutante**: compases que se turnan cada tantos compases.

Todo suena con la batería. Compás, Euclidiano y Mutante eligen un instrumento para el golpe y otro para el acento (aro y bombo de entrada); el uno suena con la toma fuerte. La batería (acústica, 808 o sintética) se elige igual en todos y sigue al pasar de uno a otro, y el golpe y el acento pasan entre los tres metrónomos. Cualquiera pasa a la batería para editarlo a mano (`rhythmToDrums`), con cada golpe en la fila de su instrumento: suena igual que antes de pasarlo.

La caja de ritmos tiene ocho sonidos (bombo, caja, aro, hi-hat, hi-hat abierto, palma, tom y una percusión que es pandereta en la acústica y cencerro en las otras) y tres baterías: la acústica y la 808, grabadas, y la sintética. Cada casilla puede estar vacía, tener un golpe o un golpe con acento: con el mouse, el clic izquierdo pone el golpe y lo pasa a acento y de vuelta, y el derecho borra; con el dedo, cada toque pasa al estado que sigue. Se pinta arrastrando. El hi-hat cerrado corta al abierto, como en una batería de verdad, y la acústica se toca un poco a mano: cada golpe cambia apenas de volumen, de afinación y de lugar, y alterna entre varias tomas. Hay ritmos de partida (rock, balada, funk, hip hop, shuffle, reggae, dembow, cumbia, bossa…), un patrón inventado (euclidiano por sonido, con el bombo en el uno), Borrar, Deshacer y Rehacer (también Ctrl+Z y Ctrl+Mayús+Z), pasos de a uno entre 2 y 32 y swing de 50 (parejo) a 75, que con pasos impares no va. Cada fila se escucha tocando su nombre, y tiene su volumen, mute y solo. En pantallas anchas entra entera sin bajar: con mouse, las casillas se achican con la altura de la ventana. En el celular los pasos se parten en filas de a 8, 7, 6 o 5, para que el compás se lea.

El motor (`core/rhythm.ts`) reduce todo a un ciclo de golpes entre 0 y 1; `audio/metronome.ts` los programa con anticipación desde un Worker (`ticker.ts`), `audio/kit.ts` toca la batería elegida y `audio/drums.ts` sintetiza la sintética, que también suena mientras las grabadas no terminaron de bajar. El ritmo entero va en la URL (`/ritmo?m=meter&bpm=150&g=2+2+3&d=8`), menos las filas calladas. Los links de la batería de antes, con seis filas, siguen abriendo.

La barra de arriba tiene los nombres de las notas (E A D o Mi La Re) y la referencia del La. Al lado van tres volúmenes, uno para la guitarra, otro para el ritmo (batería y metrónomo) y otro para el drone, y valen para toda la app. De entrada el ritmo va más bajo, porque las tomas de batería pegan más fuerte que la guitarra.

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
  core/        notas, detección de altura (pitch.ts), síntesis de cuerda (pluck.ts), afinaciones y figuras (tuning.ts), armonía (harmony.ts), lo de Rooksby (progressions.ts) las figuras de cada inversión (inversions.ts) y el ritmo (rhythm.ts). TypeScript puro.
  data/        el catálogo de afinaciones (tunings.ts), las vueltas para arrancar (vueltas.ts) y los ritmos de partida de la batería (drums.ts). Solo datos.
  audio/       AudioContext y mezcla, instrumento (muestras de guitarra en samples.ts), micrófono, metrónomo y batería (grabada en kit.ts, sintetizada en drums.ts). Sin React.
  shared/      preferencias, el hook del afinador (useTuner.ts) y componentes de interfaz.
  shell/       la barra de arriba, con las herramientas.
  features/    una carpeta por pantalla: inicio/ (la portada), afinador/, armonia/, inversiones/, acorde/ y ritmo/.
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

`/` es la portada, `/afinador` abre la afinación estándar y `/armonia` la armonía, `/inversiones` las inversiones, `/acorde` ¿Qué acorde? y `/ritmo` el ritmo. Cada afinación tiene su página en `/afinador/<id>`, generada como HTML estático para los buscadores. Se mantuvieron las URL de Scordatura para que sus links sigan abriendo.

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

Las baterías grabadas están recortadas a mono en `public/sonidos/bateria/`, y las dos son CC0 (dominio público):

- La acústica sale de [Recorded drums (CC0)](https://github.com/Nullframe/daw-content/releases/tag/drums-recorded-cc0-2026-09-30), armado con [Big Rusty Drums](https://github.com/sfzinstruments/karoryfer.big-rusty-drums) y [Swirly Drums](https://github.com/sfzinstruments/karoryfer.swirly-drums) de Karoryfer Samples y la [VCSL](https://github.com/sgossner/VCSL) de Versilian Studios.
- La 808 es la Roland TR-808 que grabó Michael Fischer en 1994, en [tidalcycles/sounds-tr808-fischer](https://github.com/tidalcycles/sounds-tr808-fischer).
