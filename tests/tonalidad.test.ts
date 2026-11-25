// ¿Qué tonalidad?: leer acordes y notas escritos a mano, adivinar la tonalidad y llevarla a otra.
import { describe, expect, it } from 'vitest';
import { chordToken, type Chord } from '~/core/harmony';
import {
  capoFor,
  guessFromChords,
  guessFromNotes,
  readChord,
  readChords,
  readNote,
  readNotes,
  relativeOf,
  shiftBetween,
  transposeChord,
} from '~/core/tonalidad';

const PLAIN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const name = (chord: Chord) => chordToken(chord);
const noteName = (pc: number) => PLAIN[pc]!;
const chords = (text: string) => readChords(text).map((token) => token.value!);
const top = (text: string) => {
  const best = guessFromChords(chords(text), name)[0]!;
  return `${PLAIN[best.tonic]} ${best.mode}`;
};

describe('leer lo que se escribe', () => {
  it('acordes en letras, en castellano y con las maneras de siempre de escribir el tipo', () => {
    expect(readChord('Am')).toEqual({ root: 9, suffix: 'm' });
    expect(readChord('lam')).toEqual({ root: 9, suffix: 'm' });
    expect(readChord('Sol7')).toEqual({ root: 7, suffix: '7' });
    expect(readChord('F#m7')).toEqual({ root: 6, suffix: 'm7' });
    expect(readChord('Si♭maj7')).toEqual({ root: 10, suffix: 'maj7' });
    expect(readChord('C7M')).toEqual({ root: 0, suffix: 'maj7' });
    expect(readChord('B°')).toEqual({ root: 11, suffix: 'dim' });
    expect(readChord('Bø')).toEqual({ root: 11, suffix: 'm7b5' });
    expect(readChord('C/E')).toEqual({ root: 0, suffix: '', bass: 4 });
  });

  it('"Fadd9" es F con novena, no Fa con "dd9"', () => {
    expect(readChord('Fadd9')).toEqual({ root: 5, suffix: 'add9' });
    expect(readChord('Fa')).toEqual({ root: 5, suffix: '' });
  });

  it('lo que no se entiende queda marcado, sin romper lo demás', () => {
    const tokens = readChords('Am | F, xyz  C - G');
    expect(tokens.map((token) => token.text)).toEqual(['Am', 'F', 'xyz', 'C', '-', 'G']);
    expect(tokens[2]!.value).toBeNull();
  });

  it('notas sueltas, con o sin octava', () => {
    expect(readNote('E4')).toBe(4);
    expect(readNote('sol')).toBe(7);
    expect(readNote('Si♭')).toBe(10);
    expect(readNote('Am')).toBeNull();
    expect(readNotes('do re mi').map((token) => token.value)).toEqual([0, 2, 4]);
  });
});

describe('qué tonalidad', () => {
  it('las vueltas de siempre', () => {
    expect(top('C G Am F')).toBe('C mayor');
    expect(top('Am F C G')).toBe('A menor');
    expect(top('G D Em C')).toBe('G mayor');
    expect(top('E A B7 E')).toBe('E mayor');
    expect(top('Dm Bb C Dm')).toBe('D menor');
  });

  it('en menor, la dominante con la sensible es de la tonalidad: E7 en La menor', () => {
    const [best] = guessFromChords(chords('Am Dm E7 Am'), name);
    expect(`${PLAIN[best!.tonic]} ${best!.mode}`).toBe('A menor');
    expect(best!.fit).toBe(4);
    expect(best!.why).toContain('Arranca y termina en Am');
    expect(best!.why).toContain('La E lleva a Am');
  });

  it('dice qué acordes son de afuera', () => {
    const [best] = guessFromChords(chords('C F Fm C'), name);
    expect(`${PLAIN[best!.tonic]} ${best!.mode}`).toBe('C mayor');
    expect(best!.outside).toEqual([2]);
  });

  it('una melodía: Do re mi fa sol… que termina en do es Do mayor', () => {
    const notes = readNotes('C D E F G A B C').map((token) => token.value!);
    const [best] = guessFromNotes(notes, noteName);
    expect(`${PLAIN[best!.tonic]} ${best!.mode}`).toBe('C mayor');
    expect(best!.why).toContain('Termina en C');
  });

  it('una melodía en menor que se apoya en la tónica', () => {
    const notes = readNotes('A C E D C B A E A').map((token) => token.value!);
    const [best] = guessFromNotes(notes, noteName);
    expect(`${PLAIN[best!.tonic]} ${best!.mode}`).toBe('A menor');
  });

  it('la relativa comparte las notas', () => {
    expect(relativeOf(0, 'mayor')).toEqual({ tonic: 9, mode: 'menor' });
    expect(relativeOf(9, 'menor')).toEqual({ tonic: 0, mode: 'mayor' });
  });
});

describe('llevarla a otra', () => {
  it('transporta la raíz y el bajo', () => {
    expect(transposeChord({ root: 0, suffix: '', bass: 4 }, 2)).toEqual({ root: 2, suffix: '', bass: 6 });
    expect(shiftBetween(0, 9)).toBe(-3);
    expect(shiftBetween(9, 0)).toBe(3);
  });

  it('sugiere la cejilla que deja las formas de siempre', () => {
    // En Do menor (Cm Ab Eb Bb) no hay ninguna abierta. Con cejilla en el 1 son Bm G D A y en el 3,
    // Am F C G: tres de cuatro en las dos, y gana la más baja.
    const capo = capoFor(chords('Cm Ab Eb Bb'));
    expect(capo?.fret).toBe(1);
    expect(capo?.shapes.map(name)).toEqual(['Bm', 'G', 'D', 'A']);
    expect(capo?.open).toBe(3);
    // Bb F Gm Eb con cejilla en el 3: G D Em C, todas abiertas.
    const easy = capoFor(chords('Bb F Gm Eb'));
    expect(easy?.fret).toBe(3);
    expect(easy?.shapes.map(name)).toEqual(['G', 'D', 'Em', 'C']);
    // Si ya se toca abierto, no hace falta.
    expect(capoFor(chords('C G Am F'))).toBeNull();
  });
});
