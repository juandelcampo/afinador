// La afinación que se elige arriba en cada herramienta, y el link para ir a afinarla.
import { Link } from 'react-router';
import { noteLabel } from '~/core/notes';
import { GROUPS, TUNINGS, type Tuning } from '~/data/tunings';
import { useSettings } from './settings';
import { Icon } from './ui/Icon';
import { Picker } from './ui/Picker';
import styles from './ui/ui.module.css';

export function TuningField({ tuning, onChange }: { tuning: Tuning; onChange: (id: string) => void }) {
  const notation = useSettings((s) => s.notation);
  return (
    <Picker
      id="afinacion"
      label="Afinación"
      wide
      showDetail
      value={tuning.id}
      groups={GROUPS.map((group) => ({
        id: group.id,
        name: group.name,
        options: TUNINGS.filter((item) => item.group === group.id).map((item) => ({
          value: item.id,
          label: item.name,
          detail: item.notes.map((note) => noteLabel(note, notation)).join(' '),
        })),
      }))}
      onChange={onChange}
    />
  );
}

export function TuneLink({ tuning }: { tuning: Tuning }) {
  return (
    <Link className={styles.bridge} to={`/afinador/${tuning.id}`}>
      Afinar en {tuning.name} <Icon name="right" />
    </Link>
  );
}
