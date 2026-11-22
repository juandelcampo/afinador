// Lo que sale de Rikky Rooksby, "How to Write Songs on Guitar": las vueltas en grados (cap. 3), cómo
// transformarlas (cap. 4), qué da cada cambio de dos acordes (cap. 3), qué notas se apoyan sobre un acorde
// al cantar (cap. 7) y el bajo que baja de a paso con inversiones (cap. 9).
import type { VueltaMode } from '~/data/vueltas';
import { CHORD_STEPS, chordClasses, chordColor, type Chord, type Key, type Suffix } from './harmony';

const mod12 = (value: number) => ((value % 12) + 12) % 12;

// ---------------------------------------------------------------- grados

const DEGREES: Record<string, number> = { I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6 };
const STEPS: Record<VueltaMode, readonly number[]> = {
  mayor: [0, 2, 4, 5, 7, 9, 11],
  menor: [0, 2, 3, 5, 7, 8, 10],
};
/** El acorde de cada grado si no se dice otra cosa: el de la escala mayor o de la menor natural. */
const QUALITY: Record<VueltaMode, readonly Suffix[]> = {
  mayor: ['', 'm', 'm', '', '', 'm', 'dim'],
  menor: ['m', 'dim', '', 'm', 'm', '', ''],
};

/**
 * Un grado como los escribe Rooksby: "VI", "IVm", "IImaj", "bVII". La alteración mueve la raíz desde la
 * escala de la vuelta; un grado alterado sin calidad es mayor. Después del grado también puede ir el
 * acorde entero, para las vueltas con séptimas: "V7", "IIm7b5", "Imaj7", "Im(maj7)".
 */
export function romanChord(token: string, tonic: number, mode: VueltaMode): Chord {
  const match = /^(b|#)?(VII|VI|IV|V|III|II|I)(.*)$/.exec(token);
  if (!match) throw new Error(`Grado inválido: ${token}`);
  const degree = DEGREES[match[2]!]!;
  const shift = match[1] === 'b' ? -1 : match[1] === '#' ? 1 : 0;
  const tail = match[3]!;
  if (tail && tail !== 'maj' && !(tail in CHORD_STEPS)) throw new Error(`Grado inválido: ${token}`);
  const suffix: Suffix = tail === 'maj' ? '' : tail || (shift ? '' : QUALITY[mode][degree]!);
  return { root: mod12(tonic + STEPS[mode][degree]! + shift), suffix };
}

// ---------------------------------------------------------------- transformar la vuelta

/** Estirar: repetir el primer cambio antes de seguir (I VI I VI IV V). */
export const stretch = (chords: readonly Chord[]): Chord[] =>
  chords.length < 3 ? [...chords] : [chords[0]!, chords[1]!, ...chords];

/** El relativo: un mayor cambia por el menor tres semitonos abajo, y al revés. */
export function relativeOf(chord: Chord): Chord | null {
  const color = chordColor(chord.suffix);
  if (color === 'major') return { root: mod12(chord.root - 3), suffix: 'm' };
  if (color === 'minor') return { root: mod12(chord.root + 3), suffix: '' };
  return null;
}

/** Polaridad inversa: misma raíz, de mayor a menor o de menor a mayor. */
export function polarityOf(chord: Chord): Chord | null {
  const color = chordColor(chord.suffix);
  if (color === 'major') return { root: chord.root, suffix: 'm' };
  if (color === 'minor') return { root: chord.root, suffix: '' };
  return null;
}

/**
 * El bajo que baja: para cada acorde elige raíz, tercera o quinta en el bajo de modo que la línea se
 * mueva lo menos posible, mejor para abajo y de a un paso (C G/B Am).
 */
export function walkingBass(chords: readonly Chord[]): Chord[] {
  if (chords.length < 2) return chords.map((chord) => ({ root: chord.root, suffix: chord.suffix }));
  const options = chords.map((chord) => {
    const steps = CHORD_STEPS[chord.suffix]!;
    const roles: Array<[number, number]> = [[chord.root, 0]];
    const third = [4, 3].find((step) => steps.includes(step));
    if (third !== undefined) roles.push([mod12(chord.root + third), 0.6]);
    if (steps.includes(7)) roles.push([mod12(chord.root + 7), 2]);
    return roles;
  });
  const move = (from: number, to: number) => {
    const down = mod12(from - to);
    if (down === 1 || down === 2) return 0;
    if (down === 0) return 2.5;
    const up = 12 - down;
    if (up === 1 || up === 2) return 1.5;
    return 2 + Math.min(down, up) * 0.2;
  };
  // Programación dinámica: para cada opción de cada acorde, el mejor camino que llega hasta ella.
  let paths = options[0]!.map(([, penalty], option) => ({ cost: penalty * 2, path: [option] }));
  for (let index = 1; index < options.length; index++) {
    const previous = paths;
    paths = options[index]!.map(([bass, penalty], option) => {
      const best = previous
        .map((item, prevOption) => ({
          cost: item.cost + move(options[index - 1]![prevOption]![0], bass) + penalty,
          path: item.path,
        }))
        .reduce((a, b) => (b.cost < a.cost ? b : a));
      return { cost: best.cost, path: [...best.path, option] };
    });
  }
  const { path } = paths.reduce((a, b) => (b.cost < a.cost ? b : a));
  return chords.map((chord, index) => {
    const bass = options[index]![path[index]!]![0];
    return bass === chord.root
      ? { root: chord.root, suffix: chord.suffix }
      : { root: chord.root, suffix: chord.suffix, bass };
  });
}

// ---------------------------------------------------------------- de dos en dos

export interface Move {
  chord: Chord;
  /** El cambio en grados, tomando el acorde de partida como I: "I → VI". */
  label: string;
  why: string;
}

type MoveDef = readonly [number, Suffix, string, string];

const FROM_MAJOR: readonly MoveDef[] = [
  [9, 'm', 'I → VI', 'De los cambios más fuertes de mayor a menor, y cambia una sola nota.'],
  [4, 'm', 'I → III', 'De mayor a menor con dos notas en común: expresivo.'],
  [2, 'm', 'I → II', 'Movimiento corto donde cambian todas las notas. Muy del reggae.'],
  [5, '', 'I → IV', 'Más liviano y relajado que ir al V. Con maj7 en los dos, soñador.'],
  [7, '', 'I → V', 'Afirma la tonalidad. Ideal cuando mandan la letra y la melodía.'],
  [10, '', 'I → ♭VII', 'El de los riffs: Whole Lotta Love, My Generation.'],
  [5, 'm', 'I → IVm', 'De las baladas: expresivo hasta lo sentimental.'],
  [3, '', 'I → ♭III', 'Clásico del blues, áspero. También puede sonar exótico.'],
  [8, '', 'I → ♭VI', 'Algo extraño, aunque comparten una nota. Muy de John Barry.'],
  [0, 'm', 'I → Im', 'Llamativo: de mayor a menor en la misma raíz desestabiliza el tono.'],
  [2, '', 'I → IImaj', 'Ambiguo: hace esperar un cambio de tono.'],
  [4, '', 'I → IIImaj', 'Ambiguo: insinúa que te vas a otro tono.'],
  [9, '', 'I → VImaj', 'Ambiguo: prepara un cambio de tono para arriba.'],
  [7, 'm', 'I → Vm', 'Ambiguo: parece que estuvieras en otro tono.'],
  [1, '', 'I → ♭II', 'Muy raro. En quintas, del metal de los 80.'],
  [10, 'm', 'I → ♭VIIm', 'Muy raro: suena al IV y V de otro tono menor.'],
];

const FROM_MINOR: readonly MoveDef[] = [
  [3, '', 'I → III', 'Del menor a su relativo mayor: se abre.'],
  [5, 'm', 'I → IV', 'Menor a menor: oscuro y firme.'],
  [5, '', 'I → IVmaj', 'Poderoso: la sexta del menor se vuelve luz. Muy de Santana.'],
  [8, '', 'I → VI', 'Cambia mucho según cómo lo armes: con maj7 o con 7 son mundos distintos.'],
  [10, '', 'I → VII', 'Bajar un tono a un mayor: muy usado.'],
  [7, 'm', 'I → V', 'Sin punta, suave.'],
  [7, '', 'I → Vmaj', 'Con punta: pide volver.'],
  [1, '', 'I → ♭II', 'Asombroso y raro.'],
  [11, '', 'I → ♯VII', 'Inusual: medio tono abajo, mayor.'],
];

/** Qué da ir de un acorde a otro, tomando el de partida como I. Los suspendidos cuentan como mayores. */
export function twoChordMoves(from: Chord): Move[] {
  const minor = chordColor(from.suffix) === 'minor';
  return (minor ? FROM_MINOR : FROM_MAJOR).map(([step, suffix, label, why]) => ({
    chord: { root: mod12(from.root + step), suffix },
    label,
    why,
  }));
}

// ---------------------------------------------------------------- cantar encima

export interface SingOver {
  /** Notas del acorde: se apoyan. */
  inside: number[];
  /** De la escala pero no del acorde: tensan, piden moverse. */
  outside: number[];
  /** Fuera de la escala: chocan. Las de blues son las que, bien usadas, dan color. */
  against: number[];
  blue: number[];
}

export function singOver(chord: Chord, key: Key): SingOver {
  const inChord = new Set(chordClasses(chord));
  const inScale = new Set(key.scale.steps.map((step) => mod12(key.tonic + step)));
  const blues = [3, 6, 10].map((step) => mod12(key.tonic + step));
  const result: SingOver = { inside: [], outside: [], against: [], blue: [] };
  for (let step = 0; step < 12; step++) {
    const pc = mod12(chord.root + step);
    if (inChord.has(pc)) result.inside.push(pc);
    else if (inScale.has(pc)) result.outside.push(pc);
    else {
      result.against.push(pc);
      if (blues.includes(pc)) result.blue.push(pc);
    }
  }
  return result;
}
