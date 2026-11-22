// Un drone para tocar encima de una escala: la tónica grave sostenida, con su quinta si la escala la tiene.
// Es lo mínimo del de Scordatura: sin timbres ni perillas. Va derecho a la salida, como el ritmo, y entra y
// sale con un fundido para que no golpee.
import { midiToHz } from '~/core/notes';
import { getAudio, rhythmBus } from './engine';

const FADE_IN = 0.8;
const FADE_OUT = 0.5;
const LEVEL = 0.22;
/** Cuántos cents se separan los dos osciladores de cada nota: el batido es lo que lo hace vivo. */
const DETUNE = 7;

interface Patch {
  amp: GainNode;
  oscillators: OscillatorNode[];
  key: string;
}

let patch: Patch | null = null;

/** Armónicos de órgano: fundamental, octava y duodécima, apagados arriba. */
function organWave(ctx: AudioContext): PeriodicWave {
  const real = new Float32Array(7);
  const imag = new Float32Array([0, 1, 0.5, 0.3, 0.16, 0.08, 0.04]);
  return ctx.createPeriodicWave(real, imag);
}

function build(midis: readonly number[], a4: number): Patch {
  const { ctx } = getAudio();
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, ctx.currentTime);
  amp.gain.linearRampToValueAtTime(LEVEL, ctx.currentTime + FADE_IN);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.7;
  filter.connect(amp).connect(rhythmBus());
  const wave = organWave(ctx);
  const oscillators = midis.flatMap((midi, index) => {
    const voice = ctx.createGain();
    // La tónica manda; lo de arriba acompaña.
    voice.gain.value = (index === 0 ? 0.6 : 0.35) / 2;
    voice.connect(filter);
    return [-1, 1].map((direction) => {
      const oscillator = ctx.createOscillator();
      oscillator.setPeriodicWave(wave);
      oscillator.frequency.value = midiToHz(midi, a4);
      oscillator.detune.value = (direction * DETUNE) / 2;
      oscillator.connect(voice);
      oscillator.start();
      return oscillator;
    });
  });
  return { amp, oscillators, key: `${midis.join()}|${a4}` };
}

function release(old: Patch) {
  const { ctx } = getAudio();
  old.amp.gain.cancelScheduledValues(ctx.currentTime);
  old.amp.gain.setTargetAtTime(0, ctx.currentTime, FADE_OUT / 3);
  const end = ctx.currentTime + FADE_OUT + 0.2;
  old.oscillators.forEach((oscillator) => oscillator.stop(end));
  old.oscillators[0]!.onended = () => old.amp.disconnect();
}

export const drone = {
  /** Suena con estas notas; si ya sonaba con otras, pasa a las nuevas con un fundido. */
  play(midis: readonly number[], a4: number) {
    const key = `${midis.join()}|${a4}`;
    if (patch?.key === key) return;
    if (patch) release(patch);
    patch = build(midis, a4);
  },
  stop() {
    if (patch) release(patch);
    patch = null;
  },
};
