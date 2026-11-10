import { pluckString } from '~/audio/instrument';
import { noteToMidi, splitNote, noteLabel, type Notation } from '~/core/notes';
import { isFarFromStandard, stringOffsets } from '~/core/tuning';
import { useSettings } from '~/shared/settings';
import { Button, Segmented, Slab, SlabHead } from '~/shared/ui/ui';
import styles from './afinador.module.css';
import { needlePosition, tuningStatus, useTuner } from '~/shared/useTuner';

function NoteName({ note, notation }: { note: string; notation: Notation }) {
  return (
    <>
      {noteLabel(note, notation)}
      <sub>{splitNote(note).octave}</sub>
    </>
  );
}

/** Un destello naranja que se apaga solo: confirma que la cuerda sonó, sin volver a renderizar. */
export function flash(element: HTMLElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const accent = getComputedStyle(element).getPropertyValue('--accent');
  element.animate([{ offset: 0, backgroundColor: accent, color: '#000000' }], {
    duration: 520,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  });
}

interface TunerPanelProps {
  notes: string[];
}

export function TunerPanel({ notes }: TunerPanelProps) {
  const notation = useSettings((s) => s.notation);
  const a4 = useSettings((s) => s.a4);
  const mode = useSettings((s) => s.tunerMode);
  const set = useSettings((s) => s.set);
  const tuner = useTuner(notes, a4, mode);

  const offsets = stringOffsets(notes);
  const { reading, selected } = tuner;
  const status = tuningStatus(reading, tuner.active, notes.length - selected);
  if (!reading && !tuner.active) {
    status.text = 'Tocá una cuerda de arriba para escuchar su nota, o activá el micrófono para afinar.';
  }
  const needle = needlePosition(reading);
  // Qué luz se enciende: ♭ si está grave, ♯ si está aguda, la nota entera si está afinada.
  const direction = !reading ? 'none' : status.state === 'ok' ? 'ok' : reading.cents < 0 ? 'flat' : 'sharp';

  const playReference = (index: number) => {
    pluckString(index, noteToMidi(notes[index]!), { a4 });
  };

  return (
    <Slab>
      <SlabHead number="01" title="Afinar">
        <Segmented
          label="Modo de afinación"
          value={mode}
          options={[
            { value: 'guided', label: 'Una a una' },
            { value: 'auto', label: 'Automático' },
          ]}
          onChange={(value) => set({ tunerMode: value })}
        />
      </SlabHead>

      <div className={styles.pills}>
        {notes.map((note, index) => {
          const offset = offsets[index]!;
          const number = notes.length - index;
          return (
            <div key={index} className={styles.pillWrap}>
              <button
                type="button"
                className={styles.pill}
                data-tuned={tuner.tuned[index]}
                aria-pressed={index === selected}
                aria-label={`Cuerda ${number}, ${noteLabel(note, notation)} ${splitNote(note).octave}${tuner.tuned[index] ? ', afinada' : ''}. Tocar nota de referencia.`}
                onClick={(event) => {
                  tuner.selectString(index);
                  playReference(index);
                  flash(event.currentTarget);
                }}
              >
                <span className={styles.pillNumber}>{tuner.tuned[index] ? '✓' : number}</span>
                <span className={styles.pillNote}>
                  <NoteName note={note} notation={notation} />
                </span>
                <span className={styles.pillDelta} data-far={isFarFromStandard(offset)}>
                  {offset === 0 ? '=' : `${offset > 0 ? '+' : '−'}${Math.abs(offset)}`}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div
        className={styles.meter}
        data-state={status.state}
        data-dir={direction}
        data-testid="meter"
        data-cents={reading?.cents.toFixed(1)}
      >
        <div className={styles.meterReadout}>
          <div className={styles.meterDial}>
            <span className={styles.meterLight} data-side="flat" aria-hidden="true">
              ♭
            </span>
            <span className={styles.meterNote}>
              <NoteName note={notes[selected]!} notation={notation} />
            </span>
            <span className={styles.meterLight} data-side="sharp" aria-hidden="true">
              ♯
            </span>
          </div>
          <div className={styles.meterActions}>
            {/* Siempre ocupa su lugar: nada se corre cuando aparece la lectura. */}
            <span className={styles.meterCents} data-empty={!reading}>
              <span>{reading ? `${reading.freq.toFixed(1)} Hz` : '— Hz'}</span>
              <span>
                {reading
                  ? `${reading.cents >= 0 ? '+' : '−'}${Math.abs(reading.cents).toFixed(0)} cents`
                  : '± cents'}
              </span>
            </span>
          </div>
        </div>
        <div className={styles.meterScale} aria-hidden="true">
          <div className={styles.meterZone} />
          <div className={styles.meterNeedle} style={{ left: `${needle}%` }} />
          <div className={styles.meterLabels}>
            <span>−50</span>
            <span>−25</span>
            <span>0</span>
            <span>+25</span>
            <span>+50</span>
          </div>
        </div>
        <p className={styles.meterStatus} role="status" data-testid="meter-status">
          {tuner.message ?? status.text}
        </p>
        {/* La acción principal del afinador: a lo ancho, debajo de lo que muestra. */}
        <Button variant="primary" full on={tuner.active} onClick={() => void tuner.toggle()} id="mic-toggle">
          {tuner.active && <span className={styles.rec} aria-hidden="true" />}
          {tuner.active ? 'Apagar micrófono' : 'Activar micrófono'}
        </Button>
      </div>
    </Slab>
  );
}
