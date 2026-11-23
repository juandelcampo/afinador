// Ritmo: metrónomo para compases raros, ritmos euclidianos con su figura, polirritmias, compases que
// mutan y una caja de ritmos. Suena solo acá: al irse de la página, para.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useSearchParams, type MetaFunction } from 'react-router';
import { CLICK_SOUNDS, type ClickSound } from '~/audio/drums';
import { metronome } from '~/audio/metronome';
import {
  clampBpm,
  cycleFor,
  DEFAULT_POLY_VOICES,
  describeRhythm,
  DRUMS,
  LIMITS,
  parseMeter,
  rhythmFromParams,
  rhythmToDrums,
  rhythmToParams,
  type Cycle,
  type DrumId,
  type Meter,
  type RhythmConfig,
} from '~/core/rhythm';
import { DRUM_PRESETS } from '~/data/drums';
import { useSettings } from '~/shared/settings';
import { Button, Field, PageTitle, Slab, Stepper, Tabs } from '~/shared/ui/ui';
import ui from '~/shared/ui/ui.module.css';
import { DrumMachine } from './DrumMachine';
import { Strip } from './Strip';
import { TapTempo } from './TapTempo';
import { Wheel } from './Wheel';
import styles from './ritmo.module.css';

export const meta: MetaFunction = () => [
  { title: 'Metrónomo y caja de ritmos: 7/8, euclidianos y polirritmias · Afinador' },
  {
    name: 'description',
    content:
      'Metrónomo online para 7/8, 5/4 y otros compases irregulares, ritmos euclidianos dibujados como figuras, polirritmias, compases que mutan y una caja de ritmos para armar tu groove.',
  },
];

type Mode = RhythmConfig['mode'];

const MODES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'meter', label: 'Compás' },
  { value: 'euclid', label: 'Euclidiano' },
  { value: 'poly', label: 'Polirritmia' },
  { value: 'mutante', label: 'Mutante' },
  // La batería es otra cosa: va última.
  { value: 'drum', label: 'Batería' },
];

const PRESETS: ReadonlyArray<{ label: string; meter: Meter }> = [
  { label: '4/4', meter: { groups: [1, 1, 1, 1], denom: 4 } },
  { label: '3/4', meter: { groups: [1, 1, 1], denom: 4 } },
  { label: '5/4', meter: { groups: [3, 2], denom: 4 } },
  { label: '6/8', meter: { groups: [3, 3], denom: 8 } },
  { label: '5/8', meter: { groups: [3, 2], denom: 8 } },
  { label: '7/8 2+2+3', meter: { groups: [2, 2, 3], denom: 8 } },
  { label: '7/8 3+2+2', meter: { groups: [3, 2, 2], denom: 8 } },
  { label: '9/8 2+2+2+3', meter: { groups: [2, 2, 2, 3], denom: 8 } },
  { label: '11/8 3+3+3+2', meter: { groups: [3, 3, 3, 2], denom: 8 } },
];

/** Ritmos euclidianos con nombre: por ahí conviene empezar a escuchar figuras. */
const EUCLID_PRESETS: ReadonlyArray<{ label: string; pulses: number; steps: number }> = [
  { label: 'Tresillo', pulses: 3, steps: 8 },
  { label: 'Cinquillo', pulses: 5, steps: 8 },
  { label: 'Bossa', pulses: 5, steps: 16 },
  { label: 'Campana africana', pulses: 7, steps: 12 },
  { label: 'Khafif', pulses: 2, steps: 5 },
  { label: 'Cuatro parejos', pulses: 4, steps: 16 },
];

const POLY_PRESETS: ReadonlyArray<[number, number]> = [
  [3, 2],
  [4, 3],
  [5, 4],
  [5, 3],
  [7, 4],
];

const DEFAULTS: { [K in Mode]: (bpm: number) => Extract<RhythmConfig, { mode: K }> } = {
  meter: (bpm) => ({ mode: 'meter', groups: [1, 1, 1, 1], denom: 4, bpm }),
  euclid: (bpm) => ({ mode: 'euclid', pulses: 3, steps: 8, rotation: 0, bpm }),
  poly: (bpm) => ({ mode: 'poly', a: 3, b: 2, bpm }),
  mutante: (bpm) => ({
    mode: 'mutante',
    meters: [
      { groups: [1, 1, 1, 1], denom: 4 },
      { groups: [2, 2, 3], denom: 8 },
    ],
    barsEach: 2,
    bpm,
  }),
  drum: (bpm) => ({ ...DRUM_PRESETS[0]!.config, bpm }),
};

/**
 * Elegir uno entre pocos: botones chicos, todos a la vista. Es lo mismo para los ritmos con nombre, el
 * sonido, el instrumento y la figura, así se lee igual en toda la página (sin listas desplegables).
 */
function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
  testId,
}: {
  label: string;
  value: T | null;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  testId?: string;
}) {
  return (
    <div className={styles.presets} role="group" aria-label={label} data-testid={testId}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant="mini"
          ariaPressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

const DRUM_OPTIONS: ReadonlyArray<{ value: DrumId; label: string }> = DRUMS.map((drum) => ({
  value: drum.id,
  label: drum.name,
}));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const meterKey = (meter: Meter) => `${meter.groups.join()}/${meter.denom}`;

function MeterEditor({
  meter,
  onChange,
  sound,
}: {
  meter: Meter;
  onChange: (meter: Meter) => void;
  sound: ReactNode;
}) {
  const key = meter.groups.join('+');
  const [text, setText] = useState(key);
  const [syncedKey, setSyncedKey] = useState(key);
  if (key !== syncedKey) {
    setSyncedKey(key);
    setText(key);
  }
  const parsed = parseMeter(text, meter.denom);
  return (
    <div className={styles.editor}>
      <div className={styles.presets} role="group" aria-label="Compases">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="mini"
            ariaPressed={meterKey(preset.meter) === meterKey(meter)}
            onClick={() => onChange(preset.meter)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className={styles.rows}>
        <Field label="Agrupación" className={styles.textField}>
          <input
            value={text}
            inputMode="text"
            aria-invalid={!parsed}
            onChange={(event) => {
              setText(event.target.value);
              const next = parseMeter(event.target.value, meter.denom);
              if (next) onChange(next);
            }}
          />
        </Field>
        <Field label="Unidad" as="div">
          <Chips
            label="Unidad del compás"
            value={String(meter.denom) as '4' | '8' | '16'}
            options={[
              { value: '4', label: '/4' },
              { value: '8', label: '/8' },
              { value: '16', label: '/16' },
            ]}
            onChange={(value) => onChange({ ...meter, denom: Number(value) as Meter['denom'] })}
          />
        </Field>
        {sound}
      </div>
      <p className={parsed ? ui.hint : styles.error}>
        {parsed
          ? 'Cada número es un grupo: el primer golpe de cada grupo va acentuado. 2+2+3 suena distinto que 3+2+2.'
          : 'Escribí grupos como 2+2+3, de 1 a 9 cada uno.'}
      </p>
    </div>
  );
}

/**
 * Lo que se arma en cada tipo de ritmo, siempre en el mismo orden: los de partida arriba, los ajustes en
 * filas (el rótulo a la izquierda) y la explicación al final.
 */
function Editor({
  config,
  onChange,
  sound,
  playingIndex,
}: {
  config: RhythmConfig;
  onChange: (config: RhythmConfig) => void;
  /** En el mutante, qué vuelta está sonando: la rotación marca el compás de ahora. */
  playingIndex: number | null;
  /** El sonido del metrónomo: una fila más, en los ritmos que suenan con un solo sonido. */
  sound: ReactNode;
}) {
  switch (config.mode) {
    case 'drum':
      return null;
    case 'meter':
      return (
        <MeterEditor meter={config} onChange={(meter) => onChange({ ...config, ...meter })} sound={sound} />
      );
    case 'euclid': {
      const { pulses, steps, rotation } = config;
      return (
        <div className={styles.editor}>
          <div className={styles.presets} role="group" aria-label="Ritmos euclidianos con nombre">
            {EUCLID_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="mini"
                ariaPressed={preset.pulses === pulses && preset.steps === steps && rotation === 0}
                onClick={() =>
                  onChange({ ...config, pulses: preset.pulses, steps: preset.steps, rotation: 0 })
                }
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className={styles.rows}>
            <Field label="Golpes" as="div">
              <Stepper
                label="golpes"
                value={pulses}
                onDown={() => onChange({ ...config, pulses: clamp(pulses - 1, 1, steps) })}
                onUp={() => onChange({ ...config, pulses: clamp(pulses + 1, 1, steps) })}
              />
            </Field>
            <Field label="Pulsos" as="div">
              <Stepper
                label="pulsos"
                value={steps}
                onDown={() => {
                  const next = clamp(steps - 1, 2, LIMITS.cells[1]);
                  onChange({
                    ...config,
                    steps: next,
                    pulses: Math.min(pulses, next),
                    rotation: Math.min(rotation, next - 1),
                  });
                }}
                onUp={() => onChange({ ...config, steps: clamp(steps + 1, 2, LIMITS.cells[1]) })}
              />
            </Field>
            <Field label="Girar" as="div">
              <Stepper
                label="rotación"
                value={rotation}
                onDown={() => onChange({ ...config, rotation: (rotation - 1 + steps) % steps })}
                onUp={() => onChange({ ...config, rotation: (rotation + 1) % steps })}
              />
            </Field>
            {sound}
          </div>
          <p className={ui.hint}>
            Los golpes se reparten lo más parejo posible en los pulsos, y la figura que forman es el ritmo.
            Girarla cambia dónde arranca: la misma figura, otro groove.
          </p>
        </div>
      );
    }
    case 'poly': {
      const voices = config.voices ?? DEFAULT_POLY_VOICES;
      const lines = [
        { key: 'a', count: config.a },
        { key: 'b', count: config.b },
      ] as const;
      return (
        <div className={styles.editor}>
          <div className={styles.presets} role="group" aria-label="Polirritmias comunes">
            {POLY_PRESETS.map(([a, b]) => (
              <Button
                key={`${a}:${b}`}
                variant="mini"
                ariaPressed={config.a === a && config.b === b}
                onClick={() => onChange({ ...config, a, b })}
              >
                {a} contra {b}
              </Button>
            ))}
          </div>
          <div className={styles.rows}>
            {lines.map(({ key, count }, line) => (
              <Field
                key={key}
                label={line === 0 ? 'Círculos · golpes y sonido' : 'Cuadrados · golpes y sonido'}
                as="div"
                className={styles.span}
              >
                <div className={styles.line}>
                  <Stepper
                    label={`golpes de la línea ${line + 1}`}
                    value={count}
                    onDown={() => onChange({ ...config, [key]: clamp(count - 1, 1, LIMITS.lane[1]) })}
                    onUp={() => onChange({ ...config, [key]: clamp(count + 1, 1, LIMITS.lane[1]) })}
                  />
                  <Chips<DrumId>
                    label={`Instrumento de la línea ${line + 1}`}
                    testId={`poly-voice-${line}`}
                    value={voices[line] ?? null}
                    options={DRUM_OPTIONS}
                    onChange={(voice) =>
                      onChange({ ...config, voices: line === 0 ? [voice, voices[1]] : [voices[0], voice] })
                    }
                  />
                </div>
              </Field>
            ))}
          </div>
          <p className={ui.hint}>
            Dos líneas parejas en el mismo tiempo: cada una con su figura y su instrumento. Solo coinciden al
            empezar el ciclo.
          </p>
        </div>
      );
    }
    case 'mutante': {
      const { meters, barsEach } = config;
      return (
        <div className={styles.editor}>
          <div className={styles.presets} role="group" aria-label="Compases de la rotación">
            {PRESETS.map((preset) => {
              const active = meters.some((meter) => meterKey(meter) === meterKey(preset.meter));
              return (
                <Button
                  key={preset.label}
                  variant="mini"
                  ariaPressed={active}
                  onClick={() => {
                    const next = active
                      ? meters.filter((meter) => meterKey(meter) !== meterKey(preset.meter))
                      : [...meters, preset.meter];
                    if (next.length > 0) onChange({ ...config, meters: next });
                  }}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
          <div className={styles.rows}>
            <Field label="Cambia cada · compases" as="div">
              <Stepper
                label="compases entre cambios"
                value={barsEach}
                onDown={() => onChange({ ...config, barsEach: clamp(barsEach - 1, 1, 16) })}
                onUp={() => onChange({ ...config, barsEach: clamp(barsEach + 1, 1, 16) })}
              />
            </Field>
            {/* La rotación va con los ajustes, como un ajuste más: la figura queda sola, igual que en los otros. */}
            <Field label="Rotación" as="div" className={styles.span}>
              <Rotation config={config} index={playingIndex} />
            </Field>
            {sound}
          </div>
          <p className={ui.hint}>
            Arriba marcás los compases que entran en la rotación (podés marcar varios): suenan en el orden en
            que los elegís, y la figura cambia con cada uno.
          </p>
        </div>
      );
    }
  }
}

/** Cómo se nombra un compás: 4/4, o 7/8 2+2+3 si los grupos no son parejos. */
function meterLabel(meter: Meter) {
  const total = meter.groups.reduce((sum, group) => sum + group, 0);
  const even = meter.groups.every((group) => group === meter.groups[0]);
  return `${total}/${meter.denom}${even ? '' : ` ${meter.groups.join('+')}`}`;
}

/** Los compases que van rotando, con el que suena marcado, cuántos lleva y cuál viene. */
function Rotation({
  config,
  index,
}: {
  config: Extract<RhythmConfig, { mode: 'mutante' }>;
  index: number | null;
}) {
  const { meters, barsEach } = config;
  const position = index === null ? null : Math.floor(index / barsEach) % meters.length;
  const bar = index === null ? null : (index % barsEach) + 1;
  const next = position === null ? null : meters[(position + 1) % meters.length]!;
  return (
    <div className={styles.rotation} data-testid="rotation">
      <ol>
        {meters.map((meter, at) => (
          <li key={`${at}-${meterLabel(meter)}`} data-now={at === position || undefined}>
            {meterLabel(meter)}
          </li>
        ))}
      </ol>
      <p className={ui.hint} aria-live="polite">
        {position === null || bar === null || next === null
          ? `Tocá y la figura va cambiando: cada compás suena ${barsEach === 1 ? 'una vez' : `${barsEach} veces`} y pasa al siguiente.`
          : `Compás ${bar} de ${barsEach} · después, ${meterLabel(next)}`}
      </p>
    </div>
  );
}

/** Lo que está sonando: el ciclo y en qué vuelta va. Cambia una vez por vuelta, no en cada cuadro. */
function usePlaying(config: RhythmConfig) {
  const [now, setNow] = useState<{ config: RhythmConfig; cycle: Cycle; index: number } | null>(null);
  useEffect(() => {
    let frame = 0;
    let last: number | null = null;
    const tick = () => {
      const head = metronome.playhead();
      const index = head?.index ?? null;
      if (index !== last) {
        last = index;
        setNow(head ? { config, cycle: head.cycle, index: head.index } : null);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [config]);
  return now && now.config === config ? now : null;
}

export default function RitmoRoute() {
  const { running, config } = useSyncExternalStore(
    metronome.subscribe,
    metronome.getState,
    metronome.getState,
  );
  const [params, setParams] = useSearchParams();
  const loaded = useRef(false);
  const clickSound = useSettings((s) => s.clickSound);
  const figure = useSettings((s) => s.rhythmFigure);
  const set = useSettings((s) => s.set);

  // Un link compartido puede traer un ritmo en la URL.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const shared = rhythmFromParams(params);
    if (shared) metronome.setConfig(shared);
  }, [params]);

  // La URL refleja el ritmo. Se lee el estado actual del metrónomo, no el de este render:
  // el efecto anterior puede acabar de cargar el ritmo que venía en el link.
  useEffect(() => {
    const encoded = rhythmToParams(metronome.getState().config);
    if (params.toString() !== encoded.toString()) {
      setParams(encoded, { replace: true, preventScrollReset: true });
    }
  }, [config, params, setParams]);

  useEffect(() => metronome.setSound(clickSound), [clickSound]);

  // Cada herramienta suena sola: al salir de Ritmo, el ritmo para.
  useEffect(() => () => metronome.stop(), []);

  const apply = (next: RhythmConfig) => metronome.setConfig(next);
  const setBpm = useCallback((bpm: number) => {
    metronome.setConfig({ ...metronome.getState().config, bpm: clampBpm(bpm) });
  }, []);

  const { name, rule } = describeRhythm(config);
  // El compás, el euclidiano y la polirritmia se dibujan como figura; el mutante cambia de compás y va en grilla.
  // Lo que se dibuja: en el mutante, el compás que está sonando; en los demás, el ritmo tal cual.
  const playing = usePlaying(config);
  const shown = config.mode === 'mutante' && playing ? playing.cycle : cycleFor(config, 0);
  const fewHits = shown.lanes
    .map((_, lane) => shown.hits.filter((hit) => hit.lane === lane).length)
    .every((count) => count < 5);
  const drum = config.mode === 'drum';

  return (
    <div className={`${styles.page} ${ui.frame}`}>
      <Slab>
        <PageTitle eyebrow="Ritmo" title={name}>
          <p data-testid="rhythm-rule">{rule}</p>
        </PageTitle>

        {/* La barra de tocar y las pestañas, siempre en el mismo lugar y a lo ancho: lo que cambia pasa abajo. */}
        <div className={styles.transport}>
          <Button
            variant="primary"
            on={running}
            onClick={() => (running ? metronome.stop() : metronome.start())}
            id="metro-toggle"
          >
            {running ? '■ Parar' : '▶ Tocar'}
          </Button>
          <div className={styles.tempo}>
            <div className={styles.tempoHead}>
              <span>Tempo</span>
              <output data-testid="bpm">{config.bpm}</output>
              <span>ppm</span>
              <div className={styles.tempoNudge}>
                <Button variant="mini" ariaLabel="Tempo a la mitad" onClick={() => setBpm(config.bpm / 2)}>
                  ÷2
                </Button>
                <Button variant="mini" ariaLabel="Bajar un pulso" onClick={() => setBpm(config.bpm - 1)}>
                  −1
                </Button>
                <Button variant="mini" ariaLabel="Subir un pulso" onClick={() => setBpm(config.bpm + 1)}>
                  +1
                </Button>
                <Button variant="mini" ariaLabel="Tempo al doble" onClick={() => setBpm(config.bpm * 2)}>
                  ×2
                </Button>
              </div>
            </div>
            <input
              type="range"
              min={LIMITS.bpm[0]}
              max={LIMITS.bpm[1]}
              value={config.bpm}
              aria-label="Tempo, en pulsos por minuto"
              onChange={(event) => setBpm(Number(event.target.value))}
            />
          </div>
          <TapTempo onTempo={setBpm} />
        </div>

        <Tabs<Mode>
          label="Tipo de ritmo"
          value={config.mode}
          options={MODES}
          onChange={(mode) => {
            if (mode === config.mode) return;
            apply({ ...(metronome.lastOfMode(mode) ?? DEFAULTS[mode](config.bpm)), bpm: config.bpm });
          }}
        />
        {/* Debajo, la figura a la izquierda y lo que se arma a la derecha: entra sin bajar. */}
        <div className={styles.board} data-drum={drum || undefined}>
          {!drum && (
            <section className={styles.figure} aria-label="Figura del ritmo" data-mode={config.mode}>
              <div className={styles.figureBar}>
                <Chips
                  label="Figura del ritmo"
                  value={figure}
                  options={[
                    { value: 'poligono', label: 'Polígono' },
                    { value: 'estrella', label: 'Estrella' },
                  ]}
                  onChange={(value) => set({ rhythmFigure: value })}
                />
              </div>
              {/* Encima del margen de la figura, sin ocupar lugar: que aparezca no mueve nada. */}
              {figure === 'estrella' && fewHits && (
                <p className={`${ui.hint} ${styles.figureNote}`}>
                  Con menos de cinco golpes queda el polígono.
                </p>
              )}
              <Wheel cycle={shown} kind={figure} />
            </section>
          )}

          <div className={styles.controls}>
            {drum ? (
              <DrumMachine config={config} onChange={apply} />
            ) : (
              <Editor
                config={config}
                onChange={apply}
                playingIndex={playing?.index ?? null}
                sound={
                  config.mode === 'poly' ? null : (
                    <Field label="Sonido" as="div" className={styles.span}>
                      <Chips<ClickSound>
                        label="Sonido del metrónomo"
                        testId="click-sound"
                        value={clickSound}
                        options={CLICK_SOUNDS.map((sound) => ({ value: sound.id, label: sound.name }))}
                        onChange={(value) => set({ clickSound: value })}
                      />
                    </Field>
                  )
                }
              />
            )}
            {!drum && (
              <div className={`${ui.field} ${styles.stripBox}`}>
                <span>En casillas</span>
                <Strip cycle={shown} />
              </div>
            )}
            {!drum && (
              <Button id="to-drums" onClick={() => apply(rhythmToDrums(config))}>
                Pasar a la batería →
              </Button>
            )}
          </div>
        </div>
      </Slab>
    </div>
  );
}
