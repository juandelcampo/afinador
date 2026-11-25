// ¿Qué tonalidad?: escribís los acordes de un tema (o las notas de una melodía) y te dice en qué tonalidad
// está, con el grado de cada acorde. Abajo, Transportar: elegís otra tónica y te da los acordes nuevos, con
// la cejilla que deja tocarlos con las formas de siempre. Todo vive en la URL.
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, type MetaFunction } from 'react-router';
import { getAudio } from '~/audio/engine';
import { pluckString, stopInstrument, strumShape } from '~/audio/instrument';
import {
  CHORD_STEPS,
  chordClasses,
  chordName,
  chordToken,
  degreeLabel,
  pitchName,
  spellIn,
  type Chord,
  type Key,
} from '~/core/harmony';
import {
  capoFor,
  guessFromChords,
  guessFromNotes,
  keyOf,
  readChords,
  readNotes,
  relativeOf,
  shiftBetween,
  transposeChord,
  type Guess,
  type Mode,
} from '~/core/tonalidad';
import { fingeringFor, MUTED } from '~/core/tuning';
import { noteToMidi } from '~/core/notes';
import { STANDARD } from '~/data/tunings';
import { useSettings } from '~/shared/settings';
import { useHydrated } from '~/shared/useHydrated';
import { Icon } from '~/shared/ui/Icon';
import { Button, PageTitle, Slab, SlabHead, Toggle } from '~/shared/ui/ui';
import ui from '~/shared/ui/ui.module.css';
import styles from './tonalidad.module.css';

export const meta: MetaFunction = () => [
  { title: '¿Qué tonalidad? De qué tonalidad es tu tema, y cómo llevarlo a otra · Afinador' },
  {
    name: 'description',
    content:
      'Escribí los acordes de un tema o las notas de una melodía y te dice en qué tonalidad está, con el grado de cada acorde. Después llevalo a otra tonalidad, con la cejilla para tocarlo con las formas de siempre.',
  },
];

const EMPTY = new URLSearchParams();
const mod12 = (value: number) => ((value % 12) + 12) % 12;
type Input = 'acordes' | 'melodia';

/** Para probar sin escribir: tocar uno lo pone en el campo. */
const EXAMPLES: Record<Input, string[]> = {
  acordes: ['Am F C G', 'C G Am F', 'E A B7 E', 'Dm Bb C Dm'],
  melodia: ['mi re do re mi mi mi', 'la do mi re do si la', 'sol la si do re do si la sol'],
};

/** Lo que dura cada acorde y cada nota al escucharlos, en segundos. */
const CHORD_GAP = 1.3;
const NOTE_GAP = 0.42;

/** "9m" es La menor, "0" Do mayor: la tonalidad elegida a mano, en la URL. */
function readKey(text: string | null): { tonic: number; mode: Mode } | null {
  const match = text ? /^(\d{1,2})(m?)$/.exec(text) : null;
  if (!match || Number(match[1]) > 11) return null;
  return { tonic: Number(match[1]), mode: match[2] ? 'menor' : 'mayor' };
}
const writeKey = (tonic: number, mode: Mode) => `${tonic}${mode === 'menor' ? 'm' : ''}`;

/** Las notas de un acorde para que suene: la figura más fácil en la afinación estándar, o cerrado. */
function chordMidis(chord: Chord): Array<number | null> {
  const fingering = fingeringFor(STANDARD, chord.root, CHORD_STEPS[chord.suffix]!, chord.bass ?? chord.root);
  if (fingering) {
    const open = STANDARD.map(noteToMidi);
    return fingering.frets.map((fret, index) => (fret === MUTED ? null : open[index]! + fret));
  }
  const base = 48 + mod12(chord.bass ?? chord.root);
  return chordClasses(chord).map((pc) => base + mod12(pc - base));
}

/** Cada nota de la melodía en la octava más cercana a la anterior: así suena como se canta. */
function melodyMidis(notes: readonly number[]): number[] {
  let previous = 64;
  return notes.map((pc) => {
    const midi = previous - 6 + mod12(pc - (previous - 6));
    previous = midi;
    return midi;
  });
}

interface Lit {
  list: 'tema' | 'destino';
  index: number;
}

export default function TonalidadRoute() {
  const hydrated = useHydrated();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = hydrated ? searchParams : EMPTY;
  const notation = useSettings((s) => s.notation);
  const a4 = useSettings((s) => s.a4);
  const style = useSettings((s) => s.chordStyle);

  const input: Input = params.get('modo') === 'melodia' ? 'melodia' : 'acordes';
  const text = params.get('t') ?? '';
  // El campo se escribe acá y la URL lo sigue: así no se pierden letras mientras la URL se actualiza.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? text;

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [param, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(param);
      else next.set(param, value);
    }
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };
  const write = (value: string) => {
    setDraft(value);
    // Lo escrito cambia: la tonalidad elegida a mano y el destino vuelven a lo que se adivine.
    update({ t: value.trim() || null, tono: null, a: null });
  };

  // Un nombre de nota o de acorde sin tonalidad que diga cómo escribirlo: con el bemol de verdad.
  const plainKey = keyOf(0, 'mayor');
  const nameIn = (chord: Chord, key: Key) => chordName(chord, key, notation).replace(/b(?=$|[^5])/, '♭');
  const noteIn = (pc: number, key: Key) => pitchName(spellIn(pc, key), notation).replace(/b$/, '♭');

  const chordTokens = input === 'acordes' ? readChords(text) : [];
  const noteTokens = input === 'melodia' ? readNotes(text) : [];
  const chords = chordTokens.flatMap((token) => (token.value ? [token.value] : []));
  const notes = noteTokens.flatMap((token) => (token.value !== null ? [token.value] : []));
  const unread = [...chordTokens, ...noteTokens].filter((token) => token.value === null).map((t) => t.text);

  const guesses: Guess[] =
    input === 'acordes'
      ? guessFromChords(chords, (chord) => nameIn(chord, plainKey))
      : guessFromNotes(notes, (pc) => noteIn(pc, plainKey));
  const chosen = readKey(params.get('tono'));
  const guess =
    (chosen && guesses.find((item) => item.tonic === chosen.tonic && item.mode === chosen.mode)) ??
    guesses[0];

  const keyName = (tonic: number, mode: Mode) => {
    const key = keyOf(tonic, mode);
    return `${noteIn(tonic, key)} ${mode}`;
  };
  // Las otras que cierran igual de bien (todos los mismos acordes o notas adentro): la relativa casi siempre.
  const others = guess
    ? [
        relativeOf(guess.tonic, guess.mode),
        ...guesses.slice(0, 3).map(({ tonic, mode }) => ({ tonic, mode })),
      ]
        .filter((item) => !(item.tonic === guess.tonic && item.mode === guess.mode))
        .filter(
          (item) =>
            (guesses.find((other) => other.tonic === item.tonic && other.mode === item.mode)?.fit ?? 0) >=
            guess.fit,
        )
        .filter(
          (item, index, list) =>
            list.findIndex((other) => other.tonic === item.tonic && other.mode === item.mode) === index,
        )
        .slice(0, 2)
    : [];

  // Transportar: a qué tónica, en el mismo modo. Sin elegir, nada se mueve.
  const target = params.get('a') !== null ? mod12(Number(params.get('a'))) : null;
  const shift = guess && target !== null ? shiftBetween(guess.tonic, target) : 0;
  const destKey = guess && target !== null ? keyOf(target, guess.mode) : null;
  const moved = destKey ? chords.map((chord) => transposeChord(chord, shift)) : [];
  const movedNotes = destKey ? notes.map((pc) => mod12(pc + shift)) : [];
  const capo = destKey && input === 'acordes' ? capoFor(moved) : null;

  // Lo que suena se enciende: cada acorde o nota en su momento.
  const [lit, setLit] = useState<Lit | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLit(null);
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = (list: Lit['list'], sequence: readonly Chord[] | readonly number[]) => {
    stop();
    stopInstrument();
    if (!sequence.length) return;
    const { ctx } = getAudio();
    const start = ctx.currentTime + 0.05;
    const isChords = typeof sequence[0] !== 'number';
    const gap = isChords ? CHORD_GAP : NOTE_GAP;
    const midis = isChords ? [] : melodyMidis(sequence as number[]);
    sequence.forEach((item, index) => {
      const when = start + index * gap;
      if (isChords) strumShape(chordMidis(item as Chord), a4, when, style);
      else pluckString(index % 6, midis[index]!, { a4, when });
      timers.current.push(setTimeout(() => setLit({ list, index }), index * gap * 1000));
    });
    timers.current.push(setTimeout(() => setLit(null), sequence.length * gap * 1000));
  };
  const listenOne = (list: Lit['list'], item: Chord | number, index: number) => {
    stop();
    const { ctx } = getAudio();
    if (typeof item === 'number') {
      pluckString(0, 60 + item, { a4, when: ctx.currentTime + 0.02 });
    } else {
      strumShape(chordMidis(item), a4, ctx.currentTime + 0.02, style);
    }
    setLit({ list, index });
    timers.current.push(setTimeout(() => setLit(null), 900));
  };
  /** La tonalidad, para el oído: el acorde de la tónica. */
  const playHome = () => {
    if (!guess) return;
    listenOne('tema', { root: guess.tonic, suffix: guess.mode === 'mayor' ? '' : 'm' }, -1);
  };

  const unit = input === 'acordes' ? ['acorde', 'acordes'] : ['nota', 'notas'];
  const armoniaLink = (key: Key, list: readonly Chord[]) =>
    `/armonia?${new URLSearchParams({
      tono: String(key.tonic),
      escala: key.scale.id,
      ...(list.length ? { v: list.slice(0, 16).map(chordToken).join('_') } : {}),
    })}`;

  /** Una fila de acordes o notas: el nombre grande y el grado abajo; los de afuera, marcados. */
  const cells = (
    list: Lit['list'],
    key: Key,
    sequence: readonly Chord[] | readonly number[],
    outside: number[],
  ) => (
    <ol className={styles.cells} data-testid={list === 'tema' ? 'grados' : 'transportados'}>
      {sequence.map((item, index) => {
        const isChord = typeof item !== 'number';
        const label = isChord ? nameIn(item, key) : noteIn(item, key);
        const degree = isChord
          ? degreeLabel(item, key)
          : degreeLabel({ root: item, suffix: '' }, key).replace(/m$/, '');
        return (
          <li key={index}>
            <button
              type="button"
              data-lit={(lit?.list === list && lit.index === index) || undefined}
              data-outside={outside.includes(index) || undefined}
              aria-label={`Escuchar ${label}, ${outside.includes(index) ? 'de afuera' : degree}`}
              onClick={() => listenOne(list, item, index)}
            >
              <strong>{label}</strong>
              <small>{outside.includes(index) ? `${degree} · afuera` : degree}</small>
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className={`${styles.page} ${ui.frame}`}>
      <Slab>
        <PageTitle eyebrow="De qué tonalidad es tu tema" title="¿Qué tonalidad?" toolName>
          <p>
            Escribí los acordes de un tema, o las notas de una melodía, y te dice en qué tonalidad está.
            Después llevalo a otra.
          </p>
        </PageTitle>
        <div className={styles.entry}>
          <Toggle
            label="Qué escribís"
            value={input}
            options={[
              { value: 'acordes', label: 'Acordes' },
              { value: 'melodia', label: 'Melodía' },
            ]}
            onChange={(value) => {
              setDraft(null);
              update({ modo: value === 'acordes' ? null : value, t: null, tono: null, a: null });
            }}
          />
          <input
            className={styles.field}
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label={input === 'acordes' ? 'Los acordes de tu tema' : 'Las notas de tu melodía'}
            placeholder={input === 'acordes' ? 'Am F C G' : 'mi re do re mi'}
            value={shown}
            onChange={(event) => write(event.target.value)}
          />
        </div>
        {/* Lo que no se entendió: un renglón chico, que no mueve nada. */}
        <p className={`${ui.hint} ${styles.unread}`} data-keep data-testid="sin-leer">
          {unread.length > 0 ? `No entendí: ${unread.join(' ')}` : '\u00a0'}
        </p>
      </Slab>

      {!guess ? (
        <Slab>
          <p className={styles.start}>Probá con uno:</p>
          <div className={styles.examples}>
            {EXAMPLES[input].map((example) => (
              <button key={example} type="button" onClick={() => write(example)}>
                {example}
              </button>
            ))}
          </div>
        </Slab>
      ) : (
        <div className={styles.columns}>
          <Slab>
            <div className={styles.lead}>
              <button
                type="button"
                className={styles.result}
                data-testid="tonalidad"
                aria-live="polite"
                aria-label={`Escuchar la tónica: ${keyName(guess.tonic, guess.mode)}`}
                onClick={playHome}
              >
                <strong className={styles.name}>{keyName(guess.tonic, guess.mode)}</strong>
                <span className={styles.words}>
                  {guess.fit} de {guess.total} {guess.total === 1 ? unit[0] : unit[1]}{' '}
                  {guess.fit === 1 ? 'es' : 'son'} de acá
                </span>
              </button>
              <ul className={styles.facts}>
                {guess.why.map((line) => (
                  <li key={line}>{line}.</li>
                ))}
                {others.length > 0 && (
                  <li className={styles.others}>
                    <span>También puede ser</span>
                    {others.map((item) => (
                      <button
                        key={writeKey(item.tonic, item.mode)}
                        type="button"
                        onClick={() => update({ tono: writeKey(item.tonic, item.mode), a: null })}
                      >
                        {keyName(item.tonic, item.mode)}
                      </button>
                    ))}
                  </li>
                )}
              </ul>
            </div>
            {cells('tema', guess.key, input === 'acordes' ? chords : notes, guess.outside)}
            <div className={styles.play}>
              <Button
                variant="primary"
                ariaLabel={`Escuchar ${input === 'acordes' ? 'los acordes' : 'la melodía'}`}
                onClick={() => play('tema', input === 'acordes' ? chords : notes)}
              >
                ▶ Escuchar
              </Button>
              {input === 'acordes' && (
                <Link className={ui.bridge} to={armoniaLink(guess.key, chords)}>
                  Abrir en Armonía <Icon name="right" />
                </Link>
              )}
            </div>
          </Slab>

          <Slab>
            <SlabHead title="Transportar" />
            <p className={styles.ask}>Llevalo a</p>
            <div className={styles.roots} role="group" aria-label="A qué tónica llevarlo">
              {Array.from({ length: 12 }, (_, pc) => {
                const key = keyOf(pc, guess.mode);
                const label = noteIn(pc, key) + (guess.mode === 'menor' ? 'm' : '');
                const here = pc === guess.tonic;
                return (
                  <button
                    key={pc}
                    type="button"
                    aria-pressed={pc === target}
                    data-home={here || undefined}
                    aria-label={here ? `${label}: donde está` : `Llevarlo a ${label}`}
                    onClick={() => update({ a: pc === target ? null : String(pc) })}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {destKey ? (
              <>
                <p className={styles.shift} data-testid="corrimiento">
                  <strong>{keyName(destKey.tonic, guess.mode)}</strong>
                  {shift === 0
                    ? ' · es la misma'
                    : ` · ${shift > 0 ? '+' : '−'}${Math.abs(shift)} ${Math.abs(shift) === 1 ? 'semitono' : 'semitonos'}`}
                </p>
                {cells('destino', destKey, input === 'acordes' ? moved : movedNotes, guess.outside)}
                <div className={styles.play}>
                  <Button
                    variant="primary"
                    ariaLabel={`Escuchar en ${keyName(destKey.tonic, guess.mode)}`}
                    onClick={() => play('destino', input === 'acordes' ? moved : movedNotes)}
                  >
                    ▶ Escuchar
                  </Button>
                  {input === 'acordes' && (
                    <Link className={ui.bridge} to={armoniaLink(destKey, moved)}>
                      Abrir en Armonía <Icon name="right" />
                    </Link>
                  )}
                </div>
                <p className={styles.capo} data-testid="cejilla">
                  {capo ? (
                    <>
                      <strong>Con cejilla en el {capo.fret}:</strong> tocás{' '}
                      {capo.shapes
                        .map((chord) => nameIn(chord, keyOf(mod12(destKey.tonic - capo.fret), guess.mode)))
                        .join(' ')}
                      , con las formas de siempre.
                    </>
                  ) : (
                    '\u00a0'
                  )}
                </p>
              </>
            ) : (
              <p className={styles.shift}>Elegí una tónica y te da los mismos {unit[1]} ahí.</p>
            )}
          </Slab>
        </div>
      )}
    </div>
  );
}
