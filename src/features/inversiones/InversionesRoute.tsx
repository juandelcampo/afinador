import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams, type MetaFunction } from 'react-router';
import { getAudio } from '~/audio/engine';
import { pluckString } from '~/audio/instrument';
import { chordToken, parseChord, plainName, type Chord, type Suffix } from '~/core/harmony';
import {
  INVERSION_CHORDS,
  inversionsOf,
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
import { Button, PageTitle, Slab, SlabHead, Tabs } from '~/shared/ui/ui';
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
/** Las figuras llenas que se ven antes de pedir el resto. */
const FULL_PREVIEW = 6;
const ORDINALS = ['Fundamental', '1.ª inversión', '2.ª inversión', '3.ª inversión', '4.ª inversión'];

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

/** Un rasguido hacia abajo, de la cuerda más grave a la más aguda. */
function strumVoicing(midis: Voicing['midis'], a4: number, when: number) {
  let position = 0;
  midis.forEach((midi, stringIndex) => {
    if (midi === null) return;
    pluckString(stringIndex, midi, { a4, when: when + position * 0.035, velocity: 0.9 });
    position += 1;
  });
}

const STRING_GAP = 14;
const FRET_GAP = 18;
const ROWS = 4;
const LEFT = 18;
const TOP = 18;

/**
 * La figura dibujada como en los cancioneros: las cuerdas paradas (la 6.ª a la izquierda), los trastes
 * acostados, y en cada punto qué nota del acorde es. La del bajo va en naranja.
 */
function ChordBox({ voicing, suffix }: { voicing: Voicing; suffix: Suffix }) {
  const count = voicing.frets.length;
  // Si la figura entra en los primeros trastes se dibuja desde la cejuela.
  const first = voicing.top <= ROWS ? 1 : voicing.position;
  const width = LEFT + (count - 1) * STRING_GAP + 12;
  const height = TOP + ROWS * FRET_GAP + 6;
  const x = (index: number) => LEFT + index * STRING_GAP;
  const y = (fret: number) => TOP + (fret - first + 0.5) * FRET_GAP;
  const bassString = voicing.midis.indexOf(
    Math.min(...voicing.midis.filter((midi): midi is number => midi !== null)),
  );
  return (
    <svg
      className={styles.box}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {first > 1 && (
        <text className={styles.boxFret} x={LEFT - 8} y={y(first) + 3.5} textAnchor="end">
          {first}
        </text>
      )}
      {Array.from({ length: ROWS + 1 }, (_, row) => (
        <line
          key={`f${row}`}
          className={row === 0 && first === 1 ? styles.boxNut : styles.boxLine}
          x1={x(0)}
          x2={x(count - 1)}
          y1={TOP + row * FRET_GAP}
          y2={TOP + row * FRET_GAP}
        />
      ))}
      {voicing.frets.map((_, index) => (
        <line
          key={`s${index}`}
          className={styles.boxLine}
          x1={x(index)}
          x2={x(index)}
          y1={TOP}
          y2={TOP + ROWS * FRET_GAP}
        />
      ))}
      {voicing.frets.map((fret, index) => {
        const step = voicing.steps[index];
        const bass = index === bassString;
        if (fret === MUTED) {
          return (
            <text key={index} className={styles.boxMuted} x={x(index)} y={TOP - 6} textAnchor="middle">
              ×
            </text>
          );
        }
        const label = step === null || step === undefined ? '' : toneName(step, suffix);
        const open = fret === 0;
        const cy = open ? TOP - 9 : y(fret);
        return (
          <g key={index} data-bass={bass || undefined} data-open={open || undefined}>
            <circle className={styles.boxDot} cx={x(index)} cy={cy} r={6.4} />
            <text
              className={styles.boxTone}
              x={x(index)}
              y={cy + 2.6}
              textAnchor="middle"
              textLength={label.length > 1 ? 9.5 : undefined}
              lengthAdjust="spacingAndGlyphs"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function VoicingCard({
  voicing,
  suffix,
  name,
  playing,
  onPlay,
}: {
  voicing: Voicing;
  suffix: Suffix;
  name: string;
  playing: boolean;
  onPlay: () => void;
}) {
  const tab = tabOf(voicing.frets);
  const extra = [voicing.barre !== null && `cejilla ${voicing.barre}`, voicing.noFifth && 'sin 5.ª'].filter(
    Boolean,
  );
  return (
    <li>
      <button
        type="button"
        className={styles.card}
        aria-label={`Escuchar ${name}: ${tab}`}
        aria-pressed={playing}
        onClick={onPlay}
      >
        <ChordBox voicing={voicing} suffix={suffix} />
        <span className={styles.tab} data-long={tab.length > 13 || undefined}>
          {tab}
        </span>
        {extra.length > 0 && <small className={styles.extra}>{extra.join(' · ')}</small>}
      </button>
    </li>
  );
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
  const [playing, setPlaying] = useState<string | null>(null);
  const [opened, setOpened] = useState<Record<number, boolean>>({});

  const groups = useMemo(
    () => inversionsOf(tuning.notes.map(noteToMidi), chord.root, chord.suffix),
    [tuning.notes, chord.root, chord.suffix],
  );

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
    setPlaying(null);
    setOpened({});
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };
  /** Cambia la nota o el tipo a partir del acorde pedido, no del que se ve. */
  const setChord = (change: Partial<Chord>) =>
    update((base) => {
      const current = readChord(base.get('acorde')) ?? homeChord(findTuning(base.get('afinacion')));
      return { acorde: chordToken({ ...current, ...change }) };
    });

  // Con el bemol de verdad: "Db" en mayúsculas se leería como dos letras.
  const rootName = (pc: number) => plainName(pc, notation).replace(/b$/, '♭');
  const name = rootName(chord.root) + suffixLabel(chord.suffix);
  const nameWithBass = (group: InversionGroup) =>
    group.inversion === 0 ? name : `${name}/${rootName(chord.root + group.bass)}`;

  const play = (voicing: Voicing) => {
    const { ctx } = getAudio();
    strumVoicing(voicing.midis, a4, ctx.currentTime + 0.02);
    setPlaying(voicing.frets.join());
  };

  // Para comparar de oído: la primera justa de cada inversión, una detrás de otra.
  const tour = groups.map((group) => group.bare[0] ?? group.full[0]).filter((item) => item !== undefined);
  const playTour = () => {
    const { ctx } = getAudio();
    tour.forEach((voicing, index) => strumVoicing(voicing.midis, a4, ctx.currentTime + 0.04 + index * 1.4));
    setPlaying(null);
  };

  const chordTones = groups.map((group) => ({ tone: group.tone, note: rootName(chord.root + group.bass) }));

  const cards = (list: Voicing[], group: InversionGroup) =>
    list.map((voicing) => (
      <VoicingCard
        key={voicing.frets.join()}
        voicing={voicing}
        suffix={chord.suffix}
        name={nameWithBass(group)}
        playing={playing === voicing.frets.join()}
        onPlay={() => play(voicing)}
      />
    ));

  return (
    <div className={styles.page}>
      <Slab>
        <PageTitle eyebrow="Todas las formas de un acorde" title="Inversiones">
          <p>
            Elegí un acorde y mirá todas las maneras de hacerlo en el mástil, agrupadas por la nota que queda
            en el bajo. Tocá una figura para escucharla: el mismo acorde cambia de peso según qué nota va
            abajo.
          </p>
        </PageTitle>
        <div className={styles.setup}>
          <label className={styles.field}>
            <span>Afinación</span>
            <select
              id="afinacion"
              value={tuning.id}
              onChange={(event) =>
                update({ afinacion: event.target.value === DEFAULT_TUNING ? null : event.target.value })
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
          <Link className={styles.bridge} to={`/afinador/${tuning.id}`}>
            Afinar en {tuning.name} →
          </Link>
        </div>
      </Slab>

      <Slab>
        <SlabHead number="01" title="Acorde" />
        {/* Sin mayúsculas: en mayúsculas m7 se confunde con M7, que es otro acorde. */}
        <div className={styles.pick}>
          <Tabs
            label="Nota del acorde"
            value={String(chord.root)}
            options={Array.from({ length: 12 }, (_, pc) => ({ value: String(pc), label: rootName(pc) }))}
            onChange={(value) => setChord({ root: Number(value) })}
          />
          <Tabs
            label="Tipo de acorde"
            value={chord.suffix}
            options={INVERSION_CHORDS.map((item) => ({ value: item.suffix, label: item.label }))}
            onChange={(value) => setChord({ suffix: value })}
          />
        </div>
        <div className={styles.summary}>
          <p className={styles.name} data-testid="chord-name">
            {name}
          </p>
          <ul className={styles.tones} aria-label="Notas del acorde">
            {chordTones.map((item) => (
              <li key={item.tone}>
                <span>{item.tone}</span>
                {item.note}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.actions}>
          <Button variant="primary" onClick={playTour} disabled={!tour.length}>
            ▶ Escuchar las inversiones
          </Button>
          <Fader compact />
        </div>
        <p className={styles.hint}>
          Suena una de cada grupo, de la fundamental a la última. En los dibujos la 6.ª cuerda va a la
          izquierda y la nota del bajo va en naranja; el número al costado es el traste donde empieza.
        </p>
      </Slab>

      {groups.map((group, index) => {
        const open = opened[group.bass] ?? false;
        const full = open ? group.full : group.full.slice(0, FULL_PREVIEW);
        const hidden = group.full.length - full.length;
        const total = group.bare.length + group.full.length;
        return (
          <Slab key={group.bass} label={ORDINALS[group.inversion]}>
            <SlabHead number={String(index + 2).padStart(2, '0')} title={ORDINALS[group.inversion]!}>
              <span className={styles.count}>{total === 1 ? '1 forma' : `${total} formas`}</span>
            </SlabHead>
            <p className={styles.bassLine}>
              <strong>{nameWithBass(group)}</strong>
              {group.inversion === 0 ? ' · la raíz en el bajo' : ` · la ${group.tone} en el bajo`}
            </p>
            <p className={styles.hint}>{group.why}</p>
            {total === 0 && <p className={styles.empty}>En esta afinación la mano no llega a ninguna.</p>}
            {group.bare.length > 0 && (
              <>
                <h3 className={styles.kind}>Justas · cada nota una vez</h3>
                <ul className={styles.cards} data-testid={`justas-${group.inversion}`}>
                  {cards(group.bare, group)}
                </ul>
              </>
            )}
            {group.full.length > 0 && (
              <>
                <h3 className={styles.kind}>Llenas · con más cuerdas</h3>
                <ul className={styles.cards} data-testid={`llenas-${group.inversion}`}>
                  {cards(full, group)}
                </ul>
                {(hidden > 0 || open) && group.full.length > FULL_PREVIEW && (
                  <div className={styles.more}>
                    <Button
                      variant="ghost"
                      ariaExpanded={open}
                      onClick={() => setOpened((current) => ({ ...current, [group.bass]: !open }))}
                    >
                      {open ? 'Ver menos' : `Ver las ${hidden} que faltan`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </Slab>
        );
      })}
    </div>
  );
}
