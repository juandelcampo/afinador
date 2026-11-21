// El diapasón de las inversiones: todas las notas del acorde, tenues, y la forma elegida encima. Tocar una
// nota tenue pone un dedo ahí; tocar un dedo lo saca. Así se arma una forma propia.
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
  /** Pone o saca un dedo: el traste en esa cuerda, 0 al aire. */
  onToggle: (stringIndex: number, fret: number) => void;
}

const mod12 = (value: number) => ((value % 12) + 12) % 12;

export function Diapason({ notes, open, root, suffix, steps, voicing, notation, onToggle }: DiapasonProps) {
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
          const where = (column: number) =>
            `${count - stringIndex}.ª cuerda, ${column === 0 ? 'al aire' : `traste ${column}`}`;
          const dot = (column: number) => {
            const step = mod12(open[stringIndex]! + column - root);
            const tone = toneName(step, suffix);
            if (fret === column) {
              return (
                <button
                  type="button"
                  className={styles.dot}
                  data-bass={stringIndex === bassString || undefined}
                  aria-label={`Sacar el dedo de la ${where(column)} (${tone})`}
                  onClick={() => onToggle(stringIndex, column)}
                >
                  {tone}
                </button>
              );
            }
            if (column > 0 && chordSteps.has(step)) {
              return (
                <button
                  type="button"
                  className={styles.ghost}
                  aria-label={`Poner un dedo en la ${where(column)} (${tone})`}
                  onClick={() => onToggle(stringIndex, column)}
                >
                  {tone}
                </button>
              );
            }
            return null;
          };
          // La cuerda al aire se suma tocando su nombre, si su nota es del acorde.
          const openTone = chordSteps.has(mod12(open[stringIndex]! - root));
          return (
            <div key={stringIndex} className={styles.string} data-muted={muted || undefined}>
              <div className={styles.nut} data-column={0}>
                {fret === 0 ? (
                  dot(0)
                ) : openTone ? (
                  <button
                    type="button"
                    className={styles.openName}
                    data-tone
                    aria-label={`Dejar sonar al aire la ${count - stringIndex}.ª cuerda (${toneName(
                      mod12(open[stringIndex]! - root),
                      suffix,
                    )})`}
                    onClick={() => onToggle(stringIndex, 0)}
                  >
                    {muted ? '×' : noteLabel(notes[stringIndex]!, notation)}
                  </button>
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
