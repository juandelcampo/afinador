// Armonía: escalas y grados con sus emociones, color, cadencias, puntos cardinales y figuras.
import { describe, expect, it } from 'vitest';
import {
  bassFor,
  CADENCES,
  cadenceChords,
  cardinalGroups,
  CHORD_STEPS,
  chordName,
  chordToken,
  cinemaLinks,
  colorGroups,
  commonTones,
  degreeLabel,
  feelingOf,
  feelingTag,
  findScale,
  functionOf,
  functionSubstitutes,
  parseChord,
  pedalStrings,
  samePole,
  SCALES,
  scaleDegrees,
  variantsOf,
  type Chord,
  type Key,
} from '~/core/harmony';
import { noteToMidi } from '~/core/notes';
import { fingeringFor, MUTED } from '~/core/tuning';
import { STANDARD, TUNINGS } from '~/data/tunings';

const key = (tonic: number, scale: string): Key => ({ tonic, scale: findScale(scale)! });
const names = (k: Key) => scaleDegrees(k).map((item) => chordName(item.chord, k, 'letters'));

describe('escalas y grados', () => {
  it('arma los grados de la tabla de De María, con séptima donde él la pone; en menor la armonía es la de la natural', () => {
    expect(names(key(0, 'mayor'))).toEqual(['C', 'Dm', 'Em', 'F', 'G7', 'Am', 'Bm7♭5']);
    expect(names(key(9, 'natural'))).toEqual(['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G']);
    // La armónica y la melódica no dan un III aumentado: solo aportan el V7, el VII7dim y el IV mayor.
    expect(names(key(9, 'armonica'))).toEqual(['Am', 'Bdim', 'C', 'Dm', 'E7', 'F', 'G#dim7']);
    expect(names(key(9, 'bachiana'))).toEqual(['Am', 'Bdim', 'C', 'D', 'E7', 'F', 'G']);
  });

  it('escribe cada grado con su letra: Fa# en Re mayor, Sib en Fa mayor', () => {
    expect(names(key(2, 'mayor'))).toEqual(['D', 'Em', 'F#m', 'G', 'A7', 'Bm', 'C#m7♭5']);
    expect(names(key(5, 'mayor'))).toEqual(['F', 'Gm', 'Am', 'Bb', 'C7', 'Dm', 'Em7♭5']);
    expect(chordName({ root: 0, suffix: '' }, key(0, 'mayor'), 'solfege')).toBe('Do');
  });

  it('los grados se nombran como en el libro', () => {
    const k = key(9, 'armonica');
    expect(scaleDegrees(k).map((item) => degreeLabel(item.chord, k))).toEqual([
      'Im',
      'IIdim',
      'III',
      'IVm',
      'V7',
      'VI',
      'VII7dim',
    ]);
    expect(degreeLabel({ root: 8, suffix: '' }, key(0, 'mayor'))).toBe('♭VI');
  });

  it('cada grado de las cuatro escalas tonales tiene su emoción', () => {
    for (const scale of SCALES.filter((item) => item.family === 'tonal')) {
      expect(scale.feelings, scale.id).toHaveLength(7);
    }
    const major = key(0, 'mayor');
    expect(feelingTag(feelingOf({ root: 7, suffix: '7' }, major)!)).toBe('ALEGRE ++');
    // El V sin séptima es el mismo grado: dice lo mismo.
    expect(feelingOf({ root: 7, suffix: '' }, major)?.words).toContain('Efusivo');
    expect(feelingTag(feelingOf({ root: 4, suffix: 'm' }, major)!)).toBe('TRISTE −−−');
    expect(feelingTag(scaleDegrees(major)[0]!.feeling!)).toBe('ALEGRE');
    expect(feelingOf({ root: 8, suffix: '' }, major)).toBeUndefined();
  });

  it('los modos marcan sus grados característicos y el disminuido peligroso', () => {
    const dorian = scaleDegrees(key(2, 'dorico'));
    expect(dorian.filter((item) => item.characteristic).map((item) => item.chord)).toEqual([
      { root: 4, suffix: 'm' },
      { root: 7, suffix: '' },
    ]);
    expect(dorian.find((item) => item.risky)?.chord.suffix).toBe('dim');
    for (const scale of SCALES.filter((item) => item.risky !== undefined)) {
      const risky = scaleDegrees({ tonic: 0, scale }).find((item) => item.risky)!;
      expect(risky.chord.suffix, scale.id).toBe('dim');
    }
    expect(scaleDegrees(key(11, 'locrio'))[0]!.chord.suffix).toBe('dim');
  });

  it('arma los grados de los mundos exóticos, también las tríadas raras', () => {
    expect(names(key(0, 'simpson'))).toEqual(['C', 'D', 'Edim', 'F#dim', 'Gm', 'Am', 'Bbaug']);
    expect(names(key(0, 'mayorArmonica'))).toEqual(['C', 'Ddim', 'Em', 'Fm', 'G7', 'Abaug', 'Bdim7']);
    expect(names(key(4, 'frigioDominante'))).toEqual(['E', 'F', 'G#dim', 'Am', 'Bdim', 'Caug', 'Dm']);
    expect(names(key(0, 'arabe'))).toEqual(['C', 'Db', 'Em', 'Fm', 'G(♭5)', 'Abaug', 'Bsus2(♭5)']);
    expect(names(key(9, 'hungara'))).toEqual(['Am', 'B(♭5)', 'Caug', 'D#sus2(♭5)', 'E', 'F', 'G#m']);
    // Cada exótica marca lo que la distingue, y las tríadas raras van y vuelven por la URL.
    for (const scale of SCALES.filter((item) => item.family === 'exotica')) {
      expect(scale.characteristic?.length, scale.id).toBeGreaterThan(0);
    }
    expect(parseChord('G(b5)')).toEqual({ root: 7, suffix: '(b5)' });
    expect(chordToken(parseChord('Bsus2(b5)')!)).toBe('Bsus2(b5)');
  });
});

describe('color', () => {
  it('en mayor presta del menor y suma dominantes secundarias', () => {
    const groups = colorGroups(key(0, 'mayor'), null);
    const of = (id: string) =>
      groups.find((group) => group.id === id)!.chords.map((item) => chordToken(item.chord));
    expect(of('mezcla')).toEqual(expect.arrayContaining(['Cm', 'Fm', 'Ab', 'Bb']));
    expect(of('secundarias')).toEqual(['A7', 'B7', 'C7', 'D7', 'E7']);
    expect(of('especiales')).toContain('Db');
    expect(groups.some((group) => group.id === 'cine')).toBe(false);
  });

  it('en menor mezcla las tres menores sin repetir lo que ya está', () => {
    const k = key(9, 'natural');
    const mezcla = colorGroups(k, null).find((group) => group.id === 'mezcla')!.chords;
    const tokens = mezcla.map((item) => chordToken(item.chord));
    expect(tokens).toEqual(expect.arrayContaining(['E7', 'Abdim7', 'D']));
    expect(tokens).not.toContain('Caug');
    expect(new Set(tokens).size).toBe(tokens.length);
    for (const item of scaleDegrees(k)) expect(tokens).not.toContain(chordToken(item.chord));
  });

  it('los enlaces de cine respetan la nota común de cada caso', () => {
    const shares = (a: Chord, b: Chord) => commonTones(a, b).length > 0;
    for (const from of [
      { root: 0, suffix: '' },
      { root: 0, suffix: 'm' },
    ] satisfies Chord[]) {
      for (const link of cinemaLinks(from)) {
        if (link.label.includes('sin nota común')) expect(shares(from, link.chord), link.label).toBe(false);
        if (link.label.includes('con nota común') || link.label.startsWith('Semitono'))
          expect(shares(from, link.chord), link.label).toBe(true);
      }
    }
    expect(cinemaLinks({ root: 2, suffix: '' })[0]!.chord).toEqual({ root: 3, suffix: 'm' });
  });

  it('las variantes de un acorde cambian el color pero no la raíz', () => {
    for (const suffix of ['', 'm', 'dim', '7', 'm7b5'] as const) {
      for (const variant of variantsOf({ root: 4, suffix }))
        expect(CHORD_STEPS[variant.suffix]).toBeDefined();
    }
    expect(variantsOf({ root: 0, suffix: '' }).find((item) => item.suffix === '7')?.why).toMatch(/pregunta/);
  });

  it('el bajo puede ser la raíz, la tercera o la quinta', () => {
    expect(bassFor({ root: 0, suffix: '' }, 'tercera')).toBe(4);
    expect(bassFor({ root: 0, suffix: 'm' }, 'tercera')).toBe(3);
    expect(bassFor({ root: 0, suffix: 'dim' }, 'quinta')).toBe(6);
    expect(bassFor({ root: 0, suffix: 'sus4' }, 'tercera')).toBe(5);
  });
});

describe('cadencias y vuelta', () => {
  it('las ocho cadencias terminan en la tónica', () => {
    expect(CADENCES).toHaveLength(8);
    for (const cadence of CADENCES) expect(cadenceChords(cadence, 9).at(-1)!.root).toBe(9);
    expect(
      cadenceChords(
        CADENCES.find((item) => item.id === 'napolitana')!,
        9,
      ).map(chordToken),
    ).toEqual(['Bb', 'E7', 'Am']);
  });

  it('encuentra las cuerdas al aire que entran en toda la vuelta', () => {
    const open = STANDARD.map((note) => noteToMidi(note) % 12);
    const vuelta: Chord[] = [
      { root: 4, suffix: 'm' },
      { root: 0, suffix: 'maj7' },
    ];
    // Mi grave, Sol, Si y Mi agudo están en Em y en Cmaj7.
    expect(pedalStrings(open, vuelta)).toEqual([0, 3, 4, 5]);
    expect(pedalStrings(open, [])).toEqual([]);
  });

  it('la vuelta va y vuelve de la URL', () => {
    for (const text of ['C', 'F#m7', 'Bbdim7', 'C/E', 'A(b3)', 'Gm(maj7)', 'E7b9']) {
      expect(chordToken(parseChord(text)!)).toBe(text);
    }
    expect(parseChord('C/F#')).toBeNull();
    expect(parseChord('Cfoo')).toBeNull();
    expect(parseChord('C/C')).toEqual({ root: 0, suffix: '' });
  });
});

describe('puntos cardinales', () => {
  it('reparten las doce raíces en grupos sin repetir', () => {
    for (const geometry of ['cuadrado', 'triangulo'] as const) {
      const roots = cardinalGroups(geometry).flatMap((group) => group.points.map((point) => point.root));
      expect(new Set(roots).size, geometry).toBe(12);
    }
    // Cuadrado del libro, grupo 2: Do al norte, La al este, Fa# al sur y Mib al oeste.
    expect(cardinalGroups('cuadrado')[1]!.points.map((point) => point.root)).toEqual([0, 9, 6, 3]);
    expect(cardinalGroups('triangulo')[0]!.points.map((point) => point.root)).toEqual([0, 8, 4]);
  });

  it('por el mismo polo pasa a los otros grupos', () => {
    expect(samePole(0)).toEqual({ pole: 'N', roots: [11, 1] });
  });
});

describe('figuras para cualquier acorde', () => {
  it('encuentra las figuras de siempre en la estándar', () => {
    expect(fingeringFor(STANDARD, 0, CHORD_STEPS['']!)?.label).toBe('× 3 2 0 1 0');
    expect(fingeringFor(STANDARD, 9, CHORD_STEPS['m']!)?.label).toBe('× 0 2 2 1 0');
    expect(fingeringFor(STANDARD, 0, CHORD_STEPS['']!, 4)?.frets[0]).toBe(MUTED);
  });

  it('suena lo que dice: las notas de la figura son las del acorde, con el bajo pedido', () => {
    const open = STANDARD.map(noteToMidi);
    const cases: Array<[number, string, number]> = [
      [7, '7', 7],
      [11, 'dim7', 11],
      [0, '', 4],
      [9, 'm7', 9],
    ];
    for (const [root, suffix, bass] of cases) {
      const shape = fingeringFor(STANDARD, root, CHORD_STEPS[suffix]!, bass)!;
      const midis = shape.frets.flatMap((fret, index) => (fret === MUTED ? [] : [open[index]! + fret]));
      const classes = new Set(midis.map((midi) => midi % 12));
      const wanted = new Set(CHORD_STEPS[suffix]!.map((step) => (root + step) % 12));
      if (shape.noFifth) wanted.delete((root + 7) % 12);
      expect(classes, `${root}${suffix}`).toEqual(wanted);
      expect(Math.min(...midis) % 12).toBe(bass);
    }
  });

  it('los grados de cada escala tienen figura en las afinaciones abiertas', () => {
    for (const tuning of TUNINGS.filter((item) => ['open-d', 'dadgad', 'open-g'].includes(item.id))) {
      for (const scale of SCALES.filter((item) => item.family === 'tonal')) {
        for (const item of scaleDegrees({ tonic: noteToMidi(tuning.notes[0]!) % 12, scale })) {
          const shape = fingeringFor(tuning.notes, item.chord.root, CHORD_STEPS[item.chord.suffix]!);
          expect(shape, `${tuning.id} ${scale.id} ${chordToken(item.chord)}`).not.toBeNull();
        }
      }
    }
  });
});

describe('sustitución por función', () => {
  const sub = (chord: Chord, k: Key) =>
    functionSubstitutes(chord, k).map((item) => `${item.label} ${chordName(item.chord, k, 'letters')}`);

  it('dice qué papel cumple cada grado', () => {
    const c = key(0, 'mayor');
    expect(scaleDegrees(c).map((item) => functionOf(item.chord, c)?.id)).toEqual([
      'tonica',
      'subdominante',
      'tonica',
      'subdominante',
      'dominante',
      'tonica',
      'dominante',
    ]);
    expect(functionOf({ root: 8, suffix: '' }, c)).toBeNull();
  });

  it('cambia un acorde por los de su mismo papel, con séptima si la tiene', () => {
    const c = key(0, 'mayor');
    expect(sub({ root: 0, suffix: '' }, c)).toEqual(['VIm Am', 'IIIm Em']);
    expect(sub({ root: 5, suffix: 'maj7' }, c)).toEqual(['IIm7 Dm7']);
    expect(sub({ root: 7, suffix: '' }, c)).toEqual(['VIIdim Bdim']);
  });

  it('sobre el V7 suma el sustituto tritonal', () => {
    const c = key(0, 'mayor');
    expect(sub({ root: 7, suffix: '7' }, c)).toEqual(['VIIm7♭5 Bm7♭5', '♭II7 tritonal Db7']);
  });

  it('sin sensible, la dominante no tiene punta', () => {
    expect(functionOf({ root: 4, suffix: 'm' }, key(9, 'natural'))?.why).toMatch(/sin sensible/);
    expect(functionOf({ root: 4, suffix: '7' }, key(9, 'armonica'))?.why).toMatch(/volver al I/);
  });
});
