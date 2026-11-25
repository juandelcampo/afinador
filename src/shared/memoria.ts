// Cada herramienta se acuerda de dónde la dejaste: la afinación, la escala, la forma o el ritmo que
// tenías. No es estado compartido: cada una guarda su propia URL, y entrar sin nada en la URL (desde la
// barra, la portada o abriendo la app de nuevo) te devuelve a esa. Un link con algo en la URL manda.
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { TOOL_PATHS, useSettings, type ToolKey } from './settings';
import { useHydrated } from './useHydrated';

const TOOLS = Object.entries(TOOL_PATHS) as [ToolKey, string][];

/** De qué herramienta es una ruta: /afinador/dadgad es del Afinador, / no es de ninguna. */
export function toolOf(pathname: string): ToolKey | null {
  const clean = pathname.replace(/\/+$/, '');
  return TOOLS.find(([, path]) => clean === path || clean.startsWith(`${path}/`))?.[0] ?? null;
}

/** El link a una herramienta: adonde la dejaste, o su entrada si nunca la usaste. */
export function useToolHref(tool: ToolKey): string {
  const hydrated = useHydrated();
  const last = useSettings((s) => s.last[tool]);
  // La página estática no sabe lo de este navegador: el link de siempre hasta hidratar.
  return hydrated && last ? last : TOOL_PATHS[tool];
}

/**
 * Lo monta el marco de la app: anota dónde está cada herramienta y, si se entra al Afinador sin
 * afinación, vuelve a la última. Las demás se restauran antes de arrancar React (`RESTORE_SCRIPT`).
 */
export function useRememberPlace() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const remember = useSettings((s) => s.remember);
  const hydrated = useHydrated();
  const previous = useRef<ToolKey | null | undefined>(undefined);

  useEffect(() => {
    if (!hydrated) return;
    const tool = toolOf(pathname);
    const arrived = tool !== previous.current;
    previous.current = tool;
    if (!tool) return;
    const last = useSettings.getState().last[tool];
    // Solo al llegar: si ya estabas en el Afinador, nada te saca de donde estás.
    if (arrived && tool === 'afinador' && pathname.replace(/\/+$/, '') === TOOL_PATHS.afinador && !search) {
      if (last && last !== TOOL_PATHS.afinador) {
        navigate(last, { replace: true, preventScrollReset: true });
        return;
      }
    }
    remember(tool, pathname.replace(/\/+$/, '') + search);
  }, [hydrated, pathname, search, navigate, remember]);
}

/**
 * Corre antes que React: si se abre una herramienta sin nada después del ?, pone en la URL lo último
 * que tenía. Las páginas no leen la URL hasta hidratar, así que el HTML estático sigue coincidiendo.
 * El Afinador no entra acá: su afinación va en la ruta y la página estática de cada una es distinta.
 */
export const RESTORE_SCRIPT = `try{var l=location,p=l.pathname.replace(/\\/+$/,''),k={'/armonia':'armonia','/escalas':'escalas','/inversiones':'inversiones','/acorde':'acorde','/tonalidad':'tonalidad','/ritmo':'ritmo'}[p];if(k&&!l.search){var h=JSON.parse(localStorage.getItem('afinador')).state.last[k];if(typeof h==='string'&&h.indexOf(p+'?')===0&&!/#/.test(h))history.replaceState(history.state,'',h+l.hash)}}catch(e){}`;
