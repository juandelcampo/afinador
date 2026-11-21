// ¿Qué acorde?: ponerle nombre a una forma cualquiera.
import { describe, expect, it } from 'vitest';
import { chordToken } from '~/core/harmony';
import { identifyChord } from '~/core/identify';
import { bassReading, parseFrets } from '~/core/inversions';
import { noteToMidi } from '~/core/notes';
import { MUTED } from '~/core/tuning';
import { STANDARD, TUNINGS } from '~/data/tunings';

const standard = STANDARD.map(noteToMidi);

/** Las lecturas de una forma en tab ("x-3-2-0-1-0"), como texto: "C", "Am7/C". */
function read(tab: string, open = standard) {
  const frets = parseFrets(tab, open.length, 15)!;
  const midis = frets.map((fret, index) => (fret === MUTED ? null : open[index]! + fret));
  return identifyChord(midis).map((reading) =>
    chordToken({ root: reading.root, suffix: reading.suffix, bass: reading.bass }),
  );
}

describe('identifyChord', () => {
  it('las formas de siempre se llaman como siempre', () => {
    expect(read('x-3-2-0-1-0')[0]).toBe('C');
    expect(read('0-2-2-0-0-0')[0]).toBe('Em');
    expect(read('x-0-2-2-1-0')[0]).toBe('Am');
    expect(read('x-0-2-0-1-0')[0]).toBe('Am7');
    expect(read('3-2-0-0-0-3')[0]).toBe('G');
    expect(read('x-x-0-2-3-2')[0]).toBe('D');
    expect(read('x-3-5-3-4-3')[0]).toBe('Cm7');
    expect(read('x-0-2-0-2-0')[0]).toBe('A7');
  });

  it('con otra nota en el bajo es una inversión', () => {
    expect(read('0-3-2-0-1-0')[0]).toBe('C/E');
    expect(read('3-x-2-0-1-0')[0]).toBe('C/G');
  });

  it('si se puede leer de dos maneras, gana la que tiene la raíz en el bajo y la otra queda de segunda', () => {
    // Do, Mi, Sol y La: con el Do abajo es C6; también es Am7 con el Do en el bajo.
    expect(read('x-3-2-2-1-3').slice(0, 2)).toEqual(['C6', 'Am7/C']);
    expect(read('x-0-2-2-1-3').slice(0, 2)).toEqual(['Am7', 'C6/A']);
  });

  it('las cuerdas al aire de la estándar son un Em11, sin la novena', () => {
    const [first] = identifyChord(standard);
    expect(first).toMatchObject({ root: 4, suffix: 'm11', bass: 4, omitted: [2] });
  });

  it('sin la quinta el acorde se reconoce igual', () => {
    // Sol, Si y Fa: un G7 sin la 5.ª.
    const [first] = identifyChord([noteToMidi('G2'), noteToMidi('B2'), noteToMidi('F3'), null, null, null]);
    expect(first).toMatchObject({ root: 7, suffix: '7', omitted: [7] });
  });

  it('dos notas a una quinta son un acorde de quinta; una sola nota o un cúmulo no tienen nombre', () => {
    expect(read('x-x-0-2-x-x')[0]).toBe('D5');
    expect(read('x-x-0-x-x-x')).toEqual([]);
    expect(read('x-x-x-x-x-x')).toEqual([]);
    // Do, Do#, Re y Re#: un racimo cromático.
    expect(identifyChord([noteToMidi('C3'), noteToMidi('C#3'), noteToMidi('D3'), noteToMidi('D#3')])).toEqual(
      [],
    );
  });

  it('en DADGAD al aire suena un Dsus4', () => {
    const dadgad = TUNINGS.find((tuning) => tuning.id === 'dadgad')!.notes.map(noteToMidi);
    expect(read('0-0-0-0-0-0', dadgad)[0]).toBe('Dsus4');
  });
});

describe('bassReading', () => {
  it('dice qué inversión da cada nota en el bajo', () => {
    expect(bassReading('', 0)).toMatchObject({ inversion: 0, tone: 'R' });
    expect(bassReading('', 4)).toMatchObject({ inversion: 1, tone: '3' });
    expect(bassReading('', 7)).toMatchObject({ inversion: 2, tone: '5' });
    expect(bassReading('m7', 10)).toMatchObject({ inversion: 3, tone: '♭7' });
    expect(bassReading('m11', 5).tone).toBe('11');
  });
});
