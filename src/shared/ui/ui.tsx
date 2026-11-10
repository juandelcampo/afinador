// Componentes brutalistas compartidos. Son chicos a propósito: bloques, bordes y nada más.
import type { PointerEvent, ReactNode } from 'react';
import styles from './ui.module.css';

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  stretch?: boolean;
}

export function Segmented<T extends string>({ label, value, options, onChange, stretch }: SegmentedProps<T>) {
  return (
    <div className={`${styles.segmented} ${stretch ? styles.stretch : ''}`} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface TabsProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

/** Pestañas que pasan a varias filas en pantallas chicas. */
export function Tabs<T extends string>({ label, value, options, onChange }: TabsProps<T>) {
  return (
    <div className={styles.tabs} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface StepperProps {
  label: string;
  value: ReactNode;
  onDown: () => void;
  onUp: () => void;
}

export function Stepper({ label, value, onDown, onUp }: StepperProps) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button type="button" aria-label={`Bajar ${label}`} onClick={onDown}>
        −
      </button>
      <output>{value}</output>
      <button type="button" aria-label={`Subir ${label}`} onClick={onUp}>
        +
      </button>
    </div>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost' | 'mini';
  full?: boolean;
  ariaLabel?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
  /** Encendido: el micrófono abierto o el patrón sonando. Cambia el color, no el nombre. */
  on?: boolean;
  id?: string;
  disabled?: boolean;
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  title?: string;
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  full,
  ariaLabel,
  ariaPressed,
  ariaExpanded,
  ariaControls,
  on,
  id,
  disabled,
  onPointerDown,
  title,
}: ButtonProps) {
  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      className={`${styles[variant]} ${full ? styles.full : ''}`}
      onClick={onClick}
      onPointerDown={onPointerDown}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      data-on={on}
    >
      {children}
    </button>
  );
}

export function Slab({
  children,
  label,
  className = '',
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <section className={`${styles.slab} ${className}`} aria-label={label}>
      {children}
    </section>
  );
}

/** `number` es el rótulo de la sección (01, 02…): ordena la pantalla de un vistazo. */
export function SlabHead({
  title,
  number,
  children,
}: {
  title: string;
  number?: string;
  children?: ReactNode;
}) {
  return (
    <div className={styles.slabHead}>
      <h2>
        {number && <span className={styles.number}>{number}</span>}
        {title}
      </h2>
      {children}
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  mark,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** Una marca chica que va en la línea de arriba del título, junto al eyebrow. */
  mark?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className={styles.pageTitle}>
      {(eyebrow || mark) && (
        <p className={styles.eyebrow}>
          {eyebrow}
          {mark}
        </p>
      )}
      <h1>{title}</h1>
      {children}
    </header>
  );
}
