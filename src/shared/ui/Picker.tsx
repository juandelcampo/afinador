// Elegir de una lista: el campo muestra lo elegido y, al tocarlo, se abre la lista con el estilo del listado de
// afinaciones del Afinador: grupos que se pliegan con su barra negra, y cada fila con su nombre y su detalle.
// Usa el popover nativo: Esc y tocar afuera lo cierran solos, y queda encima de todo sin que nada lo recorte.
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Field } from './ui';
import styles from './ui.module.css';

export interface PickerOption {
  value: string;
  label: string;
  /** La segunda línea de la fila: las notas de la afinación, lo que dice la escala. */
  detail?: string;
}

export interface PickerGroup {
  id: string;
  name: string;
  options: PickerOption[];
}

const MARGIN = 8;

export function Picker({
  id,
  label,
  value,
  groups,
  options,
  onChange,
  wide,
  compact,
  ariaLabel,
  columns,
  showDetail,
}: {
  id?: string;
  /** El rótulo del campo: MUNDO, TÓNICA. */
  label: string;
  value: string;
  /** La lista en grupos que se pliegan, o `options` si es una sola. */
  groups?: PickerGroup[];
  options?: PickerOption[];
  onChange: (value: string) => void;
  /** El campo principal de la fila (la afinación): toma más lugar. */
  wide?: boolean;
  /** Sin rótulo y chico, para ir adentro de una tarjeta. */
  compact?: boolean;
  /** Lo que dice el lector de pantalla, si no alcanza con el rótulo. */
  ariaLabel?: string;
  /** Opciones cortas (las doce tónicas) en una grilla de esta cantidad de columnas. */
  columns?: number;
  /** Mostrar también el detalle de lo elegido en el campo, como las notas de la afinación. */
  showDetail?: boolean;
}) {
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const all: PickerGroup[] = groups ?? [{ id: '', name: '', options: options ?? [] }];
  const current = all.flatMap((group) => group.options).find((option) => option.value === value);
  /** Los grupos abiertos: al abrir la lista, solo el que tiene lo elegido. */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /** La lista va pegada abajo del campo, o arriba si abajo no hay lugar, y mide lo mismo que el campo: no se
   *  escapa por los costados. */
  const place = () => {
    const button = trigger.current;
    const list = panel.current;
    if (!button || !list) return;
    const rect = button.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - MARGIN;
    const above = rect.top - MARGIN;
    const up = below < 260 && above > below;
    list.style.width = `${rect.width}px`;
    list.style.left = `${rect.left}px`;
    // Los bordes se pisan: la lista sale del campo, no flota separada.
    list.style.top = up ? 'auto' : `${rect.bottom - 3}px`;
    list.style.bottom = up ? `${window.innerHeight - rect.top - 3}px` : 'auto';
    list.style.maxHeight = `${Math.min(up ? above : below, 560)}px`;
  };

  useEffect(() => {
    const list = panel.current;
    if (!list) return;
    // Se ubica antes de mostrarse: `toggle` llega después del primer cuadro, y la lista se veía un instante
    // arriba a la izquierda antes de saltar abajo del campo.
    const onBeforeToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'open') place();
    };
    const onToggle = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === 'open';
      setOpen(isOpen);
      if (!isOpen) return;
      const home = all.find((group) => group.options.some((option) => option.value === value));
      setExpanded(new Set(home ? [home.id] : []));
      // Lo elegido a la vista y con el foco: las flechas siguen desde ahí.
      requestAnimationFrame(() => {
        const chosen = list.querySelector<HTMLElement>('[aria-current="true"]');
        chosen?.scrollIntoView({ block: 'nearest' });
        (chosen ?? list.querySelector<HTMLElement>('button'))?.focus();
      });
    };
    list.addEventListener('beforetoggle', onBeforeToggle);
    list.addEventListener('toggle', onToggle);
    return () => {
      list.removeEventListener('beforetoggle', onBeforeToggle);
      list.removeEventListener('toggle', onToggle);
    };
  });

  // Abierta, la lista sigue al campo si la página se mueve o cambia de tamaño.
  useEffect(() => {
    if (!open) return;
    const follow = () => place();
    window.addEventListener('resize', follow);
    window.addEventListener('scroll', follow, true);
    return () => {
      window.removeEventListener('resize', follow);
      window.removeEventListener('scroll', follow, true);
    };
  });

  const choose = (next: string) => {
    panel.current?.hidePopover();
    trigger.current?.focus();
    if (next !== value) onChange(next);
  };

  const toggleGroup = (groupId: string) =>
    setExpanded((before) => {
      const next = new Set(before);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });

  /** Con las flechas se recorre la lista, grupos incluidos. */
  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (!step || !panel.current) return;
    event.preventDefault();
    const buttons = [...panel.current.querySelectorAll<HTMLElement>('button')].filter(
      (button) => button.offsetParent !== null,
    );
    const at = buttons.indexOf(document.activeElement as HTMLElement);
    buttons[Math.min(Math.max(at + step, 0), buttons.length - 1)]?.focus();
  };

  const button = (
    <button
      ref={trigger}
      id={id}
      type="button"
      className={styles.pickerTrigger}
      data-compact={compact || undefined}
      data-value={value}
      popoverTarget={panelId}
      aria-expanded={open}
      aria-label={`${ariaLabel ?? label}: ${current?.label ?? ''}`}
    >
      <span className={styles.pickerValue}>
        <strong>{current?.label}</strong>
        {showDetail && current?.detail && <small>{current.detail}</small>}
      </span>
      <span className={styles.pickerArrow} aria-hidden="true">
        {open ? '▴' : '▾'}
      </span>
    </button>
  );

  const list = (
    <div
      ref={panel}
      id={panelId}
      popover="auto"
      role="dialog"
      aria-label={ariaLabel ?? label}
      className={styles.pickerPanel}
      onKeyDown={onKeyDown}
    >
      {all.map((group) => {
        const isOpen = !group.name || expanded.has(group.id);
        const hasCurrent = group.options.some((option) => option.value === value);
        return (
          <div key={group.id}>
            {group.name && (
              <h3 className={styles.listTitle}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  data-current={hasCurrent || undefined}
                  onClick={() => toggleGroup(group.id)}
                >
                  <span>{group.name}</span>
                  <span className={styles.listCount}>{group.options.length}</span>
                  <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
              </h3>
            )}
            <ul
              className={styles.listOptions}
              hidden={!isOpen}
              style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
              data-columns={columns || undefined}
            >
              {group.options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className={styles.listItem}
                    data-option={option.value}
                    aria-current={option.value === value || undefined}
                    onClick={() => choose(option.value)}
                  >
                    <strong>{option.label}</strong>
                    {option.detail && <small>{option.detail}</small>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );

  if (compact) {
    return (
      <>
        {button}
        {list}
      </>
    );
  }
  return (
    <Field label={label} as="div" wide={wide}>
      {button}
      {list}
    </Field>
  );
}
