// Preferencias del afinador. Se guardan en este navegador.
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Notation } from '~/core/notes';
import { TUNINGS } from '~/data/tunings';
import type { FigureKind } from '~/core/figure';
import { DEFAULT_DRONE, sanitizeDrone, type DroneSound } from '~/core/drone';

export type TunerMode = 'guided' | 'auto';
export type PlayStyle = 'arp' | 'strum';
/** El tema de la pantalla: el del sistema hasta que se elige uno. */
export type Theme = 'system' | 'light' | 'dark';

/** Cómo suena Escuchar: arpegio o rasgueo, y el patrón elegido para cada uno. */
export interface ListenPrefs {
  style: PlayStyle;
  patterns: Record<PlayStyle, string>;
  /** Pulsos por minuto. */
  tempo: number;
}

export const TEMPO_RANGE = { min: 40, max: 160, step: 5 };

interface Settings {
  notation: Notation;
  a4: number;
  volume: number;
  tunerMode: TunerMode;
  listen: ListenPrefs;
  /** Cómo suena un acorde suelto: rasgueado o arpegiado, nota por nota. */
  chordStyle: PlayStyle;
  /** Con qué suena el metrónomo de Ritmo. */
  /** Cómo se dibuja el ritmo: como polígono o como estrella. */
  rhythmFigure: FigureKind;
  theme: Theme;
  /** Cómo suena el drone de Escalas: se elige una vez y vale para cualquier escala. */
  drone: DroneSound;
  /** Ids de las afinaciones favoritas, en el orden en que se marcaron. */
  favorites: string[];
  toggleFavorite: (id: string) => void;
  set: (patch: Partial<Omit<Settings, 'set' | 'toggleFavorite'>>) => void;
}

const DEFAULT_VOLUME = 0.68;

const DEFAULT_LISTEN: ListenPrefs = { style: 'arp', patterns: { arp: 'up', strum: 'single' }, tempo: 84 };

const isVolume = (value: unknown): value is number => typeof value === 'number' && value >= 0 && value <= 1;

const memoryStorage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };

/** Lo guardado puede venir de otra versión o estar corrupto: lo que no sirve se descarta. */
export function sanitize(
  saved: Partial<Settings> & { volumes?: Record<string, unknown> },
): Partial<Settings> {
  const clean: Partial<Settings> = {};
  if (saved.notation === 'letters' || saved.notation === 'solfege') clean.notation = saved.notation;
  if (typeof saved.a4 === 'number' && saved.a4 >= 415 && saved.a4 <= 466) clean.a4 = saved.a4;
  if (isVolume(saved.volume)) {
    clean.volume = saved.volume;
  } else if (saved.volumes && typeof saved.volumes === 'object') {
    // Antes había un volumen general encima del instrumento: se juntan sin que cambie cuánto suena.
    const { master, instrumento } = saved.volumes;
    if (isVolume(master) && isVolume(instrumento)) clean.volume = master * instrumento;
  }
  if (saved.tunerMode === 'guided' || saved.tunerMode === 'auto') clean.tunerMode = saved.tunerMode;
  if (saved.listen && typeof saved.listen === 'object') {
    // Los nombres de patrón se validan en el escuchador, que conoce la lista.
    const { style, patterns, tempo } = saved.listen;
    clean.listen = {
      style: style === 'arp' || style === 'strum' ? style : DEFAULT_LISTEN.style,
      patterns: {
        arp: typeof patterns?.arp === 'string' ? patterns.arp : DEFAULT_LISTEN.patterns.arp,
        strum: typeof patterns?.strum === 'string' ? patterns.strum : DEFAULT_LISTEN.patterns.strum,
      },
      tempo:
        typeof tempo === 'number' && tempo >= TEMPO_RANGE.min && tempo <= TEMPO_RANGE.max
          ? tempo
          : DEFAULT_LISTEN.tempo,
    };
  }
  if (saved.chordStyle === 'arp' || saved.chordStyle === 'strum') clean.chordStyle = saved.chordStyle;
  if (saved.rhythmFigure === 'poligono' || saved.rhythmFigure === 'estrella')
    clean.rhythmFigure = saved.rhythmFigure;
  if (saved.theme === 'system' || saved.theme === 'light' || saved.theme === 'dark')
    clean.theme = saved.theme;
  if (saved.drone !== undefined) clean.drone = sanitizeDrone(saved.drone);
  if (Array.isArray(saved.favorites)) {
    // Una afinación que ya no está en el catálogo se olvida, y ninguna aparece dos veces.
    const known = new Set(TUNINGS.map((tuning) => tuning.id));
    clean.favorites = [...new Set(saved.favorites)].filter(
      (id): id is string => typeof id === 'string' && known.has(id),
    );
  }
  return clean;
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      notation: 'letters',
      a4: 440,
      volume: DEFAULT_VOLUME,
      tunerMode: 'auto',
      listen: { ...DEFAULT_LISTEN, patterns: { ...DEFAULT_LISTEN.patterns } },
      chordStyle: 'strum',
      rhythmFigure: 'poligono',
      theme: 'system',
      drone: { ...DEFAULT_DRONE },
      favorites: [],
      toggleFavorite: (id) =>
        set(({ favorites }) => ({
          favorites: favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id],
        })),
      set: (patch) => set(patch),
    }),
    {
      name: 'afinador',
      version: 1,
      storage: createJSONStorage(() => (typeof window === 'undefined' ? memoryStorage : window.localStorage)),
      partialize: ({ set: _set, toggleFavorite: _toggle, ...rest }) => rest,
      merge: (saved, current) => ({ ...current, ...sanitize((saved ?? {}) as Partial<Settings>) }),
    },
  ),
);

/**
 * Las favoritas solo existen en este navegador: el HTML prerenderizado sale sin ellas y aparecen al
 * montar, para que la hidratación no encuentre diferencias.
 */
export function useFavorites(): string[] {
  const favorites = useSettings((s) => s.favorites);
  // Al hidratar vale la versión del servidor (false); después, la del navegador.
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  return mounted ? favorites : NO_FAVORITES;
}

const NO_FAVORITES: string[] = [];
const noSubscribe = () => () => undefined;
