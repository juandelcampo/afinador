import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams, type MetaFunction } from 'react-router';
import {
  BASS_ROLES,
  bassFor,
  bassRoleOf,
  CADENCES,
  cadenceChords,
  cardinalGroups,
  CHORD_STEPS,
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
import { noteLabel, noteToMidi } from '~/core/notes';
import { fingeringFor, MUTED, openChord, type Fingering } from '~/core/tuning';
import { GROUPS, TUNINGS, type Tuning } from '~/data/tunings';
import { Fader } from '~/shared/Fader';
import { TEMPO_RANGE, useSettings } from '~/shared/settings';
import { useHydrated } from '~/shared/useHydrated';
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
  const vuelta = useMemo(
    () =>
      vueltaParam
        .split('_')
        .map(parseChord)
        .filter((chord): chord is Chord => chord !== null)
        .slice(0, MAX_CHORDS),
    [vueltaParam],
  );

  const [selected, setSelected] = useState<number | null>(null);
  const [tempo, setTempo] = useState(80);
  const [beats, setBeats] = useState(4);
  const [feel, setFeel] = useState<Feel>('pulso');
  const [geometry, setGeometry] = useState<Geometry>('cuadrado');

  const update = (patch: Record<string, string | null>) =>
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [name, value] of Object.entries(patch)) {
          if (value === null || value === '') next.delete(name);
          else next.set(name, value);
        }
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  const setVuelta = (chords: Chord[]) => update({ v: chords.slice(0, MAX_CHORDS).map(chordToken).join('_') });

  const finger = (chord: Chord) =>
    fingeringFor(tuning.notes, chord.root, CHORD_STEPS[chord.suffix]!, chord.bass ?? chord.root);
  const voicings = vuelta.map((chord) => voicingOf(tuning, chord, finger(chord)));
  const player = useVuelta({ voicings, a4, tempo, beats, feel });

  const name = (chord: Chord) => chordName(chord, key, notation);
  const listen = (chord: Chord) => player.strum(voicingOf(tuning, chord, finger(chord)));
  const add = (chord: Chord) => {
    listen(chord);
    if (vuelta.length >= MAX_CHORDS) return;
    setVuelta([...vuelta, chord]);
  };
  const replaceAt = (index: number, chord: Chord) => {
    setVuelta(vuelta.map((item, position) => (position === index ? chord : item)));
    listen(chord);
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

  return (
    <div className={styles.wrap}>
      <div className={styles.page}>
        <div className={styles.column}>
          <Slab>
            <PageTitle eyebrow="Acordes por emoción" title="Armonía">
              <p>
                Elegí un mundo, escuchá qué dice cada acorde y armá tu vuelta con las figuras de tu afinación.
                Las emociones son las que suele sentir la mayoría, según Mauro De María; si a vos te dicen
                otra cosa, vale lo tuyo.
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
          </Slab>

          <Slab>
            <SlabHead number="02" title="Acordes" />
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

          <Slab>
            <SlabHead number="03" title="Más color" />
            <p className={styles.hint}>
              ¿Se puede ir del III al I, cerrar con II-I, mezclar escalas? Siempre sí: lo que importa es saber
              qué emoción elegís.
            </p>
            {groups.map((group, index) => (
              <details key={group.id} className={styles.group} open={index === 0}>
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
          </Slab>

          <Slab className={styles.sinCentro}>
            <SlabHead number="05" title="Sin centro" />
            <p>
              Los puntos cardinales: un sistema consonante pero sin tónica. Dentro de un grupo vale ir de
              cualquier acorde a cualquiera, mayor o menor, y todo suena a fantasía.
            </p>
            <Segmented
              label="Geometría"
              value={geometry}
              options={[
                { value: 'cuadrado', label: 'Cuadrado · 3 grupos' },
                { value: 'triangulo', label: 'Triángulo · 4 grupos' },
              ]}
              onChange={setGeometry}
            />
            <div className={styles.compasses} data-geometry={geometry}>
              {cardinalGroups(geometry).map((group) => (
                <section key={group.index} className={styles.compass} aria-label={`Grupo ${group.index + 1}`}>
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
                              aria-label={`Sumar ${label} a la vuelta`}
                              onClick={() => add(chord)}
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
          </Slab>
        </div>

        <div className={styles.column}>
          <Slab className={styles.vueltaSlab} label="Tu vuelta">
            <span id="vuelta" className={styles.anchor} />
            <SlabHead number="04" title="Tu vuelta">
              <Fader compact />
            </SlabHead>
            {vuelta.length === 0 ? (
              <p className={styles.hint} data-testid="vuelta-empty">
                Todavía no sumaste acordes. Sumá con el + o arrancá por el final, con una cadencia de abajo.
              </p>
            ) : (
              <ol className={styles.chips} data-testid="vuelta">
                {vuelta.map((chord, index) => {
                  const feeling = feelingOf(chord, key);
                  return (
                    <li key={index}>
                      <button
                        type="button"
                        aria-pressed={active === index}
                        data-playing={player.current === index || undefined}
                        onClick={() => {
                          setSelected(active === index ? null : index);
                          listen(chord);
                        }}
                      >
                        <small>{degreeLabel(chord, key)}</small>
                        <strong>{name(chord)}</strong>
                        {feeling && <Feeling feeling={feeling} />}
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}

            {activeChord && active !== null && (
              <div className={styles.editor} data-testid="chord-editor">
                <div className={styles.editorHead}>
                  <strong>{name(activeChord)}</strong>
                  <div className={styles.editorTools}>
                    <Button
                      variant="mini"
                      ariaLabel="Mover a la izquierda"
                      disabled={active === 0}
                      onClick={() => {
                        const next = [...vuelta];
                        [next[active - 1], next[active]] = [next[active]!, next[active - 1]!];
                        setVuelta(next);
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
                        const next = [...vuelta];
                        [next[active + 1], next[active]] = [next[active]!, next[active + 1]!];
                        setVuelta(next);
                        setSelected(active + 1);
                      }}
                    >
                      →
                    </Button>
                    <Button
                      variant="mini"
                      ariaLabel="Sacar de la vuelta"
                      onClick={() => {
                        setVuelta(vuelta.filter((_, position) => position !== active));
                        setSelected(null);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
                <p className={styles.label}>Color</p>
                <ul className={styles.variants}>
                  {variantsOf(activeChord).map((variant) => {
                    const next: Chord = { root: activeChord.root, suffix: variant.suffix };
                    return (
                      <li key={variant.suffix}>
                        <button
                          type="button"
                          aria-pressed={activeChord.suffix === variant.suffix}
                          onClick={() => replaceAt(active, next)}
                        >
                          <strong>
                            {variant.label} <span>{name(next)}</span>
                          </strong>
                          <small>{variant.why}</small>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className={styles.label}>En el bajo</p>
                <div className={styles.basses} role="group" aria-label="En el bajo">
                  {BASS_ROLES.map((role) => {
                    const bass = bassFor(activeChord, role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        disabled={bass === undefined}
                        aria-pressed={bassRoleOf(activeChord) === role.id}
                        onClick={() =>
                          bass !== undefined &&
                          replaceAt(active, {
                            ...activeChord,
                            bass: bass === activeChord.root ? undefined : bass,
                          })
                        }
                      >
                        <strong>{role.label}</strong>
                        <small>{role.why}</small>
                      </button>
                    );
                  })}
                </div>
                <p className={styles.hint} data-testid="common-tones">
                  {[active - 1, active + 1]
                    .filter((index) => index >= 0 && index < vuelta.length)
                    .map((index) => {
                      const common = commonTones(activeChord, vuelta[index]!);
                      const other = name(vuelta[index]!);
                      return common.length
                        ? `Con ${other} comparte ${common.map((pc) => pitchName(spellIn(pc, key), notation)).join(' y ')}: esa voz se puede quedar quieta.`
                        : `Con ${other} no comparte notas: el cambio se nota más.`;
                    })
                    .join(' ')}
                </p>
              </div>
            )}

            {pedal.length > 0 && (
              <p className={styles.pedal} data-testid="pedal">
                Cuerdas al aire que entran en toda la vuelta:{' '}
                {pedal
                  .map((index) => `${6 - index}.ª (${noteLabel(tuning.notes[index]!, notation)})`)
                  .join(', ')}
                . Dejalas sonar como pedal.
              </p>
            )}

            <div className={styles.controls}>
              <Button
                variant="primary"
                id="vuelta-toggle"
                on={player.running}
                disabled={vuelta.length === 0}
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
              {vuelta.length > 0 && (
                <Button
                  onClick={() => {
                    player.stop();
                    setVuelta([]);
                    setSelected(null);
                  }}
                >
                  Vaciar
                </Button>
              )}
            </div>

            <h3 className={styles.subhead}>Cerrar con…</h3>
            <p className={styles.hint}>La última cadencia es la última emoción que se lleva quien escucha.</p>
            <ul className={styles.cadences}>
              {CADENCES.map((cadence) => {
                const chords = cadenceChords(cadence, tonic);
                return (
                  <li key={cadence.id}>
                    <button
                      type="button"
                      disabled={vuelta.length + chords.length > MAX_CHORDS}
                      onClick={() => {
                        setVuelta([...vuelta, ...chords]);
                        setSelected(null);
                        listen(chords[chords.length - 1]!);
                      }}
                    >
                      <strong>
                        {cadence.name} <span>{chords.map(name).join(' → ')}</span>
                      </strong>
                      <small>{cadence.why}</small>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Slab>
        </div>
      </div>
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
