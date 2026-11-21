import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/** Las herramientas, una carpeta cada una en src/features. */
const FEATURES = ['inicio', 'afinador', 'armonia', 'inversiones'];

const restrict = (files, patterns, message) => ({
  files,
  rules: {
    '@typescript-eslint/no-restricted-imports': ['error', { patterns: [{ group: patterns, message }] }],
  },
});

// Las reglas de arquitectura del README (y de CLAUDE.md), hechas cumplir por el linter.
export default tseslint.config(
  { ignores: ['build', '.react-router', 'playwright-report', 'test-results', 'node_modules'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  { rules: { '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }] } },
  restrict(
    ['src/core/**', 'src/data/**'],
    [
      'react',
      'react-dom',
      'react-router',
      'zustand*',
      '~/audio/*',
      '~/features/*',
      '~/shared/*',
      '~/shell/*',
    ],
    'core y data son TypeScript puro: sin React, audio ni interfaz.',
  ),
  restrict(
    ['src/audio/**'],
    ['react', 'react-dom', 'react-router', 'zustand', '~/features/*', '~/shared/*', '~/shell/*'],
    'El audio no depende de React: la interfaz lo observa, no al revés.',
  ),
  restrict(['src/shared/**'], ['~/features/*', '~/shell/*'], 'shared no conoce las herramientas.'),
  restrict(['src/shell/**'], ['~/features/*'], 'El marco de la app no importa herramientas.'),
  // Cada herramienta se usa sola: se conectan por la URL, nunca importándose entre sí.
  ...FEATURES.map((feature) =>
    restrict(
      [`src/features/${feature}/**`],
      FEATURES.filter((other) => other !== feature).map((other) => `~/features/${other}/*`),
      'Las herramientas no se importan entre sí: se conectan por la URL.',
    ),
  ),
);
