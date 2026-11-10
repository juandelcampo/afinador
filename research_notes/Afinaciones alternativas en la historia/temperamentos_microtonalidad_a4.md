# Temperamentos históricos, entonación justa, microtonalidad y diapasón (datos para cargar en el afinador)

Nota de método: varias fuentes clave (huygens-fokker.org, kylegann.com, en.xen.wiki, larips.com) no se pudieron abrir en esta sesión (bloqueo de red, 403 o conexión cortada). Las tablas de temperamentos se **calcularon** a partir de su definición (qué quintas se achican y cuánto) con un script en Python. Werckmeister III se contrastó contra la tabla de Wikipedia y coincide a 0,1 cent, lo que valida el método. Constantes usadas: quinta pura 701,955 c; coma pitagórica (PC) 23,460 c; coma sintónica (SC) 21,506 c; esquisma 1,954 c.

Convenciones de las tablas:
- `abs` = cents desde C (C=0), dentro de la octava.
- `devC` = desvío respecto de 12-TET con C=0 (lo que un afinador "por cuerda" muestra si C está en 0).
- `devA` = desvío respecto de 12-TET con A=0 (lo que conviene cargar si el usuario calibra con La de referencia, que es lo que hace este afinador).
- Orden de las columnas: C, C#, D, Eb, E, F, F#, G, G#, A, Bb, B.

## 1. Temperamentos históricos de teclado: cents exactos por clase de altura

### Takeaway
Todos los temperamentos que siguen se definen como una cadena de 11 quintas (Eb…G#) con algunas achicadas por fracciones de coma. Eso hace que el modelo de datos para el afinador sea trivial: 12 desvíos en cents por temperamento, más una tónica de referencia. La numeración de Werckmeister es fuente de confusión: "Werckmeister III" en el uso corriente es el primero de sus temperamentos buenos, "I (III)".

### Cited Findings

**Numeración de Werckmeister (contradicción a señalar).** Wikipedia los rotula I (III), II (IV), III (V) y IV (VI). El primer número es el orden en el tratado de 1691 y el segundo es el rótulo de su monocordio, donde "I" era la entonación justa y "II" la mesotónica de 1/4 de coma. Por eso el muy usado "Werckmeister III" es el **primero** de sus temperamentos buenos — [Wikipedia: Werckmeister temperament](https://en.wikipedia.org/wiki/Werckmeister_temperament) (confianza alta).
- W. I (III): 1/4 de coma (PC) en C–G, G–D, D–A, B–F#; el resto puras — [misma fuente](https://en.wikipedia.org/wiki/Werckmeister_temperament).
- W. I (III), cents desde C según Wikipedia: C 0; C# 90.225; D 192.180; D# 294.135; E 390.225; F 498.045; F# 588.270; G 696.090; G# 792.180; A 888.270; Bb 996.090; B 1092.180 — [misma fuente](https://en.wikipedia.org/wiki/Werckmeister_temperament) (alta; coincide con el cálculo propio).
- W. II (IV) (con 1/3 de coma), cents de "exact ratio": C 0; C# 82.405; D 196.090; D# 294.135; E 392.180; F 498.045; F# 588.270; G 694.135; G# 784.360; A 890.225; Bb 1003.910; B 1086.315. Wikipedia da una segunda columna con las longitudes de cuerda del monocordio, que difiere en 1 a 3 cents — [misma fuente](https://en.wikipedia.org/wiki/Werckmeister_temperament) (alta).
- W. III (V): C 0; C# 96.090; D 203.910; D# 300; E 396.090; F 503.910; F# 600; G 701.955; G# 792.180; A 900; Bb 1001.955; B 1098.045 — [misma fuente](https://en.wikipedia.org/wiki/Werckmeister_temperament) (alta).
- W. IV (VI) "Septenarius" (con longitudes de cuerda, no con fracciones de coma): C 0; C# 90.661; D 186.334 (con 176) o 196.198 (con 175, probable errata); D# 298.065; E 395.169; F 498.045; F# 594.923; G 697.544; G# 792.616; A 893.214; Bb 1000.020; B 1097.124 — [misma fuente](https://en.wikipedia.org/wiki/Werckmeister_temperament) (alta para los números; la lectura de D es dudosa en la fuente).
- Werckmeister no aclaró si hablaba de coma sintónica o pitagórica; la diferencia (un esquisma) es casi inaudible — [misma fuente](https://en.wikipedia.org/wiki/Werckmeister_temperament).

**Tablas calculadas** (cents a 0,1; definición de cada una en el título). Fuente de las definiciones: conocimiento estándar de la literatura; la única contrastada contra una fuente en esta sesión es Werckmeister III. Confianza: alta para Pitagórica, las mesotónicas y Werckmeister III (son matemática pura); **media** para Kirnberger II/III, Vallotti, Young II y Kellner (definiciones de manual, no verificadas en esta sesión); **media-baja** para Lehman (ver más abajo).

```
                    C     C#     D     Eb     E     F     F#     G     G#     A     Bb     B
Pitagórica (cadena Eb–G# de quintas puras)
 abs             0.0  113.7  203.9  294.1  407.8  498.0  611.7  702.0  815.6  905.9  996.1 1109.8
 devC           +0.0  +13.7   +3.9   -5.9   +7.8   -2.0  +11.7   +2.0  +15.6   +5.9   -3.9   +9.8
 devA           -5.9   +7.8   -2.0  -11.7   +2.0   -7.8   +5.9   -3.9   +9.8   +0.0   -9.8   +3.9
Mesotónica 1/4 SC (Eb–G#)
 abs             0.0   76.0  193.2  310.3  386.3  503.4  579.5  696.6  772.6  889.7 1006.8 1082.9
 devC           +0.0  -24.0   -6.8  +10.3  -13.7   +3.4  -20.5   -3.4  -27.4  -10.3   +6.8  -17.1
 devA          +10.3  -13.7   +3.4  +20.5   -3.4  +13.7  -10.3   +6.8  -17.1   +0.0  +17.1   -6.8
Mesotónica 1/3 SC
 devC           +0.0  -36.5  -10.4  +15.6  -20.9   +5.2  -31.3   -5.2  -41.7  -15.6  +10.4  -26.1
 devA          +15.6  -20.9   +5.2  +31.3   -5.2  +20.9  -15.6  +10.4  -26.1   +0.0  +26.1  -10.4
Mesotónica 2/7 SC
 devC           +0.0  -29.3   -8.4  +12.6  -16.8   +4.2  -25.1   -4.2  -33.5  -12.6   +8.4  -20.9
 devA          +12.6  -16.8   +4.2  +25.1   -4.2  +16.8  -12.6   +8.4  -20.9   +0.0  +20.9   -8.4
Mesotónica 1/5 SC
 devC           +0.0  -16.4   -4.7   +7.0   -9.4   +2.3  -14.1   -2.3  -18.8   -7.0   +4.7  -11.7
 devA           +7.0   -9.4   +2.3  +14.1   -2.3   +9.4   -7.0   +4.7  -11.7   +0.0  +11.7   -4.7
Mesotónica 1/6 SC
 devC           +0.0  -11.4   -3.3   +4.9   -6.5   +1.6   -9.8   -1.6  -13.0   -4.9   +3.3   -8.1
 devA           +4.9   -6.5   +1.6   +9.8   -1.6   +6.5   -4.9   +3.3   -8.1   +0.0   +8.1   -3.3
Werckmeister I (III) (1/4 PC en C–G, G–D, D–A, B–F#)
 devC           +0.0   -9.8   -7.8   -5.9   -9.8   -2.0  -11.7   -3.9   -7.8  -11.7   -3.9   -7.8
 devA          +11.7   +2.0   +3.9   +5.9   +2.0   +9.8   +0.0   +7.8   +3.9   +0.0   +7.8   +3.9
Kirnberger II (D–A y A–E 1/2 SC; F#–C# un esquisma; resto puras)
 abs             0.0   90.2  203.9  294.1  386.3  498.0  590.2  702.0  792.2  895.1  996.1 1088.3
 devC           +0.0   -9.8   +3.9   -5.9  -13.7   -2.0   -9.8   +2.0   -7.8   -4.9   -3.9  -11.7
 devA           +4.9   -4.9   +8.8   -1.0   -8.8   +2.9   -4.9   +6.8   -2.9   +0.0   +1.0   -6.8
Kirnberger III (C–G–D–A–E 1/4 SC; F#–C# un esquisma; resto puras)
 abs             0.0   90.2  193.2  294.1  386.3  498.0  590.2  696.6  792.2  889.7  996.1 1088.3
 devC           +0.0   -9.8   -6.8   -5.9  -13.7   -2.0   -9.8   -3.4   -7.8  -10.3   -3.9  -11.7
 devA          +10.3   +0.5   +3.4   +4.4   -3.4   +8.3   +0.5   +6.8   +2.4   +0.0   +6.4   -1.5
Vallotti (F–C–G–D–A–E–B 1/6 PC; resto puras)
 abs             0.0   94.1  196.1  298.0  392.2  502.0  592.2  698.0  796.1  894.1 1000.0 1090.2
 devC           +0.0   -5.9   -3.9   -2.0   -7.8   +2.0   -7.8   -2.0   -3.9   -5.9   +0.0   -9.8
 devA           +5.9   +0.0   +2.0   +3.9   -2.0   +7.8   -2.0   +3.9   +2.0   +0.0   +5.9   -3.9
Young II (C–G–D–A–E–B–F# 1/6 PC; resto puras = Vallotti corrido una quinta)
 devC           +0.0   -9.8   -3.9   -5.9   -7.8   -2.0  -11.7   -2.0   -7.8   -5.9   -3.9   -9.8
 devA           +5.9   -3.9   +2.0   +0.0   -2.0   +3.9   -5.9   +3.9   -2.0   +0.0   +2.0   -3.9
Kellner 1977 (C–G–D–A–E y B–F# 1/5 PC; resto puras)
 devC           +0.0   -9.8   -5.5   -5.9  -10.9   -2.0  -11.7   -2.7   -7.8   -8.2   -3.9   -9.0
 devA           +8.2   -1.6   +2.7   +2.3   -2.7   +6.3   -3.5   +5.5   +0.4   +0.0   +4.3   -0.8
Lehman 2005 (F–C–G–D–A–E 1/6 PC; E–B–F#–C# puras; C#–G#–Eb–Bb 1/12 PC; Bb–F 1/12 PC ancha)
 abs             0.0   98.0  196.1  298.0  392.2  502.0  596.1  698.0  798.0  894.1  998.0 1094.1
 devC           +0.0   -2.0   -3.9   -2.0   -7.8   +2.0   -3.9   -2.0   -2.0   -5.9   -2.0   -5.9
 devA           +5.9   +3.9   +2.0   +3.9   -2.0   +7.8   +2.0   +3.9   +3.9   +0.0   +3.9   +0.0
```

**Hipótesis "Bach" (contradicción fuerte).**
- Lehman publicó "Bach's extraordinary temperament: our Rosetta Stone" en *Early Music* 33 (2005), n.º 1: 3–23 y n.º 2: 211–231. Lee el arabesco de la portada del *Clave bien temperado* como 11 lazos: 5 dobles, 3 simples y 3 con un rizo. Él mismo dice que, a efectos prácticos, 1/12 PC ≈ 1/11 SC — [Wikipedia: Bach Temperament](https://en.wikipedia.org/wiki/Bach_Temperament); [Early Music, OUP](https://academic.oup.com/em/article/39/3/401/537822) (media).
- Críticas: Lindley y Ortgies (*Early Music* 34, 2006) la tildan de "historically wild and methodologically wrong"; la BBC señala que las cartas posteriores en *Early Music* pusieron en duda sus conclusiones. Hay también una refutación de un técnico de la PTG — [Errata Lindley/Ortgies](https://sites.google.com/site/iboortgies/errataandcorrigendatolindleyortgiesbac); [PTG blog: Lehman Bach tuning refuted](https://my.ptg.org/blogs/fred-sturm/2014/10/24/lehman-bach-tuning-refuted) (media).
- Análisis por Transformada de Fourier de los temperamentos "Bach" — [Amiot, MTO 15.2 (2009)](https://www.mtosmt.org/issues/mto.09.15.2/mto.09.15.2.amiot.php) (alta como fuente académica; no se leyó su contenido).
- La definición exacta de Lehman de la tabla (qué quintas son 1/6 y cuáles 1/12) es la versión que circula habitualmente; no se pudo verificar en larips.com, que redirige a bpl.rf.gd/larips/ y cortó la conexión.

### Inferences
- Para el afinador conviene guardar cada temperamento como 12 desvíos `devC` y convertir a la nota de referencia del usuario en tiempo de ejecución: `devA[i] = devC[i] - devC[A]`. Las tablas de arriba ya traen las dos versiones.
- La mesotónica requiere elegir el lobo: la cadena Eb–G# es la estándar (lobo G#–Eb). Ofrecer la variante Ab en lugar de G#, o D# en lugar de Eb, sería un extra.
- Kirnberger II y III, Werckmeister III y Young II comparten las alteraciones "pitagóricas" (C# −9.8, Eb −5.9, F −2.0, G# −7.8, Bb −3.9 en devC), porque las quintas entre B y Eb son puras en los cuatro.

### Gaps
- Sin verificar en esta sesión: Young I (1799), Neidhardt (sus varios "círculos" de 1724/1732), Sparschuh, Barnes (1979), Zapf, Rameau (1726), Marpurg, tempérament ordinaire francés. Hay que sacar sus definiciones de Scala (`.scl` del archivo) o de los textos de Kyle Gann antes de cargarlos.
- Qué grabaciones concretas usan cada temperamento (p. ej. discos en Werckmeister III o Lehman): no se encontró fuente fiable en esta sesión.

## 2. Entonación justa: escalas en razones y obras

### Takeaway
La entonación justa se carga como lista de razones respecto de una tónica, no como desvíos fijos por nota. El afinador necesita entonces un campo "tónica" además de la tabla. Están verificadas las razones de *The Well-Tuned Piano* y la lista de 43 de Partch.

### Cited Findings
- **5-limit (diatónico intenso de Ptolomeo = mayor justa).** Mayor: 1/1 (0), 9/8 (203.9), 5/4 (386.3), 4/3 (498.0), 3/2 (702.0), 5/3 (884.4), 15/8 (1088.3). Menor natural: 1/1, 9/8, 6/5 (315.6), 4/3, 3/2, 8/5 (813.7), 9/5 (1017.6). Cromática 5-limit de 12: 1/1, 16/15 (111.7), 9/8, 6/5, 5/4, 4/3, 45/32 (590.2), 3/2, 8/5, 5/3, 9/5, 15/8. Son cálculo de razones estándar y no tienen URL verificada en esta sesión (alta como matemática; la atribución a Ptolomeo es estándar).
- **La Monte Young, *The Well-Tuned Piano*** (Eb = 1/1; los nombres de tecla son solo etiquetas). Por tecla: Eb 1/1 · E 567/512 · F 9/8 · F# 147/128 · G 21/16 · G# 1323/1024 · A 189/128 · Bb 3/2 · B 49/32 · C 7/4 · C# 441/256 · D 63/32 — [Wikipedia: The Well-Tuned Piano](https://en.wikipedia.org/wiki/The_Well-Tuned_Piano) (alta).
  - Cents calculados (desde Eb, por tecla): E 176.6, F 203.9, F# 239.6, G 470.8, G# 443.5, A 674.7, Bb 702.0, B 737.7, C 968.8, C# 941.6, D 1172.7. G y G# quedan en orden acústico invertido, igual que C y C#.
  - Fechas: empezada en 1964 ("1964–73–81–Present"); estreno en Roma en 1974; estreno en EE. UU. en Nueva York en 1975; grabación Gramavision del 25-10-1981 ("81 X 25"), editada en 5 CD en 1987; función del 10-05-1987 editada en DVD en 2000 (Just Dreams) — [misma fuente](https://en.wikipedia.org/wiki/The_Well-Tuned_Piano) (alta).
- **Harry Partch, escala de 43 notas** (11-limit; 29 razones de "identidad" más 14 de relleno). En orden: 1/1, 81/80 (21.5), 33/32 (53.3), 21/20 (84.5), 16/15 (111.7), 12/11 (150.6), 11/10 (165.0), 10/9 (182.4), 9/8 (203.9), 8/7 (231.2), 7/6 (266.9), 32/27 (294.1), 6/5 (315.6), 11/9 (347.4), 5/4 (386.3), 14/11 (417.5), 9/7 (435.1), 21/16 (470.8), 4/3 (498.0), 27/20 (519.6), 11/8 (551.3), 7/5 (582.5), 10/7 (617.5), 16/11 (648.7), 40/27 (680.4), 3/2 (702.0), 32/21 (729.2), 14/9 (764.9), 11/7 (782.5), 8/5 (813.7), 18/11 (852.6), 5/3 (884.4), 27/16 (905.9), 12/7 (933.1), 7/4 (968.8), 16/9 (996.1), 9/5 (1017.6), 20/11 (1035.0), 11/6 (1049.4), 15/8 (1088.3), 40/21 (1115.5), 64/33 (1146.7), 160/81 (1178.5) — [Wikipedia: Harry Partch's 43-tone scale](https://en.wikipedia.org/wiki/Harry_Partch%27s_43-tone_scale) (alta; se contaron 43 y los cents se recalcularon).
  - Partch usó una escala de 29 notas para la Adapted Viola desde 1928, y la mayoría de sus instrumentos tocan solo subconjuntos de la escala — [misma fuente](https://en.wikipedia.org/wiki/Harry_Partch%27s_43-tone_scale) (alta).

### Inferences
- Para un afinador de guitarra, Partch y Young sirven más como "modo de afinación por razones" (la cuerda N a razón X de la fundamental) que como temperamento de 12 notas.

### Gaps
- Las afinaciones de cuerdas de las Adapted Guitar I/II/III de Partch no se pudieron verificar: Wikipedia no las trae y no se accedió a fuentes especializadas.
- No se buscaron en esta sesión: 7-limit genérico, Lou Harrison (p. ej. sus afinaciones de gamelán), los cuartetos de Ben Johnston (notación extendida de JI; el Cuarteto n.º 7 suele citarse como el más complejo), Terry Riley (afinación justa de *The Harp of New Albion*), Michael Harrison (*Revelation*, piano "armónico"), el Long String Instrument de Ellen Fullman. Cualquier razón dada para ellos sin fuente sería inventada.

## 3. Microtonalidad: EDO, guitarra/rock, Carlos, Bohlen–Pierce, Carrillo

### Takeaway
Para un afinador, cualquier EDO es una fórmula (`paso = 1200/n` cents), así que no hacen falta tablas. Lo que sí hay que guardar como datos son las escalas que no repiten a la octava (alfa/beta/gamma de Carlos, Bohlen–Pierce sobre 3:1). King Gizzard es el ejemplo de rock más conocido de 24-TET.

### Cited Findings
- **Pasos de EDO (cálculo, 1200/n):** 19-EDO 63.158 c; 22-EDO 54.545; 24-EDO 50.000; 31-EDO 38.710; 34-EDO 35.294; 41-EDO 29.268; 53-EDO 22.642; 72-EDO 16.667; 96-EDO 12.500 (alta, aritmética).
- **King Gizzard & the Lizard Wizard, *Flying Microtonal Banana***, editado el 24-02-2017, con el subtítulo *Explorations into Microtonal Tuning, Volume 1*. Está en cuartos de tono (24 partes iguales de la octava), pensado al principio para baglama, con guitarras, bajos y armónica modificados y zurna. El título viene de la guitarra amarilla con trastes extra de Stu Mackenzie. Temas: Rattlesnake, Melting, Open Water, Sleep Drifter, Billabong Valley, Anoxia, Doom City, Nuclear Fusion, Flying Microtonal Banana — [Wikipedia: Flying Microtonal Banana](https://en.wikipedia.org/wiki/Flying_Microtonal_Banana) (alta).
  - *K.G.* (2020) y *L.W.* (2021) suelen presentarse como volúmenes 2 y 3 de la serie microtonal. No se verificó en esta sesión (media).
- **Wendy Carlos:** alfa = 78 c por paso (≈15.385 pasos por octava); beta = 63.8 c (63.832932576; ≈18.809 por octava); gamma = 35.1 c (≈34.188 por octava). En *Beauty in the Beast* (1986) la gamma era "demasiado engorrosa" y no se usó. "That's Just It" y "Just Imaginings" usan la escala armónica, y la segunda termina con un ciclo de quintas puras — [Wikipedia: Alpha scale](https://en.wikipedia.org/wiki/Alpha_scale) (alta para los pasos; no se precisa qué temas usan alfa o beta).
- **Bohlen–Pierce:** escala sobre el tritavo 3:1 (1901.955 c), sin octava. La versión igual tiene 13 pasos de 146.304 c (cálculo: 1901.955/13). Obras: Curtis Roads, *Clang-Tint*; Richard Boulanger, *Solemn Song for Evening* (1990); Juan Reyes, *ppP* (1999–2000); Ami Radunskaya, *A Wild and Reckless Place* (1990); Charles Carpenter, *Frog à la Pêche* (1994) y *Splat*; Elaine Walker, *Stick Men* (1991), *Love Song*, *Greater Good* (2011). Stephen Fox construyó clarinetes BP a pedido de Georg Hajdu — [Wikipedia: Bohlen–Pierce scale](https://en.wikipedia.org/wiki/Bohlen%E2%80%93Pierce_scale) (media: el resumen obtenido tenía incoherencias, como "31/13" y "9 pasos", que parecen errores del extractor y no de la página).
- **Julián Carrillo, *Preludio a Colón* (1922)**, primera demostración del Sonido 13. La instrumentación se describe como soprano, flauta, guitarra y violín en cuartos de tono, octavina en octavos y arpa en dieciseisavos (96 partes de la octava = 12.5 c). Se publicó en la *New Music Quarterly* de Cowell en 1944. El estreno es contradictorio: Ciudad de México el 15-02-1924 según Wikipedia, 1925 según un programa de la UNAM — [Wikipedia: Preludio a Colón](https://en.wikipedia.org/wiki/Preludio_a_Col%C3%B3n); [Wikipedia: Sonido 13](https://en.wikipedia.org/wiki/Sonido_13); [IMSLP](https://imslp.org/wiki/Preludio_a_Col%C3%B3n_(Carrillo,_Juli%C3%A1n)); [programa UNAM 2025](https://musica.unam.mx/uploads/files/Portal_ProgramaWeb_MCont_Liminar_22NOV2025.pdf) (media). Referencia académica: Alejandro Madrid, *In Search of Julián Carrillo and Sonido 13* (Oxford, 2015).

### Inferences
- Para afinar escalas sin octava (alfa, beta, BP), el afinador tiene que buscar la nota más cercana sobre una grilla `f0 · 2^(k·paso/1200)` sin plegar a 12 clases de altura. Es un cambio de modelo respecto de "nota + cents".

### Gaps
- **Razones de la BP justa (no verificadas, de memoria; confianza media):** 1/1, 27/25, 25/21, 9/7, 7/5, 75/49, 5/3, 9/5, 49/25, 15/7, 7/3, 63/25, 25/9, 3/1 (cents: 0, 133.2, 301.8, 435.1, 582.5, 736.9, 884.4, 1017.6, 1165.0, 1319.4, 1466.9, 1600.1, 1768.7, 1902.0). Verificar en en.xen.wiki/w/Bohlen–Pierce (dio 403) o en el archivo Scala antes de cargarlas.
- No investigados por límite de tiempo y fuentes (no afirmar nada sin verificar): Jon Catler, Ivor Darreg, Neil Haverstick (19/34-EDO), la guitarra de trastes móviles de Tolgahan Çoğulu, las guitarras en serie armónica de Glenn Branca, Rhys Chatham, Sevish, Jacob Collier, Joel Mandelbaum (19-EDO), el órgano de 31 de Fokker, 53-EDO, Ezra Sims y Joe Maneri (72-EDO), los pianos en cuartos de tono de Wyschnegradsky, Alois Hába, los *12 Microtonal Etudes* de Easley Blackwood (13 a 24 EDO), y la música espectral (Murail, Grisey, *in vain* de Haas).

## 4. Diapasón de referencia (La 4) e historia

### Takeaway
Los valores para el selector de "La de referencia" están documentados: 415 (barroco moderno por convención), 430.54 (C=256 en temperamento igual), 432 ("Verdi", ver mito), 435 (diapason normal, 1859), 440 (1939, ISO 16 en 1975), 442–443 (orquestas). Lo de A=432 "natural" o "curativo" no tiene sustento, aunque Verdi sí abogó por un La más bajo.

### Cited Findings
- **Barroco:** muchos conjuntos barrocos actuales usan A = 415 Hz por acuerdo. Los diapasones históricos variaban: uno de 1740 asociado a Händel da 422.5 Hz y uno de 1780 da 409 Hz — [Wikipedia: Concert pitch](https://en.wikipedia.org/wiki/Concert_pitch) (alta).
- **Diapason normal:** el gobierno francés fijó A = 435 Hz el 16-02-1859. La diferencia posterior con 440 vino en parte de confusiones sobre la temperatura de medición — [misma fuente](https://en.wikipedia.org/wiki/Concert_pitch) (alta).
- **440:** una conferencia internacional de 1939 recomendó 440 Hz; la ISO lo adoptó en 1955 y lo reafirmó en 1975 como ISO 16. La página no confirma que la conferencia haya sido en Londres — [misma fuente](https://en.wikipedia.org/wiki/Concert_pitch) (alta).
- **Orquestas:** en 1964, 19 de 31 orquestas de EE. UU. afinaban en 440 y el resto en 441–442. En 1987 el *NYT* registró la mayoría entre 440 y 444. La Filarmónica de Berlín usa hoy 443, por debajo de un máximo previo de 445 — [misma fuente](https://en.wikipedia.org/wiki/Concert_pitch) (alta). Viena: sin dato en la fuente.
- **Afinación científica:** C4 = 256 Hz, que da A ≈ 430.54 Hz en temperamento igual; nunca fue oficial — [misma fuente](https://en.wikipedia.org/wiki/Concert_pitch) (alta). Cálculo: 256·2^(9/12) = 430.539; con la sexta pitagórica 27/16 da exactamente 432.
- **"Verdi 432" (mito vs evidencia).** El Instituto Schiller (movimiento LaRouche) promovió 432 como "afinación Verdi", y su 432 usa la razón pitagórica 27:16 sobre C=256, no temperamento igual. Verdi sí propuso bajar levemente el estándar francés — [Wikipedia: Concert pitch](https://en.wikipedia.org/wiki/Concert_pitch) (alta).
  - Un artículo de Cambridge dice que Verdi envió a Boito a defender A=432 en el Congresso dei Musicisti Italiani (Milán, 16–21 de junio de 1881), y que el "diapasón Verdi" de 256 Hz es un producto comercial moderno — [Cambridge Core](https://www.cambridge.org/core/product/916BC4B2B1E69D460158640DFAA95957/core-reader) (media; solo se vio el resumen).
  - Hay una carta en el Conservatorio de Milán fechada en Génova el 10-02-1884. Según la transcripción de Hollander, Verdi apoyaba el diapason normal de 435 y no se oponía a 432. Las fuentes difieren sobre el destinatario y no se publicó un facsímil — [Roel Hollander](https://www.roelhollander.eu/en/432-tuning/giuseppe-verdi-435Hz-432Hz-256Hz/) (media); [Focus.it](https://www.focus.it/cultura/curiosita/dare-il-la-verdi-bufala-complotto-nazista) califica de falsa la narrativa conspirativa (media).
  - La cita que circula ("I would prefer A=432") no tiene fuente archivística — [dialedggsound blog](https://dialedggsound.com/blog-history-of-a440) (baja; se cita para descartarla).

### Inferences
- Presets razonables para el selector: 392 (barroco francés, sin verificar acá), 415, 430.54, 432, 435, 440, 442, 443. El 432 conviene rotularlo sin afirmaciones "curativas".

### Gaps
- No se verificaron 392 Hz (tono de cámara francés), 430 Hz (clasicismo) ni Chorton/Kammerton con cifras concretas.
- Vienna Philharmonic (442–443): sin fuente en esta sesión.
- La temperatura de referencia del diapason normal (la cifra de 15 °C que suele circular) no figura en la página consultada.

## 5. Formato Scala (.scl) y archivo de escalas

### Takeaway
.scl es el formato estándar de facto para escalas microtonales y el archivo de Scala tiene más de 5000 archivos. Es la vía natural para que el afinador importe temperamentos sin tener que codificarlos a mano.

### Cited Findings
- Scala es conocido por sus archivos de texto legibles para escalas, y su formato es "un estándar para representar escalas microtonales". El archivo ofrece más de 5000 archivos de escala. Especificación oficial: huygens-fokker.org/scala/scl_format.html; programa en huygens-fokker.org/scala/ — [Wikipedia: Scala (software)](https://en.wikipedia.org/wiki/Scala_(software)) (alta para la descripción general).

### Inferences
- Reglas del formato tal como se conocen (verificar contra la especificación antes de implementar): las líneas que empiezan con `!` son comentarios; la primera línea no comentada es la descripción; la segunda es el número de notas; luego viene una altura por línea. Si la altura tiene punto, son cents (`386.314`); si no, es una razón (`5/4`) o un entero (`2`). El 1/1 se omite y la última línea es el período (normalmente `2/1`). Ejemplo mínimo:
  ```
  ! meantone.scl
  Mesotónica 1/4 de coma
  12
  !
  76.049
  193.157
  ...
  2/1
  ```
- Las tablas `abs` de la sección 1 se pueden exportar directo a .scl (11 líneas en cents más `2/1`).

### Gaps
- La página de la especificación (huygens-fokker.org/scala/scl_format.html) y la URL concreta del zip del archivo (suele ser huygens-fokker.org/docs/scales.zip) no se pudieron abrir por un bloqueo de red. Las reglas de arriba son de memoria y hay que confirmarlas.
- Tampoco se pudo abrir el formato complementario .kbm (mapeo de teclado).
