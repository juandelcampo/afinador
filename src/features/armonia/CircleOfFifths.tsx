import type { KeyboardEvent } from 'react';
import { circleChord, fifthMoves, notesOutside, vueltaMarks, type Ring } from '~/core/circle';
import { chordColor, degreeLabel, type Chord, type Key } from '~/core/harmony';
import { Button } from '~/shared/ui/ui';
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

/** Cuánto tiene que ver cada casilla con el mundo, por las notas que trae de afuera: cuanto más, más clara. */
const DISTANCE = ['world', 'near', 'far', 'away'] as const;
const LEGEND = [
  { state: 'tonic', label: 'El I' },
  { state: 'world', label: 'Tu mundo' },
  { state: 'near', label: '1 nota de afuera' },
  { state: 'far', label: '2 de afuera' },
  { state: 'away', label: 'Nada que ver' },
] as const;

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
  return (
    <div className={styles.wheel} data-testid="circulo">
      <svg viewBox="0 0 400 400" role="group" aria-label="Círculo de quintas">
        {PLACES.map((place) => {
          const chord = circleChord(place);
          const ring = RINGS[place.ring];
          const label = xy(ring.label, place.index);
          const mark = xy(ring.mark, place.index);
          const order = marks.get(`${place.ring}-${place.index}`);
          const state =
            picked && sameColorChord(picked, chord)
              ? 'picked'
              : sameColorChord(worldTonic, chord)
                ? 'tonic'
                : DISTANCE[Math.min(notesOutside(chord, keyOf), 3)]!;
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
            <span>{outside === 0 ? degreeLabel(picked, keyOf) : `${outside} de afuera`}</span>
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
  onMoveWorld,
}: CircleProps & {
  /** Lleva el mundo a la casilla: mayor afuera, menor natural adentro. */
  onMoveWorld: (chord: Chord) => void;
}) {
  const moves = fifthMoves(vuelta);
  const outside = picked ? notesOutside(picked, keyOf) : 0;
  return (
    <div className={styles.circleNotes}>
      <p className={styles.hint}>
        Afuera los mayores, adentro sus relativos menores. Cada paso alrededor es una quinta: los vecinos
        comparten todas las notas menos una. El color dice cuánto tiene que ver cada uno con tu mundo; los
        números, dónde cae tu vuelta.
      </p>
      <ul className={styles.legend} aria-label="Colores de la rueda">
        {LEGEND.map((item) => (
          <li key={item.state} data-state={item.state}>
            {item.label}
          </li>
        ))}
      </ul>
      {picked && (
        <div className={styles.wheelInfo} data-testid="circulo-info">
          <p>
            {outside === 0
              ? `${name(picked)} es de tu mundo: comparte todas sus notas.`
              : outside === 1
                ? `${name(picked)} tiene una nota de afuera: color prestado, sin irte del mundo.`
                : `${name(picked)} tiene ${outside} notas de afuera: ya suena a otro tono.`}
          </p>
          {!sameColorChord(picked, worldTonic) && (
            <Button variant="mini" onClick={() => onMoveWorld(picked)}>
              Llevar el mundo a {name(picked)} {chordColor(picked.suffix) === 'minor' ? 'menor' : 'mayor'}
            </Button>
          )}
        </div>
      )}
      {moves.total > 0 && (
        <p className={styles.hint} data-testid="circulo-vuelta">
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
