// ¿Qué tonalidad?: de una lista de acordes (o de las notas de una melodía), en qué tonalidad está, y cómo
// llevarla a otra. Solo mayores y menores: es lo que se pregunta al sacar un tema de oído.
import { CHORD_STEPS, chordClasses, findScale, type Chord, type Key, type Suffix } from './harmony';

export type Mode = 'mayor' | 'menor';

const mod12 = (value: number) => ((value % 12) + 12) % 12;

/** Lo más largo que se lee: un tema entero cabe, una lista infinita no. */
export const MAX_ITEMS = 32;

// ---------------------------------------------------------------- leer lo que se escribe

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** Los nombres de las notas en castellano, del más largo al más corto: "sol" antes que "si". */
const SOLFEGE: ReadonlyArray<readonly [string, string]> = [
  ['sol', 'G'],
  ['do', 'C'],
  ['re', 'D'],
  ['mi', 'E'],
  ['fa', 'F'],
  ['la', 'A'],
  ['si', 'B'],
];

/** Cómo escribe la gente lo que acá se llama de una sola manera: Am, Cmaj7, Bm7b5. */
const SUFFIX_ALIASES: Record<string, Suffix> = {
  '': '',
  M: '',
  maj: '',
  mayor: '',
  m: 'm',
  mi: 'm',
  min: 'm',
  menor: 'm',
  '-': 'm',
  m7: 'm7',
  '-7': 'm7',
  min7: 'm7',
  maj7: 'maj7',
  M7: 'maj7',
  '7M': 'maj7',
  Δ: 'maj7',
  Δ7: 'maj7',
  dim: 'dim',
  '°': 'dim',
  º: 'dim',
  o: 'dim',
  dim7: 'dim7',
  '°7': 'dim7',
  º7: 'dim7',
  o7: 'dim7',
  m7b5: 'm7b5',
  ø: 'm7b5',
  ø7: 'm7b5',
  aug: 'aug',
  '+': 'aug',
  '5+': 'aug',
  sus: 'sus4',
};

/**
 * Las maneras de leer el comienzo de un texto como una nota: "F#", "Bb", "sol", "Re#", "mi♭". "Fadd9" se
 * puede leer como Fa + "dd9" o como F + "add9": se prueban las dos, primero en castellano.
 */
function readRoots(text: string): Array<{ pc: number; rest: string }> {
  const starts: Array<{ letter: string; rest: string }> = [];
  const lower = text.toLowerCase();
  const solfege = SOLFEGE.find(([name]) => lower.startsWith(name));
  if (solfege) starts.push({ letter: solfege[1], rest: text.slice(solfege[0].length) });
  if (/^[A-Ga-g]/.test(text)) starts.push({ letter: text[0]!.toUpperCase(), rest: text.slice(1) });
  return starts.map(({ letter, rest }) => {
    const accidental = /^(#|♯|b|♭)/.exec(rest);
    if (!accidental) return { pc: LETTER_PC[letter]!, rest };
    const shift = accidental[1] === '#' || accidental[1] === '♯' ? 1 : -1;
    return { pc: mod12(LETTER_PC[letter]! + shift), rest: rest.slice(accidental[1]!.length) };
  });
}

const suffixOf = (text: string): Suffix | undefined => {
  const clean = text.replace(/♭/g, 'b').replace(/♯/g, '#');
  if (Object.hasOwn(SUFFIX_ALIASES, clean)) return SUFFIX_ALIASES[clean];
  return Object.hasOwn(CHORD_STEPS, clean) ? clean : undefined;
};

/** Un acorde escrito a mano: "Am", "lam", "F#m7", "Sol7", "Bbmaj7", "C/E", "Do°". */
export function readChord(raw: string): Chord | null {
  const [main, bassText] = raw.split('/') as [string, string | undefined];
  for (const root of readRoots(main)) {
    const suffix = suffixOf(root.rest);
    if (suffix === undefined) continue;
    const chord: Chord = { root: root.pc, suffix };
    if (bassText === undefined) return chord;
    const bass = readRoots(bassText).find((item) => item.rest === '');
    if (!bass) return null;
    if (bass.pc !== chord.root) chord.bass = bass.pc;
    return chord;
  }
  return null;
}

/** Una nota escrita a mano: "E", "f#", "sol", "Si♭", "A4" (la octava no importa). */
export function readNote(raw: string): number | null {
  return readRoots(raw).find((root) => /^-?\d?$/.test(root.rest))?.pc ?? null;
}

export interface Token<T> {
  text: string;
  value: T | null;
}

/** Corta lo escrito en pedazos: por espacios, comas, guiones largos o barras de compás. */
function split(text: string): string[] {
  return text
    .split(/[\s,;|·–—]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

export const readChords = (text: string): Token<Chord>[] =>
  split(text).map((item) => ({ text: item, value: readChord(item) }));

export const readNotes = (text: string): Token<number>[] =>
  split(text).map((item) => ({ text: item, value: readNote(item) }));

// ---------------------------------------------------------------- qué tonalidad

export interface Guess {
  key: Key;
  tonic: number;
  mode: Mode;
  /** Cuántos acordes (o notas) son de la tonalidad, y de cuántos. */
  fit: number;
  total: number;
  /** Los que no son: sus posiciones en la lista. */
  outside: number[];
  /** Por qué, en pocas palabras: "Arranca y termina en Am". */
  why: string[];
  score: number;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

export const keyOf = (tonic: number, mode: Mode): Key => ({
  tonic: mod12(tonic),
  scale: findScale(mode === 'mayor' ? 'mayor' : 'natural')!,
});

const tonicChordOf = (tonic: number, mode: Mode): Chord => ({
  root: mod12(tonic),
  suffix: mode === 'mayor' ? '' : 'm',
});

/** Si el acorde es la tónica: la misma raíz y del mismo color (C7 cuenta como C, Cm no). */
function isTonic(chord: Chord, tonic: number, mode: Mode): boolean {
  if (mod12(chord.root - tonic) !== 0) return false;
  const third = chordClasses(chord).map((pc) => mod12(pc - tonic));
  return mode === 'mayor' ? third.includes(4) && !third.includes(3) : third.includes(3) && !third.includes(4);
}

/** Si el acorde es la dominante que resuelve: un acorde mayor (o con séptima) sobre la quinta. */
function isDominant(chord: Chord, tonic: number): boolean {
  const steps = chordClasses(chord).map((pc) => mod12(pc - chord.root));
  return mod12(chord.root - tonic) === 7 && steps.includes(4) && !steps.includes(3);
}

/**
 * Si un acorde es de la tonalidad: todas sus notas están en la escala. En menor también vale la
 * dominante con la sensible (E y E7 en La menor) y el disminuido de la sensible: es como suena la menor.
 */
function chordFits(chord: Chord, tonic: number, mode: Mode): boolean {
  const scale = new Set((mode === 'mayor' ? MAJOR : MINOR).map((step) => mod12(tonic + step)));
  const notes = chordClasses(chord);
  if (chord.bass !== undefined) notes.push(chord.bass);
  if (notes.every((pc) => scale.has(pc))) return true;
  if (mode === 'mayor') return false;
  const step = mod12(chord.root - tonic);
  if (step !== 7 && step !== 11) return false;
  scale.add(mod12(tonic + 11));
  return notes.every((pc) => scale.has(pc));
}

/** Las 24 tonalidades, de la que más cierra a la que menos, para una lista de acordes. */
export function guessFromChords(chords: readonly Chord[], name: (chord: Chord) => string): Guess[] {
  if (!chords.length) return [];
  const guesses: Guess[] = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const mode of ['mayor', 'menor'] as const) {
      const outside = chords.flatMap((chord, index) => (chordFits(chord, tonic, mode) ? [] : [index]));
      const fit = chords.length - outside.length;
      const first = chords[0]!;
      const last = chords[chords.length - 1]!;
      const startsHome = isTonic(first, tonic, mode);
      const endsHome = isTonic(last, tonic, mode);
      const hasHome = chords.some((chord) => isTonic(chord, tonic, mode));
      const resolves = chords.some(
        (chord, index) => index > 0 && isTonic(chord, tonic, mode) && isDominant(chords[index - 1]!, tonic),
      );
      const score =
        (fit / chords.length) * 10 +
        (startsHome ? 1.5 : 0) +
        (endsHome ? 2 : 0) +
        (hasHome ? 1 : -2) +
        (resolves ? 1.5 : 0) +
        // A igualdad de todo, el mayor: es lo que el oído escucha primero.
        (mode === 'mayor' ? 0.1 : 0);
      const home = name(tonicChordOf(tonic, mode));
      const why: string[] = [];
      if (startsHome && endsHome) why.push(`Arranca y termina en ${home}`);
      else if (startsHome) why.push(`Arranca en ${home}`);
      else if (endsHome) why.push(`Termina en ${home}`);
      if (resolves) why.push(`La ${name({ root: mod12(tonic + 7), suffix: '' })} lleva a ${home}`);
      if (!startsHome && !endsHome && !resolves && hasHome)
        why.push(`${home} aparece y la vuelta gira alrededor`);
      guesses.push({ key: keyOf(tonic, mode), tonic, mode, fit, total: chords.length, outside, why, score });
    }
  }
  return guesses.sort((a, b) => b.score - a.score);
}

// Cuánto pesa cada nota de la escala en una melodía tonal (Krumhansl y Kessler): la tónica, la quinta y la
// tercera son las que más se oyen.
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function correlation(a: readonly number[], b: readonly number[]): number {
  const mean = (list: readonly number[]) => list.reduce((sum, value) => sum + value, 0) / list.length;
  const ma = mean(a);
  const mb = mean(b);
  let top = 0;
  let da = 0;
  let db = 0;
  a.forEach((value, index) => {
    top += (value - ma) * (b[index]! - mb);
    da += (value - ma) ** 2;
    db += (b[index]! - mb) ** 2;
  });
  return da && db ? top / Math.sqrt(da * db) : 0;
}

/** Las 24 tonalidades para una melodía: las notas que más suenan y dónde se apoya al final. */
export function guessFromNotes(notes: readonly number[], name: (pc: number) => string): Guess[] {
  if (!notes.length) return [];
  const histogram = new Array<number>(12).fill(0);
  notes.forEach((pc) => (histogram[mod12(pc)]! += 1));
  // La nota del final pesa más: una melodía suele terminar en casa.
  histogram[mod12(notes[notes.length - 1]!)]! += 1.5;
  const guesses: Guess[] = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const mode of ['mayor', 'menor'] as const) {
      const profile = (mode === 'mayor' ? MAJOR_PROFILE : MINOR_PROFILE).map(
        (_, step, list) => list[mod12(step - tonic)]!,
      );
      const scale = new Set((mode === 'mayor' ? MAJOR : [...MINOR, 11]).map((step) => mod12(tonic + step)));
      const outside = notes.flatMap((pc, index) => (scale.has(mod12(pc)) ? [] : [index]));
      const last = mod12(notes[notes.length - 1]! - tonic);
      const why: string[] = [];
      if (last === 0) why.push(`Termina en ${name(tonic)}`);
      else if (mod12(notes[0]! - tonic) === 0) why.push(`Arranca en ${name(tonic)}`);
      guesses.push({
        key: keyOf(tonic, mode),
        tonic,
        mode,
        fit: notes.length - outside.length,
        total: notes.length,
        outside,
        why,
        score: correlation(histogram, profile) * 10 + (last === 0 ? 0.5 : 0),
      });
    }
  }
  return guesses.sort((a, b) => b.score - a.score);
}

/** La relativa: La menor de Do mayor, y al revés. Comparten todas las notas. */
export const relativeOf = (tonic: number, mode: Mode): { tonic: number; mode: Mode } =>
  mode === 'mayor' ? { tonic: mod12(tonic + 9), mode: 'menor' } : { tonic: mod12(tonic + 3), mode: 'mayor' };

// ---------------------------------------------------------------- llevarla a otra

export const transposeChord = (chord: Chord, semitones: number): Chord => ({
  ...chord,
  root: mod12(chord.root + semitones),
  ...(chord.bass === undefined ? {} : { bass: mod12(chord.bass + semitones) }),
});

/** Cuánto se sube para ir de una tónica a otra, entre −5 y +6: el camino más corto. */
export const shiftBetween = (from: number, to: number) => {
  const up = mod12(to - from);
  return up > 6 ? up - 12 : up;
};

/** Los acordes que salen con la mano abierta en la afinación estándar: las formas de siempre. */
const OPEN_SHAPES = new Set([
  'C',
  'D',
  'E',
  'G',
  'A',
  'Am',
  'Dm',
  'Em',
  'C7',
  'D7',
  'E7',
  'G7',
  'A7',
  'B7',
  'Am7',
  'Dm7',
  'Em7',
  'Cmaj7',
  'Dmaj7',
  'Fmaj7',
  'Gmaj7',
  'Amaj7',
  'Dsus2',
  'Dsus4',
  'Asus2',
  'Asus4',
  'Esus4',
  'Cadd9',
  'E5',
  'A5',
  'D5',
]);
const PLAIN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const isOpen = (chord: Chord) => OPEN_SHAPES.has(PLAIN[chord.root]! + chord.suffix);

export interface Capo {
  fret: number;
  /** Las formas que se tocan con la cejilla puesta. */
  shapes: Chord[];
  /** Cuántas son de las de siempre, de cuántas. */
  open: number;
}

/**
 * Con qué cejilla se tocan estos acordes con formas abiertas: la que deja más formas de siempre, la más
 * baja si empatan. Null si sin cejilla ya se toca bien (tres de cada cuatro abiertas, como C G Am F) o si
 * la cejilla no mejora nada.
 */
export function capoFor(chords: readonly Chord[]): Capo | null {
  if (!chords.length) return null;
  let best: Capo = { fret: 0, shapes: [...chords], open: chords.filter(isOpen).length };
  const bare = best.open;
  if (bare >= chords.length * 0.75) return null;
  for (let fret = 1; fret <= 7; fret++) {
    const shapes = chords.map((chord) => transposeChord(chord, -fret));
    const open = shapes.filter(isOpen).length;
    if (open > best.open) best = { fret, shapes, open };
  }
  return best.fret > 0 && best.open > bare ? best : null;
}
