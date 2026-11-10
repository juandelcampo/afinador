// Lo que el afinador necesita que ande: notas, detección de altura, síntesis, y el catálogo.
// Sale de los tests de Scordatura (core, data y tools), sin lo de las otras herramientas.
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  centsBetween,
  centsToTarget,
  intervalName,
  isNote,
  midiToHz,
  midiToNote,
  noteToMidi,
} from '~/core/notes';
import { sanitize } from '~/shared/settings';
import { detectPitch, PitchTracker } from '~/core/pitch';
import { pluck } from '~/core/pluck';
import {
  chordShapes,
  MUTED,
  openChordName,
  stringIntervals,
  stringOffsets,
  tensionWarning,
} from '~/core/tuning';
import { GROUPS, STANDARD, TUNINGS } from '~/data/tunings';

const SR = 48000;
const WINDOW = 4096;

describe('notas', () => {
  it('convierte notas a MIDI y a frecuencia', () => {
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('E2')).toBe(40);
    expect(noteToMidi('F#2')).toBe(noteToMidi('Gb2'));
    expect(midiToNote(40)).toBe('E2');
    expect(midiToHz(40)).toBeCloseTo(82.407, 2);
    expect(midiToHz(69, 432)).toBeCloseTo(432, 9);
  });

  it('pliega solo los errores de octava exacta', () => {
    expect(Math.abs(centsToTarget(220, 110))).toBeLessThan(0.01);
    expect(Math.abs(centsToTarget(110, 220))).toBeLessThan(0.01);
    expect(centsToTarget(110 * Math.pow(2, 7 / 12), 110)).toBeGreaterThan(600);
    expect(centsToTarget(110 * Math.pow(2, -5 / 12), 110)).toBeLessThan(-400);
  });

  it('nombra los intervalos entre cuerdas', () => {
    expect(intervalName(40, 45)).toBe('4J');
    expect(intervalName(43, 43)).toBe('=');
    expect(intervalName(55, 52)).toBe('↓3m');
    expect(intervalName(40, 52)).toBe('8J');
  });
});

describe('detección de altura', () => {
  const tone = (fn: (phase: number) => number, freq: number) =>
    new Float32Array(WINDOW).map((_, i) => fn((2 * Math.PI * freq * i) / SR));

  it('detecta senoidales desde el Si grave hasta el agudo con precisión menor a 1 cent', () => {
    for (const note of ['B1', 'C2', 'E2', 'A2', 'D3', 'G3', 'E4', 'G4', 'B4']) {
      const freq = midiToHz(noteToMidi(note));
      const result = detectPitch(
        tone((phase) => 0.5 * Math.sin(phase), freq),
        SR,
      );
      expect(result, note).not.toBeNull();
      expect(Math.abs(centsBetween(result!.freq, freq)), note).toBeLessThan(1);
    }
  });

  it('no se confunde de octava cuando el segundo armónico domina', () => {
    for (const note of ['B1', 'D2', 'E2', 'A2']) {
      const freq = midiToHz(noteToMidi(note));
      const signal = tone((p) => 0.2 * Math.sin(p) + 0.6 * Math.sin(2 * p) + 0.2 * Math.sin(3 * p), freq);
      const result = detectPitch(signal, SR);
      expect(result, note).not.toBeNull();
      expect(Math.abs(centsBetween(result!.freq, freq)), note).toBeLessThan(5);
    }
  });

  it('ignora el silencio y el ruido', () => {
    expect(detectPitch(new Float32Array(WINDOW), SR)).toBeNull();
    let state = 7;
    const noise = new Float32Array(WINDOW).map(() => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 2147483648 - 1;
    });
    expect(detectPitch(noise, SR)).toBeNull();
  });

  it('con ruido de fondo no se corre ni salta de octava', () => {
    let state = 11;
    const noise = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 2147483648 - 1;
    };
    for (const note of ['E2', 'A2', 'G3', 'E4']) {
      const freq = midiToHz(noteToMidi(note));
      for (let phase = 0; phase < 6; phase++) {
        const signal = tone(
          (p) => 0.03 * (0.4 * Math.sin(p + phase) + 0.6 * Math.sin(2 * p + 2 * phase)) + 0.01 * noise(),
          freq,
        );
        const result = detectPitch(signal, SR, { fallback: 0.3 });
        expect(result, note).not.toBeNull();
        expect(Math.abs(centsBetween(result!.freq, freq)), note).toBeLessThan(3);
      }
    }
  });

  it('el nivel de continua no cambia la lectura', () => {
    const freq = midiToHz(noteToMidi('A2'));
    const result = detectPitch(
      tone((p) => 0.2 + 0.3 * Math.sin(p), freq),
      SR,
    );
    expect(Math.abs(centsBetween(result!.freq, freq))).toBeLessThan(1);
  });

  it('descarta las lecturas sueltas con la mediana', () => {
    const tracker = new PitchTracker(5);
    [110, 110, 220, 110, 110].forEach((value) => tracker.push(value));
    expect(tracker.push(110)).toBe(110);
  });
});

describe('síntesis', () => {
  it('los tonos de todas las afinaciones suenan afinados, también con capo y trastes', () => {
    const notes = new Set(TUNINGS.flatMap((tuning) => tuning.notes));
    for (const offset of [0, 7, 12]) {
      for (const note of notes) {
        const freq = midiToHz(noteToMidi(note) + offset);
        const signal = pluck(freq, SR, 1);
        const start = Math.floor(0.25 * SR);
        const result = detectPitch(signal.subarray(start, start + WINDOW), SR);
        expect(result, `${note}+${offset}`).not.toBeNull();
        expect(Math.abs(centsBetween(result!.freq, freq)), `${note}+${offset}`).toBeLessThan(2);
      }
    }
  });

  it('funciona con otras frecuencias de muestreo', () => {
    for (const sampleRate of [44100, 96000]) {
      const freq = midiToHz(noteToMidi('B1'));
      const signal = pluck(freq, sampleRate, 1);
      const start = Math.floor(0.25 * sampleRate);
      const result = detectPitch(signal.subarray(start, start + 8192), sampleRate);
      expect(result).not.toBeNull();
      expect(Math.abs(centsBetween(result!.freq, freq))).toBeLessThan(2);
    }
  });
});

describe('afinaciones', () => {
  const byId = (id: string) => TUNINGS.find((tuning) => tuning.id === id)!.notes;

  it('nombra el acorde que suena al aire', () => {
    const expected: Record<string, string> = {
      openg: 'G/D',
      opend: 'D',
      opene: 'E',
      opena: 'A/E',
      openc: 'C',
      openf: 'F/C',
      c6: 'C6',
      dminor: 'Dm',
      gminor: 'Gm/D',
      eminor: 'Em',
      cminor: 'Cm',
      aminor: 'Am/E',
      dadgad: 'Dsus4',
      dadead: 'Dsus2',
      cgcfcf: 'Csus4',
      cgcfce: 'Cadd11',
      cmaj9: 'Cmaj9',
      cmaj7: 'Cmaj7',
      em7: 'Em7',
      gmaj7: 'Gmaj7/D',
      dmaj7: 'Dmaj7',
      g6: 'G6/D',
      egdged: 'Em7(no5)',
      ostrich: 'Solo D',
      dronee: 'E5',
      estandar: 'Em11',
      minorthirds: 'Cdim7',
      tritones: 'Sin nombre: un cúmulo',
    };
    for (const [id, chord] of Object.entries(expected)) expect(openChordName(byId(id)), id).toBe(chord);
    expect(openChordName(byId('opend'), 'solfege')).toBe('Re');
  });

  it('calcula intervalos y desvíos', () => {
    expect(stringIntervals(byId('dadgad'))).toEqual(['5J', '4J', '4J', '2M', '4J']);
    expect(stringOffsets(byId('dropd'))).toEqual([-2, 0, 0, 0, 0, 0]);
  });

  it('avisa cuando una cuerda queda muy tensa o muy floja', () => {
    expect(tensionWarning({ notes: STANDARD })).toBeNull();
    expect(tensionWarning({ notes: byId('dadgdfs') })).toContain('2.ª (+3)');
    expect(tensionWarning({ notes: byId('ggddgg') })).toContain('1.ª (−9)');
  });

  it('DADGDF# equivale a CGCFCE con capo en el traste 2', () => {
    expect(byId('dadgdfs').map(noteToMidi)).toEqual(byId('cgcfce').map((note) => noteToMidi(note) + 2));
    expect(byId('dadgdg').map(noteToMidi)).toEqual(byId('cgcfcf').map((note) => noteToMidi(note) + 2));
  });
});

const noteSchema = z.string().refine(isNote, 'nota inválida');
const heardSchema = z.strictObject({
  artist: z.string().min(1),
  song: z.string().min(1).optional(),
  video: z
    .string()
    .regex(/^[\w-]{11}$/)
    .optional(),
  capo: z.number().int().min(1).max(12).optional(),
  conf: z.enum(['fan', 'duda']).optional(),
  who: z.string().min(1).optional(),
});
const tuningSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+$/),
  name: z.string().min(1),
  group: z.string(),
  notes: z.array(noteSchema).length(6),
  desc: z.string().min(1),
  octaves: z.literal('est').optional(),
  restring: z.boolean().optional(),
  heard: z.array(heardSchema).optional(),
});

describe('catálogo de afinaciones', () => {
  it('cumple el esquema', () => {
    for (const tuning of TUNINGS) expect(tuningSchema.safeParse(tuning).error, tuning.id).toBeUndefined();
  });

  it('tiene ids únicos y grupos conocidos', () => {
    const groups = new Set(GROUPS.map((group) => group.id));
    expect(new Set(TUNINGS.map((tuning) => tuning.id)).size).toBe(TUNINGS.length);
    for (const tuning of TUNINGS) expect(groups.has(tuning.group), tuning.id).toBe(true);
  });

  it('no repite afinaciones', () => {
    const keys = TUNINGS.map((tuning) => tuning.notes.map(noteToMidi).join());
    expect(new Set(keys).size).toBe(TUNINGS.length);
  });

  it('los nombres en letras coinciden con las notas', () => {
    for (const tuning of TUNINGS) {
      if (!/^[A-G#b]+$/.test(tuning.name)) continue;
      expect(tuning.notes.map((note) => note.replace(/\d/, '')).join(''), tuning.id).toBe(tuning.name);
    }
  });
});

describe('acordes', () => {
  const notesOf = (id: string) => TUNINGS.find((tuning) => tuning.id === id)!.notes;

  it('en estándar encuentra las figuras de siempre', () => {
    const shapes = chordShapes(STANDARD);
    const fretsOf = (chord: string) => shapes.find((shape) => shape.chord === chord)?.frets;
    const x = MUTED;
    expect(fretsOf('Em')).toEqual([0, 2, 2, 0, 0, 0]);
    expect(fretsOf('E')).toEqual([0, 2, 2, 1, 0, 0]);
    expect(fretsOf('G')).toEqual([3, 2, 0, 0, 0, 3]);
    expect(fretsOf('C')).toEqual([x, 3, 2, 0, 1, 0]);
    expect(fretsOf('Am')).toEqual([x, 0, 2, 2, 1, 0]);
    expect(fretsOf('D')).toEqual([x, x, 0, 2, 3, 2]);
    expect(shapes.find((shape) => shape.chord === 'C')?.label).toBe('× 3 2 0 1 0');
  });

  it('con capo las figuras son las mismas y los nombres suben', () => {
    // Estándar con capo en el 2: lo que suena es F# B E A C# F#.
    const capo2 = STANDARD.map((note) => midiToNote(noteToMidi(note) + 2));
    const plain = chordShapes(STANDARD);
    const shifted = chordShapes(capo2);
    expect(shifted.map((shape) => shape.frets)).toEqual(plain.map((shape) => shape.frets));
    expect(shifted.find((shape) => shape.label === '× 3 2 0 1 0')?.chord).toBe('D');
    expect(shifted.find((shape) => shape.label === '0 2 2 0 0 0')?.chord).toBe('F#m');
  });

  it('nombra los acordes en la notación elegida', () => {
    const shapes = chordShapes(STANDARD, { notation: 'solfege' });
    expect(shapes[0]!.chord).toBe(openChordName(STANDARD, 'solfege'));
    expect(shapes.find((shape) => shape.label === '× 3 2 0 1 0')?.chord).toBe('Do');
    expect(shapes.find((shape) => shape.label === '0 2 2 0 0 0')?.chord).toBe('Mim');
  });

  it('solo propone figuras que una mano puede hacer', () => {
    for (const tuning of TUNINGS)
      for (const { frets, label } of chordShapes(tuning.notes)) {
        const pressed = frets.filter((fret) => fret > 0);
        if (!pressed.length) continue;
        const low = Math.min(...pressed);
        expect(Math.max(...pressed) - low, tuning.id).toBeLessThanOrEqual(3);
        // Sin cejilla, un dedo por cuerda pisada; con cejilla, el índice cubre el traste más bajo.
        const fingers = label.includes('cejilla')
          ? 1 + pressed.filter((fret) => fret > low).length
          : pressed.length;
        expect(fingers, `${tuning.id} ${label}`).toBeLessThanOrEqual(4);
        // Solo se apagan las graves, y quedan al menos cuatro cuerdas sonando.
        const muted = frets.filter((fret) => fret === MUTED).length;
        expect(muted, tuning.id).toBeLessThanOrEqual(2);
        expect(
          frets.slice(0, muted).every((fret) => fret === MUTED),
          tuning.id,
        ).toBe(true);
      }
  });

  it('arranca al aire y no repite acordes', () => {
    const shapes = chordShapes(notesOf('opend'));
    expect(shapes[0]).toMatchObject({ chord: 'D', label: 'Al aire' });
    expect(shapes.some((shape) => shape.chord === 'G')).toBe(true);
    expect(new Set(shapes.map((shape) => shape.chord)).size).toBe(shapes.length);
  });
});

describe('afinaciones generales', () => {
  it('toda nota del catálogo se puede leer', () => {
    for (const tuning of TUNINGS)
      for (const note of tuning.notes) expect(noteToMidi(note)).toBeGreaterThan(0);
  });
});

describe('preferencias guardadas', () => {
  it('junta el volumen general y el del instrumento de antes sin cambiar cuánto suena', () => {
    expect(sanitize({ volumes: { master: 0.5, instrumento: 0.8 } }).volume).toBeCloseTo(0.4);
    expect(sanitize({ volume: 0.3, volumes: { master: 1, instrumento: 1 } }).volume).toBe(0.3);
    expect(sanitize({ volumes: { master: 'mucho', instrumento: 0.8 } }).volume).toBeUndefined();
  });

  it('descarta un tempo fuera del rango y un estilo que no existe', () => {
    const listen = sanitize({
      listen: { style: 'tambor', patterns: { arp: 'travis', strum: 3 }, tempo: 400 },
    } as never).listen;
    expect(listen).toEqual({ style: 'arp', patterns: { arp: 'travis', strum: 'single' }, tempo: 84 });
  });

  it('las favoritas olvidan las afinaciones que no existen y no se repiten', () => {
    expect(
      sanitize({ favorites: ['dadgad', 'inventada', 'dadgad', 7, 'estandar'] } as never).favorites,
    ).toEqual(['dadgad', 'estandar']);
    expect(sanitize({ favorites: 'dadgad' } as never).favorites).toBeUndefined();
  });
});
