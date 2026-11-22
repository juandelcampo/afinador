// Un modal por vez: en el celular sube desde abajo, en pantallas anchas queda centrado.
// Usa el <dialog> nativo: Esc lo cierra y lo de atrás queda inerte mientras está abierto.
import { useEffect, useRef, type ReactNode } from 'react';
import styles from './ui.module.css';

export function Sheet({
  open,
  title,
  onClose,
  children,
  tools,
  testId,
  fixed,
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Botones chicos que van en la cabecera, junto al cierre. */
  tools?: ReactNode;
  testId?: string;
  /** Siempre del mismo alto: para los que tienen pestañas, así no cambia de tamaño al pasar de una a otra. */
  fixed?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      data-testid={testId}
      data-fixed={fixed || undefined}
      onClose={onClose}
      // Tocar afuera de la hoja (el fondo oscuro) también la cierra.
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      {open && (
        <div className={styles.sheetBody}>
          <header className={styles.sheetHead}>
            <h2>{title}</h2>
            {tools}
            <button type="button" className={styles.sheetClose} onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
