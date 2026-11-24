import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { setVolume } from '~/audio/engine';
import { toolOf, useRememberPlace, useToolHref } from '~/shared/memoria';
import { useSettings, type ToolKey } from '~/shared/settings';
import { Fader } from '~/shared/Fader';
import { useTheme } from '~/shared/theme';
import { flashOnSelect } from '~/shared/ui/flash';
import { Icon } from '~/shared/ui/Icon';
import { Stepper, Toggle } from '~/shared/ui/ui';
import styles from './shell.module.css';

/** Las herramientas, cada una por su lado. `match` dice qué rutas son de cada una. */
const TOOLS: { key: ToolKey; label: string }[] = [
  { key: 'afinador', label: 'Afinador' },
  { key: 'armonia', label: 'Armonía' },
  { key: 'escalas', label: 'Escalas' },
  { key: 'inversiones', label: 'Inversiones' },
  { key: 'acorde', label: '¿Qué acorde?' },
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
        {/* Solo se ve en pantallas chicas: los ajustes se tocan poco (el volumen también está en los botones del
            teléfono) y no tienen por qué ocupar lugar. */}
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
          <Toggle
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
          <Toggle
            label="Tema"
            value={theme}
            options={[
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
            ]}
            onChange={chooseTheme}
          />
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
