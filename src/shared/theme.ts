// El tema de la pantalla: claro u oscuro. Hasta que se elige uno en la barra, sigue al del sistema.
import { useEffect, useSyncExternalStore } from 'react';
import { useSettings } from '~/shared/settings';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeSystem(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const systemIsDark = () => window.matchMedia(DARK_QUERY).matches;
const noSubscribe = () => () => undefined;

/**
 * El tema que se ve y cómo cambiarlo. Lo elegido se escribe en `data-theme` de `<html>`, que es lo que mira
 * el CSS. El HTML prerenderizado no sabe nada del navegador: al hidratar vale claro y después, lo de verdad.
 */
export function useTheme(): [shown: 'light' | 'dark', choose: (theme: 'light' | 'dark') => void] {
  const theme = useSettings((s) => s.theme);
  const set = useSettings((s) => s.set);
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const dark = useSyncExternalStore(subscribeSystem, systemIsDark, () => false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  const shown = !mounted ? 'light' : theme === 'system' ? (dark ? 'dark' : 'light') : theme;
  return [shown, (next) => set({ theme: next })];
}
