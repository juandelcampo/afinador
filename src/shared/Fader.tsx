// Los volúmenes, iguales en todas las herramientas: uno por canal (guitarra, ritmo y drone), cada uno con su
// rótulo. Valen para toda la app; el marco de la app le pasa los valores al audio.
import { CANALES, type Canal } from '~/audio/engine';
import { useSettings } from './settings';
import { Field } from './ui/ui';
import styles from './ui/ui.module.css';

const NOMBRES: Record<Canal, string> = { guitarra: 'Guitarra', ritmo: 'Ritmo', drone: 'Drone' };

export function Fader({ canal }: { canal: Canal }) {
  const value = useSettings((s) => s.mezcla[canal]);
  const set = useSettings((s) => s.set);
  return (
    <Field label={NOMBRES[canal]} className={styles.fader}>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        aria-label={`Volumen de ${NOMBRES[canal].toLowerCase()}`}
        value={Math.round(value * 100)}
        onChange={(event) => {
          const { mezcla } = useSettings.getState();
          set({ mezcla: { ...mezcla, [canal]: Number(event.target.value) / 100 } });
        }}
      />
    </Field>
  );
}

/** Los volúmenes de los canales que se piden, en el orden de siempre. */
export function Mezcla({
  canales = CANALES,
  className = '',
}: {
  canales?: readonly Canal[];
  className?: string;
}) {
  return (
    <div className={`${styles.mezcla} ${className}`} role="group" aria-label="Volúmenes">
      {CANALES.filter((canal) => canales.includes(canal)).map((canal) => (
        <Fader key={canal} canal={canal} />
      ))}
    </div>
  );
}
