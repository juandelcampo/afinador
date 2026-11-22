import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  layout('shell/AppShell.tsx', [
    // La entrada es la portada, con las herramientas para elegir. Las URL /afinador/... siguen igual
    // que en Scordatura, así los links compartidos desde allá abren acá.
    index('features/inicio/InicioRoute.tsx'),
    route('afinador', 'features/afinador/AfinadorRoute.tsx', { id: 'afinador-index' }),
    route('afinador/:tuningId', 'features/afinador/AfinadorRoute.tsx', { id: 'afinador-tuning' }),
    route('armonia', 'features/armonia/ArmoniaRoute.tsx'),
    route('inversiones', 'features/inversiones/InversionesRoute.tsx'),
    route('acorde', 'features/acorde/AcordeRoute.tsx'),
    route('ritmo', 'features/ritmo/RitmoRoute.tsx'),
  ]),
] satisfies RouteConfig;
