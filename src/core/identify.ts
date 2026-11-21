// Ponerle nombre a lo que suena: de las cuerdas que suenan a un acorde, con todas sus lecturas posibles.
import { CHORD_STEPS, type Suffix } from './harmony';

/**
 * Los acordes que se reconocen, del más común al más raro: si dos nombres empatan, gana el que va antes.
 * Todos están en CHORD_STEPS, así se nombran, se escriben en la URL y se abren en Inversiones igual.
 */
const KNOWN: readonly Suffix[] = [
  '',
  'm',
  '5',
  '7',
  'm7',
  'maj7',
  'sus4',
  'sus2',
  'add9',
  'madd9',
  '6',
  'm6',
  '7sus4',
  '9',
  'm9',
  'maj9',
  'dim',
  'm7b5',
  'dim7',
  'aug',
  'add11',
  'm11',
  '69',
  'm(maj7)',
  '7b9',
  '7b5',
];

/** Cómo se dice cada tipo en palabras, para quien no lee cifrado. */
export const CHORD_WORDS: Record<string, string> = {
  '': 'Mayor',
  m: 'Menor',
  '5': 'Quinta sola, sin tercera: ni mayor ni menor',
  '7': 'Mayor con séptima menor',
  m7: 'Menor con séptima',
  maj7: 'Mayor con séptima mayor',
  sus4: 'Suspendido: la 4 en lugar de la tercera',
  sus2: 'Suspendido: la 2 en lugar de la tercera',
  add9: 'Mayor con novena agregada',
  madd9: 'Menor con novena agregada',
  '6': 'Mayor con sexta',
  m6: 'Menor con sexta mayor',
  '7sus4': 'Suspendido con séptima',
  '9': 'Mayor con séptima menor y novena',
  m9: 'Menor con séptima y novena',
  maj9: 'Mayor con séptima mayor y novena',
  dim: 'Disminuido',
  m7b5: 'Semidisminuido',
  dim7: 'Disminuido con séptima disminuida',
  aug: 'Aumentado',
  add11: 'Mayor con oncena agregada',
  m11: 'Menor con séptima y oncena',
  '69': 'Mayor con sexta y novena',
  'm(maj7)': 'Menor con séptima mayor',
  '7b9': 'Mayor con séptima menor y novena menor',
  '7b5': 'Mayor con séptima menor y quinta disminuida',
};

/** Una manera de leer lo que suena. */
export interface ChordReading {
  /** Clase de altura de la raíz, 0 = Do. */
  root: number;
  suffix: Suffix;
  /** Clase de altura del bajo. */
  bass: number;
  /** Las notas del acorde que no suenan, en semitonos desde la raíz (0 a 11). */
  omitted: number[];
}

const mod12 = (value: number) => ((value % 12) + 12) % 12;

/** Qué notas del acorde se pueden dejar afuera sin que deje de ser ese acorde. */
function omittable(steps: readonly number[]): number[] {
  const classes = new Set(steps.map(mod12));
  const out: number[] = [];
  // La quinta justa, si quedan al menos tres notas: la mano suele dejarla afuera.
  if (classes.size >= 4 && classes.has(7)) out.push(7);
  // En los de oncena, la novena.
  if (steps.includes(17) && steps.includes(14)) out.push(2);
  return out;
}

/** Todas las maneras de omitir: ninguna, una o varias de las que se pueden dejar afuera. */
function omissions(options: number[]): number[][] {
  return options.reduce<number[][]>((acc, step) => [...acc, ...acc.map((set) => [...set, step])], [[]]);
}

/**
 * Las lecturas de lo que suena, de la mejor a la peor. Gana la que tiene la raíz en el bajo, después la
 * que no omite notas y después la más común. Vacío si suenan menos de dos notas distintas o si no se
 * parece a ningún acorde conocido.
 */
export function identifyChord(midis: ReadonlyArray<number | null>): ChordReading[] {
  const sounding = midis.filter((midi): midi is number => midi !== null);
  if (!sounding.length) return [];
  const classes = [...new Set(sounding.map(mod12))];
  if (classes.length < 2) return [];
  const bass = mod12(Math.min(...sounding));

  const found: Array<ChordReading & { score: number }> = [];
  for (const root of classes) {
    const heard = new Set(classes.map((pc) => mod12(pc - root)));
    KNOWN.forEach((suffix, order) => {
      const steps = [...new Set(CHORD_STEPS[suffix]!.map(mod12))];
      for (const omitted of omissions(omittable(CHORD_STEPS[suffix]!))) {
        const wanted = steps.filter((step) => !omitted.includes(step));
        if (wanted.length !== heard.size || !wanted.every((step) => heard.has(step))) continue;
        found.push({
          root,
          suffix,
          bass,
          omitted,
          score: (root === bass ? 0 : 10) + omitted.length * 4 + order * 0.1,
        });
        break;
      }
    });
  }
  return found.sort((a, b) => a.score - b.score).map(({ score: _score, ...reading }) => reading);
}
