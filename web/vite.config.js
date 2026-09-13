import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const WEB = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(WEB, '..');
const DOCS = path.join(ROOT, 'docs');
const HARDWARE = path.join(ROOT, 'hardware');

/** Folders under docs/ that the markdown viewer reads. */
const DOC_FOLDERS = ['papers', 'potential', 'x-koin-beta'];

/**
 * Relative image links inside a markdown file (for example `assets/foo.svg`)
 * must resolve in dev and in the build, so every docs/<folder>/assets tree is
 * copied to /docs/<folder>/assets/ and served from there.
 *
 * vite-plugin-static-copy appends each matched file's path relative to the Vite
 * root (with any leading `../` stripped) to `dest`. The Vite root is web/ and
 * docs/ is its sibling, so a source file docs/papers/assets/foo.svg already
 * carries the wanted destination path and `dest` is the output root itself.
 *
 * Folders with no assets directory are skipped, otherwise the plugin has
 * nothing to glob and throws.
 */
const assetTargets = DOC_FOLDERS.map((folder) => path.join(DOCS, folder, 'assets'))
  .filter((dir) => existsSync(dir))
  .map((dir) => ({ src: normalizePath(dir), dest: '.' }));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(assetTargets.length > 0 ? [viteStaticCopy({ targets: assetTargets })] : []),
  ],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      // The markdown glob reads ../docs and the landing page's part photos read
      // ../hardware, both outside the Vite root.
      allow: [WEB, DOCS, HARDWARE],
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
