import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams, type MetaFunction } from 'react-router';
import { getAudio } from '~/audio/engine';
import { pluckString } from '~/audio/instrument';
import { CHORD_STEPS, chordToken, parseChord, plainName, type Chord, type Suffix } from '~/core/harmony';
import {
  describeShape,
  encodeFrets,
  INVERSION_CHORDS,
  inversionsOf,
  parseFrets,
  tabOf,
  toneName,
  type InversionGroup,
  type Voicing,
} from '~/core/inversions';
import { noteLabel, noteToMidi } from '~/core/notes';
import { MUTED, openChord } from '~/core/tuning';
import { GROUPS, TUNINGS, type Tuning } from '~/data/tunings';
import { Fader } from '~/shared/Fader';
import { useSettings } from '~/shared/settings';
import { useHydrated } from '~/shared/useHydrated';
import { Button, PageTitle, Slab } from '~/shared/ui/ui';
import { Diapason, LAST_FRET } from './Diapason';
import styles from './inversiones.module.css';

export const meta: MetaFunction = () => [
  { title: 'Inversiones de acordes en la guitarra · Afinador' },
  {
    name: 'description',
    content:
      'Todas las maneras de hacer un acorde en el mástil, agrupadas por la nota que queda en el bajo: fundamental, primera, segunda y tercera inversión, en tu afinación.',
  },
];

const DEFAULT_TUNING = 'estandar';
const EMPTY = new URLSearchParams();
const ORDINALS = ['Fundamental', '1.ª inversión', '2.ª inversión', '3.ª inversión', '4.ª inversión'];
/** Cuánto tarda cada inversión en el recorrido, en segundos. */
const TOUR_STEP = 1.4;

const findTuning = (id: string | null) =>
  TUNINGS.find((item) => item.id === id) ?? TUNINGS.find((item) => item.id === DEFAULT_TUNING)!;

/** El acorde que forman las cuerdas al aire, mayor o menor: por ahí conviene empezar. */
function homeChord(tuning: Tuning): Chord {
  const midis = tuning.notes.map(noteToMidi);
  const chord = openChord(midis);
  if (!chord) return { root: Math.min(...midis) % 12, suffix: '' };
  return { root: midis[chord.root]! % 12, suffix: /^m(?!aj)/.test(chord.suffix) ? 'm' : '' };
}

/** El acorde de la URL, si es uno de los que se pueden abrir acá; la inversión no importa. */
function readChord(text: string | null): Chord | null {
  const chord = text ? parseChord(text) : null;
  if (!chord || !INVERSION_CHORDS.some((item) => item.suffix === chord.suffix)) return null;
  return { root: chord.root, suffix: chord.suffix };
}

const suffixLabel = (suffix: Suffix) =>
  INVERSION_CHORDS.find((item) => item.suffix === suffix)?.symbol ?? suffix;

/** Las formas de una inversión, del aire hacia el cuerpo de la guitarra. */
const shapesOf = (group: InversionGroup) =>
  [...group.bare, ...group.full].sort(
    (a, b) => a.position - b.position || a.top - b.top || a.effort - b.effort,
  );

/** La forma con la que arranca cada inversión: la llena más fácil, o la justa más fácil si no hay llenas. */
function easiest(group: InversionGroup): Voicing | undefined {
  const pool = group.full.length ? group.full : group.bare;
  return [...pool].sort((a, b) => a.effort - b.effort)[0];
}

/** Un rasguido hacia abajo, de la cuerda más grave a la más aguda. */
function strumVoicing(midis: Voicing['midis'], a4: number, when: number) {
  let position = 0;
  midis.forEach((midi, stringIndex) => {
    if (midi === null) return;
    pluckString(stringIndex, midi, { a4, when: when + position * 0.035, velocity: 0.9 });
    position += 1;
  });
}

interface View {
  /** Para qué acorde y afinación vale: si cambian, se vuelve a la fundamental. */
  key: string;
  inversion: number;
  /** La forma elegida (sus trastes), o null para la más fácil. */
  frets: string | null;
}

export default function InversionesRoute() {
  const hydrated = useHydrated();
  const [searchParams, setSearchParams] = useSearchParams();
  // La página estática no conoce la URL: hasta hidratar vale lo de siempre.
  const params = hydrated ? searchParams : EMPTY;
  const notation = useSettings((s) => s.notation);
  const a4 = useSettings((s) => s.a4);

  const tuning = findTuning(params.get('afinacion'));
  const chord = readChord(params.get('acorde')) ?? homeChord(tuning);
  const open = useMemo(() => tuning.notes.map(noteToMidi), [tuning.notes]);
  const groups = useMemo(
    () => inversionsOf(open, chord.root, chord.suffix),
    [open, chord.root, chord.suffix],
  );

  const chordKey = `${tuning.id}|${chordToken(chord)}`;
  const [view, setView] = useState<View>({ key: chordKey, inversion: 0, frets: null });
  const current: View = view.key === chordKey ? view : { key: chordKey, inversion: 0, frets: null };
  const group = groups[current.inversion] ?? groups[0]!;
  const shapes = shapesOf(group);
  const wanted = current.frets ?? easiest(group)?.frets.join();
  const index = Math.max(
    0,
    shapes.findIndex((shape) => shape.frets.join() === wanted),
  );
  const listed = shapes[index] ?? null;

  // La forma propia, armada tocando el diapasón. Vive en la URL para poder compartirla; una nota que no
  // es del acorde (de un link viejo, o de otra afinación) se apaga.
  const customFrets = useMemo(() => {
    const frets = parseFrets(params.get('forma'), open.length, LAST_FRET);
    if (!frets) return null;
    const chordSteps = CHORD_STEPS[chord.suffix]!.map((item) => item % 12);
    return frets.map((fret, stringIndex) =>
      fret !== MUTED && chordSteps.includes((open[stringIndex]! + fret - chord.root + 120) % 12)
        ? fret
        : MUTED,
    );
  }, [params, open, chord.root, chord.suffix]);
  const editing = customFrets !== null;
  const custom = customFrets ? describeShape(open, chord.root, chord.suffix, customFrets) : null;
  const voicing: Voicing | null = editing ? custom : listed;
  const shownGroup = (custom && groups.find((item) => item.bass === custom.bass)) || group;
  // Si la forma propia ya está en la lista, se dice cuál es.
  const known = custom
    ? groups
        .map((item) => ({ item, list: shapesOf(item) }))
        .map(({ item, list }) => ({
          item,
          list,
          at: list.findIndex((shape) => shape.frets.join() === custom.frets.join()),
        }))
        .find(({ at }) => at >= 0)
    : undefined;

  const tourTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stopTour = () => {
    tourTimers.current.forEach(clearTimeout);
    tourTimers.current = [];
  };
  useEffect(() => stopTour, []);

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
    stopTour();
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };
  /** Cambia la nota o el tipo a partir del acorde pedido, no del que se ve. */
  const setChord = (change: Partial<Chord>) =>
    update((base) => {
      const before = readChord(base.get('acorde')) ?? homeChord(findTuning(base.get('afinacion')));
      return { acorde: chordToken({ ...before, ...change }), forma: null };
    });

  // Con el bemol de verdad: en mayúsculas "Db" se leería como dos letras.
  const rootName = (pc: number) => plainName(pc, notation).replace(/b$/, '♭');
  const name = rootName(chord.root) + suffixLabel(chord.suffix);
  const nameWithBass = (item: InversionGroup) =>
    item.inversion === 0 ? name : `${name}/${rootName(chord.root + item.bass)}`;

  const play = (shape: Voicing | null | undefined) => {
    if (!shape) return;
    const { ctx } = getAudio();
    strumVoicing(shape.midis, a4, ctx.currentTime + 0.02);
  };
  /** Elegir una forma la hace sonar: primero se escucha. */
  const show = (inversion: number, shape: Voicing | undefined) => {
    stopTour();
    if (editing) update({ forma: null });
    setView({ key: chordKey, inversion, frets: shape ? shape.frets.join() : null });
    play(shape);
  };
  const step = (delta: number) => {
    const next = shapes[index + delta];
    if (next) show(current.inversion, next);
  };
  /** Pone o saca un dedo. La primera vez parte de la forma que se ve; poner un dedo hace sonar esa nota. */
  const toggle = (stringIndex: number, fret: number) => {
    const removing = voicing?.frets[stringIndex] === fret;
    if (!removing) pluckString(stringIndex, open[stringIndex]! + fret, { a4 });
    update((base) => {
      const before =
        parseFrets(base.get('forma'), open.length, LAST_FRET) ?? listed?.frets ?? open.map(() => MUTED);
      const next = [...before];
      next[stringIndex] = next[stringIndex] === fret ? MUTED : fret;
      return { forma: encodeFrets(next) };
    });
  };
  const startEmpty = () => update({ forma: encodeFrets(open.map(() => MUTED)) });

  // Para comparar de oído: la forma más fácil de cada inversión, una detrás de otra, y el diapasón la sigue.
  const playTour = () => {
    stopTour();
    if (editing) update({ forma: null });
    const { ctx } = getAudio();
    const start = ctx.currentTime + 0.04;
    groups.forEach((item, position) => {
      const shape = easiest(item);
      if (!shape) return;
      strumVoicing(shape.midis, a4, start + position * TOUR_STEP);
      tourTimers.current.push(
        setTimeout(
          () => setView({ key: chordKey, inversion: item.inversion, frets: shape.frets.join() }),
          position * TOUR_STEP * 1000,
        ),
      );
    });
  };

  const details = voicing
    ? [
        `${voicing.strings} cuerdas`,
        voicing.barre !== null && `cejilla en el ${voicing.barre}`,
        !editing && voicing.noFifth && 'sin la 5.ª',
      ].filter(Boolean)
    : [];

  return (
    <div className={styles.page}>
      <Slab>
        <PageTitle eyebrow="Todas las formas de un acorde" title="Inversiones">
          <p>
            El mismo acorde cambia de peso según qué nota va en el bajo. Elegí uno y recorré sus formas en el
            mástil.
          </p>
        </PageTitle>
        <div className={styles.setup}>
          <label className={styles.field} data-wide>
            <span>Afinación</span>
            <select
              id="afinacion"
              value={tuning.id}
              onChange={(event) =>
                update({
                  afinacion: event.target.value === DEFAULT_TUNING ? null : event.target.value,
                  forma: null,
                })
              }
            >
              {GROUPS.map((item) => (
                <optgroup key={item.id} label={item.name}>
                  {TUNINGS.filter((option) => option.group === item.id).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} · {option.notes.map((note) => noteLabel(note, notation)).join(' ')}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Tipo</span>
            <select
              id="tipo"
              value={chord.suffix}
              onChange={(event) => setChord({ suffix: event.target.value })}
            >
              {INVERSION_CHORDS.map((item) => (
                <option key={item.suffix} value={item.suffix}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <Link className={styles.bridge} to={`/afinador/${tuning.id}`}>
            Afinar en {tuning.name} →
          </Link>
        </div>
        <div className={styles.roots} role="group" aria-label="Nota del acorde">
          {Array.from({ length: 12 }, (_, pc) => (
            <button
              key={pc}
              type="button"
              aria-pressed={pc === chord.root}
              onClick={() => setChord({ root: pc })}
            >
              {rootName(pc)}
            </button>
          ))}
        </div>
      </Slab>

      <Slab>
        <div className={styles.inversions} role="group" aria-label="Qué va en el bajo">
          {groups.map((item) => (
            <button
              key={item.bass}
              type="button"
              aria-pressed={item.inversion === shownGroup.inversion && (!editing || custom !== null)}
              disabled={item.bare.length + item.full.length === 0}
              onClick={() => show(item.inversion, easiest(item))}
            >
              <strong>{nameWithBass(item)}</strong>
              <small>{ORDINALS[item.inversion]}</small>
            </button>
          ))}
        </div>

        <p className={styles.why}>
          {editing && !custom ? (
            'Tocá las notas tenues del diapasón para poner los dedos.'
          ) : (
            <>
              <strong>
                {shownGroup.inversion === 0 ? 'La raíz en el bajo.' : `La ${shownGroup.tone} en el bajo.`}
              </strong>{' '}
              {shownGroup.why}
            </>
          )}
        </p>

        <Diapason
          notes={tuning.notes}
          open={open}
          root={chord.root}
          suffix={chord.suffix}
          steps={CHORD_STEPS[chord.suffix]!}
          voicing={voicing}
          notation={notation}
          onToggle={toggle}
        />

        {editing ? (
          <div className={styles.mine} data-testid="mi-forma">
            {custom ? (
              <button
                type="button"
                className={styles.current}
                aria-label={`Escuchar tu forma, ${nameWithBass(shownGroup)}: ${tabOf(custom.frets)}`}
                onClick={() => play(custom)}
              >
                <span className={styles.counter}>Tu forma · {ORDINALS[shownGroup.inversion]}</span>
                <strong className={styles.mineName}>{nameWithBass(shownGroup)}</strong>
                <strong className={styles.tab}>{tabOf(custom.frets)}</strong>
                <small>{details.join(' · ')}</small>
              </button>
            ) : (
              <p className={styles.mineEmpty}>Tu forma está vacía.</p>
            )}
            {custom && (
              <ul className={styles.notes} data-testid="mi-forma-notas">
                {custom.missing.length > 0 && (
                  <li data-kind="falta">
                    {custom.missing.length === 1 ? 'Le falta la ' : 'Le faltan '}
                    {custom.missing.map((item) => toneName(item, chord.suffix)).join(', ')}
                    {custom.missing.length === 1 && custom.missing[0] === 7
                      ? ': sin la quinta el acorde se reconoce igual.'
                      : ': todavía no es el acorde entero.'}
                  </li>
                )}
                {custom.unplayable && <li data-kind="mano">{custom.unplayable}</li>}
                {custom.gap && <li>Hay una cuerda apagada en el medio: apagala apoyando un dedo vecino.</li>}
                {known && (
                  <li data-kind="lista">
                    Está en la lista: es la forma {known.at + 1} de {known.list.length} de la{' '}
                    {ORDINALS[known.item.inversion]!.toLowerCase()}.
                  </li>
                )}
                {!known && !custom.unplayable && custom.missing.length === 0 && (
                  <li data-kind="nueva">No está en la lista: es tuya.</li>
                )}
              </ul>
            )}
            <div className={styles.mineTools}>
              <Button variant="ghost" onClick={startEmpty}>
                Empezar de cero
              </Button>
              <Button variant="ghost" onClick={() => show(group.inversion, undefined)}>
                Volver a las formas
              </Button>
            </div>
          </div>
        ) : voicing ? (
          <div className={styles.browse}>
            <button
              type="button"
              className={styles.arrow}
              aria-label="Forma anterior, más cerca de la cejuela"
              disabled={index === 0}
              onClick={() => step(-1)}
            >
              ◀
            </button>
            <button
              type="button"
              className={styles.current}
              aria-label={`Escuchar ${nameWithBass(group)}: ${tabOf(voicing.frets)}`}
              onClick={() => play(voicing)}
            >
              <span className={styles.counter} data-testid="shape-counter">
                Forma {index + 1} de {shapes.length}
              </span>
              <strong className={styles.tab}>{tabOf(voicing.frets)}</strong>
              <small>{details.join(' · ')}</small>
            </button>
            <button
              type="button"
              className={styles.arrow}
              aria-label="Forma siguiente, más arriba en el mástil"
              disabled={index === shapes.length - 1}
              onClick={() => step(1)}
            >
              ▶
            </button>
          </div>
        ) : (
          <p className={styles.empty}>En esta afinación la mano no llega a ninguna forma de {name}.</p>
        )}

        <div className={styles.actions}>
          <Button variant="primary" onClick={playTour}>
            ▶ Escuchar las inversiones
          </Button>
          {!editing && (
            <Button variant="ghost" onClick={startEmpty}>
              Armar la mía
            </Button>
          )}
          <Fader compact />
        </div>
        <p className={styles.hint}>
          Lo tenue son las notas del acorde en todo el mástil; lo blanco, la forma elegida, con el bajo en
          naranja. Para armar la tuya, tocá una nota tenue y el dedo va ahí; tocá un dedo para sacarlo, o el
          nombre de una cuerda para que suene al aire.
        </p>
      </Slab>
    </div>
  );
}
