import type { ReactNode } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from 'react-router';
// Las tipografías van dentro de la app: no dependen de Google ni de lo que tenga instalado el sistema.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-700.css';
import archivo from '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2?url';
import plex from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2?url';
import plexBold from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-700-normal.woff2?url';
import './styles/global.css';

const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23000'/%3E%3Cpath d='M0 8h32M0 16h32M0 24h32' stroke='%23fff' stroke-width='3'/%3E%3Crect x='17' y='11' width='10' height='10' fill='%23ff6626'/%3E%3C/svg%3E";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href={ICON} />
        {/* Se piden antes que el CSS: así el texto no aparece primero con la letra del sistema. */}
        {[archivo, plex, plexBold].map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="" />
        ))}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function HydrateFallback() {
  return <p style={{ padding: 16 }}>Cargando…</p>;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main style={{ padding: 16 }}>
      <h1>{notFound ? 'Esa página no existe' : 'Algo se rompió'}</h1>
      <p>
        <a href="/">Volver al afinador</a>
      </p>
    </main>
  );
}
