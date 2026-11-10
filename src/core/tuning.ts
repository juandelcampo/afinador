// Lo que se deduce de una afinación: acorde al aire, intervalos, tensión de cada cuerda.
import { STANDARD, type Tuning } from '~/data/tunings';
import { intervalName, noteLabel, noteToMidi, midiToNote, type Notation } from './notes';

const CHORDS: ReadonlyArray<readonly [string, readonly number[]]> = [
  ['', [0, 4, 7]],
  ['m', [0, 3, 7]],
  ['5', [0, 7]],
  ['sus2', [0, 2, 7]],
  ['sus4', [0, 5, 7]],
  ['6', [0, 4, 7, 9]],
  ['m6', [0, 3, 7, 9]],
  ['7', [0, 4, 7, 10]],
  ['maj7', [0, 4, 7, 11]],
  ['m7', [0, 3, 7, 10]],
  ['add9', [0, 2, 4, 7]],
  ['madd9', [0, 2, 3, 7]],
  ['add11', [0, 4, 5, 7]],
  ['7sus4', [0, 5, 7, 10]],
  ['9', [0, 2, 4, 7, 10]],
  ['maj9', [0, 2, 4, 7, 11]],
  ['m9', [0, 2, 3, 7, 10]],
  ['m11', [0, 3, 5, 7, 10]],
  ['6/9', [0, 2, 4, 7, 9]],
  ['dim', [0, 3, 6]],
  ['dim7', [0, 3, 6, 9]],
  ['aug', [0, 4, 8]],
  ['m7(no5)', [0, 3, 10]],
  ['7(no5)', [0, 4, 10]],
  ['maj7(no5)', [0, 4, 11]],
  ['(no5)', [0, 4]],
  ['m(no5)', [0, 3]],
];

export interface OpenChord {
  /** Índice de la cuerda que da la raíz. */
  root: number;
  suffix: string;
  /** Índice de la cuerda del bajo, si no coincide con la raíz. */
  bass: number | null;
  single?: boolean;
}

/** Nombra el acorde que forman las cuerdas al aire, o null si no forman uno reconocible. */
export function openChord(midis: number[]): OpenChord | null {
  const classes = [...new Set(midis.map((midi) => midi % 12))];
  const lowest = midis.indexOf(Math.min(...midis));
  const bassClass = midis[lowest]! % 12;
  if (classes.length === 1) return { root: lowest, suffix: '', bass: null, single: true };

  // Primero se prueba con el bajo como raíz, y solo después con inversiones.
  const roots = [bassClass, ...classes.filter((pitchClass) => pitchClass !== bassClass)];
  for (const root of roots) {
    const intervals = classes.map((pitchClass) => (pitchClass - root + 12) % 12).sort((a, b) => a - b);
    const chord = CHORDS.find(
      ([, shape]) => shape.length === intervals.length && shape.every((step, i) => step === intervals[i]),
    );
    if (chord) {
      const rootString = midis.findIndex((midi) => midi % 12 === root);
      return { root: rootString, suffix: chord[0], bass: root === bassClass ? null : lowest };
    }
  }
  return null;
}

export function openChordName(notes: string[], notation: Notation = 'letters'): string {
  const chord = openChord(notes.map(noteToMidi));
  if (!chord) return 'Sin nombre: un cúmulo';
  const label = (index: number) => noteLabel(notes[index]!, notation);
  if (chord.single) return `Solo ${label(chord.root)}`;
  return label(chord.root) + chord.suffix + (chord.bass === null ? '' : `/${label(chord.bass)}`);
}

export function stringIntervals(notes: string[]): string[] {
  const midis = notes.map(noteToMidi);
  return midis.slice(1).map((midi, index) => intervalName(midis[index]!, midi));
}

/** Semitonos de cada cuerda respecto de la afinación estándar. */
export function stringOffsets(notes: string[]): number[] {
  return notes.map((note, index) => noteToMidi(note) - noteToMidi(STANDARD[index]!));
}

export function changeSummary(notes: string[]): { changed: number; semitones: number } {
  const offsets = stringOffsets(notes);
  return {
    changed: offsets.filter((offset) => offset !== 0).length,
    semitones: offsets.reduce((sum, offset) => sum + Math.abs(offset), 0),
  };
}

/** Subir mucho puede cortar la cuerda; bajar mucho la deja sin tensión ni afinación estable. */
export function isFarFromStandard(offset: number): boolean {
  return offset > 2 || offset < -5;
}

export function tensionWarning(tuning: Pick<Tuning, 'notes' | 'restring'>): string | null {
  const count = tuning.notes.length;
  const describe = (offset: number, index: number) =>
    `${count - index}.ª (${offset > 0 ? '+' : '−'}${Math.abs(offset)})`;
  const offsets = stringOffsets(tuning.notes);
  const high = offsets.flatMap((offset, index) => (offset > 2 ? [describe(offset, index)] : []));
  const low = offsets.flatMap((offset, index) => (offset < -5 ? [describe(offset, index)] : []));
  const parts: string[] = [];
  if (high.length) parts.push(`Puede cortarse por exceso de tensión: ${high.join(', ')}.`);
  if (low.length) parts.push(`Puede quedar muy floja: ${low.join(', ')}.`);
  if (tuning.restring) parts.push('Conviene encordar a medida.');
  return parts.length ? parts.join(' ') : null;
}

export interface ChordShape {
  /** Traste de cada cuerda, de la 6.ª a la 1.ª: 0 al aire, MUTED si no suena. */
  frets: number[];
  chord: string;
  label: string;
}

/** Cuerda apagada: la mano la toca apenas para que no suene. */
export const MUTED = -1;

/** Acordes que se proponen como figura; cuanto más bajo el peso, más común. */
const COMMON: ReadonlyArray<readonly [string, number]> = [
  ['', 0],
  ['m', 0],
  ['7', 1],
  ['m7', 1],
  ['5', 1.5],
  ['sus2', 2],
  ['sus4', 2],
  ['maj7', 2],
  ['6', 3],
  ['m6', 3],
  ['add9', 3],
  ['7sus4', 3],
];

/** Para cada conjunto de notas (máscara de 12 bits) y raíz en el bajo, el acorde común que forman. */
let commonTable: Map<number, { suffix: string; weight: number }> | null = null;
function commonChord(mask: number, bass: number) {
  if (!commonTable) {
    commonTable = new Map();
    for (const [suffix, weight] of COMMON) {
      const steps = CHORDS.find(([name]) => name === suffix)![1];
      for (let root = 0; root < 12; root++) {
        const chordMask = steps.reduce((acc, step) => acc | (1 << ((root + step) % 12)), 0);
        commonTable.set(chordMask * 12 + root, { suffix, weight });
      }
    }
  }
  return commonTable.get(mask * 12 + bass);
}

/**
 * Cuántos dedos pide una figura. Hasta cuatro cuerdas pisadas, un dedo cada una; si son
 * más, el índice hace cejilla en el traste más bajo, sin cuerdas al aire debajo.
 */
function fingersFor(frets: number[]): { fingers: number; barre: number | null } {
  const pressed = frets.filter((fret) => fret > 0);
  if (pressed.length <= 4) return { fingers: pressed.length, barre: null };
  const low = Math.min(...pressed);
  const first = frets.indexOf(low);
  if (frets.slice(first).some((fret) => fret === 0)) return { fingers: Infinity, barre: null };
  return { fingers: 1 + pressed.filter((fret) => fret > low).length, barre: low };
}

/**
 * Figuras que una mano puede hacer: hasta cuatro dedos (la cejilla cuenta como uno), a lo
 * sumo cuatro trastes de abertura, y como mucho las dos cuerdas graves apagadas. De cada
 * acorde común con la raíz en el bajo se queda con la figura más fácil.
 */
export function chordShapes(
  notes: string[],
  {
    notation = 'letters',
    maxFret = 7,
    limit = 18,
  }: { notation?: Notation; maxFret?: number; limit?: number } = {},
): ChordShape[] {
  const open = notes.map(noteToMidi);
  const best = new Map<string, { frets: number[]; score: number; suffix: string; root: number }>();
  const frets: number[] = [];

  // Los acordes de la tonalidad de la afinación van primero: mayor, o menor natural si al aire suena menor.
  const home = openChord(open);
  const tonic = home ? open[home.root]! % 12 : Math.min(...open) % 12;
  const scale = home && /^m(?!aj)/.test(home.suffix) ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  // Para cada grado, si su tríada es mayor (true) o menor (false).
  const degrees = new Map(
    scale.map((step, degree) => {
      const third = (scale[(degree + 2) % 7]! - step + 12) % 12;
      return [(tonic + step) % 12, third === 4] as const;
    }),
  );
  const keyPenalty = (root: number, suffix: string) => {
    const major = degrees.get(root);
    if (major === undefined) return 3;
    if (/^(5|sus2|sus4|7sus4)$/.test(suffix)) return 0;
    return /^m(?!aj)/.test(suffix) === !major ? 0 : 1.5;
  };

  const consider = () => {
    let mask = 0;
    let bass = Infinity;
    let low = Infinity;
    let high = -Infinity;
    let muted = 0;
    let pressed = 0;
    for (let index = 0; index < frets.length; index++) {
      const fret = frets[index]!;
      if (fret === MUTED) {
        muted++;
        continue;
      }
      const midi = open[index]! + fret;
      mask |= 1 << (midi % 12);
      if (midi < bass) bass = midi;
      if (fret > 0) {
        pressed++;
        if (fret < low) low = fret;
        if (fret > high) high = fret;
      }
    }
    const chord = commonChord(mask, bass % 12);
    if (!chord) return;
    const { fingers, barre } = pressed > 4 ? fingersFor(frets) : { fingers: pressed, barre: null };
    if (fingers > 4) return;
    const position = low === Infinity ? 0 : low;
    const score =
      chord.weight * 2 +
      keyPenalty(bass % 12, chord.suffix) +
      fingers +
      muted * 0.6 +
      (barre === null ? 0 : 1.5) +
      Math.max(0, position - 1) * 0.6 +
      (high > low ? (high - low) * 0.5 : 0);
    const key = chord.suffix + '|' + (bass % 12);
    const current = best.get(key);
    if (!current || score < current.score) best.set(key, { frets: [...frets], score, ...chord, root: bass });
  };

  // Cuerda por cuerda, de la 6.ª a la 1.ª, cortando apenas la abertura pasa de cuatro trastes.
  const walk = (index: number, low: number, high: number) => {
    if (index === open.length) return consider();
    // Solo se apagan las graves, y de corrido: la 6.ª, o la 6.ª y la 5.ª.
    const canMute = index < 2 && (index === 0 || frets[index - 1] === MUTED);
    for (let fret = canMute ? MUTED : 0; fret <= maxFret; fret++) {
      const nextLow = fret > 0 ? Math.min(low, fret) : low;
      const nextHigh = fret > 0 ? Math.max(high, fret) : high;
      if (nextHigh - nextLow > 3) continue;
      frets[index] = fret;
      walk(index + 1, nextLow, nextHigh);
    }
  };
  walk(0, Infinity, -Infinity);

  const openName = openChordName(notes, notation);
  const shapes: ChordShape[] = [{ frets: open.map(() => 0), chord: openName, label: 'Al aire' }];
  [...best.values()]
    .map((shape) => ({ ...shape, chord: noteLabel(midiToNote(shape.root), notation) + shape.suffix }))
    .filter((shape) => shape.chord !== openName)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit - 1)
    .forEach((shape) =>
      shapes.push({ frets: shape.frets, chord: shape.chord, label: shapeLabel(shape.frets) }),
    );
  return shapes;
}

/** La figura en cifrado de trastes, de la 6.ª a la 1.ª, con la cejilla si hace falta. */
function shapeLabel(frets: number[]): string {
  const { barre } = fingersFor(frets);
  const tab = frets
    .map((fret) => (fret === MUTED ? '×' : String(fret)))
    .join(frets.some((fret) => fret > 9) ? '-' : ' ');
  return barre === null ? tab : `${tab} · cejilla ${barre}`;
}
