// El diapasón de las inversiones: todas las notas del acorde, tenues, y la forma elegida encima.
import { useEffect, useRef } from 'react';
import { toneName, type Voicing } from '~/core/inversions';
import { noteLabel, type Notation } from '~/core/notes';
import type { Suffix } from '~/core/harmony';
import { MUTED } from '~/core/tuning';
import styles from './inversiones.module.css';

/** Hasta dónde se dibuja: las formas empiezan a lo sumo en el 12 y abren cuatro trastes. */
export const LAST_FRET = 15;
const FRETS = Array.from({ length: LAST_FRET }, (_, index) => index + 1);
/** Marcas de posición, como en una guitarra: una en 3, 5, 7, 9 y 15, dos en el 12. */
const INLAYS: Record<number, number> = { 3: 1, 5: 1, 7: 1, 9: 1, 12: 2, 15: 1 };

interface DiapasonProps {
  /** El nombre de cada cuerda al aire, de la 6.ª a la 1.ª. */
  notes: string[];
  /** El MIDI de cada cuerda al aire. */
  open: number[];
  root: number;
  suffix: Suffix;
  steps: readonly number[];
  voicing: Voicing | null;
  notation: Notation;
  onPluck: (stringIndex: number) => void;
}

const mod12 = (value: number) => ((value % 12) + 12) % 12;

export function Diapason({ notes, open, root, suffix, steps, voicing, notation, onPluck }: DiapasonProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const count = notes.length;
  const chordSteps = new Set(steps.map(mod12));
  const bassString = voicing
    ? voicing.midis.indexOf(Math.min(...voicing.midis.filter((midi): midi is number => midi !== null)))
    : -1;

  // En el celular el diapasón se desplaza de costado: la forma elegida queda a la vista.
  const position = voicing?.position ?? 0;
  useEffect(() => {
    const box = scroller.current;
    if (!box || box.scrollWidth <= box.clientWidth) return;
    const cell = box.querySelector<HTMLElement>(`[data-column="${Math.max(1, position - 1)}"]`);
    if (!cell) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ left: position <= 2 ? 0 : cell.offsetLeft - 48, behavior: smooth ? 'smooth' : 'auto' });
  }, [position]);

  return (
    <div ref={scroller} className={styles.scroller} data-testid="diapason">
      <div className={styles.neck} style={{ ['--strings' as string]: count }}>
        {Array.from({ length: count }, (_, row) => {
          // La 1.ª cuerda arriba, como se ve la guitarra al tocarla.
          const stringIndex = count - 1 - row;
          const fret = voicing ? voicing.frets[stringIndex]! : MUTED;
          const muted = voicing !== null && fret === MUTED;
          const dot = (column: number) => {
            const step = mod12(open[stringIndex]! + column - root);
            if (fret === column) {
              return (
                <button
                  type="button"
                  className={styles.dot}
                  data-bass={stringIndex === bassString || undefined}
                  aria-label={`Tocar la ${count - stringIndex}.ª cuerda, ${toneName(step, suffix)} del acorde`}
                  onClick={() => onPluck(stringIndex)}
                >
                  {toneName(step, suffix)}
                </button>
              );
            }
            if (column > 0 && chordSteps.has(step)) {
              return (
                <span className={styles.ghost} aria-hidden="true">
                  {toneName(step, suffix)}
                </span>
              );
            }
            return null;
          };
          return (
            <div key={stringIndex} className={styles.string} data-muted={muted || undefined}>
              <div className={styles.nut} data-column={0}>
                {fret === 0 ? (
                  dot(0)
                ) : (
                  <span className={styles.openName}>
                    {muted ? '×' : noteLabel(notes[stringIndex]!, notation)}
                  </span>
                )}
              </div>
              {FRETS.map((column) => (
                <div key={column} className={styles.cell} data-column={column}>
                  {dot(column)}
                </div>
              ))}
            </div>
          );
        })}
        <div className={styles.fretRow} aria-hidden="true">
          <span />
          {FRETS.map((column) => (
            <span key={column} data-inlay={INLAYS[column]}>
              {column}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
