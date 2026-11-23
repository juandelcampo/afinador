// La batería que suena: grabada (acústica o 808) o la sintetizada de drums.ts. Las grabadas se bajan
// recién cuando se eligen, y mientras tanto suena la sintética: nunca hay un golpe mudo.
//
// Acústica: "Recorded drums (CC0)" de Nullframe/daw-content, armado con Big Rusty Drums y Swirly Drums
// (Karoryfer Samples) y VCSL (Versilian Studios), todos CC0. 808: la Roland TR-808 grabada por Michael
// Fischer (1994), en tidalcycles/sounds-tr808-fischer, CC0. Recortadas a mono en public/sonidos/bateria/.
import { DEFAULT_KIT, type DrumId, type DrumKit } from '~/core/rhythm';
import { playDrum } from './drums';

type SampledKit = Exclude<DrumKit, 'sintetica'>;

interface Sound {
  /** Las tomas del golpe normal: se van alternando para que no suene siempre igual. */
  soft: string[];
  /** Las tomas del golpe con acento, si la batería las tiene. Si no, el acento es solo más volumen. */
  strong?: string[];
  /** Cuánto suena, para que los sonidos queden parejos entre sí. */
  gain: number;
}

const takes = (name: string, count: number) => Array.from({ length: count }, (_, i) => `${name}-${i + 1}`);
const strongTakes = (name: string, count: number) =>
  Array.from({ length: count }, (_, i) => `${name}-f${i + 1}`);

const KITS: Record<SampledKit, Record<DrumId, Sound>> = {
  acustica: {
    bombo: { soft: takes('bombo', 2), strong: strongTakes('bombo', 2), gain: 1 },
    caja: { soft: takes('caja', 2), strong: strongTakes('caja', 2), gain: 0.8 },
    aro: { soft: takes('aro', 3), gain: 0.6 },
    hihat: { soft: takes('hihat', 2), strong: strongTakes('hihat', 2), gain: 0.42 },
    abierto: { soft: takes('abierto', 2), gain: 0.36 },
    palma: { soft: takes('palma', 3), gain: 0.62 },
    tom: { soft: takes('tom', 2), gain: 0.72 },
    percu: { soft: takes('percu', 2), gain: 0.45 },
  },
  808: {
    bombo: { soft: takes('bombo', 1), gain: 0.85 },
    caja: { soft: takes('caja', 1), gain: 0.85 },
    aro: { soft: takes('aro', 1), gain: 0.65 },
    hihat: { soft: takes('hihat', 1), gain: 0.42 },
    abierto: { soft: takes('abierto', 1), gain: 0.3 },
    palma: { soft: takes('palma', 1), gain: 0.62 },
    tom: { soft: takes('tom', 1), gain: 0.7 },
    percu: { soft: takes('percu', 1), gain: 0.4 },
  },
};

/** Cuánto más fuerte suena un golpe con acento que uno normal. */
const ACCENT = 1.3;

const fileUrl = (kit: SampledKit, name: string) => `/sonidos/bateria/${kit}/${name}.mp3`;

export function kitFiles(kit: SampledKit): string[] {
  return Object.values(KITS[kit]).flatMap((sound) =>
    [...sound.soft, ...(sound.strong ?? [])].map((name) => fileUrl(kit, name)),
  );
}

const buffers = new Map<string, AudioBuffer | 'loading' | 'failed'>();
let decoder: OfflineAudioContext | null = null;
let current: DrumKit = DEFAULT_KIT;

// Como la guitarra: se decodifica en un contexto aparte, que no espera un gesto.
function load(url: string): void {
  if (buffers.has(url)) return;
  buffers.set(url, 'loading');
  decoder ??= new OfflineAudioContext(1, 1, 44100);
  const context = decoder;
  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`No se pudo bajar ${url}`);
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => buffers.set(url, buffer))
    .catch(() => buffers.set(url, 'failed'));
}

/** Elige la batería que suena desde ahora y empieza a bajarla, si es grabada. */
export function setKit(kit: DrumKit = DEFAULT_KIT): void {
  current = kit;
  if (typeof window === 'undefined' || kit === 'sintetica') return;
  kitFiles(kit).forEach(load);
}

export function kitReady(kit: DrumKit): boolean {
  return kit === 'sintetica' || kitFiles(kit).every((url) => buffers.get(url) instanceof AudioBuffer);
}

// Lo último que sonó de cada toma, para no repetir la misma dos veces seguidas.
const lastTake = new Map<string, number>();

function pickTake(key: string, count: number): number {
  if (count === 1) return 0;
  const previous = lastTake.get(key) ?? -1;
  let take = Math.floor(Math.random() * (count - 1));
  if (take >= previous) take += 1;
  lastTake.set(key, take);
  return take;
}

/** El hi-hat abierto que todavía suena: el cerrado lo corta, como el pie en la batería de verdad. */
let ringing: { gain: GainNode; time: number } | null = null;

function choke(ctx: BaseAudioContext, time: number) {
  if (!ringing || ringing.time > time) return;
  ringing.gain.gain.setTargetAtTime(0, time, 0.012);
  ringing = null;
}

/**
 * Un golpe de la batería elegida. `velocity` es el volumen de la fila y `strong`, si la casilla tiene
 * acento. La acústica se toca un poco a mano: cada golpe cambia apenas de volumen, de afinación y de
 * lugar. La 808 y la sintética son máquinas y suenan siempre igual.
 */
export function playKitDrum(
  ctx: BaseAudioContext,
  out: AudioNode,
  id: DrumId,
  time: number,
  velocity = 1,
  strong = false,
): void {
  const kit = current;
  const human = kit === 'acustica';
  const at = human ? Math.max(ctx.currentTime, time + (Math.random() - 0.5) * 0.008) : time;
  const level = velocity * (strong ? ACCENT : 1) * (human ? 0.93 + Math.random() * 0.14 : 1);

  if (id === 'hihat' || id === 'abierto') choke(ctx, at);
  const voice = ctx.createGain();
  voice.connect(out);
  if (id === 'abierto') ringing = { gain: voice, time: at };

  const sound = kit === 'sintetica' ? undefined : KITS[kit][id];
  const names = sound && (strong && sound.strong ? sound.strong : sound.soft);
  const take = names ? pickTake(`${kit}/${id}/${strong}`, names.length) : 0;
  const buffer = sound && names ? buffers.get(fileUrl(kit as SampledKit, names[take]!)) : undefined;
  if (!sound || !(buffer instanceof AudioBuffer)) {
    playDrum(ctx, voice, id, at, level);
    return;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  if (human) source.playbackRate.value = 0.985 + Math.random() * 0.03;
  voice.gain.value = level * sound.gain;
  source.connect(voice);
  source.start(at);
}
