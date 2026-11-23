// Ritmo: compases agrupados, ritmos euclidianos, polirritmias, compases mutantes y caja de ritmos.
// Todo se reduce a un "ciclo": una lista de golpes ubicados entre 0 y 1 dentro del ciclo.

export type Denominator = 4 | 8 | 16;

export interface Meter {
  groups: number[];
  denom: Denominator;
}

/**
 * Cómo suena un metrónomo (compás, euclidiano, mutante): el instrumento del golpe y el del acento, y con
 * qué batería. Sin elegir, aro y bombo de la acústica.
 */
interface MetroSound {
  voices?: Voices;
  kit?: DrumKit;
}

export type RhythmConfig =
  | ({ mode: 'meter'; bpm: number } & Meter & MetroSound)
  | ({ mode: 'euclid'; pulses: number; steps: number; rotation: number; bpm: number } & MetroSound)
  | {
      mode: 'poly';
      a: number;
      b: number;
      /** El sonido de batería de cada línea. Sin elegir, suenan los de DEFAULT_POLY_VOICES. */
      voices?: Voices;
      /** Con qué batería suena. Sin elegir, la acústica. */
      kit?: DrumKit;
      bpm: number;
    }
  | ({ mode: 'mutante'; meters: Meter[]; barsEach: number; bpm: number } & MetroSound)
  | {
      mode: 'drum';
      steps: number;
      /** Un arreglo de casillas por sonido, en el orden de DRUMS: 0 es silencio, 1 golpe y 2 golpe con acento. */
      tracks: Step[][];
      /** Con qué batería suena. Sin elegir, la acústica. */
      kit?: DrumKit;
      /** Volumen de cada sonido, de 0 a 1. */
      levels: number[];
      /**
       * Swing como en las cajas de ritmos: 50 es parejo y 66 es de tresillo. Corre cada semicorchea
       * de contratiempo hacia la que sigue. Sin él, parejo.
       */
      swing?: number;
      /** Filas calladas un rato (mute), sin perder su volumen. No viaja en el link. */
      muted?: boolean[];
      /** Filas en solo: si hay alguna, suenan solo esas. No viaja en el link. */
      soloed?: boolean[];
      bpm: number;
    };

export type DrumConfig = Extract<RhythmConfig, { mode: 'drum' }>;

export const DRUMS = [
  { id: 'bombo', name: 'Bombo' },
  { id: 'caja', name: 'Caja' },
  { id: 'aro', name: 'Aro' },
  { id: 'hihat', name: 'Hi-hat' },
  { id: 'abierto', name: 'Hi-hat abierto' },
  { id: 'palma', name: 'Palma' },
  { id: 'tom', name: 'Tom' },
  { id: 'percu', name: 'Percusión' },
] as const;

export type DrumId = (typeof DRUMS)[number]['id'];

/** Una casilla de la caja de ritmos: silencio, golpe o golpe con acento. */
export type Step = 0 | 1 | 2;

export const DRUM_KITS = [
  { id: 'acustica', name: 'Acústica' },
  { id: '808', name: '808' },
  { id: 'sintetica', name: 'Sintética' },
] as const;
export type DrumKit = (typeof DRUM_KITS)[number]['id'];
export const DEFAULT_KIT: DrumKit = 'acustica';

/** El sonido de la última fila cambia con la batería: en la acústica es una pandereta. */
export function drumName(id: DrumId, kit: DrumKit = DEFAULT_KIT): string {
  if (id === 'percu') return kit === 'acustica' ? 'Pandereta' : 'Cencerro';
  return DRUMS.find((drum) => drum.id === id)!.name;
}

/** Las filas que tenían los links de antes de que hubiera aro y hi-hat abierto, en el orden de ahora. */
const OLD_LANES = [0, 1, 3, 5, 6, 7];
/** Dos instrumentos: las dos líneas de la polirritmia, o el golpe y el acento de un metrónomo. */
export type Voices = [DrumId, DrumId];
/** Cuántos pasos puede tener la caja de ritmos: de a uno, también impares. */
export const DRUM_STEPS = { min: 2, max: 32 } as const;
export const DEFAULT_POLY_VOICES: Voices = ['hihat', 'bombo'];
/** El golpe y el acento de los metrónomos: el aro es lo más parecido a un clic, y el bombo marca el uno. */
export const DEFAULT_METRO_VOICES: Voices = ['aro', 'bombo'];
/** Los ritmos que suenan como metrónomo: un instrumento para el golpe y otro para el acento. */
export const METRO_MODES = ['meter', 'euclid', 'mutante'] as const;
const isMetro = (
  config: RhythmConfig,
): config is Extract<RhythmConfig, { mode: (typeof METRO_MODES)[number] }> =>
  (METRO_MODES as readonly string[]).includes(config.mode);
/** Volumen del golpe de un metrónomo que no empieza grupo. */
const METRO_GAIN = 0.75;
const DEFAULT_LEVEL = 0.8;
/** Volumen de un golpe sin acento en la polirritmia; el primero de cada línea va a 1. */
const POLY_UNACCENTED = 0.7;

function parseVoices(text: string): Voices | null {
  // El cencerro de antes es la percusión de ahora.
  const ids = text.split('_').map((id) => (id === 'cencerro' ? 'percu' : id));
  const valid = ids.length === 2 && ids.every((id) => DRUMS.some((drum) => drum.id === id));
  return valid ? (ids as Voices) : null;
}

const stepOf = (char: string | undefined): Step => (char === 'X' ? 2 : char === 'x' ? 1 : 0);

/** Arma un patrón a partir de texto: cada x es un golpe y cada X, un golpe con acento. */
export function drumConfig(
  bpm: number,
  pattern: Partial<Record<DrumId, string>>,
): Extract<RhythmConfig, { mode: 'drum' }> {
  const steps = Math.max(...Object.values(pattern).map((text) => text.length));
  return {
    mode: 'drum',
    steps,
    bpm,
    tracks: DRUMS.map(({ id }) => Array.from({ length: steps }, (_, i) => stepOf(pattern[id]?.[i]))),
    levels: DRUMS.map(() => DEFAULT_LEVEL),
  };
}

/**
 * Un patrón inventado: cada sonido reparte sus golpes en forma euclidiana, con su propia rotación.
 * El bombo, la caja y el hi-hat casi siempre están; el resto aparece a veces. El bombo del uno y los
 * golpes de hi-hat que caen en el tiempo van con acento.
 */
export function randomDrumPattern(
  next: () => number,
  bpm: number,
  steps = 16,
): Extract<RhythmConfig, { mode: 'drum' }> {
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const scale = steps / 16;
  // En el orden de DRUMS: bombo, caja, aro, hi-hat, abierto, palma, tom, percusión. El aro y la palma
  // casi nunca van juntos con la caja: a veces uno reemplaza al otro.
  const density = [
    int(3, 5),
    int(1, 3),
    int(-3, 2),
    int(5, 11),
    int(-2, 1),
    int(-3, 2),
    int(-1, 2),
    int(-1, 3),
  ].map((pulses) => Math.max(0, Math.round(pulses * scale)));
  return {
    mode: 'drum',
    steps,
    bpm,
    tracks: DRUMS.map(({ id }, track): Step[] => {
      const pulses = Math.min(steps, density[track] ?? 0);
      if (pulses === 0) return new Array<Step>(steps).fill(0);
      // El bombo arranca en el uno y la caja cae en el dos: así siempre se siente dónde está el tiempo.
      const rotation = track === 0 ? 0 : track === 1 ? steps - Math.round(4 * scale) : int(0, steps - 1);
      return euclid(pulses, steps, rotation).map((on, i): Step => {
        if (!on) return 0;
        const strong = (id === 'bombo' && i === 0) || (id === 'hihat' && i % 4 === 0);
        return strong ? 2 : 1;
      });
    }),
    levels: DRUMS.map(() => DEFAULT_LEVEL),
  };
}

export type HitLevel = 0 | 1 | 2;

export interface Hit {
  /** Posición dentro del ciclo, de 0 a 1. */
  at: number;
  level: HitLevel;
  /** Carril donde se dibuja. El carril -1 no suena: marca el paso general de la caja de ritmos. */
  lane: number;
  cell: number;
  /** El instrumento de batería que suena. Sin él, el golpe no suena (el paso general de la batería). */
  voice?: DrumId;
  /** Volumen del golpe, de 0 a 1. */
  gain?: number;
  /** Si suena la toma fuerte del instrumento, la del acento. */
  strong?: boolean;
}

export interface Cycle {
  /** Duración en negras. */
  beats: number;
  /** Cantidad de casillas de cada carril, para dibujarlo. */
  lanes: number[];
  hits: Hit[];
}

export const LIMITS = { bpm: [20, 300], cells: [1, 32], groupSize: [1, 9], lane: [1, 16] } as const;

export function clampBpm(bpm: number): number {
  return Math.min(LIMITS.bpm[1], Math.max(LIMITS.bpm[0], Math.round(bpm)));
}

/**
 * En pantallas chicas los pasos de la batería se parten en filas de a 8, 7, 6 o 5, para que el compás se lea.
 * Hasta 9 entran en una sola fila, y si no hay una partición pareja van de a 8 y la última queda más corta.
 */
export function rowLength(steps: number): number {
  if (steps <= 9) return steps;
  for (let length = 8; length >= 5; length--) if (steps % length === 0) return length;
  return 8;
}

/** Si una fila de la batería suena: no tiene mute y, si hay alguna en solo, es una de ellas. */
export function laneSounds(config: DrumConfig, lane: number): boolean {
  if (config.muted?.[lane]) return false;
  return !config.soloed?.some(Boolean) || !!config.soloed[lane];
}

export const SWING = { straight: 50, max: 75 } as const;

/** Dónde cae cada paso con swing: los pares quedan en su lugar y los impares se corren. */
function swungPosition(steps: number, swing: number): (cell: number) => number {
  // Con 66 la semicorchea de contratiempo cae a dos tercios del par: el par dura dos pasos.
  const shift = steps % 2 === 0 ? (2 * swing) / 100 - 1 : 0;
  return (cell) => (cell + (cell % 2 === 1 ? shift : 0)) / steps;
}

/**
 * El tempo de unos golpes marcados a mano, en milisegundos. Una pausa de más de dos segundos
 * empieza de nuevo, y cuentan los últimos ocho: así sigue a quien acelera o frena.
 */
export function tapTempo(times: number[]): number | null {
  let start = times.length - 1;
  while (start > 0 && times[start]! - times[start - 1]! <= TAP_RESET_MS) start -= 1;
  const recent = times.slice(Math.max(start, times.length - 8));
  if (recent.length < 2) return null;
  const average = (recent.at(-1)! - recent[0]!) / (recent.length - 1);
  return clampBpm(60_000 / average);
}

export const TAP_RESET_MS = 2000;

/** Reparte los golpes en los pulsos lo más parejo posible. */
export function euclid(pulses: number, steps: number, rotation = 0): boolean[] {
  const pattern = Array.from({ length: steps }, (_, i) => (i * pulses) % steps < pulses);
  const shift = ((rotation % steps) + steps) % steps;
  return pattern.map((_, i) => pattern[(i + shift) % steps]!);
}

function meterCycle({ groups, denom }: Meter): Cycle {
  const total = groups.reduce((sum, group) => sum + group, 0);
  const hits: Hit[] = [];
  let cell = 0;
  groups.forEach((group, groupIndex) => {
    for (let i = 0; i < group; i++) {
      const level: HitLevel = i > 0 ? 0 : groupIndex === 0 ? 2 : 1;
      hits.push({ at: cell / total, level, lane: 0, cell });
      cell += 1;
    }
  });
  return { beats: (total * 4) / denom, lanes: [total], hits };
}

/**
 * Le pone instrumento a cada golpe de un metrónomo. Solo el uno va al acento, con la toma fuerte: así el
 * golpe suena siempre, también en un 4/4 que es 1+1+1+1. El primero de cada grupo del compás va al golpe,
 * con su toma fuerte y más volumen: 2+2+3 se sigue distinguiendo de 3+2+2. El resto, al golpe.
 */
function voiceMetro(cycle: Cycle, voices: Voices, groupStart: (hit: Hit) => boolean): Cycle {
  const [golpe, acento] = voices;
  return {
    ...cycle,
    hits: cycle.hits.map((hit): Hit => {
      if (hit.level === 2) return { ...hit, voice: acento, gain: 1, strong: true };
      if (groupStart(hit)) return { ...hit, voice: golpe, gain: 1, strong: true };
      return { ...hit, voice: golpe, gain: METRO_GAIN };
    }),
  };
}

/** El ciclo que suena en la vuelta `index`. Solo el modo mutante cambia entre vueltas. */
export function cycleFor(config: RhythmConfig, index: number): Cycle {
  switch (config.mode) {
    case 'meter':
      return voiceMetro(meterCycle(config), config.voices ?? DEFAULT_METRO_VOICES, (hit) => hit.level === 1);
    case 'euclid': {
      const pattern = euclid(config.pulses, config.steps, config.rotation);
      const hits = pattern.flatMap((on, cell): Hit[] =>
        on ? [{ at: cell / config.steps, level: cell === pattern.indexOf(true) ? 2 : 1, lane: 0, cell }] : [],
      );
      // En el euclidiano el único acento es el primer golpe: los demás son golpes.
      return voiceMetro(
        { beats: config.steps / 2, lanes: [config.steps], hits },
        config.voices ?? DEFAULT_METRO_VOICES,
        () => false,
      );
    }
    case 'poly': {
      const voices = config.voices ?? DEFAULT_POLY_VOICES;
      const lane = (count: number, laneIndex: number): Hit[] =>
        Array.from({ length: count }, (_, cell) => ({
          at: cell / count,
          level: cell === 0 ? 2 : 1,
          lane: laneIndex,
          cell,
          voice: voices[laneIndex],
          gain: cell === 0 ? 1 : POLY_UNACCENTED,
        }));
      return {
        beats: config.b,
        lanes: [config.a, config.b],
        hits: [...lane(config.a, 0), ...lane(config.b, 1)],
      };
    }
    case 'mutante': {
      const position = Math.floor(index / config.barsEach) % config.meters.length;
      return voiceMetro(
        meterCycle(config.meters[position]!),
        config.voices ?? DEFAULT_METRO_VOICES,
        (hit) => hit.level === 1,
      );
    }
    case 'drum': {
      const { steps, tracks, levels } = config;
      const at = swungPosition(steps, config.swing ?? SWING.straight);
      const hits: Hit[] = Array.from({ length: steps }, (_, cell) => ({
        at: at(cell),
        level: 0,
        lane: -1,
        cell,
      }));
      tracks.forEach((track, lane) => {
        const gain = levels[lane] ?? DEFAULT_LEVEL;
        if (!laneSounds(config, lane)) return;
        track.forEach((on, cell) => {
          if (!on || gain <= 0) return;
          hits.push({
            at: at(cell),
            level: on === 2 ? 2 : 1,
            lane,
            cell,
            voice: DRUMS[lane]!.id,
            gain,
            strong: on === 2,
          });
        });
      });
      return { beats: steps / 4, lanes: tracks.map(() => steps), hits };
    }
  }
}

/**
 * Cualquier ritmo pasado a batería, para poder verlo y editarlo en una grilla: cada golpe va a la fila
 * de su instrumento, el uno con acento, y con la misma batería. Suena igual que antes de pasarlo. Lo que
 * no entra en 32 pasos se comprime, así que ahí el resultado es aproximado.
 */
export function rhythmToDrums(config: RhythmConfig, index = 0): DrumConfig {
  if (config.mode === 'drum') return config;
  const cycle = cycleFor(config, index);
  let steps = Math.max(2, Math.round(cycle.beats * 4));
  while (steps > LIMITS.cells[1]) steps = Math.ceil(steps / 2);
  const tracks = DRUMS.map(() => new Array<Step>(steps).fill(0));
  for (const hit of cycle.hits) {
    if (!hit.voice) continue;
    const track = tracks[DRUMS.findIndex((drum) => drum.id === hit.voice)]!;
    const step = Math.round(hit.at * steps) % steps;
    track[step] = Math.max(track[step]!, hit.strong ? 2 : 1) as Step;
  }
  return {
    mode: 'drum',
    steps,
    bpm: config.bpm,
    tracks,
    levels: DRUMS.map(() => DEFAULT_LEVEL),
    ...(config.kit && { kit: config.kit }),
  };
}

const NAMED_EUCLID: Record<string, string> = {
  '2,3': 'el pulso de vals cojo',
  '3,4': 'el cumbia básico',
  '3,8': 'el tresillo',
  '5,8': 'el cinquillo',
  '7,12': 'la campana de 12/8 africana',
  '5,16': 'la bossa nova',
  '2,5': 'el pulso persa khafif-e-ramal',
};

function meterName({ groups, denom }: Meter): string {
  const total = groups.reduce((sum, group) => sum + group, 0);
  return groups.length > 1 && denom !== 4 ? `${total}/${denom} (${groups.join('+')})` : `${total}/${denom}`;
}

export function describeRhythm(config: RhythmConfig): { name: string; label: string; rule: string } {
  const tempo = `${config.bpm} ppm`;
  switch (config.mode) {
    case 'meter': {
      const name = meterName(config);
      const irregular = new Set(config.groups).size > 1;
      return {
        name,
        label: `${name}, ${tempo}`,
        rule: irregular
          ? `Compás irregular: ${config.groups.join('+')} reparte los acentos en grupos desiguales.`
          : `Compás regular: grupos iguales de ${config.groups[0]}.`,
      };
    }
    case 'euclid': {
      const known = NAMED_EUCLID[`${config.pulses},${config.steps}`];
      const pattern = euclid(config.pulses, config.steps, config.rotation)
        .map((on) => (on ? 'x' : '.'))
        .join('');
      return {
        name: `E(${config.pulses},${config.steps})`,
        label: `E(${config.pulses},${config.steps}) ${pattern}, ${tempo}`,
        rule: `Ritmo euclidiano: ${config.pulses} golpes en ${config.steps} pulsos lo más parejo posible${known ? `; es una rotación ${known.startsWith('el ') ? `del ${known.slice(3)}` : `de ${known}`}` : ''}.`,
      };
    }
    case 'poly': {
      const [first, second] = config.voices ?? DEFAULT_POLY_VOICES;
      return {
        name: `${config.a} contra ${config.b}`,
        label: `${config.a} contra ${config.b}, ${tempo}`,
        rule: `Polirritmia: ${config.a} golpes de ${drumName(first, config.kit).toLowerCase()} y ${config.b} de ${drumName(second, config.kit).toLowerCase()}, parejos en el mismo tiempo. Solo coinciden al empezar el ciclo.`,
      };
    }
    case 'mutante':
      return {
        name: config.meters.map(meterName).join(' → '),
        label: `${config.meters.map(meterName).join(' → ')}, ${tempo}`,
        rule: `Compás mutante: cambia cada ${config.barsEach} ${config.barsEach === 1 ? 'compás' : 'compases'}.`,
      };
    case 'drum': {
      const used = DRUMS.filter((_, lane) => config.tracks[lane]?.some(Boolean)).map((drum) =>
        drumName(drum.id, config.kit).toLowerCase(),
      );
      return {
        name: `Batería en ${config.steps} pasos`,
        label: `Batería en ${config.steps} pasos, ${tempo}`,
        rule: `Caja de ritmos: cada casilla es una semicorchea. Suenan ${used.length ? used.join(', ') : 'solo silencios'}${(config.swing ?? SWING.straight) > SWING.straight ? `, con swing de ${config.swing}` : ''}.`,
      };
    }
  }
}

// --- La configuración viaja en la URL, para que un ritmo se pueda compartir ---

const parseGroups = (text: string | null): number[] | null => {
  if (!text) return null;
  const groups = text
    .split(/[+,\s]+/)
    .filter(Boolean)
    .map(Number);
  const [min, max] = LIMITS.groupSize;
  const valid =
    groups.length > 0 && groups.every((group) => Number.isInteger(group) && group >= min && group <= max);
  return valid && groups.reduce((a, b) => a + b, 0) <= LIMITS.cells[1] ? groups : null;
};

export function parseMeter(groupsText: string, denom: number): Meter | null {
  const groups = parseGroups(groupsText);
  if (!groups || (denom !== 4 && denom !== 8 && denom !== 16)) return null;
  return { groups, denom };
}

const intIn = (value: string | null, min: number, max: number): number | null => {
  const number = Number(value);
  return value !== null && Number.isInteger(number) && number >= min && number <= max ? number : null;
};

export function rhythmToParams(config: RhythmConfig): URLSearchParams {
  const params = new URLSearchParams({ m: config.mode, bpm: String(config.bpm) });
  const sound = () => {
    if ('voices' in config && config.voices) params.set('v', config.voices.join('_'));
    if (config.kit && config.kit !== DEFAULT_KIT) params.set('kit', config.kit);
  };
  if (config.mode === 'meter') {
    params.set('g', config.groups.join('+'));
    params.set('d', String(config.denom));
    sound();
  } else if (config.mode === 'euclid') {
    params.set('k', String(config.pulses));
    params.set('n', String(config.steps));
    params.set('r', String(config.rotation));
    sound();
  } else if (config.mode === 'poly') {
    params.set('a', String(config.a));
    params.set('b', String(config.b));
    sound();
  } else if (config.mode === 'drum') {
    params.set('n', String(config.steps));
    params.set('p', config.tracks.map((track) => track.join('')).join('_'));
    params.set('l', config.levels.map((level) => Math.round(level * 100)).join('_'));
    if (config.swing !== undefined && config.swing !== SWING.straight) params.set('sw', String(config.swing));
    if (config.kit && config.kit !== DEFAULT_KIT) params.set('kit', config.kit);
  } else {
    params.set('s', config.meters.map((meter) => `${meter.groups.join('+')}/${meter.denom}`).join('_'));
    params.set('c', String(config.barsEach));
    sound();
  }
  return params;
}

export function rhythmFromParams(params: URLSearchParams): RhythmConfig | null {
  const bpm = intIn(params.get('bpm'), LIMITS.bpm[0], LIMITS.bpm[1]);
  if (bpm === null) return null;
  // Los instrumentos y la batería: los links de antes no los traen y suenan con los de siempre. Unos
  // instrumentos que no se entienden invalidan el link; una batería que no existe, no.
  const text = params.get('v');
  const voices = text === null ? undefined : parseVoices(text);
  if (voices === null) return null;
  const kit = DRUM_KITS.find((option) => option.id === params.get('kit'))?.id;
  const sound = {
    ...(voices && { voices }),
    ...(kit && kit !== DEFAULT_KIT && { kit }),
  };
  switch (params.get('m')) {
    case 'meter': {
      const meter = parseMeter(params.get('g') ?? '', Number(params.get('d')));
      return meter && { mode: 'meter', bpm, ...meter, ...sound };
    }
    case 'euclid': {
      const steps = intIn(params.get('n'), 2, LIMITS.cells[1]);
      if (steps === null) return null;
      const pulses = intIn(params.get('k'), 1, steps);
      const rotation = intIn(params.get('r'), 0, steps - 1);
      return pulses !== null && rotation !== null
        ? { mode: 'euclid', pulses, steps, rotation, bpm, ...sound }
        : null;
    }
    case 'poly': {
      const a = intIn(params.get('a'), LIMITS.lane[0], LIMITS.lane[1]);
      const b = intIn(params.get('b'), LIMITS.lane[0], LIMITS.lane[1]);
      if (a === null || b === null) return null;
      return { mode: 'poly', a, b, bpm, ...sound };
    }
    case 'mutante': {
      const barsEach = intIn(params.get('c'), 1, 16);
      const meters = (params.get('s') ?? '').split('_').map((part) => {
        const [groups = '', denom] = part.split('/');
        return parseMeter(groups, Number(denom));
      });
      if (barsEach === null || meters.length === 0 || meters.some((meter) => !meter)) return null;
      return { mode: 'mutante', meters: meters as Meter[], barsEach, bpm, ...sound };
    }
    case 'drum': {
      const steps = intIn(params.get('n'), 2, LIMITS.cells[1]);
      if (steps === null) return null;
      const rows = (params.get('p') ?? '').split('_');
      // Los links de antes traen seis filas, sin aro ni hi-hat abierto: cada una va a su lugar de ahora.
      const old = rows.length === OLD_LANES.length;
      if (
        (rows.length !== DRUMS.length && !old) ||
        !rows.every((row) => row.length === steps && /^[012]+$/.test(row))
      ) {
        return null;
      }
      const laneOf = (lane: number) => (old ? OLD_LANES.indexOf(lane) : lane);
      const levels = (params.get('l') ?? '').split('_').map(Number);
      const swing = params.has('sw') ? intIn(params.get('sw'), SWING.straight, SWING.max) : SWING.straight;
      if (swing === null) return null;
      return {
        mode: 'drum',
        steps,
        bpm,
        ...(swing !== SWING.straight && { swing }),
        ...(kit && kit !== DEFAULT_KIT && { kit }),
        tracks: DRUMS.map((_, lane) => {
          const row = rows[laneOf(lane)];
          return row ? [...row].map((char) => Number(char) as Step) : new Array<Step>(steps).fill(0);
        }),
        levels: DRUMS.map((_, lane) => {
          const level = levels[laneOf(lane)];
          return level !== undefined && Number.isFinite(level)
            ? Math.min(1, Math.max(0, level / 100))
            : DEFAULT_LEVEL;
        }),
      };
    }
    default:
      return null;
  }
}

/**
 * Al pasar de un tipo de ritmo a otro, el sonido va con uno: la batería siempre, y el golpe y el acento
 * entre los metrónomos (compás, euclidiano, mutante). La polirritmia y la caja de ritmos tienen sus
 * propios instrumentos.
 */
export function withSoundOf(from: RhythmConfig, to: RhythmConfig): RhythmConfig {
  const { kit: _kit, ...rest } = to;
  const next = { ...rest, ...(from.kit && from.kit !== DEFAULT_KIT && { kit: from.kit }) } as RhythmConfig;
  if (!isMetro(from) || !isMetro(next)) return next;
  const { voices: _voices, ...bare } = next;
  return { ...bare, ...(from.voices && { voices: from.voices }) } as RhythmConfig;
}
