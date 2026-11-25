// El círculo de quintas: dónde cae cada acorde, qué es del mundo y cómo gira la vuelta.
import { describe, expect, it } from 'vitest';
import {
  CIRCLE,
  circleChord,
  circlePlace,
  fifthHue,
  fifthMoves,
  keySignature,
  notesOutside,
  placeScale,
  TONIC_HUE,
  vueltaMarks,
} from '~/core/circle';
import { findScale, type Chord, type Key } from '~/core/harmony';

const C_MAYOR: Key = { tonic: 0, scale: findScale('mayor')! };
const chord = (root: number, suffix: Chord['suffix'] = ''): Chord => ({ root, suffix });

describe('círculo de quintas', () => {
  it('afuera va de quinta en quinta desde C, y adentro cada mayor tiene su relativo', () => {
    expect(CIRCLE).toEqual([0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]);
    expect(circleChord({ index: 0, ring: 'inner' })).toEqual(chord(9, 'm'));
    expect(circleChord({ index: 4, ring: 'inner' })).toEqual(chord(1, 'm'));
  });

  it('cada acorde cae en su casilla: los mayores por su raíz, los menores bajo su relativo', () => {
    expect(circlePlace(chord(7, '7'))).toEqual({ index: 1, ring: 'outer' });
    expect(circlePlace(chord(2, 'm7'))).toEqual({ index: 11, ring: 'inner' });
    // El disminuido no tiene casilla.
    expect(circlePlace(chord(11, 'dim'))).toBeNull();
  });

  it('cuenta las notas de afuera: los vecinos no tienen ninguna, lo lejano tiene varias', () => {
    expect(notesOutside(chord(9, 'm'), C_MAYOR)).toBe(0);
    expect(notesOutside(chord(2), C_MAYOR)).toBe(1);
    expect(notesOutside(chord(3), C_MAYOR)).toBe(2);
  });

  it('marca dónde cae cada acorde de la vuelta y cuántos cambios son de una quinta', () => {
    const vuelta = [chord(9, 'm'), chord(2, 'm'), chord(7), chord(0), chord(9, 'm')];
    expect(vueltaMarks(vuelta).get('inner-0')).toEqual([1, 5]);
    expect(vueltaMarks(vuelta).get('outer-1')).toEqual([3]);
    // Am Dm G C Am, y de vuelta al Am: tres caídas de quinta, C → Am y Am → Am no.
    expect(fifthMoves(vuelta)).toEqual({ fifths: 3, total: 5 });
  });

  it('el color gira con las quintas: la tónica naranja, el tritono en el complementario', () => {
    const c = circlePlace(chord(0))!;
    expect(fifthHue(c, c)).toBe(TONIC_HUE);
    // G, una quinta para los sostenidos: 30° más.
    expect(fifthHue(circlePlace(chord(7))!, c)).toBe(TONIC_HUE + 30);
    // F, una para los bemoles: 30° menos, dando la vuelta.
    expect(fifthHue(circlePlace(chord(5))!, c)).toBe(TONIC_HUE + 330);
    expect(fifthHue(circlePlace(chord(6))!, c)).toBe(TONIC_HUE + 180);
    // El relativo lleva el tono de su mayor; en un mundo menor, la tónica es la casilla de adentro.
    expect(fifthHue(circlePlace(chord(9, 'm'))!, c)).toBe(TONIC_HUE);
    const cm = circlePlace(chord(0, 'm'))!;
    expect(fifthHue(circlePlace(chord(3))!, cm)).toBe(TONIC_HUE);
  });

  it('cada casilla dice su armadura: sostenidos a la derecha, bemoles a la izquierda', () => {
    expect(keySignature({ index: 0, ring: 'outer' })).toEqual({ sign: null, notes: [] });
    expect(keySignature({ index: 2, ring: 'outer' })).toEqual({ sign: '#', notes: ['F#', 'C#'] });
    // Em, adentro de G: la misma armadura que su relativo.
    expect(keySignature({ index: 1, ring: 'inner' }).notes).toEqual(['F#']);
    expect(keySignature({ index: 10, ring: 'outer' })).toEqual({ sign: 'b', notes: ['Bb', 'Eb'] });
  });

  it('despliega la escala de la casilla con sus tonos y semitonos', () => {
    const d = placeScale({ index: 2, ring: 'outer' });
    expect(d.map((item) => item.note)).toEqual(['D', 'E', 'F#', 'G', 'A', 'B', 'C#']);
    expect(d.map((item) => item.next).join('')).toBe('TTSTTTS');
    // Am natural: T S T T S T T.
    expect(
      placeScale({ index: 0, ring: 'inner' })
        .map((item) => item.next)
        .join(''),
    ).toBe('TSTTSTT');
  });
});
