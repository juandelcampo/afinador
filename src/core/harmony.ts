// Armonía por emociones. Las escalas, los grados con lo que suele sentir la mayoría, los acordes de
// color, las cadencias finales y los puntos cardinales salen de Mauro De María, "Composición integral"
// (capítulos 1 a 8). Las palabras de cada grado son las suyas; él mismo aclara que la armonía es solo
// una de las catorce dimensiones de la música y que todo enlace vale si sabés qué emoción elegís.
// Lo que dicen los colores sus2, 5, 7sus4 y las dos sextas menores sale de Rikky Rooksby, "How to Write
// Songs on Guitar" (capítulos 2 y 9).
import { noteLabel, type Notation } from './notes';

// ---------------------------------------------------------------- acordes

/** Los acordes que se nombran acá: sufijo y pasos en semitonos desde la raíz. */
export const CHORD_STEPS: Record<string, readonly number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  'm(maj7)': [0, 3, 7, 11],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  '9': [0, 4, 7, 10, 14],
  '7b9': [0, 4, 7, 10, 13],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  '5': [0, 7],
  '7sus4': [0, 5, 7, 10],
  add9: [0, 2, 4, 7],
  madd9: [0, 2, 3, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  'm(b6)': [0, 3, 7, 8],
  '(b3)': [0, 3, 4, 7],
  // Las tríadas raras que salen de las escalas exóticas: mayor con la quinta baja, y una segunda con quinta baja.
  '(b5)': [0, 4, 6],
  'sus2(b5)': [0, 2, 6],
  // Los que aparecen al poner los dedos sin pensar, para nombrarlos en ¿Qué acorde?.
  maj9: [0, 4, 7, 11, 14],
  m9: [0, 3, 7, 10, 14],
  add11: [0, 4, 7, 17],
  m11: [0, 3, 7, 10, 14, 17],
  '69': [0, 4, 7, 9, 14],
  '7b5': [0, 4, 6, 10],
  // Los extendidos con color de Inversiones: el "Hendrix" (la ♯9 contra la 3 mayor) y el maj7 lidio.
  '7#9': [0, 4, 7, 10, 15],
  'maj7#11': [0, 4, 7, 11, 18],
};

export type Suffix = keyof typeof CHORD_STEPS;

export interface Chord {
  /** Clase de altura de la raíz, 0 = Do. */
  root: number;
  suffix: Suffix;
  /** Clase de altura del bajo, si no es la raíz (una inversión). */
  bass?: number;
}

/** Cómo se lee cada sufijo al lado del grado, como en el libro: V7, III5+, VII7dim. */
const DEGREE_SUFFIX: Record<string, string> = {
  '': '',
  m: 'm',
  dim: 'dim',
  aug: '5+',
  '7': '7',
  maj7: 'maj7',
  m7: 'm7',
  'm(maj7)': 'm(maj7)',
  m7b5: 'm7♭5',
  dim7: '7dim',
  '9': '9',
  '7b9': '7♭9',
  sus4: 'sus4',
  sus2: 'sus2',
  '5': '5',
  '7sus4': '7sus4',
  add9: 'add9',
  madd9: 'madd9',
  '6': '6',
  m6: 'm6',
  'm(b6)': 'm(♭6)',
  '(b3)': '(♭3)',
  '(b5)': '(♭5)',
  'sus2(b5)': 'sus2(♭5)',
  maj9: 'maj9',
  m9: 'm9',
  add11: 'add11',
  m11: 'm11',
  '69': '6/9',
  '7b5': '7♭5',
  '7#9': '7♯9',
  'maj7#11': 'maj7♯11',
};

/** Cómo se escribe el sufijo en el nombre del acorde. */
const NAME_SUFFIX: Record<string, string> = { ...DEGREE_SUFFIX, aug: 'aug', dim7: 'dim7' };

/** Cómo se escribe el sufijo al lado de la nota: m7♭5, 6/9, aug. */
export const suffixSymbol = (suffix: Suffix) => NAME_SUFFIX[suffix] ?? suffix;

const mod12 = (value: number) => ((value % 12) + 12) % 12;

export const chordClasses = (chord: Chord): number[] => [
  ...new Set(CHORD_STEPS[chord.suffix]!.map((step) => mod12(chord.root + step))),
];

export const sameChord = (a: Chord, b: Chord) =>
  a.root === b.root && a.suffix === b.suffix && (a.bass ?? a.root) === (b.bass ?? b.root);

/** Si el acorde suena mayor o menor por su tercera, o ninguna de las dos. */
export function chordColor(suffix: Suffix): 'major' | 'minor' | 'other' {
  const steps = CHORD_STEPS[suffix]!;
  if (steps.includes(3) && steps.includes(4)) return 'other';
  // Disminuidos y semidisminuidos: ni alegres ni tristes, raros.
  if (steps.includes(6) && !steps.includes(7)) return 'other';
  if (steps.includes(4)) return 'major';
  if (steps.includes(3)) return 'minor';
  return 'other';
}

// ---------------------------------------------------------------- nombres de notas

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
/** Cómo se escribe cada clase de altura cuando no hay escala que diga otra cosa. */
const PLAIN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const SHARP_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

/** Nombre de una nota con una letra y a lo sumo una alteración, o null si haría falta doble. */
export function spellWithLetter(pc: number, letterIndex: number): string | null {
  const letter = LETTERS[((letterIndex % 7) + 7) % 7]!;
  const diff = mod12(pc - LETTER_PC[((letterIndex % 7) + 7) % 7]!);
  if (diff === 0) return letter;
  if (diff === 1) return letter + '#';
  if (diff === 11) return letter + 'b';
  return null;
}

export type Accidental = '#' | 'b';
const ALL_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ALL_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Cómo se escribe la raíz de un acorde. En las teclas negras manda lo que se eligió; si no se eligió nada,
 * la tonalidad más común del acorde: D♭, E♭, F#, A♭ y B♭ los mayores, C#, E♭, F#, G# y B♭ los menores (y
 * los disminuidos, que tienen tercera menor).
 */
export function rootSpelling(pc: number, suffix: Suffix, prefer?: Accidental | null): string {
  const index = mod12(pc);
  if (prefer) return (prefer === '#' ? ALL_SHARPS : ALL_FLATS)[index]!;
  const steps = CHORD_STEPS[suffix] ?? [];
  const minorish = steps.includes(3) && !steps.includes(4);
  return (minorish ? SHARP_KEYS : PLAIN)[index]!;
}

/** Si en la tecla negra de esa raíz se lee sostenido o bemol, o null si es una tecla blanca. */
export function rootAccidental(pc: number, suffix: Suffix, prefer?: Accidental | null): Accidental | null {
  const name = rootSpelling(pc, suffix, prefer);
  return name.length > 1 ? (name[1] as Accidental) : null;
}

/**
 * Una nota del acorde escrita a partir de la letra de su raíz, según qué grado es: la 3 de E es G#, la ♭7
 * de F es E♭, la 3 de C# es E#. Si hiciera falta una doble alteración, va la nota más simple.
 */
export function spellTone(pc: number, rootName: string, degree: string): string {
  const number = degree === 'R' ? 1 : Number(degree.replace(/[^0-9]/g, ''));
  const letter = LETTERS.indexOf(rootName[0] as (typeof LETTERS)[number]);
  if (!number || letter < 0) return PLAIN[mod12(pc)]!;
  return spellWithLetter(mod12(pc), letter + number - 1) ?? PLAIN[mod12(pc)]!;
}

/** El nombre de una clase de altura en la notación elegida. */
export function pitchName(name: string, notation: Notation): string {
  return noteLabel(`${name}4`, notation);
}

// ---------------------------------------------------------------- escalas

export type Feeling = 'alegre' | 'triste' | 'raro';

export interface DegreeFeeling {
  feeling: Feeling;
  /** De 1 a 5: cuánto. ALEGRE ++ es 2. */
  amount: number;
  words: string[];
}

/** Sin punta (∩): sin sensible, no empuja. Con punta (↑): una nota que pide resolver. */
export type Point = 'sin' | 'con' | 'color' | 'inestable';

export interface Scale {
  id: string;
  name: string;
  /** Otro nombre, el de su modo. */
  alias?: string;
  family: 'tonal' | 'modo' | 'pentatonica' | 'exotica' | 'jazz' | 'simetrica';
  point: Point;
  /** El carácter, en palabras de De María. */
  character: string;
  steps: readonly number[];
  /** Grados (desde 0) que llevan séptima en la tabla del libro: V7, VII7dim. */
  sevenths: readonly number[];
  /** Lo que suele sentir la mayoría con cada grado. Solo para las cuatro escalas de la p. 39. */
  feelings?: readonly DegreeFeeling[];
  /** Los grados que dan el color del modo: si no aparecen, suena a mayor o a menor común. */
  characteristic?: readonly number[];
  /** El acorde disminuido que tira hacia otra tónica: conviene usarlo poco o nada. */
  risky?: number;
  /** Si la tónica se escribe como en las tonalidades menores (C#, G#) o mayores (Db, Ab). */
  minorSpelling: boolean;
  /**
   * En las que no son de siete notas: qué grado de la escala mayor es cada paso (0 la tónica, 2 la
   * tercera…), para escribirlo con su letra. Lo calcula Escalas, así las dos herramientas dicen lo mismo.
   */
  letters?: readonly number[];
}

const f = (feeling: Feeling, amount: number, ...words: string[]): DegreeFeeling => ({
  feeling,
  amount,
  words,
});

const MINOR_I = f('triste', 1, 'Introspectivo', 'Íntimo', 'Melancólico', 'Nostálgico');

export const SCALES: readonly Scale[] = [
  {
    id: 'mayor',
    name: 'Mayor',
    alias: 'Jónico',
    family: 'tonal',
    point: 'con',
    character: 'Positivo, alegre, conclusivo, sólido, de festejo.',
    steps: [0, 2, 4, 5, 7, 9, 11],
    sevenths: [4, 6],
    feelings: [
      f('alegre', 1, 'Reposo', 'Calma', 'Quietud', 'Paz'),
      f('triste', 2, 'Profundo', 'Reflexivo', 'Optimista'),
      f('triste', 3, 'Depresivo', 'Caído', 'Cabizbajo', 'Angustiado', 'Muy triste'),
      f('alegre', 1, 'Reflexivo', 'Optimista', 'Femenino', 'No efusivo'),
      f('alegre', 2, 'Efusivo', 'Masculino', 'Inquieto', 'Activo'),
      f('triste', 1, 'Melancólico', 'Nostálgico', 'No tan triste'),
      f('raro', 5, 'Nervioso', 'Inquieto', 'Descolocado', 'Desencajado'),
    ],
    minorSpelling: false,
  },
  {
    id: 'natural',
    name: 'Menor natural',
    alias: 'Eólico',
    family: 'tonal',
    point: 'sin',
    character: 'Femenino, dulce, suave, sin punta: nostálgico, melancólico.',
    steps: [0, 2, 3, 5, 7, 8, 10],
    sevenths: [],
    feelings: [
      MINOR_I,
      f('raro', 5, 'Nervioso', 'Inquieto', 'Descolocado', 'Desencajado'),
      f('alegre', 1, 'Reposo', 'Calma', 'Quietud', 'Paz'),
      f('triste', 2, 'Profundo', 'Mucha fuerza', 'Cierto optimismo'),
      f('triste', 3, 'Soledad', 'Cabizbajo', 'Angustiado', 'Muy triste'),
      f('alegre', 2, 'Fantasía', '¡Muy optimista!', 'Positivo'),
      f('alegre', 1, 'Optimista', 'Paz'),
    ],
    minorSpelling: true,
  },
  {
    id: 'armonica',
    name: 'Menor armónica',
    family: 'tonal',
    point: 'con',
    character: 'Masculino, agresivo, con punta: la sensible pide volver a la tónica.',
    steps: [0, 2, 3, 5, 7, 8, 11],
    sevenths: [4, 6],
    feelings: [
      MINOR_I,
      f('raro', 3, 'Nervioso', 'Inquieto', 'Descolocado', 'Desencajado'),
      f('raro', 3, 'Morboso', 'Muy tenso'),
      f('triste', 2, 'Profundo', 'Mucha fuerza', 'Cierto optimismo'),
      f('alegre', 2, 'Avanzar', 'Masculino', 'Activo', 'Decidido'),
      f('alegre', 2, 'Fantasía', '¡Muy optimista!', 'Positivo'),
      f('raro', 3, 'Amenazante', 'Maligno', 'Desencajado'),
    ],
    minorSpelling: true,
  },
  {
    id: 'bachiana',
    name: 'Menor bachiana',
    alias: 'Melódica',
    family: 'tonal',
    point: 'color',
    character: 'Un mundo de color: acordes de emociones más extremas, exóticas.',
    steps: [0, 2, 3, 5, 7, 9, 11],
    sevenths: [4, 5, 6],
    feelings: [
      MINOR_I,
      f('triste', 4, 'Muy deprimido', 'Impotencia', 'Amargura', 'Sin optimismo'),
      f('raro', 4, 'Morboso', 'Muy tenso'),
      f('alegre', 3, '¡¡Muy optimista!!', 'Luz total', 'Creación', 'Milagroso', 'Victorioso'),
      f('alegre', 2, 'Avanzar', 'Masculino', 'Activo', 'Decidido'),
      f('raro', 4, 'Descolocado', 'Desencajado', 'Femenino', 'Pasivo', 'Reflexivo'),
      f('raro', 3, 'Amenazante', 'Maligno', 'Desencajado', 'Activo', 'Inquieto'),
    ],
    minorSpelling: true,
  },
  {
    id: 'dorico',
    name: 'Dórico',
    family: 'modo',
    point: 'sin',
    character: 'Reflexivo, femenino, muy optimista, positivo, con buena energía, sin maldad.',
    steps: [0, 2, 3, 5, 7, 9, 10],
    sevenths: [],
    characteristic: [1, 3],
    risky: 5,
    minorSpelling: true,
  },
  {
    id: 'frigio',
    name: 'Frigio',
    family: 'modo',
    point: 'con',
    character: 'Rebelde, indomable, tenso, más masculino que femenino.',
    steps: [0, 1, 3, 5, 7, 8, 10],
    sevenths: [],
    characteristic: [1, 6],
    risky: 4,
    minorSpelling: true,
  },
  {
    id: 'lidio',
    name: 'Lidio',
    family: 'modo',
    point: 'con',
    character: 'Optimista, fantasía, soñador.',
    steps: [0, 2, 4, 6, 7, 9, 11],
    sevenths: [],
    characteristic: [1, 6],
    risky: 3,
    minorSpelling: false,
  },
  {
    id: 'mixolidio',
    name: 'Mixolidio',
    family: 'modo',
    point: 'sin',
    character: 'Muy optimista, positivo, solar, femenino.',
    steps: [0, 2, 4, 5, 7, 9, 10],
    sevenths: [],
    characteristic: [4, 6],
    risky: 2,
    minorSpelling: false,
  },
  {
    id: 'locrio',
    name: 'Locrio',
    family: 'modo',
    point: 'inestable',
    character:
      'Nervioso, agitado, desencajado, frenético. La tónica es disminuida: hay que insistir en ella.',
    steps: [0, 1, 3, 5, 6, 8, 10],
    sevenths: [],
    characteristic: [0],
    minorSpelling: true,
  },
  {
    id: 'simpson',
    name: 'Simpson',
    alias: 'Lidio dominante',
    family: 'modo',
    point: 'sin',
    character:
      'Lidio y mixolidio a la vez: mayor con el 4.º subido y el 7.º bajado. Soñador y solar, juguetón, de dibujo animado.',
    steps: [0, 2, 4, 6, 7, 9, 10],
    sevenths: [],
    characteristic: [1, 4],
    minorSpelling: false,
  },
  {
    id: 'mayorArmonica',
    name: 'Mayor armónica',
    family: 'exotica',
    point: 'con',
    character:
      'Mayor con el 6.º bajado: alegre, pero con una sombra. El IVm y el ♭VI5+ le ponen nostalgia a lo luminoso.',
    steps: [0, 2, 4, 5, 7, 8, 11],
    sevenths: [4, 6],
    characteristic: [3, 5],
    minorSpelling: false,
  },
  {
    id: 'frigioDominante',
    name: 'Frigio dominante',
    alias: 'Española',
    family: 'exotica',
    point: 'con',
    character:
      'Flamenco, andaluz, de sangre caliente. El ♭II mayor cae por semitono sobre una tónica mayor, como al final de la cadencia andaluza.',
    steps: [0, 1, 4, 5, 7, 8, 10],
    sevenths: [],
    characteristic: [0, 1],
    minorSpelling: true,
  },
  {
    id: 'arabe',
    name: 'Árabe',
    alias: 'Doble armónica',
    family: 'exotica',
    point: 'con',
    character:
      'De desierto y de mercado: dos segundas aumentadas, el ♭II arriba y la sensible abajo. Muy cargada: con dos acordes ya dice todo.',
    steps: [0, 1, 4, 5, 7, 8, 11],
    sevenths: [],
    characteristic: [1, 3],
    minorSpelling: false,
  },
  {
    id: 'hungara',
    name: 'Húngara',
    alias: 'Gitana',
    family: 'exotica',
    point: 'con',
    character:
      'Gitana, dramática, de violín: la menor armónica con el 4.º subido. Dos segundas aumentadas que lloran.',
    steps: [0, 2, 3, 6, 7, 8, 11],
    sevenths: [],
    characteristic: [1, 6],
    minorSpelling: true,
  },
];

export const FAMILY_LABEL: Record<Scale['family'], string> = {
  tonal: 'Tonales',
  modo: 'Modos',
  pentatonica: 'Pentatónicas',
  exotica: 'Exóticas',
  jazz: 'De jazz',
  simetrica: 'Simétricas',
};

/** Si la escala tiene siete notas: entonces cada nota es un grado, con su letra y su número romano. */
const heptatonic = (scale: Pick<Scale, 'steps'>) => scale.steps.length === 7;

/**
 * Qué grado de la escala mayor es cada nota de la escala: en las de siete, su lugar; en las otras, lo que
 * diga la escala, o el grado más cercano (el 3 es la tercera menor, el 10 la séptima menor).
 */
const LETTER_OF_STEP = [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6];
const letterOf = (scale: Scale, degree: number) =>
  heptatonic(scale) ? degree : (scale.letters?.[degree] ?? LETTER_OF_STEP[scale.steps[degree]!]!);
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

export const POINT_LABEL: Record<Point, string> = {
  sin: 'Sin punta',
  con: 'Con punta',
  color: 'De color',
  inestable: 'Inestable',
};

export const findScale = (id: string | null | undefined) => SCALES.find((scale) => scale.id === id);

export interface Key {
  tonic: number;
  scale: Scale;
}

/** Cómo se escriben las doce tónicas para esta escala. */
export const tonicNames = (scale: Pick<Scale, 'minorSpelling'>) => (scale.minorSpelling ? SHARP_KEYS : PLAIN);

/** El nombre de cada clase de altura dentro de una tonalidad: una letra por grado cuando se puede. */
export function spellIn(pc: number, key: Key): string {
  const tonicName = tonicNames(key.scale)[key.tonic]!;
  const tonicLetter = LETTERS.indexOf(tonicName[0] as (typeof LETTERS)[number]);
  const step = mod12(pc - key.tonic);
  const degree = key.scale.steps.indexOf(step);
  // Fuera de la escala, como se escriben las tónicas de su familia: sostenidos en menor (C#, G#).
  const plain = tonicNames(key.scale)[mod12(pc)]!;
  if (degree < 0) return plain;
  return spellWithLetter(pc, tonicLetter + letterOf(key.scale, degree)) ?? plain;
}

export function chordName(chord: Chord, key: Key, notation: Notation): string {
  const name = pitchName(spellIn(chord.root, key), notation) + NAME_SUFFIX[chord.suffix];
  if (chord.bass === undefined || chord.bass === chord.root) return name;
  return `${name}/${pitchName(spellIn(chord.bass, key), notation)}`;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
/** Para nombrar lo que no está en la escala: el grado de la escala mayor más cercano, con ♭ o ♯. */
const CHROMATIC = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];

/** El grado de un acorde en la tonalidad, como lo escribe el libro: IIm, III5+, V7, ♭VI. */
export function degreeLabel(chord: Chord, key: Key): string {
  const step = mod12(chord.root - key.tonic);
  const degree = key.scale.steps.indexOf(step);
  if (degree < 0) return CHROMATIC[step]! + DEGREE_SUFFIX[chord.suffix];
  if (heptatonic(key.scale)) return ROMAN[degree]! + DEGREE_SUFFIX[chord.suffix];
  // En las otras, el grado de la mayor con su alteración: en el blues, el ♭V y no el ♯IV.
  const letter = letterOf(key.scale, degree);
  const shift = mod12(step - MAJOR_STEPS[letter]! + 6) - 6;
  const accidental = shift < 0 ? '♭'.repeat(-shift) : '♯'.repeat(shift);
  return accidental + ROMAN[letter]! + DEGREE_SUFFIX[chord.suffix];
}

/**
 * En una escala que no es de siete notas no hay terceras para apilar: sobre cada nota va el acorde que
 * entra entero en la escala, del más común al más raro. Si no entra ninguno, esa nota no tiene acorde.
 */
const FITTING: ReadonlyArray<readonly [Suffix, readonly number[]]> = [
  ['', [4, 7]],
  ['m', [3, 7]],
  ['dim', [3, 6]],
  ['aug', [4, 8]],
  ['sus4', [5, 7]],
  ['sus2', [2, 7]],
  ['(b5)', [4, 6]],
  ['sus2(b5)', [2, 6]],
  ['5', [7]],
];

function fittingChord(key: Key, degree: number): Chord | null {
  const steps = key.scale.steps;
  const base = steps[degree]!;
  const above = new Set(steps.map((step) => mod12(step - base)));
  const found = FITTING.find(([, needs]) => needs.every((step) => above.has(step)));
  return found ? { root: mod12(key.tonic + base), suffix: found[0] } : null;
}

/** El acorde de un grado: tríada por terceras de la escala, con séptima si el libro la pone. */
export function degreeChord(
  key: Key,
  degree: number,
  withSeventh = key.scale.sevenths.includes(degree),
): Chord {
  if (!heptatonic(key.scale)) {
    return fittingChord(key, degree) ?? { root: mod12(key.tonic + key.scale.steps[degree]!), suffix: '5' };
  }
  const steps = key.scale.steps;
  const at = (offset: number) => mod12(steps[(degree + offset) % 7]! - steps[degree]!);
  const third = at(2);
  const fifth = at(4);
  const seventh = at(6);
  let suffix: Suffix;
  if (third === 4 && fifth === 7) suffix = withSeventh ? (seventh === 10 ? '7' : 'maj7') : '';
  else if (third === 3 && fifth === 7) suffix = withSeventh ? (seventh === 10 ? 'm7' : 'm(maj7)') : 'm';
  else if (third === 3 && fifth === 6) suffix = withSeventh ? (seventh === 9 ? 'dim7' : 'm7b5') : 'dim';
  // En las exóticas (la árabe, la húngara) aparecen tríadas que no son ni mayores ni menores.
  else if (third === 4 && fifth === 6) suffix = withSeventh && seventh === 10 ? '7b5' : '(b5)';
  else if (third === 2 && fifth === 6) suffix = 'sus2(b5)';
  else if (third === 4 && fifth === 8) suffix = 'aug';
  // Lo que no se arma por terceras (en la alterada, la enigmática): el que entre entero, como en las de
  // menos notas.
  else return fittingChord(key, degree) ?? { root: mod12(key.tonic + steps[degree]!), suffix: 'aug' };
  return { root: mod12(key.tonic + steps[degree]!), suffix };
}

export interface DegreeInfo {
  degree: number;
  chord: Chord;
  feeling?: DegreeFeeling;
  characteristic: boolean;
  risky: boolean;
}

/**
 * Los acordes de la escala, grado por grado. En las de siete notas hay uno por nota; en las otras, solo las
 * notas sobre las que entra un acorde entero: por eso tienen menos.
 */
export function scaleDegrees(key: Key): DegreeInfo[] {
  return key.scale.steps.flatMap((_, degree) => {
    const chord = heptatonic(key.scale) ? degreeChord(key, degree) : fittingChord(key, degree);
    if (!chord) return [];
    return [
      {
        degree,
        chord,
        feeling: key.scale.feelings?.[degree],
        characteristic: key.scale.characteristic?.includes(degree) ?? false,
        risky: key.scale.risky === degree,
      },
    ];
  });
}

/** ALEGRE ++, TRISTE −−−, RARO −−−−−: el rótulo de la tabla del libro. */
export function feelingTag({ feeling, amount }: DegreeFeeling): string {
  const sign = feeling === 'alegre' ? '+' : '−';
  return `${feeling.toUpperCase()} ${feeling === 'alegre' && amount === 1 ? '' : sign.repeat(amount)}`.trim();
}

/** Lo que dice un acorde en esta tonalidad, si es uno de sus grados tal cual. */
export function feelingOf(chord: Chord, key: Key): DegreeFeeling | undefined {
  if (!key.scale.feelings) return undefined;
  const degrees = scaleDegrees(key);
  const match = degrees.find(
    (item) =>
      item.chord.root === chord.root &&
      (item.chord.suffix === chord.suffix || degreeChord(key, item.degree, false).suffix === chord.suffix),
  );
  return match?.feeling;
}

// ---------------------------------------------------------------- acordes de color

export interface ColorChord {
  chord: Chord;
  /** El grado o la relación: "V7 de II", "♭II napolitano". */
  label: string;
  why: string;
}

export interface ColorGroup {
  id: string;
  title: string;
  intro: string;
  chords: ColorChord[];
}

const inScale = (chord: Chord, key: Key) =>
  scaleDegrees(key).some((item) => item.chord.root === chord.root && item.chord.suffix === chord.suffix);

/** Acordes de fuera de la escala, agrupados por de dónde salen. */
export function colorGroups(key: Key, from: Chord | null): ColorGroup[] {
  const groups: ColorGroup[] = [];
  const t = key.tonic;
  const minorKey = chordColor(degreeChord(key, 0, false).suffix) === 'minor';

  // Mezclar escalas: las menores entre sí, y la mayor con su menor (cambio de modo).
  const others = minorKey
    ? SCALES.filter((scale) => ['natural', 'armonica', 'bachiana'].includes(scale.id) && scale !== key.scale)
    : SCALES.filter((scale) => scale.id === 'natural');
  const borrowed: ColorChord[] = [];
  for (const scale of others) {
    const other = { tonic: t, scale };
    for (const item of scaleDegrees(other)) {
      if (inScale(item.chord, key) || borrowed.some((c) => sameChord(c.chord, item.chord))) continue;
      const words = item.feeling ? item.feeling.words.slice(0, 3).join(', ') + '.' : '';
      borrowed.push({
        chord: item.chord,
        label: `${degreeLabel(item.chord, key)} · ${scale.name.toLowerCase()}`,
        why: words,
      });
    }
  }
  if (borrowed.length) {
    groups.push({
      id: 'mezcla',
      title: minorKey ? 'De las otras menores' : 'Del menor',
      intro: minorKey
        ? 'Las tres menores se mezclan libremente: seis acordes de una, uno de otra. La lógica es la de lo que querés contar.'
        : 'Cambio de modo: acordes de la menor con la misma tónica. El IVm es de los más usados.',
      chords: borrowed,
    });
  }

  // Dominantes secundarias: el V7 de un grado que no sea la tónica, para subrayar la llegada.
  const secondary: ColorChord[] = [];
  for (const item of scaleDegrees(key)) {
    if (item.degree === 0) continue;
    const color = chordColor(degreeChord(key, item.degree, false).suffix);
    if (color === 'other') continue;
    const dominant: Chord = { root: mod12(item.chord.root + 7), suffix: '7' };
    if (inScale(dominant, key)) continue;
    secondary.push({
      chord: dominant,
      label: `V7 de ${ROMAN[item.degree]}`,
      why: `Empuja hacia el ${ROMAN[item.degree]}. Color, no cambio de tonalidad.`,
    });
  }
  if (secondary.length) {
    groups.push({
      id: 'secundarias',
      title: 'Dominantes secundarias',
      intro:
        'Un V7 prestado para enfatizar la ida a un grado. Con novena mayor se vuelve dulce; con novena menor, nervioso.',
      chords: secondary,
    });
  }

  const special: ColorChord[] = [
    {
      chord: { root: mod12(t + 1), suffix: '' },
      label: '♭II napolitano',
      why: 'De fantasía, con más vuelo que los acordes de siempre. Cadencia clásica: ♭II, V, I.',
    },
    {
      chord: { root: mod12(t + 11), suffix: 'dim7' },
      label: 'VII7dim',
      why: 'Amenazante, maligno. Lleva a la tónica con punta, pero más inestable que el V.',
    },
    {
      chord: { root: mod12(t + 3), suffix: 'aug' },
      label: 'III5+',
      why: 'Morboso, muy tenso. Resuelve a la tónica menor como un final abierto.',
    },
    {
      chord: { root: mod12(t + 8), suffix: '7' },
      label: '♭VI7 blues',
      why: 'Mezcla lo dulce de la pentatónica con una nota de más: suena irónico.',
    },
  ].filter((item) => !inScale(item.chord, key) && !borrowed.some((c) => sameChord(c.chord, item.chord)));
  if (special.length) {
    groups.push({
      id: 'especiales',
      title: 'Enlaces de color',
      intro: 'Acordes que no son de la escala pero se usan mucho para cambiarle el aire.',
      chords: special,
    });
  }

  if (from)
    groups.push({
      id: 'cine',
      title: 'De cine',
      intro:
        'Desde el último acorde de tu vuelta. Los cinco enlaces dan la misma emoción: fantasía, aventura.',
      chords: cinemaLinks(from),
    });
  return groups;
}

/**
 * Los cinco enlaces de la música de cine: todos dan "fantasía, aventura". Se calculan desde un
 * acorde; de un acorde sin tercera clara se toma como mayor.
 */
export function cinemaLinks(from: Chord): ColorChord[] {
  const minor = chordColor(from.suffix) === 'minor';
  const r = from.root;
  const M = (step: number): Chord => ({ root: mod12(r + step), suffix: '' });
  const m = (step: number): Chord => ({ root: mod12(r + step), suffix: 'm' });
  const links: ColorChord[] = minor
    ? [
        {
          chord: M(-1),
          label: 'Semitono abajo',
          why: 'Comparten una nota (por enarmonía). Muy de Danny Elfman.',
        },
        {
          chord: M(-3),
          label: '3m abajo, sin nota común',
          why: 'Doble cambio de color. Ojo: te lleva a otra tonalidad.',
        },
        {
          chord: M(4),
          label: '3M arriba, sin nota común',
          why: 'Doble cambio de color. Ojo: te lleva a otra tonalidad.',
        },
        {
          chord: m(3),
          label: '3m arriba, con nota común',
          why: 'Mismo color, otra luz. No cambia la tonalidad.',
        },
        {
          chord: m(-4),
          label: '3M abajo, con nota común',
          why: 'Mismo color, otra luz. No cambia la tonalidad.',
        },
        { chord: m(6), label: 'Tritono', why: 'La distancia más lejana: misterio puro.' },
      ]
    : [
        {
          chord: m(1),
          label: 'Semitono arriba',
          why: 'Comparten una nota (por enarmonía). Muy de Danny Elfman.',
        },
        {
          chord: m(-4),
          label: '3M abajo, sin nota común',
          why: 'Doble cambio de color. Ojo: te lleva a otra tonalidad.',
        },
        {
          chord: m(3),
          label: '3m arriba, sin nota común',
          why: 'Doble cambio de color. Ojo: te lleva a otra tonalidad.',
        },
        { chord: M(-4), label: '3M abajo, con nota común', why: 'Mayor a mayor: color, no modulación.' },
        { chord: M(3), label: '3m arriba, con nota común', why: 'Mayor a mayor: color, no modulación.' },
        { chord: M(6), label: 'Tritono', why: 'La distancia más lejana: misterio puro.' },
      ];
  return links;
}

// ---------------------------------------------------------------- funciones

export type HarmonicFunction = 'tonica' | 'subdominante' | 'dominante';

export interface FunctionInfo {
  id: HarmonicFunction;
  label: string;
  why: string;
}

/**
 * Los grados de cada función, como en la armonía clásica: la tónica es el I y los que comparten dos
 * notas con él; la dominante, los que tienen la sensible (la "punta" de De María, p. 28).
 */
const FUNCTION_DEGREES: Record<HarmonicFunction, readonly number[]> = {
  tonica: [0, 5, 2],
  subdominante: [3, 1],
  dominante: [4, 6],
};

/** El papel de un acorde en la tonalidad según su raíz, o null si la raíz no es de la escala. */
export function functionOf(chord: Chord, key: Key): FunctionInfo | null {
  // Tónica, subdominante y dominante son de las escalas de siete notas: en las otras no hay grados fijos.
  if (!heptatonic(key.scale)) return null;
  const degree = key.scale.steps.indexOf(mod12(chord.root - key.tonic));
  if (degree < 0) return null;
  const id = (Object.keys(FUNCTION_DEGREES) as HarmonicFunction[]).find((item) =>
    FUNCTION_DEGREES[item].includes(degree),
  )!;
  if (id === 'tonica') return { id, label: 'Tónica', why: 'la casa: reposa' };
  if (id === 'subdominante') return { id, label: 'Subdominante', why: 'se aleja de la casa sin apuro' };
  // Sin sensible (el dórico, la menor natural) la dominante no tiene punta: tira poco hacia el I.
  return key.scale.steps.includes(11)
    ? { id, label: 'Dominante', why: 'tensión que pide volver al I' }
    : { id, label: 'Dominante', why: 'sin sensible en este mundo: tira poco hacia el I' };
}

const hasSeventh = (suffix: Suffix) =>
  suffix === 'dim7' || CHORD_STEPS[suffix]!.some((step) => step === 10 || step === 11);

/**
 * Los acordes de la escala que cumplen el mismo papel: cambian el color sin cambiar hacia dónde va la
 * vuelta. Llevan séptima si el acorde la tiene. Sobre un V7, también el sustituto tritonal.
 */
export function functionSubstitutes(chord: Chord, key: Key): ColorChord[] {
  const role = functionOf(chord, key);
  if (!role) return [];
  const degree = key.scale.steps.indexOf(mod12(chord.root - key.tonic));
  const seventh = hasSeventh(chord.suffix);
  const result: ColorChord[] = FUNCTION_DEGREES[role.id]
    .filter((item) => item !== degree)
    .map((item) => {
      const next = degreeChord(key, item, seventh);
      const shared = commonTones(chord, next).length;
      const feeling = key.scale.feelings?.[item];
      const sharedText =
        shared === 0
          ? 'No comparten notas.'
          : shared === 1
            ? 'Comparten una nota.'
            : `Comparten ${shared} notas.`;
      // El III lleva la sensible: hace de tónica, pero reposa menos.
      const extra =
        role.id === 'tonica' && item === 2 && key.scale.steps.includes(11)
          ? ' Lleva la sensible: reposa menos.'
          : '';
      const words = feeling ? ` ${feeling.words.slice(0, 2).join(', ')}.` : '';
      return { chord: next, label: degreeLabel(next, key), why: sharedText + extra + words };
    });
  if (role.id === 'dominante' && degree === 4 && ['7', '9', '7b9'].includes(chord.suffix)) {
    const tritone: Chord = { root: mod12(key.tonic + 1), suffix: '7' };
    result.push({
      chord: tritone,
      label: `${degreeLabel(tritone, key)} tritonal`,
      why: 'Comparte el tritono del V7 y el bajo baja de a semitono al I. Suena a jazz.',
    });
  }
  return result;
}

// ---------------------------------------------------------------- variantes de un acorde

export interface Variant {
  suffix: Suffix;
  label: string;
  why: string;
}

/** Lo que se le puede agregar o cambiar a un acorde, con la emoción que suma. */
export function variantsOf(chord: Chord): Variant[] {
  const color = chordColor(chord.suffix);
  if (color === 'minor') {
    return [
      { suffix: 'm', label: 'Tríada', why: 'Triste, estable: la base.' },
      { suffix: 'm7', label: '+7m', why: 'Nostalgia optimista, dulzura, sin maldad.' },
      { suffix: 'm(maj7)', label: '+7M', why: 'Triste y frío, punzante, herido. Culpa, dolor.' },
      { suffix: 'madd9', label: '+9', why: 'Una segunda agregada: más aire, sin resolver nada.' },
      { suffix: 'm6', label: '+6', why: 'Sexta mayor: anguloso, no tan triste. Más luz, algo antiguo.' },
      { suffix: 'm(b6)', label: '+♭6', why: 'Sexta menor: intensifica el menor, lo vuelve inquietante.' },
      {
        suffix: 'sus2',
        label: '2.ª por 3.ª',
        why: 'Sin tercera: vacío, espacioso. Buen reemplazo de un menor.',
      },
      { suffix: '5', label: 'Quinta', why: 'Solo raíz y quinta: neutro y duro, lo del rock.' },
      { suffix: '(b3)', label: 'Bimodal', why: 'Las dos terceras juntas: agresivo y agridulce.' },
    ];
  }
  if (chord.suffix === 'dim' || chord.suffix === 'dim7' || chord.suffix === 'm7b5') {
    return [
      { suffix: 'dim', label: 'Tríada', why: 'Raro: nervioso, descolocado.' },
      { suffix: 'm7b5', label: '+7m', why: 'Semidisminuido: inquieto, pide moverse.' },
      { suffix: 'dim7', label: '+7dim', why: 'Amenazante, maligno. Sirve para irse a cualquier lado.' },
    ];
  }
  return [
    { suffix: '', label: 'Tríada', why: 'Alegre, estable: la base.' },
    { suffix: '7', label: '+7m', why: 'Alegre, pero pregunta, cuestiona, se plantea cosas.' },
    { suffix: 'maj7', label: '+7M', why: 'Alegre, moderno, romántico. Mejor en tempos lentos.' },
    { suffix: '9', label: '+7 +9', why: 'Novena mayor: dulce y moderno.' },
    { suffix: '7b9', label: '+7 +♭9', why: 'Novena menor: nervioso y clásico.' },
    { suffix: 'add9', label: '+9', why: 'Una segunda agregada: más aire, sin resolver nada.' },
    {
      suffix: 'sus4',
      label: '4.ª por 3.ª',
      why: 'Muy tenso: la cuarta quiere caer a la tercera. Bueno justo antes de un estribillo.',
    },
    {
      suffix: 'sus2',
      label: '2.ª por 3.ª',
      why: 'Sin tercera: vacío, espacioso, para canciones atmosféricas.',
    },
    { suffix: '7sus4', label: '7sus4', why: 'Suspendido con séptima: menos tenso que el sus4.' },
    { suffix: '5', label: 'Quinta', why: 'Solo raíz y quinta: neutro y duro, lo del rock.' },
    { suffix: '6', label: '+6', why: 'La sexta agregada: dulce, algo de jazz y de música latina.' },
    { suffix: 'aug', label: '5+', why: 'La quinta aumentada: morboso, muy tenso.' },
    { suffix: '(b3)', label: 'Bimodal', why: 'Las dos terceras juntas: agresivo y agridulce.' },
  ];
}

export type BassRole = 'raiz' | 'tercera' | 'quinta';

/** Qué va en el bajo: la raíz es sólida, la tercera delicada y la quinta muy inestable. */
export const BASS_ROLES: ReadonlyArray<{ id: BassRole; label: string; why: string }> = [
  { id: 'raiz', label: 'Raíz', why: 'Sólido.' },
  { id: 'tercera', label: '3.ª', why: 'Más delicado.' },
  { id: 'quinta', label: '5.ª', why: 'Muy inestable: entra y sale por paso.' },
];

/** La nota del bajo para ese rol, o undefined si el acorde no tiene esa nota. */
export function bassFor(chord: Chord, role: BassRole): number | undefined {
  const steps = CHORD_STEPS[chord.suffix]!;
  if (role === 'raiz') return chord.root;
  const wanted = role === 'tercera' ? [4, 3, 5, 2] : [7, 6, 8];
  const step = wanted.find((item) => steps.includes(item));
  return step === undefined ? undefined : mod12(chord.root + step);
}

export function bassRoleOf(chord: Chord): BassRole {
  if (chord.bass === undefined || chord.bass === chord.root) return 'raiz';
  return bassFor(chord, 'tercera') === chord.bass ? 'tercera' : 'quinta';
}

// ---------------------------------------------------------------- cadencias finales

export interface Cadence {
  id: string;
  name: string;
  /** Pasos desde la tónica y sufijo de cada acorde. */
  chords: ReadonlyArray<readonly [number, Suffix]>;
  why: string;
}

/** Las ocho cadencias finales: "la última emoción que se lleva el oyente a su casa". */
export const CADENCES: readonly Cadence[] = [
  {
    id: 'autentica',
    name: 'Auténtica',
    chords: [
      [7, '7'],
      [0, ''],
    ],
    why: 'El final clásico: conclusivo, eufórico, muscular. Tan aceptado que puede sonar obvio.',
  },
  {
    id: 'plagal',
    name: 'Plagal',
    chords: [
      [5, ''],
      [0, ''],
    ],
    why: 'Sin punta: más introspectivo, una emoción más profunda e interior que el V.',
  },
  {
    id: 'sensible',
    name: 'Séptimo disminuido',
    chords: [
      [11, 'dim7'],
      [0, 'm'],
    ],
    why: 'Oscuro y amenazante. Tiene punta, pero el final queda más abierto que con el V.',
  },
  {
    id: 'aumentado',
    name: 'Tercero aumentado',
    chords: [
      [3, 'aug'],
      [0, 'm'],
    ],
    why: 'Oscuro, sombrío, menos sólido que el V: un final abierto.',
  },
  {
    id: 'napolitana',
    name: 'Napolitana',
    chords: [
      [1, ''],
      [7, '7'],
      [0, 'm'],
    ],
    why: 'Clásica pero de fantasía: expansiva, de aventura, muy de Hollywood.',
  },
  {
    id: 'eolica',
    name: 'Séptimo natural',
    chords: [
      [10, ''],
      [0, 'm'],
    ],
    why: 'Sin punta, dulce, sin maldad. Termina en menor pero queda en el aire algo amigable.',
  },
  {
    id: 'eolicaMayor',
    name: 'Final mayor',
    chords: [
      [8, ''],
      [10, ''],
      [0, ''],
    ],
    why: 'Viene del menor sin punta y aterriza en mayor: suave, positivo.',
  },
  {
    id: 'blues',
    name: 'Blues',
    chords: [
      [8, '7'],
      [10, ''],
      [0, ''],
    ],
    why: 'Una nota extraña en el ♭VI7 choca con la del final: un juego irónico.',
  },
];

export const cadenceChords = (cadence: Cadence, tonic: number): Chord[] =>
  cadence.chords.map(([step, suffix]) => ({ root: mod12(tonic + step), suffix }));

// ---------------------------------------------------------------- puntos cardinales

export type Geometry = 'cuadrado' | 'triangulo';
export type Pole = 'N' | 'E' | 'S' | 'O';

export interface CardinalGroup {
  index: number;
  /** Raíces por polo. En el triángulo no hay O: arriba, izquierda y derecha van como N, O y E. */
  points: ReadonlyArray<{ pole: Pole; root: number }>;
}

/**
 * Sin centro de gravedad: doce raíces repartidas en tres grupos de cuatro (cuadrado) o cuatro de
 * tres (triángulo). Dentro de un grupo vale ir de cualquier acorde a cualquiera, mayor o menor.
 */
export function cardinalGroups(geometry: Geometry): CardinalGroup[] {
  if (geometry === 'cuadrado') {
    return [0, 1, 2].map((index) => ({
      index,
      points: [
        { pole: 'N', root: mod12(11 + index) },
        { pole: 'E', root: mod12(8 + index) },
        { pole: 'S', root: mod12(5 + index) },
        { pole: 'O', root: mod12(2 + index) },
      ],
    }));
  }
  return [0, 1, 2, 3].map((index) => ({
    index,
    points: [
      { pole: 'N', root: index },
      { pole: 'O', root: mod12(index + 8) },
      { pole: 'E', root: mod12(index + 4) },
    ],
  }));
}

/** Por el mismo polo se pasa a otro grupo del cuadrado: de Do (N del grupo 2) a Si (N del grupo 1). */
export function samePole(root: number): { pole: Pole; roots: number[] } | null {
  for (const group of cardinalGroups('cuadrado')) {
    const point = group.points.find((item) => item.root === root);
    if (point) {
      const roots = cardinalGroups('cuadrado')
        .filter((other) => other.index !== group.index)
        .map((other) => other.points.find((item) => item.pole === point.pole)!.root);
      return { pole: point.pole, roots };
    }
  }
  return null;
}

/** Para nombrar en los puntos cardinales, donde no hay tonalidad: bemoles salvo Fa#. */
export const plainName = (pc: number, notation: Notation) => pitchName(PLAIN[mod12(pc)]!, notation);

// ---------------------------------------------------------------- la vuelta

/** Notas que comparten dos acordes: donde una voz se puede quedar quieta. */
export function commonTones(a: Chord, b: Chord): number[] {
  const other = new Set(chordClasses(b));
  return chordClasses(a).filter((pc) => other.has(pc));
}

/** Cuerdas al aire (índices) cuya nota está en todos los acordes: pueden sonar toda la vuelta. */
export function pedalStrings(openClasses: readonly number[], chords: readonly Chord[]): number[] {
  if (!chords.length) return [];
  const sets = chords.map((chord) => new Set(chordClasses(chord)));
  return openClasses.flatMap((pc, index) => (sets.every((set) => set.has(mod12(pc))) ? [index] : []));
}

/** Lee un acorde de la URL: "A", "F#m7", "Bbdim7/D". */
export function parseChord(text: string): Chord | null {
  const match = /^([A-G])([#b]?)(.*?)(?:\/([A-G])([#b]?))?$/.exec(text);
  if (!match) return null;
  const pc = (letter: string, accidental: string) =>
    mod12(
      LETTER_PC[LETTERS.indexOf(letter as (typeof LETTERS)[number])]! +
        (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0),
    );
  const suffix = match[3]!;
  if (!(suffix in CHORD_STEPS)) return null;
  const root = pc(match[1]!, match[2]!);
  const chord: Chord = { root, suffix };
  if (match[4]) {
    const bass = pc(match[4], match[5]!);
    if (!chordClasses(chord).includes(bass)) return null;
    if (bass !== root) chord.bass = bass;
  }
  return chord;
}

/** El acorde como texto para la URL, siempre en letras y con nombres fijos. */
export function chordToken(chord: Chord): string {
  const name = PLAIN[chord.root]! + chord.suffix;
  return chord.bass === undefined || chord.bass === chord.root ? name : `${name}/${PLAIN[chord.bass]}`;
}
