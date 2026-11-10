// Un solo AudioContext para toda la app, con un solo volumen: todo lo que suena es el instrumento.
// Se crea con el primer gesto de la persona, nunca durante el render ni al generar las páginas estáticas.

let volume = 0.68;

let context: AudioContext | null = null;
let output: GainNode | null = null;
let instrumentInput: GainNode | null = null;

/** El oído percibe el volumen de forma logarítmica: el cuadrado da un fader más parejo. */
const toGain = (value: number) => value * value;

export function getAudio(): { ctx: AudioContext; bus: GainNode } {
  if (!context || !output || !instrumentInput) {
    context = new AudioContext({ latencyHint: 'interactive' });
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.ratio.value = 8;
    limiter.connect(context.destination);

    output = context.createGain();
    output.gain.value = toGain(volume);
    output.connect(limiter);

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
  }
  if (context.state === 'suspended') void context.resume();
  return { ctx: context, bus: instrumentInput };
}

/** Se puede llamar antes de que exista el audio: el valor se aplica al crearlo. */
export function setVolume(value: number): void {
  volume = Math.min(1, Math.max(0, value));
  if (context && output) output.gain.setTargetAtTime(toGain(volume), context.currentTime, 0.02);
}
