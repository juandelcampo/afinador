// La rueda: el ciclo dibujado como un reloj. Cada golpe es un vértice, y los golpes de una línea
// forman una figura: tres en ocho es un triángulo torcido, cuatro en ocho un cuadrado. En una
// polirritmia se ven las dos figuras encimadas, y solo se tocan arriba, donde empieza el ciclo.
import { useEffect, useRef } from 'react';
import { metronome } from '~/audio/metronome';
import { cycleFor, type Cycle, type RhythmConfig } from '~/core/rhythm';
import styles from './ritmo.module.css';

const RADIUS = 46;

/** El punto del círculo que corresponde a un lugar del ciclo: el 0 arriba, y gira como el reloj. */
function point(at: number, radius = RADIUS): [number, number] {
  const angle = at * 2 * Math.PI - Math.PI / 2;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

const round = (value: number) => Math.round(value * 100) / 100;

/** Las casillas de cada línea, con dónde caen y si suenan. */
function lanesOf(cycle: Cycle) {
  return cycle.lanes.map((count, lane) =>
    Array.from({ length: count }, (_, cell) => {
      const hit = cycle.hits.find((item) => item.lane === lane && item.cell === cell);
      return { cell, at: hit?.at ?? cell / count, hit };
    }),
  );
}

export function Wheel({ config }: { config: RhythmConfig }) {
  const svg = useRef<SVGSVGElement>(null);
  const cycle = cycleFor(config, 0);
  const lanes = lanesOf(cycle);

  // La aguja y el golpe que suena se mueven leyendo el reloj cuadro a cuadro, sin renders.
  useEffect(() => {
    let frame = 0;
    let previous = '';
    const draw = () => {
      const root = svg.current;
      if (root) {
        const progress = metronome.progress();
        const hand = root.querySelector('[data-hand]');
        hand?.setAttribute('transform', `rotate(${round((progress ?? 0) * 360)})`);
        hand?.toggleAttribute('data-running', progress !== null);
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

  return (
    <svg
      ref={svg}
      className={styles.wheel}
      viewBox="-60 -60 120 120"
      role="img"
      aria-label={`Rueda del ritmo: ${lanes
        .map((cells) => `${cells.filter((item) => item.hit).length} golpes en ${cells.length}`)
        .join(' y ')}`}
      data-testid="wheel"
    >
      <circle className={styles.ring} r={RADIUS} />
      {lanes.map((cells, lane) => {
        const vertices = cells.filter((item) => item.hit).map((item) => point(item.at));
        if (vertices.length < 2) return null;
        return (
          <polygon
            key={lane}
            className={styles.shape}
            data-lane={lane}
            points={vertices.map(([x, y]) => `${round(x)},${round(y)}`).join(' ')}
          />
        );
      })}
      <g data-hand className={styles.hand}>
        <line x1={0} y1={0} x2={0} y2={-RADIUS - 6} />
      </g>
      {lanes.map((cells, lane) =>
        cells.map(({ cell, at, hit }) => {
          const [x, y] = point(at);
          const key = `${lane}:${cell}`;
          const props = {
            'data-cell': `${lane}:${cell}`,
            'data-level': hit ? hit.level : 'rest',
            'data-lane': lane,
            className: styles.vertex,
          };
          // La segunda línea de una polirritmia va con cuadrados, para distinguirla sin otro color.
          if (lane === 1) {
            const size = hit?.level === 2 ? 9 : 7;
            return (
              <rect
                key={key}
                {...props}
                x={round(x - size / 2)}
                y={round(y - size / 2)}
                width={size}
                height={size}
              />
            );
          }
          const size = !hit ? 2.4 : hit.level === 2 ? 5.5 : 4;
          return <circle key={key} {...props} cx={round(x)} cy={round(y)} r={size} />;
        }),
      )}
      <circle className={styles.hub} r={3} />
    </svg>
  );
}
