import { useEffect, useMemo, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { Link, NavLink, useNavigate, useParams, type MetaFunction } from 'react-router';
import { midiToNote, noteLabel, noteToMidi, splitNote } from '~/core/notes';
import {
  changeSummary,
  chordShapes,
  neighborTunings,
  openChordName,
  stringIntervals,
  tensionWarning,
  type ChordKind,
} from '~/core/tuning';
import { normalize, searchTunings } from '~/core/search';
import { GROUPS, TUNINGS, type Tuning } from '~/data/tunings';
import { Fader } from '~/shared/Fader';
import { TEMPO_RANGE, useFavorites, useSettings } from '~/shared/settings';
import { Button, PageTitle, Segmented, Slab, SlabHead, Stepper } from '~/shared/ui/ui';
import styles from './afinador.module.css';
import { ChordDiagram } from './ChordDiagram';
import { Neck, type NeckHandle } from './Neck';
import { markStep, PatternStrip } from './PatternStrip';
import { TunerPanel } from './TunerPanel';
import { ARP_PATTERNS, STRUM_PATTERNS, useListener } from './useListener';

// Al abrir la app sin elegir afinación aparece la estándar.
const DEFAULT_ID = 'estandar';

const findTuning = (id: string | undefined) => TUNINGS.find((tuning) => tuning.id === (id ?? DEFAULT_ID));

/** Desde este ancho entran las tres columnas; debajo, una tarea por pantalla con pestañas abajo. */
const WIDE = '(min-width: 900px)';
const isWide = () => typeof window !== 'undefined' && window.matchMedia(WIDE).matches;

/** Qué se ve. En el celular son las cuatro pestañas de abajo; en pantallas anchas Afinar o Tocar van
 *  en el centro, los acordes dentro de Tocar y los temas en la columna de la derecha. */
type View = 'afinar' | 'tocar' | 'acordes' | 'temas';
const VIEWS: ReadonlyArray<{ value: View; label: string }> = [
  { value: 'afinar', label: 'Afinar' },
  { value: 'tocar', label: 'Acordes' },
  { value: 'acordes', label: 'Figuras' },
  { value: 'temas', label: 'Temas' },
];

export const meta: MetaFunction = ({ params }) => {
  const tuning = findTuning(params.tuningId);
  if (!tuning) {
    return [
      { title: 'Afinador de guitarra con afinaciones alternativas · Afinador' },
      {
        name: 'description',
        content:
          'Afiná y escuchá 147 afinaciones de guitarra: abiertas, drop, modales, DADGAD y las de Nick Drake o Sonic Youth.',
      },
    ];
  }
  return [
    { title: `${tuning.name}: afinación de guitarra, notas y cómo suena · Afinador` },
    {
      name: 'description',
      content: `${tuning.notes.map((note) => noteLabel(note)).join(' ')}. ${tuning.desc}`,
    },
  ];
};

const FAVORITES_ID = 'favoritas';

function TuningList({
  currentId,
  open,
  onOpen,
  onClose,
  onSelect,
}: {
  currentId: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const notation = useSettings((s) => s.notation);
  const query = normalize(search.trim());
  const matcher = useMemo(() => searchTunings(query), [query]);
  const input = useRef<HTMLInputElement>(null);

  const describe = (notes: string[]) =>
    notes.map((note) => noteLabel(note, notation)).join(notation === 'solfege' ? ' ' : '');
  const favorites = useFavorites();
  const toggleFavorite = useSettings((s) => s.toggleFavorite);
  const withInfo = (tunings: Tuning[]) =>
    tunings.map((tuning) => ({ tuning, info: matcher(tuning) })).filter(({ info }) => info.match);
  const favoriteTunings = favorites.flatMap((id) => TUNINGS.filter((tuning) => tuning.id === id));
  const sections = [
    { id: FAVORITES_ID, name: 'Favoritas', items: withInfo(favoriteTunings) },
    ...GROUPS.map((group) => ({
      ...group,
      items: withInfo(TUNINGS.filter((tuning) => tuning.group === group.id)),
    })),
  ].filter((section) => section.items.length > 0);
  const empty = sections.length === 0;
  // Las favoritas se repiten en su sección de siempre: se cuentan una vez.
  const resultCount = new Set(sections.flatMap((section) => section.items.map(({ tuning }) => tuning.id)))
    .size;
  const navigate = useNavigate();
  // Las secciones arrancan todas cerradas, Favoritas también. Mientras se busca se abren todas las que
  // tienen resultados.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const toggleSection = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  // En el celular la lista tapa la pantalla: al elegir se cierra. En una pantalla ancha queda abierta.
  const picked = () => {
    if (!isWide()) onClose();
  };
  const select = (event: MouseEvent, id: string) => {
    picked();
    // Abrir en otra pestaña no cuenta como elegir en esta.
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey) onSelect(id);
  };

  // Al abrirse, el cursor va al buscador: se abre para buscar.
  useEffect(() => {
    if (open && isWide()) input.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <aside className={styles.catalog} data-open={open} aria-label="Afinaciones">
      {/* Cerrada, en pantallas anchas queda una franja con su nombre para volver a abrirla. */}
      <button
        type="button"
        className={styles.rail}
        aria-expanded={false}
        aria-label="Abrir la lista de afinaciones"
        onClick={onOpen}
      >
        <span aria-hidden="true">›</span>
        <span>Afinaciones</span>
      </button>
      <div className={styles.catalogBody}>
        <div className={styles.searchRow}>
          <label className={styles.search}>
            <span className="sr-only">Buscar por afinación, nota, artista o canción</span>
            <input
              ref={input}
              type="search"
              value={search}
              placeholder="BUSCAR"
              autoComplete="off"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                // Enter abre el primer resultado; Escape borra la búsqueda y, vacía, cierra la lista.
                if (event.key === 'Escape') {
                  event.preventDefault();
                  if (search) setSearch('');
                  else onClose();
                }
                const first = sections[0]?.items[0]?.tuning;
                if (event.key === 'Enter' && query && first) {
                  event.preventDefault();
                  picked();
                  navigate(`/afinador/${first.id}`);
                  onSelect(first.id);
                }
              }}
            />
          </label>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Cerrar la lista de afinaciones"
            onClick={onClose}
          >
            <span aria-hidden="true" data-wide>
              ‹
            </span>
            <span aria-hidden="true" data-narrow>
              ✕
            </span>
          </button>
        </div>
        {/* Siempre en el HTML, para que el lector de pantalla anuncie cuando cambia. */}
        <p className={styles.searchCount} aria-live="polite" data-testid="search-count">
          {query
            ? !empty && (resultCount === 1 ? '1 afinación' : `${resultCount} afinaciones`)
            : `${TUNINGS.length} afinaciones`}
        </p>
        <nav className={styles.catalogList} aria-label="Afinaciones">
          {sections.map((section) => {
            const isOpen = query !== '' || expanded.has(section.id);
            const hasCurrent = section.items.some(({ tuning }) => tuning.id === currentId);
            return (
              <div key={section.id}>
                <h2 className={styles.groupTitle}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`grupo-${section.id}`}
                    disabled={query !== ''}
                    data-current={hasCurrent || undefined}
                    onClick={() => toggleSection(section.id)}
                  >
                    <span>{section.name}</span>
                    {hasCurrent && <span className="sr-only">, tiene la afinación abierta</span>}
                    <span className={styles.groupCount}>{section.items.length}</span>
                    <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                  </button>
                </h2>
                {/* Cerrada sigue en el HTML: la página estática enlaza todas las afinaciones. */}
                <div id={`grupo-${section.id}`} hidden={!isOpen}>
                  {section.items.map(({ tuning, info }) => {
                    const noteText = describe(tuning.notes);
                    const favorite = favorites.includes(tuning.id);
                    // En Favoritas la afinación se repite: data-id queda solo en su sección de siempre.
                    const inFavorites = section.id === FAVORITES_ID;
                    return (
                      <div key={tuning.id} className={styles.tuningRow}>
                        <NavLink
                          to={`/afinador/${tuning.id}`}
                          onClick={(event) => select(event, tuning.id)}
                          className={styles.tuningItem}
                          data-id={inFavorites ? undefined : tuning.id}
                          data-favorite-id={inFavorites ? tuning.id : undefined}
                          aria-current={tuning.id === currentId ? 'page' : undefined}
                        >
                          <strong>{tuning.name}</strong>
                          {noteText !== tuning.name && <small>{noteText}</small>}
                          {info.item && (
                            <small>
                              {info.item.song ? `${info.item.song} · ${info.item.artist}` : info.item.artist}
                            </small>
                          )}
                        </NavLink>
                        <button
                          type="button"
                          className={styles.star}
                          aria-pressed={favorite}
                          aria-label={`Favorita: ${tuning.name}`}
                          title={favorite ? 'Sacar de favoritas' : 'Guardar en favoritas'}
                          onClick={() => toggleFavorite(tuning.id)}
                        >
                          <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {empty && <p className={styles.empty}>No hay afinaciones con esa búsqueda.</p>}
        </nav>
      </div>
    </aside>
  );
}

/** La ficha de la afinación. El nombre es el botón para cambiarla; en el celular los datos se abren
 *  con ⓘ, en pantallas anchas están siempre a la vista. */
function Hero({ tuning, onChange }: { tuning: Tuning; onChange: () => void }) {
  const notation = useSettings((s) => s.notation);
  const toggleFavorite = useSettings((s) => s.toggleFavorite);
  const { changed, semitones } = changeSummary(tuning.notes);
  const warning = tensionWarning(tuning);
  const group = GROUPS.find((item) => item.id === tuning.group);
  const favorite = useFavorites().includes(tuning.id);
  const [info, setInfo] = useState(false);
  return (
    <Slab className={styles.hero}>
      <div className={styles.heroHead}>
        <header className={styles.heroTitle}>
          {group && <p>{group.name}</p>}
          <h1>{tuning.name}</h1>
        </header>
        <div className={styles.heroTools}>
          <button
            type="button"
            className={styles.heroStar}
            aria-pressed={favorite}
            aria-label={`Favorita: ${tuning.name}`}
            title={favorite ? 'Sacar de favoritas' : 'Guardar en favoritas'}
            data-testid="favorite-mark"
            onClick={() => toggleFavorite(tuning.id)}
          >
            <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
          </button>
          <button
            type="button"
            className={styles.infoToggle}
            aria-expanded={info}
            aria-controls="ficha"
            aria-label={`Cómo es ${tuning.name}`}
            onClick={() => setInfo((value) => !value)}
          >
            <span aria-hidden="true">i</span>
          </button>
        </div>
      </div>
      <div className={styles.heroInfo} id="ficha" data-open={info}>
        <p className={styles.desc}>{tuning.desc}</p>
        <dl className={styles.facts}>
          <div>
            <dt>Al aire</dt>
            <dd data-testid="fact-chord">{openChordName(tuning.notes, notation)}</dd>
          </div>
          <div>
            <dt>Intervalos</dt>
            <dd data-testid="fact-intervals">{stringIntervals(tuning.notes).join(' ')}</dd>
          </div>
          <div>
            <dt>Cambian</dt>
            <dd data-testid="fact-changes">
              {changed === 0 ? (
                'Ninguna'
              ) : (
                <>
                  <span>{changed} de 6</span> ·{' '}
                  <span>
                    {semitones} {semitones === 1 ? 'semitono' : 'semitonos'}
                  </span>
                </>
              )}
            </dd>
          </div>
        </dl>
        {warning && <p className={styles.warning}>{warning}</p>}
      </div>
      {/* En el celular la lista no tiene columna: se abre desde acá y tapa la pantalla. */}
      <button type="button" className={styles.catalogToggle} data-narrow onClick={onChange}>
        <span>Elegir entre {TUNINGS.length} afinaciones</span>
        <span aria-hidden="true">↓</span>
      </button>
    </Slab>
  );
}

function Heard({
  tuning,
  onCapo,
  onVideoOpen,
}: {
  tuning: Tuning;
  onCapo: (capo: number) => void;
  onVideoOpen: () => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = tuning.heard ?? [];
  const playing = openIndex === null ? undefined : items[openIndex];
  const video = useRef<HTMLDivElement>(null);

  // Al abrir un tema, el reproductor se muestra entero. Una sola vez: si la página se moviera mientras
  // el mouse está sobre el video, YouTube cerraría el control de volumen.
  useEffect(() => {
    if (openIndex === null) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    video.current?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
  }, [openIndex]);

  if (items.length === 0 && tuning.octaves !== 'est') return null;
  return (
    <section className={styles.heard} aria-label="Dónde se escuchó">
      {items.length > 0 && (
        <h2 className={styles.asideTitle}>
          Se escuchó en <span>{items.length}</span>
        </h2>
      )}
      <ul>
        {items.map((item, index) => {
          const open = openIndex === index;
          const details = [item.artist, item.who].filter(Boolean);
          return (
            <li key={`${item.artist}-${item.song ?? ''}-${index}`}>
              <div className={styles.heardRow}>
                <div className={styles.heardText}>
                  {item.song && <strong>{item.song} </strong>}
                  <span>{details.join(' · ')}</span>
                  {item.conf === 'duda' && (
                    <small
                      className={styles.disputed}
                      title="Las fuentes no coinciden en la afinación de este tema"
                    >
                      Discutida
                    </small>
                  )}
                </div>
                {item.capo && (
                  <button
                    type="button"
                    className={styles.heardCapo}
                    aria-label={`Poner el capo en el traste ${item.capo} y tocar`}
                    onClick={() => onCapo(item.capo!)}
                  >
                    Capo <span>{item.capo}</span>
                  </button>
                )}
                {item.video && (
                  <button
                    type="button"
                    className={styles.heardPlay}
                    aria-expanded={open}
                    aria-controls={open ? 'video' : undefined}
                    aria-label={`${open ? 'Cerrar' : 'Escuchar'} ${item.song}, de ${item.artist}`}
                    onClick={() => {
                      if (!open) onVideoOpen();
                      setOpenIndex(open ? null : index);
                    }}
                  >
                    <span aria-hidden="true">{open ? '✕' : '▶'}</span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {tuning.octaves === 'est' && (
        <p className={styles.hint}>
          Las fuentes dan estas notas sin octava: las octavas de esta afinación son una estimación.
        </p>
      )}
      {/* El reproductor se crea recién al abrirlo: hasta entonces no se contacta a YouTube. */}
      {playing?.video && (
        <div className={styles.video} id="video" ref={video}>
          <div className={styles.videoBar}>
            <span>
              <strong>{playing.song}</strong> · {playing.artist}
            </span>
          </div>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${playing.video}?autoplay=1&rel=0`}
            title={`${playing.song}, de ${playing.artist}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
    </section>
  );
}

/** Las afinaciones a las que se llega cambiando una sola cuerda. */
function Neighbors({ tuning, onPick }: { tuning: Tuning; onPick: (id: string) => void }) {
  const notation = useSettings((s) => s.notation);
  const near = useMemo(() => neighborTunings(tuning, TUNINGS), [tuning]);
  if (near.length === 0) return null;
  const name = (note: string, other: string) =>
    // Si cambia solo la octava, la octava es lo que hay que leer.
    noteToMidi(note) % 12 === noteToMidi(other) % 12
      ? noteLabel(note, notation) + splitNote(note).octave
      : noteLabel(note, notation);
  return (
    <section className={styles.near} aria-label="A una cuerda de distancia">
      <h2 className={styles.asideTitle}>A una cuerda de distancia</h2>
      <p className={styles.hint}>Cambiando una sola cuerda llegás a estas.</p>
      <ul>
        {near.map(({ tuning: other, index, from, to }) => (
          <li key={other.id}>
            <Link to={`/afinador/${other.id}`} onClick={() => onPick(other.id)}>
              <strong>{other.name}</strong>
              <span>
                <small>{tuning.notes.length - index}.ª</small>
                <b>
                  {name(from, to)}→{name(to, from)}
                </b>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const KIND_FILTERS: ReadonlyArray<{ value: ChordKind | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'mayor', label: 'Mayores' },
  { value: 'menor', label: 'Menores' },
  { value: 'otro', label: 'Otros' },
];
/** Cuántos acordes entran en el celular antes del botón que lleva a Figuras: dos filas. En pantallas
 *  anchas entran todos. */
const CHIPS_NARROW = 9;

function TuningPage({
  tuning,
  pendingPlayRef,
  playTick,
  view,
  setView,
  asideOpen,
  setAsideOpen,
  onChange,
  onPick,
}: {
  tuning: Tuning;
  pendingPlayRef: RefObject<string | null>;
  playTick: number;
  view: View;
  setView: (view: View) => void;
  asideOpen: boolean;
  setAsideOpen: (open: boolean) => void;
  onChange: () => void;
  onPick: (id: string) => void;
}) {
  const notation = useSettings((s) => s.notation);
  const a4 = useSettings((s) => s.a4);
  const neck = useRef<NeckHandle>(null);
  const strip = useRef<HTMLOListElement>(null);
  const listener = useListener(
    tuning.notes,
    a4,
    (stringIndex, velocity) => neck.current?.excite(stringIndex, velocity),
    (step) => markStep(strip.current, step),
  );
  const patterns = listener.style === 'arp' ? ARP_PATTERNS : STRUM_PATTERNS;
  const { playAscending } = listener;
  const [kind, setKind] = useState<ChordKind | 'todos'>('todos');
  // Con capo, las figuras se cuentan desde el capo y los nombres son los de lo que suena.
  const shapes = useMemo(
    () =>
      chordShapes(
        tuning.notes.map((note) => midiToNote(noteToMidi(note) + listener.capo)),
        { notation },
      ),
    [tuning.notes, listener.capo, notation],
  );
  const isOn = (frets: number[]) => frets.every((fret, index) => fret === listener.frets[index]);
  // La misma aclaración en Acordes y en Figuras; la de Acordes es la que miran las pruebas.
  const capoNote = (testId?: string) =>
    listener.capo > 0 && (
      <p className={styles.hint} data-testid={testId}>
        Con capo en el traste {listener.capo}: los trastes se cuentan desde el capo y el nombre es el del
        acorde que suena.
      </p>
    );

  // Al elegir una afinación de la lista suena su arpegio ascendente, una sola vez.
  useEffect(() => {
    if (pendingPlayRef.current !== tuning.id) return;
    // En diferido: en desarrollo React monta, desmonta y vuelve a montar, y ese desmontaje
    // cortaría el arpegio después de la primera nota.
    const timer = setTimeout(() => {
      pendingPlayRef.current = null;
      playAscending();
    }, 0);
    return () => clearTimeout(timer);
  }, [playTick, tuning.id, pendingPlayRef, playAscending]);

  // En pantallas anchas Figuras va dentro de Acordes y Temas en su columna: en el centro hay dos pestañas.
  const center = view === 'tocar' || view === 'acordes' ? 'tocar' : 'afinar';

  return (
    <>
      <div className={styles.center}>
        <Hero tuning={tuning} onChange={onChange} />
        <div className={styles.tabs} role="tablist" aria-label="Qué hacer con esta afinación">
          {VIEWS.slice(0, 2).map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              id={`tab-${option.value}`}
              aria-selected={center === option.value}
              aria-controls={`panel-${option.value}`}
              onClick={() => setView(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div
          className={styles.panel}
          data-panel="afinar"
          id="panel-afinar"
          role="tabpanel"
          aria-labelledby="tab-afinar"
        >
          <TunerPanel notes={tuning.notes} onPlayOpen={playAscending} />
        </div>

        <div
          className={styles.panel}
          data-panel="tocar"
          id="panel-tocar"
          role="tabpanel"
          aria-labelledby="tab-tocar"
        >
          <Slab className={styles.play}>
            {/* En pantalla ancha la pestaña ya dice Acordes: el título solo va en el celular. */}
            <div data-narrow>
              <SlabHead title="Acordes">
                <div className={styles.headTools}>
                  <Fader compact />
                </div>
              </SlabHead>
            </div>

            <div
              className={styles.chips}
              data-testid="chord-shapes"
              role="group"
              aria-label="Acordes: tocá uno para ponerlo en el mástil y escucharlo"
            >
              {shapes.map((shape) => (
                <button
                  key={shape.frets.join()}
                  type="button"
                  aria-label={`${shape.label}: ${shape.chord}`}
                  aria-pressed={isOn(shape.frets)}
                  onClick={() => listener.applyShape(shape.frets)}
                >
                  <strong>{shape.chord}</strong>
                  <small>{shape.label}</small>
                </button>
              ))}
              {shapes.length > CHIPS_NARROW && (
                <button
                  type="button"
                  className={styles.more}
                  data-narrow
                  aria-label={`Ver los otros ${shapes.length - CHIPS_NARROW} acordes`}
                  onClick={() => setView('acordes')}
                >
                  +{shapes.length - CHIPS_NARROW}
                </button>
              )}
            </div>
            {capoNote('capo-note')}

            <Neck
              ref={neck}
              notes={tuning.notes}
              capo={listener.capo}
              frets={listener.frets}
              notation={notation}
              onPluck={(stringIndex, velocity) => listener.playString(stringIndex, undefined, velocity)}
              onToggleFret={listener.toggleFret}
            />
            <p className={styles.neckHint}>
              Tocá un traste para pisarlo; pasá el dedo por la zona gris para rasguear.
            </p>

            <div className={styles.playRow}>
              <button
                type="button"
                id="play-toggle"
                className={styles.playButton}
                data-on={listener.running}
                aria-label={listener.running ? 'Parar' : 'Tocar'}
                onClick={() => (listener.running ? listener.stop() : listener.start())}
              >
                <span aria-hidden="true">{listener.running ? '■' : '▶'}</span>
              </button>
              {/* Cómo suena, todo junto: la forma y el patrón de esa forma. */}
              <Segmented
                label="Forma de tocar"
                value={listener.style}
                options={[
                  { value: 'arp', label: 'Arpegiado' },
                  { value: 'strum', label: 'Rasgueado' },
                ]}
                onChange={listener.chooseStyle}
              />
              <div className={styles.patterns}>
                <Segmented
                  label="Patrón"
                  value={listener.patternId[listener.style]}
                  options={patterns.map((pattern) => ({ value: pattern.id, label: pattern.name }))}
                  onChange={listener.choosePattern}
                  stretch
                />
              </div>
            </div>
            <div className={styles.stripRow}>
              <PatternStrip
                ref={strip}
                style={listener.style}
                patternId={listener.patternId[listener.style]}
              />

              <div className={styles.controls}>
                <label className={styles.field}>
                  <span>Velocidad: {listener.tempo} ppm</span>
                  <input
                    type="range"
                    min={TEMPO_RANGE.min}
                    max={TEMPO_RANGE.max}
                    step={TEMPO_RANGE.step}
                    value={listener.tempo}
                    onChange={(event) => listener.setTempo(Number(event.target.value))}
                  />
                </label>
                <div className={styles.field}>
                  <span>Capo</span>
                  <Stepper
                    label="capo"
                    value={
                      <span data-testid="capo-value">
                        {listener.capo ? `Traste ${listener.capo}` : 'Sin capo'}
                      </span>
                    }
                    onDown={() => listener.setCapo(listener.capo - 1)}
                    onUp={() => listener.setCapo(listener.capo + 1)}
                  />
                </div>
                <label className={styles.check}>
                  <input
                    id="loop"
                    type="checkbox"
                    checked={listener.loop}
                    onChange={(event) => listener.setLoop(event.target.checked)}
                  />{' '}
                  Repetir
                </label>
                <Button
                  onClick={listener.clearFrets}
                  ariaLabel="Soltar trastes"
                  title="Soltar los trastes pisados"
                  variant="mini"
                >
                  Soltar
                </Button>
                <div className={`${styles.field} ${styles.volume}`} data-wide>
                  <span aria-hidden="true">Volumen</span>
                  <Fader compact />
                </div>
              </div>
            </div>
          </Slab>
        </div>

        {/* Solo en el celular: en pantallas anchas los acordes están todos en Acordes. */}
        <div className={styles.panel} data-panel="acordes">
          <Slab>
            <SlabHead title="Figuras">
              <span className={styles.count}>
                {shapes.filter((shape) => kind === 'todos' || shape.kind === kind).length} de {shapes.length}
              </span>
            </SlabHead>
            <div className={styles.filters}>
              <Segmented
                label="Filtrar acordes"
                value={kind}
                options={KIND_FILTERS}
                onChange={setKind}
                stretch
              />
            </div>
            <div className={styles.diagrams}>
              {shapes
                .filter((shape) => kind === 'todos' || shape.kind === kind)
                .map((shape) => (
                  <button
                    key={shape.frets.join()}
                    type="button"
                    aria-label={`${shape.chord}: ${shape.label}`}
                    aria-pressed={isOn(shape.frets)}
                    onClick={() => listener.applyShape(shape.frets)}
                  >
                    <strong>{shape.chord}</strong>
                    <ChordDiagram frets={shape.frets} />
                  </button>
                ))}
            </div>
            <p className={styles.hint}>
              Figuras para la mano, de la 6.ª cuerda a la 1.ª; × es cuerda apagada. Tocá una para escucharla
              con el patrón de Acordes: queda pisada en el mástil.
            </p>
            {capoNote()}
          </Slab>
        </div>
      </div>

      <aside className={styles.aside} data-open={asideOpen} data-panel="temas" aria-label="Temas">
        <button
          type="button"
          className={styles.rail}
          aria-expanded={false}
          aria-label="Abrir los temas y las afinaciones cercanas"
          onClick={() => setAsideOpen(true)}
        >
          <span aria-hidden="true">‹</span>
          <span>Se escuchó en</span>
        </button>
        <div className={styles.asideBody}>
          <div className={styles.asideHead}>
            <span>{tuning.name}</span>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Cerrar la columna de temas"
              onClick={() => setAsideOpen(false)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
          <Heard
            tuning={tuning}
            onVideoOpen={listener.stop}
            onCapo={(capo) => {
              listener.setCapo(capo);
              setView('tocar');
              setTimeout(listener.start, 0);
            }}
          />
          <Neighbors tuning={tuning} onPick={onPick} />
          {!tuning.heard?.length && neighborTunings(tuning, TUNINGS).length === 0 && (
            <p className={styles.empty}>Todavía no hay temas registrados con esta afinación.</p>
          )}
        </div>
      </aside>

      <nav className={styles.tabbar} aria-label="Secciones del afinador">
        {VIEWS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={view === option.value}
            onClick={() => {
              setView(option.value);
              window.scrollTo({ top: 0 });
            }}
          >
            {option.label}
          </button>
        ))}
      </nav>
    </>
  );
}

export default function AfinadorRoute() {
  const { tuningId } = useParams();
  // Elegir de la lista pide un arpegio; la página de esa afinación lo toca al aparecer.
  const pendingPlayRef = useRef<string | null>(null);
  const [playTick, setPlayTick] = useState(0);
  // Las columnas de los costados arrancan cerradas: el centro manda y lo demás se abre a pedido.
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [asideOpen, setAsideOpen] = useState(false);
  const [view, setView] = useState<View>('afinar');

  const tuning = findTuning(tuningId);
  const pick = (id: string) => {
    pendingPlayRef.current = id;
    setPlayTick((tick) => tick + 1);
  };

  if (!tuning) {
    return (
      <Slab>
        <PageTitle title="Esa afinación no existe" />
        <NavLink to="/afinador">Volver al afinador</NavLink>
      </Slab>
    );
  }

  return (
    <div className={styles.page} data-view={view} data-catalog={catalogOpen} data-aside={asideOpen}>
      <TuningList
        currentId={tuning.id}
        open={catalogOpen}
        onOpen={() => setCatalogOpen(true)}
        onClose={() => setCatalogOpen(false)}
        onSelect={pick}
      />
      {/* La clave reinicia trastes, capo y lectura al cambiar de afinación; el patrón queda. */}
      <div className={styles.content} key={tuning.id}>
        <TuningPage
          tuning={tuning}
          pendingPlayRef={pendingPlayRef}
          playTick={playTick}
          view={view}
          setView={setView}
          asideOpen={asideOpen}
          setAsideOpen={setAsideOpen}
          onChange={() => setCatalogOpen(true)}
          onPick={pick}
        />
      </div>
    </div>
  );
}
