// El ritmo en casillas, como en la caja de ritmos: una fila por carril, llena donde suena. Es la misma
// figura de la rueda, estirada en una línea; la casilla que suena se enciende cuadro a cuadro.
import { useEffect, useRef } from 'react';
import { metronome } from '~/audio/metronome';
import type { Cycle } from '~/core/rhythm';
import styles from './ritmo.module.css';

export function Strip({ cycle }: { cycle: Cycle }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let previous = '';
    const draw = () => {
      const root = box.current;
      const cells = metronome.playhead()?.cells ?? [];
      const key = cells.join();
      if (root && key !== previous) {
        previous = key;
        root.querySelectorAll('[data-now]').forEach((node) => node.removeAttribute('data-now'));
        cells.forEach((cell, lane) => {
          if (cell !== null)
            root.querySelector(`[data-cell="${lane}:${cell}"]`)?.setAttribute('data-now', '');
        });
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Todos los carriles sobre una misma grilla: en una polirritmia se ve dónde coinciden (3 contra 2 va en 6).
  const size = gridSize(cycle.lanes);
  return (
    <div ref={box} className={styles.strip} data-testid="strip" aria-hidden="true">
      {cycle.lanes.map((count, lane) => {
        const cellAt = new Map<number, number>();
        for (let cell = 0; cell < count; cell++) cellAt.set(Math.round((cell * size) / count), cell);
        return (
          <div
            key={lane}
            className={styles.stripRow}
            style={{ ['--cells' as string]: size }}
            data-lane={lane}
          >
            {Array.from({ length: size }, (_, place) => {
              const cell = cellAt.get(place);
              const hit =
                cell === undefined
                  ? undefined
                  : cycle.hits.find((item) => item.lane === lane && item.cell === cell);
              return (
                <span
                  key={place}
                  data-cell={cell === undefined ? undefined : `${lane}:${cell}`}
                  data-level={hit ? hit.level : undefined}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Cuántas casillas hacen falta para que entren todos los carriles; si son demasiadas, las del más largo. */
function gridSize(lanes: readonly number[]): number {
  const lcm = lanes.reduce((acc, count) => (acc * count) / gcd(acc, count), 1);
  return lcm <= 48 ? lcm : Math.max(...lanes);
}
