# Afinador

Afinador de guitarra con afinaciones alternativas: 68 afinaciones, afinador por micrófono, escuchador interactivo sobre un mástil y lo que suena con un solo dedo.

Salió de [Scordatura](../Afinador%20Drake), donde era una de las herramientas. Acá vive solo.

| Parte          | Qué hace                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Lista          | Las 68 afinaciones agrupadas, con búsqueda por nombre, notas, artista o canción. "Tu afinación" se arma a mano. |
| Ficha          | Acorde al aire, intervalos entre cuerdas, cuántas cuerdas cambian y aviso si alguna queda muy tensa o floja.    |
| Sortear        | Sortea una afinación según el riesgo (seguro, medio o raro), con ↩ para volver.                                 |
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
  core/        notas, detección de altura (pitch.ts), síntesis de cuerda (pluck.ts), afinaciones y sorteo. TypeScript puro.
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
3. **Lo que se sortea explica su regla** (`core/sorteo.ts`): devuelve `{ value, label, rule, href }`.
4. **Dónde va el estado:** la URL guarda lo que se comparte (`/afinador/tuya?n=D2,A2,…`); Zustand guarda las preferencias en `localStorage` (`shared/settings.ts`), y se validan al leerlas.
5. **Las páginas estáticas no conocen la URL.** Un componente que lee parámetros durante el render usa `useHydrated`.
6. **El catálogo se valida con esquemas** en `tests/afinador.test.ts`.

### Rutas

`/` abre la afinación por defecto. Cada afinación tiene su página en `/afinador/<id>`, generada como HTML estático para los buscadores, y `/afinador/tuya` es la propia. Se mantuvieron las URL de Scordatura para que sus links sigan abriendo.

### Agregar una afinación

Una entrada en `data/tunings.ts`. El acorde al aire, los intervalos, los avisos y su página estática se generan solos. Para que salga al sortear, sumala a `TUNING_POOL` en `core/sorteo.ts`.

## Sobre los datos

Muchas afinaciones por canción se transcribieron de oído. Cada tema marca su confiabilidad con `conf`, y `octaves: 'est'` indica que la fuente no daba octavas y son estimadas.
