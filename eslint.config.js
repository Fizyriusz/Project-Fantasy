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
    // Hard rule from docs/02-architektura.md: the simulation must be runnable in
    // Node without a browser, so it can never reach for the renderer.
    files: ['packages/sim/**/*.ts'],
    rules: {
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
    },
  },
);
