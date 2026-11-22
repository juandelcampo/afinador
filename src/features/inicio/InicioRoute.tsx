import { Link, type MetaFunction } from 'react-router';
import { TUNINGS } from '~/data/tunings';
import { PageTitle, Slab } from '~/shared/ui/ui';
import styles from './inicio.module.css';

export const meta: MetaFunction = () => [
  { title: 'Herramientas para componer con guitarra · Afinador' },
  {
    name: 'description',
    content: `Afiná y escuchá ${TUNINGS.length} afinaciones, armá vueltas de acordes por emoción y encontrá todas las formas de cada acorde en tu afinación.`,
  },
];

interface Tool {
  to: string;
  name: string;
  /** Lo que hace, en una línea. */
  pitch: string;
  /** Lo que podés hacer adentro. */
  things: string[];
}

const TOOLS: Tool[] = [
  {
    to: '/afinador',
    name: 'Afinador',
    pitch: `Afiná y escuchá ${TUNINGS.length} afinaciones: abiertas, drop, modales y las de tus discos.`,
    things: [
      'Afinar con el micrófono, cuerda por cuerda',
      'Tocar el mástil y escuchar la afinación, con capo',
      'Los acordes que la mano alcanza en cada una',
    ],
  },
  {
    to: '/armonia',
    name: 'Armonía',
    pitch: 'Acordes por emoción para armar una vuelta que no suene a lo de siempre.',
    things: [
      'Qué dice cada acorde: alegre, triste o raro',
      'Colores de cine, séptimas y cadencias para cerrar',
      'Cada acorde con su figura en tu afinación',
    ],
  },
  {
    to: '/inversiones',
    name: 'Inversiones',
    pitch: 'Todas las maneras de hacer un acorde en el mástil, según qué nota va en el bajo.',
    things: [
      'Fundamental, primera, segunda y tercera inversión',
      'Cada forma en el diapasón, con qué nota del acorde es cada dedo',
      'Todas las del mástil, en tu afinación',
    ],
  },
  {
    to: '/acorde',
    name: '¿Qué acorde?',
    pitch: 'Poné los dedos donde te suena lindo y te dice cómo se llama ese acorde.',
    things: [
      'Cualquier forma, con las cuerdas al aire o apagadas',
      'Sus notas, qué va en el bajo y otras maneras de leerlo',
      'En tu afinación, y de ahí a todas sus formas',
    ],
  },
];

/** La portada: las herramientas, cada una por su lado, para elegir por dónde empezar. */
export default function InicioRoute() {
  return (
    <div className={styles.page}>
      <Slab>
        <PageTitle eyebrow="Para componer con guitarra" title="Elegí una herramienta">
          <p>
            Para tocar de oído y salir de lo de siempre. Cada herramienta se usa sola: empezá por la que te
            pida la guitarra hoy.
          </p>
        </PageTitle>
      </Slab>
      <ul className={styles.tools}>
        {TOOLS.map((tool, index) => (
          <li key={tool.to}>
            <Link to={tool.to} className={styles.tool}>
              <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
              <strong className={styles.name}>{tool.name}</strong>
              <span className={styles.pitch}>{tool.pitch}</span>
              <ul className={styles.things}>
                {tool.things.map((thing) => (
                  <li key={thing}>{thing}</li>
                ))}
              </ul>
              <span className={styles.open} aria-hidden="true">
                Abrir →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
