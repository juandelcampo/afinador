// Patrones de partida para la caja de ritmos. Cada x es un golpe, cada X un golpe con acento y cada
// punto, un silencio.
import { drumConfig, type DrumConfig } from '~/core/rhythm';

export interface DrumPreset {
  id: string;
  name: string;
  config: DrumConfig;
}

const swung = (config: DrumConfig, swing: number): DrumConfig => ({ ...config, swing });

export const DRUM_PRESETS: DrumPreset[] = [
  {
    id: 'rock',
    name: 'Rock',
    config: drumConfig(112, {
      bombo: 'X.......X.x.....',
      caja: '....X.......X...',
      hihat: 'X.x.X.x.X.x.X.x.',
    }),
  },
  {
    // La caja suave del aro y el bombo que deja aire: para acompañar una canción lenta.
    id: 'balada',
    name: 'Balada',
    config: drumConfig(72, {
      bombo: 'X.......x.x.....',
      aro: '....X.......X...',
      hihat: 'X.x.x.x.X.x.x.x.',
    }),
  },
  {
    id: 'pista',
    name: 'Cuatro al piso',
    config: drumConfig(122, {
      bombo: 'X...X...X...X...',
      palma: '....X.......X...',
      abierto: '..x...x...x...x.',
    }),
  },
  {
    id: 'funk',
    name: 'Funk',
    config: drumConfig(98, {
      bombo: 'X..x..x...x.....',
      caja: '....X..x.x..X...',
      hihat: 'XxxxXxxxXxxxXx.x',
      abierto: '..............x.',
    }),
  },
  {
    id: 'hiphop',
    name: 'Hip hop',
    config: swung(
      drumConfig(88, {
        bombo: 'X.......x.x.....',
        caja: '....X.......X...',
        hihat: 'x.x.x.x.x.x.x.x.',
      }),
      60,
    ),
  },
  {
    id: 'shuffle',
    name: 'Shuffle',
    config: swung(
      drumConfig(96, {
        bombo: 'X.......x.......',
        caja: '....X.......X...',
        hihat: 'X.xxX.xxX.xxX.xx',
      }),
      66,
    ),
  },
  {
    // One drop: el bombo y el aro caen juntos en el tres, y el uno queda vacío.
    id: 'reggae',
    name: 'Reggae',
    config: drumConfig(76, {
      bombo: '........X.......',
      aro: '........X.......',
      hihat: 'x.x.x.x.x.x.x.x.',
    }),
  },
  {
    id: 'dembow',
    name: 'Dembow',
    config: drumConfig(94, {
      bombo: 'X...x...X...x...',
      caja: '...X..x....X..x.',
      hihat: 'x.x.x.x.x.x.x.x.',
    }),
  },
  {
    id: 'cumbia',
    name: 'Cumbia',
    config: drumConfig(96, {
      bombo: 'X.......x.......',
      percu: 'x.xXx.xXx.xXx.xX',
      tom: '..x...x...x...x.',
    }),
  },
  {
    id: 'tresillo',
    name: 'Tresillo',
    config: drumConfig(104, {
      bombo: 'X..x..x.x..x..x.',
      percu: 'X.x.x.xx.x.x.xx.',
      caja: '....x.......x...',
    }),
  },
  {
    // Cada paso es una corchea y el pulso es el del pulgar (dos por compás): a 66 suena como la bossa
    // de los discos. A 132 con semicorcheas iba al doble y no había cómo tocar encima.
    id: 'bossa',
    name: 'Bossa',
    config: drumConfig(66, {
      bombo: 'X..xX..xX..xX..x',
      aro: 'x..x..x...x..x..',
      hihat: 'XxxxXxxxXxxxXxxx',
    }),
  },
  {
    id: 'lento',
    name: 'Vals',
    config: drumConfig(84, { bombo: 'X...........', caja: '....x...x...', hihat: 'X.x.x.x.x.x.' }),
  },
  {
    id: 'siete',
    name: '7/8',
    config: drumConfig(150, { bombo: 'X...x...x.....', caja: '....X.......x.', hihat: 'X.x.x.x.x.x.x.' }),
  },
  {
    id: 'cinco',
    name: '5/8',
    config: drumConfig(160, { bombo: 'X.....x...', caja: '......X...', hihat: 'X.x.x.x.x.' }),
  },
];
