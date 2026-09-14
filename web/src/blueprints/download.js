/**
 * Serialise a rendered sheet to a standalone SVG file.
 *
 * The drawing paints itself from theme tokens, so a bare serialisation would
 * open blank outside the app. The clone therefore carries the computed value of
 * every token it uses, pinned on the root element, and the file renders in any
 * viewer in whichever theme the reader had on screen.
 */

const TOKENS = [
  '--xk-ground',
  '--xk-surface',
  '--xk-surface-2',
  '--xk-ink',
  '--xk-muted',
  '--xk-faint',
  '--xk-line',
  '--xk-line-soft',
  '--xk-accent',
  '--xk-accent-soft',
  '--xk-money',
  '--xk-good',
  '--xk-warn',
  '--xk-critical',
  '--xk-grid',
  '--xk-plc',
  '--xk-nbplc',
  '--xk-lora',
  '--xk-font-mono',
];

export function svgFileName(device) {
  return `xkoin-${device.key}-blueprint.svg`;
}

export function downloadSheet(node, filename) {
  if (!node || typeof window === 'undefined') {
    return false;
  }

  const clone = node.cloneNode(true);
  const computed = window.getComputedStyle(node);
  TOKENS.forEach((token) => {
    const value = computed.getPropertyValue(token).trim();
    if (value) {
      clone.style.setProperty(token, value);
    }
  });
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', node.viewBox.baseVal.width || 1152);
  clone.setAttribute('height', node.viewBox.baseVal.height || 720);

  const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}
