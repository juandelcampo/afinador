import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams, type MetaFunction } from 'react-router';
import { drone } from '~/audio/drone';
import { getAudio } from '~/audio/engine';
import { pluckString, stopInstrument } from '~/audio/instrument';
import { pitchName, POINT_LABEL } from '~/core/harmony';
import { noteToMidi } from '~/core/notes';
import {
  ALL_SCALES,
  colorNotes,
  degreeName,
  FAMILY_NAMES,
  findScaleInfo,
  homeKey,
  octaveOf,
  positionsOf,
  REFERENCE_STEPS,
  spellScaleNote,
  tonicToTonic,
  type ScaleFamily,
  type ScaleNote,
} from '~/core/scales';
import { TUNINGS } from '~/data/tunings';
import { Diapason } from '~/shared/Diapason';
import { Fader } from '~/shared/Fader';
import { useSettings } from '~/shared/settings';
import { TuneLink, TuningField } from '~/shared/TuningField';
import { Button, Field, PageTitle, Segmented, Slab, SlabHead, Tabs } from '~/shared/ui/ui';
import ui from '~/shared/ui/ui.module.css';
import { useHydrated } from '~/shared/useHydrated';
import styles from './escalas.module.css';

export const meta: MetaFunction = () => [
  { title: 'Escalas en el mástil de la guitarra · Afinador' },
  {
    name: 'description',
    content:
      'Dónde cae cada nota de una escala en tu afinación: mayores, menores, modos, pentatónicas, blues, exóticas, de jazz y simétricas, con un drone para tocar encima.',
  },
];

const DEFAULT_TUNING = 'estandar';
const EMPTY = new URLSearchParams();
const FAMILIES: ScaleFamily[] = ['tonal', 'modo', 'pentatonica', 'exotica', 'jazz', 'simetrica'];
/** Segundos entre nota y nota al escuchar la escala. */
const NOTE_GAP = 0.3;
const REFERENCE_NAME = { mayor: 'la mayor', natural: 'la menor natural' } as const;

const mod12 = (value: number) => ((value % 12) + 12) % 12;

export default function EscalasRoute() {
  const hydrated = useHydrated();
  const [searchParams, setSearchParams] = useSearchParams();
  // La página estática no conoce la URL: hasta hidratar vale lo de siempre.
  const params = hydrated ? searchParams : EMPTY;
  const notation = useSettings((s) => s.notation);
  const a4 = useSettings((s) => s.a4);

  // Los mismos parámetros que Armonía: el link de una abre la otra en la misma tonalidad.
  const tuning =
    TUNINGS.find((item) => item.id === params.get('afinacion')) ??
    TUNINGS.find((item) => item.id === DEFAULT_TUNING)!;
  const home = homeKey(tuning.notes);
  const scale = findScaleInfo(params.get('escala')) ?? findScaleInfo(home.scale)!;
  const tonicParam = Number(params.get('tono'));
  const tonic =
    params.has('tono') && Number.isInteger(tonicParam) && tonicParam >= 0 && tonicParam < 12
      ? tonicParam
      : home.tonic;

  const open = useMemo(() => tuning.notes.map(noteToMidi), [tuning.notes]);
  const positions = useMemo(() => positionsOf(open, tonic, scale.steps), [open, tonic, scale.steps]);
  const color = colorNotes(scale);

  /** Qué caja se ve: -1 es todo el mástil. Vuelve a todo el mástil si cambia la escala o la afinación. */
  const viewKey = `${tuning.id}|${tonic}|${scale.id}`;
  const [view, setView] = useState({ key: viewKey, position: -1 });
  const positionIndex = view.key === viewKey ? Math.min(view.position, positions.length - 1) : -1;
  const position = positionIndex >= 0 ? positions[positionIndex]! : null;
  /** La familia que se está mirando: arranca en la de la escala elegida y vuelve a ella al elegir otra. */
  const [browsing, setBrowsing] = useState({ key: scale.id, family: scale.family });
  const family = browsing.key === scale.id ? browsing.family : scale.family;
  const [labels, setLabels] = useState<'grados' | 'notas'>('grados');
  const [droneOn, setDroneOn] = useState(false);
  /** La nota que está sonando en el recorrido, para iluminarla. */
  const [lit, setLit] = useState<ScaleNote | null>(null);
  const [litStep, setLitStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stopRun = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLit(null);
    setLitStep(null);
    setPlaying(false);
  };
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  // La tónica grave, con la quinta si la escala la tiene y la octava: suena hasta que se apaga o te vas.
  const low = 40 + mod12(tonic - 4);
  const droneNotes = scale.steps.includes(7) ? [low, low + 7, low + 12] : [low, low + 12];
  const droneKey = droneNotes.join();
  useEffect(() => {
    if (!droneOn) {
      drone.stop();
      return;
    }
    drone.play(droneKey.split(',').map(Number), a4);
  }, [droneOn, droneKey, a4]);
  useEffect(() => () => drone.stop(), []);

  // Dos toques seguidos no esperan a que la URL se actualice: cada cambio parte del último pedido.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (pending.current === searchParams.toString()) pending.current = null;
  }, [searchParams]);
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(pending.current ?? searchParams);
    for (const [param, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(param);
      else next.set(param, value);
    }
    pending.current = next.toString();
    stopRun();
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };

  const name = (pc: number) => pitchName(spellScaleNote(pc, tonic, scale), notation).replace(/b$/, '♭');
  const stepAt = (stringIndex: number, fret: number) => mod12(open[stringIndex]! + fret - tonic);
  const inScale = (stringIndex: number, fret: number) => scale.steps.includes(stepAt(stringIndex, fret));

  /** La tónica en el registro del medio de la guitarra, para escuchar la escala sin mástil. */
  const middle = 52 + mod12(tonic - 4);
  const pluck = (midi: number, index: number) => pluckString(index % 6, midi, { a4 });

  /** Programa notas una detrás de otra y va iluminando cada una. */
  const schedule = (notes: Array<{ midi: number; stringIndex: number; on?: ScaleNote }>) => {
    stopRun();
    stopInstrument();
    const { ctx } = getAudio();
    const start = ctx.currentTime + 0.05;
    setPlaying(true);
    notes.forEach((note, index) => {
      pluckString(note.stringIndex, note.midi, { a4, when: start + index * NOTE_GAP });
      timers.current.push(
        setTimeout(
          () => {
            setLit(note.on ?? null);
            setLitStep(mod12(note.midi - tonic));
          },
          (0.05 + index * NOTE_GAP) * 1000,
        ),
      );
    });
    timers.current.push(setTimeout(stopRun, (0.05 + notes.length * NOTE_GAP + 0.4) * 1000));
  };

  /** La caja elegida (o la primera), de tónica a tónica, subiendo y bajando. */
  const playRun = () => {
    if (playing) {
      stopRun();
      stopInstrument();
      return;
    }
    const box = position ?? positions[0];
    if (!box) return;
    const up = tonicToTonic(box.run, tonic);
    const path = [...up, ...up.slice(0, -1).reverse()];
    schedule(path.map((note) => ({ midi: note.midi, stringIndex: note.stringIndex, on: note })));
  };

  /** Primero la de siempre y después esta: así se oye qué cambia. */
  const compare = () => {
    if (!color.reference) return;
    const before = octaveOf(middle, REFERENCE_STEPS[color.reference]);
    const after = octaveOf(middle, scale.steps);
    schedule([...before, ...after].map((midi, index) => ({ midi, stringIndex: index % 6 })));
  };

  const step = (delta: number) => {
    stopRun();
    // -1 (todo el mástil) entra en la vuelta: después de la última caja viene el mástil entero.
    const total = positions.length + 1;
    const next = ((positionIndex + 1 + delta + total) % total) - 1;
    setView({ key: viewKey, position: next });
  };

  const armoniaLink = `/armonia?${new URLSearchParams({
    ...(tuning.id === DEFAULT_TUNING ? {} : { afinacion: tuning.id }),
    tono: String(tonic),
    escala: scale.id,
  })}`;

  return (
    <div className={`${styles.page} ${ui.frame}`}>
      <Slab>
        <PageTitle eyebrow="Todas las notas en el mástil" title="Escalas">
          <p>Elegí una escala y mirá dónde cae cada nota en tu afinación. Prendé el drone y tocá encima.</p>
        </PageTitle>
        <div className={ui.setup}>
          <TuningField
            tuning={tuning}
            // La tónica vuelve a la que mejor cae sobre las cuerdas al aire de la nueva afinación.
            onChange={(id) => update({ afinacion: id === DEFAULT_TUNING ? null : id, tono: null })}
          />
          <Field label="Tónica">
            <select id="tonica" value={tonic} onChange={(event) => update({ tono: event.target.value })}>
              {Array.from({ length: 12 }, (_, pc) => (
                <option key={pc} value={pc}>
                  {pitchName(spellScaleNote(pc, pc, scale), notation)}
                </option>
              ))}
            </select>
          </Field>
          <TuneLink tuning={tuning} />
        </div>
      </Slab>

      <Slab>
        <SlabHead title="Escala" />
        {/* Casi cuarenta escalas no entran a la vista: primero la familia y debajo solo las suyas. */}
        <div className={styles.picker}>
          <Field as="div" label="Familia">
            <Tabs
              label="Familia"
              value={family}
              options={FAMILIES.map((item) => ({ value: item, label: FAMILY_NAMES[item] }))}
              onChange={(value) => setBrowsing({ key: scale.id, family: value })}
            />
          </Field>
          <Field as="div" label={FAMILY_NAMES[family]}>
            <Tabs
              label={`Escala · ${FAMILY_NAMES[family]}`}
              value={scale.id}
              options={ALL_SCALES.filter((item) => item.family === family).map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(value) => update({ escala: value })}
            />
          </Field>
        </div>

        <div className={styles.world}>
          <p className={styles.worldName}>
            {name(tonic)} {scale.name.toLowerCase()}
            {scale.alias && <small> · {scale.alias.toLowerCase()}</small>}
            {scale.point && (
              <span className={styles.point} data-point={scale.point}>
                {POINT_LABEL[scale.point]}
              </span>
            )}
          </p>
          <p>{scale.character}</p>
        </div>

        <div
          className={styles.notes}
          role="group"
          aria-label="Notas de la escala"
          style={{ ['--count' as string]: scale.steps.length }}
        >
          {scale.steps.map((item, index) => (
            <button
              key={item}
              type="button"
              data-tonic={item === 0 || undefined}
              data-color={color.steps.includes(item) || undefined}
              data-lit={litStep === item || undefined}
              aria-label={`Escuchar ${name(tonic + item)}, ${degreeName(item, scale.steps)}`}
              onClick={() => pluck(middle + item, index)}
            >
              <strong>{name(tonic + item)}</strong>
              <small>{degreeName(item, scale.steps)}</small>
            </button>
          ))}
        </div>
        <p className={ui.hint}>
          {color.reference === null
            ? 'No tiene tercera: no es mayor ni menor.'
            : color.steps.length === 0
              ? `No tiene notas de afuera de ${REFERENCE_NAME[color.reference]}.`
              : `Las marcadas con ★ la distinguen de ${REFERENCE_NAME[color.reference]}: tocalas para que se sienta.`}
        </p>
        <div className={styles.links}>
          {color.reference && color.steps.length > 0 && (
            <Button variant="ghost" onClick={compare}>
              ▶ Comparar con {REFERENCE_NAME[color.reference]}
            </Button>
          )}
          {scale.inArmonia && (
            <Link className={ui.bridge} to={armoniaLink}>
              Sus acordes en Armonía →
            </Link>
          )}
        </div>
      </Slab>

      <Slab>
        <Diapason
          notes={tuning.notes}
          voicing={null}
          notation={notation}
          listen
          focus={position?.from ?? 0}
          toneAt={(stringIndex, fret) => {
            const item = stepAt(stringIndex, fret);
            return labels === 'grados' ? degreeName(item, scale.steps) : name(tonic + item);
          }}
          canPlace={inScale}
          mark={(stringIndex, fret) => {
            const item = stepAt(stringIndex, fret);
            return {
              tonic: item === 0,
              color: color.steps.includes(item),
              dim: position !== null && (fret < position.from || fret > position.to),
              lit: lit?.stringIndex === stringIndex && lit.fret === fret,
            };
          }}
          onToggle={(stringIndex, fret) => pluckString(stringIndex, open[stringIndex]! + fret, { a4 })}
        />

        <div className={styles.browse}>
          <button
            type="button"
            className={styles.arrow}
            aria-label="Posición anterior, más cerca de la cejuela"
            disabled={positions.length === 0}
            onClick={() => step(-1)}
          >
            ◀
          </button>
          <button
            type="button"
            className={styles.current}
            aria-label={
              position
                ? `Escuchar la posición ${positionIndex + 1}, trastes ${position.from} a ${position.to}`
                : 'Escuchar la escala en la primera posición'
            }
            onClick={playRun}
          >
            <span className={styles.counter} data-testid="position-counter">
              {position ? `Posición ${positionIndex + 1} de ${positions.length}` : 'Todo el mástil'}
            </span>
            <strong className={styles.frets}>
              {position
                ? position.from === 0
                  ? `Del aire al ${position.to}`
                  : `Trastes ${position.from} al ${position.to}`
                : `${positions.length} posiciones`}
            </strong>
          </button>
          <button
            type="button"
            className={styles.arrow}
            aria-label="Posición siguiente, más arriba en el mástil"
            disabled={positions.length === 0}
            onClick={() => step(1)}
          >
            ▶
          </button>
        </div>

        <div className={ui.actions}>
          <Button variant="primary" on={playing} onClick={playRun}>
            {playing ? '■ Parar' : '▶ Escuchar la escala'}
          </Button>
          <Button variant="ghost" on={droneOn} ariaPressed={droneOn} onClick={() => setDroneOn((on) => !on)}>
            {droneOn ? `■ Drone en ${name(tonic)}` : `▶ Drone en ${name(tonic)}`}
          </Button>
          <Segmented
            label="Qué dice cada nota"
            value={labels}
            options={[
              { value: 'grados', label: '1 ♭3 5' },
              { value: 'notas', label: 'Notas' },
            ]}
            onChange={setLabels}
          />
          <Fader />
        </div>
        <p className={ui.hint}>
          En naranja, la tónica; con aro blanco, las notas que le dan el color. Tocá cualquier nota del
          diapasón para escucharla. Con ◀ ▶ se recorren las posiciones: una caja de pocos trastes que empieza
          en cada nota de la cuerda más grave.
        </p>
      </Slab>
    </div>
  );
}
