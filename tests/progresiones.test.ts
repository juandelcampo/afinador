// Lo de Rooksby: vueltas en grados, transformaciones, cambios de dos acordes, y cantar encima.
import { describe, expect, it } from 'vitest';
import {
  CHORD_STEPS,
  chordName,
  findScale,
  variantsOf,
  type Chord,
  type Key,
} from '~/core/harmony';
import {
  polarityOf,
  relativeOf,
  romanChord,
  singOver,
  twoChordMoves,
} from '~/core/progressions';
import { fingeringFor } from '~/core/tuning';
import { STANDARD } from '~/data/tunings';
import { VUELTA_GROUPS, VUELTAS } from '~/data/vueltas';

const C_MAYOR: Key = { tonic: 0, scale: findScale('mayor')! };
const A_MENOR: Key = { tonic: 9, scale: findScale('natural')! };
const names = (chords: Chord[], key = C_MAYOR) => chords.map((chord) => chordName(chord, key, 'letters'));
const chord = (root: number, suffix: Chord['suffix'] = ''): Chord => ({ root, suffix });

describe('vueltas en grados', () => {
  it('lee los grados en mayor, con calidad y alteraciones', () => {
    const tokens = ['I', 'VI', 'IV', 'V', 'IImaj', 'IVm', 'bVII', 'bIII', 'VII'];
    expect(names(tokens.map((token) => romanChord(token, 0, 'mayor')))).toEqual([
      'C',
      'Am',
      'F',
      'G',
      'D',
      'Fm',
      'Bb',
      'Eb',
      'Bdim',
    ]);
  });

  it('lee los grados en menor natural', () => {
    const tokens = ['I', 'VII', 'VI', 'V', 'Vmaj', 'IVmaj', 'III'];
    expect(
      names(
        tokens.map((token) => romanChord(token, 9, 'menor')),
        A_MENOR,
      ),
    ).toEqual(['Am', 'G', 'F', 'Em', 'E', 'D', 'C']);
  });

  it('cada vuelta tiene grupo, grados que se leen y figura en la estándar', () => {
    const groups = new Map(VUELTA_GROUPS.map((group) => [group.id, group]));
    const ids = new Set<string>();
    for (const vuelta of VUELTAS) {
      expect(ids.has(vuelta.id), vuelta.id).toBe(false);
      ids.add(vuelta.id);
      const group = groups.get(vuelta.group);
      expect(group, vuelta.id).toBeDefined();
      for (const token of vuelta.degrees) {
        const result = romanChord(token, 4, group!.mode);
        expect(
          fingeringFor(STANDARD, result.root, CHORD_STEPS[result.suffix]!),
          `${vuelta.id} ${token}`,
        ).not.toBeNull();
      }
    }
    for (const group of VUELTA_GROUPS) {
      expect(
        VUELTAS.some((vuelta) => vuelta.group === group.id),
        group.id,
      ).toBe(true);
    }
  });

  it('después del grado puede ir el acorde entero: las vueltas con séptimas', () => {
    const jazz = ['IIm7', 'V7', 'Imaj7'].map((token) => romanChord(token, 0, 'mayor'));
    expect(names(jazz)).toEqual(['Dm7', 'G7', 'Cmaj7']);
    const menor = ['IIm7b5', 'V7', 'Im(maj7)', 'IVmaj'].map((token) => romanChord(token, 9, 'menor'));
    expect(names(menor)).toEqual(['Bm7♭5', 'E7', 'Am(maj7)', 'D']);
    expect(() => romanChord('V7x', 0, 'mayor')).toThrow();
  });

  it('el círculo de quintas en mayor recorre los siete acordes del mundo', () => {
    const vuelta = VUELTAS.find((item) => item.id === 'q-vuelta-entera')!;
    expect(names(vuelta.degrees.map((token) => romanChord(token, 0, 'mayor')))).toEqual([
      'C',
      'F',
      'Bdim',
      'Em',
      'Am',
      'Dm',
      'G',
      'C',
    ]);
  });

  it('un grado mal escrito avisa', () => {
    expect(() => romanChord('VIII', 0, 'mayor')).toThrow();
  });
});

describe('el relativo y la polaridad', () => {
  it('el relativo y la polaridad', () => {
    expect(relativeOf(chord(0))).toEqual(chord(9, 'm'));
    expect(relativeOf(chord(9, 'm'))).toEqual(chord(0));
    expect(polarityOf(chord(5))).toEqual(chord(5, 'm'));
    expect(polarityOf(chord(2, 'm7'))).toEqual(chord(2));
    expect(relativeOf(chord(11, 'dim'))).toBeNull();
  });

});

describe('de dos en dos', () => {
  it('desde un mayor, el I → VI va al relativo menor', () => {
    const moves = twoChordMoves(chord(7));
    expect(moves[0]).toMatchObject({ label: 'I → VI', chord: chord(4, 'm') });
    expect(moves.find((move) => move.label === 'I → ♭VII')?.chord).toEqual(chord(5));
  });

  it('desde un menor usa la lista menor', () => {
    const moves = twoChordMoves(chord(9, 'm'));
    expect(moves[0]).toMatchObject({ label: 'I → III', chord: chord(0) });
    expect(moves.every((move) => move.why.length > 0)).toBe(true);
  });
});

describe('cantar encima', () => {
  it('separa las notas que se apoyan, las que tensan y las que chocan', () => {
    const notes = singOver(chord(0), C_MAYOR);
    expect(notes.inside).toEqual([0, 4, 7]);
    expect(notes.outside).toEqual([2, 5, 9, 11]);
    expect(notes.against).toEqual([1, 3, 6, 8, 10]);
    expect(notes.blue).toEqual([3, 6, 10]);
  });

  it('sobre el V, la tónica tensa', () => {
    expect(singOver(chord(7), C_MAYOR).outside).toContain(0);
  });
});

describe('colores de Rooksby', () => {
  it('los mayores suman sus2, 7sus4 y quinta; los menores m6 y m(♭6)', () => {
    expect(variantsOf(chord(0)).map((item) => item.suffix)).toEqual(
      expect.arrayContaining(['sus2', '7sus4', '5']),
    );
    expect(variantsOf(chord(9, 'm')).map((item) => item.suffix)).toEqual(
      expect.arrayContaining(['m6', 'm(b6)', 'sus2']),
    );
  });

  it('tienen figura en la estándar', () => {
    for (const suffix of ['sus2', '5', '7sus4', 'm(b6)', 'm6'] as const) {
      expect(fingeringFor(STANDARD, 9, CHORD_STEPS[suffix]!), suffix).not.toBeNull();
    }
  });
});
