// El generador de drone, en el modal de Escalas: qué se apila sobre la tónica y cómo suena. La nota la pone
// la escala; lo que se elige acá queda guardado y vale para cualquier escala.
import { useEffect, useRef } from 'react';
import { drone } from '~/audio/drone';
import {
  DETUNE_MAX,
  foreignSteps,
  resolveStack,
  STACKS,
  TIMBRES,
  type DroneSound,
  type StackChoice,
  type TimbreId,
} from '~/core/drone';
import { Button, Field, Segmented } from '~/shared/ui/ui';
import ui from '~/shared/ui/ui.module.css';
import styles from './escalas.module.css';

const STACK_OPTIONS: ReadonlyArray<{ value: StackChoice; label: string }> = [
  { value: 'escala', label: 'La escala' },
  ...(Object.keys(STACKS) as Array<keyof typeof STACKS>).map((id) => ({ value: id, label: STACKS[id].name })),
];

/** Dibuja la onda leyendo el audio cuadro a cuadro, sin renders. Callada, queda una raya quieta. */
function Scope({ on }: { on: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let frame = 0;
    const data = new Float32Array(1024);
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const surface = canvas.current;
      const context = surface?.getContext('2d');
      if (!surface || !context) return;
      const ratio = window.devicePixelRatio || 1;
      const width = Math.round(surface.clientWidth * ratio);
      const height = Math.round(surface.clientHeight * ratio);
      if (surface.width !== width || surface.height !== height) {
        surface.width = width;
        surface.height = height;
      }
      context.clearRect(0, 0, width, height);
      const active = drone.waveform(data);
      context.lineWidth = 3 * ratio;
      context.lineJoin = 'round';
      context.strokeStyle = getComputedStyle(surface).color;
      context.beginPath();
      for (let i = 0; i < data.length; i++) {
        const sample = active ? data[i]! : 0;
        const x = (i / (data.length - 1)) * width;
        const y = height / 2 - sample * height * 0.9;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvas}
      className={styles.scope}
      data-on={on || undefined}
      aria-hidden="true"
      data-testid="scope"
    />
  );
}

export function DronePanel({
  on,
  onToggle,
  sound,
  onChange,
  voices,
  scaleSteps,
  name,
  tonic,
}: {
  on: boolean;
  onToggle: () => void;
  sound: DroneSound;
  onChange: (sound: DroneSound) => void;
  /** Las notas que suenan, ya nombradas. */
  voices: string[];
  scaleSteps: readonly number[];
  /** Cómo se nombra una nota en esta escala. */
  name: (pc: number) => string;
  tonic: number;
}) {
  /** El porqué de cada pila, con el aviso si trae una nota de afuera de la escala. */
  const ruleFor = (choice: StackChoice) => {
    const stack = resolveStack(choice, scaleSteps);
    const foreign = foreignSteps(choice, scaleSteps).map((step) => name(tonic + step));
    return [
      choice === 'escala' ? `${STACKS[stack].name}.` : '',
      STACKS[stack].rule,
      foreign.length > 0
        ? `Ojo: ${foreign.join(' y ')} no ${foreign.length > 1 ? 'están' : 'está'} en la escala.`
        : '',
    ]
      .filter(Boolean)
      .join(' ');
  };
  const set = (patch: Partial<DroneSound>) => onChange({ ...sound, ...patch });

  return (
    <div className={styles.drone}>
      <Scope on={on} />
      <div className={styles.droneRow}>
        <Button variant="primary" on={on} onClick={onToggle}>
          {on ? '■ Parar' : '▶ Escuchar'}
        </Button>
        <p className={styles.voices} data-testid="drone-voices">
          {voices.join(' · ')}
        </p>
      </div>

      <Field as="div" label="Qué se apila">
        <div className={styles.stacks} role="group" aria-label="Qué se apila">
          {STACK_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant="mini"
              ariaPressed={option.value === sound.stack}
              onClick={() => set({ stack: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </Field>
      {/* Todos los textos en el mismo lugar y se ve el elegido: el modal no cambia de alto al elegir. */}
      <p className={`${ui.hint} ${styles.rule}`}>
        {STACK_OPTIONS.map((option) => {
          const shown = option.value === sound.stack;
          return (
            <span
              key={option.value}
              data-shown={shown}
              aria-hidden={!shown}
              data-testid={shown ? 'drone-rule' : undefined}
            >
              {ruleFor(option.value)}
            </span>
          );
        })}
      </p>

      <div className={styles.droneFields}>
        <Field as="div" label="Timbre">
          <Segmented<TimbreId>
            label="Timbre"
            stretch
            value={sound.timbre}
            options={(Object.keys(TIMBRES) as TimbreId[]).map((id) => ({
              value: id,
              label: TIMBRES[id].name,
            }))}
            onChange={(timbre) => set({ timbre })}
          />
        </Field>
        <Field label="Brillo">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={sound.brightness}
            onChange={(event) => set({ brightness: Number(event.target.value) })}
          />
        </Field>
        <Field label="Movimiento">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={sound.motion}
            onChange={(event) => set({ motion: Number(event.target.value) })}
          />
        </Field>
        <Field label="Batido">
          <input
            type="range"
            min={0}
            max={DETUNE_MAX}
            step={1}
            value={sound.detune}
            onChange={(event) => set({ detune: Number(event.target.value) })}
          />
        </Field>
      </div>
    </div>
  );
}
