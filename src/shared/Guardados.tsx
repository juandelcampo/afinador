// Lo tuyo, guardado con nombre: vueltas en Armonía, formas en ¿Qué acorde?, ritmos en Ritmo. Cada cosa
// guardada es el link (lo que va después del ?), así abrirla es lo mismo que abrir un link compartido.
// Vive solo en este navegador, como las afinaciones favoritas.
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { NAME_LIMIT, SAVED_LIMIT, searchOf, TOOL_PATHS, useSettings, type SaveTool } from './settings';
import { useHydrated } from './useHydrated';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/ui';
import ui from './ui/ui.module.css';
import styles from './guardados.module.css';

const NO_ITEMS: never[] = [];

export function Guardados({
  tool,
  label,
  title,
  noun,
  name,
  detail,
  search,
  canSave = true,
  variant = 'ghost',
}: {
  tool: SaveTool;
  /** Lo que dice el botón, siempre igual: "Mis formas". */
  label: string;
  /** El título del modal: "Tus formas". */
  title: string;
  /** Lo de ahora, con artículo: "esta forma", "este ritmo". */
  noun: string;
  /** El nombre que se propone al guardar: el del acorde, la vuelta o el ritmo. */
  name: string;
  /** Lo que va debajo del nombre en la lista: la afinación, la tonalidad, el tempo. */
  detail: string;
  /** Lo que hay ahora en la URL. */
  search: string;
  /** Falso si no hay nada que guardar (la vuelta vacía, ninguna cuerda sonando). */
  canSave?: boolean;
  variant?: 'ghost' | 'mini';
}) {
  const hydrated = useHydrated();
  const stored = useSettings((s) => s.saved[tool]);
  // Lo guardado es de este navegador: la página estática sale sin nada, como las favoritas.
  const items = hydrated ? stored : NO_ITEMS;
  const save = useSettings((s) => s.save);
  const unsave = useSettings((s) => s.unsave);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const inputId = useId();

  const current = searchOf(search);
  const already = items.find((item) => item.search === current);
  const full = !already && items.length >= SAVED_LIMIT;

  const show = () => {
    setDraft(already?.name ?? name);
    setOpen(true);
  };
  const keep = () => {
    if (!canSave || full) return;
    save(tool, { name: draft.trim() || name, detail, search: current });
  };

  return (
    <>
      <Button variant={variant} onClick={show} ariaExpanded={open} title={`${label}: guardar y abrir`}>
        {label}
      </Button>
      <Sheet open={open} title={title} onClose={() => setOpen(false)} testId={`guardados-${tool}`}>
        <form
          className={styles.save}
          onSubmit={(event) => {
            event.preventDefault();
            keep();
          }}
        >
          <label className={styles.name} htmlFor={inputId}>
            <span className={ui.label}>Nombre</span>
            <input
              id={inputId}
              type="text"
              value={draft}
              maxLength={NAME_LIMIT}
              disabled={!canSave}
              placeholder={name}
              enterKeyHint="done"
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <button type="submit" className={ui.ghost} disabled={!canSave || full}>
            {already ? 'Renombrar' : 'Guardar'}
          </button>
        </form>
        {/* Siempre una línea, aunque no diga nada: así la lista no salta. */}
        <p className={`${ui.hint} ${styles.note}`} aria-live="polite">
          {!canSave
            ? 'Todavía no hay nada para guardar.'
            : already
              ? 'Ya está en tu lista.'
              : full
                ? `La lista ya tiene ${SAVED_LIMIT}: borrá algo para guardar ${noun}.`
                : `Guardá ${noun} para volver cuando quieras. Queda en este navegador.`}
        </p>

        {items.length === 0 ? (
          <p className={`${ui.hint} ${styles.empty}`}>Todavía no guardaste nada acá.</p>
        ) : (
          <ul className={styles.list} data-testid="guardados-lista">
            {items.map((item) => {
              const here = item.search === current;
              return (
                <li key={item.search} data-current={here || undefined}>
                  <Link
                    to={item.search ? `${TOOL_PATHS[tool]}?${item.search}` : TOOL_PATHS[tool]}
                    className={styles.open}
                    aria-current={here ? 'page' : undefined}
                    preventScrollReset
                    onClick={() => setOpen(false)}
                  >
                    <strong>{item.name}</strong>
                    <small>{item.detail}</small>
                  </Link>
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`Borrar ${item.name}`}
                    title="Borrar"
                    onClick={() => unsave(tool, item.search)}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </>
  );
}
