// Las figuras del ritmo: cada golpe es un vértice y el pulso viaja por los lados. Como polígono, cada golpe
// va donde cae en el ciclo; como estrella, los golpes se unen salteando puntos de una figura pareja.

export type Point = readonly [number, number];
export type FigureKind = 'poligono' | 'estrella';

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** El punto de un círculo para un lugar del ciclo, de 0 a 1: el 0 arriba y en el sentido del reloj. */
export function onCircle(at: number, radius: number): Point {
  const angle = at * 2 * Math.PI - Math.PI / 2;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

/**
 * De a cuántos puntos se saltea para dibujar la estrella de `count` puntas: el salto más largo que pasa por
 * todos los puntos de un trazo (5 → 2, el pentagrama; 7 → 3; 8 → 3). Si no hay ninguno, el más largo
 * posible, que da dos figuras encimadas (6 → 2, el hexagrama de dos triángulos). Con 4 o menos no hay
 * estrella: devuelve 1, el polígono.
 */
export function starStep(count: number): number {
  const longest = Math.floor((count - 1) / 2);
  for (let step = longest; step >= 2; step--) if (gcd(count, step) === 1) return step;
  return longest >= 2 ? longest : 1;
}

/**
 * En qué punta de la estrella cae cada golpe, en orden: así, ir de un golpe al siguiente dibuja la
 * estrella. Si son dos figuras encimadas, se recorre una entera y se pasa a la otra por la punta vecina,
 * sobre el borde: el pulso nunca se sale de la figura.
 */
export function starOrder(count: number, step: number): number[] {
  const loops = gcd(count, step);
  const length = count / loops;
  const order: number[] = [];
  let place = 0;
  for (let loop = 0; loop < loops; loop++) {
    for (let index = 0; index < length; index++) {
      order.push(place);
      if (index < length - 1) place = (place + step) % count;
    }
    place = (place - 1 + count) % count;
  }
  return order;
}

/** Los tramos de cada figura de la estrella: una sola, o dos si son encimadas (el hexagrama). */
export function starLoops(count: number): number[][] {
  const step = starStep(count);
  const loops = gcd(count, step);
  const order = starOrder(count, step);
  const length = count / loops;
  return Array.from({ length: loops }, (_, loop) => order.slice(loop * length, (loop + 1) * length));
}

/** Los vértices de la figura, uno por golpe, en el orden en que suenan. */
export function figureVertices(times: readonly number[], kind: FigureKind, radius: number): Point[] {
  if (kind === 'poligono' || times.length < 5) return times.map((at) => onCircle(at, radius));
  const order = starOrder(times.length, starStep(times.length));
  return order.map((place) => onCircle(place / times.length, radius));
}

/**
 * Dónde está el pulso a una altura del ciclo (de 0 a 1): sobre el lado que va del último golpe que sonó al
 * que sigue, tan avanzado como el tiempo entre los dos. Llega a cada vértice justo cuando suena.
 */
export function travel(times: readonly number[], vertices: readonly Point[], progress: number): Point {
  return travelSide(times, vertices, progress).at;
}

/**
 * El lado que se está recorriendo: desde qué vértice salió el pulso (`from`, el último golpe que sonó) y
 * dónde va (`at`). Con eso se dibuja el lápiz, que pinta el lado desde la esquina hasta el pulso.
 */
export function travelSide(
  times: readonly number[],
  vertices: readonly Point[],
  progress: number,
): { from: Point; at: Point } {
  const count = times.length;
  if (count === 0) return { from: [0, 0], at: [0, 0] };
  if (count === 1) return { from: vertices[0]!, at: vertices[0]! };
  // Antes del primer golpe todavía se está yendo desde el último del ciclo anterior.
  let from = count - 1;
  for (let index = 0; index < count; index++) if (times[index]! <= progress) from = index;
  const to = (from + 1) % count;
  const before = times[from]! > progress;
  const start = before ? times[from]! - 1 : times[from]!;
  const end = to === 0 && !before ? times[0]! + 1 : times[to]!;
  const fraction = end > start ? (progress - start) / (end - start) : 0;
  const [x1, y1] = vertices[from]!;
  const [x2, y2] = vertices[to]!;
  return { from: vertices[from]!, at: [x1 + (x2 - x1) * fraction, y1 + (y2 - y1) * fraction] };
}
