// Búsqueda en el catálogo: por nombre, familia, descripción, quién la usó y por notas.
import { GROUPS, TUNINGS, type HeardItem, type Tuning } from '~/data/tunings';
import { noteToMidi } from './notes';

/** Minúsculas y sin tildes: «Estándar» y «estandar» son lo mismo. */
export const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const LETTERS: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
// Las más largas primero, para que «sol» no se lea como «so» + algo.
const SOLFEGE: ReadonlyArray<readonly [string, number]> = [
  ['sol', 7],
  ['do', 0],
  ['re', 2],
  ['mi', 4],
  ['fa', 5],
  ['la', 9],
  ['si', 11],
];

/**
 * ¿La búsqueda se puede leer como notas seguidas de la afinación? Acepta letras o solfeo,
 * con o sin espacios, sostenidos o bemoles y octavas, y compara alturas: «C#» encuentra «Db».
 * Hacen falta tres notas al menos: «la», «re» o «eb» son también palabras o una nota sola.
 */
export function matchesNotes(notes: string[], query: string): boolean {
  const text = query
    .replace(/[\s,\-–·/]+/g, '')
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b');
  if (!text) return false;
  const pitches = notes.map((note) => ((noteToMidi(note) % 12) + 12) % 12);

  // Cada «b» puede ser bemol o la nota Si: se prueban las dos lecturas.
  const fits = (pos: number, string: number, count: number): boolean => {
    if (pos === text.length) return count >= 3;
    if (string === pitches.length) return false;
    const heads: Array<[number, number]> = [];
    const letter = LETTERS[text[pos]!];
    if (letter !== undefined) heads.push([letter, 1]);
    for (const [name, pitch] of SOLFEGE) if (text.startsWith(name, pos)) heads.push([pitch, name.length]);
    for (const [pitch, length] of heads) {
      let end = pos + length;
      const options: Array<[number, number]> = [[pitch, end]];
      if (text[end] === '#') options.push([pitch + 1, end + 1]);
      if (text[end] === 'b') options.push([pitch - 1, end + 1]);
      for (const [value, after] of options) {
        end = after;
        while (/\d/.test(text[end] ?? '')) end++;
        if ((value + 12) % 12 === pitches[string] && fits(end, string + 1, count + 1)) return true;
      }
    }
    return false;
  };
  return pitches.some((_, start) => fits(0, start, 0));
}

const heardText = (entry: HeardItem) => `${entry.artist} ${entry.song ?? ''} ${entry.who ?? ''}`;
const groupName = (tuning: Tuning) => GROUPS.find((group) => group.id === tuning.group)?.name ?? '';

const words = (text: string) =>
  normalize(text)
    .split(/[^\p{L}\p{N}#]+/u)
    .filter(Boolean);

export type SearchResult = { match: boolean; item?: HeardItem };

/**
 * Arma el filtro para una búsqueda. Si se lee como notas de alguna afinación, quedan solo esas:
 * «re la re sol la re» no tiene por qué traer las que dicen «Renacimiento» y «La».
 * Si no, cada palabra tiene que ser el comienzo de alguna palabra, en cualquier orden y en
 * cualquier campo: «moon drake» encuentra Pink Moon. En la descripción solo cuentan palabras de
 * tres letras o más, para que «la» o «de» no traigan todo el catálogo.
 * Si una palabra sale de una grabación, se devuelve esa grabación para mostrarla.
 */
export function searchTunings(rawQuery: string): (tuning: Tuning) => SearchResult {
  const query = normalize(rawQuery.trim());
  if (!query) return () => ({ match: true });
  if (TUNINGS.some((tuning) => matchesNotes(tuning.notes, query)))
    return (tuning) => ({ match: matchesNotes(tuning.notes, query) });

  const terms = query.split(/\s+/);
  return (tuning) => {
    const own = [
      tuning.name,
      groupName(tuning),
      tuning.notes.map((note) => note.replace(/\d/, '')).join(''),
    ].map(normalize);
    // La búsqueda entera dentro del nombre, la familia o las notas: «gad» encuentra DADGAD.
    if (own.some((text) => text.includes(query))) return { match: true };
    const ownWords = own.flatMap(words);
    const descWords = words(tuning.desc);
    const heard = (tuning.heard ?? []).map((entry) => ({ entry, words: words(heardText(entry)) }));
    const starts = (list: string[], term: string) => list.some((word) => word.startsWith(term));
    const inOwn = (term: string) => starts(ownWords, term) || (term.length >= 3 && starts(descWords, term));
    if (!terms.every((term) => inOwn(term) || heard.some((entry) => starts(entry.words, term))))
      return { match: false };
    // La grabación que más palabras explica, entre las que no salen del nombre.
    const pending = terms.filter((term) => !starts(ownWords, term));
    let best: { entry: HeardItem; score: number } | undefined;
    for (const entry of heard) {
      const score = pending.filter((term) => starts(entry.words, term)).length;
      if (score > (best?.score ?? 0)) best = { entry: entry.entry, score };
    }
    return { match: true, item: best?.entry };
  };
}
