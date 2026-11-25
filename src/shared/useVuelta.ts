// La vuelta suena: un rasguido por pulso, uno solo por acorde o un arpegio. Cuenta en pulsos con el reloj
// común (`transport`): si suena con un ritmo, el tempo es el del ritmo, y los pulsos son los de su compás
// (`pulseGrid`): en un 6/8 rasguea dos veces por compás, en un 7/8 de 2+2+3, tres desparejas.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudio } from '~/audio/engine';
import { pluckString } from '~/audio/instrument';
import { transport, type Voice } from '~/audio/transport';
import { QUARTER_GRID, type PulseGrid } from '~/core/rhythm';
import type { Voicing } from '~/core/vuelta';

export type { Voicing };

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
 * Un pulso de arpegio, en corcheas: dos en una negra, tres en un pulso de 6/8. El bajo al entrar al
 * acorde y después las otras cuerdas, subiendo y bajando (como p i m a m i). `eighth` es la corchea dentro
 * del acorde donde empieza este pulso, para seguir la cuenta donde quedó.
 */
function arpeggiate(
  voicing: Voicing,
  a4: number,
  when: number,
  beat: number,
  length: number,
  eighth: number,
) {
  const sounding = voicing.flatMap((midi, stringIndex) => (midi === null ? [] : [{ midi, stringIndex }]));
  if (!sounding.length) return;
  const [bass, ...upper] = sounding;
  const cycle = upper.length > 1 ? [...upper, ...upper.slice(1, -1).reverse()] : upper;
  const notes = Math.max(1, Math.round(length * 2));
  for (let index = 0; index < notes; index++) {
    const count = eighth + index;
    const note = count === 0 || !cycle.length ? bass! : cycle[(count - 1) % cycle.length]!;
    pluckString(note.stringIndex, note.midi, {
      a4,
      when: when + (index * length * beat) / notes,
      velocity: count === 0 ? 0.9 : 0.6,
    });
  }
}

const gridOfQuarters = () => QUARTER_GRID;

export function useVuelta({
  steps,
  a4,
  tempo,
  feel,
  grid = gridOfQuarters,
}: {
  /** Cada acorde con lo que dura en pulsos: la duración va acorde por acorde. */
  steps: Step[];
  a4: number;
  tempo: number;
  feel: Feel;
  /** Los pulsos de cada compás, si suena con un ritmo. Sin ritmo, negras. */
  grid?: (bar: number) => PulseGrid;
}) {
  const [running, setRunning] = useState(false);
  /** El acorde que está sonando en la vuelta, para encenderlo. */
  const [current, setCurrent] = useState<number | null>(null);

  // El secuenciador corre fuera de los renders: siempre lee lo último.
  const latest = useRef({ steps, a4, tempo, feel, grid });
  useEffect(() => {
    latest.current = { steps, a4, tempo, feel, grid };
  });
  const timers = useRef<{
    voice: Voice | null;
    marks: ReturnType<typeof setTimeout>[];
  }>({ voice: null, marks: [] });

  const stop = useCallback(() => {
    if (timers.current.voice) transport.leave(timers.current.voice);
    timers.current.marks.forEach(clearTimeout);
    timers.current = { voice: null, marks: [] };
    setRunning(false);
    setCurrent(null);
  }, []);

  /**
   * Arranca la vuelta. Sola, entra cuando puede; con un ritmo, `at` es el pulso del reloj donde el ritmo da
   * su primer golpe, así el primer acorde cae en el uno del compás.
   */
  const start = useCallback(
    (at?: number) => {
      stop();
      if (!latest.current.steps.length) return;
      const { ctx } = getAudio();
      /** El acorde que suena y en qué pulso y corchea va dentro de él. */
      let index = 0;
      let pulse = 0;
      let eighth = 0;
      /** El compás que se está programando, dónde empieza en el reloj y en qué pulso suyo va. */
      let bar = 0;
      let barStart = 0;
      let barGrid = latest.current.grid(0);
      let slot = 0;

      const schedule: Voice = (until) => {
        const { steps: list, a4: pitch, feel: mode } = latest.current;
        if (!list.length) return stop();
        for (;;) {
          if (slot >= barGrid.pulses.length) {
            barStart += barGrid.beats;
            bar += 1;
            barGrid = latest.current.grid(bar);
            slot = 0;
          }
          const { at: offset, length } = barGrid.pulses[slot]!;
          const nextBeat = barStart + offset;
          if (nextBeat >= until) return;
          // Si mientras sonaba sacaste acordes, la cuenta vuelve al principio.
          if (index >= list.length) {
            index = 0;
            pulse = 0;
            eighth = 0;
          }
          const step = list[index]!;
          const first = pulse === 0;
          const nextTime = transport.timeOf(nextBeat);
          const beat = transport.secondsPerBeat();
          if (mode === 'arpegio') arpeggiate(step.voicing, pitch, nextTime, beat, length, eighth);
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
          slot += 1;
          pulse += 1;
          eighth += Math.max(1, Math.round(length * 2));
          if (pulse >= Math.max(1, step.beats)) {
            pulse = 0;
            eighth = 0;
            index = (index + 1) % list.length;
          }
        }
      };

      // Si ya suena un ritmo, la vuelta entra donde él empezó, o en su próximo pulso, y sigue su tempo.
      const joined = transport.join(schedule, latest.current.tempo);
      barStart = at ?? joined;
      timers.current.voice = schedule;
      setRunning(true);
      schedule(transport.horizon());
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  // Sola, la vuelta lleva su tempo. Con un ritmo, el tempo que le llega es el del ritmo: manda él.
  useEffect(() => {
    if (running) transport.setBpm(tempo);
  }, [running, tempo]);

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
