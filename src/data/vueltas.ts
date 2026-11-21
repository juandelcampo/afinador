// Vueltas de cuatro acordes para arrancar, agrupadas como en Rikky Rooksby, "How to Write Songs on
// Guitar" (capítulo 3). Están en grados: "IImaj" es el II en mayor, "IVm" el IV en menor, "bVII" el
// séptimo bajado. Los temas son ejemplos del libro, para ir a escucharlos.
// Rooksby avisa que repetir una vuelta todo el tema es lo más perezoso que hay: son para arrancar y romperlas.

export type VueltaMode = 'mayor' | 'menor';

export interface VueltaGroup {
  id: string;
  title: string;
  intro: string;
  mode: VueltaMode;
}

export interface Vuelta {
  id: string;
  group: string;
  degrees: string[];
  why?: string;
  songs: string[];
}

export const VUELTA_GROUPS: readonly VueltaGroup[] = [
  {
    id: 'firmes',
    title: 'Del I al V',
    intro: 'Arrancan en el I y terminan en el V: la tonalidad queda firme y la energía sube.',
    mode: 'mayor',
  },
  {
    id: 'relativo',
    title: 'Con el II en lugar del IV',
    intro: 'Cambian el IV por su relativo menor, o lo mueven de lugar.',
    mode: 'mayor',
  },
  {
    id: 'blandas',
    title: 'Con el V en el medio',
    intro: 'Cuando el V va segundo y el IV queda último, suena más blando y menos seguro.',
    mode: 'mayor',
  },
  {
    id: 'menores',
    title: 'Menores que bajan',
    intro: 'Los acordes menores en fila, para abajo o para arriba: melancólicas.',
    mode: 'mayor',
  },
  {
    id: 'polaridad',
    title: 'Al revés',
    intro: 'Un menor se vuelve mayor (o al revés): insinúan un cambio de tono que no llega.',
    mode: 'mayor',
  },
  {
    id: 'duras',
    title: 'Con bemoles',
    intro: 'Casi todos mayores, con ♭III, ♭VI y ♭VII: la fórmula del rock más duro.',
    mode: 'mayor',
  },
  {
    id: 'menor',
    title: 'En menor',
    intro: 'Vueltas en tonalidad menor. El I VII VI en cualquier dirección domina el pop y el rock.',
    mode: 'menor',
  },
  {
    id: 'exoticas',
    title: 'Exóticas',
    intro: 'Poco comunes: una sola alcanza para darle otro gusto a un tema.',
    mode: 'mayor',
  },
];

export const VUELTAS: readonly Vuelta[] = [
  {
    id: 'i-ii-iv-v',
    group: 'firmes',
    degrees: ['I', 'II', 'IV', 'V'],
    why: 'Va a un menor y se arrepiente: vuelve al mayor que tranquiliza.',
    songs: ['Love Is All Around', 'Fall On Me'],
  },
  {
    id: 'i-iii-iv-v',
    group: 'firmes',
    degrees: ['I', 'III', 'IV', 'V'],
    why: 'Sube de a un grado, con un menor de paso.',
    songs: ['Have I Told You Lately', "Let's Get It On"],
  },
  {
    id: 'i-vi-iv-v',
    group: 'firmes',
    degrees: ['I', 'VI', 'IV', 'V'],
    why: 'La madre de todas las vueltas pop. Hoy suena gastada: probala desplazada (IV V I VI).',
    songs: ['Stand By Me', 'Every Breath You Take'],
  },
  {
    id: 'i-vi-v-iv',
    group: 'firmes',
    degrees: ['I', 'VI', 'V', 'IV'],
    why: 'La anterior con los dos últimos cambiados: baja en vez de subir.',
    songs: ['Purple Rain', 'Two Princes'],
  },
  {
    id: 'i-iv-vi-v',
    group: 'firmes',
    degrees: ['I', 'IV', 'VI', 'V'],
    songs: ['More Than A Feeling', 'Talking About A Revolution'],
  },
  {
    id: 'i-vi-ii-v',
    group: 'firmes',
    degrees: ['I', 'VI', 'II', 'V'],
    why: 'Pariente de I VI IV V; sirve para reemplazarla.',
    songs: ['Hungry Heart', 'This Boy'],
  },
  { id: 'i-iii-vi-v', group: 'firmes', degrees: ['I', 'III', 'VI', 'V'], songs: ["I Think We're Alone Now"] },
  {
    id: 'ii-iii-iv-v',
    group: 'firmes',
    degrees: ['II', 'III', 'IV', 'V'],
    why: 'Suspenso: el I se guarda para otra parte. Muy buena antes de un estribillo.',
    songs: ['Heatwave', 'Everybody Wants To Rule The World'],
  },

  {
    id: 'i-iii-ii-v',
    group: 'relativo',
    degrees: ['I', 'III', 'II', 'V'],
    songs: ['Where Do You Go To My Lovely?'],
  },
  {
    id: 'i-iv-ii-v',
    group: 'relativo',
    degrees: ['I', 'IV', 'II', 'V'],
    songs: ['More Than This', "Don't Turn Around"],
  },
  {
    id: 'i-iv-iii-v',
    group: 'relativo',
    degrees: ['I', 'IV', 'III', 'V'],
    why: 'La caída del IV al III duele; la subida al V la rescata.',
    songs: ['A Little Bit Me, A Little Bit You'],
  },
  { id: 'i-vi-iii-v', group: 'relativo', degrees: ['I', 'VI', 'III', 'V'], songs: ['She Loves You'] },
  {
    id: 'i-iv-ii-bvii',
    group: 'relativo',
    degrees: ['I', 'IV', 'II', 'bVII'],
    songs: ["What's The Frequency, Kenneth?"],
  },

  {
    id: 'i-v-vi-iv',
    group: 'blandas',
    degrees: ['I', 'V', 'VI', 'IV'],
    why: 'La más popular de este grupo.',
    songs: ['With Or Without You', 'No Woman No Cry'],
  },
  {
    id: 'i-v-ii-iv',
    group: 'blandas',
    degrees: ['I', 'V', 'II', 'IV'],
    songs: ['Driftwood', 'Walking On The Moon'],
  },
  {
    id: 'i-v-iv-ii',
    group: 'blandas',
    degrees: ['I', 'V', 'IV', 'II'],
    songs: ['The Day We Caught The Train'],
  },
  {
    id: 'i-vi-iv-iii',
    group: 'blandas',
    degrees: ['I', 'VI', 'IV', 'III'],
    why: 'El V cambiado por su relativo, el III.',
    songs: ['True'],
  },

  {
    id: 'i-iv-iii-ii',
    group: 'menores',
    degrees: ['I', 'IV', 'III', 'II'],
    why: 'Triste por los menores que bajan. Toda en quintas se vuelve punk.',
    songs: ['Day After Day', 'Long Long Long'],
  },
  {
    id: 'i-ii-iii-iv',
    group: 'menores',
    degrees: ['I', 'II', 'III', 'IV'],
    why: 'Sube de a un paso. Con séptimas (maj7, m7) es un truco clásico del soul.',
    songs: ['Here There And Everywhere'],
  },
  { id: 'i-iii-vi-iv', group: 'menores', degrees: ['I', 'III', 'VI', 'IV'], songs: ['A Day In The Life'] },
  { id: 'i-ii-vi-iii', group: 'menores', degrees: ['I', 'II', 'VI', 'III'], songs: ['Daysleeper'] },

  {
    id: 'i-iimaj-iv-v',
    group: 'polaridad',
    degrees: ['I', 'IImaj', 'IV', 'V'],
    why: 'Efecto pop de los 60.',
    songs: ['As Time Goes By'],
  },
  {
    id: 'i-iv-iimaj-v',
    group: 'polaridad',
    degrees: ['I', 'IV', 'IImaj', 'V'],
    why: 'Suena a que cambiaste al tono del V. Con V7 se disimula.',
    songs: ['Shop Around'],
  },
  {
    id: 'i-iiimaj-iv-ivm',
    group: 'polaridad',
    degrees: ['I', 'IIImaj', 'IV', 'IVm'],
    why: 'Un mayor que no debería estar y un IV que se apaga a menor.',
    songs: ['Creep'],
  },
  {
    id: 'i-iiimaj-vi-iv',
    group: 'polaridad',
    degrees: ['I', 'IIImaj', 'VI', 'IV'],
    songs: ["She's Electric"],
  },
  {
    id: 'i-iv-ivm-v',
    group: 'polaridad',
    degrees: ['I', 'IV', 'IVm', 'V'],
    why: 'Romántica e impredecible a la vez.',
    songs: [],
  },
  {
    id: 'i-vi-iv-iiimaj',
    group: 'polaridad',
    degrees: ['I', 'VI', 'IV', 'IIImaj'],
    songs: ["Don't Dream It's Over"],
  },
  {
    id: 'i-iiimaj-iv-iimaj',
    group: 'polaridad',
    degrees: ['I', 'IIImaj', 'IV', 'IImaj'],
    why: 'Llena de sorpresas.',
    songs: ["(Sittin' On) The Dock Of The Bay"],
  },

  {
    id: 'i-biii-iv-v',
    group: 'duras',
    degrees: ['I', 'bIII', 'IV', 'V'],
    why: 'Sube como I III IV V pero suena más dura.',
    songs: [],
  },
  {
    id: 'i-bvii-iv-v',
    group: 'duras',
    degrees: ['I', 'bVII', 'IV', 'V'],
    why: 'Muy circular.',
    songs: ['Champagne Supernova'],
  },
  {
    id: 'i-v-bvii-iv',
    group: 'duras',
    degrees: ['I', 'V', 'bVII', 'IV'],
    songs: ['Turning Japanese', 'You Make Me Feel Like A Natural Woman'],
  },
  { id: 'i-bvii-biii-iv', group: 'duras', degrees: ['I', 'bVII', 'bIII', 'IV'], songs: ['Pinball Wizard'] },
  { id: 'i-iv-bvi-bvii', group: 'duras', degrees: ['I', 'IV', 'bVI', 'bVII'], songs: ['Desperate People'] },
  {
    id: 'i-biii-v-bvii',
    group: 'duras',
    degrees: ['I', 'bIII', 'V', 'bVII'],
    why: 'Mucha energía para arriba.',
    songs: ['Going For The One'],
  },
  {
    id: 'i-bvii-iv-i',
    group: 'duras',
    degrees: ['I', 'bVII', 'IV', 'I'],
    why: 'Tres acordes y muchísimo rock: llega al I sin pasar por el V.',
    songs: ['Gloria', "Won't Get Fooled Again"],
  },
  {
    id: 'bvi-bvii-i',
    group: 'duras',
    degrees: ['bVI', 'bVII', 'I', 'I'],
    why: 'Otra forma de llegar al I que no es desde el V.',
    songs: ['Lady Madonna', 'Kiss From A Rose'],
  },

  {
    id: 'm-i-vii-vi-v',
    group: 'menor',
    degrees: ['I', 'VII', 'VI', 'V'],
    why: 'Muy común: baja de a un paso.',
    songs: ['Like A Hurricane'],
  },
  {
    id: 'm-i-vii-vi-vmaj',
    group: 'menor',
    degrees: ['I', 'VII', 'VI', 'Vmaj'],
    why: 'La versión popular, con el V mayor que pide volver.',
    songs: ['Sultans Of Swing', 'Good Vibrations'],
  },
  {
    id: 'm-i-iii-vii-ivmaj',
    group: 'menor',
    degrees: ['I', 'III', 'VII', 'IVmaj'],
    songs: ['Wonderwall', 'Run To You'],
  },
  {
    id: 'm-i-iii-vi-vii',
    group: 'menor',
    degrees: ['I', 'III', 'VI', 'VII'],
    why: 'Sube con fuerza.',
    songs: ['Breathing'],
  },
  { id: 'm-i-vi-vii-iv', group: 'menor', degrees: ['I', 'VI', 'VII', 'IV'], songs: ['Message In A Bottle'] },
  { id: 'm-i-iv-vii-vmaj', group: 'menor', degrees: ['I', 'IV', 'VII', 'Vmaj'], songs: ['Fame'] },
  { id: 'm-i-vi-iii-vii', group: 'menor', degrees: ['I', 'VI', 'III', 'VII'], songs: ['The Passenger'] },
  { id: 'm-i-vi-ivmaj-vii', group: 'menor', degrees: ['I', 'VI', 'IVmaj', 'VII'], songs: ['Queen'] },

  { id: 'x-i-im-vm-iv', group: 'exoticas', degrees: ['I', 'Im', 'Vm', 'IV'], songs: ["La Femme D'Argent"] },
  { id: 'x-i-iii-bvii-ii', group: 'exoticas', degrees: ['I', 'III', 'bVII', 'II'], songs: ['Lay Lady Lay'] },
  {
    id: 'x-i-iv-biii-bvi',
    group: 'exoticas',
    degrees: ['I', 'IV', 'bIII', 'bVI'],
    why: 'Mitad en un tono y mitad en otro: ambigua, dislocada.',
    songs: ['Smells Like Teen Spirit'],
  },
  {
    id: 'x-i-bvi-v-iiimaj',
    group: 'exoticas',
    degrees: ['I', 'bVI', 'V', 'IIImaj'],
    songs: ['Wuthering Heights'],
  },
  {
    id: 'x-i-bvii-bvi-vm',
    group: 'exoticas',
    degrees: ['I', 'bVII', 'bVI', 'Vm'],
    songs: ['The Sensual World'],
  },
];
