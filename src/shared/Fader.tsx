// El volumen, igual en todas las herramientas: va en la fila de escuchar, con su rótulo. El marco de la app
// le pasa el valor al audio.
import { useSettings } from './settings';
import { Field } from './ui/ui';
import styles from './ui/ui.module.css';

export function Fader() {
  const value = useSettings((s) => s.volume);
  const set = useSettings((s) => s.set);
  return (
    <Field label="Volumen" className={styles.fader}>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(event) => set({ volume: Number(event.target.value) / 100 })}
      />
    </Field>
  );
}
