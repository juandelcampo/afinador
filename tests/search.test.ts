// El buscador de la lista de afinaciones.
import { describe, expect, it } from 'vitest';
import { matchesNotes, searchTunings } from '~/core/search';
import { TUNINGS } from '~/data/tunings';

const byId = (id: string) => TUNINGS.find((tuning) => tuning.id === id)!;
const found = (query: string) => {
  const search = searchTunings(query);
  return TUNINGS.filter((tuning) => search(tuning).match).map((tuning) => tuning.id);
};

describe('buscador', () => {
  it('encuentra por notas en letras, con o sin espacios ni octavas', () => {
    expect(found('dadgad')).toContain('dadgad');
    expect(found('D A D G A D')).toContain('dadgad');
    expect(found('d2 a2 d3 g3 a3 d4')).toContain('dadgad');
  });

  it('encuentra por notas en solfeo', () => {
    expect(found('re la re sol la re')).toEqual(['dadgad']);
    expect(found('Mi La Re Sol Si Mi')).toContain('estandar');
  });

  it('compara alturas: un sostenido encuentra el bemol equivalente', () => {
    expect(found('D# G# C# F# A# D#')).toContain('eb');
    expect(found('mib lab reb solb sib mib')).toContain('eb');
  });

  it('una «b» puede ser bemol o Si', () => {
    expect(matchesNotes(['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], 'dgbe')).toBe(true);
    expect(matchesNotes(['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], 'eadgbe')).toBe(true);
  });

  it('si se lee como notas, no mezcla palabras sueltas', () => {
    expect(found('re la re sol la re')).not.toContain('openg');
  });

  it('una sola nota no se lee como notas: «la» es también una palabra', () => {
    expect(matchesNotes(['A2', 'A2', 'A2', 'A2', 'A2', 'A2'], 'la')).toBe(false);
  });

  it('las palabras valen en cualquier orden y entre campos', () => {
    expect(found('kool thing')).toEqual(['fsharp']);
    const moon = found('moon drake');
    expect(moon.length).toBeGreaterThan(0);
    for (const id of moon) expect(searchTunings('moon drake')(byId(id)).item?.song).toBe('Pink Moon');
  });

  it('busca en la descripción, pero no por palabras cortas', () => {
    expect(found('celta')).toContain('dadgad');
    expect(found('de').length).toBeLessThan(TUNINGS.length / 2);
  });

  it('sin tildes y sin mayúsculas', () => {
    expect(found('ESTANDAR')).toContain('estandar');
    expect(found('zzzz')).toEqual([]);
  });
});
