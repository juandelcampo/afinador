// Drone: la tónica sostenida y lo que se le apila encima. Viene del de Scordatura, sin consigna ni sorteo:
// acá la nota la pone la escala y lo que se elige es cómo suena.

export const STACKS = {
  octava: {
    name: 'Octava',
    steps: [-12, 0, 12],
    rule: 'Solo la tónica en tres octavas: no define ningún acorde y deja todo abierto.',
  },
  quinta: {
    name: 'Quinta',
    steps: [-12, 0, 7, 12],
    rule: 'Tónica y quinta, sin tercera: no es mayor ni menor, y la melodía decide.',
  },
  tanpura: {
    name: 'Tanpura',
    steps: [-12, -5, 0, 0],
    rule: 'Quinta abajo y tónica doble, como la tanpura de la música india: el bordón de un raga.',
  },
  sus2: {
    name: 'Sus2',
    steps: [-12, 0, 2, 7],
    rule: 'La segunda en lugar de la tercera: flota sin resolver.',
  },
  sus4: {
    name: 'Sus4',
    steps: [-12, 0, 5, 7],
    rule: 'La cuarta en lugar de la tercera: una tensión que pide bajar y nunca baja.',
  },
  mayor: {
    name: 'Mayor',
    steps: [-12, 0, 4, 7],
    rule: 'Con la tercera mayor: el color queda definido desde el grave.',
  },
  menor: {
    name: 'Menor',
    steps: [-12, 0, 3, 7],
    rule: 'Con la tercera menor: el color queda definido desde el grave.',
  },
  menor9: {
    name: 'Menor 9',
    steps: [-12, 0, 3, 7, 14],
    rule: 'Tercera menor y novena: la novena roza la tercera y vibra arriba del acorde.',
  },
  tritono: {
    name: 'Tritono',
    steps: [-12, 0, 6, 12],
    rule: 'Tónica y tritono, el intervalo más inestable: un zumbido que no descansa.',
  },
  racimo: {
    name: 'Racimo',
    steps: [0, 1, 2, 7],
    rule: 'Tres notas a semitonos: baten entre sí y la masa de sonido late sola.',
  },
} as const;

export type StackId = keyof typeof STACKS;
/** `escala`: quinta si la escala la tiene, si no la octava. Es lo que suena sin tocar nada. */
export type StackChoice = StackId | 'escala';

export const TIMBRES = {
  calido: { name: 'Cálido' },
  organo: { name: 'Órgano' },
  crudo: { name: 'Crudo' },
} as const;

export type TimbreId = keyof typeof TIMBRES;

/** Cómo suena el drone: se elige una vez y vale para cualquier tónica. */
export interface DroneSound {
  stack: StackChoice;
  timbre: TimbreId;
  /** De 0 a 1: qué tan abierto está el filtro. */
  brightness: number;
  /** De 0 a 1: cuánto se mueve el sonido solo. */
  motion: number;
  /** Desafinación entre los dos osciladores de cada nota, en cents. */
  detune: number;
}

export const DEFAULT_DRONE: DroneSound = {
  stack: 'escala',
  timbre: 'organo',
  brightness: 0.4,
  motion: 0.25,
  detune: 7,
};

export const DETUNE_MAX = 40;

const mod12 = (value: number) => ((value % 12) + 12) % 12;

/** La pila que suena: la elegida, o la que arma la escala. */
export function resolveStack(stack: StackChoice, scaleSteps: readonly number[]): StackId {
  if (stack !== 'escala') return stack;
  return scaleSteps.includes(7) ? 'quinta' : 'octava';
}

/** La tónica del drone, en MIDI: entre el Mi de la sexta al aire (40+12) y el Re# de arriba. */
export const droneRoot = (tonic: number) => 52 + mod12(tonic - 4);

/** Las notas que suenan, en MIDI. */
export function droneVoices(tonic: number, stack: StackChoice, scaleSteps: readonly number[]): number[] {
  const root = droneRoot(tonic);
  return STACKS[resolveStack(stack, scaleSteps)].steps.map((step) => root + step);
}

/** Los pasos de la pila que no están en la escala: lo que va a chocar con lo que toques. */
export function foreignSteps(stack: StackChoice, scaleSteps: readonly number[]): number[] {
  const steps = STACKS[resolveStack(stack, scaleSteps)].steps.map(mod12);
  return [...new Set(steps)].filter((step) => !scaleSteps.includes(step));
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Lo guardado puede venir de otra versión o estar corrupto: lo que no sirve vuelve a lo de siempre. */
export function sanitizeDrone(saved: unknown): DroneSound {
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_DRONE };
  const { stack, timbre, brightness, motion, detune } = saved as Record<string, unknown>;
  const number = (value: unknown, fallback: number, max: number) =>
    typeof value === 'number' && Number.isFinite(value) ? clamp(value, 0, max) : fallback;
  return {
    stack:
      typeof stack === 'string' && (stack === 'escala' || stack in STACKS)
        ? (stack as StackChoice)
        : DEFAULT_DRONE.stack,
    timbre: typeof timbre === 'string' && timbre in TIMBRES ? (timbre as TimbreId) : DEFAULT_DRONE.timbre,
    brightness: number(brightness, DEFAULT_DRONE.brightness, 1),
    motion: number(motion, DEFAULT_DRONE.motion, 1),
    detune: number(detune, DEFAULT_DRONE.detune, DETUNE_MAX),
  };
}
