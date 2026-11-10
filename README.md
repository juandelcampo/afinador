# Afinador

Afinador de guitarra con afinaciones alternativas: 74 afinaciones, afinador por micrófono, escuchador interactivo sobre un mástil y lo que suena con un solo dedo.

Salió de [Scordatura](../Afinador%20Drake), donde era una de las herramientas. Acá vive solo.

| Parte          | Qué hace                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Lista          | Las 74 afinaciones agrupadas, con búsqueda por nombre, notas, artista o canción. |
| Ficha          | Acorde al aire, intervalos entre cuerdas, cuántas cuerdas cambian y aviso si alguna queda muy tensa o floja.    |
| Afinar         | Micrófono, cuerda por cuerda o automático, con aguja en cents. Tocar una cuerda la hace sonar.                  |
| Escuchar       | Mástil interactivo: trastes, capo, rasgueo a mano, arpegios y rasgueos con patrón y tempo.                      |
| Qué suena solo | Acordes y bordones al aire o con un dedo.                                                                       |
| Se escuchó en  | Temas con esa afinación, capo para tocarlos y video de YouTube que se carga recién al abrirlo.                  |

La barra de arriba tiene los nombres de las notas (E A D o Mi La Re), la referencia del La y el volumen general.

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
  core/        notas, detección de altura (pitch.ts), síntesis de cuerda (pluck.ts), y afinaciones. TypeScript puro.
  data/        el catálogo de afinaciones (tunings.ts). Solo datos.
  audio/       AudioContext y mezcla, instrumento y micrófono. Sin React.
  shared/      preferencias, el hook del afinador (useTuner.ts) y componentes de interfaz.
  shell/       la barra de arriba.
  features/afinador/   la pantalla: lista, ficha, panel de afinar, mástil y escuchador.
tests/         lógica y validación del catálogo (Vitest)
e2e/           pruebas en Chrome real, con micrófono simulado (Playwright)
```

### Reglas

ESLint hace cumplir las dos primeras.

1. **`core` y `data` no conocen React, el audio ni la interfaz.**
2. **`audio` no depende de React.** La interfaz observa al audio, no al revés.
3. **Dónde va el estado:** la URL dice qué afinación está abierta; Zustand guarda las preferencias en `localStorage` (`shared/settings.ts`), y se validan al leerlas.
4. **Las páginas estáticas no conocen la URL.** Un componente que lee parámetros durante el render usa `useHydrated`.
5. **El catálogo se valida con esquemas** en `tests/afinador.test.ts`.

### Rutas

`/` abre la afinación por defecto. Cada afinación tiene su página en `/afinador/<id>`, generada como HTML estático para los buscadores. Se mantuvieron las URL de Scordatura para que sus links sigan abriendo.

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
