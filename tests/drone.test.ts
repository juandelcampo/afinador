// Drone: qué notas suenan sobre la tónica y cómo se limpia lo guardado.
import { describe, expect, it } from 'vitest';
import { DEFAULT_DRONE, droneRoot, droneVoices, foreignSteps, resolveStack, sanitizeDrone } from '~/core/drone';

const MAYOR = [0, 2, 4, 5, 7, 9, 11];
const LOCRIO = [0, 1, 3, 5, 6, 8, 10];

describe('las notas del drone', () => {
  it('sin elegir nada, la quinta si la escala la tiene y si no la octava', () => {
    expect(resolveStack('escala', MAYOR)).toBe('quinta');
    expect(resolveStack('escala', LOCRIO)).toBe('octava');
    expect(resolveStack('menor', MAYOR)).toBe('menor');
  });

  it('la tónica grave cae entre el Mi de la sexta al aire y el Re# de arriba', () => {
    expect(droneRoot(4) - 12).toBe(40);
    expect(droneRoot(3) - 12).toBe(51);
    expect(droneVoices(4, 'escala', MAYOR)).toEqual([40, 52, 59, 64]);
  });

  it('avisa qué notas de la pila no están en la escala', () => {
    expect(foreignSteps('quinta', MAYOR)).toEqual([]);
    expect(foreignSteps('menor', MAYOR)).toEqual([3]);
    expect(foreignSteps('escala', LOCRIO)).toEqual([]);
  });
});

describe('lo guardado', () => {
  it('lo que no sirve vuelve a lo de siempre y los números quedan en su rango', () => {
    expect(sanitizeDrone(null)).toEqual(DEFAULT_DRONE);
    expect(sanitizeDrone({ stack: 'nada', timbre: 'raro', brightness: 3, motion: -1, detune: 99 })).toEqual({
      ...DEFAULT_DRONE,
      brightness: 1,
      motion: 0,
      detune: 40,
    });
    expect(sanitizeDrone({ ...DEFAULT_DRONE, stack: 'tanpura', timbre: 'crudo' })).toMatchObject({
      stack: 'tanpura',
      timbre: 'crudo',
    });
  });
});
