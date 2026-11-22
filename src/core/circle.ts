// El círculo de quintas: los doce mayores en la rueda de afuera, cada uno con su relativo menor adentro.
// Dar un paso es caer (o subir) una quinta; los vecinos comparten todas las notas menos una.
import { chordClasses, chordColor, type Chord, type Key } from './harmony';

const mod12 = (value: number) => ((value % 12) + 12) % 12;

/** Las raíces de la rueda de afuera, desde arriba y en el sentido del reloj: C G D A E B F# D♭ A♭ E♭ B♭ F. */
export const CIRCLE: readonly number[] = Array.from({ length: 12 }, (_, index) => mod12(index * 7));

export type Ring = 'outer' | 'inner';

export interface CirclePlace {
  index: number;
  ring: Ring;
}

/** El acorde de cada casilla: mayor afuera, su relativo menor adentro. */
export const circleChord = ({ index, ring }: CirclePlace): Chord =>
  ring === 'outer' ? { root: CIRCLE[index]!, suffix: '' } : { root: mod12(CIRCLE[index]! + 9), suffix: 'm' };

/**
 * Dónde cae un acorde en la rueda: los mayores (con séptima, sus, lo que sea) por su raíz afuera, los
 * menores adentro, debajo de su relativo. Los disminuidos y los raros no tienen casilla.
 */
export function circlePlace(chord: Chord): CirclePlace | null {
  const color = chordColor(chord.suffix);
  if (color === 'major') return { index: CIRCLE.indexOf(mod12(chord.root)), ring: 'outer' };
  if (color === 'minor') return { index: CIRCLE.indexOf(mod12(chord.root + 3)), ring: 'inner' };
  return null;
}

/** Cuántas notas del acorde no son del mundo: 0 es de la casa, 1 es color prestado, más ya es otro tono. */
export function notesOutside(chord: Chord, key: Key): number {
  const scale = new Set(key.scale.steps.map((step) => mod12(key.tonic + step)));
  return chordClasses(chord).filter((pc) => !scale.has(pc)).length;
}

/** Para cada casilla, en qué lugares de la vuelta aparece (contando desde 1). */
export function vueltaMarks(vuelta: readonly Chord[]): Map<string, number[]> {
  const marks = new Map<string, number[]>();
  vuelta.forEach((chord, position) => {
    const place = circlePlace(chord);
    if (!place) return;
    const id = `${place.ring}-${place.index}`;
    marks.set(id, [...(marks.get(id) ?? []), position + 1]);
  });
  return marks;
}

/** De los cambios de la vuelta (dando la vuelta, del último al primero), cuántos son de una quinta. */
export function fifthMoves(vuelta: readonly Chord[]): { fifths: number; total: number } {
  if (vuelta.length < 2) return { fifths: 0, total: 0 };
  let fifths = 0;
  vuelta.forEach((chord, position) => {
    const next = vuelta[(position + 1) % vuelta.length]!;
    const step = mod12(next.root - chord.root);
    if (step === 5 || step === 7) fifths++;
  });
  return { fifths, total: vuelta.length };
}

/** El tono del naranja de la tónica en el círculo cromático. */
export const TONIC_HUE = 18;

/**
 * El color de una casilla, como el círculo de quintas puesto sobre el cromático: la tónica es naranja y cada
 * quinta gira 30°. Hacia los sostenidos va al amarillo y al verde, hacia los bemoles al rojo y al violeta;
 * el tritono, enfrente, cae en el complementario. El relativo menor lleva el tono de su mayor.
 */
export const fifthHue = (place: CirclePlace, tonic: CirclePlace) =>
  (TONIC_HUE + 30 * mod12(place.index - tonic.index)) % 360;
