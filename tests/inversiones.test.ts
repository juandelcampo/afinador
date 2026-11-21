// Inversiones: todas las figuras de un acorde, agrupadas por la nota del bajo.
import { describe, expect, it } from 'vitest';
import { CHORD_STEPS } from '~/core/harmony';
import { INVERSION_CHORDS, inversionsOf, tabOf, toneName, voicingsOf } from '~/core/inversions';
import { noteToMidi } from '~/core/notes';
import { MUTED } from '~/core/tuning';
import { STANDARD, TUNINGS } from '~/data/tunings';

const standard = STANDARD.map(noteToMidi);
const tabs = (list: { frets: number[] }[]) => list.map((voicing) => tabOf(voicing.frets));

describe('voicingsOf', () => {
  it('cada figura suena solo notas del acorde, en cuerdas de corrido, y la mano llega', () => {
    for (const { suffix } of INVERSION_CHORDS) {
      const steps = CHORD_STEPS[suffix]!;
      for (const voicing of voicingsOf(standard, 2, steps)) {
        const sounding = voicing.frets.flatMap((fret, index) => (fret === MUTED ? [] : [index]));
        expect(sounding.at(-1)! - sounding[0]!).toBe(sounding.length - 1);
        for (const step of voicing.steps) if (step !== null) expect(steps).toContain(step);
        const pressed = voicing.frets.filter((fret) => fret > 0);
        if (pressed.length) expect(Math.max(...pressed) - Math.min(...pressed)).toBeLessThanOrEqual(3);
        // Las notas que faltan son, a lo sumo, la quinta.
        const missing = steps.filter((step) => !voicing.steps.includes(step));
        expect(missing.every((step) => step === 7)).toBe(true);
        expect(voicing.noFifth).toBe(missing.length > 0);
      }
    }
  });

  it('el bajo es la nota más grave que suena', () => {
    for (const voicing of voicingsOf(standard, 0, [0, 4, 7])) {
      const lowest = Math.min(...voicing.midis.filter((midi): midi is number => midi !== null));
      expect(voicing.bass).toBe((lowest - 0) % 12);
    }
  });
});

describe('inversionsOf', () => {
  it('Do mayor en estándar: la de siempre, Do/Mi con la 6.ª al aire y Do/Sol con la 6.ª en el 3', () => {
    const [root, third, fifth] = inversionsOf(standard, 0, '');
    expect(root!.tone).toBe('R');
    expect(tabs(root!.full)).toContain('× 3 2 0 1 0');
    expect(tabs(root!.bare)).toContain('× 3 2 0 × ×');
    expect(third!.tone).toBe('3');
    expect(tabs(third!.full)).toContain('0 3 2 0 1 0');
    expect(fifth!.tone).toBe('5');
    expect(tabs(fifth!.full)).toContain('3 3 2 0 1 0');
  });

  it('las justas tocan cada nota una sola vez y van de la cejuela hacia arriba', () => {
    for (const group of inversionsOf(standard, 7, 'm7')) {
      for (const voicing of group.bare) {
        const steps = voicing.steps.filter((step) => step !== null);
        expect(new Set(steps).size).toBe(steps.length);
      }
      const positions = group.bare.map((voicing) => voicing.position);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    }
  });

  it('las llenas no repiten una figura que ya está con más cuerdas', () => {
    const [root] = inversionsOf(standard, 0, '');
    expect(tabs(root!.full)).toContain('× 3 2 0 1 0');
    expect(tabs(root!.full)).not.toContain('× 3 2 0 1 ×');
  });

  it('un acorde de cuatro notas tiene cuatro grupos, apilados en terceras', () => {
    expect(inversionsOf(standard, 0, 'maj7').map((group) => group.tone)).toEqual(['R', '3', '5', '7']);
    expect(inversionsOf(standard, 0, 'add9').map((group) => group.tone)).toEqual(['R', '3', '5', '9']);
    expect(inversionsOf(standard, 0, 'sus4').map((group) => group.tone)).toEqual(['R', '4', '5']);
    expect(inversionsOf(standard, 0, 'dim7').map((group) => group.tone)).toEqual(['R', '♭3', '♭5', '𝄫7']);
  });

  it('en estándar y en DADGAD todos los acordes, en las doce notas, tienen alguna figura', () => {
    for (const id of ['estandar', 'dadgad']) {
      const notes = TUNINGS.find((tuning) => tuning.id === id)!.notes.map(noteToMidi);
      for (const { suffix } of INVERSION_CHORDS) {
        for (let root = 0; root < 12; root++) {
          const groups = inversionsOf(notes, root, suffix);
          expect(groups.some((group) => group.bare.length + group.full.length > 0)).toBe(true);
        }
      }
    }
  });

  it('en una afinación de cuartas y quintas el aumentado puede no entrar en la mano', () => {
    const notes = TUNINGS.find((tuning) => tuning.id === 'bebebe')!.notes.map(noteToMidi);
    const groups = inversionsOf(notes, 1, 'aug');
    expect(groups.every((group) => group.bare.length + group.full.length === 0)).toBe(true);
  });
});

describe('toneName', () => {
  it('el 2 es novena solo si el acorde tiene tercera', () => {
    expect(toneName(2, 'add9')).toBe('9');
    expect(toneName(2, 'sus2')).toBe('2');
    expect(toneName(10, 'm7')).toBe('♭7');
  });
});
