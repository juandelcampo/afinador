# Setenta afinaciones nuevas esperan en las fuentes

Juan, la investigación encontró **unas 75 afinaciones de guitarra de 6 cuerdas en 12-TET que todavía no están en `tunings.ts`**. Las comparé por altura MIDI, no por nombre, contra las 74 que tenés hoy. Casi todas salen de cinco fuentes buenas: la página oficial de John Fahey, el catálogo de slack-key de Dancing Cat (el sello que produjo la serie *Hawaiian Slack Key Guitar Masters*), la lista de Nick Drake de Harlan Thompson, la lista de Sonic Youth de Art Lee y entrevistas a Kim Thayil (Soundgarden). Se suman unas pocas afinaciones históricas que entran tal cual en una guitarra: las de la viola lyra inglesa, el laúd, la guitarra rusa adaptada, Yupanqui, la rondeña y Ali Farka Touré. El resto del mundo (oud, bağlama, sitar, guqin, kora, charango, Biber) está bien documentado, pero casi nada entra en el modelo actual. Esos instrumentos tienen otra cantidad de cuerdas, cuerdas reentrantes u órdenes dobles en octava, o intervalos que no son de 12-TET. Para cargarlos hacen falta tres cambios de modelo: cantidad de cuerdas variable, orden físico no ascendente y desvío en cents con una tónica móvil. La investigación también contradice datos que ya cargaste. "Bron-Yr-Aur" figura en Do abierta y las fuentes la ponen en C6. Dos temas de Soundgarden figuran en Do abierta y Thayil dice CGCGGE. Las octavas del Ostrich no cierran con la receta de Wikipedia. Y cuatro temas de Joni Mitchell tienen transcripciones que se contradicen. Más abajo van las tablas listas para cargar, las contradicciones y lo que quedó sin verificar.

**Cómo leer las tablas.** Las notas van en orden físico, de la 6.ª a la 1.ª. Cuando la fuente da solo letras, la octava es mía y lleva *est*: la saqué moviendo cada cuerda lo menos posible desde E2 A2 D3 G3 B3 E4. En las afinaciones de rango estrecho de Sonic Youth seguí la misma convención que ya usa `tunings.ts`. La confianza es **alta** cuando lo dice el artista, el sello que documenta sus propias grabaciones o la página oficial. Es **media** con una transcripción publicada o varias fuentes que coinciden, y **baja** con una lista de fans, un foro o una fuente única floja. La columna "App" dice **OK** si entra hoy en el modelo, **OK+cuerdas** si entra pero pide encordar a medida (`restring`), o el motivo por el que no entra.

## El rock y el indie suman 35 afinaciones nuevas con canción

### Fripp, Drake y el Velvet: datos firmes y una octava que no cierra

La **NST de Fripp, C2 G2 D3 A3 E4 G4**, está bien documentada. La ideó en septiembre de 1983 y la enseñó en Guitar Craft desde 1985, aunque el mismo artículo dice en otro lugar "desde 1984" ([Wikipedia](https://en.wikipedia.org/wiki/New_standard_tuning)). Su idea original eran quintas puras hasta un B4, que no aguanta ninguna cuerda: es la "Todas quintas" que ya tenés. En 2012 propuso la **NST 1.2 (C2 G2 D3 A3 E4 A4)**, que es nueva para el catálogo. No hay ninguna fuente que diga qué discos de King Crimson están en NST, y *Discipline* (1981) es anterior a la afinación.

Con Nick Drake, lo que ya tenés coincide casi entero con la lista de Thompson ([guitartabs.cc](https://guitartabs.cc/tabs/d/drake_nick/tunings_tab.html)). Thompson la llama "best guess" y solo da por más seguras las canciones que transcribió en OLGA. Faltan canciones, no afinaciones (ver la tabla de canciones nuevas). Con el Ostrich del Velvet Underground hay un problema de octavas. Wikipedia escribe "D-D-D-D-d-d", y eso coincide con tu D3 D3 D3 D3 D4 D4. Pero la receta del mismo artículo da D2 D2 D3 D3 D4 D4: la 6.ª y la 5.ª bajan a D2, la 3.ª baja una cuarta a D3, y la 2.ª y la 1.ª van a D4 ([Wikipedia: Ostrich guitar](https://en.wikipedia.org/wiki/Ostrich_guitar)). Las dos lecturas son incompatibles y ninguna fuente lo resuelve.

| Afinación | Notas 6→1 | Canciones / obras | Fuente | Conf. | App | En tunings.ts |
|---|---|---|---|---|---|---|
| NST | C2 G2 D3 A3 E4 G4 | League of Crafty Guitarists, California Guitar Trio (a nivel de obra) | [Wikipedia](https://en.wikipedia.org/wiki/New_standard_tuning) | alta | OK+cuerdas | `nst` |
| NST original (quintas) | C2 G2 D3 A3 E4 B4 | idea de Fripp, inviable | ídem | alta | OK+cuerdas | `fifths` |
| NST 1.2 | C2 G2 D3 A3 E4 A4 | propuesta de 2012, sin resultado publicado | ídem | alta | OK+cuerdas | **nueva** |
| Ostrich (receta) | D2 D2 D3 D3 D4 D4 *est* | "All Tomorrow's Parties", final de "Venus in Furs", "The Ostrich" | [Wikipedia](https://en.wikipedia.org/wiki/Ostrich_guitar), [Stereogum](https://stereogum.com/5887/velvet_undergrounds_secret_weapon_the_ostrich/news) | media (notas), baja (octavas) | OK+cuerdas | **nueva** (choca con `ostrich`) |

### Sonic Youth: 22 afinaciones de una lista de fans de 1993

La única lista sistemática es la de Art Lee, de Usenet ([acordesweb](https://acordesweb.com/cancion/sonic-youth/guitar-tunings), [espejo](https://www.guitartabs.cc/tabs/s/sonic_youth/guitar_tunings_tab.html)). Cubre unas 47 canciones hasta *Dirty*, sin octavas, y sus fechas son incoherentes ("Dec 10, 1993, last revised May 19, 1993"). Las seis de la sección "ligeramente alteradas" marcan cada cuerda como algo arriba (u) o algo abajo (d), sin decir cuántos cents. Se pueden cargar por la nota nominal, avisando que la desafinación está sin cuantificar. Lee prohíbe reproducir el documento: acá van los datos, no el texto. Confianza **baja/media** en todas.

| # Lee | Notas 6→1 | Canciones | App | En tunings.ts |
|---|---|---|---|---|
| 1 | E2 B2 E3 E3 A3 B3 *est* | Eric's Trip, Hey Joni, Rain King, Kissability | OK | **nueva** |
| 2 | E2 E2 B2 E3 B3 E4 *est* | Intro, Brave Men Run, Ghost Bitch (Ranaldo, parte suave) | OK+cuerdas | **nueva** |
| 3 | E2 E2 B2 F#3 B3 E4 *est* | Ghost Bitch (Ranaldo) | OK+cuerdas | **nueva** |
| 4 | F#2 F#2 F#3 F#3 E3 B3 | Death Valley '69, Halloween, Mary-Christ, Kool Thing, 100% | OK+cuerdas | `fsharp` |
| 5 | G2 A2 B2 D3 E3 G3 | Teenage Riot (Moore) | OK+cuerdas | `gabdeg` |
| 6 | G2 G2 C3 C3 A#3 A#3 *est* | I Love Her All the Time (Moore) | OK+cuerdas | **nueva** |
| 7 | G2 G2 C#3 D3 G3 G3 | The Wonder, Hyperstation (Moore) | OK+cuerdas | `ggcsdgg` |
| 8 | G2 G2 D3 D3 F3 F3 *est* | Mote | OK+cuerdas | **nueva** |
| 9 | G2 G2 D3 D3 G3 G3 | Teenage Riot, Tunic (Ranaldo) | OK+cuerdas | `ggddgg` |
| 10 | G#2 G#2 G#2 D3 D#3 D#3 *est, muy dudosa* | White Cross (Moore) | OK+cuerdas | **nueva** |
| 11 | A2 A2 A3 A3 B3 D4 *est* | Justice Is Might (Moore, **sin confirmar** en la fuente) | OK+cuerdas | **nueva** |
| 12 | A2 A2 E3 E3 A3 A3 *est* (= n.º 9 con cejilla 2) | Theresa's Sound-world (Ranaldo) | OK+cuerdas | **nueva** |
| 13 | A2 A2 E3 E3 F#3 A3 *est* | Justice Is Might (Ranaldo) | OK+cuerdas | **nueva** |
| 14 | A2 C3 C3 G3 G#3 C4 | Silver Rocket, The Sprawl, Candle, Cinderella's Big Score, Theresa's Sound-world (Moore) | OK+cuerdas | `accggsc` |
| 15 | D2 D2 D3 D3 E3 A3 *est* | I'm Insane (Ranaldo) | OK+cuerdas | **nueva** |
| 16 | D#2 D#2 C#3 C#3 G3 G3 *est* | I Love Her All the Time (Ranaldo) | OK+cuerdas | **nueva** |
| 17 (u/d) | E2 E2 B2 B3 E4 F#4 *est* | Dirty Boots (Ranaldo) | OK, con desvío sin cuantificar | **nueva** |
| 18 (u/d) | E2 G2 D3 G3 E3 D4 | Dirty Boots, Tunic (Moore), Mildred Pierce, My Friend Goo, Titanium Exposé, Sugar Kane (Moore?), Chapel Hill | ídem | `egdged` |
| 19 (u/d) | E2 G#2 E3 G#3 E3 G#3 | Expressway to Yr Skull | ídem | `egsegs` |
| 20 (u/d) | F#2 F#2 G3 G3 A3 A3 | Tom Violence, Starpower, In the Kingdom #19, Death to Our Friends, Marilyn Moore, Bubblegum, Schizophrenia, White Cross (Ranaldo) | ídem | `fsfsggaa` |
| 21 (u/d) | G2 G2 D3 D3 Eb3 Eb3 | Brother James, Stereo Sanctity, Cotton Crown, Total Trash, The Wonder, Hyperstation, Sugar Kane (Ranaldo), Orange Rolls Angel's Spit | ídem | `ggddebeb` |
| 22 (u/d) | C2 C3 E3 B3 G3 D4 *est, muy dudosa* | Cross the Breeze, Disappearer | ídem | **nueva** |

### Page, Soundgarden, Hedges, Stills y Joni: lo que dicen los propios músicos

Page dijo él mismo, en 1977, que "Black Mountain Side" va en DADGAD ([Far Out / Guitar World](https://faroutmagazine.co.uk/nothing-standard-the-unique-way-jimmy-page-would-tune-his-guitar/); la cita llegó por el resumen del buscador). "Bron-Yr-Aur" y "Friends" van en **C6, C A C G C E** ([Wikipedia: Friends](https://en.wikipedia.org/wiki/Friends_(Led_Zeppelin_song)), [Guitar World](https://www.guitarworld.com/features/how-jimmy-page-redefined-the-role-of-acoustic-guitar-in-rock)). Para "The Rain Song", Guitar World dice que "se cree" que es DGCGCD ([Wikipedia](https://en.wikipedia.org/wiki/The_Rain_Song)). En una entrevista de 2021, Thayil cuenta que Cornell afinó todas las cuerdas en E para **"Mind Riot"** ([Guitar World](https://www.guitarworld.com/artists/guitarists/kim-thayil-on-the-time-chris-cornell-tuned-all-his-guitar-strings-to-e)). Eso descarta el "EEBBBB" que circulaba. La misma nota pone "My Wave" y "The Day I Tried to Live" en EEBBBE. En otra entrevista, Thayil dice "I believe" que "Head Down", "Burden in My Hand" y "Pretty Noose" van en **CGCGGE** ([Guitar Player](https://www.guitarplayer.com/players/kim-thayil-my-career-in-six-songs)).

Con Joni Mitchell sirve la regla de la fuente: lo que repiten varios transcriptores de [jonimitchell.com](https://jonimitchell.com/music/viewalltranscriptions.cfm) es confianza media, y lo de un solo transcriptor es baja.

| Afinación | Notas 6→1 | Canciones | Fuente | Conf. | App | En tunings.ts |
|---|---|---|---|---|---|---|
| DADGAD | D2 A2 D3 G3 A3 D4 | Black Mountain Side, White Summer, Kashmir (Page); Ragamuffin (Hedges) | [Far Out](https://faroutmagazine.co.uk/nothing-standard-the-unique-way-jimmy-page-would-tune-his-guitar/), [Wikipedia DADGAD](https://en.wikipedia.org/wiki/DADGAD), [Stropes](https://www.stropes.com/?p=323) | alta | OK | `dadgad` |
| C6 | C2 A2 C3 G3 C4 E4 | Bron-Yr-Aur, Friends | [Wikipedia](https://en.wikipedia.org/wiki/Friends_(Led_Zeppelin_song)) | media | OK | `c6` (falta Bron-Yr-Aur) |
| DGCGCD | D2 G2 C3 G3 C4 D4 | The Rain Song (inferida; un sitio dice "Gsus4") | [Wikipedia](https://en.wikipedia.org/wiki/The_Rain_Song), [Guitar World](https://guitarworld.com/news/led-zeppelin-unreleased-the-rain-song-demo-the-seasons) | media | OK | **nueva** |
| Todo E | E2 E2 E3 E3 E3 E4 *est* (con la regla de mínimo movimiento la 2.ª iría a E4) | Mind Riot | [Guitar World](https://www.guitarworld.com/artists/guitarists/kim-thayil-on-the-time-chris-cornell-tuned-all-his-guitar-strings-to-e) | alta (notas), baja (octavas) | OK+cuerdas | **nueva** (pariente de `ostriche`) |
| EEBBBE | E2 E2 B2 B3 B3 E4 *est* | My Wave, The Day I Tried to Live | ídem | media-alta | OK | **nueva** |
| CGCGGE | C2 G2 C3 G3 G3 E4 *est* | Head Down, Burden in My Hand, Pretty Noose | [Guitar Player](https://www.guitarplayer.com/players/kim-thayil-my-career-in-six-songs) | media | OK | **nueva** |
| CCDGAD | C2 C3 D3 G3 A3 D4 | Aerial Boundaries (Hedges) | [Moving the River](https://movingtheriver.com/tag/michaelhedges/) | media | OK | **nueva** |
| ABEF#AD | A2 B2 E3 F#3 A3 D4 *est* | Hot Type (Hedges) | [guitartabs.cc](https://www.guitartabs.cc/tabs/h/hedges_michael/various_tunings_tab.html) | baja | OK | **nueva** |
| CGDGBC | C2 G2 D3 G3 B3 C4 *est* | Rickover's Dream (Hedges) | ídem | baja | OK | **nueva** |
| CGDGAC | C2 G2 D3 G3 A3 C4 *est* | Bensusan (Hedges), cejilla 3 | ídem | baja/media | OK | **nueva** |
| EEEEBE | E2 E2 E3 E3 B3 E4 *est* | Suite: Judy Blue Eyes ("Bruce Palmer modal"; otros dicen doble drop D o DDDDAD) | [Guitar World](https://guitarworld.com/lessons/deft-fingerpicking-odd-tuning-riffage-stephen-stills), [Totally Guitars](https://totallyguitars.com/lessons/472-suite-judy-blue-eyes-guitar-lesson) | media | OK+cuerdas | **nueva** |
| DDDDAD | D2 D2 D3 D3 A3 D4 *est* | Judy Blue Eyes, según un posteo (la anterior un tono abajo) | ídem | baja | OK+cuerdas | **nueva** |
| Doble drop D | D2 A2 D3 G3 B3 D4 | Cinnamon Girl | [hakwright](https://www.hakwright.co.uk/music/tab/cinnamon.txt) | media/alta | OK | `doubledrop` |
| CGCEGC | C2 G2 C3 E3 G3 C4 | Amelia (5 transcriptores); Big Yellow Taxi (1) | [jonimitchell.com](https://jonimitchell.com/music/viewalltranscriptions.cfm) | media | OK | `cgcegc` |
| CGDGBD (x77543) | C2 G2 D3 G3 B3 D4 | Sweet Bird, Cold Blue Steel | [patrones](https://jonimitchell.com/music/tuningpatterns.cfm) | media | OK | `cgdgbd` |
| DGDGBD (x57543) | D2 G2 D3 G3 B3 D4 | Marcie, Little Green (cejilla 5; otros dicen estándar cejilla 3 o la misma con cejilla 4) | ídem | media | OK | `openg` |
| CGDFCE | C2 G2 D3 F3 C4 E4 *est* | Coyote (3 transcriptores; 1 dice estándar) | [jonimitchell.com](https://jonimitchell.com/music/viewalltranscriptions.cfm) | media | OK | **nueva** |
| CGDFGC | C2 G2 D3 F3 G3 C4 *est* | Hejira | ídem | media | OK | **nueva** |
| CACFAC | C2 A2 C3 F3 A3 C4 *est* | Refuge of the Roads (3 coinciden) | ídem | media | OK | **nueva** |
| Re abierta | D2 A2 D3 F#3 A3 D4 | Chelsea Morning (c2), Cactus Tree (c4–5), Big Yellow Taxi (c2), Free Man in Paris, Both Sides Now (c4, en disputa) | ídem | media | OK | `opend` |
| Mi abierta | E2 B2 E3 G#3 B3 E4 | California (Thompson; Wright dice EAC#G#BE) | ídem | baja | OK | `opene` |
| CGBbEbFBb | C2 G2 Bb2 Eb3 F3 Bb3 *est* | Woodstock (Wright; Thompson dice estándar) | ídem | baja | OK | **nueva** |
| AbAbEbAbCEb | Ab2 Ab2 Eb3 Ab3 C4 Eb4 *est* | This Flight Tonight (Wright) | ídem | baja | OK | **nueva** |
| GGDGBD | G2 G2 D3 G3 B3 D4 *est* | Electricity, For the Roses, Hunter (Joni) | [Wikipedia: Open tuning](https://en.wikipedia.org/wiki/Open_tuning) | media | OK | **nueva** |
| CGEEBE / DAEF#AC# | C2 G2 E3 E3 B3 E4 / D2 A2 E3 F#3 A3 C#4 *est* | Help Me (songbook *Hits* / Marian Russell, **sin consenso**) | [jonimitchell.com](https://jonimitchell.com/music/viewalltranscriptions.cfm) | baja | OK | **nuevas** |
| Carey (3 versiones) | C#2 C#3 C#3 C#3 G#3 C#4 / D2 A2 D3 D3 A3 A3 / D2 A2 D3 A3 A3 D4 *est* | Carey, **sin consenso** | ídem | baja | OK | la tercera es `droned` |

## La guitarra acústica tradicional suma más de 30 afinaciones nuevas con disco y tema

### Fahey tiene página oficial y es la fuente más firme

[johnfahey.com](https://www.johnfahey.com/TuningsPage.htm) da la afinación de cada tema en seis discos. Por eso todo lo de Fahey lleva confianza **alta**. De sus 13 afinaciones, la mayoría ya está en tu catálogo, y sirven para sumarle canciones (ver la tabla de canciones nuevas). Las nuevas son cuatro: **D2 A2 D3 F#3 A3 C4**, en la intro de "Uncloudy Day"; **G2 G2 D3 G3 B3 D4**, en "Desperate Man Blues" de *The Return of the Repressed*; **D2 G2 D3 G3 G3 D4**, en "I Am the Resurrection", y **C C C G C E**, en "Dance of the Inhabitants of the Palace of King Philip XIV of Spain", con octavas irresolubles. Propongo C2 C3 C3 G3 C4 E4. Ojo con un nombre: Fahey llama "Double Drop D" a la afinación de "America", pero sus notas son **C2 G2 C3 F3 A3 D4**, o sea tu `dropc`. Hay que cargar las notas y no el nombre. Wikipedia, además, define el open C de Fahey como C–E–G–C–E–G, y eso choca con el CGCGCE de la página oficial ([Wikipedia: Open tuning](https://en.wikipedia.org/wiki/Open_tuning)). Vale la página oficial.

### El folk británico y el blues: pocos temas firmes, varios pleitos de tono

Martin Carthy pasó de DADGAD a **DADEAE** y después a **CGCDGA**, que hoy es su "estándar". Con esa grabó "Lovely Joan" en 1979 ([The Afterword](https://theafterword.co.uk/come-sing-again-exploring-martin-carthys-new-old-album/)). No conviene asociarle el "Scarborough Fair" de 1965, que es anterior. Para "1952 Vincent Black Lightning" de Richard Thompson coinciden tres fuentes en CGDGBE con cejilla 3 ([MusicRadar](https://www.musicradar.com/news/watch-richard-thompson-share-his-top-tips-for-alternate-tunings), [Premier Guitar](https://www.premierguitar.com/lessons/richard-thompson-the-thinking-mans-guitar-hero)): es tu `cmaj9`. Steve Von Till usa **AADGAD** ([Wikipedia DADGAD](https://en.wikipedia.org/wiki/DADGAD)). En el blues, los nombres tradicionales quedan así: *vestapol* es la Re abierta (también la Mi), *Spanish* es la Sol abierta (también la La) y *cross-note* es la abierta menor ([Wikipedia: Open tuning](https://en.wikipedia.org/wiki/Open_tuning)). "Little Martha" va en Re abierta subida medio tono, **Eb2 Bb2 Eb3 G3 Bb3 Eb4** (misma fuente). Duane Allman tocaba casi todo el slide en Mi abierta ([Wikipedia: Open E](https://en.wikipedia.org/wiki/Open_E_tuning)). Las fuentes se pelean en dos casos: Skip James aparece en Re menor o en Mi menor ([Living Blues](https://digital.livingblues.com/living-blues-296/page-39), [American Blues Scene](https://www.americanbluesscene.com/?p=14157)), y "Dust My Broom" en Re o en Mi abierta ([bluesguitarunleashed](https://bluesguitarunleashed.com/blog/?p=7504), [Dummies](https://www.dummies.com/article/academics-the-arts/music/instruments/guitar/tuning-for-slide-guitar-standard-or-open-198120/)). En los dos casos la forma es la misma y cambia solo el tono. Guitar World advierte que lo que en Robert Johnson suena a Sol o a Re abierta pudo ser La o Mi ([Guitar World](https://www.guitarworld.com/lessons/deep-unlocking-guitar-mysteries-delta-blues-great-robert-johnson)).

| Afinación | Notas 6→1 | Canciones | Fuente | Conf. | App | En tunings.ts |
|---|---|---|---|---|---|---|
| Re 7 abierta | D2 A2 D3 F#3 A3 C4 *est* | Uncloudy Day, intro (Fahey) | [johnfahey.com](https://www.johnfahey.com/TuningsPage.htm) | alta | OK | **nueva** |
| GGDGBD | G2 G2 D3 G3 B3 D4 *est* | Desperate Man Blues (*Return of the Repressed*) | ídem | alta | OK | **nueva** (= la de Joni) |
| DGDGGD | D2 G2 D3 G3 G3 D4 *est* | I Am the Resurrection (Fahey); G8 de slack-key | ídem, [Dancing Cat](https://www.dancingcat.com/section-5-hawaiian-recordings-in-the-slack-key-tunings) | alta | OK | **nueva** |
| CCCGCE | C2 C3 C3 G3 C4 E4 *est, octavas baja* | Dance of the Inhabitants… (Fahey) | [johnfahey.com](https://www.johnfahey.com/TuningsPage.htm) | alta (notas) | OK+cuerdas | **nueva** |
| CGCDGA | C2 G2 C3 D3 G3 A3 *est* | Lovely Joan (Carthy) | [The Afterword](https://theafterword.co.uk/come-sing-again-exploring-martin-carthys-new-old-album/) | media | OK | **nueva** |
| DADEAE | D2 A2 D3 E3 A3 E4 *est* | etapa intermedia de Carthy, sin tema | ídem | media | OK | **nueva** |
| AADGAD | A2 A2 D3 G3 A3 D4 *est* | Steve Von Till, sin tema | [Wikipedia DADGAD](https://en.wikipedia.org/wiki/DADGAD) | media | OK | **nueva** |
| Re abierta +½ | Eb2 Bb2 Eb3 G3 Bb3 Eb4 *est* | Little Martha (Allman Brothers) | [Wikipedia: Open tuning](https://en.wikipedia.org/wiki/Open_tuning) | media | OK | **nueva** (= `opend` +1) |
| DADGAD −1 tono | C2 G2 C3 F3 G3 C4 | She Moved Through the Fair, TV 1963 (Graham), con cejilla 2 | [ragajunglism](https://ragajunglism.org/tunings/menu/dadgad/) | baja | OK | nueva, pero mejor como dato en `dadgad` |
| Kottke | B1 E2 B2 E3 G#3 B3 *est* | Vaseline Machine Gun, 12 cuerdas (Sol abierta −3 semitonos) | [Guitar Tabs Explorer](https://www.guitartabsexplorer.com/kottke-leo/machine-tab) | baja | OK+cuerdas | nueva (= `openf` −1) |
| Mi abierta | E2 B2 E3 G#3 B3 E4 | Statesboro Blues; Midnight in Harlem (Trucks); Bo Diddley; Jumpin' Jack Flash (intro), Gimme Shelter, Prodigal Son; *Blood on the Tracks*; She Talks to Angels; Rocky Mountain Way; Stay With Me; We Just Disagree | [Wikipedia: Open E](https://en.wikipedia.org/wiki/Open_E_tuning) | alta/media | OK | `opene` |
| Sol abierta | D2 G2 D3 G3 B3 D4 | Cross Road Blues, Walkin' Blues, Come On in My Kitchen (R. Johnson); Honky Tonk Women, Start Me Up (con 5 cuerdas) | [Guitar World](https://www.guitarworld.com/lessons/deep-unlocking-guitar-mysteries-delta-blues-great-robert-johnson), [Wikipedia](https://en.wikipedia.org/wiki/Open_tuning) | media | OK | `openg` |
| Re abierta | D2 A2 D3 F#3 A3 D4 | Ramblin' on My Mind (según Rory Block); Go Home Girl (Cooder) | [Elderly](https://www.elderly.com/products/dvd-rory-block-teaches-the-guitar-of-robert-johnson-vol-2-exploring-the-repertoire), [Dancing Cat](https://www.dancingcat.com/section-5-hawaiian-recordings-in-the-slack-key-tunings) | media | OK | `opend` |
| Re menor (cross-note, Bentonia) | D2 A2 D3 F3 A3 D4 | Devil Got My Woman, Hard Time Killin' Floor, Cherry Ball, Crow Jane | [Ethan Hein](https://www.ethanhein.com/wp/2024/devil-got-my-woman/), [Living Blues](https://digital.livingblues.com/living-blues-296/page-39) | media (con Mi menor en disputa) | OK | `dminor` |

### El slack-key es el mayor yacimiento: 22 afinaciones nuevas de una sola fuente

El catálogo de [Dancing Cat](https://www.dancingcat.com/section-5-hawaiian-recordings-in-the-slack-key-tunings) numera las afinaciones y les pone grabaciones concretas. Como es el productor documentando su propio catálogo, la confianza es **alta**. Las octavas son mías, con la regla de mínimo movimiento. Los nombres son un desastre: hay tres cosas distintas que se llaman "Mauna Loa", y la página etiqueta "G12" dos veces. Identificá siempre por las notas. Quedó sin leer el último ~17 % del catálogo (las afinaciones en F y Bb y probablemente las de Ray Kane).

| Código | Notas 6→1 | Grabaciones | App | En tunings.ts |
|---|---|---|---|---|
| G1 Taro Patch | D2 G2 D3 G3 B3 D4 | Keola Beamer "Guava Tree", "Pupu Hinuhinu"; Beamer Brothers "Green Rose Hula"; Led Kaapana "Aloha Ia No O Maui"; Eldon Akamine "Matsonia" | OK | `openg` |
| G2 | D2 G2 C3 G3 B3 D4 | sin grabaciones listadas | OK | **nueva** |
| G3 High Bass | G2 B2 D3 G3 B3 D4 | sin grabaciones (= dobro) | OK+cuerdas | `dobro` |
| G4 Double Slack / G Wahine | D2 G2 D3 F#3 B3 D4 | Gabby Pahinui y Atta Isaacs "Ka Ua Noe"; Keola Beamer "Pailolo"; Kaapana y Kwan "Salomila"; Carlos Andrade "Hanalei Bay Blues" | OK | `gmaj7` |
| G5 Waianae | D2 G2 D3 F#3 B3 E4 | sin grabaciones | OK | **nueva** |
| G6 G Mauna Loa | D2 G2 D3 D3 G3 D4 | Sonny Chillingworth "Papakolea", "Key Kaholu"; Stephen Kauhane "Sanoe" | OK | **nueva** |
| A6 (la misma en A) | E2 A2 E3 E3 A3 E4 | Leonard Kwan "Ki Ho'alu" | OK | **nueva** |
| G7 Maori Brown Eyes | D2 G2 D3 E3 G3 D4 | Chillingworth y Kwan "Maori Brown Eyes"; Mike McClellan "Ka Hula a'o Keli" | OK | **nueva** |
| G8 | D2 G2 D3 G3 G3 D4 | sin grabaciones (= Fahey "I Am the Resurrection") | OK | **nueva** |
| G9 Kimo's Mahoe | C2 G2 D3 G3 G3 D4 | Jim Kimo West "Isa Lei", "Kohala No", "Daydream at Jumbo Rocks" | OK | **nueva** |
| G10 Alika's Mauna Loa | D2 G2 D3 D3 F#3 C#4 (octavas baja) | "My Yellow Ginger Lei" (anunciada) | OK | **nueva** |
| G11 Old Mauna Loa | D2 G2 D3 E3 A3 D4 | Leonard Kwan "Old Mauna Loa", "Noho Paipai" | OK | **nueva** |
| G12 Ni'ihau | C2 G2 D3 E3 A3 D4 | Chillingworth "Green Rose Hula" (*Ka'aina O Hawai'i*) | OK | **nueva** |
| "G6th" | D2 G2 D3 G3 B3 E4 | Keola Beamer "For Sweetheart Grandma", "Hi'ilawe", "Ka Makani 'Ula'ula"; Cindy Combs "Sunny Rain" | OK | `g6` |
| G14 Kilauea | D2 G2 C3 G3 B3 E4 | Daniel Ho "Pearly Shells", "Lahainaluna" | OK | **nueva** |
| G15 | D2 G2 D3 E3 B3 D4 | Ozzie Kotani "Kona Hema"; Daniel Nicholas "Maori Brown Eyes" | OK | **nueva** |
| C1 Atta's C | C2 G2 E3 G3 C4 E4 | Atta Isaacs "Hualalai", "Kohala March", "Mele Li'i"; Keola Beamer "'Olapa Ka Uila"; Danny Carvalho "Song for Allie" | OK | **nueva** |
| C3 Mainland C | C2 G2 C3 G3 C4 E4 | Cyril Pahinui y Bob Brozman "Hilo Hanakahi"; Kaapana y Brozman "Kalama'ula" | OK | `openc` |
| C4 Samoan C | F2 G2 C3 G3 C4 E4 | Chillingworth "Minoi Minoi E" | OK | **nueva** |
| C5 Leonard's C | C2 G2 D3 G3 B3 D4 | Gabby Pahinui "Makee 'Ailana"; Kuo y Kamakahi "Palolo"; Keola Beamer "Ulili E" | OK | `cgdgbd` |
| C7 Keola's C | C2 G2 D3 G3 B3 E4 | Keola Beamer "Holo Wa'apa", "Ku'uipo Ku'u Lei"; Chet Atkins "Pu'uanahulu" | OK | `cmaj9` |
| C8 | G2 C3 D3 G3 B3 E4 (octavas baja) | Robert Kaaiai "Moanalua", "Nani Ka'ala" | OK+cuerdas | **nueva** |
| C11 Hi'ilawe | C2 G2 E3 G3 B3 E4 | Gabby "Wahine U'i" (12 cuerdas), "Leaping Loli"; George Kuo "Old Hi'ilawe"; Keola Beamer "Li'i's Song" | OK | `cmaj7` |
| C22 C Mauna Loa / Gabby's C | C2 G2 E3 G3 A3 E4 | Gabby "Aloha Ka Manini", "Moani Ke'ala", "Pua Kukui" | OK | **nueva** |
| "C Mauna Loa" de otras fuentes | C2 G2 C3 G3 A3 E4 | ninguna (nombre en disputa) | OK | **nueva**, baja ([Winston PDF](https://www.georgewinston.com/userfiles/files/HSKBook4achart.pdf)) |
| Am7 de Kuo e Isaacs | C E G A C E (octavas irresolubles) | "Lahaina Luna", "Pua Lilia" | OK+cuerdas | ver C6 de lap steel |
| D1 | D2 A2 D3 F#3 A3 D4 | Keola Beamer "The Wings of a Seabird"; Cooder "Go Home Girl" | OK | `opend` |
| D2 (D7) | C2 A2 D3 F#3 A3 D4 | Keola Beamer "Blue Water Dolphin" | OK | **nueva** |
| D3 Kimo's Anuenue | D2 A2 E3 F#3 A3 D4 | sin grabaciones | OK | **nueva** |
| D4 D Wahine | D2 A2 D3 F#3 A3 C#4 | Keola Beamer "Barefoot on the Range", "Kaula 'Ili" | OK | `dmaj7` |
| D5 (Ken Emerson) | D2 A2 C#3 F#3 A3 C#4 | Ken Emerson "Ua Kea" | OK | **nueva** |
| D6 (Stephen Inglis) | D2 A2 E3 F#3 C#4 D4 | sin grabaciones | OK | **nueva** |
| D7 Cyril's D / Rapa Nui | D2 A2 D3 F#3 B3 E4 | Cyril Pahinui "Salomila"; Kapono Beamer "Pipeline Slack Key" (y es la rondeña, ver abajo) | OK | **nueva** |

Del lap steel entran tres en 6 cuerdas, todas tocadas con barra. **C6, C E G A C E**, se suele encordar C3 E3 G3 A3 C4 E4, aunque esas octavas son estimadas y la fuente no las da ([Steel Guitar Forum](https://bb.steelguitarforum.com/viewtopic.php?p=17871), [Wikipedia C6](https://en.wikipedia.org/wiki/C6_tuning)). Las otras dos son **A6, C#3 E3 F#3 A3 C#4 E4** *est*, y **E7, B2 D3 E3 G#3 B3 E4** *est*, de un gráfico comercial y con confianza media ([SIT Strings](https://sitstrings.com/lap-steel-tuning-chart/)). La E9 de pedal steel tiene 10 cuerdas y no entra.

## Nueve afinaciones de siglos y países lejanos entran sin tocar el modelo

La viola lyra inglesa del siglo XVII ya tenía su catálogo de afinaciones alternativas: se conocen unas 60 ([Wikipedia: Lyra viol](https://en.wikipedia.org/wiki/Lyra_viol)). Se escribían con un código de letras de intervalo (Traficante), que una tesis de White Rose traduce a notas ([tesis](https://etheses.whiterose.ac.uk/id/eprint/10511/1/An%20examination%20of%20the%20seventeenth%20century%20english%20lyra%20viol%20and%20the%20challenges%20of%20modern%20editing%20volume%201.pdf)). Tomando D2 como cuerda grave, varias coinciden con afinaciones que ya tenés. *Lyra way* es tu `g6`, *harp way sharp* es `openg` y *harp way flat* es `gminor`. Es un dato lindo para el `desc`: la Sol abierta del blues ya era el *harp way* de Simon Ives. Merriam-Webster define *harpway* de otra manera, como A-E-A-E-A-D ([M-W](https://www.merriam-webster.com/dictionary/harpway%20tunings)). Prefiero la tesis.

Atahualpa Yupanqui tiene una fuente oficial. Carlos Martínez, que grabó su obra completa para guitarra, cuenta que "Danza de la Luna" va en Re menor abierta y que en chacareras y gatos usaba sexta en Re con tercera en La, o sexta en Re con quinta en Sol ([Argentina.gob.ar](https://www.argentina.gob.ar/noticias/atahualpa-yupanqui-alma-de-la-guitarra-criolla-argentina)). Agrega que "grababa con la afinación más baja", así que sus discos pueden no estar en La 440. La **rondeña** flamenca (sexta a Re y tercera a Fa#) la estableció Ramón Montoya como pieza de concierto ([Wikipedia: Rondeña](https://en.wikipedia.org/wiki/Ronde%C3%B1a)). Tiene exactamente las mismas notas que el "Cyril's D" hawaiano. La afinación más conocida de Ali Farka Touré sube la 6.ª a Sol ([Guitar World](https://www.guitarworld.com/artists/guitarists/garba-toure-songhoy-blues-heritage), [ragajunglism](https://ragajunglism.org/tunings/menu/ali-farka-toure/)).

| Afinación | Notas 6→1 | Uso / obras | Fuente | Conf. | App | En tunings.ts |
|---|---|---|---|---|---|---|
| Viol way ("ffeff") | D2 G2 C3 E3 A3 D4 | consort de violas; = vihuela −2 | [tesis White Rose](https://etheses.whiterose.ac.uk/id/eprint/10511/1/An%20examination%20of%20the%20seventeenth%20century%20english%20lyra%20viol%20and%20the%20challenges%20of%20modern%20editing%20volume%201.pdf) | alta | OK | **nueva** |
| Lyra way ("fefhf") | D2 G2 D3 G3 B3 E4 | Ferrabosco 1609 | ídem | alta | OK | `g6` |
| Harp way sharp ("defhf") | D2 G2 D3 G3 B3 D4 | Playford, Simon Ives | ídem | alta | OK | `openg` |
| Harp way flat ("edfhf") | D2 G2 D3 G3 Bb3 D4 | Simon Ives, *Post Nag* | ídem | alta | OK | `gminor` |
| Eights ("fhfhf") | D2 G2 D3 G3 D4 G4 | Ferrabosco 1609 | ídem | media | OK+cuerdas | **nueva** (= `bebebe` +3) |
| Alfonso way ("ffhfh") | D2 A2 D3 A3 D4 G4 | Ferrabosco 1609 (traducción dudosa) | ídem | baja-media | OK+cuerdas | **nueva** |
| Laúd renacentista / vihuela en Sol | G2 C3 F3 A3 D4 G4 (nominal) | Milán, Narváez; = `vihuela` +3 (o `vihuela` con cejilla 3) | [Wikipedia: Lute](https://en.wikipedia.org/wiki/Lute), [Vihuela](https://en.wikipedia.org/wiki/Vihuela) | alta (intervalos) | OK+cuerdas | **nueva** |
| Guitarra rusa adaptada | D2 B2 D3 G3 B3 D4 / D2 G2 B2 G3 B3 D4 (Okudzhava tardío) | bardos rusos | [Wikipedia: Russian guitar](https://en.wikipedia.org/wiki/Russian_guitar) | media | OK | **nuevas** |
| Rusa adaptada (otras) | G2 B2 D3 G3 B3 D4 / D2 G2 D3 G3 B3 D4 (Rozenbaum) | bardos rusos | ídem | media | OK | `dobro` / `openg` |
| Yupanqui, Re menor | D2 A2 D3 F3 A3 D4 | Danza de la Luna | [Argentina.gob.ar](https://www.argentina.gob.ar/noticias/atahualpa-yupanqui-alma-de-la-guitarra-criolla-argentina) | alta | OK | `dminor` |
| Yupanqui, 6.ª Re y 3.ª La | D2 A2 D3 A3 B3 E4 | chacareras y gatos en Re (sin tema puntual) | ídem | alta (uso) | OK | **nueva** |
| Yupanqui, 6.ª Re y 5.ª Sol | D2 G2 D3 G3 B3 E4 | temas en Sol (sin tema puntual) | ídem | alta (uso) | OK | `g6` |
| Rondeña | D2 A2 D3 F#3 B3 E4 | rondeña de Ramón Montoya | [Wikipedia](https://en.wikipedia.org/wiki/Ronde%C3%B1a) | alta | OK | **nueva** (= D7 de slack-key) |
| Ali Farka Touré | G2 A2 D3 G3 B3 E4 | su afinación más conocida (sin tema puntual) | [Guitar World](https://www.guitarworld.com/artists/guitarists/garba-toure-songhoy-blues-heritage) | media | OK | **nueva** |
| Sexta en Re (clásica) | D2 A2 D3 G3 B3 E4 | Tárrega, Sor, Villa-Lobos (sin obra citada) | conocimiento general | — | OK | `dropd` |

## La lista para cargar: 74 afinaciones de 6 cuerdas que no están

Esta es la tabla para pegar en `tunings.ts`. Ya está deduplicada: cada fila es un juego de alturas MIDI que no coincide con ninguna de tus 74. Si dos fuentes dan las mismas notas, van en la misma fila. Saqué cuatro casos que conviene resolver como dato en una entrada existente: el DADGAD un tono abajo de Graham, el Kottke, el CGCFCE medio tono abajo de "Hanging on a Star" (que ya figura con "quizás medio tono abajo") y el C–E–G–C–E–G de Wikipedia. El grupo es una sugerencia dentro de tus grupos actuales. `conf` sigue tu convención: vacío si la fuente es fuerte, `fan` si es una lista de fans y `duda` si las fuentes se contradicen. Varias son transposiciones exactas de afinaciones que ya tenés, y eso lo aclaro en las notas.

| id sugerido | Notas | Grupo | Flags | heard (artista: tema, conf) | Fuente |
|---|---|---|---|---|---|
| nst12 | C2 G2 D3 A3 E4 A4 | regulares | restring | Robert Fripp (NST 1.2, 2012) | [Wikipedia](https://en.wikipedia.org/wiki/New_standard_tuning) |
| ostrichd2 | D2 D2 D3 D3 D4 D4 | zumbido | est, restring | Velvet Underground: All Tomorrow's Parties (duda: octavas) | [Wikipedia](https://en.wikipedia.org/wiki/Ostrich_guitar) |
| ebeeab | E2 B2 E3 E3 A3 B3 | estrechas | est | SY: Eric's Trip, Hey Joni, Rain King, Kissability (fan) | [Art Lee](https://acordesweb.com/cancion/sonic-youth/guitar-tunings) |
| eebebe | E2 E2 B2 E3 B3 E4 | estrechas | est, restring | SY: Brave Men Run, Ghost Bitch (fan) | ídem |
| eebfsbe | E2 E2 B2 F#3 B3 E4 | estrechas | est, restring | SY: Ghost Bitch, Ranaldo (fan) | ídem |
| ggccasas | G2 G2 C3 C3 A#3 A#3 | estrechas | est, restring | SY: I Love Her All the Time, Moore (fan) | ídem |
| ggddff | G2 G2 D3 D3 F3 F3 | estrechas | est, restring | SY: Mote (fan) | ídem |
| gsgsgsddsds | G#2 G#2 G#2 D3 D#3 D#3 | estrechas | est, restring | SY: White Cross, Moore (duda: octavas) | ídem |
| aaaabd | A2 A2 A3 A3 B3 D4 | estrechas | est, restring | SY: Justice Is Might, Moore (duda: "sin confirmar") | ídem |
| aaeeaa | A2 A2 E3 E3 A3 A3 | estrechas | est, restring | SY: Theresa's Sound-world, Ranaldo (fan); = `ggddgg` +2 | ídem |
| aaeefsa | A2 A2 E3 E3 F#3 A3 | estrechas | est, restring | SY: Justice Is Might, Ranaldo (fan) | ídem |
| dddDea | D2 D2 D3 D3 E3 A3 | estrechas | est, restring | SY: I'm Insane, Ranaldo (fan) | ídem |
| dsdscscsgg | D#2 D#2 C#3 C#3 G3 G3 | estrechas | est, restring | SY: I Love Her All the Time, Ranaldo (fan) | ídem |
| eebbefs | E2 E2 B2 B3 E4 F#4 | estrechas | est, restring | SY: Dirty Boots, Ranaldo (fan; desafinada sin cuantificar) | ídem |
| ccebgd | C2 C3 E3 B3 G3 D4 | estrechas | est, restring | SY: Cross the Breeze, Disappearer (duda: octavas) | ídem |
| dgcgcd | D2 G2 C3 G3 C4 D4 | modales | — | Led Zeppelin: The Rain Song (duda: inferida) | [Wikipedia](https://en.wikipedia.org/wiki/The_Rain_Song) |
| todoe | E2 E2 E3 E3 E3 E4 | zumbido | est, restring | Soundgarden: Mind Riot | [Guitar World](https://www.guitarworld.com/artists/guitarists/kim-thayil-on-the-time-chris-cornell-tuned-all-his-guitar-strings-to-e) |
| eebbbe | E2 E2 B2 B3 B3 E4 | zumbido | est | Soundgarden: My Wave, The Day I Tried to Live | ídem |
| cgcgge | C2 G2 C3 G3 G3 E4 | mayores | est | Soundgarden: Head Down, Burden in My Hand, Pretty Noose | [Guitar Player](https://www.guitarplayer.com/players/kim-thayil-my-career-in-six-songs) |
| ccdgad | C2 C3 D3 G3 A3 D4 | modales | — | Michael Hedges: Aerial Boundaries | [Moving the River](https://movingtheriver.com/tag/michaelhedges/) |
| abefsad | A2 B2 E3 F#3 A3 D4 | modales | est | Michael Hedges: Hot Type (fan) | [guitartabs.cc](https://www.guitartabs.cc/tabs/h/hedges_michael/various_tunings_tab.html) |
| cgdgbc | C2 G2 D3 G3 B3 C4 | extendidas | est | Michael Hedges: Rickover's Dream (fan) | ídem |
| cgdgac | C2 G2 D3 G3 A3 C4 | modales | est | Michael Hedges: Bensusan, cejilla 3 (fan) | ídem |
| eeeebe | E2 E2 E3 E3 B3 E4 | zumbido | est, restring | CSN: Suite: Judy Blue Eyes, Stills (duda) | [Guitar World](https://guitarworld.com/lessons/deft-fingerpicking-odd-tuning-riffage-stephen-stills) |
| ddddad | D2 D2 D3 D3 A3 D4 | zumbido | est, restring | CSN: Suite: Judy Blue Eyes (duda) | [Totally Guitars](https://totallyguitars.com/lessons/472-suite-judy-blue-eyes-guitar-lesson) |
| cgdfce | C2 G2 D3 F3 C4 E4 | modales | est | Joni: Coyote (fan) | [jonimitchell.com](https://jonimitchell.com/music/viewalltranscriptions.cfm) |
| cgdfgc | C2 G2 D3 F3 G3 C4 | modales | est | Joni: Hejira (fan) | ídem |
| cacfac | C2 A2 C3 F3 A3 C4 | mayores | est | Joni: Refuge of the Roads (fan) | ídem |
| cgbbebfbb | C2 G2 Bb2 Eb3 F3 Bb3 | modales | est | Joni: Woodstock (duda) | ídem |
| abebabcebb | Ab2 Ab2 Eb3 Ab3 C4 Eb4 | mayores | est | Joni: This Flight Tonight (fan) | ídem |
| cgeebe | C2 G2 E3 E3 B3 E4 | extendidas | est | Joni: Help Me (duda) | ídem |
| daefsacs | D2 A2 E3 F#3 A3 C#4 | extendidas | est | Joni: Help Me (duda) | ídem |
| csdcarey | C#2 C#3 C#3 C#3 G#3 C#4 | zumbido | est, restring | Joni: Carey (duda) | ídem |
| daddaa | D2 A2 D3 D3 A3 A3 | zumbido | est | Joni: Carey (duda) | ídem |
| ggdgbd | G2 G2 D3 G3 B3 D4 | mayores | est | Joni: Electricity, For the Roses, Hunter; Fahey: Desperate Man Blues (*Return of the Repressed*) | [Wikipedia](https://en.wikipedia.org/wiki/Open_tuning), [johnfahey.com](https://www.johnfahey.com/TuningsPage.htm) |
| d7open | D2 A2 D3 F#3 A3 C4 | extendidas | est | John Fahey: Uncloudy Day (intro) | [johnfahey.com](https://www.johnfahey.com/TuningsPage.htm) |
| cccgce | C2 C3 C3 G3 C4 E4 | mayores | est, restring | John Fahey: Dance of the Inhabitants of the Palace of King Philip XIV of Spain | ídem |
| dgdggd | D2 G2 D3 G3 G3 D4 | modales | est | John Fahey: I Am the Resurrection; slack-key G8 | ídem, [Dancing Cat](https://www.dancingcat.com/section-5-hawaiian-recordings-in-the-slack-key-tunings) |
| cgcdga | C2 G2 C3 D3 G3 A3 | modales | est | Martin Carthy: Lovely Joan | [The Afterword](https://theafterword.co.uk/come-sing-again-exploring-martin-carthys-new-old-album/) |
| dadeae | D2 A2 D3 E3 A3 E4 | modales | est | Martin Carthy (etapa intermedia) | ídem |
| aadgad | A2 A2 D3 G3 A3 D4 | modales | est | Steve Von Till | [Wikipedia DADGAD](https://en.wikipedia.org/wiki/DADGAD) |
| ebopen | Eb2 Bb2 Eb3 G3 Bb3 Eb4 | mayores | est | Allman Brothers: Little Martha; = `opend` +1 | [Wikipedia](https://en.wikipedia.org/wiki/Open_tuning) |
| dgcgbd | D2 G2 C3 G3 B3 D4 | modales | est | slack-key G2 (sin grabación) | [Dancing Cat](https://www.dancingcat.com/section-5-hawaiian-recordings-in-the-slack-key-tunings) |
| waianae | D2 G2 D3 F#3 B3 E4 | extendidas | est | slack-key G5 (sin grabación) | ídem |
| gmaunaloa | D2 G2 D3 D3 G3 D4 | modales | est | Sonny Chillingworth: Papakolea, Key Kaholu; Stephen Kauhane: Sanoe | ídem |
| eaeeae | E2 A2 E3 E3 A3 E4 | modales | est | Leonard Kwan: Ki Ho'alu | ídem |
| maori | D2 G2 D3 E3 G3 D4 | extendidas | est | Chillingworth y Kwan: Maori Brown Eyes | ídem |
| mahoe | C2 G2 D3 G3 G3 D4 | modales | est | Jim Kimo West: Isa Lei, Kohala No | ídem |
| alika | D2 G2 D3 D3 F#3 C#4 | extendidas | est | slack-key G10: My Yellow Ginger Lei | ídem |
| oldmaunaloa | D2 G2 D3 E3 A3 D4 | modales | est | Leonard Kwan: Old Mauna Loa, Noho Paipai | ídem |
| niihau | C2 G2 D3 E3 A3 D4 | modales | est | Sonny Chillingworth: Green Rose Hula | ídem |
| kilauea | D2 G2 C3 G3 B3 E4 | extendidas | est | Daniel Ho: Pearly Shells, Lahainaluna | ídem |
| g15 | D2 G2 D3 E3 B3 D4 | extendidas | est | Ozzie Kotani: Kona Hema | ídem |
| attac | C2 G2 E3 G3 C4 E4 | mayores | est | Atta Isaacs: Hualalai, Kohala March, Mele Li'i | ídem |
| samoanc | F2 G2 C3 G3 C4 E4 | extendidas | est | Sonny Chillingworth: Minoi Minoi E | ídem |
| c8 | G2 C3 D3 G3 B3 E4 | extendidas | est, restring | Robert Kaaiai: Moanalua, Nani Ka'ala | ídem |
| gabbyc | C2 G2 E3 G3 A3 E4 | extendidas | est | Gabby Pahinui: Aloha Ka Manini, Pua Kukui | ídem |
| cgcgae | C2 G2 C3 G3 A3 E4 | extendidas | est | "C Mauna Loa" según otras fuentes (duda: nombre) | [Winston PDF](https://www.georgewinston.com/userfiles/files/HSKBook4achart.pdf) |
| cadfsad | C2 A2 D3 F#3 A3 D4 | extendidas | est | Keola Beamer: Blue Water Dolphin | [Dancing Cat](https://www.dancingcat.com/section-5-hawaiian-recordings-in-the-slack-key-tunings) |
| anuenue | D2 A2 E3 F#3 A3 D4 | extendidas | est | slack-key D3 (sin grabación) | ídem |
| emerson | D2 A2 C#3 F#3 A3 C#4 | extendidas | est | Ken Emerson: Ua Kea | ídem |
| inglis | D2 A2 E3 F#3 C#4 D4 | extendidas | est | slack-key D6 (sin grabación) | ídem |
| rondena | D2 A2 D3 F#3 B3 E4 | drop | — | Ramón Montoya (rondeña); Cyril Pahinui: Salomila; Kapono Beamer: Pipeline Slack Key | [Wikipedia](https://en.wikipedia.org/wiki/Ronde%C3%B1a), [Dancing Cat](https://www.dancingcat.com/section-5-hawaiian-recordings-in-the-slack-key-tunings) |
| c6lap | C3 E3 G3 A3 C4 E4 | extendidas | est, restring | lap steel; Kuo e Isaacs: Lahaina Luna, Pua Lilia | [Wikipedia C6](https://en.wikipedia.org/wiki/C6_tuning) |
| a6lap | C#3 E3 F#3 A3 C#4 E4 | extendidas | est, restring | lap steel (sin tema) | [SIT Strings](https://sitstrings.com/lap-steel-tuning-chart/) |
| e7lap | B2 D3 E3 G#3 B3 E4 | extendidas | est, restring | lap steel (sin tema) | ídem |
| rusadb | D2 B2 D3 G3 B3 D4 | mayores | — | bardos rusos | [Wikipedia](https://en.wikipedia.org/wiki/Russian_guitar) |
| okudzhava | D2 G2 B2 G3 B3 D4 | mayores | — | Bulat Okudzhava (etapa tardía) | ídem |
| violway | D2 G2 C3 E3 A3 D4 | estandar | — | consort de violas; = `vihuela` −2 | [tesis](https://etheses.whiterose.ac.uk/id/eprint/10511/1/An%20examination%20of%20the%20seventeenth%20century%20english%20lyra%20viol%20and%20the%20challenges%20of%20modern%20editing%20volume%201.pdf) |
| eights | D2 G2 D3 G3 D4 G4 | modales | restring | Ferrabosco (1609); = `bebebe` +3 | ídem |
| alfonso | D2 A2 D3 A3 D4 G4 | modales | restring | Ferrabosco (1609) (duda: traducción) | ídem |
| laudsol | G2 C3 F3 A3 D4 G4 | estandar | restring | laúd renacentista, vihuela; = `vihuela` +3 | [Wikipedia: Lute](https://en.wikipedia.org/wiki/Lute) |
| dadabe | D2 A2 D3 A3 B3 E4 | drop | — | Atahualpa Yupanqui (chacareras y gatos en Re) | [Argentina.gob.ar](https://www.argentina.gob.ar/noticias/atahualpa-yupanqui-alma-de-la-guitarra-criolla-argentina) |
| alifarka | G2 A2 D3 G3 B3 E4 | extendidas | restring (la 6.ª sube una 3.ª menor) | Ali Farka Touré | [Guitar World](https://www.guitarworld.com/artists/guitarists/garba-toure-songhoy-blues-heritage) |

Las fuentes también traen **canciones nuevas para afinaciones que ya tenés**, y esas cuestan menos de cargar. Para `openc`: Fahey, "Sunflower River Blues", "On the Banks of the Owchita", "Sail Away Ladies", "A Raga Called Pat", y Cyril Pahinui con Brozman, "Hilo Hanakahi". Para `opend`: Fahey, "Poor Boy Long Ways from Home", "Siege of Sevastopol", "Orinda-Moraga"; Joni, "Chelsea Morning" (cejilla 2) y "Cactus Tree". Para `openg`: Fahey, "Desperate Man Blues" (*Blind Joe Death*), "On the Beach at Waikiki", "Night Train of Valhalla"; Robert Johnson, "Cross Road Blues" y "Come On in My Kitchen"; Keola Beamer, "Guava Tree". Para `gminor`: Fahey, "Dance of Death", "Come Back Baby", "Impressions of Susan". Para `dadgad`: Fahey, "Variations on the Coocoo", "Guitar Excursions into the Unknown"; Page, "Black Mountain Side"; Hedges, "Ragamuffin". Para `dminor`: Fahey, "Wine and Roses"; Yupanqui, "Danza de la Luna"; Skip James, "Devil Got My Woman". Para `dropd`: Fahey, "St. Louis Blues", "Days Have Gone By". Para `dstd`: Fahey, "900 Miles"; Drake, "Time of No Reply". Para `dropc`: Fahey, "America" (él la llama "Double Drop D"). Para `cmaj9`: Richard Thompson, "1952 Vincent Black Lightning" (cejilla 3), y Keola Beamer, "Holo Wa'apa". Para `cgdgbd`: Gabby Pahinui, "Makee 'Ailana". Para `cmaj7`: Gabby Pahinui, "Leaping Loli". Para `g6`: Keola Beamer, "Hi'ilawe". Para `gmaj7`: Pahinui e Isaacs, "Ka Ua Noe". Para `dmaj7`: Keola Beamer, "Kaula 'Ili". Para `c6`: Led Zeppelin, "Bron-Yr-Aur". Para `opene`: Derek Trucks, "Midnight in Harlem"; Rolling Stones, "Gimme Shelter". Para `eb`: Drake, "At the Chime of a City Clock" y "Horn".

Drake suma canciones a sus afinaciones según Thompson ([guitartabs.cc](https://guitartabs.cc/tabs/d/drake_nick/tunings_tab.html)). En `dadgdfs`: "The Thoughts of Mary Jane" (cejilla 1), "Hazey Jane I", "Parasite" (cejilla 2) y "Harvest Breed" (cejilla 1), más "Three Hours" e "Introduction" como dudosas. En `cgcfce`: "Ride". En `dgddad`: "Bryter Layter" (cejilla 3?) y "Sunday" (cejilla 1), las dos dudosas. En `dadgad`: "Day Is Done", dudosa. En `dadgdg`: "Man in a Shed", dudosa. En `dgdgad`: "I Was Made to Love Magic", dudosa.

## Diez datos de tunings.ts chocan con las fuentes y cuatro no tienen respaldo

El choque más claro es **"Bron-Yr-Aur"**. En `tunings.ts` figura en `openc` (C2 G2 C3 G3 C4 E4), pero Wikipedia y Guitar World la ponen en **C6 (C A C G C E)**, junto con "Friends" ([Wikipedia](https://en.wikipedia.org/wiki/Friends_(Led_Zeppelin_song)), [Guitar World](https://www.guitarworld.com/features/how-jimmy-page-redefined-the-role-of-acoustic-guitar-in-rock)). Habría que pasarla a `c6`. Le sigue **Soundgarden**. "Burden in My Hand" y "Pretty Noose" están en `openc` con la marca `duda` "varias tabs dicen CGCGGE", y el propio Thayil dice CGCGGE, aunque con un "I believe" ([Guitar Player](https://www.guitarplayer.com/players/kim-thayil-my-career-in-six-songs)). La duda ya no es entre tabs: la palabra del guitarrista apunta a otra afinación. Conviene moverlas a una entrada CGCGGE con "Head Down". **"Mind Riot"** no está en tu archivo, pero si en algún lado (Scordatura, o el encargo original) figura como EEBBBB, está mal: Thayil dice todas en E ([Guitar World](https://www.guitarworld.com/artists/guitarists/kim-thayil-on-the-time-chris-cornell-tuned-all-his-guitar-strings-to-e)).

Con **"Pink Moon"**, `tunings.ts` dice DADGDF# con cejilla 1 y `duda`. Eso coincide con Thompson, que la marca como transcrita en OLGA. La única contra es una nota de Far Out que la pone en CGCFCE y admite que "hay cierto debate" ([Far Out](https://faroutmagazine.co.uk/what-guitar-tuning-did-nick-drake-use/)). La marca de duda está bien, pero el peso de la evidencia está del lado de lo que cargaste. "Place to Be" en DADGAF# con cejilla 3 también coincide con la OLGA de Thompson. Dos datos de Drake no tienen respaldo en la lista: **"Free Ride"** en `cgcfce` no figura, y **BEBEBE** ("citada para su etapa final") no aparece en ninguna fuente de las notas.

Con el **Ostrich**, tu D3 D3 D3 D3 D4 D4 coincide con el "D-D-D-D-d-d" de Wikipedia. Pero la receta del mismo artículo (la 6.ª baja a D, la 5.ª baja a D, la 3.ª baja a D) da D2 D2 D3 D3 D4 D4 ([Wikipedia](https://en.wikipedia.org/wiki/Ostrich_guitar)). Subir la 6.ª de E2 a D3 es una séptima: solo funciona con encordado especial, cosa que ya marcás con `restring`. Las dos lecturas tienen que quedar visibles.

En **Joni Mitchell** hay cuatro conflictos de transcriptores, todos en [jonimitchell.com](https://jonimitchell.com/music/viewalltranscriptions.cfm). "Big Yellow Taxi" está en `cgcegc`, pero Thompson y Wright la dan en Re abierta con cejilla 2, y solo un transcriptor la pone en CGCEGC. "California" está en EAC#G#BE, que es la versión de Wright; Thompson dice Mi abierta. "A Case of You" en EADAAE es de Wright; otros la dan en estándar. "Both Sides, Now" está en `opend` **sin** marca, y las fuentes se reparten entre Re abierta con cejilla 4, DGDGBD, DGDGBE y estándar: tendría que llevar `duda`. Las tres primeras ya llevan `fan`. Lo que falta es poner la versión alternativa en `who`.

En el **blues** hay dos entradas sin marca que tienen pleito de tono. "Dust My Broom" está en `opend`, y Dummies dice Mi abierta ([Dummies](https://www.dummies.com/article/academics-the-arts/music/instruments/guitar/tuning-for-slide-guitar-standard-or-open-198120/)). "Hard Time Killin' Floor Blues" está en `dminor`, y Wikipedia la asocia al cross-note en Mi menor, EBEGBE ([Wikipedia](https://en.wikipedia.org/wiki/Open_tuning)), mientras Living Blues da Re menor. En el **folk británico**, "She Moved Through the Fair" de Davey Graham está en `dadgad`. Una sola fuente débil dice que en la toma de TV de 1963 tocaba CGCFGC con cejilla 2 ([ragajunglism](https://ragajunglism.org/tunings/menu/dadgad/)).

En **Sonic Youth** hay detalles de consistencia. "Hits of Sunshine" en `egdged` y "Karen Revisited" en `cgdgcd` no figuran en la lista de Art Lee: son posteriores a 1993 y no tienen fuente en las notas. Además, `gabdeg` (Teen Age Riot, Moore) sale de la misma lista de fans que las demás y no lleva `conf: 'fan'`. Por último, un aviso de nombres: si cargás el "America" de Fahey en `dropc`, ojo que él la llama "Double Drop D". Y la "Do abierta" de Fahey según Wikipedia (C–E–G–C–E–G) contradice la página oficial.

## Fuera de la guitarra de 6, el catálogo pide otro modelo de datos

### Cuerdas folk occidentales: bien medidas, pero con 4, 5 o 10 cuerdas

Estas afinaciones están bien documentadas con octavas, pero ninguna entra en el modelo actual: todas tienen otra cantidad de cuerdas, varias son reentrantes y algunas tienen órdenes partidos. Las agrupo en una tabla que queda lista para cuando la app acepte otros instrumentos.

| Instrumento | Afinación (orden físico) | Uso / obras | Fuente | Conf. | App |
|---|---|---|---|---|---|
| Bajo 4 | E1 A1 D2 G2; drop D1 A1 D2 G2; quintas C1 G1 D2 A2 (Red Mitchell desde 1966); tenor A1 D2 G2 C3; piccolo E2 A2 D3 G3 | Red Mitchell, Joel Quarrington (quintas) | [Wikipedia](https://en.wikipedia.org/wiki/Bass_guitar_tuning), [York U.](https://yorkspace.library.yorku.ca/items/3dbf27db-09f2-4ac4-b9d9-ab77d9842947) | alta | NO: 4 cuerdas |
| Bajo 5/6/7 | B0 E1 A1 D2 G2; E1 A1 D2 G2 C3; B0 E1 A1 D2 G2 C3; B0 E1 A1 D2 F#2 B2; B0…C3 F3 | Anthony Jackson, Garry Goodman | [Wikipedia](https://en.wikipedia.org/wiki/Bass_guitar_tuning) | alta/media | NO: 5–7 (el de 6 tiene otro registro) |
| Banjo 5 (5.ª primero, reentrante) | Open G G4 D3 G3 B3 D4; G-C G4 C3 G3 B3 D4; Double C G4 C3 G3 C4 D4; Sawmill G4 D3 G3 C4 D4; Open D F#4 D3 F#3 A3 D4; Double D A4 D3 A3 D4 E4; Open A A4 E3 A3 C#4 E4 | Double C: Arkansas Traveler, Soldier's Joy; Sawmill: The Cuckoo, Shady Grove (foro) | [Wikipedia](https://en.wikipedia.org/wiki/Banjo), [Deering](https://www.deeringbanjos.com/blogs/deering-banjos-blog/how-to-tune-your-banjo-to-double-c-tuning), [Banjo Hangout](https://www.banjohangout.org/archive/405411) | alta (notas), media (temas) | NO: 5 cuerdas, reentrante |
| Banjo tenor / plectro | C3 G3 D4 A4; irlandés G2 D3 A3 E4 (Barney McKenna); plectro C3 G3 B3 D4; Chicago D3 G3 B3 E4 | The Dubliners | [Wikipedia](https://en.wikipedia.org/wiki/Banjo) | alta | NO: 4 |
| Ukelele | G4 C4 E4 A4 (reentrante); low-G G3 C4 E4 A4; D A4 D4 F#4 B4; barítono D3 G3 B3 E4 (variante D4 reentrante, en disputa) | — | [MasterClass](https://www.masterclass.com/articles/how-to-use-reentrant-tuning-on-a-ukulele), [Ukulele Hunt](https://ukulelehunt.com/buy-ukulele/?p=340) | alta/media | NO: 4 |
| Mandolina y familia | mandolina G3 D4 A4 E5; mandola C3 G3 D4 A4; octava G2 D3 A3 E4; mandocello C2 G2 D3 A3 | — | [Wikipedia](https://en.wikipedia.org/wiki/Mandolin) | alta | NO: 4 órdenes |
| Mandolina cruzada (Monroe) | F#3/A3 D4/D4 A4/A4 A4/D5 o … A4/C#5 (**en disputa**); In Despair F#A DD AA EE | Get Up John; In Despair (1957) | [Wikipedia](https://en.wikipedia.org/wiki/Bluegrass_mandolin), [Tune Archive](https://tunearch.org/wiki/Talk:Get_Up_John), [Peghead Nation](https://www.pegheadnation.com/string-school/courses/monroe-style-mandolin/in-despair/) | media-baja | NO: órdenes partidos |
| Bouzouki | trichordo D3/D4 A3/A3 D4/D4; tetrachordo C3/C4 F3/F4 A3/A3 D4/D4 (Chiotis, "Thessaloniki mou", 1956); irlandés G2 D3 A3 D4 (Moynihan, Irvine, Lunny) | ídem | [Wikipedia](https://en.wikipedia.org/wiki/Bouzouki) | alta | NO |
| Violín cruzado (base G3 D4 A4 E5) | AEAE "Cross A"; ADAE "Old-Timey D"; DDAD "Dead Man's" (Bonaparte's Retreat, base de "Hoe-Down" de Copland); AEAC# "Calico" (Black Mountain Rag); GDGD "Sawmill"; FCGD cajún; GDAD; GDGB; AEAD; EDAE; EEAE; GCGE | ídem | [Wikipedia](https://en.wikipedia.org/wiki/Cross_tuning), [Tune Archive](https://tunearch.org/wiki/Bonaparte%27s_Retreat_(1)) | alta | NO: 4 |
| Hardanger | A-D-A-E; troll A-E-A-C# (fanitullen, Kivlemøyane); gorrlaus F-D-A-E; B-E-B-F#; C-F-C-G; más 4–5 simpáticas | ídem | [Wikipedia](https://en.wikipedia.org/wiki/Hardanger_fiddle) | alta (notas) | NO |
| Dulcémele apalache | D3 A3 A3 jónico; D3 A3 D4 mixolidio; D3 A3 C4 eólico; D3 G3 D4; C3 G3 G3; C3 G3 C4; C3 F3 C4 | Joni Mitchell en *Blue* (sin afinación) | [Wikipedia](https://en.wikipedia.org/wiki/Appalachian_dulcimer) | alta | NO: 3 |
| Pedal steel | E9: B D E F# G# B E G# D# F# (10 cuerdas); C6: C F A C E G A C E G | Bud Isaacs, "Slowly" (1953) | [Wikipedia](https://en.wikipedia.org/wiki/E9_tuning), [SIT](https://sitstrings.com/c6-pedal-steel-tuning-chart-notes-string-gauges-setup-guide/) | alta / media | NO: 10 |
| 12 cuerdas | E2+E3 A2+A3 D3+D4 G3+G4 B3+B3 E4+E4; Lead Belly en C (posiblemente B o A) | — | [Wikipedia](https://en.wikipedia.org/wiki/Twelve-string_guitar) | alta | parcial: 6 órdenes |
| Guitarra rusa 7 | D2 G2 B2 D3 G3 B3 D4; Okudzhava D2 G2 C3 D3 G3 B3 D4; Nikitin D2 G2 C3 D3 G3 Bb3 D4 | Sychra, Vysotsky (un tono abajo) | [Wikipedia](https://en.wikipedia.org/wiki/Russian_guitar) | alta | NO: 7 |
| Arpa de palancas | en Eb (de 3 bemoles a 4 sostenidos) o en C; Ab en el Reino Unido (**en disputa**) | — | [Harp Column](https://harpcolumn.com/forums/topic/tuning-in-c-or-eb/) | alta/media | NO: escala + tonalidad |

### Scordatura clásica: Biber inventa el problema de la cuerda cruzada

Las 16 sonatas del Rosario de Biber tienen afinación documentada ([Wikipedia](https://en.wikipedia.org/wiki/Rosary_Sonatas)). La XI cruza la 2.ª y la 3.ª cuerda, así que las notas sobre el puente quedan G3-G4-D4-D5, en un orden que no sube. Lo mismo pasa con la guitarra barroca reentrante y con la tiorba. Si la app algún día admite violín, tiene que aceptar orden físico no ascendente.

| Obra | Instrumento | Notas (grave→aguda, físico) | Fuente | Conf. |
|---|---|---|---|---|
| Biber, Rosario I y XVI | violín | G3 D4 A4 E5 (normal) | [Wikipedia](https://en.wikipedia.org/wiki/Rosary_Sonatas) | alta |
| Biber II / III / IV / V | violín | A3 E4 A4 E5 / B3 F#4 B4 D5 / A3 D4 A4 D5 / A3 E4 A4 C#5 | ídem | alta |
| Biber VI / VII / VIII / IX | violín | Ab3 Eb4 G4 D5 / C4 F4 A4 C5 / D4 F4 Bb4 D5 / C4 E4 A4 E5 | ídem | alta |
| Biber X / XI / XII | violín | G3 D4 A4 D5 / **G3 G4 D4 D5 (cruzada)** / C4 E4 G4 C5 | ídem, [Scordatura](https://en.wikipedia.org/wiki/Scordatura) | alta |
| Biber XIII / XIV / XV | violín | A3 E4 C#5 E5 / A3 E4 A4 D5 / G3 C4 G4 D5 | ídem | alta |
| Biber, *Harmonia artificiosa* I / VI | violines | A3 E4 A4 D5 *est* / normal | [notas del LP Harnoncourt](https://www.heinrichvontrotta.eu/Harnoncourt/Esordi/Musical-Heritage-Society/1965-MHS-1092-Biber.html) | media |
| Bach, Suite 5 BWV 1011 / Suite 6 BWV 1012 | chelo | C2 G2 D3 G3 / C2 G2 D3 A3 E4 (5 cuerdas) | [Scordatura](https://en.wikipedia.org/wiki/Scordatura) | alta / media |
| Vivaldi Op. 9 n.º 6 (RV 348, no 345) / n.º 12 RV 391 | violín | A3 D4 A4 E5 / B3 D4 A4 D5 *est* | ídem, [La cetra](https://en.wikipedia.org/wiki/La_cetra_(Vivaldi)), [IMSLP](https://imslp.org/wiki/Violin_Concerto_in_B_minor,_RV_391_(Vivaldi,_Antonio)) | alta / media |
| Pachelbel, *Musikalische Ergötzung* | 2 violines | C-F-C-F, C-G-C-F, Bb-E-Bb-Eb, B-E-B-E, Bb-F-Bb-Eb (5 patrones para 6 suites) | [Scordatura](https://en.wikipedia.org/wiki/Scordatura) | media |
| Mozart, *Sinfonia concertante* K. 364 | viola | Db3 Ab3 Eb4 Bb4 | ídem | alta |
| Mahler, Sinfonía 4, 2.º mov. | violín | A3 E4 B4 F#5 | [Mahler Foundation](https://www.mahlerfoundation.org/?p=381) | alta |
| Saint-Saëns, *Danse macabre* | violín | G3 D4 A4 Eb5 | [Scordatura](https://en.wikipedia.org/wiki/Scordatura) | alta |
| Paganini, Concierto 1 | violín | Ab3 Eb4 Bb4 F5 | ídem | alta |
| Haydn 60, final / Haydn 67, trío | violines | F3 D4 A4 E5 → G3 en mitad del movimiento / F3 D4 A4 E5 | ídem | alta / media |
| Bartók, *Contrasts*, 3.º mov. | violín | G#3 D4 A4 Eb5 | ídem | alta |
| Vecsey *Nuit du Nord*; Ysaÿe *Poème élégiaque*; Strauss *Heldenleben/Elektra/Salome*; Corigliano *Stomp* | violín | F#3 D4 A4 E5; F3 D4 A4 E5; F#3 D4 A4 E5 (genérico); E3 D4 A4 D#5 | ídem | media / baja |
| Strauss *Don Quixote*; Nielsen *Hymnus amoris*; Koechlin Op. 53; Frid Op. 25 | viola | B2 G3 D4 A4; A2 G3 D4 A4; Bb2 G3 D4 A4; C#3 G#3 D4 A4 | ídem | media |
| Kodály Op. 8; Crumb *Vox Balaenae*; Berio *Sequenza XIV*; Schumann **Cuarteto** Op. 47 (no el Quinteto); Berg *Suite lírica*; Hindemith Cuarteto 2; Respighi *Pinos*; Stravinsky *Consagración* | chelo | B1 F#2 D3 A3; B1 F#2 D#3 A3; C2 G#2 D3 A3; Bb1 G2 D3 A3; B1 G2 D3 A3; Bb1 G2 D3 A3; B1 G2 D3 A3; C2 G2 D3 G#3 | ídem | alta / media |
| Brahms *Réquiem*; Ravel *Ma mère l'Oye*; afinación solista | contrabajo | D1 A1 D2 G2; Eb1 A1 D2 G2; F#1 B1 E2 A2 | ídem | media / alta |
| Viola d'amore (Re mayor; Re menor de Vivaldi) | 7 cuerdas | A2 D3 A3 D4 F#4 A4 D5; A2 D3 A3 D4 F4 A4 D5 | [Wikipedia](https://en.wikipedia.org/wiki/Viola_d%27amore) | alta |
| Laúd renacentista 6/8/10 órdenes | laúd | G2/G3 C3/C4 F3 A3 D4 G4 (+ D2/D3, F2/F3; + C2, D2, Eb2) | [Wikipedia: Lute](https://en.wikipedia.org/wiki/Lute) | alta |
| Laúd barroco 13 órdenes (Weiss) | laúd | A1/A2 B1/B2 C2/C3 D2/D3 E2/E3 F2/F3 G2/G3 A2 D3 F3 A3 D4 F4 | ídem | alta |
| Guitarra barroca | 5 órdenes | Sanz: A3 D4 G3 B3 E4 (reentrante); de Visée: A3 D3/D4 G3 B3 E4; Guerau: A2/A3 D3/D4 G3 B3 E4 | [Wikipedia](https://en.wikipedia.org/wiki/Baroque_guitar) | alta |
| Tiorba | 14 órdenes | G1 A1 B1 C2 D2 E2 F2 G2 A2 D3 G3 B3 E3 A3 (deducida) | [Wikipedia](https://en.wikipedia.org/wiki/Theorbo) | media |

En guitarra clásica, la investigación solo confirmó que *Equinox* de Takemitsu usa scordatura ([tesis Flowers](https://openscholar.uga.edu/record/8537)) y que *Hika* de Brouwer reafina las cuatro cuerdas centrales ([researchcatalogue](https://researchcatalogue.net/view/1713579/1832098)). En ninguno de los dos casos hay notas.

### Mundo árabe, Turquía, Irán, Asia Central e India: la nota no alcanza

Acá la nota de 12-TET deja de servir. El oud se puede cargar como afinación de 6 órdenes ([Wikipedia: Oud](https://en.wikipedia.org/wiki/Oud)). Las presets razonables son el árabe actual **C2 F2 A2 D3 G3 C4**, el árabe antiguo D2 G2 A2 D3 G3 C4, el árabe alto F2 A2 D3 G3 C4 F4, el turco *bolahenk* **C#2 F#2 B2 E3 A3 D4** y el oud arbi, G3 E4 A3 D4, reentrante. Los cinco órdenes agudos van dobles al unísono, así que las alturas entran tal cual en tu modelo de 6 notas. Lo que falla es la intonación: Abu Shumays cuenta **al menos 12 mi distintos** dentro de la práctica egipcia, y los mi medio bemol se tocan más altos en Siria que en Egipto ([Abu Shumays 2009](https://maqamlessons.com/analysis/media/FuzzyBoundaries_MaqamIntonation2009.pdf)). La afinación de Munir Bashir existe con su nombre ([Wikipedia](https://www.Wikipedia.org/wiki/Munir_Bashir)), pero sus notas solo aparecen en foros contradictorios.

En el qanun, los *mandal* vienen de fábrica en cuartos de tono iguales en el árabe, en sextos de semitono (72 partes) en el turco y en semitonos en el armenio. El análisis de grabaciones muestra que esas divisiones no coinciden con la práctica ([Wikipedia: Qanun](https://en.wikipedia.org/wiki/Qanun_(instrument))). El bağlama tiene decenas de *düzen* en notación transpositora ([Wikipedia](https://en.wikipedia.org/wiki/Ba%C4%9Flama)): bağlama A3 D3 E3, bozuk A3 D3 G3, misket A3 D3 F#3, abdal A3 A3 G3, Kayseri A3 E3 A3, müstezat A3 D3 F3, rast A3 C4 G3, entre otros. La teoría oficial turca (AEU, 24 alturas sobre comas de Holder) no coincide con lo que miden Bozkurt y otros en grabaciones de maestros ([JNMR 2009](https://informahealthcare.com/doi/abs/10.1080/09298210903147673)).

| Instrumento | Afinación | Fuente | Conf. | App |
|---|---|---|---|---|
| Tar persa | melódicas C–G; bordón y bajo según el dastgah: Mahur y Chahargah C G C C; Homayun, Nava y Esfahan C G D D; Rast-Panjgah C F C C; Segah C G Akoron F; **Shur C G C F** (no "CGCC"); Bayat-e Tork C G Bb F | [Nassehpoor](https://www.parhamnassehpoor.com/persian-tar.html) | media | NO: órdenes y microtonos |
| Setar | C3/C4 · G3 · C4 (relativo) | [Wikipedia](https://en.wikipedia.org/wiki/Setar) | media | NO: 4 cuerdas |
| Segunda neutra persa | Vaziri 150; Barkeshli 120/180 (o 135/160, **en disputa**); Farhat 135/160; During 145; Kiani 144; Shur medido C0 D210 Ek347 F498 G696 Ak836 Bb985 | [Poorhaydari 2023](https://journal.iftawm.org/?p=2664), [Shafiei 2021](https://arxiv.org/pdf/2108.01283) | alta (rango) | NO: cents |
| Tercera neutra árabe | Zalzal 27/22 (354,5 c); al-Farabi 303/355/408 c; Sikah ~340–360 c (baja) | [Abu Shumays](https://maqamlessons.com/analysis/media/FuzzyBoundaries_MaqamIntonation2009.pdf), [Shafiei](https://arxiv.org/pdf/2108.01283) | media | NO |
| Tanpura | Pa-sa-sa-Sa; Ma-sa-sa-Sa; Dha/Ni-sa-sa-Sa (Marwa, Hindol); de 5 cuerdas con Ni | [Wikipedia](https://en.wikipedia.org/wiki/Tanpura) | alta | NO: relativa al Sa |
| Sitar | kharaj-pancham (Ravi Shankar, 7 tocables) frente a gandhar-pancham (Vilayat Khan, 6, chikari en Ga); lo que cambió Khan está **en disputa** | [Wikipedia](https://en.wikipedia.org/wiki/Sitar), [National Herald](https://www.nationalheraldindia.com/amp/story/music/vilayat-khan-the-king-of-strings) | media / media-baja | NO |
| Violín carnático | Sa Pa Sa Pa (por ejemplo E3 B3 E4 B4) | [Sunadam](https://www.sunadam.com/2016/03/14/how-to-tune-the-violin-for-carnatic-music/) | media | NO: 4 |
| Veena, sarod, sarangi | Sa-Pa alternados (la cuerda que lleva cada nota está **en disputa**); sarod Ma Sa Pa Sa; sarangi con 35–37 simpáticas | [Wikipedia veena](https://en.wikipedia.org/wiki/Saraswati_veena), [sarod](https://en.wikipedia.org/wiki/Sarod) | media-baja | NO |
| Intonación india medida | carnático más cerca de la entonación justa (r = 0,552) e indostaní más cerca del temperamento igual (r = 0,723); sin evidencia de los 22 shrutis | [Serrà et al. 2011](https://archives.ismir.net/ismir2011/paper/000008.pdf) | alta | NO |
| Dombra, dutar, komuz | dombra en 4.ª (D-G) o 5.ª; dutar A-D; komuz: Kambarkan d-a-d, Kerbez e-a-e, Shingrama d-a-e, Ongu e-a-b, Ters d-a-g (la del medio es la más aguda) | [Dombra](https://en.wikipedia.org/wiki/Dombra), [Dutar](https://en.wikipedia.org/wiki/Dutar), [Komuz](https://en.wikipedia.org/wiki/Komuz) | media | NO: 2–3 |

### Asia oriental, Sudeste Asiático y África: las escalas que nadie temperó

El guqin tiene una afinación estándar, **C D F G A c d**, que es relativa: históricamente no había altura fija. Sus *diao* alternativos tienen repertorio con nombre: ruibin, C D F G Bb c d, para *Xiao Xiang Shuiyun*; manjiao, C D E G A c d; manshang, C C F G A c d, para *Guangling San*; wuyi, Bb D F G Bb c d, para *Hujia Shiba Pai*, y otros ([Wikipedia: Guqin tunings](https://en.wikipedia.org/wiki/Guqin_tunings)). El shamisen se define por intervalos: honchōshi C–F–C, niagari C–G–C (la mayor parte del tsugaru) y sansagari C–F–Bb ([Bachido](https://community.bachido.com/t/lets-talk-tuning/4652)). Hirajōshi, en cambio, no tiene tónica acordada en la literatura occidental ([Wikipedia](https://en.wikipedia.org/wiki/Hiraj%C5%8Dshi_scale)). Para el geomungo, las cuerdas al aire en jeongak son Eb Ab Db Bb Bb Bb, y un espejo de Wikipedia da C en la 3.ª ([Wikipedia](https://en.wikipedia.org/wiki/Geomungo), [Wikiwand](https://wikiwand.com/en/articles/Komungo)).

En el gamelan, el promedio de sléndro de 76 juegos javaneses es **0, 231, 474, 717, 955, 1208 cents**, con la octava estirada ([Yahoo tuning list, citando a Sethares](https://yahootuninggroupsultimatebackup.github.io/tuning/topicId_6358.html), [Alves](https://pages.hmc.edu/alves/laras.html)). Cada gamelan tiene su propio *embat*. La "escala tailandesa de 7 partes iguales" (171,4 c) es una teoría de Ellis de 1885 que Garzoli propone abandonar ([AAWM 2015](https://journal.iftawm.org/previous/vol4no2/garzoli/)). El ombak balinés se mide en Hz de batido, no en cents: el gong ageng da unos 2,5–3 Hz ([BYU](https://physics.byu.edu/docs/thesis/171)). La kora tiene cuatro afinaciones heptatónicas que se definen por cómo colorean los intervalos: Tomora Ba, Hardino ("virtualmente la mayor occidental"), Tomora Mesengo y Sauta. Las notas de Folkways asignan piezas concretas: *Sutukung Kumbu Sora* y *Jembasengo* en Tomora Ba, *Tutu Jara* en Sauta ([Folkways FW 8514](https://folkways-media.si.edu/docs/folkways/artwork/FW08514.pdf)). Hay una contradicción a la vista: Kora Cafe equipara Silaba = Tomora Ba = Fa mayor de 12-TET ([Kora Cafe](https://thekoracafe.com/learn/tuning)), y para King la Tomora Ba es la más cercana a una escala justa. La mbira tiene nombres de afinación como Nyamaropa (parecida a mixolidio), Mavembe (frigio), Katsanzaira (dórico) y Dindinyongwe (locrio), pero sin cents ([mbira.org](https://mbira.org/learn-mbira/how-to-tune-your-mbira/)). En el amadinda, el ideal equipentatónico de 240 c se desvía hasta más de 60 c en los instrumentos reales ([African Music](https://journal.ru.ac.za/index.php/africanmusic/article/view/1948/1023)). Del Etiopía quedan los nombres de los cuatro qenet (tizita, bati, ambassel y anchihoye), sin intervalos ([Wikipedia](https://en.wikipedia.org/wiki/Qenet)).

### Latinoamérica e Iberia: reentrantes por todos lados

| Instrumento | Afinación (de arriba hacia abajo al tocar) | Uso | Fuente | Conf. | App |
|---|---|---|---|---|---|
| Charango, temple natural | G4 G4 · C5 C5 · E5/E4 · A4 A4 · E5 E5 *est* (reentrante, 3.er orden en octava) | Cavour, Núñez, Los Kjarkas | [Wikipedia ES](https://es.wikipedia.org/wiki/Charango) | alta (notas), media (octavas) | NO: 5 órdenes, reentrante |
| Temple diablo | D-G-B-E-B, sin octava | walaycho, chillador | ídem | media | NO |
| Chillador de Arequipa | C#-F#-C#-A-E (**contradice** al "temple diablo" del mismo artículo) | — | ídem | baja | NO |
| Ronroco (5 versiones) | D4 D4 · G4 G4 · B4 B3 · E4 E4 · B4 B4 (argentina/boliviana); G3 G3 · C3 C3 · E4 E3 · A3 A3 · E4 E4 (chilena, el C3 parece un error) y otras | Santaolalla usa una afinación en Mi menor **sin notas publicadas** ([Spitfire](https://www.spitfireaudio.com/en-us/products/ronroco-by-gustavo-santaolalla)) | [Wikipedia EN](https://en.wikipedia.org/wiki/Ronroco) | media | NO |
| Cuatro venezolano | A3 D4 F#4 B3 ("cambur pintón", reentrante) | Fredy Reyna, Hernán Gamboa, Cheo Hurtado, Cecilia Todd | [Wikipedia ES](https://es.wikipedia.org/wiki/Cuatro_venezolano), [EN](https://en.wikipedia.org/wiki/Cuatro_(instrument)) | alta | NO: 4 |
| Cuatro puertorriqueño / cubano | B3/B2 E4/E3 A3 D4 G4 / G4/G3 C4 E4 A4 | — | [Wikipedia](https://en.wikipedia.org/wiki/Cuatro_(instrument)) | media-alta | NO |
| Tiple colombiano | D4 D3 D4 · G4 G3 G4 · B4 B3 B4 · E4 E4 E4 (tradicional C F A D) | — | [Wikipedia](https://en.wikipedia.org/wiki/Tiple) | alta | NO |
| Tres cubano | G(8va)-B-E / G(8va)-C-E / A(8va)-D-F# | jarana tresera de Mono Blanco | [Wikipedia ES](https://es.wikipedia.org/wiki/Tres_cubano) | media-alta | NO: 3 |
| Jarana jarocha "por cuatro" | sol-do-mi-la-sol (reentrante); 4 órdenes GG CC EE AA (Son de Barro) | movimiento jaranero | [Wikipedia ES](https://es.wikipedia.org/wiki/Jarana_jarocha) | alta | NO |
| Viola caipira | cebolão en Mi B2/B3 E3/E4 G#3 B3 E4; rio abaixo G-D-G-B-D *est*; rio acima G-E-G-C-E *est* (Almir Sater); boiadeira y paraguaçu **en disputa** | Tião Carreiro (sin confirmar) | [Wikipedia PT](https://pt.wikipedia.org/wiki/Viola_caipira) | media / baja | NO: 5 órdenes |
| Cavaquinho | D G B D (Brasil); D G B E (solos); C G A D (Portugal); D A B E (antigua, Júlio Pereira) | Waldir Azevedo, Paulinho da Viola | [Wikipedia](https://en.wikipedia.org/wiki/Cavaquinho) | media-alta | NO: 4 |
| Violão de 7 | C2 E2 A2 D3 G3 B3 E4 (o B1/A1 en la 7.ª) | Dino 7 Cordas, Raphael Rabello, Yamandu Costa | [Wikipedia PT](https://pt.wikipedia.org/wiki/Viol%C3%A3o_de_sete_cordas) | alta | NO: 7 |
| Guitarra portuguesa | Lisboa en Re, Coimbra en Do (un tono abajo); notas por orden **no verificadas** | Paredes, Armandinho | [Wikipedia](https://en.wikipedia.org/wiki/Portuguese_guitar) | alta (nombres) | NO |
| Timple canario | G C E A D | — | [Wikipedia](https://en.wikipedia.org/wiki/Tiple) | media | NO: 5 |

### Temperamentos y La de referencia: tablas listas para el selector

Todos los temperamentos de teclado se reducen a 12 desvíos en cents. Las notas los calcularon por definición y contrastaron Werckmeister III con Wikipedia, con una diferencia de 0,1 c ([Wikipedia](https://en.wikipedia.org/wiki/Werckmeister_temperament)). Como tu afinador calibra contra el La, la columna útil es la del desvío con La = 0. La numeración de Werckmeister confunde: el "Werckmeister III" de uso corriente es el **primero** de sus temperamentos buenos.

| Temperamento (desvío con La = 0; C C# D Eb E F F# G G# A Bb B) | Conf. |
|---|---|
| Pitagórica: −5,9 +7,8 −2,0 −11,7 +2,0 −7,8 +5,9 −3,9 +9,8 0 −9,8 +3,9 | alta |
| Mesotónica 1/4 de coma: +10,3 −13,7 +3,4 +20,5 −3,4 +13,7 −10,3 +6,8 −17,1 0 +17,1 −6,8 | alta |
| Mesotónica 1/6 de coma: +4,9 −6,5 +1,6 +9,8 −1,6 +6,5 −4,9 +3,3 −8,1 0 +8,1 −3,3 | alta |
| Werckmeister I (III): +11,7 +2,0 +3,9 +5,9 +2,0 +9,8 0 +7,8 +3,9 0 +7,8 +3,9 | alta |
| Kirnberger III: +10,3 +0,5 +3,4 +4,4 −3,4 +8,3 +0,5 +6,8 +2,4 0 +6,4 −1,5 | media |
| Vallotti: +5,9 0 +2,0 +3,9 −2,0 +7,8 −2,0 +3,9 +2,0 0 +5,9 −3,9 | media |
| Young II: +5,9 −3,9 +2,0 0 −2,0 +3,9 −5,9 +3,9 −2,0 0 +2,0 −3,9 | media |
| Lehman 2005 ("Bach"): +5,9 +3,9 +2,0 +3,9 −2,0 +7,8 +2,0 +3,9 +3,9 0 +3,9 0 (Lindley y Ortgies la tildan de "historically wild") | media-baja |

Las notas traen además las mesotónicas de 1/3, 2/7 y 1/5 de coma, Kirnberger II y Kellner. La entonación justa pide guardar razones respecto de una tónica, no desvíos fijos. *The Well-Tuned Piano* de La Monte Young parte de Eb = 1/1 y llega hasta 63/32; tiene teclas en orden acústico invertido ([Wikipedia](https://en.wikipedia.org/wiki/The_Well-Tuned_Piano)). La escala de 43 notas de Partch es de límite 11 ([Wikipedia](https://en.wikipedia.org/wiki/Harry_Partch%27s_43-tone_scale)). En microtonalidad, *Flying Microtonal Banana* de King Gizzard (2017) está en 24-TET ([Wikipedia](https://en.wikipedia.org/wiki/Flying_Microtonal_Banana)). Las escalas alfa (78 c), beta (63,8 c) y gamma (35,1 c) de Wendy Carlos no repiten a la octava ([Wikipedia](https://en.wikipedia.org/wiki/Alpha_scale)), y la Bohlen-Pierce repite al tritavo 3:1, en 13 pasos de 146,3 c ([Wikipedia](https://en.wikipedia.org/wiki/Bohlen%E2%80%93Pierce_scale)). El *Preludio a Colón* de Carrillo baja hasta dieciseisavos de tono; su estreno figura en 1924 o 1925 según la fuente ([Wikipedia](https://en.wikipedia.org/wiki/Preludio_a_Col%C3%B3n)).

Para el selector de La, los valores con fuente son estos ([Wikipedia: Concert pitch](https://en.wikipedia.org/wiki/Concert_pitch)). **415**, el barroco por convención (los diapasones históricos van de 409 a 422,5). **430,54**, que es C = 256 en temperamento igual. **432**, que es 27/16 sobre C = 256 y que promovió el Instituto Schiller. **435**, el diapason normal francés del 16 de febrero de 1859. **440**, recomendado en 1939 y fijado como ISO 16 en 1975. Y **442–443**: Berlín usa hoy 443. Verdi sí defendió un La más bajo, pero no hay fuente archivística para "prefiero 432", y una carta de 1884 lo muestra apoyando el 435 ([Hollander](https://www.roelhollander.eu/en/432-tuning/giuseppe-verdi-435Hz-432Hz-256Hz/), [Cambridge](https://www.cambridge.org/core/product/916BC4B2B1E69D460158640DFAA95957/core-reader)). Si ponés el 432, rotulalo sin promesas curativas.

## Lo que quedó sin verificar, para no cargarlo a ciegas

En guitarra, las notas dejan sin fuente estos casos. De King Crimson después de 1985, no hay ningún disco confirmado en NST. De Page faltan "That's the Way", "Bron-Y-Aur Stomp", "In My Time of Dying" (que tenés en `opena` sin respaldo) y "Dancing Days". Slint, *Spiderland*: solo hay una reseña que dice estándar. De Sonic Youth no hay nada posterior a 1993. Joni: faltan "The Jungle Line", "Trouble Child", "Michael from Mountains" y el resto de `ffcgac`, y quedó sin leer la lista oficial por patrón. Del "Little Green" hay tres versiones en conflicto. Drake: no hay contraste canción por canción salvo "Pink Moon", y la octava de la 3.ª cuerda en DGDDAD sigue sin verificar. El Velvet: no hay fuente sobre bajar medio tono para la viola de Cale. Del American primitive no hay temas para Basho, Walker, Bull, Jones, Tyler, Blackshaw, Bachman ni Anderson. Del folk británico faltan Jansch ("Blackwaterside", "Angie", "Needle of Death"), Renbourn, Nic Jones, Gaughan, Denny y Martyn. Del blues faltan Son House, Patton, Bukka White, McDowell, Muddy Waters, Raitt y "Dark Was the Night". El último 17 % del catálogo de Dancing Cat (Ray Kane, las afinaciones en F y Bb) quedó sin leer. Y no se buscó a ninguno de los artistas de esta lista larga: Kaki King, Townshend, Buckley, Elliott Smith, Radiohead, My Bloody Valentine, Swans, Branca, Chatham, Big Black, Shellac, Pavement, Dinosaur Jr, Nirvana, Alice in Chains, Tool, Meshuggah, Black Sabbath, Polvo, Frusciante, Cooder (salvo un tema), Knopfler, Molina, Lenker, Bridgers, St. Vincent, Ben Howard, Bon Iver, José González, Tinariwen, Bombino y Paco de Lucía. Lo mismo pasa con el metal de 7 y 8 cuerdas.

En Latinoamérica e Iberia faltan las notas de muchas afinaciones con nombre. Del charango: temple transporte, quimsa y pascua, y la afinación de Jaime Torres. Del ronroco de "Iguazú" no hay afinación documentada. Faltan Falú, Spinetta, García y Cerati, las afinaciones traspuestas chilenas ("común por dos"), el guitarrón chileno, la guitarra ayacuchana de García Zárate y, de "Camino del indio", cualquier afinación especial. De Brasil faltan los temas de Tião Carreiro y Almir Sater. De México, la vihuela, el guitarrón, el bajo sexto, la huapanguera y el requinto; de los llanos, la bandola. En Iberia faltan las notas de la guitarra portuguesa, la bandurria y el laúd español. En el mundo árabe y Asia faltan las afinaciones de Sunbati, Farid al-Atrash, Brahem, Udi Hrant y el oud de 8 de Shamma (el PDF iraquí de Jasim, 2019, está sin leer). Faltan también la tabla de órdenes del qanun, el kemençe, el sitar cuerda por cuerda, las taraf por raga, la pipa, el erhu, el zhongruan, el guzheng, las 13 cuerdas del koto, el gayageum, el haegeum, los cents del pélog, la tasa de ombak del kebyar, el đàn tranh, el kulintang, los cents de la kora (King 1974), el repertorio de mbira por afinación, los qenet medidos, el ngoni, el balafón y la guitarra congoleña. En temperamentos faltan Neidhardt, Young I, Rameau, Marpurg y el tempérament ordinaire, las razones de la Bohlen-Pierce justa (las de memoria no se verificaron), las guitarras de Partch, Johnston, Riley y Harrison, la especificación oficial de `.scl` y los diapasones de 392 Hz y de Viena. En scordatura faltan las partitas II a V y VII de la *Harmonia artificiosa*, Westhoff, Strungk, Telemann, Lachenmann, Scelsi, Tartini y las notas de *Equinox*, *Hika*, Villa-Lobos y Barrios.

## Conclusión

La investigación cambia más el tipo de catálogo que su tamaño. Con 6 cuerdas en 12-TET podés pasar de 74 a unas 148 afinaciones sin tocar el modelo, y la parte más valiosa no son los nombres famosos sino los "de una persona": el C de Atta Isaacs, el Mahoe de Kimo West, el CGCDGA de Carthy, el Re menor de Yupanqui. Esas afinaciones solo existen porque alguien las documentó tema por tema. El hallazgo inesperado es la continuidad histórica. El *harp way* de la viola lyra del siglo XVII es la Sol abierta del blues, la rondeña de Montoya es el "Cyril's D" hawaiano, y "Eights" de Ferrabosco es tu BEBEBE una tercera más arriba. Eso pide que el `desc` cuente parentescos y no solo sonidos.

Para crecer más allá, la app necesita tres cosas, y conviene diseñarlas juntas. La primera es una cantidad de cuerdas variable con órdenes dobles o triples, para el oud, el charango, el banjo y la 12 cuerdas. La segunda es un orden físico no ascendente, para Biber XI, las reentrantes y la guitarra barroca. La tercera es un desvío en cents relativo a una tónica móvil, para el maqam, el dastgah, el gamelan, los temperamentos y la entonación justa. Con la tercera también se podrían cargar las afinaciones "ligeramente alteradas" de Sonic Youth el día que alguien mida sus cents. La lección de honestidad que dejan las fuentes es esta: en casi todo lo que no es guitarra occidental, la afinación "correcta" es un rango o una costumbre local. Lo que el afinador debería mostrar es la referencia elegida, no una verdad.
