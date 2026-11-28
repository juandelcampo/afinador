// La figura de un acorde como en un cancionero: una columna por cuerda, cuatro trastes, × apagada y ○ al aire.
// La usan las figuras del Afinador y la vuelta agrandada de Armonía.
import { MUTED } from '~/core/tuning';
import styles from './chordDiagram.module.css';

const ROWS = 4;

export function ChordDiagram({ frets }: { frets: number[] }) {
  const pressed = frets.filter((fret) => fret > 0);
  // Si la figura no entra en los primeros cuatro trastes, el dibujo arranca donde empieza la mano.
  const start = pressed.length && Math.max(...pressed) > ROWS ? Math.min(...pressed) : 1;
  return (
    <span
      className={styles.diagram}
      aria-hidden="true"
      data-nut={start === 1}
      style={{ gridTemplateColumns: `repeat(${frets.length}, minmax(0, 1fr))` }}
    >
      {frets.map((fret, string) => (
        <span key={`top-${string}`} className={styles.diagramTop}>
          {fret === MUTED ? '×' : fret === 0 ? '○' : ''}
        </span>
      ))}
      {Array.from({ length: ROWS }, (_, row) =>
        frets.map((fret, string) => (
          <span key={`${row}-${string}`} className={styles.diagramCell} data-dot={fret === start + row} />
        )),
      )}
      {start > 1 && <span className={styles.diagramStart}>{start}.º</span>}
    </span>
  );
}
