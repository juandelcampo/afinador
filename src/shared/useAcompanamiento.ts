// La vuelta sonando con su ritmo de fondo, igual en Armonía y en Escalas. Manda el ritmo: su tempo y los
// pulsos de su compás. Sin ritmo, la vuelta lleva su propio tempo. Al irse de la página para todo.
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { metronome } from '~/audio/metronome';
import { pulseGrid, QUARTER_GRID, type RhythmConfig } from '~/core/rhythm';
import { fondoToParam } from './RitmoDeFondo';
import { TEMPO_RANGE } from './settings';
import { useVuelta, type Feel, type Step } from './useVuelta';

/** Un tempo que entra en el deslizador: el de un ritmo puede venir de más lejos. */
export const clampTempo = (bpm: number) =>
  Math.min(TEMPO_RANGE.max, Math.max(TEMPO_RANGE.min, Math.round(bpm)));

export function useAcompanamiento({
  steps,
  a4,
  feel,
  fondo,
  writeFondo,
}: {
  steps: Step[];
  a4: number;
  feel: Feel;
  /** El ritmo de fondo, que viene en la URL. */
  fondo: RhythmConfig | null;
  /** Escribe el ritmo en la URL (null lo saca). */
  writeFondo: (config: RhythmConfig | null) => void;
}) {
  const [ownTempo, setOwnTempo] = useState(80);
  const tempo = fondo ? clampTempo(fondo.bpm) : ownTempo;
  const grid = useMemo(() => (fondo ? (bar: number) => pulseGrid(fondo, bar) : () => QUARTER_GRID), [fondo]);
  const player = useVuelta({ steps, a4, tempo, feel, grid });

  /** Con ritmo, arranca el ritmo y la vuelta entra en su primer golpe: el primer acorde cae en el uno. */
  const play = () => {
    player.stop();
    metronome.stop();
    if (!fondo) return player.start();
    metronome.setConfig({ ...fondo, bpm: tempo });
    metronome.start();
    player.start(metronome.startBeat());
  };
  const stop = () => {
    player.stop();
    metronome.stop();
  };
  const setTempo = (value: number) => (fondo ? writeFondo({ ...fondo, bpm: value }) : setOwnTempo(value));

  /** Elegir un ritmo lo hace sonar con la vuelta; sacarlo deja la vuelta sola, sonando si sonaba. */
  const playNext = useRef(false);
  const chooseFondo = (config: RhythmConfig | null) => {
    playNext.current = steps.length > 0 && (config !== null || player.running);
    // Sin ritmo, la vuelta sigue al tempo que traía el ritmo, al paso del deslizador.
    if (!config && fondo) setOwnTempo(clampTempo(Math.round(tempo / TEMPO_RANGE.step) * TEMPO_RANGE.step));
    writeFondo(config && { ...config, bpm: clampTempo(config.bpm) });
  };

  // Cambió el ritmo (no el tempo): la vuelta y el ritmo vuelven a empezar juntos, para no quedar corridos.
  const fondoPattern = fondo && fondoToParam({ ...fondo, bpm: 0 });
  const restart = useEffectEvent(() => {
    if (playNext.current || player.running) play();
    playNext.current = false;
  });
  const lastPattern = useRef(fondoPattern);
  useEffect(() => {
    if (lastPattern.current === fondoPattern) return;
    lastPattern.current = fondoPattern;
    restart();
  }, [fondoPattern]);
  // El tempo cambia sin cortar: el ritmo lo lleva y la vuelta lo sigue.
  useEffect(() => {
    if (fondo && metronome.getState().running) metronome.setConfig({ ...fondo, bpm: tempo });
  }, [fondo, tempo]);
  // Si la vuelta deja de sonar (se vació, se tocó una de muestra), el ritmo también. Y al irse, para.
  useEffect(() => {
    if (!player.running) metronome.stop();
  }, [player.running]);
  useEffect(() => () => metronome.stop(), []);

  /** Cuántos pulsos tiene el compás del ritmo, para ver cuánto dura cada acorde (el mutante cambia). */
  const barPulses = fondo && fondo.mode !== 'mutante' ? pulseGrid(fondo, 0).pulses.length : null;

  return {
    running: player.running,
    /** El acorde de la vuelta que está sonando. */
    current: player.current,
    play,
    stop,
    strum: player.strum,
    preview: player.preview,
    tempo,
    setTempo,
    chooseFondo,
    barPulses,
  };
}
