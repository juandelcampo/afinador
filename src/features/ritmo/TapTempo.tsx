// Marcar el tempo: se toca el botón (o la T) al ritmo de lo que suena en la cabeza o en la guitarra,
// y el tempo lo sigue. Cuenta desde el segundo golpe.
import { useEffect, useRef, useState } from 'react';
import { TAP_RESET_MS, tapTempo } from '~/core/rhythm';
import styles from './ritmo.module.css';

export function TapTempo({ onTempo }: { onTempo: (bpm: number) => void }) {
  const taps = useRef<number[]>([]);
  const [count, setCount] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const latest = useRef(onTempo);
  useEffect(() => {
    latest.current = onTempo;
  }, [onTempo]);

  const tap = () => {
    const now = performance.now();
    const previous = taps.current.at(-1);
    taps.current =
      previous !== undefined && now - previous > TAP_RESET_MS ? [now] : [...taps.current, now].slice(-16);
    setCount(taps.current.length);
    const bpm = tapTempo(taps.current);
    if (bpm !== null) latest.current(bpm);
    // Un destello por golpe, para ver que lo tomó aunque el tempo no cambie.
    const node = button.current;
    if (node) {
      node.removeAttribute('data-flash');
      void node.offsetWidth;
      node.setAttribute('data-flash', '');
    }
  };
  const tapRef = useRef(tap);
  useEffect(() => {
    tapRef.current = tap;
  });

  // La T marca desde cualquier lado de la página, menos cuando se está escribiendo.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 't' || event.repeat || event.metaKey || event.ctrlKey || event.altKey)
        return;
      if ((event.target as HTMLElement | null)?.closest('input, textarea, select')) return;
      tapRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Pasado el tiempo sin golpes, el contador vuelve a cero.
  useEffect(() => {
    if (count === 0) return;
    const timeout = setTimeout(() => {
      taps.current = [];
      setCount(0);
    }, TAP_RESET_MS);
    return () => clearTimeout(timeout);
  }, [count]);

  return (
    <button
      ref={button}
      type="button"
      className={styles.tap}
      id="tap-tempo"
      title="Tocalo al ritmo, o apretá la T"
      // Al apretar, no al soltar: así el golpe cae donde cae el dedo.
      onPointerDown={(event) => {
        if (event.button === 0) tap();
      }}
      onClick={(event) => {
        if (event.detail === 0) tap();
      }}
    >
      <span>Marcar</span>
      <small>{count === 0 ? 'tocá al ritmo · T' : count === 1 ? 'uno más…' : `${count} golpes`}</small>
    </button>
  );
}
