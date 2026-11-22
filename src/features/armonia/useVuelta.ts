// La vuelta suena: un rasguido por pulso, uno solo por acorde o un arpegio, programado con el reloj de audio.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudio } from '~/audio/engine';
import { pluckString } from '~/audio/instrument';

const LOOKAHEAD = 0.12;
const SCHEDULE_MS = 30;

/** Lo que suena de un acorde: el MIDI de cada cuerda, o null si va apagada. */
export type Voicing = Array<number | null>;

export type Feel = 'pulso' | 'acorde' | 'arpegio';

/** Un acorde de la vuelta: lo que suena y cuántos pulsos dura. */
export interface Step {
  voicing: Voicing;
  beats: number;
}

/** Un rasguido hacia abajo, de la cuerda más grave a la más aguda. */
function strumVoicing(voicing: Voicing, a4: number, when: number, velocity: number, spread: number) {
  let position = 0;
  voicing.forEach((midi, stringIndex) => {
    if (midi === null) return;
    pluckString(stringIndex, midi, { a4, when: when + position * spread, velocity });
    position += 1;
  });
}

/**
 * Un pulso de arpegio, en dos corcheas: el bajo al entrar al acorde y después las otras cuerdas, subiendo y
 * bajando (como p i m a m i). `pulse` es el pulso dentro del acorde, para seguir la cuenta donde quedó.
 */
function arpeggiate(voicing: Voicing, a4: number, when: number, beat: number, pulse: number) {
  const sounding = voicing.flatMap((midi, stringIndex) => (midi === null ? [] : [{ midi, stringIndex }]));
  if (!sounding.length) return;
  const [bass, ...upper] = sounding;
  const cycle = upper.length > 1 ? [...upper, ...upper.slice(1, -1).reverse()] : upper;
  for (let half = 0; half < 2; half++) {
    const eighth = pulse * 2 + half;
    const note = eighth === 0 || !cycle.length ? bass! : cycle[(eighth - 1) % cycle.length]!;
    pluckString(note.stringIndex, note.midi, {
      a4,
      when: when + (half * beat) / 2,
      velocity: eighth === 0 ? 0.9 : 0.6,
    });
  }
}

export function useVuelta({
  steps,
  a4,
  tempo,
  feel,
}: {
  /** Cada acorde con lo que dura: la duración va acorde por acorde. */
  steps: Step[];
  a4: number;
  tempo: number;
  feel: Feel;
}) {
  const [running, setRunning] = useState(false);
  /** El acorde que está sonando en la vuelta, para encenderlo. */
  const [current, setCurrent] = useState<number | null>(null);

  // El secuenciador corre fuera de los renders: siempre lee lo último.
  const latest = useRef({ steps, a4, tempo, feel });
  useEffect(() => {
    latest.current = { steps, a4, tempo, feel };
  });
  const timers = useRef<{
    interval: ReturnType<typeof setInterval> | null;
    marks: ReturnType<typeof setTimeout>[];
  }>({ interval: null, marks: [] });

  const stop = useCallback(() => {
    if (timers.current.interval !== null) clearInterval(timers.current.interval);
    timers.current.marks.forEach(clearTimeout);
    timers.current = { interval: null, marks: [] };
    setRunning(false);
    setCurrent(null);
  }, []);

  const start = useCallback(() => {
    stop();
    if (!latest.current.steps.length) return;
    const { ctx } = getAudio();
    /** El acorde que suena y el pulso dentro de él. */
    let index = 0;
    let pulse = 0;
    let nextTime = ctx.currentTime + 0.06;

    const schedule = () => {
      const { steps: list, a4: pitch, tempo: bpm, feel: mode } = latest.current;
      if (!list.length) return stop();
      while (nextTime < ctx.currentTime + LOOKAHEAD) {
        // Si mientras sonaba sacaste acordes, la cuenta vuelve al principio.
        if (index >= list.length) {
          index = 0;
          pulse = 0;
        }
        const step = list[index]!;
        const first = pulse === 0;
        const beat = 60 / bpm;
        if (mode === 'arpegio') arpeggiate(step.voicing, pitch, nextTime, beat, pulse);
        else if (first || mode === 'pulso') {
          strumVoicing(step.voicing, pitch, nextTime, first ? 0.9 : 0.5, first ? 0.03 : 0.018);
        }
        if (first) {
          const playing = index;
          const delay = Math.max(0, (nextTime - ctx.currentTime) * 1000);
          timers.current.marks = [
            ...timers.current.marks.slice(-8),
            setTimeout(() => setCurrent(playing), delay),
          ];
        }
        nextTime += beat;
        pulse += 1;
        if (pulse >= Math.max(1, step.beats)) {
          pulse = 0;
          index = (index + 1) % list.length;
        }
      }
    };

    timers.current.interval = setInterval(schedule, SCHEDULE_MS);
    setRunning(true);
    schedule();
  }, [stop]);

  useEffect(() => stop, [stop]);

  /** Un acorde suelto, para escucharlo antes de sumarlo. */
  const strum = useCallback((voicing: Voicing) => {
    const { ctx } = getAudio();
    strumVoicing(voicing, latest.current.a4, ctx.currentTime + 0.02, 0.9, 0.06);
  }, []);

  /** Una vuelta de muestra: cada acorde una vez, dos pulsos cada uno, sin quedar sonando. */
  const preview = useCallback(
    (list: Voicing[]) => {
      stop();
      const { ctx } = getAudio();
      const step = 120 / latest.current.tempo;
      list.forEach((voicing, index) =>
        strumVoicing(voicing, latest.current.a4, ctx.currentTime + 0.04 + index * step, 0.85, 0.05),
      );
    },
    [stop],
  );

  return { running, current, start, stop, strum, preview };
}
