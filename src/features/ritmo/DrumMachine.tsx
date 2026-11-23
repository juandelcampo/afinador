// Caja de ritmos: una fila de casillas por sonido. Se edita mientras suena, y se pinta arrastrando.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { metronome } from '~/audio/metronome';
import {
  DEFAULT_KIT,
  DRUM_KITS,
  DRUM_STEPS,
  DRUMS,
  drumName,
  laneSounds,
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
  onChange: (config: DrumConfig) => void;
}

const samePattern = (a: DrumConfig, b: DrumConfig) => JSON.stringify(a.tracks) === JSON.stringify(b.tracks);

/**
 * Lo que pone un clic. Con el mouse, el izquierdo pone un golpe y, sobre un golpe, lo pasa a acento y de
 * vuelta (el derecho borra). Con el dedo no hay botón derecho: cada toque pasa al estado que sigue, y del
 * acento vuelve al silencio.
 */
const nextStep = (step: Step, touch: boolean): Step =>
  touch ? (((step + 1) % 3) as Step) : step === 1 ? 2 : 1;

const STEP_NAMES: Record<Step, string> = { 0: 'silencio', 1: 'golpe', 2: 'acento' };

/** Cuántos cambios se pueden deshacer. */
const HISTORY = 50;

export function DrumMachine({ config, onChange }: DrumMachineProps) {
  const grid = useRef<HTMLDivElement>(null);
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

  // La config va en una ref, porque cada paso de un gesto de pintar llega antes del render.
  const latest = useRef(config);
  useEffect(() => {
    latest.current = config;
  }, [config]);

  // Deshacer y rehacer: cada cambio del patrón (un gesto de pintar entero, un ritmo de partida, los pasos,
  // la batería) guarda cómo estaba. El tempo, los volúmenes, el swing, el mute y el solo no cuentan.
  const [history, setHistory] = useState<{ past: DrumConfig[]; future: DrumConfig[] }>({
    past: [],
    future: [],
  });
  const remember = () =>
    setHistory((h) => ({ past: [...h.past, latest.current].slice(-HISTORY), future: [] }));
  const commit = (next: DrumConfig) => {
    remember();
    latest.current = next;
    onChange(next);
  };
  // Al volver a un patrón se queda el tempo de ahora: deshacer no cambia la velocidad.
  const travel = (direction: 'undo' | 'redo') => {
    const current = latest.current;
    const { past, future } = history;
    const target = direction === 'undo' ? past.at(-1) : future[0];
    if (!target) return;
    setHistory(
      direction === 'undo'
        ? { past: past.slice(0, -1), future: [current, ...future] }
        : { past: [...past, current], future: future.slice(1) },
    );
    const next = { ...target, bpm: current.bpm };
    latest.current = next;
    onChange(next);
  };
  const travelRef = useRef(travel);
  useEffect(() => {
    travelRef.current = travel;
  });
  // Ctrl+Z deshace; Ctrl+Mayús+Z o Ctrl+Y rehacen. En un campo de texto, el teclado es del campo.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input:not([type="range"]), textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      event.preventDefault();
      travelRef.current(key === 'y' || event.shiftKey ? 'redo' : 'undo');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  // Pintar: el primer clic decide qué se pone (o se borra, con el derecho) y pasar por las casillas de al
  // lado de la misma fila las deja igual. Todo el gesto se deshace de una vez.
  const paint = (lane: number, step: number) => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 && event.button !== 2) return;
    const current = config.tracks[lane]?.[step] ?? 0;
    const value: Step = event.button === 2 ? 0 : nextStep(current, event.pointerType !== 'mouse');
    if (value === current) return;
    remember();
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

  // De a un paso. Al agrandar, el paso nuevo entra vacío; al achicar, se pierde el último.
  const resize = (direction: 1 | -1) => {
    const steps = Math.min(DRUM_STEPS.max, Math.max(DRUM_STEPS.min, config.steps + direction));
    if (steps === config.steps) return;
    commit({
      ...config,
      steps,
      tracks: config.tracks.map((track) => Array.from({ length: steps }, (_, i): Step => track[i] ?? 0)),
    });
  };

  const presetId = DRUM_PRESETS.find((preset) => samePattern(preset.config, config))?.id;
  const swing = config.swing ?? SWING.straight;
  const muted = config.muted ?? [];
  const soloed = config.soloed ?? [];
  const flip = (list: boolean[], lane: number) =>
    DRUMS.map((_, index) => (index === lane ? !list[index] : !!list[index]));
  // Lo que no es el patrón se queda como estaba al cambiar de patrón: la batería, los volúmenes, mute y solo.
  const keep = {
    levels: config.levels,
    muted: config.muted,
    soloed: config.soloed,
    ...(config.kit && { kit: config.kit }),
  };
  const setTracks = (lane: number, step: number, value: Step) =>
    commit({
      ...config,
      tracks: config.tracks.map((track, index) =>
        index === lane ? track.map((on, i) => (i === step ? value : on)) : track,
      ),
    });

  return (
    <div className={styles.drums} data-testid="drum-machine">
      <div className={ritmo.presets} role="group" aria-label="Ritmos de partida">
        {DRUM_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="mini"
            ariaPressed={preset.id === presetId}
            onClick={() => commit({ ...preset.config, ...keep })}
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
              commit(value === DEFAULT_KIT ? rest : { ...rest, kit: value });
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
              Swing:{' '}
              <output data-testid="swing">
                {config.steps % 2 === 1 ? 'no va' : swing === SWING.straight ? 'parejo' : swing}
              </output>
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
            // El swing corre un paso de cada par: con pasos impares no hay pares.
            disabled={config.steps % 2 === 1}
            onChange={(event) => onChange({ ...config, swing: Number(event.target.value) })}
          />
        </Field>
        <div className={styles.actions}>
          <Button
            id="invent-drums"
            onClick={() =>
              commit({
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
            onClick={() =>
              commit({ ...config, tracks: config.tracks.map((track) => track.map((): Step => 0)) })
            }
          >
            Borrar
          </Button>
          <Button
            id="undo-drums"
            disabled={history.past.length === 0}
            title="Ctrl+Z"
            onClick={() => travel('undo')}
          >
            Deshacer
          </Button>
          <Button
            id="redo-drums"
            disabled={history.future.length === 0}
            title="Ctrl+Mayús+Z"
            onClick={() => travel('redo')}
          >
            Rehacer
          </Button>
        </div>
      </div>

      <div
        ref={grid}
        className={styles.tracks}
        // El clic derecho borra: sobre las casillas no aparece el menú del navegador.
        onContextMenu={(event) => {
          if ((event.target as HTMLElement).closest('[data-lane]')) event.preventDefault();
        }}
        style={
          {
            '--columns': config.steps > 16 ? Math.ceil(config.steps / 2) : config.steps,
            '--row': rowLength(config.steps),
          } as CSSProperties
        }
      >
        {DRUMS.map((drum, lane) => {
          const name = drumName(drum.id, kit);
          const lower = name.toLowerCase();
          return (
            <div
              key={drum.id}
              className={styles.track}
              data-track={drum.id}
              data-silent={!laneSounds(config, lane)}
            >
              <button
                type="button"
                className={styles.voice}
                title={`Escuchar ${lower}`}
                onClick={() => metronome.preview(drum.id, config.levels[lane])}
              >
                {/* El abierto va debajo del hi-hat: alcanza con decir que es el abierto. */}
                {drum.id === 'abierto' ? 'Abierto' : name}
              </button>
              <input
                type="range"
                className={styles.level}
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
              <div className={styles.mute}>
                <Button
                  variant="mini"
                  ariaPressed={!!muted[lane]}
                  ariaLabel={`Mute de ${lower}`}
                  title="Callar esta fila"
                  onClick={() => onChange({ ...config, muted: flip(muted, lane) })}
                >
                  Mute
                </Button>
              </div>
              <div className={styles.solo}>
                <Button
                  variant="mini"
                  ariaPressed={!!soloed[lane]}
                  ariaLabel={`Solo de ${lower}`}
                  title="Escuchar solo esta fila (y las otras en solo)"
                  onClick={() => onChange({ ...config, soloed: flip(soloed, lane) })}
                >
                  Solo
                </Button>
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
                      // Con el teclado no hay puntero: el clic llega solo (detail 0) y pasa al estado que sigue.
                      onClick={(event) => {
                        if (event.detail !== 0) return;
                        const next = nextStep(value, true);
                        setTracks(lane, step, next);
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

      <p className={`${ui.hint} ${styles.hint}`}>
        <span className={styles.mouseHint}>
          Clic: golpe; otro clic, acento. Clic derecho: borrar. Arrastrando se pintan varias. Ctrl+Z deshace.
        </span>
        <span className={styles.touchHint}>
          Tocá una casilla: golpe; otra vez, acento; otra, vacía. Arrastrando se pintan varias.
        </span>
      </p>
    </div>
  );
}
