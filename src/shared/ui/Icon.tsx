// Los íconos de línea, dibujados con el mismo trazo de 3 px que los bordes. Los caracteres como ⇄, ↺ o →
// no están en Archivo: el navegador los saca de la letra del sistema y quedan finos al lado del resto.
import type { SVGProps } from 'react';
import styles from './ui.module.css';

const PATHS = {
  swap: 'M2 4.5h12M11 1.5l3 3-3 3M16 13.5H4M7 10.5l-3 3 3 3',
  reset: 'M3 10.5a6 6 0 1 0 6-6M11.5 1.5l-3 3 3 3',
  undo: 'M6 2.5L2 6.5l4 4M2 6.5h8.5a5 5 0 0 1 0 10H7',
  redo: 'M12 2.5l4 4-4 4M16 6.5H7.5a5 5 0 0 0 0 10H11',
  repeat: 'M15 10.5a6 6 0 1 1-6-6M6.5 1.5l3 3-3 3',
  close: 'M4 4l10 10M14 4L4 14',
  left: 'M16 9H3M8 4L3 9l5 5',
  right: 'M2 9h13M10 4l5 5-5 5',
  up: 'M9 16V3M4 8l5-5 5 5',
  down: 'M9 2v13M4 10l5 5 5-5',
  back: 'M11.5 3l-6 6 6 6',
  forward: 'M6.5 3l6 6-6 6',
  check: 'M3 9.5l4 4 8-9',
  grip: 'M3 6h12M3 12h12',
  settings: 'M2 5h14M2 13h14M6 2v6M12 10v6',
  sun: 'M9 6.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5M9 -0.5v4M9 14.5v4M-0.5 9h4M14.5 9h4M2.3 2.3l2.8 2.8M12.9 12.9l2.8 2.8M2.3 15.7l2.8-2.8M12.9 5.1l2.8-2.8',
  moon: 'M15.75 10.1A6.75 6.75 0 1 1 7.9 2.25a5.25 5.25 0 0 0 7.85 7.85z',
  play: 'M5 2.5l11 6.5-11 6.5z',
  stop: 'M3.5 3.5h11v11h-11z',
  star: 'M9 2.3l1.94 4.83 5.19.35-3.99 3.34 1.27 5.05L9 13.1l-4.41 2.77 1.27-5.05-3.99-3.34 5.19-.35z',
} as const;

export type IconName = keyof typeof PATHS;

/**
 * Un ícono de 18 px (--icon-size lo cambia); siempre decorativo: el nombre va en el botón. Con data-filled
 * se rellena (la estrella de una favorita).
 */
export function Icon({
  name,
  className = '',
  ...rest
}: { name: IconName } & Omit<SVGProps<SVGSVGElement>, 'children'>) {
  return (
    <svg
      {...rest}
      className={`${styles.icon} ${className}`}
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Tocar o parar, solo el signo y grande: el botón se entiende sin leer (el nombre va en ariaLabel). */
export function PlayIcon({ running }: { running: boolean }) {
  return <Icon name={running ? 'stop' : 'play'} data-filled="true" data-big="true" />;
}
