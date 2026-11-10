import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  layout('shell/AppShell.tsx', [
    // La entrada es el afinador con la afinación por defecto. Las URL /afinador/... siguen igual que en
    // Scordatura, así los links compartidos desde allá abren acá.
    index('features/afinador/AfinadorRoute.tsx', { id: 'afinador-inicio' }),
    route('afinador', 'features/afinador/AfinadorRoute.tsx', { id: 'afinador-index' }),
    route('afinador/:tuningId', 'features/afinador/AfinadorRoute.tsx', { id: 'afinador-tuning' }),
  ]),
] satisfies RouteConfig;
