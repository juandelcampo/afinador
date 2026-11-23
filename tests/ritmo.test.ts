// Ritmo: compases, euclidianos, polirritmias, mutantes y la caja de ritmos.
import { describe, expect, it } from 'vitest';
import {
  cycleFor,
  describeRhythm,
  drumConfig,
  euclid,
  randomDrumPattern,
  rhythmFromParams,
  rhythmToDrums,
  rhythmToParams,
  rowLength,
  tapTempo,
  DRUMS,
  type DrumConfig,
  type RhythmConfig,
} from '~/core/rhythm';
import { DRUM_PRESETS } from '~/data/drums';

describe('ritmo', () => {
  it('reparte los golpes euclidianos de forma pareja', () => {
    expect(
      euclid(3, 8)
        .map((on) => (on ? 'x' : '.'))
        .join(''),
    ).toBe('x..x..x.');
    for (let steps = 2; steps <= 16; steps++) {
      for (let pulses = 1; pulses <= steps; pulses++) {
        const pattern = euclid(pulses, steps);
        expect(pattern.filter(Boolean).length).toBe(pulses);
        const positions = pattern.flatMap((on, i) => (on ? [i] : []));
        const gaps = positions.map(
          (position, i) => (positions[(i + 1) % pulses]! - position + steps) % steps || steps,
        );
        expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('rota sin cambiar la cantidad de golpes', () => {
    expect(euclid(3, 8, 1).filter(Boolean).length).toBe(3);
    expect(euclid(3, 8, 1).join()).not.toBe(euclid(3, 8).join());
  });

  it('el 7/8 agrupado acentúa el inicio de cada grupo', () => {
    const cycle = cycleFor({ mode: 'meter', groups: [2, 2, 3], denom: 8, bpm: 120 }, 0);
    expect(cycle.beats).toBe(3.5);
    expect(cycle.hits.map((hit) => hit.level)).toEqual([2, 0, 1, 0, 1, 0, 0]);
  });

  it('la polirritmia pone dos carriles en el mismo ciclo', () => {
    const cycle = cycleFor({ mode: 'poly', a: 3, b: 2, bpm: 120 }, 0);
    expect(cycle.lanes).toEqual([3, 2]);
    expect(cycle.hits.filter((hit) => hit.at === 0).length).toBe(2);
  });

  it('cada línea de la polirritmia suena con su instrumento de batería', () => {
    const voicesOf = (config: RhythmConfig) => {
      const { hits } = cycleFor(config, 0);
      return [0, 1].map((lane) => [
        ...new Set(hits.filter((hit) => hit.lane === lane).map((hit) => hit.voice)),
      ]);
    };
    expect(voicesOf({ mode: 'poly', a: 3, b: 2, bpm: 120 })).toEqual([['hihat'], ['bombo']]);
    expect(voicesOf({ mode: 'poly', a: 3, b: 2, voices: ['percu', 'tom'], bpm: 120 })).toEqual([
      ['percu'],
      ['tom'],
    ]);
    expect(describeRhythm({ mode: 'poly', a: 3, b: 2, voices: ['aro', 'tom'], bpm: 120 }).rule).toContain(
      '3 golpes de aro y 2 de tom',
    );
    // Los links de antes dicen cencerro: ahora es la percusión.
    expect(rhythmFromParams(new URLSearchParams('m=poly&bpm=120&a=3&b=2&v=cencerro_tom'))).toEqual({
      mode: 'poly',
      a: 3,
      b: 2,
      voices: ['percu', 'tom'],
      bpm: 120,
    });
  });

  it('el compás mutante cambia cada tantas vueltas', () => {
    const config: RhythmConfig = {
      mode: 'mutante',
      barsEach: 2,
      bpm: 100,
      meters: [
        { groups: [1, 1, 1, 1], denom: 4 },
        { groups: [2, 3], denom: 8 },
      ],
    };
    expect([0, 1, 2, 3, 4].map((index) => cycleFor(config, index).lanes[0])).toEqual([4, 4, 5, 5, 4]);
  });

  it('un ritmo sobrevive a ida y vuelta por la URL', () => {
    const configs: RhythmConfig[] = [
      { mode: 'meter', groups: [2, 2, 3], denom: 8, bpm: 160 },
      { mode: 'euclid', pulses: 5, steps: 8, rotation: 2, bpm: 90 },
      { mode: 'poly', a: 4, b: 3, bpm: 96 },
      { mode: 'poly', a: 4, b: 3, voices: ['palma', 'caja'], bpm: 96 },
      {
        mode: 'mutante',
        meters: [
          { groups: [2, 3], denom: 8 },
          { groups: [1, 1, 1], denom: 4 },
        ],
        barsEach: 3,
        bpm: 120,
      },
    ];
    for (const config of configs) expect(rhythmFromParams(rhythmToParams(config))).toEqual(config);
  });

  it('rechaza una URL inválida', () => {
    for (const text of [
      'm=meter&bpm=9999&g=2&d=8',
      'm=meter&bpm=100&g=abc&d=8',
      'm=euclid&bpm=100&k=9&n=8&r=0',
      'm=poly&bpm=100&a=3&b=2&v=hihat',
      'm=poly&bpm=100&a=3&b=2&v=hihat_gong',
      'm=nada&bpm=100',
      'bpm=100',
    ]) {
      expect(rhythmFromParams(new URLSearchParams(text)), text).toBeNull();
    }
  });

  it('cada ritmo explica su regla', () => {
    expect(describeRhythm({ mode: 'euclid', pulses: 3, steps: 8, rotation: 0, bpm: 90 }).rule).toContain(
      'tresillo',
    );
    expect(describeRhythm({ mode: 'meter', groups: [2, 2, 3], denom: 8, bpm: 90 }).label).toContain(
      '7/8 (2+2+3)',
    );
  });

  it('una batería con swing sobrevive a ida y vuelta por la URL, y sin swing no lo escribe', () => {
    const straight = drumConfig(100, { bombo: 'x...x...', hihat: 'xxxxxxxx' });
    expect(rhythmToParams(straight).has('sw')).toBe(false);
    expect(rhythmFromParams(rhythmToParams(straight))).toEqual(straight);
    const swung: DrumConfig = { ...straight, swing: 66 };
    expect(rhythmFromParams(rhythmToParams(swung))).toEqual(swung);
    expect(rhythmFromParams(new URLSearchParams(`${rhythmToParams(straight)}&sw=90`))).toBeNull();
  });

  it('las filas calladas no viajan en el link', () => {
    const config: DrumConfig = {
      ...drumConfig(100, { bombo: 'x...x...' }),
      muted: [true, false, false, false, false, false, false, false],
    };
    const { muted: _muted, ...rest } = config;
    expect(rhythmFromParams(rhythmToParams(config))).toEqual(rest);
  });

  it('los acentos y la batería elegida viajan en el link; la acústica no se escribe', () => {
    const config = drumConfig(100, { bombo: 'X..x', abierto: '..x.' });
    expect(config.tracks[0]).toEqual([2, 0, 0, 1]);
    // El acento suena como nivel 2; el golpe normal, como 1.
    const bombo = cycleFor(config, 0).hits.filter((hit) => hit.voice === 'bombo');
    expect(bombo.map((hit) => hit.level)).toEqual([2, 1]);
    expect(rhythmToParams(config).get('p')).toBe('2001_0000_0000_0000_0010_0000_0000_0000');
    expect(rhythmToParams(config).has('kit')).toBe(false);
    const machine: DrumConfig = { ...config, kit: '808' };
    expect(rhythmToParams(machine).get('kit')).toBe('808');
    expect(rhythmFromParams(rhythmToParams(machine))).toEqual(machine);
    // Una batería que no existe es la acústica.
    expect(rhythmFromParams(new URLSearchParams(`${rhythmToParams(config)}&kit=linn`))).toEqual(config);
  });

  it('un link de antes, con seis filas, abre con cada sonido en su fila de ahora', () => {
    const params = new URLSearchParams(
      'm=drum&bpm=98&n=4&p=1000_0010_1111_0001_0100_1010&l=80_70_60_50_40_30',
    );
    const config = rhythmFromParams(params);
    expect(config?.mode).toBe('drum');
    if (config?.mode !== 'drum') return;
    const row = (id: string) => config.tracks[DRUMS.findIndex((drum) => drum.id === id)]!.join('');
    expect(row('bombo')).toBe('1000');
    expect(row('caja')).toBe('0010');
    expect(row('aro')).toBe('0000');
    expect(row('hihat')).toBe('1111');
    expect(row('abierto')).toBe('0000');
    expect(row('palma')).toBe('0001');
    expect(row('tom')).toBe('0100');
    expect(row('percu')).toBe('1010');
    expect(config.levels).toEqual([0.8, 0.7, 0.8, 0.6, 0.8, 0.5, 0.4, 0.3]);
  });
});

describe('caja de ritmos', () => {
  it('el swing corre solo los contratiempos, y con 66 caen como tresillo', () => {
    const config: DrumConfig = { ...drumConfig(100, { hihat: 'xxxx' }), swing: 66 };
    const ats = cycleFor(config, 0)
      .hits.filter((hit) => hit.voice === 'hihat')
      .map((hit) => hit.at);
    expect(ats[0]).toBe(0);
    expect(ats[2]).toBe(0.5);
    // El par dura medio ciclo; el contratiempo cae a dos tercios del par.
    expect(ats[1]).toBeCloseTo(0.33, 2);
    expect(ats[3]).toBeCloseTo(0.83, 2);
  });

  it('una fila callada no suena, pero el paso general sigue', () => {
    const base = drumConfig(100, { bombo: 'x.x.', caja: '.x.x' });
    const config: DrumConfig = { ...base, muted: [true, false, false, false, false, false, false, false] };
    const { hits } = cycleFor(config, 0);
    expect(hits.some((hit) => hit.voice === 'bombo')).toBe(false);
    expect(hits.filter((hit) => hit.voice === 'caja')).toHaveLength(2);
    expect(hits.filter((hit) => hit.lane === -1)).toHaveLength(4);
  });

  it('un patrón inventado tiene bombo en el uno y respeta los pasos', () => {
    let seed = 7;
    const next = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (const steps of [8, 12, 16, 32]) {
      for (let i = 0; i < 50; i++) {
        const pattern = randomDrumPattern(next, 100, steps);
        expect(pattern.steps).toBe(steps);
        expect(pattern.tracks.every((track) => track.length === steps)).toBe(true);
        expect(pattern.tracks[0]![0]).toBe(2);
      }
    }
  });

  it('los ritmos de partida son válidos y viajan por la URL', () => {
    for (const preset of DRUM_PRESETS) {
      const { config } = preset;
      expect(
        config.tracks.every((track) => track.length === config.steps),
        preset.id,
      ).toBe(true);
      expect(rhythmFromParams(rhythmToParams(config)), preset.id).toEqual(config);
    }
  });

  it('cualquier ritmo pasa a la batería: el 7/8 pone el bombo en el uno y la caja en cada grupo', () => {
    const drums = rhythmToDrums({ mode: 'meter', groups: [2, 2, 3], denom: 8, bpm: 120 });
    expect(drums.steps).toBe(14);
    const row = (lane: number) => drums.tracks[lane]!.map((on) => (on ? 'x' : '.')).join('');
    expect(row(0)).toBe('x.............');
    expect(row(1)).toBe('....x...x.....');
  });

  it('en el celular los pasos se parten en filas que respetan el compás', () => {
    expect([8, 10, 12, 14, 16, 24, 32].map(rowLength)).toEqual([8, 5, 6, 7, 8, 8, 8]);
  });
});

describe('marcar el tempo', () => {
  const every = (ms: number, count: number, from = 0) =>
    Array.from({ length: count }, (_, i) => from + i * ms);

  it('con un solo golpe todavía no hay tempo', () => {
    expect(tapTempo([])).toBeNull();
    expect(tapTempo([1000])).toBeNull();
  });

  it('saca el tempo del promedio entre golpes', () => {
    expect(tapTempo(every(500, 4))).toBe(120);
    expect(tapTempo([0, 590, 1210, 1800])).toBe(100);
  });

  it('una pausa larga empieza de nuevo', () => {
    expect(tapTempo([...every(1000, 3), ...every(500, 3, 6000)])).toBe(120);
  });

  it('sigue los últimos golpes: si se acelera, el tempo acompaña', () => {
    const slow = every(1000, 10);
    const fast = every(500, 9, slow.at(-1)! + 500);
    expect(tapTempo([...slow, ...fast])).toBe(120);
  });

  it('no se sale del rango del metrónomo', () => {
    expect(tapTempo([0, 100])).toBe(300);
    expect(tapTempo([0, 1900, 3800])).toBe(32);
  });
});
