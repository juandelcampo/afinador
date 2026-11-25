import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
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
  functionOf,
  functionSubstitutes,
  parseChord,
  pedalStrings,
  pitchName,
  plainName,
  POINT_LABEL,
  sameChord,
  samePole,
  FAMILY_LABEL,
  type Scale,
  scaleDegrees,
  SCALES,
  spellIn,
  tonicNames,
  variantsOf,
  type Chord,
  type DegreeFeeling,
  type Geometry,
  type Key,
} from '~/core/harmony';
import { INVERSION_CHORDS } from '~/core/inversions';
import { findWorld, WORLDS } from '~/core/scales';
import { noteLabel, noteToMidi } from '~/core/notes';
import {
  polarityOf,
  relativeOf,
  romanChord,
  singOver,
  twoChordMoves,
} from '~/core/progressions';
import { fingeringsFor, MUTED, openChord, type Fingering } from '~/core/tuning';
import { TUNINGS, type Tuning } from '~/data/tunings';
import { VUELTA_GROUPS, VUELTAS, type VueltaMode } from '~/data/vueltas';
import { Fader } from '~/shared/Fader';
import { TEMPO_RANGE, useSettings } from '~/shared/settings';
import { useHydrated } from '~/shared/useHydrated';
import { Icon, PlayIcon } from '~/shared/ui/Icon';
import { Picker } from '~/shared/ui/Picker';
import { Sheet } from '~/shared/ui/Sheet';
import { TuneLink, TuningField } from '~/shared/TuningField';
import { Guardados } from '~/shared/Guardados';
import { Button, PageTitle, Rail, Segmented, Slab, SlabHead } from '~/shared/ui/ui';
import ui from '~/shared/ui/ui.module.css';
import styles from './armonia.module.css';
import { CircleNotes, CircleWheel } from './CircleOfFifths';
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

/** Lo que dura cada acorde si no se dice otra cosa, y las duraciones que se ofrecen, en pulsos. */
const DEFAULT_BEATS = 4;
const BEAT_OPTIONS = [1, 2, 3, 4, 6, 8] as const;

/**
 * Un acorde puesto en la vuelta: el acorde, cuántos pulsos dura y con qué figura se toca (0 es la más
 * fácil, las otras van de a una más difícil).
 */
type Placed = Chord & { beats?: number; shape?: number };

const beatsOf = (item: Placed) => item.beats ?? DEFAULT_BEATS;

/**
 * En la URL, la duración y la figura van pegadas al acorde: "C*2" es C durante dos pulsos y "C.1", C con
 * su segunda figura (el punto no pide codificarse en la URL; ~ sí). Así se mueven con él.
 */
function readPlaced(token: string): Placed | null {
  const [, text = '', count, figure] = /^(.*?)(?:\*(\d+))?(?:\.(\d+))?$/.exec(token) ?? [];
  const chord = parseChord(text);
  if (!chord) return null;
  const placed: Placed = { ...chord };
  const beats = Number(count);
  if (BEAT_OPTIONS.includes(beats as (typeof BEAT_OPTIONS)[number]) && beats !== DEFAULT_BEATS) {
    placed.beats = beats;
  }
  const shape = Number(figure);
  if (Number.isInteger(shape) && shape > 0) placed.shape = shape;
  return placed;
}
const placedToken = (item: Placed) =>
  chordToken(item) +
  (beatsOf(item) === DEFAULT_BEATS ? '' : `*${beatsOf(item)}`) +
  (item.shape ? `.${item.shape}` : '');

const readVuelta = (text: string) =>
  text
    .split('_')
    .map(readPlaced)
    .filter((item): item is Placed => item !== null)
    .slice(0, MAX_CHORDS);

/**
 * Cómo se arma el acorde: cada cuerda con su traste, de la 6.ª a la 1.ª. Al lado, lo que se pase en
 * `children` (lo que dura), para que el editor entre sin bajar.
 */
function ShapeGrid({
  names,
  fingering,
  children,
}: {
  names: string[];
  fingering: Fingering | null;
  children: ReactNode;
}) {
  const barre = fingering && /cejilla (\d+)/.exec(fingering.label)?.[1];
  return (
    <div className={styles.shape} data-testid="chord-shape">
      {fingering ? (
        <div>
          <p className={styles.label}>Cómo se arma</p>
          <ShapeTable names={names} frets={fingering.frets} />
        </div>
      ) : (
        <p className={ui.hint} data-keep>La mano no llega a este acorde en esta afinación: suena cerrado.</p>
      )}
      <div className={styles.shapeSide}>
        {children}
        {fingering && (
          <p className={ui.hint} data-keep>
            Traste de cada cuerda, de grave a aguda: 0 al aire, × no suena.
            {barre && ` Cejilla en el ${barre}.`}
            {fingering.noFifth && ' Sin la quinta.'}
          </p>
        )}
      </div>
    </div>
  );
}

function ShapeTable({ names, frets }: { names: string[]; frets: number[] }) {
  return (
    <table>
      <tbody>
        <tr>
          {names.map((note, index) => (
            <th key={index} scope="col">
              {note}
            </th>
          ))}
        </tr>
        <tr>
          {frets.map((fret, index) => (
            <td key={index} data-muted={fret === MUTED || undefined}>
              {fret === MUTED ? '×' : fret}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

/** La figura apretada, para la tarjeta chica de la vuelta: "×32010"; con trastes de dos cifras, separados. */
const compactShape = (fingering: Fingering) =>
  fingering.frets
    .map((fret) => (fret === MUTED ? '×' : String(fret)))
    .join(fingering.frets.some((fret) => fret > 9) ? '-' : '');

/** Los pulsos que dura un acorde, como rayitas: se ve de un vistazo cuál dura más. */
function Pulses({ beats }: { beats: number }) {
  return (
    <span className={styles.pulses} role="img" aria-label={`${beats} ${beats === 1 ? 'pulso' : 'pulsos'}`}>
      {Array.from({ length: beats }, (_, index) => (
        <span key={index} aria-hidden="true" />
      ))}
    </span>
  );
}

/** El grado como lo escribe Rooksby, con el bemol de verdad: "♭VII", "II M", "IIm7♭5". */
const romanLabel = (token: string) => token.replace(/^b/, '♭').replace(/maj$/, ' M').replace(/b(\d)/g, '♭$1');

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
        <p className={ui.hint}>Las subrayadas son de blues: chocan, pero bien puestas dan color.</p>
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

/**
 * Algo para poner en la vuelta, igual que las tarjetas de acordes: tocar el recuadro lo hace sonar y el +
 * lo pone. El que ya está puesto queda marcado, con ✓ en lugar de +.
 */
function Option({
  title,
  detail,
  why,
  current,
  disabled,
  addLabel,
  onApply,
  onPreview,
}: {
  title: string;
  detail: string;
  why?: string;
  current?: boolean;
  disabled?: boolean;
  /** Qué dice el + para quien no lo ve: "Poner Am", "Sumar F C a la vuelta". */
  addLabel: string;
  onApply: () => void;
  onPreview: () => void;
}) {
  return (
    <li className={styles.option} data-current={current || undefined}>
      <button type="button" className={styles.optionListen} disabled={disabled} onClick={onPreview}>
        <strong>
          {title} <span>{detail}</span>
        </strong>
        {why && <small>{why}</small>}
      </button>
      <button
        type="button"
        className={styles.add}
        aria-label={current ? `${detail}: es el que está` : addLabel}
        disabled={disabled || current}
        onClick={onApply}
      >
        {current ? <Icon name="check" /> : '+'}
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

/**
 * El color y la figura de un acorde, para cambiarlos sin abrir nada: va abajo de las tarjetas de los grados y
 * de las de la vuelta. El color es la misma raíz con otra tensión; la figura, otra forma de tocar el mismo acorde.
 */
function ColorShape({
  chord,
  name,
  shapeAt,
  shapeCount,
  onColor,
  onShape,
}: {
  chord: Chord;
  name: (chord: Chord) => string;
  /** La figura elegida y cuántas hay en esta afinación. */
  shapeAt: number;
  shapeCount: number;
  onColor: (suffix: string) => void;
  onShape: (shape: number) => void;
}) {
  const colors = variantsOf(chord);
  // Si el acorde vino con un color que no está en la lista (un sus4 de otro lado), queda arriba.
  const list = colors.some((variant) => variant.suffix === chord.suffix)
    ? colors
    : [{ suffix: chord.suffix, label: 'El que está', why: '' }, ...colors];
  return (
    <div className={styles.pickBar}>
      <div className={styles.pickColor}>
        {/* La misma lista que los otros campos: cada color con lo que le suma al acorde. */}
        <Picker
          compact
          label="Color"
          ariaLabel={`Color de ${name(chord)}`}
          value={chord.suffix}
          options={list.map((variant) => ({
            value: variant.suffix,
            label: `${variant.label} · ${name({ root: chord.root, suffix: variant.suffix })}`,
            detail: variant.why || undefined,
          }))}
          onChange={onColor}
        />
      </div>
      {/* Siempre está, aunque haya una sola figura: así todas las barras miden lo mismo. */}
      <button
        type="button"
        className={styles.pickShape}
        disabled={shapeCount < 2}
        aria-label={
          shapeCount < 2
            ? `${name(chord)} tiene ${shapeCount === 1 ? 'una sola figura' : 'ninguna figura'} en esta afinación`
            : `Otra figura de ${name(chord)}: va la ${shapeAt + 1} de ${shapeCount}`
        }
        title="Otra forma de tocar el mismo acorde"
        onClick={() => onShape((shapeAt + 1) % shapeCount)}
      >
        Figura {shapeCount ? shapeAt + 1 : 0}/{shapeCount}
      </button>
    </div>
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
  /** Abajo de la tarjeta: el color y la figura, en las que se pueden cambiar. */
  bar?: ReactNode;
  onListen: () => void;
  onAdd: () => void;
}

/**
 * El nombre de un acorde nunca se parte ("Fa#di / m"): la letra se achica según cuántos caracteres tiene, para
 * entrar en el ancho de su tarjeta. El CSS usa el largo; acá solo se pasa.
 */
const fitName = (text: string) => ({ '--chars': [...text].length }) as CSSProperties;

/** Un acorde para escuchar (la tarjeta entera) y sumar a la vuelta (el +). */
function ChordCard({ name, label, feeling, words, fingering, mark, bar, onListen, onAdd }: CardProps) {
  const text = words ?? (feeling ? feeling.words.join('. ') + '.' : undefined);
  return (
    <li className={styles.card}>
      <button type="button" className={styles.listen} onClick={onListen} aria-label={`Escuchar ${name}`}>
        <span className={styles.cardTop}>
          <span className={styles.degree}>{label}</span>
          {mark}
        </span>
        <strong className={styles.chordName} style={fitName(name)}>
          {name}
        </strong>
        {feeling && <Feeling feeling={feeling} />}
        {text && <span className={styles.words}>{text}</span>}
        <span className={styles.tab} data-missing={!fingering}>
          {fingering ? fingering.label + (fingering.noFifth ? ' · sin 5.ª' : '') : 'La mano no llega'}
        </span>
      </button>
      <button type="button" className={styles.add} onClick={onAdd} aria-label={`Sumar ${name} a la vuelta`}>
        +
      </button>
      {bar}
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
  const scale = findWorld(params.get('escala')) ?? findWorld(home.scale)!;
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
  const [feel, setFeel] = useState<Feel>('pulso');
  const [geometry, setGeometry] = useState<Geometry>('cuadrado');
  /** Un modal por vez: el editor del acorde, las vueltas para arrancar o las cadencias. */
  const [sheet, setSheet] = useState<'editor' | 'arrancar' | 'cerrar' | null>(null);
  /** La vuelta como vista principal: pasa al medio y el mundo se va a un costado. */
  const [wide, setWide] = useState(false);
  /** En pantallas anchas, las columnas de los costados se pliegan como en el Afinador y arrancan cerradas: el mundo manda. */
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  /** La rueda arranca abierta donde entra al lado de los acordes; en el celular, cerrada. */
  /** En el celular la rueda se abre a pedido; en pantalla ancha está siempre a la vista. */
  const [circleOpen, setCircleOpen] = useState(false);
  /** El acorde que tocaste en la rueda: va al medio con su +. */
  const [circlePick, setCirclePick] = useState<Chord | null>(null);
  /**
   * El color y la figura que elegiste en cada grado del mundo, antes de sumarlo. Son de ese mundo: al
   * cambiar de tónica o de escala, los grados vuelven a sus tríadas.
   */
  const [picks, setPicks] = useState<{ world: string; byDegree: Record<number, Placed> }>({
    world: '',
    byDegree: {},
  });
  /** Sin lugar para las tres columnas, abrir un costado pliega el otro: el medio no se aplasta. */
  const openSide = (side: 'left' | 'right') => {
    const cramped = window.matchMedia('(max-width: 1179px)').matches;
    if (side === 'left') {
      setLeftOpen(true);
      if (cramped) setRightOpen(false);
    } else {
      setRightOpen(true);
      if (cramped) setLeftOpen(false);
    }
  };
  /** El acorde que se está arrastrando y dónde caería. */
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const [editorTab, setEditorTab] = useState<'color' | 'bajo' | 'cambiar' | 'cantar'>('color');
  /**
   * Desde qué acorde se arman las opciones del editor. Quedan quietas mientras probás: si no, cada
   * cambio rearmaría las listas y todo saltaría de lugar. `origin` es el acorde con que se abrió (para
   * Cambiar); `colorFrom`, el último que salió de Cambiar (para Color).
   */
  const [origin, setOrigin] = useState<Chord | null>(null);
  const [colorFrom, setColorFrom] = useState<Chord | null>(null);

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
  const vueltaText = (chords: Placed[]) => chords.slice(0, MAX_CHORDS).map(placedToken).join('_');
  /** Cambia la vuelta a partir de la última pedida, no de la que se ve. */
  const setVuelta = (change: Placed[] | ((current: Placed[]) => Placed[])) =>
    update((base) => ({
      v: vueltaText(typeof change === 'function' ? change(readVuelta(base.get('v') ?? '')) : change),
    }));
  const extendVuelta = (chords: Placed[]) =>
    setVuelta((current) => (current.length + chords.length > MAX_CHORDS ? current : [...current, ...chords]));
  /**
   * Dónde está, en la última vuelta pedida, el acorde que se ve en `index`. Dos toques seguidos pueden
   * llegar antes de que la pantalla se actualice: la posición que se ve ya no es la de la vuelta, así que
   * se busca el mismo acorde (el primero, segundo… de su nombre) y no el que quedó en ese lugar.
   */
  const locate = (current: readonly Chord[], index: number) => {
    const seen = vuelta[index];
    if (!seen) return -1;
    const token = chordToken(seen);
    const nth = vuelta.slice(0, index).filter((item) => chordToken(item) === token).length;
    let count = 0;
    const found = current.findIndex((item) => chordToken(item) === token && count++ === nth);
    // Si no está, lo más probable es que se haya cambiado de acorde ahí mismo (otro color, otro bajo): con
    // la vuelta del mismo largo, vale su lugar.
    return found < 0 && current.length === vuelta.length ? index : found;
  };
  /** Corre un acorde un lugar a la izquierda (-1) o a la derecha (1). */
  const shift = (index: number, step: -1 | 1) =>
    setVuelta((current) => {
      const from = locate(current, index);
      const to = from + step;
      if (from < 0 || !current[to]) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to]!, next[from]!];
      return next;
    });
  const removeAt = (index: number) =>
    setVuelta((current) => {
      const at = locate(current, index);
      return at < 0 ? current : current.filter((_, position) => position !== at);
    });

  /** Las figuras de un acorde en esta afinación, de la más fácil a la más difícil. */
  const shapesOf = (chord: Chord) =>
    fingeringsFor(tuning.notes, chord.root, CHORD_STEPS[chord.suffix]!, chord.bass ?? chord.root);
  /** La figura con que se toca: la elegida en la vuelta, o la más fácil. */
  const finger = (chord: Placed) => {
    const shapes = shapesOf(chord);
    return shapes[chord.shape ?? 0] ?? shapes[0] ?? null;
  };
  /** Elige la figura de un acorde de la vuelta, y suena. */
  const setShapeAt = (index: number, shape: number) => {
    setVuelta((current) => {
      const at = locate(current, index);
      return current.map((item, position) =>
        position === at ? { ...item, shape: shape === 0 ? undefined : shape } : item,
      );
    });
    if (vuelta[index]) listen({ ...vuelta[index], shape });
  };
  /** El color de un acorde de la vuelta, como en el editor: la misma raíz, otro color. */
  const setColorAt = (index: number, suffix: string) =>
    replaceAt(index, (item) => ({ root: item.root, suffix }));
  const steps = vuelta.map((chord) => ({
    voicing: voicingOf(tuning, chord, finger(chord)),
    beats: beatsOf(chord),
  }));
  const player = useVuelta({ steps, a4, tempo, feel });

  const name = (chord: Chord) => chordName(chord, key, notation);
  const listen = (chord: Placed) => player.strum(voicingOf(tuning, chord, finger(chord)));
  /** Suma un acorde al final: dura lo mismo que el último, así una vuelta de dos pulsos sigue en dos. */
  const add = (chord: Placed) => {
    listen(chord);
    setVuelta((current) => {
      if (current.length >= MAX_CHORDS) return current;
      const previous = current[current.length - 1];
      return [...current, previous?.beats ? { ...chord, beats: previous.beats } : chord];
    });
  };
  /** Cambia un acorde; si el cambio es una función, se aplica sobre el acorde pedido, no sobre el que se ve. */
  const replaceAt = (index: number, change: Chord | ((item: Chord) => Chord)) => {
    const apply = typeof change === 'function' ? change : () => change;
    // El acorde cambia, lo que dura queda; la figura vuelve a la más fácil del acorde nuevo.
    setVuelta((current) => {
      const at = locate(current, index);
      return current.map((item, position) =>
        position === at ? { ...apply(item), beats: item.beats, shape: undefined } : item,
      );
    });
    if (vuelta[index]) listen({ ...apply(vuelta[index]), shape: undefined });
  };

  /** Cuántos pulsos dura un acorde, o todos si no se dice cuál. */
  const setBeatsAt = (index: number | null, count: number) =>
    setVuelta((current) => {
      const at = index === null ? null : locate(current, index);
      return current.map((item, position) =>
        at === null || position === at
          ? { ...item, beats: count === DEFAULT_BEATS ? undefined : count }
          : item,
      );
    });
  /** Si todos duran lo mismo, cuánto; si no, ninguno marcado. */
  const durations = new Set(vuelta.map(beatsOf));
  const allBeats = durations.size === 1 ? String([...durations][0]) : '';
  const beatOptions = BEAT_OPTIONS.map((count) => ({ value: String(count), label: String(count) }));

  const degrees = scaleDegrees(key);
  const last = vuelta[vuelta.length - 1] ?? null;
  const groups = colorGroups(key, last);
  const pedal = pedalStrings(
    tuning.notes.map((note) => noteToMidi(note) % 12),
    vuelta,
  );
  const active = selected !== null && selected < vuelta.length ? selected : null;
  const activeChord = active === null ? null : vuelta[active]!;
  const base = origin ?? activeChord;
  const baseColor = colorFrom ?? activeChord;
  const baseRole = base && functionOf(base, key);
  const baseRelative = base && relativeOf(base);
  /** La familia del acorde de partida, con él mismo adentro: el que está puesto se marca. */
  const family =
    base && baseRole
      ? [
          {
            chord: { root: base.root, suffix: base.suffix },
            label: degreeLabel(base, key),
            why: 'El que tenías.',
          },
          ...functionSubstitutes(base, key),
        ]
      : [];
  const isActive = (chord: Chord) =>
    !!activeChord && activeChord.root === chord.root && activeChord.suffix === chord.suffix;
  const pole = last && !last.bass ? samePole(last.root) : null;
  /** El acorde de la tónica. En alguna escala de pocas notas (la iwato) no entra ninguno: va la nota sola. */
  const tonicChord: Chord = degrees.find((item) => item.degree === 0)?.chord ?? { root: tonic, suffix: '5' };
  const mode: VueltaMode = chordColor(tonicChord.suffix) === 'minor' ? 'menor' : 'mayor';
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
  const circleProps = {
    keyOf: key,
    vuelta,
    // En la rueda, cada casilla se escribe en su propio tono: C#m y no D♭m, como el relativo de E.
    name: (chord: Chord) =>
      chordName(
        chord,
        { tonic: chord.root, scale: findScale(chordColor(chord.suffix) === 'minor' ? 'natural' : 'mayor')! },
        notation,
      ),
    worldTonic: tonicChord,
    picked: circlePick,
  };

  const world = `${tonic}|${scale.id}`;
  const pickOf = (degree: number) => (picks.world === world ? picks.byDegree[degree] : undefined);
  /** Elige el color o la figura de un grado, y suena. */
  const pickAt = (degree: number, chord: Placed) => {
    setPicks((current) => ({
      world,
      byDegree: { ...(current.world === world ? current.byDegree : {}), [degree]: chord },
    }));
    listen(chord);
  };
  const card = (chord: Placed, label: string, extra: Partial<CardProps> = {}, id?: string) => (
    <ChordCard
      key={id ?? chordToken(chord) + label}
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

  /** Pone otro acorde desde Cambiar: las listas de Cambiar no se mueven, Color pasa a ser el del nuevo. */
  const swapTo = (index: number, chord: Chord) => {
    replaceAt(index, chord);
    setColorFrom(chord);
  };
  const closeSheet = () => {
    setSheet(null);
    setSelected(null);
  };
  const openEditor = (index: number) => {
    setSelected(index);
    setOrigin(vuelta[index]!);
    setColorFrom(vuelta[index]!);
    setEditorTab('color');
    setSheet('editor');
    listen(vuelta[index]!);
  };
  const previewChords = (chords: Chord[]) =>
    player.preview(chords.map((chord) => voicingOf(tuning, chord, finger(chord))));
  const shown = drag ? moveItem(vuelta, drag.from, drag.to) : vuelta;
  /** Soltar: el acorde arrastrado queda donde cayó. */
  const drop = useEffectEvent((from: number, to: number) => {
    if (from === to) return;
    setVuelta((current) => {
      const at = locate(current, from);
      return at < 0 ? current : moveItem(current, at, Math.min(to, current.length - 1));
    });
  });
  // El arrastre se sigue desde la ventana: al reordenarse la lista, la manija cambia de lugar en la página
  // y el navegador deja de mandarle a ella los movimientos del dedo.
  useEffect(() => {
    if (!drag) return;
    const onMove = (event: PointerEvent) => {
      const slot = document
        .elementsFromPoint(event.clientX, event.clientY)
        .find(
          (element): element is HTMLElement =>
            element instanceof HTMLElement && element.dataset.slot !== undefined,
        );
      if (slot && Number(slot.dataset.slot) !== drag.to) setDrag({ ...drag, to: Number(slot.dataset.slot) });
    };
    const onUp = () => {
      drop(drag.from, drag.to);
      setDrag(null);
    };
    const onCancel = () => setDrag(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [drag]);
  const neighbors =
    active === null ? [] : [active - 1, active + 1].filter((i) => i >= 0 && i < vuelta.length);

  return (
    <div className={styles.wrap}>
      <div
        className={styles.page}
        data-wide={(wide && rightOpen) || undefined}
        data-left={leftOpen}
        data-right={rightOpen}
      >
        {/* Al medio, el mundo y sus acordes: lo principal. */}
        <div className={styles.center}>
          <Slab>
            <PageTitle eyebrow="Acordes por emoción" title="Armonía" toolName>
              <p>Elegí un mundo, escuchá qué dice cada acorde y armá tu vuelta.</p>
            </PageTitle>
            <div className={ui.setup}>
              <TuningField
                tuning={tuning}
                // La tónica vuelve a la que mejor cae sobre las cuerdas al aire de la nueva afinación.
                onChange={(id) => update({ afinacion: id === DEFAULT_TUNING ? null : id, tono: null })}
              />
              <Picker
                id="tonica"
                label="Tónica"
                columns={4}
                value={String(tonic)}
                options={tonicNames(scale).map((label, pc) => ({
                  value: String(pc),
                  label: pitchName(label, notation),
                }))}
                onChange={(value) => update({ tono: value })}
              />
              {/* Catorce mundos en pestañas se comían media pantalla: van en un desplegable, por familia. */}
              <Picker
                id="mundo"
                label="Mundo"
                value={scale.id}
                groups={(Object.keys(FAMILY_LABEL) as Scale['family'][]).map((family) => ({
                  id: family,
                  name: FAMILY_LABEL[family],
                  options: WORLDS.filter((other) => other.family === family).map((other) => ({
                    value: other.id,
                    label: other.name,
                    detail: other.character,
                  })),
                }))}
                onChange={(value) => update({ escala: value })}
              />
              <TuneLink tuning={tuning} />
              {/* Tus vueltas: se guarda la vuelta con su tonalidad y su afinación, como el link. */}
              <Guardados
                tool="armonia"
                label="Mis vueltas"
                title="Tus vueltas"
                noun="esta vuelta"
                name={vuelta.map(name).join(' ')}
                detail={`${pitchName(spellIn(tonic, key), notation)} ${scale.name.toLowerCase()} · ${tuning.name}`}
                search={params.toString()}
                canSave={vuelta.length > 0}
              />
            </div>
          </Slab>

          {/* Sin rótulo "Mundo": el nombre del mundo ya lo dice, y el desplegable para cambiarlo está arriba. */}
          <Slab>
            {/* En pantalla ancha, la rueda va sola a la derecha, a la altura del mundo; a la izquierda, el mundo,
                sus acordes y lo que se lee de la rueda. En el celular, todo en fila y la rueda se abre a pedido. */}
            <div className={styles.worldGrid} data-circle={circleOpen ? 'open' : 'closed'}>
              <div className={styles.world}>
                <p className={styles.worldName}>
                  {pitchName(spellIn(tonic, key), notation)} {scale.name.toLowerCase()}
                  {scale.alias && <small> · {scale.alias.toLowerCase()}</small>}
                  <span className={styles.point} data-point={scale.point}>
                    {POINT_LABEL[scale.point]}
                  </span>
                </p>
                <p>{scale.character}</p>
                {!SCALES.includes(scale) && (
                  <p className={ui.hint}>
                    Esta escala no está en el libro de De María: sus acordes no traen la emoción de cada
                    grado. Escuchalos y elegí con el oído.
                    {scale.steps.length !== 7 &&
                      ' Tiene menos acordes que las de siete notas: solo los que entran enteros en la escala.'}
                  </p>
                )}
                {!!scale.characteristic?.length && (
                  <p className={ui.hint}>
                    Para que {scale.family === 'modo' ? 'el modo' : 'la escala'} se sienta, usá los acordes
                    marcados con ★: son los que la distinguen de la escala mayor o menor de siempre.{' '}
                    {scale.risky !== undefined &&
                      'El marcado con OJO tira hacia otra tónica: usalo poco o nada.'}
                  </p>
                )}
              </div>
              <div className={styles.worldChords}>
                <h3 className={styles.subhead}>Sus acordes</h3>
                <p className={ui.hint}>Tocá un acorde para escucharlo; el + lo suma a tu vuelta.</p>
                <ul className={styles.cards} data-testid="degrees">
                  {degrees.map((item, degree) => {
                    const chord: Placed = pickOf(degree) ?? item.chord;
                    const shapeCount = shapesOf(chord).length;
                    // Con otro color, en lugar de la emoción del grado se lee qué le suma la tensión.
                    const variant =
                      chord.suffix === item.chord.suffix
                        ? undefined
                        : variantsOf(item.chord).find((other) => other.suffix === chord.suffix);
                    return card(
                      chord,
                      degreeLabel(chord, key),
                      {
                        feeling: item.feeling,
                        words: variant?.why,
                        mark: item.characteristic ? (
                          <span className={styles.star} title="Grado característico">
                            ★
                          </span>
                        ) : item.risky ? (
                          <span className={styles.risk} title="Tira hacia otra tónica">
                            OJO
                          </span>
                        ) : undefined,
                        bar: (
                          <ColorShape
                            chord={chord}
                            name={name}
                            shapeAt={Math.min(chord.shape ?? 0, Math.max(0, shapeCount - 1))}
                            shapeCount={shapeCount}
                            onColor={(suffix) => pickAt(degree, { root: chord.root, suffix })}
                            onShape={(shape) => pickAt(degree, { ...chord, shape: shape || undefined })}
                          />
                        ),
                      },
                      // La tarjeta es la del grado: cambiarle el color no la rearma, y el foco queda.
                      `grado-${degree}`,
                    );
                  })}
                </ul>
              </div>
              <button
                type="button"
                className={styles.circleToggle}
                aria-expanded={circleOpen}
                data-testid="circulo-fold"
                onClick={() => setCircleOpen(!circleOpen)}
              >
                Círculo de quintas <span>· los vecinos del mundo</span>
              </button>
              {/* La columna del círculo: su título, la rueda y lo que se lee de ella, juntos. */}
              <div className={styles.circle}>
                <h3 className={styles.subhead}>Círculo de quintas</h3>
                <CircleWheel
                  {...circleProps}
                  onPick={(chord) => {
                    setCirclePick(chord);
                    listen(chord);
                  }}
                  onAdd={add}
                />
                <CircleNotes
                  {...circleProps}
                  onMoveWorld={(chord) =>
                    update({
                      tono: String(chord.root),
                      escala: chordColor(chord.suffix) === 'minor' ? 'natural' : 'mayor',
                    })
                  }
                />
              </div>
            </div>
          </Slab>
        </div>

        {/* A la izquierda, de dónde sacar más acordes: todo cerrado hasta que lo pidas. */}
        <aside className={`${styles.side} ${styles.left}`} data-open={leftOpen} aria-label="Más acordes">
          {/* Cerrada, en pantallas anchas queda una franja con su nombre para volver a abrirla. */}
          <Rail
            side="left"
            className={styles.rail}
            label="Más acordes"
            ariaLabel="Abrir más acordes"
            onOpen={() => openSide('left')}
          />
          <div className={styles.sideBody}>
            <div className={styles.sideHead}>
              <span>Más acordes</span>
              <button
                type="button"
                className={styles.fold}
                aria-label="Cerrar la columna de más acordes"
                onClick={() => setLeftOpen(false)}
              >
                <Icon name="back" />
              </button>
            </div>
            <Slab>
              <SlabHead title="Más color" />
              <p className={ui.hint}>
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
                  {group.intro && <p className={ui.hint}>{group.intro}</p>}
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
                  <p className={ui.hint}>
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
                <p className={ui.hint}>
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
                          {(['', 'm'] as const).map((suffix) => {
                            const chord: Chord = { root: point.root, suffix };
                            const label = plainName(point.root, notation) + suffix;
                            // Como las tarjetas: el recuadro suena, el + lo suma.
                            return (
                              <div key={suffix} className={styles.poleChord}>
                                <button
                                  type="button"
                                  aria-label={`Escuchar ${label}`}
                                  onClick={() => listen(chord)}
                                >
                                  {label}
                                </button>
                                <button
                                  type="button"
                                  className={styles.add}
                                  aria-label={`Sumar ${label} a la vuelta`}
                                  onClick={() => add(chord)}
                                >
                                  +
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
                {pole && (
                  <p className={ui.hint} data-keep data-testid="same-pole">
                    Tu último acorde está en el polo {pole.pole}. Por el mismo polo pasás a otro grupo:{' '}
                    {pole.roots.map((root) => plainName(root, notation)).join(' o ')}.
                  </p>
                )}
                <p className={ui.hint}>
                  Para la melodía: sobre acordes mayores, lidio (4.ª ascendida) o lidio con la 7.ª bajada;
                  sobre menores, dórico. La pentatónica queda bien sobre todo.
                </p>
              </details>
            </Slab>
          </div>
        </aside>

        {/* A la derecha, tu vuelta: queda a mano mientras recorrés el resto. */}
        <aside className={`${styles.side} ${styles.right}`} data-open={rightOpen} aria-label="Tu vuelta">
          <Rail
            side="right"
            className={styles.rail}
            label={`Tu vuelta${vuelta.length > 0 ? ` · ${vuelta.length}` : ''}`}
            ariaLabel="Abrir tu vuelta"
            onOpen={() => openSide('right')}
          />
          <div className={styles.sideBody}>
            <Slab className={styles.vueltaSlab}>
              <span id="vuelta" className={styles.anchor} />
              <SlabHead title="Tu vuelta">
                <div className={styles.vueltaTools}>
                  {/* En pantallas anchas, la vuelta también se pliega a un costado. Agrandada, primero se achica. */}
                  {!wide && (
                    <button
                      type="button"
                      className={styles.fold}
                      aria-label="Cerrar la columna de tu vuelta"
                      onClick={() => setRightOpen(false)}
                    >
                      <Icon name="forward" />
                    </button>
                  )}
                  {/* La flecha estira la vuelta hacia el medio y la vuelve a su lugar; en el celular, abre para abajo. */}
                  <Button
                    variant="mini"
                    ariaPressed={wide}
                    ariaLabel={wide ? 'Achicar la vuelta' : 'Agrandar la vuelta'}
                    title={
                      wide ? 'Volver la vuelta a su lugar' : 'Estirar la vuelta: cada acorde con su figura'
                    }
                    onClick={() => setWide(!wide)}
                  >
                    <Icon name={wide ? 'right' : 'left'} className={styles.widen} />
                  </Button>
                </div>
              </SlabHead>
              {vuelta.length === 0 ? (
                <div className={styles.empty} data-testid="vuelta-empty">
                  <p className={ui.hint}>
                    Sumá acordes con el +, o arrancá con una vuelta que ya funcionó y después cambiala.
                  </p>
                  <Button variant="primary" full onClick={() => setSheet('arrancar')}>
                    Arrancar con una vuelta
                  </Button>
                  <Fader />
                </div>
              ) : (
                <ol className={styles.chips} data-testid="vuelta" data-wide={wide || undefined}>
                  {shown.map((chord, index) => {
                    const feeling = feelingOf(chord, key);
                    const fingering = finger(chord);
                    const shapeCount = shapesOf(chord).length;
                    const shapeAt = fingering ? Math.min(chord.shape ?? 0, shapeCount - 1) : 0;
                    // La clave sigue al acorde (el primer C, el segundo C…), no al lugar: al moverlo, su botón y
                    // el foco van con él.
                    const token = chordToken(chord);
                    const nth = shown.slice(0, index).filter((item) => chordToken(item) === token).length;
                    return (
                      <li
                        key={`${token}#${nth}`}
                        data-slot={index}
                        data-dragging={drag?.to === index || undefined}
                        className={styles.chip}
                      >
                        <div className={styles.chipCard}>
                          <button
                            type="button"
                            className={styles.chipMain}
                            aria-pressed={active === index}
                            aria-haspopup="dialog"
                            data-playing={(!drag && player.current === index) || undefined}
                            onClick={() => openEditor(index)}
                          >
                            <small>{degreeLabel(chord, key)}</small>
                            <strong style={fitName(name(chord))}>{name(chord)}</strong>
                            {feeling && <Feeling feeling={feeling} />}
                            {wide && feeling && (
                              <span className={styles.words}>{feeling.words.join('. ')}.</span>
                            )}
                            {/* Cómo se arma, siempre a la vista: se toca leyendo la vuelta. */}
                            <span className={styles.tab} data-missing={!fingering}>
                              {fingering
                                ? wide
                                  ? fingering.label
                                  : compactShape(fingering)
                                : 'La mano no llega'}
                            </span>
                            <Pulses beats={beatsOf(chord)} />
                          </button>
                          <button
                            type="button"
                            className={styles.chipRemove}
                            aria-label={`Sacar ${name(chord)}`}
                            onClick={() => {
                              removeAt(index);
                              setSelected(null);
                            }}
                          >
                            <Icon name="close" />
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
                            onKeyDown={(event) => {
                              const step =
                                event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
                              if (!step) return;
                              event.preventDefault();
                              shift(index, step);
                            }}
                          >
                            <Icon name="grip" />
                          </button>
                        </div>
                        {/* Color y figura se cambian acá mismo, sin abrir el editor. */}
                        <ColorShape
                          chord={chord}
                          name={name}
                          shapeAt={shapeAt}
                          shapeCount={shapeCount}
                          onColor={(suffix) => setColorAt(index, suffix)}
                          onShape={(shape) => setShapeAt(index, shape)}
                        />
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
                      ariaLabel={player.running ? 'Parar la vuelta' : 'Tocar la vuelta'}
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
                      <PlayIcon running={player.running} />
                    </Button>
                    <label className={ui.field}>
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
                    <div className={`${ui.field} ${styles.fullRow}`}>
                      <span>Cómo se toca</span>
                      <Segmented
                        label="Cómo se toca"
                        stretch
                        value={feel}
                        options={[
                          { value: 'pulso', label: 'Rasgueo' },
                          { value: 'acorde', label: 'Un golpe' },
                          { value: 'arpegio', label: 'Arpegio' },
                        ]}
                        onChange={setFeel}
                      />
                    </div>
                    <Fader />
                  </div>
                  <details className={styles.more}>
                    <summary>Cuánto dura cada acorde</summary>
                    <div className={ui.field}>
                      {/* Una sola línea: qué hace esto y cómo darle a uno su propia duración. */}
                      <span>Todos a (pulsos) · o tocá un acorde de la vuelta para darle la suya</span>
                      <Segmented
                        label="Pulsos de todos los acordes"
                        stretch
                        value={allBeats}
                        options={beatOptions}
                        onChange={(value) => setBeatsAt(null, Number(value))}
                      />
                    </div>
                  </details>

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
          </div>
        </aside>
      </div>

      <Sheet
        fixed
        open={sheet === 'editor' && activeChord !== null}
        title={activeChord ? name(activeChord) : ''}
        onClose={closeSheet}
        tools={
          active !== null && (
            <div className={styles.editorTools}>
              <Button
                variant="mini"
                ariaLabel="Sacar de la vuelta"
                onClick={() => {
                  removeAt(active);
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
            <ShapeGrid
              names={tuning.notes.map((note) => noteLabel(note, notation))}
              fingering={finger(activeChord)}
            >
              <div className={ui.field}>
                <span>Dura (pulsos)</span>
                <Segmented
                  label="Cuántos pulsos dura"
                  stretch
                  value={String(beatsOf(activeChord))}
                  options={beatOptions}
                  onChange={(value) => setBeatsAt(active, Number(value))}
                />
              </div>
              {shapesOf(activeChord).length > 1 && (
                <div className={ui.field}>
                  <span>Figura</span>
                  <Segmented
                    label="Con qué figura se toca"
                    stretch
                    value={String(Math.min(activeChord.shape ?? 0, shapesOf(activeChord).length - 1))}
                    options={shapesOf(activeChord).map((_, shape) => ({
                      value: String(shape),
                      label: String(shape + 1),
                    }))}
                    onChange={(value) => setShapeAt(active, Number(value))}
                  />
                </div>
              )}
            </ShapeGrid>
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
                {baseColor &&
                  variantsOf(baseColor).map((variant) => {
                    const next: Chord = { root: baseColor.root, suffix: variant.suffix };
                    return (
                      <Option
                        key={variant.suffix}
                        title={variant.label}
                        detail={name(next)}
                        addLabel={`Poner ${name(next)}`}
                        why={variant.why}
                        current={isActive(next)}
                        onApply={() => replaceAt(active, next)}
                        onPreview={() => previewChords([next])}
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
                      addLabel={`Poner ${name(next)}`}
                      why={role.why}
                      disabled={bass === undefined}
                      current={bassRoleOf(activeChord) === role.id}
                      onApply={() =>
                        replaceAt(active, (item) => {
                          const value = bassFor(item, role.id);
                          if (value === undefined) return item;
                          return { ...item, bass: value === item.root ? undefined : value };
                        })
                      }
                      onPreview={() => previewChords([next])}
                    />
                  );
                })}
              </ul>
            )}
            {editorTab === 'bajo' && INVERSION_CHORDS.some((item) => item.suffix === activeChord.suffix) && (
              <Link
                className={ui.bridge}
                to={`/inversiones?${new URLSearchParams({
                  ...(tuning.id === DEFAULT_TUNING ? {} : { afinacion: tuning.id }),
                  acorde: chordToken({ root: activeChord.root, suffix: activeChord.suffix }),
                })}`}
              >
                Todas las formas de {name({ root: activeChord.root, suffix: activeChord.suffix })} <Icon name="right" />
              </Link>
            )}
            {editorTab === 'cambiar' && (
              <>
                {base && baseRole && (
                  <>
                    <p className={styles.label}>
                      Misma función: {name(base)} hace de {baseRole.label.toLowerCase()}
                    </p>
                    <p className={ui.hint}>
                      {baseRole.label}: {baseRole.why}. Cambialo por otro del mismo papel y la vuelta sigue
                      yendo al mismo lado, con otro color.
                    </p>
                    <ul className={styles.variants} data-testid="same-function">
                      {family.map((item) => (
                        <Option
                          key={chordToken(item.chord)}
                          title={
                            baseRelative && sameChord(item.chord, baseRelative)
                              ? `${item.label} · relativo`
                              : item.label
                          }
                          detail={name(item.chord)}
                          addLabel={`Poner ${name(item.chord)}`}
                          why={item.why}
                          current={isActive(item.chord)}
                          onApply={() => swapTo(active, item.chord)}
                          onPreview={() => previewChords([item.chord])}
                        />
                      ))}
                    </ul>
                  </>
                )}
                <p className={styles.label}>Misma raíz u otro clima</p>
                <ul className={styles.variants}>
                  {[
                    {
                      id: 'relativo',
                      label: 'Relativo',
                      chord: family.some((item) => baseRelative && sameChord(item.chord, baseRelative))
                        ? null
                        : baseRelative,
                      why: 'Comparten dos notas: el cambio es suave y cambia el clima.',
                    },
                    {
                      id: 'polaridad',
                      label: 'Al revés',
                      chord: base && polarityOf(base),
                      why: 'Misma raíz, de mayor a menor o al revés: sorprende.',
                    },
                  ].map(
                    (swapItem) =>
                      swapItem.chord && (
                        <Option
                          key={swapItem.id}
                          title={swapItem.label}
                          detail={name(swapItem.chord)}
                          addLabel={`Poner ${name(swapItem.chord!)}`}
                          why={swapItem.why}
                          current={isActive(swapItem.chord)}
                          onApply={() => swapTo(active, swapItem.chord!)}
                          onPreview={() => previewChords([swapItem.chord!])}
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
                      addLabel={`Sumar ${name(move.chord)} después de ${name(activeChord)}`}
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
            {neighbors.length > 0 && (
              <p className={ui.hint} data-keep data-testid="common-tones">
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
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'arrancar'} title="Para arrancar" onClose={closeSheet} testId="starters">
        <p className={ui.hint}>
          Vueltas que ya funcionaron. Son para arrancar: después movelas arrastrando, estiralas o cambiá un
          acorde por su relativo.
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
              <p className={ui.hint}>{group.intro}</p>
              <ul className={styles.starters}>
                {items.map((item) => {
                  const chords = starter(item.degrees, group.mode);
                  return (
                    <li key={item.id} className={styles.starter} data-testid={`vuelta-${item.id}`}>
                      <button
                        type="button"
                        className={styles.starterListen}
                        aria-label={`Escuchar ${chords.map(name).join(' ')}`}
                        onClick={() =>
                          player.preview(chords.map((chord) => voicingOf(tuning, chord, finger(chord))))
                        }
                      >
                        <span className={styles.starterDegrees}>
                          {item.degrees.map(romanLabel).join(' ')}
                        </span>
                        <strong className={styles.starterChords}>{chords.map(name).join(' · ')}</strong>
                        {item.why && <span className={styles.words}>{item.why}</span>}
                        {item.songs.length > 0 && (
                          <span className={styles.songs}>Como en {item.songs.join(', ')}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        className={styles.add}
                        aria-label={`Usar ${chords.map(name).join(' ')}`}
                        onClick={() => {
                          applyStarter(chords, group.mode);
                          closeSheet();
                        }}
                      >
                        +
                      </button>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </Sheet>

      <Sheet open={sheet === 'cerrar'} title="Cerrar con…" onClose={closeSheet} testId="cadences">
        <p className={ui.hint}>La última cadencia es la última emoción que se lleva quien escucha.</p>
        <ul className={styles.cadences}>
          {CADENCES.map((cadence) => {
            const chords = cadenceChords(cadence, tonic);
            return (
              <Option
                key={cadence.id}
                title={cadence.name}
                detail={chords.map(name).join(' → ')}
                addLabel={`Sumar ${chords.map(name).join(' ')} a la vuelta`}
                why={cadence.why}
                disabled={vuelta.length + chords.length > MAX_CHORDS}
                onApply={() => {
                  extendVuelta(chords);
                  closeSheet();
                }}
                onPreview={() => previewChords(chords)}
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
            <Icon name={player.running ? 'stop' : 'play'} data-filled="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
