// Todas las maneras de hacer un acorde en el mástil, agrupadas por la nota que queda en el bajo.
import { CHORD_STEPS, type Suffix } from './harmony';
import { MUTED } from './tuning';

/** Una figura del acorde. */
export interface Voicing {
  /** Traste de cada cuerda, de la 6.ª a la 1.ª: 0 al aire, MUTED si no suena. */
  frets: number[];
  /** El MIDI de cada cuerda que suena, o null. */
  midis: Array<number | null>;
  /** El paso (en semitonos desde la raíz, 0 a 11) de cada cuerda que suena, o null. */
  steps: Array<number | null>;
  /** El paso que suena en el bajo: 0 es la fundamental, la tercera da la 1.ª inversión. */
  bass: number;
  /** Traste pisado más bajo, o 0 si todo va al aire. */
  position: number;
  /** Traste pisado más alto, o 0 si todo va al aire. */
  top: number;
  /** El índice hace cejilla en este traste. */
  barre: number | null;
  /** Le falta la quinta: en acordes de cuatro notas la mano suele dejarla afuera. */
  noFifth: boolean;
  /** Cuántas cuerdas suenan. */
  strings: number;
  /** Cuánto le cuesta a la mano: cuanto más bajo, más fácil. */
  effort: number;
}

const mod12 = (value: number) => ((value % 12) + 12) % 12;

/**
 * Cuántos dedos pide una figura. Hasta cuatro cuerdas pisadas, un dedo cada una; si son más, el índice
 * hace cejilla en el traste más bajo, sin cuerdas al aire debajo de donde empieza.
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
 * Todas las figuras de un acorde que una mano puede hacer: las cuerdas que suenan van de corrido (las
 * de afuera se apagan), cada nota es del acorde y están todas (en los de cuatro notas puede faltar la
 * quinta), hasta cuatro dedos con la cejilla contando como uno y a lo sumo cuatro trastes de abertura.
 * Salen ordenadas por la nota del bajo y después por dónde caen en el mástil.
 */
export function voicingsOf(
  notes: readonly number[],
  root: number,
  chordSteps: readonly number[],
  { maxFret = 15, minStrings = 3 }: { maxFret?: number; minStrings?: number } = {},
): Voicing[] {
  const steps = [...new Set(chordSteps.map(mod12))];
  const required = steps.length;
  // Sin la quinta, solo si el acorde tiene cuatro notas o más y quinta justa.
  const canDropFifth = required >= 4 && steps.includes(7);
  const fullMask = steps.reduce((acc, step) => acc | (1 << step), 0);
  const leanMask = fullMask & ~(1 << 7);
  const inChord = (midi: number) => (fullMask & (1 << mod12(midi - root))) !== 0;

  const found: Voicing[] = [];
  const count = notes.length;
  const frets: number[] = new Array(count).fill(MUTED);

  const consider = (from: number, to: number) => {
    let mask = 0;
    let bassMidi = Infinity;
    let low = Infinity;
    let high = -Infinity;
    for (let index = from; index <= to; index++) {
      const fret = frets[index]!;
      const midi = notes[index]! + fret;
      mask |= 1 << mod12(midi - root);
      if (midi < bassMidi) bassMidi = midi;
      if (fret > 0) {
        if (fret < low) low = fret;
        if (fret > high) high = fret;
      }
    }
    const bass = mod12(bassMidi - root);
    const noFifth = mask !== fullMask;
    if (noFifth && !(canDropFifth && mask === leanMask && bass !== 7)) return;
    const { fingers, barre } = fingersFor(frets);
    if (fingers > 4) return;
    const position = low === Infinity ? 0 : low;
    const top = high === -Infinity ? 0 : high;
    const sounding = to - from + 1;
    const midis = frets.map((fret, index) => (fret === MUTED ? null : notes[index]! + fret));
    found.push({
      frets: [...frets],
      midis,
      steps: midis.map((midi) => (midi === null ? null : mod12(midi - root))),
      bass,
      position,
      top,
      barre,
      noFifth,
      strings: sounding,
      effort:
        fingers +
        (barre === null ? 0 : 1.5) +
        (top > position ? (top - position) * 0.5 : 0) +
        (noFifth ? 1 : 0) +
        (count - sounding) * 0.3 +
        // Una cuerda al aire contra una mano lejos de la cejuela cuesta estirarla y suena aparte.
        (position > 4 && frets.includes(0) ? 1 : 0),
    });
  };

  // Para cada tramo de cuerdas de corrido, cada cuerda del tramo con una nota del acorde.
  for (let from = 0; from < count; from++) {
    for (let to = from + Math.max(minStrings, required - (canDropFifth ? 1 : 0)) - 1; to < count; to++) {
      const walk = (index: number, low: number, high: number) => {
        if (index > to) return consider(from, to);
        for (let fret = 0; fret <= maxFret; fret++) {
          if (!inChord(notes[index]! + fret)) continue;
          const nextLow = fret > 0 ? Math.min(low, fret) : low;
          const nextHigh = fret > 0 ? Math.max(high, fret) : high;
          if (nextHigh - nextLow > 3) continue;
          frets[index] = fret;
          walk(index + 1, nextLow, nextHigh);
        }
        frets[index] = MUTED;
      };
      walk(from, Infinity, -Infinity);
    }
  }

  return found;
}

/** Los acordes que se pueden abrir: el nombre en la lista y cómo se escribe al lado de la nota. */
export const INVERSION_CHORDS: ReadonlyArray<{ suffix: Suffix; label: string; symbol: string }> = [
  { suffix: '', label: 'Mayor', symbol: '' },
  { suffix: 'm', label: 'Menor', symbol: 'm' },
  { suffix: '7', label: '7', symbol: '7' },
  { suffix: 'maj7', label: 'maj7', symbol: 'maj7' },
  { suffix: 'm7', label: 'm7', symbol: 'm7' },
  { suffix: 'm7b5', label: 'm7♭5', symbol: 'm7♭5' },
  { suffix: 'dim', label: 'dim', symbol: 'dim' },
  { suffix: 'dim7', label: 'dim7', symbol: 'dim7' },
  { suffix: 'aug', label: 'aug', symbol: 'aug' },
  { suffix: 'sus2', label: 'sus2', symbol: 'sus2' },
  { suffix: 'sus4', label: 'sus4', symbol: 'sus4' },
  { suffix: '7sus4', label: '7sus4', symbol: '7sus4' },
  { suffix: '6', label: '6', symbol: '6' },
  { suffix: 'm6', label: 'm6', symbol: 'm6' },
  { suffix: 'add9', label: 'add9', symbol: 'add9' },
];

/** Si el acorde tiene tercera: entonces el 2 es una novena agregada y no reemplaza a la tercera. */
const hasThird = (steps: readonly number[]) => steps.includes(3) || steps.includes(4);

/** El lugar de cada nota apilando terceras: raíz, tercera (o la que la reemplaza), quinta, séptima, novena. */
function stackRank(step: number, steps: readonly number[]): number {
  if (step === 0) return 0;
  if (step === 2 && hasThird(steps)) return 4;
  if (step <= 5) return 1;
  if (step <= 8) return 2;
  return 3;
}

const TONE_NAMES: Record<number, string> = {
  0: 'R',
  2: '2',
  3: '♭3',
  4: '3',
  5: '4',
  6: '♭5',
  7: '5',
  8: '♯5',
  9: '6',
  10: '♭7',
  11: '7',
};

/** Cómo se llama una nota dentro del acorde: R, 3, ♭7. En el dim7, la sexta hace de séptima. */
export function toneName(step: number, suffix: Suffix): string {
  if (step === 2 && hasThird(CHORD_STEPS[suffix]!)) return '9';
  if (step === 9 && suffix === 'dim7') return '𝄫7';
  return TONE_NAMES[step] ?? String(step);
}

/** Lo que pasa con cada nota en el bajo. Las tres primeras son de De María, como en Armonía. */
function bassWhy(rank: number): string {
  if (rank === 0) return 'Sólido: el acorde está en su casa.';
  if (rank === 1) return 'Más delicado: el acorde queda en el aire, liviano.';
  if (rank === 2) return 'Muy inestable: entra y sale por paso, de pasada.';
  if (rank === 3) return 'Tira para abajo: pide que el bajo baje un paso.';
  return 'El color en el bajo: suena suspendido, sin piso.';
}

export interface InversionGroup {
  /** El paso que va en el bajo, en semitonos desde la raíz. */
  bass: number;
  /** 0 la fundamental, 1 la primera inversión… */
  inversion: number;
  /** Cómo se llama esa nota: R, 3, ♭7. */
  tone: string;
  why: string;
  /** Cada nota del acorde una sola vez, en cuerdas vecinas: la inversión tal cual. */
  bare: Voicing[];
  /** Con más cuerdas y notas dobladas, de la más fácil a la más difícil. */
  full: Voicing[];
}

/** Las notas distintas que suenan en una figura. */
const distinct = (voicing: Voicing) => new Set(voicing.steps.filter((step) => step !== null)).size;

/** Si `inner` es `outer` con alguna cuerda menos: la misma figura, recortada. */
const insideOf = (inner: Voicing, outer: Voicing) =>
  inner !== outer &&
  inner.strings < outer.strings &&
  inner.bass === outer.bass &&
  inner.frets.every((fret, index) => fret === MUTED || fret === outer.frets[index]);

/**
 * Las figuras de un acorde en una afinación, en grupos por la nota que va en el bajo. Llega hasta el
 * traste 12: de ahí para arriba se repite el mástil. Las justas van por dónde caen en el mástil; las
 * llenas que son una justa con más cuerdas se quedan y las que son otra llena recortada se descartan.
 */
export function inversionsOf(
  notes: readonly number[],
  root: number,
  suffix: Suffix,
  { maxPosition = 12 }: { maxPosition?: number } = {},
): InversionGroup[] {
  const steps = CHORD_STEPS[suffix]!;
  const all = voicingsOf(notes, root, steps, { maxFret: maxPosition + 3 }).filter(
    (voicing) => voicing.position <= maxPosition,
  );
  const ordered = [...new Set(steps.map(mod12))].sort((a, b) => stackRank(a, steps) - stackRank(b, steps));
  return ordered.map((bass, inversion) => {
    const mine = all.filter((voicing) => voicing.bass === bass);
    const bare = mine
      .filter((voicing) => distinct(voicing) === voicing.strings)
      .sort((a, b) => a.position - b.position || a.top - b.top || a.effort - b.effort);
    const full = mine
      .filter((voicing) => distinct(voicing) < voicing.strings)
      .filter((voicing) => !mine.some((other) => other.strings > voicing.strings && insideOf(voicing, other)))
      .sort((a, b) => a.effort - b.effort || a.position - b.position);
    return {
      bass,
      inversion,
      tone: toneName(bass, suffix),
      why: bassWhy(stackRank(bass, steps)),
      bare,
      full,
    };
  });
}

/** La figura en cifrado de trastes, de la 6.ª a la 1.ª. */
export function tabOf(frets: readonly number[]): string {
  return frets
    .map((fret) => (fret === MUTED ? '×' : String(fret)))
    .join(frets.some((fret) => fret > 9) ? '-' : ' ');
}
