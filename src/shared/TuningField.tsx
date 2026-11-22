// La afinación que se elige arriba en cada herramienta, y el link para ir a afinarla.
import { Link } from 'react-router';
import { noteLabel } from '~/core/notes';
import { GROUPS, TUNINGS, type Tuning } from '~/data/tunings';
import { useSettings } from './settings';
import { Field } from './ui/ui';
import styles from './ui/ui.module.css';

export function TuningField({ tuning, onChange }: { tuning: Tuning; onChange: (id: string) => void }) {
  const notation = useSettings((s) => s.notation);
  return (
    <Field label="Afinación" wide>
      <select id="afinacion" value={tuning.id} onChange={(event) => onChange(event.target.value)}>
        {GROUPS.map((group) => (
          <optgroup key={group.id} label={group.name}>
            {TUNINGS.filter((item) => item.group === group.id).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.notes.map((note) => noteLabel(note, notation)).join(' ')}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </Field>
  );
}

export function TuneLink({ tuning }: { tuning: Tuning }) {
  return (
    <Link className={styles.bridge} to={`/afinador/${tuning.id}`}>
      Afinar en {tuning.name} →
    </Link>
  );
}
