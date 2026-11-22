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

/** Una nota que sobra encima de un acorde: su nombre como tensión y qué le hace al sonido. */
export interface Tension {
  /** Semitonos desde la raíz, 0 a 11. */
  step: number;
  /** ♭9, 9, ♯9, 11, ♯11, ♭13, 13 o 6. */
  label: string;
  words: string;
}

/** Una manera de leer lo que suena. */
export interface ChordReading {
  /** Clase de altura de la raíz, 0 = Do. */
  root: number;
  suffix: Suffix;
  /** Clase de altura del bajo. */
  bass: number;
  /** Las notas del acorde que no suenan, en semitonos desde la raíz (0 a 11). */
  omitted: number[];
  /** Lo que suena encima del acorde y no es parte de él: las tensiones. Vacío si calza justo. */
  extras: Tension[];
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

/** Los acordes sobre los que se apilan tensiones, del más común al más raro. */
const BASES: readonly Suffix[] = [
  '',
  'm',
  '7',
  'm7',
  'maj7',
  'sus4',
  'sus2',
  '6',
  'm6',
  '7sus4',
  'dim',
  'm7b5',
  'dim7',
  'aug',
  'm(maj7)',
  '5',
];

/**
 * Cómo se llama una nota que sobra encima de un acorde, o null si no se puede leer como tensión de ese
 * acorde (por ejemplo, una tercera mayor encima de uno menor).
 */
function tensionOf(step: number, base: readonly number[]): Tension | null {
  const has = new Set(base.map(mod12));
  const seventh = has.has(10) || has.has(11);
  if (has.has(step)) return null;
  switch (step) {
    case 1:
      return { step, label: '♭9', words: 'raspa y oscurece' };
    case 2:
      return { step, label: '9', words: 'abre y aclara' };
    case 3:
      return has.has(4) ? { step, label: '♯9', words: 'mayor y menor a la vez: suena a blues' } : null;
    case 5:
      return { step, label: '11', words: 'queda suspendida encima, sin resolver' };
    case 6:
      return has.has(7) ? { step, label: '♯11', words: 'brilla y flota' } : null;
    case 8:
      return has.has(7) ? { step, label: '♭13', words: 'una sombra que pide bajar' } : null;
    case 9:
      return seventh ? { step, label: '13', words: 'endulza' } : { step, label: '6', words: 'endulza' };
    default:
      return null;
  }
}

/** Dos notas a una tercera o una sexta insinúan un acorde mayor o menor: la raíz, el tipo y si va invertido. */
function impliedByDyad(bass: number, other: number): { root: number; suffix: Suffix } | null {
  const interval = mod12(other - bass);
  if (interval === 3) return { root: bass, suffix: 'm' };
  if (interval === 4) return { root: bass, suffix: '' };
  // Sexta menor: la de arriba es la raíz y la de abajo su tercera mayor (Mi y Do, un Do/Mi).
  if (interval === 8) return { root: other, suffix: '' };
  if (interval === 9) return { root: other, suffix: 'm' };
  return null;
}

/**
 * Las lecturas de lo que suena, de la mejor a la peor. Primero las que calzan justo con un acorde
 * conocido; si no hay, un acorde entero con tensiones encima; con dos notas, el acorde que insinúan.
 * Gana la raíz en el bajo, después la que menos agrega u omite y después la más común. Vacío con una
 * sola nota, o si son notas pegadas que no se apilan en terceras (para eso está `clusterSense`).
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
    const inBass = root === bass ? 0 : 10;
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
          extras: [],
          score: inBass + omitted.length * 4 + order * 0.1,
        });
        break;
      }
    });
    // Un acorde entero (en los de cuatro notas puede faltar la quinta) y lo demás como tensiones. Si con
    // esta raíz ya calza justo, no hace falta: sería el mismo acorde dicho de otra manera.
    if (found.some((item) => item.root === root)) continue;
    BASES.forEach((suffix, order) => {
      const base = CHORD_STEPS[suffix]!;
      const steps = [...new Set(base.map(mod12))];
      for (const omitted of omissions(omittable(base).filter((step) => step === 7))) {
        const wanted = steps.filter((step) => !omitted.includes(step));
        if (!wanted.every((step) => heard.has(step))) continue;
        const rest = [...heard].filter((step) => !steps.includes(step)).sort((a, b) => a - b);
        if (!rest.length) continue;
        const extras = rest.map((step) => tensionOf(step, base));
        if (extras.some((item) => item === null)) continue;
        found.push({
          root,
          suffix,
          bass,
          omitted,
          extras: extras as Tension[],
          score: inBass + 3 + rest.length * 3 + omitted.length * 4 + order * 0.1,
        });
        break;
      }
    });
  }

  if (!found.length && classes.length === 2) {
    const implied = impliedByDyad(
      bass,
      classes.find((pc) => pc !== bass)!,
    );
    if (implied) return [{ ...implied, bass, omitted: [7], extras: [] }];
  }

  // Si dos lecturas dan el mismo nombre, queda la mejor.
  const seen = new Set<string>();
  return found
    .sort((a, b) => a.score - b.score)
    .filter((item) => {
      const key = `${item.root}|${item.suffix}|${item.extras.map((extra) => extra.label).join()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ score: _score, ...reading }) => reading);
}

/** Lo que es un puñado de notas que no arma un acorde de terceras: cómo llamarlo y qué hace. */
export function clusterSense(midis: ReadonlyArray<number | null>): { kind: string; words: string } | null {
  const sounding = midis.filter((midi): midi is number => midi !== null);
  const classes = [...new Set(sounding.map(mod12))];
  if (classes.length < 2) return null;
  const bass = mod12(Math.min(...sounding));
  if (classes.length === 2) {
    const interval = mod12(classes.find((pc) => pc !== bass)! - bass);
    if (interval === 6)
      return {
        kind: 'Tritono',
        words: 'El corazón del acorde de séptima: la tensión que pide resolver. Sumale un bajo y es un 7.',
      };
    if (interval === 1 || interval === 11)
      return {
        kind: 'Choque de semitono',
        words: 'El roce más fuerte que hay: tensión pura, suena a sirena.',
      };
    if (interval === 2 || interval === 10)
      return {
        kind: 'Roce de tono',
        words: 'Un roce suave que pide moverse: es el color de los sus2 y los 7.',
      };
    return { kind: 'Intervalo', words: 'Dos notas: todavía no dicen qué acorde.' };
  }
  return {
    kind: 'Racimo',
    words:
      'Notas pegadas que no se apilan en terceras: suena a nube, a tensión quieta. Funciona como color, sobre todo con cuerdas al aire.',
  };
}
