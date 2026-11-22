import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { setVolume } from '~/audio/engine';
import { useSettings } from '~/shared/settings';
import { Segmented, Stepper } from '~/shared/ui/ui';
import styles from './shell.module.css';

/** Las herramientas, cada una por su lado. `match` dice qué rutas son de cada una. */
const TOOLS = [
  { to: '/afinador', label: 'Afinador', match: (path: string) => path.startsWith('/afinador') },
  { to: '/armonia', label: 'Armonía', match: (path: string) => path.startsWith('/armonia') },
  { to: '/escalas', label: 'Escalas', match: (path: string) => path.startsWith('/escalas') },
  {
    to: '/inversiones',
    label: 'Inversiones',
    match: (path: string) => path.startsWith('/inversiones'),
  },
  { to: '/acorde', label: '¿Qué acorde?', match: (path: string) => path.startsWith('/acorde') },
  { to: '/ritmo', label: 'Ritmo', match: (path: string) => path.startsWith('/ritmo') },
];

/** Una barra arriba con las herramientas y lo que vale para todas, y la página debajo. */
export default function AppShell() {
  const notation = useSettings((s) => s.notation);
  const a4 = useSettings((s) => s.a4);
  const volume = useSettings((s) => s.volume);
  const set = useSettings((s) => s.set);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.dataset.ready = 'true';
  }, []);

  // El audio no conoce las preferencias: se las pasa el marco de la app.
  useEffect(() => setVolume(volume), [volume]);

  return (
    <div className={styles.shell}>
      <header className={styles.topBar} data-open={settingsOpen}>
        <nav className={styles.tools} aria-label="Herramientas">
          {/* La marca lleva a la portada, donde se elige la herramienta. */}
          <Link
            to="/"
            className={styles.home}
            aria-label="Inicio"
            aria-current={pathname === '/' ? 'page' : undefined}
          />
          {TOOLS.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className={styles.tool}
              aria-current={tool.match(pathname) ? 'page' : undefined}
            >
              {tool.label}
            </Link>
          ))}
        </nav>
        {/* Solo se ve en pantallas chicas: los ajustes se tocan una vez y no tienen por qué ocupar lugar. */}
        <button
          type="button"
          className={styles.settingsToggle}
          aria-expanded={settingsOpen}
          aria-controls="ajustes"
          aria-label={`Ajustes: notación y La ${a4}`}
          title="Ajustes"
          onClick={() => setSettingsOpen((open) => !open)}
        >
          {/* Solo existe en el celular, donde la barra no tiene lugar para la palabra. */}
          <span aria-hidden="true">⚙︎ {settingsOpen ? '↑' : '↓'}</span>
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
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
