import type { Config } from '@react-router/dev/config';
import { TUNINGS } from './src/data/tunings';

// Sin servidor: cada afinación se genera como HTML estático para que los buscadores la lean, y después
// la app sigue funcionando como una sola página.
export default {
  appDirectory: 'src',
  ssr: false,
  prerender: ['/', '/afinador', ...TUNINGS.map((tuning) => `/afinador/${tuning.id}`)],
} satisfies Config;
