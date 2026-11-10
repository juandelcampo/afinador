import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router';
import { setVolume, type Channel } from '~/audio/engine';
import { Fader } from '~/shared/Fader';
import { useSettings } from '~/shared/settings';
import { Segmented, Stepper } from '~/shared/ui/ui';
import styles from './shell.module.css';

/** Una barra arriba con lo que vale para todo el afinador, y la página debajo. */
export default function AppShell() {
  const notation = useSettings((s) => s.notation);
  const a4 = useSettings((s) => s.a4);
  const volumes = useSettings((s) => s.volumes);
  const set = useSettings((s) => s.set);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.ready = 'true';
  }, []);

  // El audio no conoce las preferencias: se las pasa el marco de la app.
  useEffect(() => {
    (Object.keys(volumes) as Channel[]).forEach((channel) => setVolume(channel, volumes[channel]));
  }, [volumes]);

  return (
    <div className={styles.shell}>
      <header className={styles.topBar} data-open={settingsOpen}>
        <Link to="/" className={styles.brand}>
          Afinador
        </Link>
        {/* Solo se ve en pantallas chicas: los ajustes se tocan una vez y no tienen por qué ocupar lugar. */}
        <button
          type="button"
          className={styles.settingsToggle}
          aria-expanded={settingsOpen}
          aria-controls="ajustes"
          onClick={() => setSettingsOpen((open) => !open)}
        >
          Ajustes · La {a4} <span aria-hidden="true">{settingsOpen ? '↑' : '↓'}</span>
        </button>
        <div className={styles.settings} id="ajustes">
          <Segmented
            label="Nombres de las notas"
            value={notation}
            options={[
              { value: 'letters', label: 'E A D' },
              { value: 'solfege', label: 'Mi La Re' },
            ]}
            onChange={(value) => set({ notation: value })}
          />
          <Stepper
            label="referencia del La"
            value={`La ${a4} Hz`}
            onDown={() => set({ a4: Math.max(415, a4 - 1) })}
            onUp={() => set({ a4: Math.min(466, a4 + 1) })}
          />
          <Fader channel="master" />
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
