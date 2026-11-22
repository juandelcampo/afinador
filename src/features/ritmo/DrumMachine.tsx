// Caja de ritmos: una fila de casillas por sonido. Se edita mientras suena, y se pinta arrastrando.
import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react';
import { metronome } from '~/audio/metronome';
import { DRUMS, DRUM_STEPS, randomDrumPattern, rowLength, SWING, type DrumConfig } from '~/core/rhythm';
import { DRUM_PRESETS } from '~/data/drums';
import { Button, Field, Stepper } from '~/shared/ui/ui';
import styles from './ritmo.module.css';

interface DrumMachineProps {
  config: DrumConfig;
  /** Un cambio chico: una casilla, un volumen. `continuing` es el mismo gesto de pintar. */
  onChange: (config: DrumConfig) => void;
  /** Un cambio que pisa el patrón entero (otro de partida, inventar, borrar): se puede volver. */
  onReplace: (config: DrumConfig) => void;
  onUndo?: () => void;
}

const samePattern = (a: DrumConfig, b: DrumConfig) => JSON.stringify(a.tracks) === JSON.stringify(b.tracks);

export function DrumMachine({ config, onChange, onReplace, onUndo }: DrumMachineProps) {
  const grid = useRef<HTMLDivElement>(null);

  // Marca la columna que suena leyendo el reloj cuadro a cuadro, sin renders.
  useEffect(() => {
    let frame = 0;
    let previous: number | null = null;
    const draw = () => {
      const step = metronome.playhead()?.step ?? null;
      if (step !== previous && grid.current) {
        previous = step;
        grid.current.querySelectorAll('[data-now]').forEach((cell) => cell.removeAttribute('data-now'));
        if (step !== null) {
          grid.current
            .querySelectorAll(`[data-step="${step}"]`)
            .forEach((cell) => cell.setAttribute('data-now', ''));
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Pintar: apretar una casilla la prende (o la apaga) y pasar por las de al lado de la misma fila
  // hace lo mismo. La config va en una ref, porque cada paso del gesto llega antes del render.
  const latest = useRef(config);
  useEffect(() => {
    latest.current = config;
  }, [config]);
  const setStep = (lane: number, step: number, value: boolean) => {
    const current = latest.current;
    if ((current.tracks[lane]?.[step] ?? false) === value) return;
    const next = {
      ...current,
      tracks: current.tracks.map((track, index) =>
        index === lane ? track.map((on, i) => (i === step ? value : on)) : track,
      ),
    };
    latest.current = next;
    onChange(next);
  };

  const paint = (lane: number, step: number) => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const value = !(config.tracks[lane]?.[step] ?? false);
    setStep(lane, step, value);
    // Prender una casilla con el patrón parado la hace sonar: se escucha qué se está poniendo.
    if (value && !metronome.getState().running) metronome.preview(DRUMS[lane]!.id, config.levels[lane]);
    const pointer = event.pointerId;
    const move = (e: globalThis.PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-lane]');
      if (cell && Number(cell.dataset.lane) === lane) setStep(lane, Number(cell.dataset.step), value);
    };
    const stop = (e: globalThis.PointerEvent) => {
      if (e.pointerId !== pointer) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  };

  /** Corre la fila un paso: lo que se va por un borde entra por el otro. */
  const shift = (lane: number, by: 1 | -1) => {
    const track = config.tracks[lane] ?? [];
    const steps = config.steps;
    onChange({
      ...config,
      tracks: config.tracks.map((row, index) =>
        index === lane ? row.map((_, i) => track[(i - by + steps) % steps] ?? false) : row,
      ),
    });
  };

  const resize = (direction: 1 | -1) => {
    const index = DRUM_STEPS.indexOf(config.steps as (typeof DRUM_STEPS)[number]);
    const steps = DRUM_STEPS[Math.min(DRUM_STEPS.length - 1, Math.max(0, index + direction))]!;
    if (steps === config.steps) return;
    // Al agrandar se repite lo que ya había, así un patrón de 8 pasa a 16 sonando igual.
    onChange({
      ...config,
      steps,
      tracks: config.tracks.map((track) =>
        Array.from({ length: steps }, (_, i) => (i < config.steps ? track[i]! : track[i % config.steps]!)),
      ),
    });
  };

  const presetId = DRUM_PRESETS.find((preset) => samePattern(preset.config, config))?.id;
  const swing = config.swing ?? SWING.straight;
  const muted = config.muted ?? [];
  const toggleMute = (lane: number) =>
    onChange({
      ...config,
      muted: DRUMS.map((_, index) => (index === lane ? !muted[index] : !!muted[index])),
    });

  return (
    <div className={styles.drums} data-testid="drum-machine">
      <div className={styles.presets} role="group" aria-label="Ritmos de partida">
        {DRUM_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="mini"
            ariaPressed={preset.id === presetId}
            onClick={() => onReplace({ ...preset.config, levels: config.levels, muted: config.muted })}
          >
            {preset.name}
          </Button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.actions}>
          <Button
            id="invent-drums"
            onClick={() =>
              onReplace({
                ...randomDrumPattern(Math.random, config.bpm, config.steps),
                levels: config.levels,
                swing: config.swing,
                muted: config.muted,
              })
            }
          >
            Inventar
          </Button>
          <Button
            ariaLabel="Borrar todos los golpes"
            onClick={() =>
              onReplace({ ...config, tracks: config.tracks.map((track) => track.map(() => false)) })
            }
          >
            Borrar
          </Button>
          <Button
            id="undo-drums"
            onClick={() => onUndo?.()}
            disabled={!onUndo}
            ariaLabel="Volver al patrón anterior"
          >
            ↩ Volver
          </Button>
        </div>
        <Field label="Pasos" as="div">
          <Stepper label="pasos" value={config.steps} onDown={() => resize(-1)} onUp={() => resize(1)} />
        </Field>
        <Field
          label={
            <>
              Swing: <output data-testid="swing">{swing === SWING.straight ? 'parejo' : swing}</output>
            </>
          }
          className={styles.swing}
        >
          <input
            type="range"
            min={SWING.straight}
            max={SWING.max}
            aria-label="Swing"
            value={swing}
            disabled={config.steps % 2 === 1}
            onChange={(event) => onChange({ ...config, swing: Number(event.target.value) })}
          />
        </Field>
      </div>

      <div
        ref={grid}
        className={styles.tracks}
        style={
          {
            '--columns': config.steps > 16 ? config.steps / 2 : config.steps,
            '--row': rowLength(config.steps),
          } as CSSProperties
        }
      >
        {DRUMS.map((drum, lane) => {
          const silent = !!muted[lane];
          return (
            <div key={drum.id} className={styles.track} data-track={drum.id} data-muted={silent}>
              <div className={styles.trackHead}>
                <button
                  type="button"
                  className={styles.voice}
                  title={`Escuchar ${drum.name.toLowerCase()}`}
                  onClick={() => metronome.preview(drum.id, config.levels[lane])}
                >
                  {drum.name}
                </button>
                <Button
                  variant="mini"
                  ariaPressed={silent}
                  ariaLabel={`Callar ${drum.name.toLowerCase()}`}
                  title="Callar la fila"
                  onClick={() => toggleMute(lane)}
                >
                  {silent ? 'Callada' : 'Callar'}
                </Button>
                <Button
                  variant="mini"
                  ariaLabel={`Correr ${drum.name.toLowerCase()} un paso antes`}
                  title="Correr un paso antes"
                  onClick={() => shift(lane, -1)}
                >
                  ←
                </Button>
                <Button
                  variant="mini"
                  ariaLabel={`Correr ${drum.name.toLowerCase()} un paso después`}
                  title="Correr un paso después"
                  onClick={() => shift(lane, 1)}
                >
                  →
                </Button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((config.levels[lane] ?? 0.8) * 100)}
                  aria-label={`Volumen de ${drum.name.toLowerCase()}`}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      levels: config.levels.map((level, index) =>
                        index === lane ? Number(event.target.value) / 100 : level,
                      ),
                    })
                  }
                />
              </div>
              <div className={styles.steps}>
                {Array.from({ length: config.steps }, (_, step) => {
                  const on = config.tracks[lane]?.[step] ?? false;
                  return (
                    <button
                      key={step}
                      type="button"
                      className={styles.step}
                      data-step={step}
                      data-beat={step % 4 === 0}
                      aria-pressed={on}
                      data-lane={lane}
                      aria-label={`${drum.name}, paso ${step + 1}`}
                      onPointerDown={paint(lane, step)}
                      // Con el teclado no hay puntero: el clic llega solo (detail 0).
                      onClick={(event) => {
                        if (event.detail === 0) setStep(lane, step, !on);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
