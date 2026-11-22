// Escalas para tocar: todas las de Armonía (con el carácter que les da De María) y además las
// pentatónicas, el blues, más exóticas, las de jazz y las simétricas. Las palabras de las que no están en
// Armonía son nuestras. Acá no se arman acordes: se ve dónde cae cada nota en el mástil y cómo suena.
import { SCALES, spellWithLetter, tonicNames, type Point } from './harmony';
import { noteToMidi } from './notes';
import { openChord } from './tuning';

export type ScaleFamily = 'tonal' | 'modo' | 'pentatonica' | 'exotica' | 'jazz' | 'simetrica';

export interface ScaleInfo {
  id: string;
  name: string;
  /** Otro nombre con el que se la conoce. */
  alias?: string;
  family: ScaleFamily;
  character: string;
  /** Semitonos desde la tónica. */
  steps: readonly number[];
  /** Si la tónica se escribe como en las tonalidades menores (C#, G#) o mayores (Db, Ab). */
  minorSpelling: boolean;
  /** Solo las de Armonía: si tiene sensible que tira a la tónica. */
  point?: Point;
  /** Si Armonía la conoce: entonces sus acordes están allá, con la misma URL. */
  inArmonia: boolean;
}

export const FAMILY_NAMES: Record<ScaleFamily, string> = {
  tonal: 'Tonales',
  modo: 'Modos',
  pentatonica: 'Pentatónicas',
  exotica: 'Exóticas',
  jazz: 'De jazz',
  simetrica: 'Simétricas',
};

/** Las de menos de siete notas y las nuevas: con tercera menor y sin mayor, se escriben como menores. */
const extra = (
  id: string,
  name: string,
  family: ScaleFamily,
  steps: number[],
  character: string,
  alias?: string,
): ScaleInfo => ({
  id,
  name,
  alias,
  family,
  character,
  steps,
  minorSpelling: steps.includes(3) && !steps.includes(4),
  inArmonia: false,
});

const FROM_ARMONIA: ScaleInfo[] = SCALES.map((scale) => ({
  id: scale.id,
  name: scale.name,
  alias: scale.alias,
  family: scale.family,
  character: scale.character,
  steps: scale.steps,
  minorSpelling: scale.minorSpelling,
  point: scale.point,
  inArmonia: true,
}));

const PENTATONICAS: ScaleInfo[] = [
  extra(
    'pentaMenor',
    'Pentatónica menor',
    'pentatonica',
    [0, 3, 5, 7, 10],
    'La del rock y el blues, la primera que aprende la mano. Cinco notas que caen bien encima de casi todo.',
  ),
  extra(
    'pentaMayor',
    'Pentatónica mayor',
    'pentatonica',
    [0, 2, 4, 7, 9],
    'Cinco notas sin semitonos: nada choca. De campo, de folklore, de country y de canción de cuna.',
  ),
  extra(
    'blues',
    'Blues',
    'pentatonica',
    [0, 3, 5, 6, 7, 10],
    'La pentatónica menor con la ♭5, la nota que arrastra. No se queda ahí: se pasa por ella.',
  ),
  extra(
    'bluesMayor',
    'Blues mayor',
    'pentatonica',
    [0, 2, 3, 4, 7, 9],
    'La pentatónica mayor con la ♭3 de paso hacia la 3: country, soul, el blues que sonríe.',
  ),
  extra(
    'egipcia',
    'Egipcia',
    'pentatonica',
    [0, 2, 5, 7, 10],
    'Sin tercera: ni alegre ni triste, queda flotando. De gaita, de canción celta.',
    'Suspendida',
  ),
];

const EXOTICAS: ScaleInfo[] = [
  extra(
    'napolitanaMenor',
    'Napolitana menor',
    'exotica',
    [0, 1, 3, 5, 7, 8, 11],
    'La menor armónica con el ♭2: ópera y tragedia, más oscura que cualquier menor.',
  ),
  extra(
    'napolitanaMayor',
    'Napolitana mayor',
    'exotica',
    [0, 1, 3, 5, 7, 9, 11],
    'Arranca oscura, con el ♭2 y el ♭3, y sube luminosa hasta la sensible. Rara y elegante.',
  ),
  extra(
    'rumana',
    'Rumana',
    'exotica',
    [0, 2, 3, 6, 7, 9, 10],
    'La dórica con el 4.º subido: klezmer, música del este, una menor que se queja.',
    'Dórica ♯4',
  ),
  extra(
    'hungaraMayor',
    'Húngara mayor',
    'exotica',
    [0, 3, 4, 6, 7, 9, 10],
    'Abajo, la ♯2 y la 3 juntas; arriba, la ♯4. Zíngara, vistosa, de virtuoso.',
  ),
  extra(
    'persa',
    'Persa',
    'exotica',
    [0, 1, 4, 5, 6, 8, 11],
    'La árabe con el 5.º bajado: más tensa todavía, casi sin lugar donde descansar.',
  ),
  extra(
    'hindu',
    'Hindú',
    'exotica',
    [0, 2, 4, 5, 7, 8, 10],
    'Empieza mayor y se oscurece arriba: agridulce, de banda de sonido.',
    'Mixolidio ♭6',
  ),
  extra(
    'enigmatica',
    'Enigmática',
    'exotica',
    [0, 1, 4, 6, 8, 10, 11],
    'Inventada como desafío de armonía: tonos enteros arriba y una sensible que no termina de resolver.',
  ),
  extra(
    'prometeo',
    'Prometeo',
    'exotica',
    [0, 2, 4, 6, 9, 10],
    'Seis notas de un solo acorde abierto, sin 5.ª: misteriosa, suspendida en el aire.',
  ),
  extra(
    'hirajoshi',
    'Hirajoshi',
    'exotica',
    [0, 2, 3, 7, 8],
    'Japonesa, de koto: cinco notas con dos semitonos. Quieta, oscura, con mucho aire.',
  ),
  extra(
    'kumoi',
    'Kumoi',
    'exotica',
    [0, 2, 3, 7, 9],
    'Japonesa y luminosa: la ♭3 con la 6 mayor, más dulce que la hirajoshi.',
  ),
  extra(
    'inSen',
    'In sen',
    'exotica',
    [0, 1, 5, 7, 10],
    'Japonesa, de templo: el ♭2 y sin tercera. Sobria, suspendida, de campana.',
  ),
  extra(
    'iwato',
    'Iwato',
    'exotica',
    [0, 1, 5, 6, 10],
    'Japonesa y la más tensa: ♭2 y ♭5, sin tercera ni quinta. Inquietante.',
  ),
];

const JAZZ: ScaleInfo[] = [
  extra(
    'bebopDominante',
    'Bebop dominante',
    'jazz',
    [0, 2, 4, 5, 7, 9, 10, 11],
    'El mixolidio con la 7 de paso: con ocho notas, al correr en corcheas las del acorde caen en el tiempo.',
  ),
  extra(
    'bebopMayor',
    'Bebop mayor',
    'jazz',
    [0, 2, 4, 5, 7, 8, 9, 11],
    'La mayor con el ♭6 de paso: ocho notas para que el swing caiga parejo.',
  ),
  extra(
    'doricoB2',
    'Dórico ♭2',
    'jazz',
    [0, 1, 3, 5, 7, 9, 10],
    'Frigio abajo y dórico arriba: oscura al arrancar, clara al subir.',
  ),
  extra(
    'lidioAumentado',
    'Lidio aumentado',
    'jazz',
    [0, 2, 4, 6, 8, 9, 11],
    'El lidio con el 5.º subido: brillante y sin piso, de cuento de hadas.',
  ),
  extra(
    'locrioNatural',
    'Locrio ♮2',
    'jazz',
    [0, 2, 3, 5, 6, 8, 10],
    'El locrio con la 2 natural: menos áspero. Para el m7♭5 de los tangos y los boleros.',
  ),
  extra(
    'alterada',
    'Alterada',
    'jazz',
    [0, 1, 3, 4, 6, 8, 10],
    'Todo lo que se puede alterar, alterado: para el acorde de dominante justo antes de resolver. Sola suena perdida.',
    'Superlocria',
  ),
];

const SIMETRICAS: ScaleInfo[] = [
  extra(
    'tonosEnteros',
    'Tonos enteros',
    'simetrica',
    [0, 2, 4, 6, 8, 10],
    'Seis notas a un tono cada una: ninguna manda, todo flota. De sueño, de recuerdo en una película.',
  ),
  extra(
    'disminuidaTS',
    'Disminuida',
    'simetrica',
    [0, 2, 3, 5, 6, 8, 9, 11],
    'Tono y semitono alternados: ocho notas, tensa y circular, de suspenso.',
    'Tono-semitono',
  ),
  extra(
    'disminuidaST',
    'Dominante disminuida',
    'simetrica',
    [0, 1, 3, 4, 6, 7, 9, 10],
    'Semitono y tono: la del dominante con ♭9 y ♯9. Tensa, de jazz y de película de espías.',
    'Semitono-tono',
  ),
  extra(
    'aumentada',
    'Aumentada',
    'simetrica',
    [0, 3, 4, 7, 8, 11],
    'Dos acordes aumentados entrelazados, a tercera menor y semitono: rara, como un espejo.',
  ),
];

export const ALL_SCALES: readonly ScaleInfo[] = [
  ...FROM_ARMONIA,
  ...PENTATONICAS,
  ...EXOTICAS,
  ...JAZZ,
  ...SIMETRICAS,
];

export const findScaleInfo = (id: string | null | undefined) => ALL_SCALES.find((scale) => scale.id === id);

const mod12 = (value: number) => ((value % 12) + 12) % 12;

/** La tonalidad que mejor cae sobre las cuerdas al aire: la del acorde que forman, mayor o menor. */
export function homeKey(notes: readonly string[]): { tonic: number; scale: string } {
  const midis = notes.map(noteToMidi);
  const chord = openChord(midis);
  if (!chord) return { tonic: Math.min(...midis) % 12, scale: 'mayor' };
  const minor = /^m(?!aj)/.test(chord.suffix);
  return { tonic: midis[chord.root]! % 12, scale: minor ? 'natural' : 'mayor' };
}

// ---------------------------------------------------------------- grados y nombres

/**
 * Cómo se nombra cada paso dentro de esta escala: el 6 es ♯4 en el lidio y ♭5 en el blues (que ya tiene
 * 4), el 3 es ♯2 en la húngara mayor (que tiene 3 y no 2), el 8 es ♯5 en los tonos enteros (sin 5.ª).
 */
export function degreeName(step: number, steps: readonly number[]): string {
  const has = (value: number) => steps.includes(value);
  switch (mod12(step)) {
    case 0:
      return '1';
    case 1:
      return '♭2';
    case 2:
      return '2';
    case 3:
      return has(4) && !has(2) ? '♯2' : '♭3';
    case 4:
      return '3';
    case 5:
      return '4';
    case 6:
      return has(5) ? '♭5' : '♯4';
    case 7:
      return '5';
    case 8:
      return !has(7) && !has(5) ? '♯5' : '♭6';
    case 9:
      return '6';
    case 10:
      return '♭7';
    default:
      return '7';
  }
}

/** El nombre de una nota de la escala: la letra sale del número del grado (la ♭3 de C es Eb, la ♯2 es D#). */
export function spellScaleNote(pc: number, tonic: number, scale: ScaleInfo): string {
  const names = tonicNames(scale);
  const step = mod12(pc - tonic);
  if (!scale.steps.includes(step)) return names[mod12(pc)]!;
  const tonicName = names[mod12(tonic)]!;
  const tonicLetter = 'CDEFGAB'.indexOf(tonicName[0]!);
  const number = Number(degreeName(step, scale.steps).replace(/[♭♯]/, ''));
  return spellWithLetter(mod12(pc), tonicLetter + number - 1) ?? names[mod12(pc)]!;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10];

/**
 * Las notas que la distinguen de la mayor o de la menor natural, según su tercera: lo que hay que tocar
 * para que se sienta. Sin tercera no hay con qué comparar.
 */
export function colorNotes(scale: ScaleInfo): { reference: 'mayor' | 'natural' | null; steps: number[] } {
  const reference = scale.steps.includes(4) ? 'mayor' : scale.steps.includes(3) ? 'natural' : null;
  if (!reference) return { reference, steps: [] };
  const base = reference === 'mayor' ? MAJOR : NATURAL_MINOR;
  return { reference, steps: scale.steps.filter((step) => !base.includes(step)) };
}

export const REFERENCE_STEPS = { mayor: MAJOR, natural: NATURAL_MINOR } as const;

// ---------------------------------------------------------------- posiciones en el mástil

export interface ScaleNote {
  stringIndex: number;
  fret: number;
  midi: number;
}

export interface Position {
  /** El primer traste de la caja; 0 si usa las cuerdas al aire. */
  from: number;
  to: number;
  /** Las notas para tocarla de grave a agudo, cada una más aguda que la anterior. */
  run: ScaleNote[];
}

/** Hasta dónde llegan las cajas: empiezan a lo sumo en el 11, así entran antes del 15. */
const LAST_START = 11;

/**
 * Las cajas de la escala: una por cada nota de la escala en la cuerda más grave, de cuatro trastes (cinco
 * si tiene siete notas o más, que no entran en cuatro). En cada cuerda se toman las notas de la caja más
 * agudas que la última que sonó: así se sube sin repetir.
 */
export function positionsOf(open: readonly number[], tonic: number, steps: readonly number[]): Position[] {
  const inScale = (midi: number) => steps.includes(mod12(midi - tonic));
  const span = steps.length >= 7 ? 5 : 4;
  const low = open.indexOf(Math.min(...open));
  const positions: Position[] = [];
  for (let from = 0; from <= LAST_START; from += 1) {
    if (!inScale(open[low]! + from)) continue;
    const to = from + span - 1;
    const run: ScaleNote[] = [];
    // De la cuerda más grave a la más aguda según cómo suenan al aire, no según el orden.
    const order = open.map((midi, index) => ({ midi, index })).sort((a, b) => a.midi - b.midi);
    for (const { index } of order) {
      for (let fret = from; fret <= to; fret += 1) {
        const midi = open[index]! + fret;
        if (!inScale(midi)) continue;
        if (run.length && midi <= run[run.length - 1]!.midi) continue;
        run.push({ stringIndex: index, fret, midi });
      }
    }
    positions.push({ from, to, run });
  }
  return positions;
}

/** Para escuchar: de la tónica más grave de la caja a la más aguda, si hay dos; si no, la caja entera. */
export function tonicToTonic(run: readonly ScaleNote[], tonic: number): ScaleNote[] {
  const tonics = run.flatMap((note, index) => (mod12(note.midi - tonic) === 0 ? [index] : []));
  if (tonics.length < 2) return [...run];
  return run.slice(tonics[0], tonics[tonics.length - 1]! + 1);
}

/** Una octava de la escala desde la tónica, con el tope de la octava: para escucharla sin el mástil. */
export function octaveOf(tonicMidi: number, steps: readonly number[]): number[] {
  return [...steps.map((step) => tonicMidi + step), tonicMidi + 12];
}
