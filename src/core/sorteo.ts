// Sortear una afinación. Viene del sorteador de Scordatura (core/rollers.ts), sin el resto de los módulos.
import { GROUPS, STANDARD, TUNINGS, type Tuning } from '~/data/tunings';
import { midiToNote, noteLabel, noteToMidi } from './notes';
import type { Rng } from './rng';
import { changeSummary, openChordName } from './tuning';

/** Qué tan lejos sortea: tres niveles. */
export type Risk = 0 | 1 | 2;

export const RISK_NAMES: Record<Risk, string> = { 0: 'Seguro', 1: 'Medio', 2: 'Raro' };

export interface Rolled<V = unknown> {
  value: V;
  label: string;
  /** La regla que generó este resultado, a la vista de quien lo usa. */
  rule: string;
  /** Dónde se abre este resultado. */
  href?: string;
}

/** Afinaciones de la biblioteca que salen en cada nivel de riesgo. */
export const TUNING_POOL: Record<Risk, string[]> = {
  0: ['estandar', 'dropd', 'dstd', 'eb', 'opend', 'openg', 'dadgad', 'g6', 'cmaj9', 'dminor', 'c6'],
  1: [
    'cgcfce',
    'dgddad',
    'dgdgad',
    'cgcgcd',
    'eadeae',
    'doubledrop',
    'dropc',
    'eminor',
    'cminor',
    'cgcfcf',
    'vihuela',
    'fourths',
  ],
  2: [
    'bebebe',
    'dadead',
    'ggddgg',
    'ggddaa',
    'ostrich',
    'dropb',
    'droned',
    'gabdeg',
    'fsharp',
    'egdged',
    'ggddebeb',
    'ggcsdgg',
    'accggsc',
    'fsfsggaa',
    'tritones',
    'minorthirds',
    'egsegs',
  ],
};

/** Máximo que se mueve una cuerda en una afinación generada. No se aplica a la biblioteca. */
export const SAFE_TUNING_RANGE = 3;

export function randomSafeTuning(rng: Rng, range = SAFE_TUNING_RANGE): string[] {
  for (;;) {
    const notes = STANDARD.map((note) => midiToNote(noteToMidi(note) + rng.int(-range, range)));
    if (changeSummary(notes).changed >= 3) return notes;
  }
}

function tuningRule(tuning: Tuning): string {
  const group = GROUPS.find((item) => item.id === tuning.group)?.name ?? 'Afinación';
  return `${group}. Al aire suena ${openChordName(tuning.notes)}.`;
}

export function rollTuning({ risk, rng }: { risk: Risk; rng: Rng }): Rolled<{ notes: string[] }> {
  // En el nivel raro, una de cada tres veces la afinación se inventa en lugar de elegirse.
  if (risk === 2 && rng.next() < 1 / 3) {
    const notes = randomSafeTuning(rng);
    return {
      value: { notes },
      label: notes.map((note) => noteLabel(note)).join(''),
      rule: `Generada al azar: ninguna cuerda se mueve más de ${SAFE_TUNING_RANGE} semitonos. Al aire suena ${openChordName(notes)}.`,
      href: `/afinador/tuya?n=${notes.join(',').replaceAll('#', 's')}`,
    };
  }
  const id = rng.pick(TUNING_POOL[risk]);
  const tuning = TUNINGS.find((item) => item.id === id);
  if (!tuning) throw new Error(`La receta nombra una afinación inexistente: ${id}`);
  return {
    value: { notes: tuning.notes },
    label: tuning.name,
    rule: tuningRule(tuning),
    href: `/afinador/${tuning.id}`,
  };
}
