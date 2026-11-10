// Los pasos del patrón elegido, en fila. Sin tocar muestra cómo es; tocando, cuál suena.
import type { Ref } from 'react';
import styles from './afinador.module.css';
import { ARP_PATTERNS, STRUM_PATTERNS, type PlayStyle } from './useListener';

interface PatternStripProps {
  ref: Ref<HTMLOListElement>;
  style: PlayStyle;
  patternId: string;
}

/** Enciende un paso sin volver a renderizar: el secuenciador avisa varias veces por segundo. */
export function markStep(list: HTMLOListElement | null, step: number | null) {
  list?.querySelectorAll<HTMLElement>('[data-step]').forEach((item) => {
    item.toggleAttribute('data-active', Number(item.dataset.step) === step);
  });
}

export function PatternStrip({ ref, style, patternId }: PatternStripProps) {
  const steps =
    style === 'arp'
      ? (ARP_PATTERNS.find((item) => item.id === patternId)?.steps ?? []).map((strings) => ({
          text: strings.join('·'),
          label: `${strings.length > 1 ? 'cuerdas' : 'cuerda'} ${strings.join(' y ')}`,
          rest: false,
        }))
      : (STRUM_PATTERNS.find((item) => item.id === patternId)?.steps ?? []).map((direction) => ({
          text: direction === 'down' ? '↓' : direction === 'up' ? '↑' : '·',
          label: direction === 'down' ? 'bajada' : direction === 'up' ? 'subida' : 'silencio',
          rest: direction === null,
        }));

  return (
    <ol ref={ref} className={styles.strip} data-style={style} aria-label="Pasos del patrón">
      {steps.map((step, index) => (
        // Los pasos pares caen en el tiempo: llevan la raya gruesa a la izquierda.
        <li key={index} data-step={index} data-beat={index % 2 === 0} data-rest={step.rest}>
          <span aria-hidden="true">{step.text}</span>
          <span className="sr-only">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
