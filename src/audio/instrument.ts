// Guitarra: una voz por cuerda. Suena una acústica grabada, nota por nota; mientras una muestra
// no llegó, o si no se puede bajar, toca la cuerda sintetizada.
import { midiToHz } from '~/core/notes';
import { pluck } from '~/core/pluck';
import { getAudio } from './engine';
import { ALL_SAMPLES, nearestSample, SAMPLE_GAIN, samplePlaybackRate, sampleUrl } from './samples';

const STRINGS = 6;
const SECONDS = 4.5;
/** Tiempo que el afinador ignora el micrófono después de una nota de la app. */
const SPEAKER_BLEED_SECONDS = 1.3;

const buffers = new Map<string, AudioBuffer>();
const voices: Array<{ source: AudioBufferSourceNode; gain: GainNode } | null> = new Array(STRINGS).fill(null);
const sounding = new Set<AudioBufferSourceNode>();
let busyUntil = 0;

function bufferFor(ctx: AudioContext, midi: number, a4: number): AudioBuffer {
  const key = `${midi}:${a4}:${ctx.sampleRate}`;
  let buffer = buffers.get(key);
  if (!buffer) {
    const samples = pluck(midiToHz(midi, a4), ctx.sampleRate, SECONDS);
    buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
    buffers.set(key, buffer);
  }
  return buffer;
}

const samples = new Map<number, AudioBuffer | 'loading' | 'failed'>();
let decoder: OfflineAudioContext | null = null;
let allRequested = false;

/** Para comparar: con `?guitarra=sintetica` en la dirección suena solo la síntesis. */
function samplesOn(): boolean {
  return new URLSearchParams(window.location.search).get('guitarra') !== 'sintetica';
}

// Se decodifica en un contexto aparte, que no espera un gesto: así la muestra ya está lista para el
// primer toque. Un AudioBuffer sirve en cualquier contexto.
function loadSample(sample: number): void {
  if (samples.has(sample)) return;
  samples.set(sample, 'loading');
  decoder ??= new OfflineAudioContext(1, 1, 44100);
  const context = decoder;
  fetch(sampleUrl(sample))
    .then((response) => {
      if (!response.ok) throw new Error(`No se pudo bajar ${sampleUrl(sample)}`);
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => samples.set(sample, buffer))
    .catch(() => samples.set(sample, 'failed'));
}

/** Baja de antemano las muestras de estas notas, para que la primera vez ya suene la grabada. */
export function preloadGuitar(midis: Iterable<number>): void {
  if (typeof window === 'undefined' || !samplesOn()) return;
  for (const midi of midis) loadSample(nearestSample(midi));
}

interface Voice {
  buffer: AudioBuffer;
  rate: number;
  gain: number;
  sampled: boolean;
}

function voiceFor(ctx: AudioContext, midi: number, a4: number): Voice {
  if (samplesOn()) {
    // Con el primer sonido se baja el resto en segundo plano.
    if (!allRequested) {
      allRequested = true;
      preloadGuitar(ALL_SAMPLES);
    }
    const sample = nearestSample(midi);
    const buffer = samples.get(sample);
    if (buffer instanceof AudioBuffer) {
      return { buffer, rate: samplePlaybackRate(midi, sample, a4), gain: SAMPLE_GAIN, sampled: true };
    }
  }
  return { buffer: bufferFor(ctx, midi, a4), rate: 1, gain: 1, sampled: false };
}

/** Prepara estas notas de antemano: hacerlo mientras suena un tema puede atrasar el reloj. */
export function prepareInstrument(midis: Iterable<number>, a4: number): void {
  const { ctx } = getAudio();
  const list = [...midis];
  for (const midi of list) bufferFor(ctx, midi, a4);
  preloadGuitar(list);
}

export interface PluckOptions {
  a4: number;
  when?: number;
  velocity?: number;
}

/** Toca una cuerda y devuelve el momento exacto en que va a sonar. */
export function pluckString(
  stringIndex: number,
  midi: number,
  { a4, when, velocity = 1 }: PluckOptions,
): number {
  const { ctx, bus, sampleBus } = getAudio();
  const start = Math.max(when ?? ctx.currentTime, ctx.currentTime);

  const previous = voices[stringIndex];
  if (previous) {
    previous.gain.gain.setTargetAtTime(0, start, 0.012);
    try {
      previous.source.stop(start + 0.1);
    } catch {
      // Ya estaba detenida.
    }
  }

  const voice = voiceFor(ctx, midi, a4);
  const source = ctx.createBufferSource();
  source.buffer = voice.buffer;
  source.playbackRate.value = voice.rate;
  const gain = ctx.createGain();
  gain.gain.value = 0.62 * velocity * voice.gain;
  const panner = ctx.createStereoPanner();
  panner.pan.value = (stringIndex - 2.5) * 0.09;
  source
    .connect(gain)
    .connect(panner)
    .connect(voice.sampled ? sampleBus : bus);
  source.start(start);
  sounding.add(source);
  source.onended = () => sounding.delete(source);
  voices[stringIndex] = { source, gain };
  busyUntil = Math.max(busyUntil, start + SPEAKER_BLEED_SECONDS);
  return start;
}

/** Mientras la app suena fuerte, el micrófono la escucharía a ella en vez de a la guitarra. */
export function isInstrumentSounding(): boolean {
  return getAudio().ctx.currentTime < busyUntil;
}

/** Corta todo lo que esté sonando o programado. */
export function stopInstrument(): void {
  sounding.forEach((source) => {
    try {
      source.stop();
    } catch {
      // Ya estaba detenida.
    }
  });
  sounding.clear();
  voices.fill(null);
  busyUntil = 0;
}

/** Un acorde rasgueado: una nota por cuerda, apenas separadas. */
export function strum(midis: number[], a4: number, when?: number, spread = 0.025): void {
  const start = when ?? getAudio().ctx.currentTime;
  midis.forEach((midi, index) =>
    pluckString(index % STRINGS, midi, { a4, when: start + index * spread, velocity: 0.85 }),
  );
}

export interface TimedNote {
  midi: number;
  /** En corcheas. */
  start: number;
}

/** Programa una melodía. Devuelve cuántos segundos dura. */
export function playMelody(notes: TimedNote[], bpm: number, a4: number): number {
  const { ctx } = getAudio();
  const eighth = 60 / bpm / 2;
  const origin = ctx.currentTime + 0.05;
  notes.forEach((note, index) =>
    pluckString(index % STRINGS, note.midi, { a4, when: origin + note.start * eighth }),
  );
  const last = notes[notes.length - 1];
  return last ? last.start * eighth + 1 : 0;
}
