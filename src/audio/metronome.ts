// Metrónomo y caja de ritmos, fuera de React: su reloj no depende de los renders. La interfaz se
// suscribe a `getState()` y consulta `playhead()` en cada cuadro. Suena solo en su página: Ritmo lo
// para al salir.
import { clampBpm, cycleFor, type Cycle, type DrumId, type Hit, type RhythmConfig } from '~/core/rhythm';
import { playClick, playDrum, type ClickSound } from './drums';
import { getAudio, rhythmBus } from './engine';
import { createTicker } from './ticker';

const LOOKAHEAD_SECONDS = 0.16;
const TICK_MS = 25;
const VISUAL_HISTORY = 128;

export interface MetronomeState {
  running: boolean;
  config: RhythmConfig;
  /** Cambia cuando cambia la forma del ciclo que hay que dibujar. */
  cycle: Cycle;
}

export const DEFAULT_RHYTHM: RhythmConfig = { mode: 'meter', groups: [1, 1, 1, 1], denom: 4, bpm: 100 };

let state: MetronomeState = {
  running: false,
  config: DEFAULT_RHYTHM,
  cycle: cycleFor(DEFAULT_RHYTHM, 0),
};
const listeners = new Set<() => void>();
let sound: ClickSound = 'clic';
/** El último ritmo de cada modo, para encontrarlo igual al volver a esa pestaña. */
const lastByMode: Partial<Record<RhythmConfig['mode'], RhythmConfig>> = {
  [DEFAULT_RHYTHM.mode]: DEFAULT_RHYTHM,
};

function setState(patch: Partial<MetronomeState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

const timer = createTicker(TICK_MS);

let cycleIndex = 0;
let cycle: Cycle = state.cycle;
let order: Hit[] = [];
let position = 0;
let cycleStart = 0;
/** Cuándo suena el primer golpe: antes no hay aguja que mover. */
let firstStart = 0;
let queued: Array<{ time: number; lane: number; cell: number; cycle: Cycle; index: number }> = [];

function sortHits(hits: Hit[]): Hit[] {
  return [...hits].sort((a, b) => a.at - b.at);
}

function loadCycle(index: number) {
  cycleIndex = index;
  cycle = cycleFor(state.config, index);
  order = sortHits(cycle.hits);
  position = 0;
}

const secondsPerCycle = () => (cycle.beats * 60) / state.config.bpm;

function schedule() {
  const { ctx } = getAudio();
  const out = rhythmBus();
  for (;;) {
    if (position >= order.length) {
      cycleStart += secondsPerCycle();
      loadCycle(cycleIndex + 1);
    }
    const hit = order[position];
    if (!hit) return;
    const time = cycleStart + hit.at * secondsPerCycle();
    if (time > ctx.currentTime + LOOKAHEAD_SECONDS) return;
    if (hit.voice) playDrum(ctx, out, hit.voice, time, hit.gain ?? 1);
    else if (hit.lane >= 0) playClick(ctx, out, sound, hit.level, hit.lane, time);
    queued.push({ time, lane: hit.lane, cell: hit.cell, cycle, index: cycleIndex });
    if (queued.length > VISUAL_HISTORY) queued = queued.slice(-VISUAL_HISTORY);
    position += 1;
  }
}

const withoutTempo = (config: RhythmConfig) => JSON.stringify({ ...config, bpm: 0 });
const samePattern = (a: RhythmConfig, b: RhythmConfig) =>
  (a.mode === 'drum' && b.mode === 'drum' && a.steps === b.steps) ||
  (a.mode === 'poly' && b.mode === 'poly' && a.a === b.a && a.b === b.b);

export const metronome = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getState: () => state,

  lastOfMode: (mode: RhythmConfig['mode']) => lastByMode[mode],

  setSound(next: ClickSound) {
    sound = next;
  },

  start() {
    const { ctx } = getAudio();
    loadCycle(0);
    queued = [];
    cycleStart = ctx.currentTime + 0.08;
    firstStart = cycleStart;
    setState({ running: true, cycle });
    schedule();
    timer.start(schedule);
  },

  stop() {
    if (!state.running) return;
    timer.stop();
    queued = [];
    setState({ running: false });
  },

  /** Un golpe suelto, para escuchar un sonido de la batería antes de usarlo. */
  preview(voice: DrumId, gain = 1) {
    const { ctx } = getAudio();
    playDrum(ctx, rhythmBus(), voice, ctx.currentTime + 0.01, gain);
  },

  /** Cambia el ritmo. Si está sonando, vuelve a empezar para no mezclar dos compases. */
  setConfig(config: RhythmConfig) {
    const next = { ...config, bpm: clampBpm(config.bpm) };
    lastByMode[next.mode] = next;
    if (state.running && withoutTempo(next) === withoutTempo(state.config)) {
      // El tempo cambia sin cortar: se recalcula el resto del ciclo desde este instante.
      const { ctx } = getAudio();
      const elapsed = (ctx.currentTime - cycleStart) / secondsPerCycle();
      setState({ config: next });
      cycleStart = ctx.currentTime - elapsed * secondsPerCycle();
      return;
    }
    if (state.running && samePattern(next, state.config)) {
      // La caja de ritmos y los instrumentos de la polirritmia se editan mientras suena:
      // el patrón cambia sin perder el lugar.
      const { ctx } = getAudio();
      const elapsed = (ctx.currentTime + LOOKAHEAD_SECONDS - cycleStart) / secondsPerCycle();
      const nextElapsed = (ctx.currentTime - cycleStart) / secondsPerCycle();
      setState({ config: next });
      cycleStart = ctx.currentTime - nextElapsed * secondsPerCycle();
      cycle = cycleFor(next, cycleIndex);
      order = sortHits(cycle.hits);
      position = order.findIndex((hit) => hit.at > elapsed);
      if (position < 0) position = order.length;
      setState({ cycle });
      return;
    }
    setState({ config: next, cycle: cycleFor(next, 0) });
    if (state.running) this.start();
  },

  /**
   * Cuánto va del ciclo que suena, de 0 a 1, para una aguja que gira sin saltos. El reloj programa un
   * poco por adelantado: si el ciclo siguiente ya está cargado, todavía suena el anterior.
   */
  progress(): number | null {
    if (!state.running) return null;
    const now = getAudio().ctx.currentTime;
    if (now < firstStart) return 0;
    const span = secondsPerCycle();
    const elapsed = (now - cycleStart) / span;
    return elapsed < 0 ? elapsed + 1 : elapsed % 1;
  },

  /**
   * Lo que está sonando ahora: el ciclo, en qué vuelta va (el mutante cambia de compás según la vuelta), la
   * casilla activa de cada carril y el paso general.
   */
  playhead(): {
    cycle: Cycle;
    index: number;
    cells: Array<number | null>;
    step: number | null;
  } | null {
    if (!state.running) return null;
    const now = getAudio().ctx.currentTime;
    let current: typeof queued = [];
    for (const item of queued) if (item.time <= now) current.push(item);
    const last = current[current.length - 1];
    if (!last) return null;
    current = current.filter((item) => item.cycle === last.cycle);
    const lastOf = (lane: number) => {
      for (let i = current.length - 1; i >= 0; i--) if (current[i]!.lane === lane) return current[i]!.cell;
      return null;
    };
    return {
      cycle: last.cycle,
      index: last.index,
      cells: last.cycle.lanes.map((_, lane) => lastOf(lane)),
      step: lastOf(-1),
    };
  },
};
