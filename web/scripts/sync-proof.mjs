/**
 * Copy the proof-run JSON from protocol/out/ into web/src/proof/, where the
 * site imports it at build time.
 *
 *   npm run proof:sync            # from web/, after a protocol run
 *
 * protocol/out/ is a run artefact that git does not track; web/src/proof/ is
 * the tracked snapshot, so the built site never depends on whether the
 * simulator has been run on the build host. Missing files are reported and
 * the existing snapshot is left alone.
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(WEB, '..', 'protocol', 'out');
const DEST = path.join(WEB, 'src', 'proof');
const FILES = ['chain.json', 'kiosk.json', 'trace.json'];

mkdirSync(DEST, { recursive: true });
let copied = 0;
for (const file of FILES) {
  const from = path.join(SRC, file);
  if (!existsSync(from)) {
    console.warn(`sync-proof: ${path.relative(process.cwd(), from)} missing, snapshot kept`);
    continue;
  }
  copyFileSync(from, path.join(DEST, file));
  copied += 1;
  console.log(`sync-proof: ${file} ${statSync(from).size} bytes`);
}
console.log(`sync-proof: ${copied}/${FILES.length} files copied to web/src/proof/`);
