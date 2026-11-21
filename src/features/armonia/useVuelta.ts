// La vuelta suena: un rasguido por pulso (o uno por acorde), programado con el reloj de audio.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudio } from '~/audio/engine';
import { pluckString } from '~/audio/instrument';

const LOOKAHEAD = 0.12;
const SCHEDULE_MS = 30;

/** Lo que suena de un acorde: el MIDI de cada cuerda, o null si va apagada. */
export type Voicing = Array<number | null>;

export type Feel = 'pulso' | 'acorde';

/** Un rasguido hacia abajo, de la cuerda más grave a la más aguda. */
function strumVoicing(voicing: Voicing, a4: number, when: number, velocity: number, spread: number) {
  let position = 0;
  voicing.forEach((midi, stringIndex) => {
    if (midi === null) return;
    pluckString(stringIndex, midi, { a4, when: when + position * spread, velocity });
    position += 1;
  });
}

export function useVuelta({
  voicings,
  a4,
  tempo,
  beats,
  feel,
}: {
  voicings: Voicing[];
  a4: number;
  tempo: number;
  /** Pulsos que dura cada acorde. */
  beats: number;
  feel: Feel;
}) {
  const [running, setRunning] = useState(false);
  /** El acorde que está sonando en la vuelta, para encenderlo. */
  const [current, setCurrent] = useState<number | null>(null);

  // El secuenciador corre fuera de los renders: siempre lee lo último.
  const latest = useRef({ voicings, a4, tempo, beats, feel });
  useEffect(() => {
    latest.current = { voicings, a4, tempo, beats, feel };
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
    if (!latest.current.voicings.length) return;
    const { ctx } = getAudio();
    let beat = 0;
    let nextTime = ctx.currentTime + 0.06;

    const schedule = () => {
      const { voicings: list, a4: pitch, tempo: bpm, beats: perChord, feel: mode } = latest.current;
      if (!list.length) return stop();
      while (nextTime < ctx.currentTime + LOOKAHEAD) {
        const total = list.length * perChord;
        const position = beat % total;
        const index = Math.floor(position / perChord);
        const first = position % perChord === 0;
        if (first || mode === 'pulso') {
          strumVoicing(list[index]!, pitch, nextTime, first ? 0.9 : 0.5, first ? 0.03 : 0.018);
        }
        if (first) {
          const delay = Math.max(0, (nextTime - ctx.currentTime) * 1000);
          timers.current.marks = [
            ...timers.current.marks.slice(-8),
            setTimeout(() => setCurrent(index), delay),
          ];
        }
        nextTime += 60 / bpm;
        beat += 1;
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
