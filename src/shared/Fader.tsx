// El fader del volumen. El marco de la app le pasa el valor al audio.
import { useSettings } from './settings';
import styles from './ui/ui.module.css';

export function Fader({ compact }: { compact?: boolean }) {
  const value = useSettings((s) => s.volume);
  const set = useSettings((s) => s.set);
  return (
    <label className={styles.fader} data-compact={compact}>
      {!compact && <span>Volumen</span>}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        aria-label="Volumen"
        onChange={(event) => set({ volume: Number(event.target.value) / 100 })}
      />
    </label>
  );
}
