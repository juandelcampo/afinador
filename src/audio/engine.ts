// Un solo AudioContext para toda la app, con tres volúmenes: la guitarra, el ritmo (batería y metrónomo) y
// el drone. Los tres van a la misma salida, con un limitador al final.
// Se crea con el primer gesto de la persona, nunca durante el render ni al generar las páginas estáticas.

export const CANALES = ['guitarra', 'ritmo', 'drone'] as const;
export type Canal = (typeof CANALES)[number];

/** De entrada el ritmo va más bajo: las tomas de batería pican unos 10 dB más fuerte que la guitarra. */
export const DEFAULT_MEZCLA: Record<Canal, number> = { guitarra: 0.8, ritmo: 0.5, drone: 0.8 };

const mezcla: Record<Canal, number> = { ...DEFAULT_MEZCLA };

let context: AudioContext | null = null;
let channels: Record<Canal, GainNode> | null = null;
let instrumentInput: GainNode | null = null;
let sampleInput: GainNode | null = null;

/** El oído percibe el volumen de forma logarítmica: el cuadrado da un fader más parejo. */
const toGain = (value: number) => value * value;

export function getAudio(): { ctx: AudioContext; bus: GainNode; sampleBus: GainNode } {
  if (!context || !channels || !instrumentInput || !sampleInput) {
    context = new AudioContext({ latencyHint: 'interactive' });
    const ctx = context;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.ratio.value = 8;
    limiter.connect(ctx.destination);

    const channel = (canal: Canal) => {
      const gain = ctx.createGain();
      gain.gain.value = toGain(mezcla[canal]);
      gain.connect(limiter);
      return gain;
    };
    channels = { guitarra: channel('guitarra'), ritmo: channel('ritmo'), drone: channel('drone') };
    const output = channels.guitarra;

    // El cuerpo y el brillo le dan carácter al instrumento.
    const body = context.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 180;
    body.Q.value = 0.9;
    body.gain.value = 5;
    const air = context.createBiquadFilter();
    air.type = 'highshelf';
    air.frequency.value = 3200;
    air.gain.value = -5;
    instrumentInput = context.createGain();
    instrumentInput.connect(body).connect(air).connect(output);

    // La guitarra grabada ya tiene cuerpo: solo se le saca un poco de barro y se le suma brillo.
    const mud = context.createBiquadFilter();
    mud.type = 'peaking';
    mud.frequency.value = 250;
    mud.Q.value = 1;
    mud.gain.value = -2;
    const shine = context.createBiquadFilter();
    shine.type = 'highshelf';
    shine.frequency.value = 2800;
    shine.gain.value = 5;
    sampleInput = context.createGain();
    sampleInput.connect(mud).connect(shine).connect(output);

    // La batería, el metrónomo y el drone van derecho a su canal: los filtros de guitarra los empastarían.
  }
  if (context.state === 'suspended') void context.resume();
  return { ctx: context, bus: instrumentInput, sampleBus: sampleInput };
}

/** La entrada del ritmo: metrónomo y batería. */
export function rhythmBus(): GainNode {
  getAudio();
  return channels!.ritmo;
}

/** La entrada del drone. */
export function droneBus(): GainNode {
  getAudio();
  return channels!.drone;
}

/** Se puede llamar antes de que exista el audio: el valor se aplica al crearlo. */
export function setVolume(canal: Canal, value: number): void {
  mezcla[canal] = Math.min(1, Math.max(0, value));
  if (context && channels)
    channels[canal].gain.setTargetAtTime(toGain(mezcla[canal]), context.currentTime, 0.02);
}
