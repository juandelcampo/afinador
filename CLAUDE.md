# Afinador: notas para trabajar acá

Este proyecto se extrajo el 2026-11-09 de Scordatura (`../Afinador Drake`, commit 1477a84), una suite para componer donde el afinador era una herramienta más. Acá quedó solo el afinador; el README explica qué hace y cómo está armado.

## Qué se sacó al extraerlo

- La Consigna y su conexión: el afinador ya no publica la afinación elegida (`publishToConsigna`) ni se abre como modal encima de otra pantalla.
- El link "Drone con estas cuerdas" (el Drone quedó en Scordatura).
- La barra lateral con Sorteo, Diario y Herramientas: ahora hay una sola barra arriba con notación y La de referencia.
- Los canales de ritmo y drone de la mezcla, y después también el volumen general: queda un solo volumen, en Escuchar.
- Todo `core/rollers.ts`, incluido el sorteo de afinación con su selector de riesgo: primero quedó en `core/sorteo.ts` y después se sacó también.
- La sección "De dónde salen los datos" del pie de la página: la lista de fuentes quedó en el README.
- Las preferencias se guardan bajo la clave `afinador` en `localStorage`, no `scordatura`: no se heredan las de allá.

Si una mejora del afinador también le sirve a Scordatura, hay que llevarla a mano: los dos proyectos ya no comparten código.

## Hacia dónde va

El proyecto pasa a ser un hub de herramientas para componer con guitarra, para gente con oído y poca teoría. Criterio (2026-11-21): cada herramienta se usa sola y sirve en treinta segundos; primero suena y después se explica; navegación plana con una barra arriba; las herramientas se conectan por la URL, sin estado compartido; se suma una nueva recién cuando la anterior está pulida. Lo de Scordatura que no cerró: la entrada cargada (la Consigna), las herramientas atadas a un proyecto, demasiadas cosas a medio hacer y los modales apilados. Las herramientas de allá se traen de a una y se rehacen con este criterio.

Armonía sigue a De María, _Composición integral_ (el PDF está en `~/Escritorio/afinador refes/`). Juan no quiere pentagramas.

## Cómo le gusta trabajar a Juan

- Se escribe en español rioplatense (vos), también los comentarios del código y los nombres de los tests.
- La estética es brutalista (bordes gruesos, mayúsculas, un solo color de acento), pero el uso y el espacio mandan sobre la estética.
- Para sumar o retocar una herramienta, seguir `docs/ESTILO.md`: qué piezas compartidas usar, colores y estados, un solo volumen en la barra, elecciones de dos opciones en un `Toggle`.
- Los commits y el push van directo a `main`, sin ramas ni PR.
- Antes de dar algo por terminado: `npm run check`. Para ver cambios de interfaz, sacar capturas en celular (390 px) y escritorio.
- Puede haber varias sesiones a la vez en este proyecto y en Scordatura: comparten `build/`, así que con sesiones en paralelo conviene correr los e2e en otro puerto (`E2E_PORT=…`) o en una copia aparte.
