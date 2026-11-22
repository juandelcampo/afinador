// Rasgueo o arpegio: cómo suena un acorde suelto. Va al lado de Escuchar y se recuerda en este navegador.
import { useSettings } from './settings';
import { Toggle } from './ui/ui';

export function ShapeStyleToggle() {
  const value = useSettings((s) => s.chordStyle);
  const set = useSettings((s) => s.set);
  return (
    <Toggle
      label="Cómo suena el acorde"
      value={value}
      options={[
        { value: 'strum', label: 'Rasgueo' },
        { value: 'arp', label: 'Arpegio' },
      ]}
      onChange={(chordStyle) => set({ chordStyle })}
    />
  );
}
