// Un solo AudioContext para toda la app, con una mezcla: el instrumento pasa por el general. Se crea con el primer gesto de la persona, nunca durante el render
// ni al generar las páginas estáticas.

export type Channel = 'master' | 'instrumento';

const volumes: Record<Channel, number> = { master: 0.85, instrumento: 0.8 };

let context: AudioContext | null = null;
let channels: Record<Channel, GainNode> | null = null;
let instrumentInput: GainNode | null = null;

/** El oído percibe el volumen de forma logarítmica: el cuadrado da un fader más parejo. */
const toGain = (value: number) => value * value;

export function getAudio(): { ctx: AudioContext; bus: GainNode } {
  if (!context || !channels || !instrumentInput) {
    context = new AudioContext({ latencyHint: 'interactive' });
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.ratio.value = 8;
    limiter.connect(context.destination);

    const make = (channel: Channel, into: AudioNode) => {
      const gain = context!.createGain();
      gain.gain.value = toGain(volumes[channel]);
      gain.connect(into);
      return gain;
    };
    const master = make('master', limiter);
    channels = {
      master,
      instrumento: make('instrumento', master),
    };

    // El cuerpo y el brillo le dan carácter al instrumento, sin tocar los otros canales.
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
    instrumentInput.connect(body).connect(air).connect(channels.instrumento);
  }
  if (context.state === 'suspended') void context.resume();
  return { ctx: context, bus: instrumentInput };
}

/** Se puede llamar antes de que exista el audio: el valor se aplica al crearlo. */
export function setVolume(channel: Channel, value: number): void {
  volumes[channel] = Math.min(1, Math.max(0, value));
  if (context && channels) {
    channels[channel].gain.setTargetAtTime(toGain(volumes[channel]), context.currentTime, 0.02);
  }
}
