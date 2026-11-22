// La figura del ritmo: cada golpe es un vértice y el pulso viaja por los lados, llegando a cada vértice
// cuando suena. Como polígono, cada golpe va donde cae en el ciclo (cuatro parejos son un cuadrado, el
// tresillo un triángulo torcido); como estrella, los golpes se unen salteando puntas, dentro del polígono
// parejo. Los silencios quedan marcados sobre los lados: el pulso pasa por ellos a su tiempo. En una
// polirritmia se ven las dos figuras encimadas, la segunda con cuadrados.
import { useEffect, useRef } from 'react';
import { metronome } from '~/audio/metronome';
import { figureVertices, onCircle, starLoops, travel, type FigureKind, type Point } from '~/core/figure';
import type { Cycle } from '~/core/rhythm';
import styles from './ritmo.module.css';

const RADIUS = 46;

const round = (value: number) => Math.round(value * 100) / 100;
const pointsOf = (list: readonly Point[]) => list.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');

interface Lane {
  /** Cuándo suena cada golpe, de 0 a 1, en orden. */
  times: number[];
  vertices: Point[];
  hits: Array<{ cell: number; level: number }>;
  /** Las casillas que no suenan, con dónde caen sobre la figura. */
  rests: Array<{ cell: number; at: Point }>;
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
      .map((cell) => ({ cell, at: travel(times, vertices, cell / count) }));
    return {
      times,
      vertices,
      hits: hits.map((hit) => ({ cell: hit.cell, level: hit.level })),
      rests,
      cells: count,
    };
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

  // El pulso y el golpe que suena se mueven leyendo el reloj cuadro a cuadro, sin renders.
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
          const [x, y] = travel(lane.times, lane.vertices, progress ?? 0);
          node.setAttribute('transform', `translate(${round(x)} ${round(y)})`);
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
      <text className={styles.count} textAnchor="middle" dominantBaseline="central">
        {counts.join(':')}
      </text>
      {lanes.map((lane, index) =>
        lane.rests.map(({ cell, at: [x, y] }) => (
          <circle
            key={`${index}:${cell}`}
            className={styles.vertex}
            data-cell={`${index}:${cell}`}
            data-level="rest"
            data-lane={index}
            cx={round(x)}
            cy={round(y)}
            r={1.1}
          />
        )),
      )}
      {lanes.map((lane, index) =>
        lane.hits.map(({ cell, level }, order) => {
          const [x, y] = lane.vertices[order]!;
          const props = {
            'data-cell': `${index}:${cell}`,
            'data-level': level,
            'data-lane': index,
            className: styles.vertex,
          };
          // La segunda línea de una polirritmia va con cuadrados, para distinguirla sin otro color.
          if (index === 1) {
            const size = level === 2 ? 6 : level === 1 ? 5 : 4;
            return (
              <rect
                key={`${index}:${cell}`}
                {...props}
                x={round(x - size / 2)}
                y={round(y - size / 2)}
                width={size}
                height={size}
              />
            );
          }
          // Tres tamaños: el primer golpe del ciclo, el que abre cada grupo (2+2+3) y el resto.
          const size = level === 2 ? 3.6 : level === 1 ? 3 : 2.3;
          return <circle key={`${index}:${cell}`} {...props} cx={round(x)} cy={round(y)} r={size} />;
        }),
      )}
      {/* El pulso: viaja por los lados y llega a cada vértice cuando suena. */}
      {lanes.map((lane, index) =>
        index === 1 ? (
          <rect
            key={index}
            className={styles.traveler}
            data-traveler={index}
            x={-2.6}
            y={-2.6}
            width={5.2}
            height={5.2}
          />
        ) : (
          <circle key={index} className={styles.traveler} data-traveler={index} r={2.6} />
        ),
      )}
    </svg>
  );
}
