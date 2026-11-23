// La figura del ritmo: cada golpe es una esquina y un lápiz naranja pinta el lado que está sonando, desde
// la esquina del último golpe hasta donde va el pulso, que llega a la siguiente justo cuando suena. Como
// polígono, cada golpe va donde cae en el ciclo (cuatro parejos son un cuadrado, el tresillo un triángulo
// torcido); como estrella, los golpes se unen salteando puntas, dentro del polígono parejo. Los silencios
// son muescas sobre los lados, como en una regla. Sin puntos ni cuadrados: la esquina que suena se pinta
// de naranja. En una polirritmia se ven las dos figuras encimadas, la segunda punteada.
import { useEffect, useRef } from 'react';
import { metronome } from '~/audio/metronome';
import { figureVertices, onCircle, starLoops, travelSide, type FigureKind, type Point } from '~/core/figure';
import type { Cycle } from '~/core/rhythm';
import styles from './ritmo.module.css';

const RADIUS = 46;
/** Cuánto se pinta de cada lado de la esquina que suena. */
const CORNER = 8;
/** Media muesca de silencio, a cada lado de la línea. */
const NOTCH = 2.6;

const round = (value: number) => Math.round(value * 100) / 100;
const pointsOf = (list: readonly Point[]) => list.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
const unit = ([x, y]: Point): Point => {
  const length = Math.hypot(x, y) || 1;
  return [x / length, y / length];
};
const toward = (from: Point, to: Point, length: number): Point => {
  const [ux, uy] = unit([to[0] - from[0], to[1] - from[1]]);
  return [from[0] + ux * length, from[1] + uy * length];
};

interface Lane {
  /** Cuándo suena cada golpe, de 0 a 1, en orden. */
  times: number[];
  vertices: Point[];
  hits: Array<{ cell: number }>;
  /** Las casillas que no suenan: la muesca que las marca sobre el lado, de punta a punta. */
  rests: Array<{ cell: number; notch: [Point, Point] }>;
  /** Cuántas casillas tiene el carril. */
  cells: number;
}

function lanesOf(cycle: Cycle, kind: FigureKind): Lane[] {
  return cycle.lanes.map((count, lane) => {
    const hits = cycle.hits.filter((hit) => hit.lane === lane).sort((a, b) => a.at - b.at);
    const times = hits.map((hit) => hit.at);
    const vertices = figureVertices(times, kind, RADIUS);
    const rests = Array.from({ length: count }, (_, cell) => cell)
      .filter((cell) => !hits.some((hit) => hit.cell === cell))
      .flatMap((cell) => {
        const { from, at } = travelSide(times, vertices, cell / count);
        if (from[0] === at[0] && from[1] === at[1]) return [];
        // De través al lado: la dirección del lado girada un cuarto de vuelta.
        const [ux, uy] = unit([at[0] - from[0], at[1] - from[1]]);
        const notch: [Point, Point] = [
          [at[0] + uy * NOTCH, at[1] - ux * NOTCH],
          [at[0] - uy * NOTCH, at[1] + ux * NOTCH],
        ];
        return [{ cell, notch }];
      });
    return { times, vertices, hits: hits.map((hit) => ({ cell: hit.cell })), rests, cells: count };
  });
}

export function Wheel({ cycle, kind }: { cycle: Cycle; kind: FigureKind }) {
  const svg = useRef<SVGSVGElement>(null);
  const lanes = lanesOf(cycle, kind);
  // El cuadro a cuadro lee la figura de este render sin volver a montarse.
  const current = useRef(lanes);
  useEffect(() => {
    current.current = lanes;
  });

  // El lápiz y la esquina que suena se mueven leyendo el reloj cuadro a cuadro, sin renders.
  useEffect(() => {
    let frame = 0;
    let previous = '';
    const draw = () => {
      const root = svg.current;
      if (root) {
        const progress = metronome.progress();
        current.current.forEach((lane, index) => {
          const node = root.querySelector(`[data-traveler="${index}"]`);
          if (!node) return;
          const { from, at } = travelSide(lane.times, lane.vertices, progress ?? 0);
          node.setAttribute('x1', String(round(from[0])));
          node.setAttribute('y1', String(round(from[1])));
          node.setAttribute('x2', String(round(at[0])));
          node.setAttribute('y2', String(round(at[1])));
          node.toggleAttribute('data-running', progress !== null);
        });
        const cells = metronome.playhead()?.cells ?? [];
        const key = cells.join();
        if (key !== previous) {
          previous = key;
          root.querySelectorAll('[data-active]').forEach((node) => node.removeAttribute('data-active'));
          cells.forEach((cell, lane) => {
            if (cell !== null)
              root.querySelector(`[data-cell="${lane}:${cell}"]`)?.setAttribute('data-active', '');
          });
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  const counts = lanes.map((lane) => lane.times.length);

  return (
    <svg
      ref={svg}
      className={styles.wheel}
      viewBox="-60 -60 120 120"
      role="img"
      aria-label={`Figura del ritmo: ${lanes
        .map((lane) => `${lane.times.length} golpes en ${lane.cells}`)
        .join(' y ')}`}
      data-testid="wheel"
      data-figure={kind}
    >
      {lanes.map((lane, index) => {
        const count = lane.times.length;
        if (count < 2) return null;
        const star = kind === 'estrella' && count >= 5;
        if (!star) {
          return (
            <polygon
              key={index}
              className={styles.shape}
              data-lane={index}
              points={pointsOf(lane.vertices)}
            />
          );
        }
        // La estrella va adentro del polígono parejo, como en un dado.
        const corners = Array.from({ length: count }, (_, place) => onCircle(place / count, RADIUS));
        return (
          <g key={index} data-lane={index}>
            <polygon className={styles.outline} data-lane={index} points={pointsOf(corners)} />
            {starLoops(count).map((loop) => (
              <polygon
                key={loop.join()}
                className={styles.star}
                data-lane={index}
                points={pointsOf(loop.map((place) => corners[place]!))}
              />
            ))}
          </g>
        );
      })}
      {lanes.map((lane, index) =>
        lane.rests.map(({ cell, notch: [[x1, y1], [x2, y2]] }) => (
          <line
            key={`${index}:${cell}`}
            className={styles.rest}
            data-cell={`${index}:${cell}`}
            data-lane={index}
            x1={round(x1)}
            y1={round(y1)}
            x2={round(x2)}
            y2={round(y2)}
          />
        )),
      )}
      {/* El lápiz: pinta el lado que suena, desde la última esquina hasta el pulso. */}
      {lanes.map((_, index) => (
        <line key={index} className={styles.traveler} data-traveler={index} />
      ))}
      {/* La esquina que suena, apagada hasta que le toca: un trozo de cada lado que llega a ella. */}
      {lanes.map((lane, index) =>
        lane.vertices.length < 2
          ? null
          : lane.hits.map(({ cell }, order) => {
              const { vertices } = lane;
              const vertex = vertices[order]!;
              const before = vertices[(order - 1 + vertices.length) % vertices.length]!;
              const after = vertices[(order + 1) % vertices.length]!;
              return (
                <polyline
                  key={`${index}:${cell}`}
                  className={styles.corner}
                  data-cell={`${index}:${cell}`}
                  data-lane={index}
                  points={pointsOf([toward(vertex, before, CORNER), vertex, toward(vertex, after, CORNER)])}
                />
              );
            }),
      )}
      <text className={styles.count} textAnchor="middle" dominantBaseline="central">
        {counts.join(':')}
      </text>
    </svg>
  );
}
