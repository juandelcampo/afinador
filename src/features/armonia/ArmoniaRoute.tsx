import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams, type MetaFunction } from 'react-router';
import {
  BASS_ROLES,
  bassFor,
  bassRoleOf,
  CADENCES,
  cadenceChords,
  cardinalGroups,
  CHORD_STEPS,
  chordColor,
  chordName,
  chordToken,
  colorGroups,
  commonTones,
  degreeLabel,
  feelingOf,
  feelingTag,
  findScale,
  parseChord,
  pedalStrings,
  pitchName,
  plainName,
  POINT_LABEL,
  samePole,
  SCALES,
  scaleDegrees,
  spellIn,
  tonicNames,
  variantsOf,
  type Chord,
  type DegreeFeeling,
  type Geometry,
  type Key,
} from '~/core/harmony';
import { INVERSION_CHORDS } from '~/core/inversions';
import { noteLabel, noteToMidi } from '~/core/notes';
import {
  displace,
  polarityOf,
  relativeOf,
  romanChord,
  singOver,
  stretch,
  twoChordMoves,
  walkingBass,
} from '~/core/progressions';
import { fingeringFor, MUTED, openChord, type Fingering } from '~/core/tuning';
import { GROUPS, TUNINGS, type Tuning } from '~/data/tunings';
import { VUELTA_GROUPS, VUELTAS, type VueltaMode } from '~/data/vueltas';
import { Fader } from '~/shared/Fader';
import { TEMPO_RANGE, useSettings } from '~/shared/settings';
import { useHydrated } from '~/shared/useHydrated';
import { Sheet } from '~/shared/ui/Sheet';
import { Button, PageTitle, Segmented, Slab, SlabHead, Tabs } from '~/shared/ui/ui';
import styles from './armonia.module.css';
import { useVuelta, type Feel, type Voicing } from './useVuelta';

export const meta: MetaFunction = () => [
  { title: 'Armonía por emociones para guitarra · Afinador' },
  {
    name: 'description',
    content:
      'Elegí una escala, escuchá qué emoción da cada acorde y armá tu vuelta con las figuras de tu afinación: dominantes secundarias, enlaces de cine, cadencias finales y puntos cardinales.',
  },
];

const DEFAULT_TUNING = 'estandar';
const MAX_CHORDS = 16;
const EMPTY = new URLSearchParams();

/** La tonalidad que mejor cae sobre las cuerdas al aire: la del acorde que forman, mayor o menor. */
function homeKey(tuning: Tuning): { tonic: number; scale: string } {
  const midis = tuning.notes.map(noteToMidi);
  const chord = openChord(midis);
  if (!chord) return { tonic: Math.min(...midis) % 12, scale: 'mayor' };
  const minor = /^m(?!aj)/.test(chord.suffix);
  return { tonic: midis[chord.root]! % 12, scale: minor ? 'natural' : 'mayor' };
}

/** Lo que suena de cada cuerda con una figura, o un acorde cerrado si la mano no llega. */
function voicingOf(tuning: Tuning, chord: Chord, fingering: Fingering | null): Voicing {
  if (fingering) {
    return fingering.frets.map((fret, index) =>
      fret === MUTED ? null : noteToMidi(tuning.notes[index]!) + fret,
    );
  }
  const base = 48 + (chord.bass ?? chord.root);
  const steps = CHORD_STEPS[chord.suffix]!.map((step) => 48 + chord.root + step);
  return [base - 12, ...steps.map((midi) => (midi < base ? midi + 12 : midi))];
}

const readVuelta = (text: string) =>
  text
    .split('_')
    .map(parseChord)
    .filter((chord): chord is Chord => chord !== null)
    .slice(0, MAX_CHORDS);

/** El grado como lo escribe Rooksby, con el bemol de verdad: "♭VII", "II mayor". */
const romanLabel = (token: string) => token.replace(/^b/, '♭').replace(/maj$/, ' M');

const sameChords = (a: readonly Chord[], b: readonly Chord[]) =>
  a.length === b.length && a.every((chord, index) => chordToken(chord) === chordToken(b[index]!));

/** Lo que se apoya, lo que tensa y lo que choca al cantar sobre un acorde. */
function SingOverList({ chord, keyOf, spell }: { chord: Chord; keyOf: Key; spell: (pc: number) => string }) {
  const notes = singOver(chord, keyOf);
  const rows = [
    { id: 'inside', label: 'Se apoyan', why: 'las del acorde: para terminar una frase', list: notes.inside },
    { id: 'outside', label: 'Tensan', why: 'de la escala: piden moverse a una vecina', list: notes.outside },
    {
      id: 'against',
      label: 'Chocan',
      why: 'fuera de la escala: de paso, o con intención',
      list: notes.against,
    },
  ];
  return (
    <div className={styles.sing} data-testid="sing-over">
      <p className={styles.label}>Para cantar encima</p>
      <dl>
        {rows.map((row) => (
          <div key={row.id} data-kind={row.id}>
            <dt>{row.label}</dt>
            <dd>
              <span className={styles.singNotes}>
                {row.list.map((pc) => (
                  <span key={pc} data-blue={notes.blue.includes(pc) || undefined}>
                    {spell(pc)}
                  </span>
                ))}
              </span>
              <small>{row.why}</small>
            </dd>
          </div>
        ))}
      </dl>
      {notes.blue.length > 0 && (
        <p className={styles.hint}>Las subrayadas son de blues: chocan, pero bien puestas dan color.</p>
      )}
    </div>
  );
}

/** Mueve un acorde de lugar: lo saca de `from` y lo pone en `to`. */
const moveItem = <T,>(list: readonly T[], from: number, to: number): T[] => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
};

/** Algo para poner en la vuelta: el botón grande lo pone, el ▶ lo hace sonar antes de decidir. */
function Option({
  title,
  detail,
  why,
  pressed,
  disabled,
  onApply,
  onPreview,
}: {
  title: string;
  detail: string;
  why?: string;
  pressed?: boolean;
  disabled?: boolean;
  onApply: () => void;
  onPreview: () => void;
}) {
  return (
    <li className={styles.option}>
      <button type="button" aria-pressed={pressed} disabled={disabled} onClick={onApply}>
        <strong>
          {title} <span>{detail}</span>
        </strong>
        {why && <small>{why}</small>}
      </button>
      <button
        type="button"
        className={styles.optionListen}
        aria-label={`Escuchar ${detail}`}
        onClick={onPreview}
      >
        ▶
      </button>
    </li>
  );
}

function Feeling({ feeling }: { feeling: DegreeFeeling }) {
  return (
    <span className={styles.feeling} data-feeling={feeling.feeling}>
      {feelingTag(feeling)}
    </span>
  );
}

interface CardProps {
  chord: Chord;
  name: string;
  label: string;
  feeling?: DegreeFeeling;
  words?: string;
  fingering: Fingering | null;
  mark?: ReactNode;
  onListen: () => void;
  onAdd: () => void;
}

/** Un acorde para escuchar (la tarjeta entera) y sumar a la vuelta (el +). */
function ChordCard({ name, label, feeling, words, fingering, mark, onListen, onAdd }: CardProps) {
  const text = words ?? (feeling ? feeling.words.join('. ') + '.' : undefined);
  return (
    <li className={styles.card}>
      <button type="button" className={styles.listen} onClick={onListen} aria-label={`Escuchar ${name}`}>
        <span className={styles.cardTop}>
          <span className={styles.degree}>{label}</span>
          {mark}
        </span>
        <strong className={styles.chordName}>{name}</strong>
        {feeling && <Feeling feeling={feeling} />}
        {text && <span className={styles.words}>{text}</span>}
        <span className={styles.tab} data-missing={!fingering}>
          {fingering ? fingering.label + (fingering.noFifth ? ' · sin 5.ª' : '') : 'La mano no llega'}
        </span>
      </button>
      <button type="button" className={styles.add} onClick={onAdd} aria-label={`Sumar ${name} a la vuelta`}>
        +
      </button>
    </li>
  );
}

export default function ArmoniaRoute() {
  const hydrated = useHydrated();
  const [searchParams, setSearchParams] = useSearchParams();
  // La página estática no conoce la URL: hasta hidratar vale lo de siempre.
  const params = hydrated ? searchParams : EMPTY;
  const notation = useSettings((s) => s.notation);
  const a4 = useSettings((s) => s.a4);

  const tuning =
    TUNINGS.find((item) => item.id === params.get('afinacion')) ??
    TUNINGS.find((item) => item.id === DEFAULT_TUNING)!;
  const home = homeKey(tuning);
  const scale = findScale(params.get('escala')) ?? findScale(home.scale)!;
  const tonicParam = Number(params.get('tono'));
  const tonic =
    params.has('tono') && Number.isInteger(tonicParam) && tonicParam >= 0 && tonicParam < 12
      ? tonicParam
      : home.tonic;
  const key: Key = { tonic, scale };
  const vueltaParam = params.get('v') ?? '';
  const vuelta = useMemo(() => readVuelta(vueltaParam), [vueltaParam]);

  const [selected, setSelected] = useState<number | null>(null);
  const [tempo, setTempo] = useState(80);
  const [beats, setBeats] = useState(4);
  const [feel, setFeel] = useState<Feel>('pulso');
  const [geometry, setGeometry] = useState<Geometry>('cuadrado');
  /** Un modal por vez: el editor del acorde, las vueltas para arrancar o las cadencias. */
  const [sheet, setSheet] = useState<'editor' | 'arrancar' | 'cerrar' | null>(null);
  /** La vuelta como vista principal: pasa al medio y el mundo se va a un costado. */
  const [wide, setWide] = useState(false);
  /** El acorde que se está arrastrando y dónde caería. */
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  /** El último acorde escuchado en los puntos cardinales, listo para sumar. */
  const [heard, setHeard] = useState<Chord | null>(null);
  const [editorTab, setEditorTab] = useState<'color' | 'bajo' | 'cambiar' | 'cantar'>('color');

  // Dos toques seguidos no esperan a que la URL se actualice: cada cambio parte del último pedido.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (pending.current === searchParams.toString()) pending.current = null;
  }, [searchParams]);
  const update = (
    patch: Record<string, string | null> | ((base: URLSearchParams) => Record<string, string | null>),
  ) => {
    const base = new URLSearchParams(pending.current ?? searchParams);
    const next = new URLSearchParams(base);
    for (const [param, value] of Object.entries(typeof patch === 'function' ? patch(base) : patch)) {
      if (value === null || value === '') next.delete(param);
      else next.set(param, value);
    }
    pending.current = next.toString();
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };
  const vueltaText = (chords: Chord[]) => chords.slice(0, MAX_CHORDS).map(chordToken).join('_');
  /** Cambia la vuelta a partir de la última pedida, no de la que se ve. */
  const setVuelta = (change: Chord[] | ((current: Chord[]) => Chord[])) =>
    update((base) => ({
      v: vueltaText(typeof change === 'function' ? change(readVuelta(base.get('v') ?? '')) : change),
    }));
  const extendVuelta = (chords: Chord[]) =>
    setVuelta((current) => (current.length + chords.length > MAX_CHORDS ? current : [...current, ...chords]));
  const swap = (from: number, to: number) =>
    setVuelta((current) => {
      if (!current[from] || !current[to]) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to]!, next[from]!];
      return next;
    });

  const finger = (chord: Chord) =>
    fingeringFor(tuning.notes, chord.root, CHORD_STEPS[chord.suffix]!, chord.bass ?? chord.root);
  const voicings = vuelta.map((chord) => voicingOf(tuning, chord, finger(chord)));
  const player = useVuelta({ voicings, a4, tempo, beats, feel });

  const name = (chord: Chord) => chordName(chord, key, notation);
  const listen = (chord: Chord) => player.strum(voicingOf(tuning, chord, finger(chord)));
  const add = (chord: Chord) => {
    listen(chord);
    extendVuelta([chord]);
  };
  /** Cambia un acorde; si el cambio es una función, se aplica sobre el acorde pedido, no sobre el que se ve. */
  const replaceAt = (index: number, change: Chord | ((item: Chord) => Chord)) => {
    const apply = typeof change === 'function' ? change : () => change;
    setVuelta((current) => current.map((item, position) => (position === index ? apply(item) : item)));
    if (vuelta[index]) listen(apply(vuelta[index]));
  };

  const degrees = scaleDegrees(key);
  const last = vuelta[vuelta.length - 1] ?? null;
  const groups = colorGroups(key, last);
  const pedal = pedalStrings(
    tuning.notes.map((note) => noteToMidi(note) % 12),
    vuelta,
  );
  const active = selected !== null && selected < vuelta.length ? selected : null;
  const activeChord = active === null ? null : vuelta[active]!;
  const pole = last && !last.bass ? samePole(last.root) : null;
  const mode: VueltaMode = chordColor(degrees[0]!.chord.suffix) === 'minor' ? 'menor' : 'mayor';
  const starter = (degreesOf: readonly string[], vueltaMode: VueltaMode) =>
    degreesOf.map((token) => romanChord(token, tonic, vueltaMode));
  const applyStarter = (chords: Chord[], vueltaMode: VueltaMode) => {
    player.stop();
    setSelected(null);
    // Si la vuelta es de la otra familia, el mundo pasa a la mayor o a la menor natural.
    update({
      v: chords.map(chordToken).join('_'),
      ...(vueltaMode === mode ? {} : { escala: vueltaMode === 'mayor' ? 'mayor' : 'natural' }),
    });
  };
  const transforms = [
    {
      id: 'desplazar',
      label: 'Desplazar',
      why: 'Arranca en el segundo acorde: el I deja de mandar.',
      apply: displace,
    },
    {
      id: 'estirar',
      label: 'Estirar',
      why: 'Repite el primer cambio antes de seguir: la vuelta respira.',
      apply: (chords: readonly Chord[]) => stretch(chords).slice(0, MAX_CHORDS),
    },
    {
      id: 'bajo',
      label: 'Bajo que baja',
      why: 'Inversiones para que el bajo baje de a paso.',
      apply: walkingBass,
    },
  ];

  const card = (chord: Chord, label: string, extra: Partial<CardProps> = {}) => (
    <ChordCard
      key={chordToken(chord) + label}
      chord={chord}
      name={name(chord)}
      label={label}
      feeling={feelingOf(chord, key)}
      fingering={finger(chord)}
      onListen={() => listen(chord)}
      onAdd={() => add(chord)}
      {...extra}
    />
  );

  const closeSheet = () => {
    setSheet(null);
    setSelected(null);
  };
  const openEditor = (index: number) => {
    setSelected(index);
    setEditorTab('color');
    setSheet('editor');
    listen(vuelta[index]!);
  };
  const previewChords = (chords: Chord[]) =>
    player.preview(chords.map((chord) => voicingOf(tuning, chord, finger(chord))));
  /** Cómo suena un reemplazo en su lugar: el acorde de antes (la vuelta da la vuelta) y el nuevo. */
  const previewInPlace = (index: number, chord: Chord) => {
    const before = vuelta.length > 1 ? vuelta[(index - 1 + vuelta.length) % vuelta.length] : undefined;
    previewChords(before ? [before, chord] : [chord]);
  };
  const shown = drag ? moveItem(vuelta, drag.from, drag.to) : vuelta;
  const neighbors =
    active === null ? [] : [active - 1, active + 1].filter((i) => i >= 0 && i < vuelta.length);

  return (
    <div className={styles.wrap}>
      <div className={styles.page} data-wide={wide || undefined}>
        {/* Al medio, el mundo y sus acordes: lo principal. */}
        <div className={styles.center}>
          <Slab>
            <PageTitle eyebrow="Acordes por emoción" title="Armonía">
              <p>
                Elegí un mundo, escuchá qué dice cada acorde y armá tu vuelta. Las emociones son las que suele
                sentir la mayoría, según Mauro De María; si a vos te dicen otra cosa, vale lo tuyo.
              </p>
            </PageTitle>
            <div className={styles.setup}>
              <label className={styles.field}>
                <span>Afinación</span>
                <select
                  id="afinacion"
                  value={tuning.id}
                  onChange={(event) =>
                    // La tónica vuelve a la que mejor cae sobre las cuerdas al aire de la nueva afinación.
                    update({
                      afinacion: event.target.value === DEFAULT_TUNING ? null : event.target.value,
                      tono: null,
                    })
                  }
                >
                  {GROUPS.map((group) => (
                    <optgroup key={group.id} label={group.name}>
                      {TUNINGS.filter((item) => item.group === group.id).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.notes.map((note) => noteLabel(note, notation)).join(' ')}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Tónica</span>
                <select id="tonica" value={tonic} onChange={(event) => update({ tono: event.target.value })}>
                  {tonicNames(scale).map((label, pc) => (
                    <option key={label} value={pc}>
                      {pitchName(label, notation)}
                    </option>
                  ))}
                </select>
              </label>
              <Link className={styles.bridge} to={`/afinador/${tuning.id}`}>
                Afinar en {tuning.name} →
              </Link>
            </div>
          </Slab>

          <Slab>
            <SlabHead number="01" title="Mundo" />
            <Tabs
              label="Escala"
              value={scale.id}
              options={SCALES.map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => update({ escala: value })}
            />
            <div className={styles.world}>
              <p className={styles.worldName}>
                {pitchName(spellIn(tonic, key), notation)} {scale.name.toLowerCase()}
                {scale.alias && <small> · {scale.alias.toLowerCase()}</small>}
                <span className={styles.point} data-point={scale.point}>
                  {POINT_LABEL[scale.point]}
                </span>
              </p>
              <p>{scale.character}</p>
              {scale.family === 'modo' && (
                <p className={styles.hint}>
                  Para que el modo se sienta, usá los acordes marcados con ★: son los que lo distinguen de la
                  escala mayor o menor de siempre.{' '}
                  {scale.risky !== undefined &&
                    'El marcado con OJO tira hacia otra tónica: usalo poco o nada.'}
                </p>
              )}
            </div>
            <h3 className={styles.subhead}>Sus acordes</h3>
            <p className={styles.hint}>Tocá un acorde para escucharlo; el + lo suma a tu vuelta.</p>
            <ul className={styles.cards} data-testid="degrees">
              {degrees.map((item) =>
                card(item.chord, degreeLabel(item.chord, key), {
                  feeling: item.feeling,
                  mark: item.characteristic ? (
                    <span className={styles.star} title="Grado característico">
                      ★
                    </span>
                  ) : item.risky ? (
                    <span className={styles.risk} title="Tira hacia otra tónica">
                      OJO
                    </span>
                  ) : undefined,
                }),
              )}
            </ul>
          </Slab>
        </div>

        {/* A la izquierda, de dónde sacar más acordes: todo cerrado hasta que lo pidas. */}
        <aside className={`${styles.side} ${styles.left}`} aria-label="Más acordes">
          <Slab>
            <SlabHead title="Más color" />
            <p className={styles.hint}>
              ¿Se puede ir del III al I, mezclar escalas? Siempre sí: lo que importa es saber qué emoción
              elegís.
            </p>
            {groups.map((group) => (
              <details key={group.id} className={styles.group}>
                <summary>
                  {group.title}
                  {group.id === 'cine' && last && <span> · desde {name(last)}</span>}
                  <span> · {group.chords.length}</span>
                </summary>
                {group.intro && <p className={styles.hint}>{group.intro}</p>}
                <ul className={styles.cards}>
                  {group.chords.map((item) =>
                    card(item.chord, item.label, { words: item.why, feeling: undefined }),
                  )}
                </ul>
              </details>
            ))}
            {last && (
              <details className={styles.group} data-testid="moves">
                <summary>
                  De dos en dos<span> · desde {name(last)}</span>
                </summary>
                <p className={styles.hint}>
                  Qué da cada cambio de dos acordes, contando {name(last)} como I. Repetí dos acordes varias
                  veces y ya tenés un riff o una estrofa.
                </p>
                <ul className={styles.cards}>
                  {twoChordMoves(last).map((move) =>
                    card(move.chord, move.label, { words: move.why, feeling: undefined }),
                  )}
                </ul>
              </details>
            )}
          </Slab>

          <Slab>
            <details className={styles.section} data-testid="sin-centro">
              <summary>
                <SlabHead title="Sin centro" />
              </summary>
              <p className={styles.hint}>
                Los puntos cardinales: un sistema consonante pero sin tónica. Dentro de un grupo vale ir de
                cualquier acorde a cualquiera, mayor o menor, y todo suena a fantasía.
              </p>
              <Segmented
                label="Geometría"
                value={geometry}
                options={[
                  { value: 'cuadrado', label: 'Cuadrado · 3' },
                  { value: 'triangulo', label: 'Triángulo · 4' },
                ]}
                onChange={setGeometry}
              />
              <div className={styles.compasses} data-geometry={geometry}>
                {cardinalGroups(geometry).map((group) => (
                  <section
                    key={group.index}
                    className={styles.compass}
                    aria-label={`Grupo ${group.index + 1}`}
                  >
                    <h3>Grupo {group.index + 1}</h3>
                    {group.points.map((point) => (
                      <div key={point.pole} className={styles.pole} data-pole={point.pole}>
                        <span>{plainName(point.root, notation)}</span>
                        <div>
                          {(['', 'm'] as const).map((suffix) => {
                            const chord: Chord = { root: point.root, suffix };
                            const label = plainName(point.root, notation) + suffix;
                            return (
                              <button
                                key={suffix}
                                type="button"
                                aria-label={`Escuchar ${label}`}
                                aria-pressed={heard !== null && chordToken(heard) === chordToken(chord)}
                                onClick={() => {
                                  listen(chord);
                                  setHeard(chord);
                                }}
                              >
                                {suffix === '' ? 'M' : 'm'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </section>
                ))}
              </div>
              {heard && (
                <div className={styles.heard}>
                  <span>
                    Escuchaste <strong>{name(heard)}</strong>
                  </span>
                  <Button
                    variant="primary"
                    ariaLabel={`Sumar ${name(heard)} a la vuelta`}
                    onClick={() => add(heard)}
                  >
                    + Sumar
                  </Button>
                </div>
              )}
              {pole && (
                <p className={styles.hint} data-testid="same-pole">
                  Tu último acorde está en el polo {pole.pole}. Por el mismo polo pasás a otro grupo:{' '}
                  {pole.roots.map((root) => plainName(root, notation)).join(' o ')}.
                </p>
              )}
              <p className={styles.hint}>
                Para la melodía: sobre acordes mayores, lidio (4.ª ascendida) o lidio con la 7.ª bajada; sobre
                menores, dórico. La pentatónica queda bien sobre todo.
              </p>
            </details>
          </Slab>
        </aside>

        {/* A la derecha, tu vuelta: queda a mano mientras recorrés el resto. */}
        <aside className={`${styles.side} ${styles.right}`} aria-label="Tu vuelta">
          <Slab className={styles.vueltaSlab}>
            <span id="vuelta" className={styles.anchor} />
            <SlabHead title="Tu vuelta">
              <Fader compact />
              <Button
                variant="mini"
                ariaPressed={wide}
                onClick={() => setWide(!wide)}
                title="Que la vuelta ocupe el medio"
              >
                {wide ? 'Achicar' : 'Agrandar'}
              </Button>
            </SlabHead>
            {vuelta.length === 0 ? (
              <div className={styles.empty} data-testid="vuelta-empty">
                <p className={styles.hint}>
                  Sumá acordes con el +, o arrancá con una vuelta que ya funcionó y después cambiala.
                </p>
                <Button variant="primary" full onClick={() => setSheet('arrancar')}>
                  Arrancar con una vuelta
                </Button>
              </div>
            ) : (
              <ol className={styles.chips} data-testid="vuelta" data-wide={wide || undefined}>
                {shown.map((chord, index) => {
                  const feeling = feelingOf(chord, key);
                  const fingering = finger(chord);
                  return (
                    <li
                      key={index}
                      data-slot={index}
                      data-dragging={drag?.to === index || undefined}
                      className={styles.chip}
                    >
                      <button
                        type="button"
                        className={styles.chipMain}
                        aria-pressed={active === index}
                        aria-haspopup="dialog"
                        data-playing={(!drag && player.current === index) || undefined}
                        onClick={() => openEditor(index)}
                      >
                        <small>{degreeLabel(chord, key)}</small>
                        <strong>{name(chord)}</strong>
                        {feeling && <Feeling feeling={feeling} />}
                        {wide && feeling && <span className={styles.words}>{feeling.words.join('. ')}.</span>}
                        {wide && (
                          <span className={styles.tab} data-missing={!fingering}>
                            {fingering ? fingering.label : 'La mano no llega'}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        className={styles.chipRemove}
                        aria-label={`Sacar ${name(chord)}`}
                        onClick={() => {
                          setVuelta((current) => current.filter((_, position) => position !== index));
                          setSelected(null);
                        }}
                      >
                        ✕
                      </button>
                      {/* La manija: se arrastra con el dedo o el mouse, o se mueve con las flechas. */}
                      <button
                        type="button"
                        className={styles.chipGrip}
                        aria-label={`Mover ${name(chord)}`}
                        title="Arrastrá para cambiarlo de lugar"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.currentTarget.setPointerCapture(event.pointerId);
                          setDrag({ from: index, to: index });
                        }}
                        onPointerMove={(event) => {
                          if (!drag) return;
                          const slot = document
                            .elementsFromPoint(event.clientX, event.clientY)
                            .find(
                              (element): element is HTMLElement =>
                                element instanceof HTMLElement && element.dataset.slot !== undefined,
                            );
                          if (slot && Number(slot.dataset.slot) !== drag.to)
                            setDrag({ ...drag, to: Number(slot.dataset.slot) });
                        }}
                        onPointerUp={() => {
                          if (drag && drag.from !== drag.to) {
                            const { from, to } = drag;
                            setVuelta((current) => moveItem(current, from, to));
                          }
                          setDrag(null);
                        }}
                        onPointerCancel={() => setDrag(null)}
                        onKeyDown={(event) => {
                          const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
                          if (!step || !vuelta[index + step]) return;
                          event.preventDefault();
                          swap(index, index + step);
                        }}
                      >
                        ⠿
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}

            {pedal.length > 0 && (
              <p className={styles.pedal} data-testid="pedal">
                Al aire en toda la vuelta:{' '}
                {pedal
                  .map((index) => `${6 - index}.ª (${noteLabel(tuning.notes[index]!, notation)})`)
                  .join(', ')}
                . Dejalas sonar.
              </p>
            )}

            {vuelta.length > 0 && (
              <>
                <div className={styles.controls}>
                  <Button
                    variant="primary"
                    id="vuelta-toggle"
                    on={player.running}
                    onClick={() => (player.running ? player.stop() : player.start())}
                  >
                    {player.running ? '■ Parar' : '▶ Tocar la vuelta'}
                  </Button>
                  <label className={styles.field}>
                    <span>Velocidad: {tempo} ppm</span>
                    <input
                      type="range"
                      min={TEMPO_RANGE.min}
                      max={TEMPO_RANGE.max}
                      step={TEMPO_RANGE.step}
                      value={tempo}
                      onChange={(event) => setTempo(Number(event.target.value))}
                    />
                  </label>
                </div>
                <details className={styles.more}>
                  <summary>Cómo se toca</summary>
                  <div className={styles.controls}>
                    <div className={styles.field}>
                      <span>Pulsos por acorde</span>
                      <Segmented
                        label="Pulsos por acorde"
                        value={String(beats)}
                        options={[
                          { value: '2', label: '2' },
                          { value: '4', label: '4' },
                          { value: '8', label: '8' },
                        ]}
                        onChange={(value) => setBeats(Number(value))}
                      />
                    </div>
                    <div className={styles.field}>
                      <span>Rasguido</span>
                      <Segmented
                        label="Rasguido"
                        value={feel}
                        options={[
                          { value: 'pulso', label: 'Por pulso' },
                          { value: 'acorde', label: 'Uno solo' },
                        ]}
                        onChange={setFeel}
                      />
                    </div>
                  </div>
                </details>

                <p className={styles.label}>Transformar</p>
                <div className={styles.pills} role="group" aria-label="Transformar la vuelta">
                  {transforms.map((transform) => (
                    <button
                      key={transform.id}
                      type="button"
                      title={transform.why}
                      disabled={sameChords(transform.apply(vuelta), vuelta)}
                      onClick={() => setVuelta((current) => transform.apply(current))}
                    >
                      {transform.label}
                    </button>
                  ))}
                </div>
                <div className={styles.pills}>
                  <button type="button" aria-haspopup="dialog" onClick={() => setSheet('cerrar')}>
                    Cerrar con…
                  </button>
                  <button type="button" aria-haspopup="dialog" onClick={() => setSheet('arrancar')}>
                    Otra vuelta…
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      player.stop();
                      setVuelta([]);
                    }}
                  >
                    Vaciar
                  </button>
                </div>
              </>
            )}
          </Slab>
        </aside>
      </div>

      <Sheet
        open={sheet === 'editor' && activeChord !== null}
        title={activeChord ? name(activeChord) : ''}
        onClose={closeSheet}
        tools={
          active !== null && (
            <div className={styles.editorTools}>
              <Button
                variant="mini"
                ariaLabel="Mover a la izquierda"
                disabled={active === 0}
                onClick={() => {
                  swap(active, active - 1);
                  setSelected(active - 1);
                }}
              >
                ←
              </Button>
              <Button
                variant="mini"
                ariaLabel="Mover a la derecha"
                disabled={active === vuelta.length - 1}
                onClick={() => {
                  swap(active, active + 1);
                  setSelected(active + 1);
                }}
              >
                →
              </Button>
              <Button
                variant="mini"
                ariaLabel="Sacar de la vuelta"
                onClick={() => {
                  setVuelta((current) => current.filter((_, position) => position !== active));
                  closeSheet();
                }}
              >
                Sacar
              </Button>
            </div>
          )
        }
      >
        {activeChord && active !== null && (
          <div data-testid="chord-editor">
            {neighbors.length > 0 && (
              <p className={styles.hint} data-testid="common-tones">
                {neighbors
                  .map((index) => {
                    const common = commonTones(activeChord, vuelta[index]!);
                    const other = name(vuelta[index]!);
                    return common.length
                      ? `Con ${other} comparte ${common.map((pc) => pitchName(spellIn(pc, key), notation)).join(' y ')}: esa voz se puede quedar quieta.`
                      : `Con ${other} no comparte notas: el cambio se nota más.`;
                  })
                  .join(' ')}
              </p>
            )}
            <div className={styles.editorTabs}>
              <Segmented
                label="Qué cambiar"
                stretch
                value={editorTab}
                options={[
                  { value: 'color', label: 'Color' },
                  { value: 'bajo', label: 'Bajo' },
                  { value: 'cambiar', label: 'Cambiar' },
                  { value: 'cantar', label: 'Cantar' },
                ]}
                onChange={setEditorTab}
              />
            </div>
            {editorTab === 'color' && (
              <ul className={styles.variants}>
                {variantsOf(activeChord).map((variant) => {
                  const next: Chord = { root: activeChord.root, suffix: variant.suffix };
                  return (
                    <Option
                      key={variant.suffix}
                      title={variant.label}
                      detail={name(next)}
                      why={variant.why}
                      pressed={activeChord.suffix === variant.suffix}
                      onApply={() => replaceAt(active, next)}
                      onPreview={() => previewInPlace(active, next)}
                    />
                  );
                })}
              </ul>
            )}
            {editorTab === 'bajo' && (
              <ul className={styles.variants} aria-label="En el bajo">
                {BASS_ROLES.map((role) => {
                  const bass = bassFor(activeChord, role.id);
                  const next: Chord = {
                    ...activeChord,
                    bass: bass === undefined || bass === activeChord.root ? undefined : bass,
                  };
                  return (
                    <Option
                      key={role.id}
                      title={role.label}
                      detail={name(next)}
                      why={role.why}
                      disabled={bass === undefined}
                      pressed={bassRoleOf(activeChord) === role.id}
                      onApply={() =>
                        replaceAt(active, (item) => {
                          const value = bassFor(item, role.id);
                          if (value === undefined) return item;
                          return { ...item, bass: value === item.root ? undefined : value };
                        })
                      }
                      onPreview={() => previewInPlace(active, next)}
                    />
                  );
                })}
              </ul>
            )}
            {editorTab === 'bajo' && INVERSION_CHORDS.some((item) => item.suffix === activeChord.suffix) && (
              <Link
                className={styles.bridge}
                to={`/inversiones?${new URLSearchParams({
                  ...(tuning.id === DEFAULT_TUNING ? {} : { afinacion: tuning.id }),
                  acorde: chordToken({ root: activeChord.root, suffix: activeChord.suffix }),
                })}`}
              >
                Todas las formas de {name({ root: activeChord.root, suffix: activeChord.suffix })} →
              </Link>
            )}
            {editorTab === 'cambiar' && (
              <>
                <ul className={styles.variants}>
                  {[
                    {
                      id: 'relativo',
                      label: 'Relativo',
                      chord: relativeOf(activeChord),
                      why: 'Comparten dos notas: el cambio es suave y cambia el clima.',
                    },
                    {
                      id: 'polaridad',
                      label: 'Al revés',
                      chord: polarityOf(activeChord),
                      why: 'Misma raíz, de mayor a menor o al revés: sorprende.',
                    },
                  ].map(
                    (swapItem) =>
                      swapItem.chord && (
                        <Option
                          key={swapItem.id}
                          title={swapItem.label}
                          detail={name(swapItem.chord)}
                          why={swapItem.why}
                          onApply={() => replaceAt(active, swapItem.chord!)}
                          onPreview={() => previewInPlace(active, swapItem.chord!)}
                        />
                      ),
                  )}
                </ul>
                <p className={styles.label}>Qué poner después de {name(activeChord)}</p>
                <ul className={styles.variants} data-testid="editor-moves">
                  {twoChordMoves(activeChord).map((move) => (
                    <Option
                      key={move.label}
                      title={move.label}
                      detail={name(move.chord)}
                      why={move.why}
                      onApply={() => {
                        setVuelta((current) =>
                          current.length >= MAX_CHORDS
                            ? current
                            : [...current.slice(0, active + 1), move.chord, ...current.slice(active + 1)],
                        );
                        closeSheet();
                      }}
                      // El cambio entero: desde el acorde elegido hacia el propuesto.
                      onPreview={() => previewChords([activeChord, move.chord])}
                    />
                  ))}
                </ul>
              </>
            )}
            {editorTab === 'cantar' && (
              <SingOverList
                chord={activeChord}
                keyOf={key}
                spell={(pc) => pitchName(spellIn(pc, key), notation)}
              />
            )}
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'arrancar'} title="Para arrancar" onClose={closeSheet} testId="starters">
        <p className={styles.hint}>
          Vueltas de cuatro acordes que ya funcionaron, según Rikky Rooksby. Son para arrancar: después
          desplazalas, estiralas o cambiá un acorde por su relativo.
        </p>
        {VUELTA_GROUPS.map((group, index) => {
          const items = VUELTAS.filter((item) => item.group === group.id);
          return (
            <details key={group.id} className={styles.group} open={index === 0}>
              <summary>
                {group.title}
                {group.mode !== mode && <span> · {group.mode}</span>}
                <span> · {items.length}</span>
              </summary>
              <p className={styles.hint}>{group.intro}</p>
              <ul className={styles.starters}>
                {items.map((item) => {
                  const chords = starter(item.degrees, group.mode);
                  return (
                    <li key={item.id} className={styles.starter} data-testid={`vuelta-${item.id}`}>
                      <p className={styles.starterDegrees}>{item.degrees.map(romanLabel).join(' ')}</p>
                      <strong className={styles.starterChords}>{chords.map(name).join(' · ')}</strong>
                      {item.why && <p className={styles.words}>{item.why}</p>}
                      {item.songs.length > 0 && (
                        <p className={styles.songs}>Como en {item.songs.join(', ')}</p>
                      )}
                      <div className={styles.starterTools}>
                        <Button
                          variant="mini"
                          ariaLabel={`Escuchar ${chords.map(name).join(' ')}`}
                          onClick={() =>
                            player.preview(chords.map((chord) => voicingOf(tuning, chord, finger(chord))))
                          }
                        >
                          ▶
                        </Button>
                        <Button
                          variant="mini"
                          onClick={() => {
                            applyStarter(chords, group.mode);
                            closeSheet();
                          }}
                        >
                          Usar
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </Sheet>

      <Sheet open={sheet === 'cerrar'} title="Cerrar con…" onClose={closeSheet} testId="cadences">
        <p className={styles.hint}>La última cadencia es la última emoción que se lleva quien escucha.</p>
        <ul className={styles.cadences}>
          {CADENCES.map((cadence) => {
            const chords = cadenceChords(cadence, tonic);
            return (
              <Option
                key={cadence.id}
                title={cadence.name}
                detail={chords.map(name).join(' → ')}
                why={cadence.why}
                disabled={vuelta.length + chords.length > MAX_CHORDS}
                onApply={() => {
                  extendVuelta(chords);
                  closeSheet();
                }}
                // Suena como final: desde el último acorde de tu vuelta.
                onPreview={() => previewChords(last ? [last, ...chords] : chords)}
              />
            );
          })}
        </ul>
      </Sheet>

      {/* En el celular la vuelta queda lejos de los +: una barra abajo la muestra y la toca. */}
      {vuelta.length > 0 && (
        <div className={styles.dock} data-testid="dock">
          <a href="#vuelta" className={styles.dockList}>
            <small>Tu vuelta</small>
            <strong>{vuelta.map(name).join(' · ')}</strong>
          </a>
          <Button
            variant="primary"
            on={player.running}
            ariaLabel={player.running ? 'Parar la vuelta' : 'Tocar la vuelta'}
            onClick={() => (player.running ? player.stop() : player.start())}
          >
            {player.running ? '■' : '▶'}
          </Button>
        </div>
      )}
    </div>
  );
}
