import { createReadStream, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** The web app manifest and its icons, at the paths the page and the manifest reference. */
const INSTALL_FILE = /^\/(manifest\.webmanifest|icons\/[\w-]+\.png)$/;

/**
 * Serves the manifest and the install icons in development, and only there.
 *
 * They are plain files of the repository root, which Pages publishes as they sit there (see
 * below), but the dev server is rooted at `app/`: it would answer the manifest request with
 * its HTML fallback, and Chrome reports that as a manifest syntax error on every load.
 */
const installFiles: Plugin = {
  name: 'install-files',
  apply: 'serve',
  configureServer(server) {
    const published = resolve(server.config.root, server.config.build.outDir);
    server.middlewares.use((request, response, next) => {
      const path = INSTALL_FILE.exec(request.url?.split('?')[0] ?? '')?.[1];
      const file = path === undefined ? undefined : resolve(published, path);
      if (file === undefined || !existsSync(file)) {
        next();
        return;
      }
      const type = file.endsWith('.png') ? 'image/png' : 'application/manifest+json';
      response.setHeader('Content-Type', type);
      createReadStream(file).pipe(response);
    });
  },
};

/**
 * GitHub Pages serves this repository's root directly (`main` branch, `/`), and
 * the `CNAME` file there binds it to pong.naindev.com. So the build must land in
 * the repository root: `index.html` + `assets/` next to `CNAME`.
 *
 * `base: './'` keeps every asset reference relative, so the same build also works
 * if the game is ever moved under a sub-path such as /demos/pong-arcade/.
 */
export default defineConfig({
  root: 'app',
  base: './',
  publicDir: false,
  plugins: [installFiles],
  build: {
    // Resolved from `root`, so this is the repository root.
    outDir: '..',
    // The repository root holds CNAME, README, sources — never wipe it.
    emptyOutDir: false,
    assetsDir: 'assets',
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
  server: {
    port: 5320,
    strictPort: true,
    host: '127.0.0.1',
    allowedHosts: ['pong.localhost'],
    open: false,
  },
  preview: {
    port: 5321,
    strictPort: true,
    host: '127.0.0.1',
    allowedHosts: ['pong.localhost'],
  },
});
