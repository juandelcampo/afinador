import { describe, expect, it } from 'vitest';
import { toolOf } from '~/shared/memoria';
import { sanitize, SAVED_LIMIT } from '~/shared/settings';

describe('dónde quedó cada herramienta', () => {
  it('reconoce la herramienta de cada ruta', () => {
    expect(toolOf('/afinador')).toBe('afinador');
    expect(toolOf('/afinador/dadgad')).toBe('afinador');
    expect(toolOf('/escalas/')).toBe('escalas');
    expect(toolOf('/acorde')).toBe('acorde');
    expect(toolOf('/')).toBeNull();
    expect(toolOf('/acordeon')).toBeNull();
  });

  it('solo se acuerda de rutas de la misma herramienta', () => {
    const last = sanitize({
      last: {
        escalas: '/escalas?tono=2&escala=mixolidio',
        afinador: '/afinador/dadgad',
        acorde: 'https://otro.sitio/acorde',
        ritmo: '/escalas?tono=2',
        armonia: '/armonia/algo',
        inversiones: 42,
      } as never,
    }).last;
    expect(last).toEqual({ escalas: '/escalas?tono=2&escala=mixolidio', afinador: '/afinador/dadgad' });
  });

  it('descarta lo que no se entiende', () => {
    expect(sanitize({ last: 'nada' as never }).last).toEqual({});
  });
});

describe('lo guardado', () => {
  it('se queda con lo que sirve, sin repetidos ni más de la cuenta', () => {
    const many = Array.from({ length: SAVED_LIMIT + 5 }, (_, index) => ({
      name: `Forma ${index}`,
      detail: '',
      search: `forma=${index}`,
    }));
    const saved = sanitize({
      saved: {
        acorde: [
          { name: '  Am7  ', detail: 'x-0-2-0-1-0', search: '?forma=x-0-2-0-1-0' },
          { name: 'Repetida', detail: '', search: 'forma=x-0-2-0-1-0' },
          { name: 'Sin link' },
          null,
        ],
        ritmo: many,
        armonia: 'no' as never,
      } as never,
    }).saved!;
    expect(saved.acorde).toEqual([{ name: 'Am7', detail: 'x-0-2-0-1-0', search: 'forma=x-0-2-0-1-0' }]);
    expect(saved.ritmo).toHaveLength(SAVED_LIMIT);
    expect(saved.armonia).toEqual([]);
  });

  it('un nombre vacío no queda en blanco', () => {
    const saved = sanitize({ saved: { acorde: [{ name: '   ', detail: '', search: '' }] } as never }).saved!;
    expect(saved.acorde[0]!.name).toBe('Sin nombre');
  });
});
