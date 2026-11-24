// Metrónomo y caja de ritmos, fuera de React: su reloj no depende de los renders. La interfaz se
// suscribe a `getState()` y consulta `playhead()` en cada cuadro. Suena solo en su página: Ritmo lo
// para al salir. Cuenta en pulsos con el reloj común (`transport`), y su tempo es el que manda.
import { clampBpm, cycleFor, type Cycle, type DrumId, type Hit, type RhythmConfig } from '~/core/rhythm';
import { getAudio, rhythmBus } from './engine';
import { playKitDrum, setKit } from './kit';
import { transport } from './transport';

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
/** El último ritmo de cada modo, para encontrarlo igual al volver a esa pestaña. */
const lastByMode: Partial<Record<RhythmConfig['mode'], RhythmConfig>> = {
  [DEFAULT_RHYTHM.mode]: DEFAULT_RHYTHM,
};

function setState(patch: Partial<MetronomeState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

let cycleIndex = 0;
let cycle: Cycle = state.cycle;
let order: Hit[] = [];
let position = 0;
/** El pulso del reloj común donde empieza el ciclo que se está programando. */
let cycleStart = 0;
/** El pulso donde suena el primer golpe: antes no hay aguja que mover. */
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

/** Cuánto va del ciclo que suena en un pulso del reloj, en ciclos. */
const elapsedAt = (beat: number) => (beat - cycleStart) / cycle.beats;
const nowBeat = () => transport.beatAt(getAudio().ctx.currentTime);

function schedule(until: number) {
  const { ctx } = getAudio();
  const out = rhythmBus();
  for (;;) {
    if (position >= order.length) {
      cycleStart += cycle.beats;
      loadCycle(cycleIndex + 1);
    }
    const hit = order[position];
    if (!hit) return;
    const beat = cycleStart + hit.at * cycle.beats;
    if (beat > until) return;
    const time = transport.timeOf(beat);
    // Todo suena con la batería: el acento con la toma fuerte; en la polirritmia el acento ya va en el volumen.
    if (hit.voice) playKitDrum(ctx, out, hit.voice, time, hit.gain ?? 1, !!hit.strong);
    queued.push({ time, lane: hit.lane, cell: hit.cell, cycle, index: cycleIndex });
    if (queued.length > VISUAL_HISTORY) queued = queued.slice(-VISUAL_HISTORY);
    position += 1;
  }
}

const withoutTempo = (config: RhythmConfig) => JSON.stringify({ ...config, bpm: 0 });
/** El ritmo sin el sonido: cambiar de instrumento o de batería no lo cambia. */
const withoutSound = (config: RhythmConfig) =>
  JSON.stringify({ ...config, bpm: 0, kit: undefined, voices: undefined });
const samePattern = (a: RhythmConfig, b: RhythmConfig) =>
  (a.mode === 'drum' && b.mode === 'drum' && a.steps === b.steps) ||
  (a.mode !== 'drum' && withoutSound(a) === withoutSound(b));

export const metronome = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getState: () => state,

  lastOfMode: (mode: RhythmConfig['mode']) => lastByMode[mode],

  start() {
    transport.leave(schedule);
    loadCycle(0);
    queued = [];
    // Si ya sonaba otra cosa (la vuelta), el ritmo entra en el próximo pulso y le impone su tempo.
    transport.setBpm(state.config.bpm);
    cycleStart = firstStart = transport.join(schedule, state.config.bpm);
    setState({ running: true, cycle });
    schedule(transport.horizon());
  },

  stop() {
    if (!state.running) return;
    transport.leave(schedule);
    queued = [];
    setState({ running: false });
  },

  /** Un golpe suelto, para escuchar un sonido de la batería antes de usarlo. */
  preview(voice: DrumId, gain = 1, strong = false) {
    const { ctx } = getAudio();
    playKitDrum(ctx, rhythmBus(), voice, ctx.currentTime + 0.01, gain, strong);
  },

  /** Cambia el ritmo. Si está sonando, vuelve a empezar para no mezclar dos compases. */
  setConfig(config: RhythmConfig) {
    const next = { ...config, bpm: clampBpm(config.bpm) };
    setKit(next.kit);
    lastByMode[next.mode] = next;
    if (state.running && withoutTempo(next) === withoutTempo(state.config)) {
      // El tempo cambia sin cortar: el reloj común sigue desde el pulso donde va, para todo lo que suena.
      setState({ config: next });
      transport.setBpm(next.bpm);
      return;
    }
    if (state.running && samePattern(next, state.config)) {
      // La caja de ritmos y los instrumentos y la batería de cualquier ritmo se editan mientras suena:
      // el patrón cambia sin perder el lugar.
      const now = nowBeat();
      const elapsed = elapsedAt(transport.horizon());
      const nextElapsed = elapsedAt(now);
      setState({ config: next });
      cycle = cycleFor(next, cycleIndex);
      // Si el ciclo nuevo dura otra cantidad de pulsos, la aguja queda en la misma fracción del ciclo.
      cycleStart = now - nextElapsed * cycle.beats;
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
    const now = nowBeat();
    if (now < firstStart) return 0;
    const elapsed = elapsedAt(now);
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
