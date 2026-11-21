// Muestras de guitarra acústica: University of Iowa Electronic Music Studios (Musical Instrument
// Samples), vía tonejs-instruments. Una por semitono, de D2 a D5, recortadas a 4,5 s.

const LOWEST = 38;
const HIGHEST = 74;

/**
 * Cuánto se apartan de la nota, en cents, medido con el detector del afinador. Se corrige al
 * tocarlas para que el tono de referencia sea confiable.
 */
const CENTS: Record<number, number> = {
  38: -2.8,
  39: -2.8,
  40: -2.4,
  41: -2.8,
  42: -3.2,
  43: -3.9,
  44: -3.6,
  45: -0.6,
  46: -1.8,
  47: -2.2,
  48: -2.7,
  49: -2.0,
  50: -1.3,
  51: -2.2,
  52: -2.3,
  53: -2.1,
  54: -1.7,
  55: -2.3,
  56: -0.7,
  57: -0.8,
  58: -0.9,
  59: -1.0,
  60: -0.4,
  61: -1.0,
  62: -1.2,
  63: -0.9,
  64: 0.9,
  65: -0.6,
  66: -0.3,
  67: -0.4,
  68: -0.5,
  69: -0.5,
  70: -0.6,
  71: -0.4,
  72: -0.9,
  73: -0.8,
  74: -1.0,
};

export const ALL_SAMPLES = Array.from({ length: HIGHEST - LOWEST + 1 }, (_, index) => LOWEST + index);

/** Las grabaciones suenan más fuerte que la síntesis: así quedan parejas. */
export const SAMPLE_GAIN = 0.5;

/** La muestra más cercana: fuera del rango se estira la del borde. */
export function nearestSample(midi: number): number {
  return Math.min(HIGHEST, Math.max(LOWEST, Math.round(midi)));
}

export function sampleUrl(sample: number): string {
  return `/sonidos/guitarra/${sample}.mp3`;
}

/** Velocidad de reproducción para que la muestra dé esta nota con este La. */
export function samplePlaybackRate(midi: number, sample: number, a4: number): number {
  const cents = (midi - sample) * 100 - (CENTS[sample] ?? 0);
  return (a4 / 440) * Math.pow(2, cents / 1200);
}
