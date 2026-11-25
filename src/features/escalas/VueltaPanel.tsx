// La vuelta de fondo, en el modal de Escalas: qué acordes suenan, a qué velocidad, con qué ritmo y cómo se
// tocan. La vuelta se arma en Armonía; acá se elige una de las de siempre o se cambia allá.
import type { RhythmConfig } from '~/core/rhythm';
import type { Chord } from '~/core/harmony';
import { Link } from 'react-router';
import { RitmoDeFondo } from '~/shared/RitmoDeFondo';
import { TEMPO_RANGE } from '~/shared/settings';
import type { Feel } from '~/shared/useVuelta';
import { Icon } from '~/shared/ui/Icon';
import { Button, Field, Segmented } from '~/shared/ui/ui';
import ui from '~/shared/ui/ui.module.css';
import styles from './escalas.module.css';

export function VueltaPanel({
  chords,
  current,
  onListen,
  tempo,
  onTempo,
  fondo,
  onFondo,
  feel,
  onFeel,
  starters,
  onStarter,
  armoniaHref,
}: {
  /** Los nombres de los acordes de la vuelta. */
  chords: string[];
  /** El que está sonando. */
  current: number | null;
  onListen: (index: number) => void;
  tempo: number;
  onTempo: (tempo: number) => void;
  fondo: RhythmConfig | null;
  onFondo: (config: RhythmConfig | null) => void;
  feel: Feel;
  onFeel: (feel: Feel) => void;
  /** Unas vueltas de siempre en esta tónica, para cambiar sin ir a Armonía. */
  starters: Array<{ id: string; chords: Chord[]; names: string[] }>;
  onStarter: (chords: Chord[]) => void;
  armoniaHref: string;
}) {
  const shown = chords.join('_');
  return (
    <div className={styles.vueltaPanel}>
      <ol className={styles.vueltaChords} aria-label="Los acordes de la vuelta">
        {chords.map((name, index) => (
          <li key={`${name}-${index}`}>
            <button
              type="button"
              data-now={current === index || undefined}
              aria-label={`Escuchar ${name}`}
              onClick={() => onListen(index)}
            >
              {name}
            </button>
          </li>
        ))}
      </ol>
      <div className={styles.vueltaFields}>
        <label className={ui.field}>
          <span>Velocidad: {tempo} ppm</span>
          <input
            type="range"
            min={TEMPO_RANGE.min}
            max={TEMPO_RANGE.max}
            step={fondo ? 1 : TEMPO_RANGE.step}
            value={tempo}
            onChange={(event) => onTempo(Number(event.target.value))}
          />
        </label>
        <RitmoDeFondo value={fondo} tempo={tempo} onChange={onFondo} />
        <Field label="Cómo se toca" as="div" className={styles.vueltaFeel}>
          <Segmented
            label="Cómo se toca"
            stretch
            value={feel}
            options={[
              { value: 'pulso', label: 'Rasgueo' },
              { value: 'acorde', label: 'Un golpe' },
              { value: 'arpegio', label: 'Arpegio' },
            ]}
            onChange={onFeel}
          />
        </Field>
      </div>
      <section aria-label="Otra vuelta">
        <h3 className={ui.label}>Otra vuelta</h3>
        <div className={styles.starters}>
          {starters.map((starter) => {
            const text = starter.names.join(' · ');
            return (
              <Button
                key={starter.id}
                variant="mini"
                ariaPressed={starter.names.join('_') === shown}
                onClick={() => onStarter(starter.chords)}
              >
                {text}
              </Button>
            );
          })}
        </div>
      </section>
      <Link to={armoniaHref} className={ui.bridge}>
        Armarla en Armonía <Icon name="right" />
      </Link>
    </div>
  );
}
