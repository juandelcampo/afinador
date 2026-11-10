// Preferencias del afinador. Se guardan en este navegador.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Notation } from '~/core/notes';

export type TunerMode = 'guided' | 'auto';
export type ChannelId = 'master' | 'instrumento';

interface Settings {
  notation: Notation;
  a4: number;
  volumes: Record<ChannelId, number>;
  tunerMode: TunerMode;
  set: (patch: Partial<Omit<Settings, 'set'>>) => void;
}

const DEFAULT_VOLUMES: Record<ChannelId, number> = { master: 0.85, instrumento: 0.8 };

const memoryStorage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };

/** Lo guardado puede venir de otra versión o estar corrupto: lo que no sirve se descarta. */
function sanitize(saved: Partial<Settings>): Partial<Settings> {
  const clean: Partial<Settings> = {};
  if (saved.notation === 'letters' || saved.notation === 'solfege') clean.notation = saved.notation;
  if (typeof saved.a4 === 'number' && saved.a4 >= 415 && saved.a4 <= 466) clean.a4 = saved.a4;
  if (saved.volumes && typeof saved.volumes === 'object') {
    const volumes = { ...DEFAULT_VOLUMES };
    for (const channel of Object.keys(volumes) as ChannelId[]) {
      const value = saved.volumes[channel];
      if (typeof value === 'number' && value >= 0 && value <= 1) volumes[channel] = value;
    }
    clean.volumes = volumes;
  }
  if (saved.tunerMode === 'guided' || saved.tunerMode === 'auto') clean.tunerMode = saved.tunerMode;
  return clean;
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      notation: 'letters',
      a4: 440,
      volumes: { ...DEFAULT_VOLUMES },
      tunerMode: 'auto',
      set: (patch) => set(patch),
    }),
    {
      name: 'afinador',
      version: 1,
      storage: createJSONStorage(() => (typeof window === 'undefined' ? memoryStorage : window.localStorage)),
      partialize: ({ set: _set, ...rest }) => rest,
      merge: (saved, current) => ({ ...current, ...sanitize((saved ?? {}) as Partial<Settings>) }),
    },
  ),
);
