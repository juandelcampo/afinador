// ¿Qué acorde?: poner los dedos donde suena lindo y que diga cómo se llama. Arranca con todas las cuerdas
// al aire; tocar un casillero pone el dedo, tocar la cejuela deja sonar o apaga la cuerda.
import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, type MetaFunction } from 'react-router';
import { getAudio } from '~/audio/engine';
import { pluckString, strumShape } from '~/audio/instrument';
import { CHORD_STEPS, chordToken, plainName, suffixSymbol } from '~/core/harmony';
import { CHORD_WORDS, clusterSense, identifyChord, type ChordReading } from '~/core/identify';
import { bassReading, encodeFrets, INVERSION_CHORDS, parseFrets, tabOf, toneName } from '~/core/inversions';
import { intervalName, noteToMidi } from '~/core/notes';
import { MUTED } from '~/core/tuning';
import { TUNINGS } from '~/data/tunings';
import { Fader } from '~/shared/Fader';
import { ShapeStyleToggle } from '~/shared/ShapeStyle';
import { useSettings } from '~/shared/settings';
import { useHydrated } from '~/shared/useHydrated';
import { Diapason, LAST_FRET } from '~/shared/Diapason';
import { TuneLink, TuningField } from '~/shared/TuningField';
import { Button, PageTitle, Slab } from '~/shared/ui/ui';
import ui from '~/shared/ui/ui.module.css';
import styles from './acorde.module.css';

export const meta: MetaFunction = () => [
  { title: '¿Qué acorde es? Ponele nombre a lo que tocás · Afinador' },
  {
    name: 'description',
    content:
      'Poné los dedos en el diapasón, apagá las cuerdas que no van y te dice qué acorde suena: el nombre, sus notas, qué va en el bajo y otras maneras de leerlo, en tu afinación.',
  },
];

const DEFAULT_TUNING = 'estandar';
const EMPTY = new URLSearchParams();
const ORDINALS = [
  'Fundamental',
  '1.ª inversión',
  '2.ª inversión',
  '3.ª inversión',
  '4.ª inversión',
  '5.ª inversión',
];

const mod12 = (value: number) => ((value % 12) + 12) % 12;
const findTuning = (id: string | null) =>
  TUNINGS.find((item) => item.id === id) ?? TUNINGS.find((item) => item.id === DEFAULT_TUNING)!;

/** Qué es `pc` en esa lectura: R, 3, ♭7 si es del acorde, ♯11 si es una tensión, o null. */
const roleOf = (reading: ChordReading, pc: number) => {
  const step = mod12(pc - reading.root);
  if (CHORD_STEPS[reading.suffix]!.some((item) => mod12(item) === step))
    return toneName(step, reading.suffix);
  return reading.extras.find((extra) => extra.step === step)?.label ?? null;
};

export default function AcordeRoute() {
  const hydrated = useHydrated();
  const [searchParams, setSearchParams] = useSearchParams();
  // La página estática no conoce la URL: hasta hidratar vale lo de siempre.
  const params = hydrated ? searchParams : EMPTY;
  const notation = useSettings((s) => s.notation);
  const a4 = useSettings((s) => s.a4);
  const style = useSettings((s) => s.chordStyle);

  const tuning = findTuning(params.get('afinacion'));
  const open = useMemo(() => tuning.notes.map(noteToMidi), [tuning.notes]);
  const allOpen = useMemo(() => open.map(() => 0), [open]);
  // Sin forma en la URL, todas al aire: suena la afinación tal cual.
  const frets = parseFrets(params.get('forma'), open.length, LAST_FRET) ?? allOpen;
  const midis = frets.map((fret, index) => (fret === MUTED ? null : open[index]! + fret));
  const sounding = midis.filter((midi): midi is number => midi !== null);
  const pressed = frets.filter((fret) => fret > 0);
  const shape = { frets, midis, position: pressed.length ? Math.min(...pressed) : 0 };

  const readings = identifyChord(midis);
  const reading = readings[0] ?? null;
  // Las otras lecturas que calzan justo, una por raíz: las que agregan tensiones con otro bajo confunden.
  const others = readings
    .slice(1)
    .filter((item) => !item.extras.length)
    .filter((item, index, list) => list.findIndex((other) => other.root === item.root) === index)
    .slice(0, 2);

  // Con el bemol de verdad: en mayúsculas "Db" se leería como dos letras.
  const pcName = (pc: number) => plainName(mod12(pc), notation).replace(/b$/, '♭');
  const nameOf = (item: ChordReading) =>
    pcName(item.root) +
    suffixSymbol(item.suffix) +
    (item.extras.length ? `(${item.extras.map((extra) => extra.label).join(',')})` : '') +
    (item.bass === item.root ? '' : `/${pcName(item.bass)}`);

  /** Qué dice cada dedo: su función si el acorde tiene nombre, si no el nombre de la nota. */
  const toneAt = (stringIndex: number, fret: number) => {
    const pc = open[stringIndex]! + fret;
    return (reading && roleOf(reading, pc)) ?? pcName(pc);
  };

  // Dos toques seguidos no esperan a que la URL se actualice: cada cambio parte del último pedido.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (pending.current === searchParams.toString()) pending.current = null;
  }, [searchParams]);
  const update = (patch: (base: URLSearchParams) => Record<string, string | null>) => {
    const base = new URLSearchParams(pending.current ?? searchParams);
    const next = new URLSearchParams(base);
    for (const [param, value] of Object.entries(patch(base))) {
      if (value === null || value === '') next.delete(param);
      else next.set(param, value);
    }
    pending.current = next.toString();
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };
  const setFrets = (next: number[]) =>
    update(() => ({ forma: next.every((fret) => fret === 0) ? null : encodeFrets(next) }));

  /**
   * Un casillero pone el dedo ahí (si había otro en esa cuerda, se mueve) y tocar el dedo lo saca: la
   * cuerda vuelve a sonar al aire. La cejuela alterna entre al aire y apagada.
   */
  const toggle = (stringIndex: number, fret: number) => {
    const before =
      parseFrets(new URLSearchParams(pending.current ?? searchParams).get('forma'), open.length, LAST_FRET) ??
      allOpen;
    const next = [...before];
    const now = next[stringIndex]!;
    if (fret === 0) next[stringIndex] = now === MUTED ? 0 : MUTED;
    else next[stringIndex] = now === fret ? 0 : fret;
    if (next[stringIndex] !== MUTED)
      pluckString(stringIndex, open[stringIndex]! + next[stringIndex]!, { a4 });
    setFrets(next);
  };

  const strum = () => {
    if (!sounding.length) return;
    const { ctx } = getAudio();
    strumShape(midis, a4, ctx.currentTime + 0.02, style);
  };

  // El nombre grande y lo que se dice debajo.
  const distinct = [...new Set(sounding.map(mod12))];
  const bassPc = sounding.length ? mod12(Math.min(...sounding)) : 0;
  let title: string;
  let words: string;
  if (!sounding.length) {
    title = 'Nada suena';
    words = 'Tocá el nombre de una cuerda para que suene al aire.';
  } else if (distinct.length === 1) {
    title = pcName(bassPc);
    words = 'Una sola nota: todavía no es un acorde.';
  } else if (reading && distinct.length === 2 && reading.suffix !== '5') {
    // Dos notas a una tercera o una sexta: el oído completa el acorde.
    title = nameOf(reading);
    words = `Dos notas que ya dicen ${reading.suffix === 'm' ? 'menor' : 'mayor'}: la quinta la pone el oído`;
  } else if (reading) {
    title = nameOf(reading);
    words =
      (CHORD_WORDS[reading.suffix] ?? '') +
      (reading.extras.length ? `, con ${reading.extras.map((extra) => extra.label).join(' y ')} encima` : '');
  } else {
    const sense = clusterSense(midis)!;
    title = distinct.length === 2 ? sense.kind : `${sense.kind} sobre ${pcName(bassPc)}`;
    words = sense.words;
  }

  const bass = reading ? bassReading(reading.suffix, mod12(reading.bass - reading.root)) : null;
  // Si el bajo es una tensión, no es una inversión: el color va abajo.
  const bassExtra = reading?.extras.find((extra) => extra.step === mod12(reading.bass - reading.root));
  // Las notas que suenan, de la más grave a la más aguda, sin repetir.
  const heard = [...new Set([...sounding].sort((a, b) => a - b).map(mod12))].map((pc) => {
    const role = reading ? roleOf(reading, pc) : null;
    return { pc, role: role ?? (pc === bassPc ? 'bajo' : intervalName(0, mod12(pc - bassPc))) };
  });
  const inversionsLink =
    reading && !reading.extras.length && INVERSION_CHORDS.some((item) => item.suffix === reading.suffix)
      ? `/inversiones?${new URLSearchParams({
          ...(tuning.id === DEFAULT_TUNING ? {} : { afinacion: tuning.id }),
          acorde: chordToken({ root: reading.root, suffix: reading.suffix }),
          forma: encodeFrets(frets),
        })}`
      : null;

  return (
    <div className={`${styles.page} ${ui.frame}`}>
      <Slab>
        <PageTitle eyebrow="Ponele nombre a lo que tocás" title="¿Qué acorde?">
          {/* Cómo se usa va acá arriba: se lee al entrar, sin bajar hasta el pie. */}
          <p>
            Poné los dedos donde te suena lindo y te dice cómo se llama. Tocá un casillero para poner el dedo
            y el dedo para sacarlo; el nombre de cada cuerda la apaga (×) o la vuelve a prender. En naranja,
            el bajo.
          </p>
        </PageTitle>
        <div className={ui.setup}>
          <TuningField
            tuning={tuning}
            onChange={(id) => update(() => ({ afinacion: id === DEFAULT_TUNING ? null : id }))}
          />
          <TuneLink tuning={tuning} />
        </div>
      </Slab>

      <Slab>
        <button
          type="button"
          className={styles.result}
          data-testid="acorde-nombre"
          aria-label={`Escuchar ${title}: ${tabOf(frets)}`}
          aria-live="polite"
          onClick={strum}
        >
          <strong className={styles.name}>{title}</strong>
          <span className={styles.words}>{words}</span>
          <span className={styles.tab}>{tabOf(frets)}</span>
        </button>

        <Diapason
          notes={tuning.notes}
          voicing={shape}
          notation={notation}
          toneAt={toneAt}
          free
          onToggle={toggle}
        />

        <div className={ui.actions}>
          <Button variant="primary" onClick={strum} disabled={!sounding.length}>
            ▶ Escuchar
          </Button>
          <Button variant="ghost" onClick={() => setFrets(allOpen)}>
            Todas al aire
          </Button>
          <ShapeStyleToggle />
          <Fader />
        </div>

        {sounding.length > 0 && (
          <ul className={styles.facts} data-testid="acorde-detalle">
            <li>
              <span>Suena</span>
              <span className={styles.heard}>
                {heard.map(({ pc, role }) => (
                  <span key={pc}>
                    {pcName(pc)} <small>{role}</small>
                  </span>
                ))}
              </span>
            </li>
            {reading && reading.extras.length > 0 && (
              <li data-testid="acorde-color">
                <span>Color</span>
                <span>
                  {reading.extras.map((extra, index) => (
                    <span key={extra.step}>
                      {index > 0 && ' '}
                      <strong>La {extra.label}</strong> {extra.words}.
                    </span>
                  ))}
                </span>
              </li>
            )}
            {reading && bass && bassExtra && (
              <li>
                <span>Bajo</span>
                <span>
                  <strong>La {bassExtra.label} en el bajo.</strong> El color va abajo: el acorde no termina de
                  apoyarse y queda flotando.
                </span>
              </li>
            )}
            {reading && bass && !bassExtra && (
              <li>
                <span>Bajo</span>
                <span>
                  <strong>
                    {bass.inversion === 0
                      ? 'La raíz en el bajo.'
                      : `La ${bass.tone} en el bajo: ${ORDINALS[bass.inversion]!.toLowerCase()}.`}
                  </strong>{' '}
                  {bass.why}
                </span>
              </li>
            )}
            {reading && reading.omitted.length > 0 && (
              <li>
                <span>Falta</span>
                <span>
                  {reading.omitted.map((step) => `la ${toneName(step, reading.suffix)}`).join(' y ')}: el
                  acorde se reconoce igual.
                </span>
              </li>
            )}
            {others.length > 0 && (
              <li data-testid="acorde-otras">
                <span>También</span>
                <span>
                  Se puede leer como {others.map(nameOf).join(' o ')}: las mismas notas, con otra raíz.
                </span>
              </li>
            )}
          </ul>
        )}

        {inversionsLink && (
          <p className={styles.next}>
            <Link className={ui.bridge} to={inversionsLink}>
              Todas las formas de {pcName(reading!.root) + suffixSymbol(reading!.suffix)} en Inversiones →
            </Link>
          </p>
        )}
      </Slab>
    </div>
  );
}
