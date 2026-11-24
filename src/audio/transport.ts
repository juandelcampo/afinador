// El reloj común: un solo tempo y una sola cuenta de pulsos para todo lo que suena en el tiempo (el ritmo,
// la vuelta). Cada parte programa sus notas en pulsos y el reloj las pasa a segundos; así, si suenan juntas,
// no se desfasan, y si cambia el tempo cambia para todas a la vez. Cuando suenan juntas, manda el ritmo.
import { getAudio } from './engine';
import { createTicker } from './ticker';

/** Cuánto se programa por adelantado, en segundos. */
const LOOKAHEAD_SECONDS = 0.15;
const TICK_MS = 25;
/** Lo que espera el primer pulso al arrancar, para que llegue a programarse. */
const START_DELAY = 0.08;

/** Una parte que suena: programa todo lo que cae antes de ese pulso. */
export type Voice = (until: number) => void;

let bpm = 100;
/** Un punto conocido de la cuenta: en tal segundo del audio iba tal pulso. */
let anchorTime = 0;
let anchorBeat = 0;
const voices = new Set<Voice>();
const timer = createTicker(TICK_MS);

const secondsPerBeat = () => 60 / bpm;

function tick() {
  const until = transport.horizon();
  voices.forEach((voice) => voice(until));
}

export const transport = {
  get running() {
    return voices.size > 0;
  },

  get bpm() {
    return bpm;
  },

  secondsPerBeat,

  /** En qué segundo del audio cae un pulso. */
  timeOf(beat: number): number {
    return anchorTime + (beat - anchorBeat) * secondsPerBeat();
  },

  /** En qué pulso va la cuenta en un segundo del audio. */
  beatAt(time: number): number {
    return anchorBeat + (time - anchorTime) / secondsPerBeat();
  },

  /** Hasta qué pulso hay que tener programado ahora. */
  horizon(): number {
    return transport.beatAt(getAudio().ctx.currentTime + LOOKAHEAD_SECONDS);
  },

  /**
   * Suma una parte y devuelve el pulso donde entra. Si no sonaba nada, la cuenta arranca de cero con ese tempo;
   * si ya sonaba algo, entra en el próximo pulso entero que todavía no se programó, sin tocar el tempo.
   * No programa nada todavía: la parte se acomoda en ese pulso y llama a `voice(transport.horizon())`.
   */
  join(voice: Voice, tempo: number): number {
    const { ctx } = getAudio();
    let start: number;
    if (!voices.size) {
      bpm = tempo;
      anchorTime = ctx.currentTime + START_DELAY;
      anchorBeat = 0;
      start = 0;
      timer.start(tick);
    } else {
      start = Math.ceil(transport.horizon());
    }
    voices.add(voice);
    return start;
  },

  /** Saca una parte; si era la última, el reloj se para. */
  leave(voice: Voice): void {
    voices.delete(voice);
    if (!voices.size) timer.stop();
  },

  /** Cambia el tempo sin cortar: la cuenta sigue desde el pulso donde va. */
  setBpm(tempo: number): void {
    if (tempo === bpm) return;
    if (voices.size) {
      const now = getAudio().ctx.currentTime;
      anchorBeat = transport.beatAt(now);
      anchorTime = now;
    }
    bpm = tempo;
  },
};
