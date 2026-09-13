/**
 * Photo slots for the device cards.
 *
 * hardware/shopping/parts/*.json is read at build time (import.meta.glob with
 * query '?raw', eager) so nothing is fetched at runtime and a missing or
 * malformed file cannot break the page. Each file names the devices it belongs
 * to in its `role` field, so adding a scouted part line gives its device a photo
 * without editing this module.
 *
 * The image shown is the first gallery image of the candidate the scout chose.
 */

const RAW = import.meta.glob('../../../hardware/shopping/parts/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * Parse every part file once. A file that does not parse is skipped rather than
 * thrown, because a broken scout output must not take the landing page down.
 */
function loadParts() {
  const parts = [];
  for (const [path, source] of Object.entries(RAW)) {
    let part;
    try {
      part = JSON.parse(source);
    } catch {
      continue;
    }
    if (!part || typeof part.role !== 'string' || !Array.isArray(part.candidates)) {
      continue;
    }
    const chosen =
      part.candidates.find((candidate) => candidate.url === part.chosen) ??
      part.candidates.find((candidate) => candidate.verdict === 'chosen') ??
      part.candidates[0];
    const image = chosen && Array.isArray(chosen.images) ? chosen.images[0] : null;
    parts.push({
      id: part.id ?? path,
      line: part.line ?? part.id ?? path,
      roles: part.role.split(',').map((entry) => entry.trim()),
      image: image ?? null,
      title: chosen && chosen.title ? chosen.title : part.line,
    });
  }
  return parts;
}

const PARTS = loadParts();

/**
 * True when a role entry names this device. Plain substring matching would make
 * "xKoin-Node" swallow "xKoin-Node-Satellite", so the character after the device
 * name must be a space or the end of the entry.
 */
function entryNames(entry, device) {
  if (!entry.startsWith(device)) {
    return false;
  }
  const next = entry.charAt(device.length);
  return next === '' || next === ' ';
}

/**
 * The photo slot for one device: the first gallery image of the chosen listing
 * of the first scouted part that names the device, or null when no part line has
 * been scouted for it yet.
 */
export function photoForDevice(device) {
  for (const part of PARTS) {
    if (part.roles.some((entry) => entryNames(entry, device))) {
      if (part.image) {
        return { src: part.image, line: part.line, title: part.title };
      }
    }
  }
  return null;
}
