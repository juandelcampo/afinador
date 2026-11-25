// El ritmo de fondo de una vuelta: unos pocos de siempre y los tuyos de Ritmo. Viaja en la URL
// (`ritmo=`, con lo mismo que lleva el link de Ritmo), así una vuelta con su ritmo se comparte con un link.
// Cuando suenan juntos manda el ritmo: su tempo y su compás.
import { useState } from 'react';
import { Link } from 'react-router';
import { describeRhythm, rhythmFromParams, rhythmToParams, type RhythmConfig } from '~/core/rhythm';
import { DRUM_PRESETS } from '~/data/drums';
import { useToolHref } from './memoria';
import { useSettings } from './settings';
import { useHydrated } from './useHydrated';
import { Sheet } from './ui/Sheet';
import { Button, Field } from './ui/ui';
import ui from './ui/ui.module.css';
import styles from './ritmoDeFondo.module.css';

interface Fondo {
  name: string;
  config: RhythmConfig;
}

const meter = (name: string, groups: number[], denom: 4 | 8): Fondo => ({
  name,
  config: { mode: 'meter', groups, denom, bpm: 100 },
});
const drums = (id: string): Fondo => {
  const preset = DRUM_PRESETS.find((item) => item.id === id)!;
  return { name: preset.name, config: preset.config };
};

/** Los de siempre: los compases para contar y unas baterías para acompañar una canción. */
export const FONDOS: { compases: Fondo[]; baterias: Fondo[] } = {
  compases: [
    meter('4/4', [1, 1, 1, 1], 4),
    meter('3/4', [1, 1, 1], 4),
    meter('6/8', [3, 3], 8),
    meter('7/8', [2, 2, 3], 8),
  ],
  baterias: ['rock', 'balada', 'bossa', 'cumbia', 'shuffle', 'lento'].map(drums),
};

/** El ritmo como va en la URL de otra herramienta. */
export const fondoToParam = (config: RhythmConfig) => rhythmToParams(config).toString();

/** El ritmo que vino en la URL, o ninguno si no vino o no se entiende. */
export function fondoFromParam(text: string | null): RhythmConfig | null {
  return text ? rhythmFromParams(new URLSearchParams(text)) : null;
}

/** El mismo ritmo, aunque vaya a otro tempo. */
const pattern = (config: RhythmConfig) => fondoToParam({ ...config, bpm: 0 });

/** Cómo se llama: el nombre de los de siempre o el que le pusiste al guardarlo, si no el de Ritmo. */
function useFondoName(config: RhythmConfig | null): string {
  const hydrated = useHydrated();
  const saved = useSettings((s) => s.saved.ritmo);
  if (!config) return 'Sin ritmo';
  const key = pattern(config);
  const known = [...FONDOS.compases, ...FONDOS.baterias].find((item) => pattern(item.config) === key);
  if (known) return known.name;
  const mine =
    hydrated &&
    saved.find((item) => fondoFromParam(item.search) && pattern(fondoFromParam(item.search)!) === key);
  return mine ? mine.name : describeRhythm(config).name;
}

export function RitmoDeFondo({
  value,
  tempo,
  onChange,
}: {
  value: RhythmConfig | null;
  /** El tempo de ahora: los de siempre lo toman, los tuyos traen el suyo. */
  tempo: number;
  onChange: (config: RhythmConfig | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const saved = useSettings((s) => s.saved.ritmo);
  const ritmoHref = useToolHref('ritmo');
  const name = useFondoName(value);
  const current = value && pattern(value);

  const mine = (hydrated ? saved : []).flatMap((item) => {
    const config = fondoFromParam(item.search);
    return config ? [{ name: item.name, config }] : [];
  });

  const pick = (config: RhythmConfig | null) => {
    onChange(config);
    setOpen(false);
  };
  const option = (fondo: Fondo, keepTempo: boolean) => (
    <Button
      key={`${fondo.name}-${fondoToParam(fondo.config)}`}
      variant="mini"
      ariaPressed={current === pattern(fondo.config)}
      onClick={() => pick(keepTempo ? { ...fondo.config, bpm: tempo } : fondo.config)}
    >
      {fondo.name}
    </Button>
  );

  return (
    <Field label="Ritmo" as="div" className={styles.field}>
      <Button
        variant="ghost"
        full
        ariaExpanded={open}
        ariaLabel={`Ritmo de fondo: ${name}`}
        title="Elegir el ritmo que suena con la vuelta"
        onClick={() => setOpen(true)}
      >
        <span className={styles.name}>{name}</span>
      </Button>
      <Sheet open={open} title="Ritmo de fondo" onClose={() => setOpen(false)} testId="ritmo-de-fondo">
        {/* Sin role="group": la fila de escuchar de Armonía les da forma a los suyos, y el modal vive adentro. */}
        <div className={styles.groups}>
          <div className={styles.group}>
            <Button variant="mini" ariaPressed={!value} onClick={() => pick(null)}>
              Sin ritmo
            </Button>
          </div>
          <section aria-label="Compás">
            <h3 className={ui.label}>Compás</h3>
            <div className={styles.group}>{FONDOS.compases.map((fondo) => option(fondo, true))}</div>
          </section>
          <section aria-label="Batería">
            <h3 className={ui.label}>Batería</h3>
            <div className={styles.group}>{FONDOS.baterias.map((fondo) => option(fondo, true))}</div>
          </section>
          <section aria-label="Mis ritmos">
            <h3 className={ui.label}>Mis ritmos</h3>
            {mine.length ? (
              <div className={styles.group}>{mine.map((fondo) => option(fondo, false))}</div>
            ) : (
              <p className={`${ui.hint} ${styles.empty}`} data-keep>
                Los que guardás en Ritmo aparecen acá.
              </p>
            )}
          </section>
        </div>
        <Link to={ritmoHref} className={ui.bridge}>
          Armar uno en Ritmo →
        </Link>
      </Sheet>
    </Field>
  );
}
