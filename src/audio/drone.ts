// Un drone para tocar encima de una escala. El sinte es el de Scordatura: dos osciladores apenas
// desafinados por nota, un filtro que respira con un LFO y tres timbres. Va por su propio canal (tiene su
// volumen) y entra y sale con un fundido para que no golpee.
import type { DroneSound, TimbreId } from '~/core/drone';
import { midiToHz } from '~/core/notes';
import { droneBus, getAudio } from './engine';

const FADE_IN = 1;
const FADE_OUT = 0.6;
const LEVEL = 0.26;

interface Patch {
  amp: GainNode;
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoDepth: GainNode;
  /** Los dos osciladores de cada nota. */
  pairs: OscillatorNode[][];
  /** Notas, timbre y La: si cambia algo de esto, se arma de nuevo. */
  key: string;
  detune: number;
}

let patch: Patch | null = null;
let analyser: AnalyserNode | null = null;

const cutoff = (brightness: number) => 120 * Math.pow(45, brightness);
const lfoRate = (motion: number) => 0.05 + motion * 0.5;
const lfoAmount = (brightness: number, motion: number) => cutoff(brightness) * motion * 0.8;
const patchKey = (midis: readonly number[], a4: number, timbre: TimbreId) => `${midis.join()}|${a4}|${timbre}`;

/** Armónicos del órgano: fundamental, octava y duodécima, como unos tiradores. */
function organWave(ctx: AudioContext): PeriodicWave {
  const real = new Float32Array(7);
  const imag = new Float32Array([0, 1, 0.55, 0.35, 0.2, 0.1, 0.06]);
  return ctx.createPeriodicWave(real, imag);
}

function build(midis: readonly number[], a4: number, sound: DroneSound): Patch {
  const { ctx } = getAudio();
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, ctx.currentTime);
  amp.gain.linearRampToValueAtTime(LEVEL, ctx.currentTime + FADE_IN);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.8;
  filter.frequency.value = cutoff(sound.brightness);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = lfoRate(sound.motion);
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = lfoAmount(sound.brightness, sound.motion);
  lfo.connect(lfoDepth).connect(filter.frequency);
  lfo.start();

  analyser ??= ctx.createAnalyser();
  analyser.fftSize = 2048;
  filter.connect(amp).connect(analyser);
  analyser.connect(droneBus());

  const wave = sound.timbre === 'organo' ? organWave(ctx) : null;
  const pairs = midis.map((midi, index) => {
    const voice = ctx.createGain();
    voice.gain.value = 1 / Math.sqrt(midis.length);
    // Las voces se abren un poco a los costados.
    const panner = ctx.createStereoPanner();
    panner.pan.value = midis.length > 1 ? (index / (midis.length - 1) - 0.5) * 0.7 : 0;
    voice.connect(panner).connect(filter);
    return [-1, 1].map((direction) => {
      const oscillator = ctx.createOscillator();
      if (wave) oscillator.setPeriodicWave(wave);
      else oscillator.type = sound.timbre === 'crudo' ? 'sawtooth' : 'triangle';
      oscillator.frequency.value = midiToHz(midi, a4);
      oscillator.detune.value = (direction * sound.detune) / 2;
      const half = ctx.createGain();
      half.gain.value = 0.5;
      oscillator.connect(half).connect(voice);
      oscillator.start();
      return oscillator;
    });
  });
  return { amp, filter, lfo, lfoDepth, pairs, key: patchKey(midis, a4, sound.timbre), detune: sound.detune };
}

function release(old: Patch) {
  const { ctx } = getAudio();
  old.amp.gain.cancelScheduledValues(ctx.currentTime);
  old.amp.gain.setTargetAtTime(0, ctx.currentTime, FADE_OUT / 3);
  const end = ctx.currentTime + FADE_OUT + 0.2;
  old.pairs.flat().forEach((oscillator) => oscillator.stop(end));
  old.lfo.stop(end);
  old.lfo.onended = () => old.amp.disconnect();
}

export const drone = {
  /**
   * Suena con estas notas y este sonido. Si ya sonaba con las mismas notas, el filtro, el movimiento y el
   * batido se deslizan sin cortar; si cambian las notas o el timbre, pasa a las nuevas con un fundido.
   */
  play(midis: readonly number[], a4: number, sound: DroneSound) {
    const key = patchKey(midis, a4, sound.timbre);
    if (patch && patch.key === key) {
      const { ctx } = getAudio();
      const now = ctx.currentTime;
      patch.filter.frequency.setTargetAtTime(cutoff(sound.brightness), now, 0.08);
      patch.lfo.frequency.setTargetAtTime(lfoRate(sound.motion), now, 0.2);
      patch.lfoDepth.gain.setTargetAtTime(lfoAmount(sound.brightness, sound.motion), now, 0.2);
      if (sound.detune !== patch.detune) {
        patch.detune = sound.detune;
        for (const pair of patch.pairs) {
          pair.forEach((oscillator, index) =>
            oscillator.detune.setTargetAtTime(((index === 0 ? -1 : 1) * sound.detune) / 2, now, 0.1),
          );
        }
      }
      return;
    }
    if (patch) release(patch);
    patch = build(midis, a4, sound);
  },

  stop() {
    if (patch) release(patch);
    patch = null;
  },

  /** La forma de onda que suena ahora, para dibujarla. Sin drone, no toca `into`. */
  waveform(into: Float32Array<ArrayBuffer>): boolean {
    if (!analyser || !patch) return false;
    analyser.getFloatTimeDomainData(into);
    return true;
  },
};
