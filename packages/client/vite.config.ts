import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { defineConfig, type Plugin } from 'vite';

/**
 * Where the tuning panel parks whatever the player last dragged a slider to.
 * The repository root, so it is trivial to find and read while discussing a
 * change. Git-ignored: these are somebody's experiments, not the project's
 * settings.
 */
const TUNING_FILE = fileURLToPath(new URL('../../tuning.local.json', import.meta.url));

async function readRequestBody(request: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Gives the tuning panel somewhere to persist to.
 *
 * The point is not persistence for its own sake — it is that the values end up
 * in a file on disk, so a conversation about "I raised the speed" can be
 * settled by reading the number instead of remembering it.
 *
 * Development only. The production build has never heard of it.
 */
function tuningFilePlugin(): Plugin {
  return {
    name: 'fantasy-tuning-file',
    apply: 'serve',

    configureServer(server) {
      server.middlewares.use('/__tuning', (request, response) => {
        void (async () => {
          try {
            if (request.method === 'GET') {
              const contents = await readFile(TUNING_FILE, 'utf8').catch(() => '{}');
              response.setHeader('Content-Type', 'application/json');
              response.end(contents);
              return;
            }

            if (request.method === 'POST') {
              await writeFile(TUNING_FILE, await readRequestBody(request), 'utf8');
              response.statusCode = 204;
              response.end();
              return;
            }

            response.statusCode = 405;
            response.end();
          } catch (error) {
            response.statusCode = 500;
            response.end(String(error));
          }
        })();
      });
    },
  };
}

export default defineConfig({
  plugins: [tuningFilePlugin()],
  server: {
    port: 5173,
    // Fail rather than quietly move to the next free port. Drifting ports
    // leave a trail of forgotten servers and make "which one am I looking at"
    // a real question; refusing to start says plainly that one is still up.
    strictPort: true,
  },
});
