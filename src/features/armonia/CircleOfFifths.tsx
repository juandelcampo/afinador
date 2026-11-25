import type { CSSProperties, KeyboardEvent } from 'react';
import {
  circleChord,
  circlePlace,
  fifthHue,
  fifthMoves,
  keySignature,
  notesOutside,
  placeScale,
  TONIC_HUE,
  vueltaMarks,
  type Ring,
} from '~/core/circle';
import { chordColor, degreeLabel, pitchName, type Chord, type Key } from '~/core/harmony';
import type { Notation } from '~/core/notes';
import { Button } from '~/shared/ui/ui';
import ui from '~/shared/ui/ui.module.css';
import styles from './armonia.module.css';

// La rueda mide 400 de lado: afuera los mayores, adentro sus relativos, y en el medio el acorde que tocaste.
const C = 200;
const RINGS: Record<Ring, { from: number; to: number; label: number; mark: number; size: number }> = {
  outer: { from: 128, to: 196, label: 160, mark: 186, size: 18 },
  inner: { from: 70, to: 128, label: 97, mark: 119, size: 13 },
};
const PLACES = (['outer', 'inner'] as const).flatMap((ring) =>
  Array.from({ length: 12 }, (_, index) => ({ index, ring })),
);

const point = (radius: number, degrees: number) => {
  const angle = ((degrees - 90) * Math.PI) / 180;
  return `${(C + radius * Math.cos(angle)).toFixed(2)} ${(C + radius * Math.sin(angle)).toFixed(2)}`;
};
const sector = (index: number, from: number, to: number) => {
  const start = index * 30 - 15;
  const end = index * 30 + 15;
  return `M${point(to, start)} A${to} ${to} 0 0 1 ${point(to, end)} L${point(from, end)} A${from} ${from} 0 0 0 ${point(from, start)} Z`;
};
const xy = (radius: number, index: number) => {
  const [x, y] = point(radius, index * 30).split(' ');
  return { x: Number(x), y: Number(y) };
};

/** La tira de la leyenda: de cinco quintas para el lado de los bemoles a seis para el de los sostenidos. */
const STRIP = Array.from({ length: 12 }, (_, index) => index - 5);

/** El tono va en una variable de CSS: el claro y el oscuro de cada anillo los pone la hoja de estilos. */
const hueStyle = (hue: number) => ({ '--hue': hue }) as CSSProperties;

const sameColorChord = (a: Chord, b: Chord) =>
  a.root === b.root && chordColor(a.suffix) === chordColor(b.suffix);

/** Lo que comparten la rueda y sus notas: el mundo, la vuelta y el acorde que tocaste en la rueda. */
interface CircleProps {
  keyOf: Key;
  vuelta: readonly Chord[];
  /** Cómo se escribe un acorde de la rueda: cada casilla en su propio tono. */
  name: (chord: Chord) => string;
  /** El acorde del I del mundo: se pinta entero. */
  worldTonic: Chord;
  picked: Chord | null;
  notation: Notation;
}

/** Una nota escrita con el bemol de verdad: en mayúsculas "Db" se leería como dos letras. */
const noteText = (note: string, notation: Notation) => pitchName(note, notation).replace(/b$/, '♭');

/** La armadura en corto: "2♯", "3♭" o "sin ♯ ni ♭". */
function signatureLabel(chord: Chord): string {
  const place = circlePlace(chord);
  if (!place) return '';
  const { sign, notes } = keySignature(place);
  return sign ? `${notes.length}${sign === '#' ? '♯' : '♭'}` : 'sin ♯ ni ♭';
}

/** La rueda sola: tocar una casilla suena y la marca; el + del medio la suma a la vuelta. */
export function CircleWheel({
  keyOf,
  vuelta,
  name,
  worldTonic,
  picked,
  onPick,
  onAdd,
}: CircleProps & { onPick: (chord: Chord) => void; onAdd: (chord: Chord) => void }) {
  const marks = vueltaMarks(vuelta);
  const outside = picked ? notesOutside(picked, keyOf) : 0;
  const tonicPlace = circlePlace(worldTonic) ?? { index: 0, ring: 'outer' as const };
  return (
    <div className={styles.wheel} data-testid="circulo">
      <svg viewBox="0 0 400 400" role="group" aria-label="Círculo de quintas">
        {PLACES.map((place) => {
          const chord = circleChord(place);
          const ring = RINGS[place.ring];
          const label = xy(ring.label, place.index);
          const mark = xy(ring.mark, place.index);
          const order = marks.get(`${place.ring}-${place.index}`);
          const hue = fifthHue(place, tonicPlace);
          // El color dice dónde está en la rueda; el mundo va más saturado y con letra más gruesa.
          const state =
            picked && sameColorChord(picked, chord)
              ? 'picked'
              : sameColorChord(worldTonic, chord)
                ? 'tonic'
                : notesOutside(chord, keyOf) === 0
                  ? 'world'
                  : 'away';
          const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onPick(chord);
          };
          return (
            <g
              key={`${place.ring}-${place.index}`}
              role="button"
              tabIndex={0}
              aria-label={`Escuchar ${name(chord)}`}
              aria-pressed={state === 'picked'}
              className={styles.cell}
              data-state={state}
              data-ring={place.ring}
              data-hue={hue}
              style={hueStyle(hue)}
              onClick={() => onPick(chord)}
              onKeyDown={onKeyDown}
            >
              <path d={sector(place.index, ring.from, ring.to)} />
              <text x={label.x} y={label.y} fontSize={ring.size} dominantBaseline="central">
                {name(chord)}
              </text>
              {order && (
                <text
                  className={styles.cellMark}
                  x={mark.x}
                  y={mark.y}
                  fontSize={place.ring === 'outer' ? 11 : 9}
                  dominantBaseline="central"
                >
                  {order.join('·')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className={styles.wheelCenter}>
        {picked ? (
          <>
            <strong>{name(picked)}</strong>
            <span className={styles.wheelDegree}>
              {outside === 0
                ? `${degreeLabel(picked, keyOf)} · ${signatureLabel(picked)}`
                : signatureLabel(picked)}
            </span>
            <button
              type="button"
              className={styles.add}
              aria-label={`Sumar ${name(picked)} a la vuelta`}
              onClick={() => onAdd(picked)}
            >
              +
            </button>
          </>
        ) : (
          <span>Tocá una casilla</span>
        )}
      </div>
    </div>
  );
}

/** Lo que se lee de la rueda: cómo funciona, qué quiere decir cada color, el acorde tocado y la vuelta. */
export function CircleNotes({
  keyOf,
  vuelta,
  name,
  worldTonic,
  picked,
  notation,
  onMoveWorld,
}: CircleProps & {
  /** Lleva el mundo a la casilla: mayor afuera, menor natural adentro. */
  onMoveWorld: (chord: Chord) => void;
}) {
  const moves = fifthMoves(vuelta);
  const outside = picked ? notesOutside(picked, keyOf) : 0;
  const pickedPlace = picked && circlePlace(picked);
  const signature = pickedPlace && keySignature(pickedPlace);
  const scale = pickedPlace && placeScale(pickedPlace);
  return (
    <div className={styles.circleNotes}>
      {/* Antes de tocar una casilla, cómo se lee la rueda; después, lo que dice la casilla: así entra sin bajar. */}
      {!picked && (
        <p className={ui.hint}>
          Afuera los mayores, adentro sus relativos menores. Cada paso es una quinta y gira el color: tu
          tónica es naranja y lo de tu mundo va más fuerte. Los números son tu vuelta.
        </p>
      )}
      {!picked && (
        <div className={styles.legend} aria-hidden="true">
          <span>♭</span>
          <ol>
            {STRIP.map((step) => (
              <li
                key={step}
                data-tonic={step === 0 || undefined}
                style={hueStyle((TONIC_HUE + 30 * step + 360) % 360)}
              />
            ))}
          </ol>
          <span>♯</span>
        </div>
      )}
      {picked && (
        <div className={styles.wheelInfo} data-testid="circulo-info">
          {signature && scale && (
            <>
              <p className={styles.signature} data-testid="circulo-armadura">
                {signature.sign
                  ? `${name(picked)} ${chordColor(picked.suffix) === 'minor' ? 'menor' : 'mayor'} lleva ${signature.notes.map((note) => noteText(note, notation)).join(' ')}`
                  : `${name(picked)} ${chordColor(picked.suffix) === 'minor' ? 'menor' : 'mayor'} no lleva ♯ ni ♭`}
              </p>
              <ol
                className={styles.structure}
                aria-label="Las notas de su escala y lo que hay entre una y otra"
                title="T es un tono (dos trastes) y S un semitono (uno)"
              >
                {scale.map((item, index) => (
                  <li key={index}>
                    <span>{noteText(item.note, notation)}</span>
                    <small data-step={item.next}>{item.next}</small>
                  </li>
                ))}
                <li>
                  <span>{noteText(scale[0]!.note, notation)}</span>
                </li>
              </ol>
            </>
          )}
          <p className={ui.hint} data-keep>
            {outside === 0
              ? `${name(picked)} es de tu mundo.`
              : outside === 1
                ? `${name(picked)} tiene una nota de afuera: color prestado.`
                : `${name(picked)} tiene ${outside} notas de afuera: otro tono.`}
          </p>
          {!sameColorChord(picked, worldTonic) && (
            <Button variant="mini" onClick={() => onMoveWorld(picked)}>
              Llevar el mundo a {name(picked)} {chordColor(picked.suffix) === 'minor' ? 'menor' : 'mayor'}
            </Button>
          )}
        </div>
      )}
      {/* Con una casilla tocada, la vuelta se lee en los números de la rueda: el renglón deja lugar. */}
      {moves.total > 0 && !picked && (
        <p className={ui.hint} data-keep data-testid="circulo-vuelta">
          En tu vuelta, {moves.fifths} de {moves.total} cambios caen o suben una quinta
          {moves.fifths === 0
            ? ': salta de un lado a otro de la rueda.'
            : moves.fifths === moves.total
              ? ': gira por la rueda.'
              : '.'}
        </p>
      )}
    </div>
  );
}
