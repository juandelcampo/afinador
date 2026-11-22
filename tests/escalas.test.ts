// Escalas: el catálogo, cómo se nombra cada grado y las posiciones en el mástil.
import { describe, expect, it } from 'vitest';
import { SCALES } from '~/core/harmony';
import { noteToMidi } from '~/core/notes';
import {
  ALL_SCALES,
  colorNotes,
  degreeName,
  findScaleInfo,
  homeKey,
  positionsOf,
  spellScaleNote,
  tonicToTonic,
} from '~/core/scales';
import { STANDARD, TUNINGS } from '~/data/tunings';

const standard = STANDARD.map(noteToMidi);
const scale = (id: string) => findScaleInfo(id)!;
const spell = (id: string, tonic: number) =>
  scale(id).steps.map((step) => spellScaleNote(tonic + step, tonic, scale(id)));

describe('el catálogo', () => {
  it('tiene todas las de Armonía, con la misma URL, y cada id una sola vez', () => {
    for (const item of SCALES) expect(findScaleInfo(item.id)?.inArmonia).toBe(true);
    expect(new Set(ALL_SCALES.map((item) => item.id)).size).toBe(ALL_SCALES.length);
  });

  it('cada escala arranca en la tónica, sube sin repetir y no tiene dos iguales', () => {
    const seen = new Set<string>();
    for (const item of ALL_SCALES) {
      expect(item.steps[0]).toBe(0);
      for (let index = 1; index < item.steps.length; index += 1) {
        expect(item.steps[index]!).toBeGreaterThan(item.steps[index - 1]!);
      }
      expect(item.steps.at(-1)!).toBeLessThan(12);
      expect(seen.has(item.steps.join()), item.id).toBe(false);
      seen.add(item.steps.join());
    }
  });

  it('suma pentatónicas, blues, exóticas, de jazz y simétricas', () => {
    for (const id of ['pentaMenor', 'pentaMayor', 'blues', 'hirajoshi', 'alterada', 'tonosEnteros']) {
      expect(findScaleInfo(id), id).toBeDefined();
    }
  });
});

describe('degreeName', () => {
  it('nombra el mismo semitono según lo que tiene alrededor', () => {
    expect(degreeName(6, scale('lidio').steps)).toBe('♯4');
    expect(degreeName(6, scale('blues').steps)).toBe('♭5');
    expect(degreeName(3, scale('hungaraMayor').steps)).toBe('♯2');
    expect(degreeName(3, scale('bluesMayor').steps)).toBe('♭3');
    expect(degreeName(8, scale('tonosEnteros').steps)).toBe('♯5');
    expect(degreeName(8, scale('locrio').steps)).toBe('♭6');
  });
});

describe('spellScaleNote', () => {
  it('escribe cada nota con la letra de su grado', () => {
    expect(spell('pentaMenor', 4)).toEqual(['E', 'G', 'A', 'B', 'D']);
    expect(spell('blues', 9)).toEqual(['A', 'C', 'D', 'Eb', 'E', 'G']);
    expect(spell('lidio', 5)).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E']);
    expect(spell('hungaraMayor', 0)).toEqual(['C', 'D#', 'E', 'F#', 'G', 'A', 'Bb']);
  });
});

describe('colorNotes', () => {
  it('marca lo que la separa de la mayor o de la menor natural', () => {
    expect(colorNotes(scale('lidio'))).toEqual({ reference: 'mayor', steps: [6] });
    expect(colorNotes(scale('dorico'))).toEqual({ reference: 'natural', steps: [9] });
    expect(colorNotes(scale('blues'))).toEqual({ reference: 'natural', steps: [6] });
    expect(colorNotes(scale('pentaMenor')).steps).toEqual([]);
    expect(colorNotes(scale('egipcia')).reference).toBeNull();
  });
});

describe('positionsOf', () => {
  it('la pentatónica menor de La en la estándar: cinco cajas, la primera en el 5', () => {
    const positions = positionsOf(standard, 9, scale('pentaMenor').steps);
    expect(positions.map((item) => item.from)).toEqual([0, 3, 5, 8, 10]);
    const box = positions.find((item) => item.from === 5)!;
    expect(box.run.map((note) => note.fret)).toEqual([5, 8, 5, 7, 5, 7, 5, 7, 5, 8, 5, 8]);
  });

  it('en todas las afinaciones, cada caja sube nota por nota sin salirse de la escala ni de sus trastes', () => {
    const wrong: string[] = [];
    for (const tuning of TUNINGS) {
      const open = tuning.notes.map(noteToMidi);
      for (const id of ['mayor', 'pentaMenor', 'tonosEnteros']) {
        const { steps } = scale(id);
        for (const box of positionsOf(open, 2, steps)) {
          box.run.forEach((note, index) => {
            const ok =
              steps.includes((note.midi - 2 + 120) % 12) &&
              note.fret >= box.from &&
              note.fret <= box.to &&
              (index === 0 || note.midi > box.run[index - 1]!.midi);
            if (!ok) wrong.push(`${tuning.id} ${id} desde ${box.from}: nota ${index + 1}`);
          });
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('para escuchar, va de tónica a tónica', () => {
    const box = positionsOf(standard, 9, scale('pentaMenor').steps)[2]!;
    const run = tonicToTonic(box.run, 9);
    expect(run[0]!.midi % 12).toBe(9);
    expect(run.at(-1)!.midi % 12).toBe(9);
    expect(run.at(-1)!.midi - run[0]!.midi).toBe(24);
  });
});

describe('homeKey', () => {
  it('la estándar arranca en Mi menor, DADGAD en Re mayor', () => {
    expect(homeKey(STANDARD)).toEqual({ tonic: 4, scale: 'natural' });
    expect(homeKey(TUNINGS.find((item) => item.id === 'dadgad')!.notes).tonic).toBe(2);
  });
});
