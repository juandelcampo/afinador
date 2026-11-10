// Estado y secuenciador del escuchador: arpegios y rasgueos programados con el reloj de audio.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudio } from '~/audio/engine';
import { pluckString } from '~/audio/instrument';
import { noteToMidi } from '~/core/notes';
import { TEMPO_RANGE, useSettings, type PlayStyle } from '~/shared/settings';

export type { PlayStyle };

interface ArpPattern {
  id: string;
  name: string;
  /** Cuerdas por paso, numeradas como en la guitarra (6 grave, 1 aguda). */
  steps: number[][];
}

interface StrumPattern {
  id: string;
  name: string;
  /** Segundos entre cuerda y cuerda de un mismo rasguido. */
  spread: number;
  steps: Array<'down' | 'up' | null>;
}

export const ARP_PATTERNS: ArpPattern[] = [
  { id: 'up', name: 'Ascendente', steps: [[6], [5], [4], [3], [2], [1]] },
  { id: 'updown', name: 'Sube y baja', steps: [[6], [5], [4], [3], [2], [1], [2], [3], [4], [5]] },
  { id: 'travis', name: 'Pulgar alternado', steps: [[6], [2], [4], [3], [5], [2], [4], [3]] },
  { id: 'pinch', name: 'Bajo y agudas', steps: [[6, 1], [3], [2], [3], [5, 1], [3], [2], [3]] },
];

export const STRUM_PATTERNS: StrumPattern[] = [
  { id: 'single', name: 'Una bajada', spread: 0.03, steps: ['down', null, null, null] },
  {
    id: 'slow',
    name: 'Bajada lenta',
    spread: 0.11,
    steps: ['down', null, null, null, null, null, null, null],
  },
  { id: 'folk', name: 'Folk', spread: 0.02, steps: ['down', null, 'down', 'up', null, 'up', 'down', 'up'] },
  { id: 'waltz', name: 'Vals', spread: 0.024, steps: ['down', null, 'down', 'up', 'down', 'up'] },
];

/** Lo guardado puede nombrar un patrón que ya no existe: entonces vale el primero. */
function knownPattern(style: PlayStyle, id: string) {
  const list = style === 'arp' ? ARP_PATTERNS : STRUM_PATTERNS;
  return list.some((item) => item.id === id) ? id : list[0]!.id;
}

const STRINGS = 6;
const LOOKAHEAD = 0.12;
const SCHEDULE_MS = 30;

export function useListener(
  notes: string[],
  a4: number,
  onSound: (stringIndex: number, velocity: number) => void,
  /** El paso del patrón que está sonando, o null al parar. Solo para el patrón elegido, no para el
   *  arpegio suelto al elegir afinación. */
  onStep?: (step: number | null) => void,
) {
  const [capo, setCapoState] = useState(0);
  const [frets, setFrets] = useState<number[]>(() => new Array(STRINGS).fill(0));
  // Estilo y patrón quedan en las preferencias: sobreviven al cambio de afinación y a recargar.
  const listen = useSettings((s) => s.listen);
  const setSettings = useSettings((s) => s.set);
  const { style, tempo } = listen;
  const patternId: Record<PlayStyle, string> = {
    arp: knownPattern('arp', listen.patterns.arp),
    strum: knownPattern('strum', listen.patterns.strum),
  };
  const [loop, setLoop] = useState(false);
  const [running, setRunning] = useState(false);

  // El secuenciador corre fuera de los renders: siempre lee el último estado.
  const latest = useRef({ notes, a4, capo, frets, tempo, loop, style, patternId, onSound, onStep });
  useEffect(() => {
    latest.current = { notes, a4, capo, frets, tempo, loop, style, patternId, onSound, onStep };
  });

  const timers = useRef<{
    interval: ReturnType<typeof setInterval> | null;
    end: ReturnType<typeof setTimeout> | null;
    /** Los avisos de paso ya programados: al parar se cancelan, así no se enciende uno tarde. */
    steps: ReturnType<typeof setTimeout>[];
    /** Corre lo que arrancó Tocar, no una vuelta suelta. */
    playing: boolean;
  }>({
    interval: null,
    end: null,
    steps: [],
    playing: false,
  });

  const playString = useCallback((stringIndex: number, when?: number, velocity = 1) => {
    const state = latest.current;
    // Una cuerda apagada por la figura de un acorde no suena en rasgueos ni arpegios.
    if (state.frets[stringIndex]! < 0) return;
    const midi = noteToMidi(state.notes[stringIndex]!) + state.capo + state.frets[stringIndex]!;
    const start = pluckString(stringIndex, midi, { a4: state.a4, when, velocity });
    const delay = Math.max(0, (start - getAudio().ctx.currentTime) * 1000);
    setTimeout(() => latest.current.onSound(stringIndex, velocity), delay);
  }, []);

  const stop = useCallback(() => {
    if (timers.current.interval !== null) clearInterval(timers.current.interval);
    if (timers.current.end !== null) clearTimeout(timers.current.end);
    timers.current.steps.forEach(clearTimeout);
    timers.current = { interval: null, end: null, steps: [], playing: false };
    latest.current.onStep?.(null);
    setRunning(false);
  }, []);

  /** Sin `pattern`, toca el patrón elegido y enciende sus pasos en la tira. Con `once`, una vuelta
   *  aunque esté marcado Repetir. */
  const start = useCallback(
    (options: { pattern?: { style: PlayStyle; id: string }; once?: boolean } = {}) => {
      stop();
      const { ctx } = getAudio();
      const { pattern } = options;
      const once = options.once || pattern !== undefined;
      const playStyle = pattern?.style ?? latest.current.style;
      const id = pattern?.id ?? latest.current.patternId[playStyle];
      const arp = ARP_PATTERNS.find((item) => item.id === id);
      const strum = STRUM_PATTERNS.find((item) => item.id === id);
      const length = playStyle === 'arp' ? (arp?.steps.length ?? 0) : (strum?.steps.length ?? 0);
      let step = 0;
      let nextTime = ctx.currentTime + 0.06;

      const playStep = (index: number, time: number) => {
        if (playStyle === 'arp') {
          arp?.steps[index]?.forEach((stringNumber) => playString(STRINGS - stringNumber, time, 0.9));
          return;
        }
        const direction = strum?.steps[index];
        if (!direction || !strum) return;
        const order = direction === 'up' ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
        order.forEach((stringIndex, position) =>
          playString(stringIndex, time + position * strum.spread, direction === 'up' ? 0.62 : 0.85),
        );
      };

      const schedule = () => {
        const stepSeconds = 60 / latest.current.tempo / 2;
        while (nextTime < ctx.currentTime + LOOKAHEAD) {
          if (step >= length) {
            if (once || !latest.current.loop) {
              if (timers.current.interval !== null) clearInterval(timers.current.interval);
              timers.current.interval = null;
              timers.current.end = setTimeout(
                () => {
                  latest.current.onStep?.(null);
                  setRunning(false);
                },
                Math.max(0, nextTime - ctx.currentTime) * 1000,
              );
              return;
            }
            step = 0;
          }
          playStep(step, nextTime);
          if (!pattern) {
            const current = step;
            const delay = Math.max(0, (nextTime - ctx.currentTime) * 1000);
            timers.current.steps = [
              ...timers.current.steps.slice(-16),
              setTimeout(() => latest.current.onStep?.(current), delay),
            ];
          }
          nextTime += stepSeconds;
          step += 1;
        }
      };

      timers.current.interval = setInterval(schedule, SCHEDULE_MS);
      timers.current.playing = !once;
      setRunning(true);
      schedule();
    },
    [playString, stop],
  );

  useEffect(() => stop, [stop]);

  // Cambiar el patrón con la música en marcha lo aplica enseguida.
  const restartIfRunning = useCallback(() => {
    if (timers.current.interval !== null) setTimeout(() => start(), 0);
  }, [start]);

  return {
    capo,
    frets,
    style,
    patternId,
    tempo,
    loop,
    running,
    playString,
    start: useCallback(() => start(), [start]),
    playAscending: useCallback(() => start({ pattern: { style: 'arp', id: 'up' } }), [start]),
    stop,
    setTempo: (value: number) =>
      setSettings({
        listen: { ...listen, tempo: Math.max(TEMPO_RANGE.min, Math.min(TEMPO_RANGE.max, value)) },
      }),
    setLoop,
    setCapo: (value: number) => setCapoState(Math.max(0, Math.min(12, value))),
    clearFrets: () => setFrets(new Array(STRINGS).fill(0)),
    applyShape: (next: number[]) => {
      latest.current.frets = next;
      setFrets(next);
      // Si ya está sonando, sigue con la nueva figura; si no, una vuelta del patrón elegido.
      if (!timers.current.playing || timers.current.interval === null) start({ once: true });
    },
    toggleFret: (stringIndex: number, fret: number) => {
      const next = frets.map((value, index) => (index === stringIndex ? (value === fret ? 0 : fret) : value));
      latest.current.frets = next;
      setFrets(next);
      playString(stringIndex);
    },
    chooseStyle: (value: PlayStyle) => {
      latest.current.style = value;
      setSettings({ listen: { ...listen, style: value } });
      restartIfRunning();
    },
    choosePattern: (value: string) => {
      const next = { ...patternId, [style]: value };
      latest.current.patternId = next;
      setSettings({ listen: { ...listen, patterns: next } });
      restartIfRunning();
    },
  };
}
