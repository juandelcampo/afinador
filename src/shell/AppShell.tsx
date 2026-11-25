import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { setVolume } from '~/audio/engine';
import { toolOf, useRememberPlace, useToolHref } from '~/shared/memoria';
import { useSettings, type ToolKey } from '~/shared/settings';
import { Fader } from '~/shared/Fader';
import { useTheme } from '~/shared/theme';
import { flashOnSelect } from '~/shared/ui/flash';
import { Icon } from '~/shared/ui/Icon';
import { Stepper } from '~/shared/ui/ui';
import ui from '~/shared/ui/ui.module.css';
import styles from './shell.module.css';

/** Las herramientas, cada una por su lado. `match` dice qué rutas son de cada una. */
const TOOLS: { key: ToolKey; label: string }[] = [
  { key: 'afinador', label: 'Afinador' },
  { key: 'armonia', label: 'Armonía' },
  { key: 'escalas', label: 'Escalas' },
  { key: 'inversiones', label: 'Inversiones' },
  { key: 'acorde', label: '¿Qué acorde?' },
  { key: 'tonalidad', label: '¿Qué tonalidad?' },
  { key: 'ritmo', label: 'Ritmo' },
];

/** Cada herramienta de la barra lleva adonde la dejaste. */
function ToolLink({
  tool,
  label,
  current,
  onClick,
}: {
  tool: ToolKey;
  label: string;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      to={useToolHref(tool)}
      className={styles.tool}
      data-select
      onClick={onClick}
      aria-current={current ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}

/** Una barra arriba con las herramientas y lo que vale para todas, y la página debajo. */
export default function AppShell() {
  const notation = useSettings((s) => s.notation);
  const a4 = useSettings((s) => s.a4);
  const volume = useSettings((s) => s.volume);
  const set = useSettings((s) => s.set);
  const [theme, chooseTheme] = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { pathname } = useLocation();
  const bar = useRef<HTMLElement>(null);
  useRememberPlace();
  const currentTool = toolOf(pathname);
  const currentLabel = TOOLS.find((tool) => tool.key === currentTool)?.label ?? 'Inicio';

  useEffect(() => {
    document.documentElement.dataset.ready = 'true';
  }, []);

  // Todo lo que se elige, en cualquier herramienta, pasa un instante por naranja.
  useEffect(flashOnSelect, []);

  // Los ajustes abiertos se cierran al ir a otra herramienta, al tocar fuera de la barra o con Escape.
  useEffect(() => {
    if (!settingsOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!bar.current?.contains(event.target as Node)) setSettingsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [settingsOpen]);

  // El audio no conoce las preferencias: se las pasa el marco de la app.
  useEffect(() => setVolume(volume), [volume]);

  return (
    <div className={styles.shell}>
      <header ref={bar} className={styles.topBar} data-open={settingsOpen}>
        <nav className={styles.tools} aria-label="Herramientas">
          {/* La marca lleva a la portada, donde se elige la herramienta. */}
          <Link
            to="/"
            className={styles.home}
            aria-label="Inicio"
            data-select
            aria-current={pathname === '/' ? 'page' : undefined}
          />
          {/* Solo en el celular y la tableta: las herramientas y los ajustes van plegados detrás de este botón,
              que dice dónde estás. Así la barra ocupa una fila y la herramienta, el resto de la pantalla. */}
          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={settingsOpen}
            aria-controls="ajustes"
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <span>
              <span className="sr-only">Menú: herramientas y ajustes. Estás en </span>
              {currentLabel}
            </span>
            <span className={styles.menuWord} aria-hidden="true">
              Menú
              <Icon name={settingsOpen ? 'up' : 'down'} />
            </span>
          </button>
          {TOOLS.map((tool) => (
            <ToolLink
              key={tool.key}
              tool={tool.key}
              label={tool.label}
              current={currentTool === tool.key}
              onClick={() => setSettingsOpen(false)}
            />
          ))}
        </nav>
        {/* Entre 960 y 1680 px: los ajustes se tocan poco y no tienen por qué ocupar lugar. Más angosto, los
            abre el botón Menú junto con las herramientas. */}
        <button
          type="button"
          className={styles.settingsToggle}
          aria-expanded={settingsOpen}
          aria-controls="ajustes"
          aria-label={`Ajustes: notación, La ${a4}, volumen y tema`}
          title="Ajustes"
          onClick={() => setSettingsOpen((open) => !open)}
        >
          {/* Solo existe en el celular, donde la barra no tiene lugar para la palabra. */}
          <Icon name="settings" />
          <Icon name={settingsOpen ? 'up' : 'down'} />
        </button>
        <div className={styles.settings} id="ajustes">
          {/* Los ajustes son cuadrados chicos: se tocan poco y la barra es de las herramientas. */}
          <button
            type="button"
            className={ui.mini}
            data-select
            aria-label={`Nombres de las notas: ${notation === 'solfege' ? 'Mi La Re' : 'E A D'}`}
            title={notation === 'solfege' ? 'Cambiar a E A D' : 'Cambiar a Mi La Re'}
            onClick={() => set({ notation: notation === 'solfege' ? 'letters' : 'solfege' })}
          >
            {notation === 'solfege' ? 'Mi' : 'E'}
          </button>
          <div className={styles.pitch} title={`La de referencia: ${a4} Hz`}>
            <Stepper
              label="referencia del La"
              value={String(a4)}
              onDown={() => set({ a4: Math.max(415, a4 - 1) })}
              onUp={() => set({ a4: Math.min(466, a4 + 1) })}
            />
          </div>
          <button
            type="button"
            className={`${ui.mini} ${styles.theme}`}
            data-select
            aria-label={`Tema: ${theme === 'dark' ? 'Oscuro' : 'Claro'}`}
            title={theme === 'dark' ? 'Cambiar a Claro' : 'Cambiar a Oscuro'}
            onClick={() => chooseTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {/* Muestra el tema que está puesto, como el resto de las elecciones de dos opciones. */}
            <Icon name={theme === 'dark' ? 'moon' : 'sun'} />
          </button>
          {/* Un solo volumen para toda la app: el mismo en todas las herramientas, siempre en este lugar. */}
          <Fader />
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
