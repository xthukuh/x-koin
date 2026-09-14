/**
 * Write public/sitemap.xml and public/robots.txt from the route list in
 * src/shell/nav.js, so the machine sitemap and the /map page cannot disagree.
 *
 *   node scripts/build-sitemap.mjs            # runs as the prebuild step
 *
 * The site origin comes from XKOIN_SITE_ORIGIN (default https://xkoin.thuku.dev).
 * While the site sits behind the pass-wall, robots.txt disallows everything;
 * the sitemap is still written because /map links to it and the standard
 * format is what a later public launch will publish unchanged.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NAV } from '../src/shell/nav.js';

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(WEB, 'public');
const ORIGIN = (process.env.XKOIN_SITE_ORIGIN ?? 'https://xkoin.thuku.dev').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);

const urls = NAV.map(
  (route) => `  <url>
    <loc>${ORIGIN}${route.path === '/' ? '/' : route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`,
).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const robots = `# Private demo behind a pass-wall. Nothing here is for indexing.
User-agent: *
Disallow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;

mkdirSync(PUBLIC, { recursive: true });
writeFileSync(path.join(PUBLIC, 'sitemap.xml'), xml);
writeFileSync(path.join(PUBLIC, 'robots.txt'), robots);
console.log(`build-sitemap: ${NAV.length} urls for ${ORIGIN} -> public/sitemap.xml, public/robots.txt`);
