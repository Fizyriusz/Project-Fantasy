import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended],
  },
  {
    // Hard rules from CLAUDE.md, scoped to the simulation only.
    files: ['packages/sim/**/*.ts'],
    rules: {
      // The simulation must be runnable in Node without a browser, so it can
      // never reach for the renderer (docs/02-architektura.md).
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['three', 'three/*'],
              message:
                'packages/sim must not import three. Rendering belongs in packages/client.',
            },
          ],
        },
      ],

      // Randomness must come from one seeded generator passed in explicitly,
      // otherwise bugs stop being reproducible and multiplayer desyncs.
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message:
            'packages/sim must use the seeded RNG passed in explicitly, never Math.random().',
        },
      ],
    },
  },
);
