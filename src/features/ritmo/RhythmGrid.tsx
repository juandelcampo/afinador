// Las casillas de un compás, en fila. La que suena se marca leyendo el reloj cuadro a cuadro, sin renders.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { metronome } from '~/audio/metronome';
import { cycleFor, type Cycle, type RhythmConfig } from '~/core/rhythm';
import styles from './ritmo.module.css';

export function RhythmGrid({ config }: { config: RhythmConfig }) {
  const [shown, setShown] = useState<{ config: RhythmConfig; cycle: Cycle } | null>(null);
  const container = useRef<HTMLDivElement>(null);
  // Un compás mutante cambia de forma mientras suena: se muestra el que está sonando.
  const cycle = shown?.config === config ? shown.cycle : cycleFor(config, 0);

  useEffect(() => {
    let frame = 0;
    let previous = '';
    let drawn: Cycle | null = null;
    const draw = () => {
      const current = metronome.playhead();
      if (current?.cycle && current.cycle !== drawn) {
        drawn = current.cycle;
        setShown({ config, cycle: current.cycle });
      }
      const key = current?.cells.join() ?? '';
      if (key !== previous && container.current) {
        previous = key;
        container.current
          .querySelectorAll('[data-active]')
          .forEach((cell) => cell.removeAttribute('data-active'));
        current?.cells.forEach((cell, lane) => {
          if (cell !== null) {
            container.current
              ?.querySelector(`[data-cell="${lane}:${cell}"]`)
              ?.setAttribute('data-active', '');
          }
        });
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [config]);

  return (
    <div ref={container} className={styles.grid} aria-hidden="true" data-testid="rhythm-grid">
      {cycle.lanes.map((count, lane) => (
        <div key={lane} className={styles.lane} style={{ '--cells': count } as CSSProperties}>
          {Array.from({ length: count }, (_, cell) => {
            const hit = cycle.hits.find((item) => item.lane === lane && item.cell === cell);
            return (
              <span
                key={cell}
                className={styles.cell}
                data-cell={`${lane}:${cell}`}
                data-level={hit ? hit.level : 'rest'}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
