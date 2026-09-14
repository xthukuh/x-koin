import { useState } from 'react';

import DeviceSheet from '../blueprints/DeviceSheet.jsx';
import EcosystemCard from '../blueprints/EcosystemCard.jsx';
import { DEVICES, GROUPS, deviceByKey } from '../blueprints/devices.js';
import '../blueprints/blueprints.css';

/**
 * The schematics showcase: one blueprint sheet per xKoin device, and the
 * pre-existing LoRa hardware they interoperate with. Every module, pin and
 * figure on this page is read from web/src/blueprints/devices.js, which cites
 * the repository file each row came from; a pin marked proposed in
 * hardware/pinmap.md says so on the drawing as well as in the table.
 */
export default function Blueprints() {
  const [selected, setSelected] = useState('node');
  const device = deviceByKey(selected);

  return (
    <div className="xk-bp">
      <header className="xk-bp-header xk-hero-grid">
        <div className="xk-wrap">
          <p className="xk-eyebrow">Blueprints</p>
          <h1>Every device, drawn on one grid.</h1>
          <p className="xk-lede">
            Four xKoin devices and the LoRa hardware already in the field, each on a 24 px sheet with its
            module outlines, its buses and its pin map. The drawing and the table read the same file, so
            they cannot disagree, and a pin that is still an allocation rather than a decision carries the
            word proposed in both.
          </p>

          <div className="xk-bp-tabs" role="tablist" aria-label="Device">
            {GROUPS.map((group) => (
              <div className="xk-bp-tabgroup" key={group.key}>
                <span className="xk-bp-tabgroup-label">{group.title}</span>
                <div className="xk-bp-tabrow">
                  {DEVICES.filter((entry) => entry.group === group.key).map((entry) => (
                    <button
                      type="button"
                      role="tab"
                      key={entry.key}
                      id={`xk-bp-tab-${entry.key}`}
                      aria-selected={entry.key === selected}
                      aria-controls="xk-bp-panel"
                      className={entry.key === selected ? 'xk-bp-tab is-on' : 'xk-bp-tab'}
                      onClick={() => setSelected(entry.key)}
                    >
                      {entry.short}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="xk-wrap xk-wrap--wide" id="xk-bp-panel" role="tabpanel" aria-labelledby={`xk-bp-tab-${device.key}`}>
        {device.group === 'ecosystem' ? <EcosystemCard device={device} /> : null}
        {device.kind === 'sheet' ? <DeviceSheet device={device} /> : null}
      </div>
    </div>
  );
}
