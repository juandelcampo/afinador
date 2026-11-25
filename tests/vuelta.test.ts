// La vuelta: cómo viaja en la URL y lo que suena de cada acorde en una afinación.
import { describe, expect, it } from 'vitest';
import { STANDARD } from '~/data/tunings';
import { placedToken, readVuelta, vueltaSteps } from '~/core/vuelta';

describe('la vuelta en la URL', () => {
  it('lee cada acorde con lo que dura y su figura, y vuelve a escribirlo igual', () => {
    const vuelta = readVuelta('C_G*2_Am.1_F/A');
    expect(vuelta.map((item) => [item.root, item.suffix, item.beats, item.shape, item.bass])).toEqual([
      [0, '', undefined, undefined, undefined],
      [7, '', 2, undefined, undefined],
      [9, 'm', undefined, 1, undefined],
      [5, '', undefined, undefined, 9],
    ]);
    expect(vuelta.map(placedToken).join('_')).toBe('C_G*2_Am.1_F/A');
  });

  it('saltea lo que no entiende y no pasa de dieciséis acordes', () => {
    expect(readVuelta('C_xyz_G').length).toBe(2);
    expect(readVuelta(Array(20).fill('C').join('_')).length).toBe(16);
    expect(readVuelta('')).toEqual([]);
  });
});

describe('lo que suena de la vuelta', () => {
  it('cada acorde suena con su figura más fácil en la afinación, y dura sus pulsos', () => {
    const [c, g] = vueltaSteps(STANDARD, readVuelta('C_G*2'));
    // C al aire en la estándar: × 3 2 0 1 0.
    expect(c).toEqual({ voicing: [null, 48, 52, 55, 60, 64], beats: 4 });
    expect(g!.beats).toBe(2);
    expect(g!.voicing.filter((midi) => midi !== null).every((midi) => [7, 11, 2].includes(midi! % 12))).toBe(
      true,
    );
  });
});
