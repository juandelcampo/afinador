// Qué dice cada nota en el mástil: su nombre o su grado. Arranca en el nombre, porque lo primero es
// ubicar las notas; se elige una vez y vale para Escalas y para Inversiones.
import { useSettings } from './settings';
import { Toggle } from './ui/ui';

export function FretLabelsToggle({
  degrees,
}: {
  /** Cómo se ven los grados en esta herramienta. */ degrees: string;
}) {
  const value = useSettings((s) => s.fretLabels);
  const set = useSettings((s) => s.set);
  return (
    <Toggle
      label="Qué dice cada nota"
      value={value}
      options={[
        { value: 'notas', label: 'Notas' },
        { value: 'grados', label: degrees },
      ]}
      onChange={(fretLabels) => set({ fretLabels })}
    />
  );
}

/** El ♯ o el ♭ de la URL (alt=s o alt=b), o null si no se eligió y manda el acorde. */
export function readAccidental(text: string | null): '#' | 'b' | null {
  return text === 's' ? '#' : text === 'b' ? 'b' : null;
}
