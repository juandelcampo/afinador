import { useEffect } from 'react';
import { pluckString, preloadGuitar } from '~/audio/instrument';
import { noteToMidi, splitNote, noteLabel, type Notation } from '~/core/notes';
import { isFarFromStandard, stringOffsets } from '~/core/tuning';
import { useSettings } from '~/shared/settings';
import { flash } from '~/shared/ui/flash';
import { Icon } from '~/shared/ui/Icon';
import { Button, Slab, SlabHead, Toggle } from '~/shared/ui/ui';
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

interface TunerPanelProps {
  notes: string[];
  /** Hace sonar las seis cuerdas al aire, de grave a aguda: para volver a escuchar cómo es la afinación. */
  onPlayOpen: () => void;
}

export function TunerPanel({ notes, onPlayOpen }: TunerPanelProps) {
  const notation = useSettings((s) => s.notation);
  const a4 = useSettings((s) => s.a4);
  const mode = useSettings((s) => s.tunerMode);
  const set = useSettings((s) => s.set);
  const tuner = useTuner(notes, a4, mode);
  const notesKey = notes.join(' ');
  useEffect(() => preloadGuitar(notesKey.split(' ').map(noteToMidi)), [notesKey]);

  const offsets = stringOffsets(notes);
  const { reading, selected } = tuner;
  const status = tuningStatus(reading, tuner.active, notes.length - selected);
  if (!reading && !tuner.active) {
    status.text = 'Tocá una cuerda de arriba para escuchar su nota, o activá el micrófono para afinar.';
  }
  // Con las seis afinadas, el afinador lo dice en vez de seguir mostrando la última lectura.
  const tunedCount = tuner.tuned.filter(Boolean).length;
  const done = tuner.active && tunedCount === notes.length;
  if (done) status.text = `¡Las ${notes.length === 6 ? 'seis' : notes.length} afinadas!`;
  const needle = needlePosition(reading);
  // Qué luz se enciende: ♭ si está grave, ♯ si está aguda, la nota entera si está afinada.
  const direction = !reading ? 'none' : status.state === 'ok' ? 'ok' : reading.cents < 0 ? 'flat' : 'sharp';

  const playReference = (index: number) => {
    pluckString(index, noteToMidi(notes[index]!), { a4 });
  };

  return (
    <Slab>
      {/* En pantalla ancha la pestaña ya dice Afinar: el título queda solo para el lector de pantalla. */}
      <div className={styles.tunerHead}>
        <SlabHead title="Afinar">
          <div className={styles.tunerTools}>
            <Button
              ariaLabel="Escuchar la afinación al aire"
              title="Las seis cuerdas al aire, de grave a aguda"
              onClick={onPlayOpen}
            >
              ▶ Al aire
            </Button>
            <Toggle
              label="Modo de afinación"
              value={mode}
              options={[
                { value: 'guided', label: 'Una a una' },
                { value: 'auto', label: 'Automático' },
              ]}
              onChange={(value) => set({ tunerMode: value })}
            />
          </div>
        </SlabHead>
      </div>

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
                // Destella en cada toque, también si ya estaba elegida: la nota vuelve a sonar.
                data-flash="propio"
                aria-label={`Cuerda ${number}, ${noteLabel(note, notation)} ${splitNote(note).octave}${tuner.tuned[index] ? ', afinada' : ''}. Tocar nota de referencia.`}
                onClick={(event) => {
                  tuner.selectString(index);
                  playReference(index);
                  flash(event.currentTarget);
                }}
              >
                <span className={styles.pillNumber}>
                  {tuner.tuned[index] ? <Icon name="check" /> : number}
                </span>
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
        data-done={done}
        data-dir={direction}
        data-held={reading?.held ?? false}
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
            {(tuner.active || tunedCount > 0) && (
              <span className={styles.progress} data-done={tunedCount === notes.length}>
                {tunedCount}/{notes.length}
                <small>afinadas</small>
              </span>
            )}
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
