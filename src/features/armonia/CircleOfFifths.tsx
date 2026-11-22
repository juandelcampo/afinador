import { useState, type KeyboardEvent } from 'react';
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

const sameColorChord = (a: Chord, b: Chord) =>
  a.root === b.root && chordColor(a.suffix) === chordColor(b.suffix);

export function CircleOfFifths({
  keyOf,
  vuelta,
  name,
  onListen,
  onAdd,
  onMoveWorld,
  worldTonic,
}: {
  keyOf: Key;
  vuelta: readonly Chord[];
  /** Cómo se escribe un acorde de la rueda: cada casilla en su propio tono. */
  name: (chord: Chord) => string;
  onListen: (chord: Chord) => void;
  onAdd: (chord: Chord) => void;
  /** Lleva el mundo a la casilla: mayor afuera, menor natural adentro. */
  onMoveWorld: (chord: Chord) => void;
  /** El acorde del I del mundo: se pinta entero. */
  worldTonic: Chord;
}) {
  const [picked, setPicked] = useState<Chord | null>(null);
  const marks = vueltaMarks(vuelta);
  const moves = fifthMoves(vuelta);
  const pick = (chord: Chord) => {
    setPicked(chord);
    onListen(chord);
  };
  const outside = picked ? notesOutside(picked, keyOf) : 0;

  return (
    <div className={styles.circle} data-testid="circulo">
      <p className={styles.hint}>
        Afuera los mayores, adentro sus relativos menores. Cada paso alrededor es una quinta: los vecinos
        comparten todas las notas menos una. Lo pintado es tu mundo; los números, tu vuelta.
      </p>
      <div className={styles.wheel}>
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
                  : notesOutside(chord, keyOf) === 0
                    ? 'world'
                    : 'away';
            const onKeyDown = (event: KeyboardEvent) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              pick(chord);
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
                onClick={() => pick(chord)}
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
        <p className={`${styles.hint} ${styles.wheelNote}`} data-testid="circulo-vuelta">
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
