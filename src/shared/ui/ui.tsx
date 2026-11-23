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

type Option<T extends string> = { value: T; label: string };

/**
 * Dos opciones en un solo botón: muestra la elegida y tocarlo pasa a la otra. El ancho es el de la opción
 * más larga, así el botón no salta al cambiar.
 */
export function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly [Option<T>, Option<T>];
  onChange: (value: T) => void;
}) {
  const index = options[1].value === value ? 1 : 0;
  const next = options[1 - index]!;
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={`${label}: ${options[index]!.label}`}
      title={`Cambiar a ${next.label}`}
      onClick={() => onChange(next.value)}
    >
      <span className={styles.toggleText}>
        {options.map((option, i) => (
          <span key={option.value} data-shown={i === index}>
            {option.label}
          </span>
        ))}
      </span>
      <span className={styles.toggleMark} aria-hidden="true">
        ⇄
      </span>
    </button>
  );
}

/**
 * Recorrer una lista de a uno: flecha, lo que está elegido (tocarlo lo hace sonar) y flecha. Lo usan las
 * posiciones de Escalas y las formas de Inversiones.
 */
export function Browse({
  count,
  main,
  note,
  countTestId,
  currentLabel,
  prevLabel,
  nextLabel,
  disabled,
  onStep,
  onCurrent,
  className = '',
}: {
  /** El rótulo chico de arriba: "Forma 2 de 5". */
  count: ReactNode;
  /** Lo importante, en grande: los trastes. */
  main: ReactNode;
  note?: ReactNode;
  countTestId?: string;
  currentLabel: string;
  prevLabel: string;
  nextLabel: string;
  disabled?: boolean;
  onStep: (direction: -1 | 1) => void;
  onCurrent: () => void;
  className?: string;
}) {
  return (
    <div className={`${styles.browse} ${className}`}>
      <button
        type="button"
        className={styles.browseArrow}
        aria-label={prevLabel}
        disabled={disabled}
        onClick={() => onStep(-1)}
      >
        ◀
      </button>
      <button type="button" className={styles.browseCurrent} aria-label={currentLabel} onClick={onCurrent}>
        <span className={styles.browseCount} data-testid={countTestId}>
          {count}
        </span>
        <strong className={styles.browseMain}>{main}</strong>
        {note && <small>{note}</small>}
      </button>
      <button
        type="button"
        className={styles.browseArrow}
        aria-label={nextLabel}
        disabled={disabled}
        onClick={() => onStep(1)}
      >
        ▶
      </button>
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

export function SlabHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.slabHead}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

/** Un campo con su rótulo chico arriba. `as="div"` cuando adentro hay botones (un label no puede tenerlos). */
export function Field({
  label,
  wide,
  as: Tag = 'label',
  className = '',
  children,
}: {
  label: ReactNode;
  /** El campo principal de la fila (la afinación): toma más lugar. */
  wide?: boolean;
  as?: 'label' | 'div';
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`${styles.field} ${className}`} data-wide={wide || undefined}>
      <span>{label}</span>
      {children}
    </Tag>
  );
}

/** Una columna plegada a un costado: tocarla la abre. */
export function Rail({
  side,
  label,
  ariaLabel,
  onOpen,
  className = '',
}: {
  side: 'left' | 'right';
  label: ReactNode;
  ariaLabel: string;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.rail} ${className}`}
      data-side={side}
      aria-expanded={false}
      aria-label={ariaLabel}
      onClick={onOpen}
    >
      <span aria-hidden="true">{side === 'left' ? '›' : '‹'}</span>
      <span>{label}</span>
    </button>
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

/**
 * Un botón partido en dos: a la izquierda prende y apaga lo que suena, a la derecha abre su modal para
 * elegir cómo suena. Lo usa el drone de Escalas.
 */
export function SplitButton({
  on,
  playLabel,
  onPlay,
  openLabel,
  onOpen,
  children,
  className = '',
}: {
  on: boolean;
  /** La frase completa del ▶: "Prender el drone en E". */
  playLabel: string;
  onPlay: () => void;
  /** La frase completa de la otra mitad: "Elegir cómo suena el drone". */
  openLabel: string;
  onOpen: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.split} ${className}`} role="group" aria-label={openLabel}>
      <button type="button" aria-label={playLabel} aria-pressed={on} data-on={on} onClick={onPlay}>
        {on ? '■' : '▶'}
      </button>
      <button type="button" aria-haspopup="dialog" title={openLabel} onClick={onOpen}>
        {children}
        <span className={styles.splitMark} aria-hidden="true">
          ▾
        </span>
      </button>
    </div>
  );
}
