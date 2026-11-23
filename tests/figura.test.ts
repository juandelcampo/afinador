import { describe, expect, it } from 'vitest';
import { figureVertices, onCircle, starLoops, starOrder, starStep, travel, travelSide } from '~/core/figure';

const close = (point: readonly [number, number], expected: readonly [number, number]) => {
  expect(point[0]).toBeCloseTo(expected[0], 6);
  expect(point[1]).toBeCloseTo(expected[1], 6);
};

describe('figuras del ritmo', () => {
  it('la estrella saltea lo más que puede sin cortarse, y con 4 o menos queda el polígono', () => {
    expect(starStep(5)).toBe(2);
    expect(starStep(7)).toBe(3);
    expect(starStep(8)).toBe(3);
    expect(starStep(10)).toBe(3);
    expect(starStep(6)).toBe(2);
    expect(starStep(4)).toBe(1);
    expect(starStep(3)).toBe(1);
  });

  it('el pentagrama va de a dos puntas y el hexagrama recorre un triángulo y después el otro', () => {
    expect(starOrder(5, 2)).toEqual([0, 2, 4, 1, 3]);
    // Del 4 pasa al 3 y del 1 vuelve al 0: los dos pasos van por el borde del hexágono, no por el medio.
    expect(starOrder(6, 2)).toEqual([0, 2, 4, 3, 5, 1]);
    expect(starLoops(6)).toEqual([
      [0, 2, 4],
      [3, 5, 1],
    ]);
    expect(starLoops(7)).toEqual([[0, 3, 6, 2, 5, 1, 4]]);
  });

  it('como polígono cada golpe va donde cae en el ciclo; como estrella, en su punta', () => {
    const times = [0, 0.2, 0.4, 0.6, 0.8];
    close(figureVertices(times, 'poligono', 10)[1]!, onCircle(0.2, 10));
    close(figureVertices(times, 'estrella', 10)[1]!, onCircle(0.4, 10));
    // Con menos de cinco golpes la estrella no existe: se dibuja el polígono.
    const square = [0, 0.25, 0.5, 0.75];
    expect(figureVertices(square, 'estrella', 10)).toEqual(figureVertices(square, 'poligono', 10));
  });

  it('el pulso llega a cada vértice cuando suena y entre dos golpes va por el lado', () => {
    const times = [0, 0.25, 0.5, 0.75];
    const vertices = figureVertices(times, 'poligono', 10);
    close(travel(times, vertices, 0.25), vertices[1]!);
    const [a, b] = [vertices[0]!, vertices[1]!];
    close(travel(times, vertices, 0.125), [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    // Del último golpe vuelve al primero.
    const [c, d] = [vertices[3]!, vertices[0]!];
    close(travel(times, vertices, 0.875), [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2]);
  });

  it('si el primer golpe no cae al empezar el ciclo, antes de él se viene desde el último', () => {
    const times = [0.25, 0.75];
    const vertices = figureVertices(times, 'poligono', 10);
    // A 0 falta medio camino entre el golpe de 0,75 y el de 1,25.
    close(travel(times, vertices, 0), [
      (vertices[1]![0] + vertices[0]![0]) / 2,
      (vertices[1]![1] + vertices[0]![1]) / 2,
    ]);
  });

  it('el lápiz sale de la esquina del último golpe que sonó, también antes del primero', () => {
    const times = [0.25, 0.75];
    const vertices = figureVertices(times, 'poligono', 10);
    expect(travelSide(times, vertices, 0.5).from).toEqual(vertices[0]);
    // Antes del primer golpe todavía se viene desde el último del ciclo anterior.
    expect(travelSide(times, vertices, 0.1).from).toEqual(vertices[1]);
  });
});
