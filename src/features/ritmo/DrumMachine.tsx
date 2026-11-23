// Caja de ritmos: una fila de casillas por sonido. Se edita mientras suena, y se pinta arrastrando.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { metronome } from '~/audio/metronome';
import {
  DEFAULT_KIT,
  DRUM_KITS,
  DRUM_STEPS,
  DRUMS,
  drumName,
  randomDrumPattern,
  rowLength,
  SWING,
  type DrumConfig,
  type DrumKit,
  type Step,
} from '~/core/rhythm';
import { DRUM_PRESETS } from '~/data/drums';
import { Button, Field, Segmented, Stepper } from '~/shared/ui/ui';
import ui from '~/shared/ui/ui.module.css';
import styles from './drums.module.css';
import ritmo from './ritmo.module.css';

interface DrumMachineProps {
  config: DrumConfig;
  /** Un cambio chico: una casilla, un volumen. `continuing` es el mismo gesto de pintar. */
  onChange: (config: DrumConfig) => void;
  /** Un cambio que pisa el patrón entero (otro de partida, inventar, borrar): se puede volver. */
  onReplace: (config: DrumConfig) => void;
  onUndo?: () => void;
}

const samePattern = (a: DrumConfig, b: DrumConfig) => JSON.stringify(a.tracks) === JSON.stringify(b.tracks);

/** Cada toque sobre una casilla la pasa al estado que sigue: silencio, golpe, acento y de nuevo silencio. */
const nextStep = (step: Step): Step => ((step + 1) % 3) as Step;

const STEP_NAMES: Record<Step, string> = { 0: 'silencio', 1: 'golpe', 2: 'acento' };

export function DrumMachine({ config, onChange, onReplace, onUndo }: DrumMachineProps) {
  const grid = useRef<HTMLDivElement>(null);
  // En el celular, correr las filas y su volumen quedan guardados hasta que se piden.
  const [adjusting, setAdjusting] = useState(false);
  const kit = config.kit ?? DEFAULT_KIT;

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

  // Pintar: apretar una casilla la pasa al estado que sigue, y pasar por las de al lado de la misma
  // fila las deja igual. La config va en una ref, porque cada paso del gesto llega antes del render.
  const latest = useRef(config);
  useEffect(() => {
    latest.current = config;
  }, [config]);
  const setStep = (lane: number, step: number, value: Step) => {
    const current = latest.current;
    if ((current.tracks[lane]?.[step] ?? 0) === value) return;
    const next = {
      ...current,
      tracks: current.tracks.map((track, index) =>
        index === lane ? track.map((on, i) => (i === step ? value : on)) : track,
      ),
    };
    latest.current = next;
    onChange(next);
  };

  // Lo que se pone se escucha, si el patrón está parado.
  const hear = (lane: number, value: Step) => {
    if (value > 0 && !metronome.getState().running) {
      metronome.preview(DRUMS[lane]!.id, config.levels[lane], value === 2);
    }
  };

  const paint = (lane: number, step: number) => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const value = nextStep(config.tracks[lane]?.[step] ?? 0);
    setStep(lane, step, value);
    hear(lane, value);
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
        index === lane ? row.map((_, i) => track[(i - by + steps) % steps] ?? 0) : row,
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
  // Lo que no es el patrón se queda como estaba al cambiar de patrón: la batería, los volúmenes, lo callado.
  const keep = { levels: config.levels, muted: config.muted, ...(config.kit && { kit: config.kit }) };

  return (
    <div className={styles.drums} data-testid="drum-machine">
      <div className={ritmo.presets} role="group" aria-label="Ritmos de partida">
        {DRUM_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="mini"
            ariaPressed={preset.id === presetId}
            onClick={() => onReplace({ ...preset.config, ...keep })}
          >
            {preset.name}
          </Button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <Field label="Sonido" as="div">
          <Segmented<DrumKit>
            label="Batería"
            value={kit}
            options={DRUM_KITS.map((option) => ({ value: option.id, label: option.name }))}
            onChange={(value) => {
              const { kit: _previous, ...rest } = config;
              onChange(value === DEFAULT_KIT ? rest : { ...rest, kit: value });
              if (!metronome.getState().running) metronome.preview('bombo', config.levels[0], true);
            }}
          />
        </Field>
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

      <div className={styles.actions}>
        <Button
          id="invent-drums"
          onClick={() =>
            onReplace({
              ...randomDrumPattern(Math.random, config.bpm, config.steps),
              ...keep,
              swing: config.swing,
            })
          }
        >
          Inventar
        </Button>
        <Button
          ariaLabel="Borrar todos los golpes"
          onClick={() => onReplace({ ...config, tracks: config.tracks.map((track) => track.map(() => 0)) })}
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

      <div className={styles.gridHead}>
        <p className={`${ui.hint} ${styles.hint}`}>
          Tocá una casilla para poner un golpe; otra vez, para acentuarlo; otra, para sacarlo. Arrastrando se
          pintan varias.
        </p>
        <div className={styles.adjustToggle}>
          <Button variant="mini" ariaPressed={adjusting} onClick={() => setAdjusting(!adjusting)}>
            Ajustar filas
          </Button>
        </div>
      </div>

      <div
        ref={grid}
        className={styles.tracks}
        data-adjusting={adjusting}
        style={
          {
            '--columns': config.steps > 16 ? config.steps / 2 : config.steps,
            '--row': rowLength(config.steps),
          } as CSSProperties
        }
      >
        {DRUMS.map((drum, lane) => {
          const silent = !!muted[lane];
          const name = drumName(drum.id, kit);
          const lower = name.toLowerCase();
          return (
            <div key={drum.id} className={styles.track} data-track={drum.id} data-muted={silent}>
              <button
                type="button"
                className={styles.voice}
                title={`Escuchar ${lower}`}
                onClick={() => metronome.preview(drum.id, config.levels[lane])}
              >
                {/* El abierto va debajo del hi-hat: alcanza con decir que es el abierto. */}
                {drum.id === 'abierto' ? 'Abierto' : name}
              </button>
              <div className={styles.mute}>
                <Button
                  variant="mini"
                  ariaPressed={silent}
                  ariaLabel={`Callar ${lower}`}
                  title="Callar la fila"
                  onClick={() => toggleMute(lane)}
                >
                  {silent ? 'Callada' : 'Callar'}
                </Button>
              </div>
              <div className={styles.trackTools}>
                <Button
                  variant="mini"
                  ariaLabel={`Correr ${lower} un paso antes`}
                  title="Correr un paso antes"
                  onClick={() => shift(lane, -1)}
                >
                  ←
                </Button>
                <Button
                  variant="mini"
                  ariaLabel={`Correr ${lower} un paso después`}
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
                  aria-label={`Volumen de ${lower}`}
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
                  const value = config.tracks[lane]?.[step] ?? 0;
                  return (
                    <button
                      key={step}
                      type="button"
                      className={styles.step}
                      data-step={step}
                      data-beat={step % 4 === 0}
                      data-level={value}
                      aria-pressed={value > 0}
                      data-lane={lane}
                      aria-label={`${name}, paso ${step + 1}`}
                      title={STEP_NAMES[value]}
                      onPointerDown={paint(lane, step)}
                      // Con el teclado no hay puntero: el clic llega solo (detail 0).
                      onClick={(event) => {
                        if (event.detail !== 0) return;
                        const next = nextStep(value);
                        setStep(lane, step, next);
                        hear(lane, next);
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
