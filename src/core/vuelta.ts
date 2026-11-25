// La vuelta: una lista de acordes con lo que dura cada uno y con qué figura se toca. Se arma en Armonía y
// viaja en la URL (`v=C_G*2_Am.1`), así Escalas puede tocar la misma encima de la escala.
import { CHORD_STEPS, chordToken, parseChord, type Chord } from './harmony';
import { noteToMidi } from './notes';
import { fingeringsFor, MUTED, type Fingering } from './tuning';

/** Cuántos acordes entran en una vuelta. */
export const MAX_CHORDS = 16;

/** Lo que dura cada acorde si no se dice otra cosa, y las duraciones que se ofrecen, en pulsos. */
export const DEFAULT_BEATS = 4;
export const BEAT_OPTIONS = [1, 2, 3, 4, 6, 8] as const;

/**
 * Un acorde puesto en la vuelta: el acorde, cuántos pulsos dura y con qué figura se toca (0 es la más
 * fácil, las otras van de a una más difícil).
 */
export type Placed = Chord & { beats?: number; shape?: number };

/** Lo que suena de un acorde: el MIDI de cada cuerda, o null si va apagada. */
export type Voicing = Array<number | null>;

export const beatsOf = (item: Placed) => item.beats ?? DEFAULT_BEATS;

/**
 * En la URL, la duración y la figura van pegadas al acorde: "C*2" es C durante dos pulsos y "C.1", C con
 * su segunda figura (el punto no pide codificarse en la URL; ~ sí). Así se mueven con él.
 */
export function readPlaced(token: string): Placed | null {
  const [, text = '', count, figure] = /^(.*?)(?:\*(\d+))?(?:\.(\d+))?$/.exec(token) ?? [];
  const chord = parseChord(text);
  if (!chord) return null;
  const placed: Placed = { ...chord };
  const beats = Number(count);
  if (BEAT_OPTIONS.includes(beats as (typeof BEAT_OPTIONS)[number]) && beats !== DEFAULT_BEATS) {
    placed.beats = beats;
  }
  const shape = Number(figure);
  if (Number.isInteger(shape) && shape > 0) placed.shape = shape;
  return placed;
}

export const placedToken = (item: Placed) =>
  chordToken(item) +
  (beatsOf(item) === DEFAULT_BEATS ? '' : `*${beatsOf(item)}`) +
  (item.shape ? `.${item.shape}` : '');

export const readVuelta = (text: string) =>
  text
    .split('_')
    .map(readPlaced)
    .filter((item): item is Placed => item !== null)
    .slice(0, MAX_CHORDS);

/** Las figuras de un acorde en una afinación, de la más fácil a la más difícil. */
export const shapesOf = (notes: string[], chord: Chord) =>
  fingeringsFor(notes, chord.root, CHORD_STEPS[chord.suffix]!, chord.bass ?? chord.root);

/** La figura con que se toca: la elegida en la vuelta, o la más fácil. */
export function fingerOf(notes: string[], chord: Placed): Fingering | null {
  const shapes = shapesOf(notes, chord);
  return shapes[chord.shape ?? 0] ?? shapes[0] ?? null;
}

/** Lo que suena de cada cuerda con una figura, o un acorde cerrado si la mano no llega. */
export function voicingOf(notes: string[], chord: Chord, fingering: Fingering | null): Voicing {
  if (fingering) {
    return fingering.frets.map((fret, index) => (fret === MUTED ? null : noteToMidi(notes[index]!) + fret));
  }
  const base = 48 + (chord.bass ?? chord.root);
  const steps = CHORD_STEPS[chord.suffix]!.map((step) => 48 + chord.root + step);
  return [base - 12, ...steps.map((midi) => (midi < base ? midi + 12 : midi))];
}

/** La vuelta lista para sonar: lo que suena de cada acorde y cuántos pulsos dura. */
export const vueltaSteps = (notes: string[], vuelta: readonly Placed[]) =>
  vuelta.map((chord) => ({
    voicing: voicingOf(notes, chord, fingerOf(notes, chord)),
    beats: beatsOf(chord),
  }));
