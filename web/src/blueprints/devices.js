/**
 * The blueprint data set: one entry per device, drawing and pin table in the
 * same object so the two cannot disagree. Every trace label prints the GPIO
 * numbers taken from this file's own `pins` rows, matched on `net`, and a row
 * whose provenance says proposed makes its trace carry the word on the drawing.
 *
 * Sources, per device, are listed in `sources` and are repo paths only. Nothing
 * here is invented: a part, a pin or a figure that is not in one of those files
 * does not appear on a sheet.
 *
 * Geometry is in 24 px grid units, laid out by blueprints/layout.js. A sheet is
 * 48 by 30 squares; the title block occupies the bottom right corner, so the
 * drawing area is x 2 to 46 and y 1.8 to 23.
 */

/* ------------------------------------------------------------------ core */

const node = {
  key: 'node',
  group: 'core',
  kind: 'sheet',
  name: 'xKoin-Node',
  short: 'Node',
  rev: 'A',
  date: '2026-09-14',
  tagline: 'The gateway. Backhaul in, mains and radio out, every WAN byte metered.',
  role:
    'Terminates the backhaul, classifies every packet as free LAN or paid WAN, verifies the kiosk voucher offline and assembles receipts into tickets.',
  status: 'partial',
  statusNote: 'Portable core host-proven; the ESP-IDF glue is written to this pin map and compile-untested.',
  power: 'HLK-PM01, 230 V to 5 V at 3 W. Worst simultaneous case is about 2.79 W, roughly 7 percent of headroom.',
  kitKey: 'node',
  mediums: [
    { name: 'Broadband PLC', via: 'stock HomePlug AV adapter', detail: 'bulk plane, about 10 Mbps modelled goodput', state: 'fitted' },
    { name: 'Narrowband PLC', via: 'KQ-130F', detail: '120 to 135 kHz, 9600 bd, receipts and control', state: 'fitted' },
    { name: 'LoRa', via: 'E22-900M22S (SX1262)', detail: '868.1 MHz survival plane, SPI on the doc 02 pins', state: 'fitted' },
    { name: 'Wi-Fi', via: 'ESP32-S3 radio', detail: 'captive portal, admission and the purchase flow', state: 'fitted' },
    { name: 'Ethernet', via: 'W5500', detail: 'deferred: the HomePlug adapter carries bulk, the MCU sits beside it', state: 'deferred' },
  ],
  boxes: [
    { id: 'backhaul', x: 2, y: 3, w: 10, h: 3.4, label: 'Router or hotspot', sub: 'backhaul, not part of the build' },
    { id: 'homeplug', x: 2, y: 9, w: 10, h: 3.4, label: 'HomePlug AV adapter', sub: 'stock, injector half, never opened' },
    { id: 'esp', x: 17, y: 7.5, w: 12, h: 5.6, label: 'ESP32-S3-DevKitC-1', sub: 'N16R8: admission, metering, receipts', kind: 'mcu' },
    { id: 'hlk', x: 17, y: 15.6, w: 12, h: 3.4, label: 'HLK-PM01', sub: '230 V to 5 V, 3 W ceiling' },
    { id: 'ant', x: 36, y: 1.8, w: 10, h: 2.4, label: '868 MHz whip', sub: '3 dBi SMA, IPEX pigtail' },
    { id: 'e22', x: 36, y: 5.5, w: 10, h: 3.4, label: 'E22-900M22S', sub: 'SX1262, 868.1 MHz, 22 dBm' },
    { id: 'kq', x: 36, y: 11, w: 10, h: 3.4, label: 'KQ-130F', sub: '120-135 kHz, 9600 bd, isolated' },
    { id: 'mains', x: 2, y: 20.5, w: 44, h: 2.4, label: '230 V mains segment', sub: 'type G socket, one segment', kind: 'bus' },
  ],
  nets: [
    { id: 'backhaul-esp', from: 'backhaul', to: 'esp', kind: 'wifi', label: 'Wi-Fi STA', toT: 0.27 },
    { id: 'backhaul-homeplug', from: 'backhaul', to: 'homeplug', kind: 'eth', label: 'Ethernet' },
    { id: 'homeplug-mains', from: 'homeplug', to: 'mains', kind: 'plc', label: 'HomePlug AV bulk', note: 'about 10 Mbps', fromSide: 'bottom', toSide: 'top', toT: 0.1136 },
    { id: 'esp-e22', from: 'esp', to: 'e22', kind: 'spi', label: 'SPI + control', fromT: 0.13, toT: 0.5, via: 32.5 },
    { id: 'e22-ant', from: 'e22', to: 'ant', kind: 'rf', label: 'RF 868.1 MHz' },
    { id: 'esp-kq', from: 'esp', to: 'kq', kind: 'uart', label: 'UART2 9600 bd', fromT: 0.8, toT: 0.5, via: 32.5 },
    { id: 'kq-mains', from: 'kq', to: 'mains', kind: 'nbplc', label: 'Narrowband PLC', note: 'coupled, isolated', fromSide: 'bottom', toSide: 'top', toT: 0.8864 },
    { id: 'hlk-esp', from: 'hlk', to: 'esp', kind: 'power', label: '5 V rail' },
    { id: 'mains-hlk', from: 'mains', to: 'hlk', kind: 'mains', label: '230 V', fromSide: 'top', fromT: 0.4773, toSide: 'bottom' },
  ],
  boundaries: [
    {
      axis: 'y',
      at: 20.15,
      from: 2,
      to: 46,
      label: 'Isolation boundary: mains side below',
      labelAt: { x: 30, y: 19.8 },
    },
  ],
  boot: ['mains', 'hlk', 'esp', 'e22', 'ant', 'kq', 'homeplug', 'backhaul'],
  flow: { label: 'RECEIPT 108 B', path: ['esp-kq', 'kq-mains'] },
  animCaption:
    'Power comes up first, then the MCU, then the radios. The traces draw in order and a 108-byte receipt leaves the ESP32-S3 on UART2 and couples onto the mains through the KQ-130F.',
  pins: [
    { pin: 'GPIO12', part: 'E22-900M22S (SX1262)', signal: 'SCK', bus: 'SPI', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO13', part: 'E22-900M22S (SX1262)', signal: 'MISO', bus: 'SPI', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO11', part: 'E22-900M22S (SX1262)', signal: 'MOSI', bus: 'SPI', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO10', part: 'E22-900M22S (SX1262)', signal: 'NSS / CS', bus: 'SPI', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO14', part: 'E22-900M22S (SX1262)', signal: 'DIO1 (IRQ)', bus: 'CTRL', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO21', part: 'E22-900M22S (SX1262)', signal: 'BUSY', bus: 'CTRL', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO9', part: 'E22-900M22S (SX1262)', signal: 'RESET', bus: 'CTRL', provenance: 'proposed, set in src/main.c', net: 'esp-e22' },
    { pin: '3V3', part: 'E22-900M22S (SX1262)', signal: 'VCC', bus: 'PWR', provenance: 'doc02' },
    { pin: 'GND', part: 'E22-900M22S (SX1262)', signal: 'GND', bus: 'GND', provenance: 'doc02' },
    { pin: 'GPIO17', part: 'KQ-130F', signal: 'RX (ESP TX2)', bus: 'UART', provenance: 'doc02', net: 'esp-kq' },
    { pin: 'GPIO18', part: 'KQ-130F', signal: 'TX (ESP RX2)', bus: 'UART', provenance: 'doc02', net: 'esp-kq' },
    { pin: '5V', part: 'KQ-130F', signal: 'VCC, isolated side', bus: 'PWR', provenance: 'doc02' },
    { pin: 'GND', part: 'KQ-130F', signal: 'GND, isolated side', bus: 'GND', provenance: 'doc02' },
    { pin: 'GPIO39', part: 'W5500 Ethernet', signal: 'SCK', bus: 'SPI', provenance: 'signed off 2026-09-15 (moved 2026-09-13)', group: 'deferred' },
    { pin: 'GPIO41', part: 'W5500 Ethernet', signal: 'MISO', bus: 'SPI', provenance: 'signed off 2026-09-15 (moved 2026-09-13)', group: 'deferred' },
    { pin: 'GPIO40', part: 'W5500 Ethernet', signal: 'MOSI', bus: 'SPI', provenance: 'signed off 2026-09-15 (moved 2026-09-13)', group: 'deferred' },
    { pin: 'GPIO42', part: 'W5500 Ethernet', signal: 'CS', bus: 'SPI', provenance: 'signed off 2026-09-15 (moved 2026-09-13)', group: 'deferred' },
    { pin: 'GPIO2', part: 'W5500 Ethernet', signal: 'INT', bus: 'CTRL', provenance: 'signed off 2026-09-15 (moved 2026-09-13)', group: 'deferred' },
    { pin: 'GPIO15', part: 'W5500 Ethernet', signal: 'RST', bus: 'CTRL', provenance: 'signed off 2026-09-15 (moved 2026-09-13)', group: 'deferred' },
    { pin: 'GPIO4', part: 'SIM7600E LTE', signal: 'RXD (ESP TX1)', bus: 'UART', provenance: 'proposed', group: 'deferred' },
    { pin: 'GPIO5', part: 'SIM7600E LTE', signal: 'TXD (ESP RX1)', bus: 'UART', provenance: 'proposed', group: 'deferred' },
    { pin: 'GPIO6', part: 'SIM7600E LTE', signal: 'PWRKEY', bus: 'CTRL', provenance: 'proposed', group: 'deferred' },
  ],
  notes: [
    'The MCU sits beside the bulk path, never inside it. Putting the ESP32-S3 in the HomePlug data path over a W5500 would cap the bulk plane at SPI speeds.',
    'The W5500 rows follow hardware/pinmap.md, where they were moved on 2026-09-13 because GPIO33 to GPIO37 are the octal PSRAM bus on every R8 module and GPIO38 drives the DevKitC RGB LED; Martin signed the move off on 2026-09-15.',
    'SAFETY: the KQ-130F couples to 230 V. Keep the coupling network isolated from the logic side and never bench-test the mains side without an RCD.',
  ],
  sources: [
    'hardware/pinmap.md, xKoin-Gateway table',
    'docs/papers/05-hardware-node.md, sections 2 to 7',
    'hardware/velxio/README.md, SX1262 and KQ-130F pin tables',
    'hardware/shopping/mvp-kit.json, device node',
  ],
};

const nodeSatellite = {
  key: 'node-satellite',
  group: 'core',
  kind: 'sheet',
  name: 'xKoin-Node-Satellite',
  short: 'Node-Satellite',
  rev: 'A',
  date: '2026-09-14',
  tagline: 'The mains relay. Pulls the carrier off the wall, regenerates Wi-Fi, admits at the socket.',
  role:
    'Plugs into a socket on the same mains segment, regenerates the bulk plane as 2.4 GHz Wi-Fi, and enforces admission at the socket so the serving device collects its own receipts.',
  status: 'proposed',
  statusNote: 'Designed and specified; no unit built. Its firmware is the gateway firmware with the backhaul path unused.',
  power: '5 V USB charger at 1 A, or the extender own USB port. The whole unit fits a 5 W charger with about 44 percent of headroom.',
  kitKey: 'node-satellite',
  mediums: [
    { name: 'Broadband PLC', via: 'stock HomePlug AV Wi-Fi extender', detail: 'sealed appliance, carries the bulk plane and its own 2.4 GHz AP', state: 'fitted' },
    { name: 'Narrowband PLC', via: 'KQ-130F', detail: '120 to 135 kHz, 9600 bd, the path receipts take when the broadband carrier is down', state: 'fitted' },
    { name: 'Wi-Fi', via: 'ESP32-S3 radio', detail: 'the captive portal AP, separate from the extender AP by design', state: 'fitted' },
    { name: 'LoRa', via: 'E22-900M22S (SX1262)', detail: 'fitted only on the segment B unit for demo D3', state: 'optional' },
  ],
  boxes: [
    { id: 'phone', x: 17, y: 2.5, w: 12, h: 3, label: 'Client phone', sub: 'companion app, captive portal' },
    { id: 'extender', x: 2, y: 8, w: 10, h: 5, label: 'HomePlug AV extender', sub: 'TL-WPA4220 class, sealed, stock' },
    { id: 'esp', x: 17, y: 8.5, w: 12, h: 5.6, label: 'ESP32-S3-DevKitC-1', sub: 'N16R8: admission, metering, receipts', kind: 'mcu' },
    { id: 'charger', x: 17, y: 16.2, w: 12, h: 3, label: '5 V USB charger', sub: '1 A, or the extender USB port' },
    { id: 'ant', x: 36, y: 1.8, w: 10, h: 2.4, label: '868 MHz whip', sub: 'with the E22 only', optional: true },
    { id: 'e22', x: 36, y: 5.5, w: 10, h: 3.4, label: 'E22-900M22S', sub: 'SX1262, demo D3 unit only', optional: true },
    { id: 'kq', x: 36, y: 11, w: 10, h: 3.4, label: 'KQ-130F', sub: '120-135 kHz, 9600 bd, isolated' },
    { id: 'mains', x: 2, y: 20.5, w: 44, h: 2.4, label: '230 V mains segment', sub: 'the segment the Node injects into', kind: 'bus' },
  ],
  nets: [
    { id: 'mains-extender', from: 'mains', to: 'extender', kind: 'plc', label: 'HomePlug AV carrier', note: 'off the wiring', fromSide: 'top', fromT: 0.1136, toSide: 'bottom', toT: 0.5 },
    { id: 'extender-phone', from: 'extender', to: 'phone', kind: 'wifi', label: 'Wi-Fi 2.4 GHz', note: 'bulk plane', fromT: 0.3, toT: 0.5 },
    { id: 'esp-phone', from: 'esp', to: 'phone', kind: 'wifi', label: 'Captive portal AP' },
    { id: 'esp-e22', from: 'esp', to: 'e22', kind: 'spi', label: 'SPI + control', fromT: 0.13, toT: 0.5, via: 32.5, optional: true },
    { id: 'e22-ant', from: 'e22', to: 'ant', kind: 'rf', label: 'RF 868.1 MHz', optional: true },
    { id: 'esp-kq', from: 'esp', to: 'kq', kind: 'uart', label: 'UART2 9600 bd', fromT: 0.82, toT: 0.5, via: 32.5 },
    { id: 'kq-mains', from: 'kq', to: 'mains', kind: 'nbplc', label: 'Narrowband PLC', note: 'coupled, isolated', fromSide: 'bottom', toSide: 'top', toT: 0.8864 },
    { id: 'charger-esp', from: 'charger', to: 'esp', kind: 'power', label: '5 V USB' },
    { id: 'mains-charger', from: 'mains', to: 'charger', kind: 'mains', label: '230 V', fromSide: 'top', fromT: 0.4773, toSide: 'bottom' },
  ],
  boundaries: [
    {
      axis: 'y',
      at: 20.15,
      from: 2,
      to: 46,
      label: 'Isolation boundary: mains side below',
      labelAt: { x: 30, y: 19.8 },
    },
  ],
  boot: ['mains', 'charger', 'esp', 'kq', 'e22', 'ant', 'extender', 'phone'],
  flow: { label: 'VOUCHER', path: ['~esp-phone', 'esp-kq', 'kq-mains'] },
  animCaption:
    'The charger comes up, then the MCU, then the control plane, then the sealed extender and the phone it serves. A voucher arrives at the captive portal AP and its receipt leaves on the narrowband carrier.',
  pins: [
    { pin: 'GPIO17', part: 'KQ-130F', signal: 'RX (ESP TX2)', bus: 'UART', provenance: 'doc02', net: 'esp-kq' },
    { pin: 'GPIO18', part: 'KQ-130F', signal: 'TX (ESP RX2)', bus: 'UART', provenance: 'doc02', net: 'esp-kq' },
    { pin: '5V', part: 'KQ-130F', signal: 'VCC, isolated side', bus: 'PWR', provenance: 'doc02' },
    { pin: 'GND', part: 'KQ-130F', signal: 'GND, isolated side', bus: 'GND', provenance: 'doc02' },
    { pin: 'GPIO12', part: 'E22-900M22S, optional', signal: 'SCK', bus: 'SPI', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO13', part: 'E22-900M22S, optional', signal: 'MISO', bus: 'SPI', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO11', part: 'E22-900M22S, optional', signal: 'MOSI', bus: 'SPI', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO10', part: 'E22-900M22S, optional', signal: 'NSS / CS', bus: 'SPI', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO14', part: 'E22-900M22S, optional', signal: 'DIO1 (IRQ)', bus: 'CTRL', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO21', part: 'E22-900M22S, optional', signal: 'BUSY', bus: 'CTRL', provenance: 'doc02', net: 'esp-e22' },
    { pin: 'GPIO9', part: 'E22-900M22S, optional', signal: 'RESET', bus: 'CTRL', provenance: 'proposed, set in src/main.c', net: 'esp-e22' },
    { pin: '3V3', part: 'E22-900M22S, optional', signal: 'VCC', bus: 'PWR', provenance: 'doc02' },
    { pin: 'GND', part: 'E22-900M22S, optional', signal: 'GND', bus: 'GND', provenance: 'doc02' },
  ],
  notes: [
    'Two access points in one box is deliberate. The extender AP carries bytes at the rate the power-line modem sustains; the ESP32-S3 AP carries the portal, the purchase and the receipt exchange.',
    'There is no W5500 row and no SIM7600E row: this device has no backhaul by definition and is never in the bulk data path.',
    'When the E22 is omitted the eight SPI and power lines are simply not populated. The firmware scores the missing medium zero and the sender picks the next best.',
  ],
  sources: [
    'docs/papers/06-hardware-node-satellite.md, sections 1 to 7',
    'hardware/pinmap.md, xKoin-Gateway table (reused unchanged)',
    'hardware/shopping/mvp-kit.json, device node-satellite',
  ],
};

const satellite = {
  key: 'satellite',
  group: 'core',
  kind: 'sheet',
  name: 'xKoin-Satellite',
  short: 'Satellite',
  rev: 'A',
  date: '2026-09-14',
  tagline: 'The off-grid remote. Solar, deep sleep, and the radio plane where the wiring ends.',
  role:
    'Sits where there is no socket: beacons, admits clients against a kiosk-signed voucher verified offline, serves class C traffic and relays receipts to the nearest Node.',
  status: 'partial',
  statusNote: 'Board, pin map and power budget settled; the satellite firmware is backlog and no unit has been soaked.',
  power: 'Solar panel into a TP4056 into an 18650 cell. About 0.54 mA idle on a five-minute beacon schedule against a 40 mA design ceiling.',
  kitKey: 'satellite',
  mediums: [
    { name: 'LoRa', via: 'SX1262 on the Heltec V3', detail: '868.1 MHz, class C only, about 5.4 kbps at SF7 under a duty-cycle ceiling', state: 'fitted' },
    { name: 'Wi-Fi', via: 'ESP32-S3FN8 radio', detail: 'present on the board, off in the power budget', state: 'optional' },
    { name: 'Broadband PLC', via: 'none', detail: 'no mains connection, so no power-line carrier of any kind', state: 'absent' },
  ],
  boxes: [
    { id: 'panel', x: 2, y: 3, w: 10, h: 3.4, label: 'Solar panel', sub: '6 V 2 W bench, 10 W field, never 12 V' },
    { id: 'tp4056', x: 2, y: 9, w: 10, h: 3.4, label: 'TP4056 with protection', sub: 'panel-fed configuration only', optional: true },
    { id: 'cell', x: 2, y: 15.5, w: 10, h: 3.4, label: '18650 cell', sub: '3400 mAh, bought in Nairobi' },
    { id: 'heltec', x: 17, y: 7, w: 12, h: 7, label: 'Heltec WiFi LoRa 32 V3', sub: 'ESP32-S3FN8, deep sleep between beacon windows', kind: 'mcu' },
    { id: 'ant', x: 36, y: 1.8, w: 10, h: 2.4, label: '868 MHz whip', sub: '3 dBi, SMA jack on the board' },
    { id: 'sx', x: 36, y: 5.5, w: 10, h: 3.4, label: 'SX1262', sub: 'on board, DIO2 RF switch, DIO3 TCXO 1.8 V' },
    { id: 'oled', x: 36, y: 11, w: 10, h: 3.4, label: 'SSD1306 OLED', sub: '0.96 in, state on camera' },
    { id: 'vbat', x: 36, y: 16, w: 10, h: 3, label: 'VBAT divider', sub: 'on board, enable active low' },
  ],
  nets: [
    { id: 'panel-tp4056', from: 'panel', to: 'tp4056', kind: 'power', label: '6 V in' },
    { id: 'tp4056-cell', from: 'tp4056', to: 'cell', kind: 'power', label: 'BAT, charge and protect' },
    { id: 'tp4056-heltec', from: 'tp4056', to: 'heltec', kind: 'power', label: 'OUT+ to 5 V pin', fromT: 0.5, toT: 0.529 },
    { id: 'cell-heltec', from: 'cell', to: 'heltec', kind: 'power', label: 'JST 1.25, no TP4056', toSide: 'bottom', toT: 0.25, optional: true },
    { id: 'heltec-sx', from: 'heltec', to: 'sx', kind: 'spi', label: 'SPI + control', fromT: 0.14, toT: 0.5, via: 32.5 },
    { id: 'sx-ant', from: 'sx', to: 'ant', kind: 'rf', label: 'RF 868.1 MHz' },
    { id: 'heltec-oled', from: 'heltec', to: 'oled', kind: 'i2c', label: 'I2C', fromT: 0.71, toT: 0.5, via: 32.5 },
    { id: 'heltec-vbat', from: 'heltec', to: 'vbat', kind: 'analog', label: 'ADC sense', fromT: 0.93, toT: 0.5, via: 32.5 },
  ],
  boot: ['panel', 'tp4056', 'cell', 'heltec', 'sx', 'ant', 'oled', 'vbat'],
  flow: { label: 'BEACON', path: ['heltec-sx', 'sx-ant'] },
  animCaption:
    'The energy path comes up first, panel to charger to cell, then the board, its radio and its display. A BEACON leaves the SX1262 over SPI and goes out at the SMA jack.',
  pins: [
    { pin: 'GPIO9', part: 'SX1262 (on board)', signal: 'LoRa SCK', bus: 'SPI', provenance: 'fixed by the board', net: 'heltec-sx' },
    { pin: 'GPIO11', part: 'SX1262 (on board)', signal: 'LoRa MISO', bus: 'SPI', provenance: 'fixed by the board', net: 'heltec-sx' },
    { pin: 'GPIO10', part: 'SX1262 (on board)', signal: 'LoRa MOSI', bus: 'SPI', provenance: 'fixed by the board', net: 'heltec-sx' },
    { pin: 'GPIO8', part: 'SX1262 (on board)', signal: 'LoRa NSS / CS', bus: 'SPI', provenance: 'fixed by the board', net: 'heltec-sx' },
    { pin: 'GPIO12', part: 'SX1262 (on board)', signal: 'LoRa RESET', bus: 'CTRL', provenance: 'fixed by the board', net: 'heltec-sx' },
    { pin: 'GPIO13', part: 'SX1262 (on board)', signal: 'LoRa BUSY', bus: 'CTRL', provenance: 'fixed by the board', net: 'heltec-sx' },
    { pin: 'GPIO14', part: 'SX1262 (on board)', signal: 'LoRa DIO1 (IRQ)', bus: 'CTRL', provenance: 'fixed by the board', net: 'heltec-sx' },
    { pin: 'DIO2', part: 'SX1262 (on board)', signal: 'RF switch control', bus: 'RF', provenance: 'fixed by the board' },
    { pin: 'DIO3', part: 'SX1262 (on board)', signal: 'TCXO supply at 1.8 V', bus: 'PWR', provenance: 'fixed by the board' },
    { pin: 'GPIO1', part: 'VBAT divider', signal: 'VBAT sense, ADC1 CH0', bus: 'ADC', provenance: 'proposed in pinmap.md, and fixed by the board', net: 'heltec-vbat' },
    { pin: 'GPIO37', part: 'VBAT divider', signal: 'divider enable, active low', bus: 'CTRL', provenance: 'fixed by the board', net: 'heltec-vbat' },
    { pin: 'GPIO17', part: 'SSD1306 OLED', signal: 'SDA', bus: 'I2C', provenance: 'fixed by the board', net: 'heltec-oled' },
    { pin: 'GPIO18', part: 'SSD1306 OLED', signal: 'SCL', bus: 'I2C', provenance: 'fixed by the board', net: 'heltec-oled' },
    { pin: 'GPIO21', part: 'SSD1306 OLED', signal: 'reset', bus: 'CTRL', provenance: 'fixed by the board', net: 'heltec-oled' },
    { pin: 'GPIO36', part: 'Board', signal: 'Vext peripheral power gate, active low', bus: 'CTRL', provenance: 'fixed by the board' },
    { pin: 'GPIO35', part: 'Board', signal: 'status LED', bus: 'CTRL', provenance: 'fixed by the board' },
    { pin: 'GPIO0', part: 'Board', signal: 'user button', bus: 'CTRL', provenance: 'fixed by the board' },
    { pin: 'GPIO41 / 42', part: 'Board', signal: 'secondary I2C SDA / SCL', bus: 'I2C', provenance: 'fixed by the board' },
    { pin: '5V-IN', part: 'TP4056 + panel + 18650', signal: 'solar panel positive', bus: 'PWR', provenance: 'doc03', net: 'panel-tp4056' },
    { pin: 'BAT+', part: 'TP4056 + panel + 18650', signal: '18650 positive', bus: 'PWR', provenance: 'doc03', net: 'tp4056-cell' },
    { pin: 'OUT+', part: 'TP4056 + panel + 18650', signal: 'to the board 5 V pin', bus: 'PWR', provenance: 'doc03', net: 'tp4056-heltec' },
    { pin: 'GND', part: 'TP4056 + panel + 18650', signal: 'common ground', bus: 'GND', provenance: 'doc03' },
  ],
  notes: [
    'Six of the seven doc 02 SPI assignments collide with pins the Heltec V3 has already committed. Only DIO1 on GPIO14 comes through unchanged, so the Satellite carries a board-specific map. That edits a locked invariant and needs sign-off.',
    'ADC attenuation is 2.5 dB and the voltage multiplier is 4.9 multiplied by 1.045, from the same variant header as the pins.',
    'Pick one charge path. OUT+ to the 5 V pin, or the cell straight into the JST header, never both: wiring OUT+ to the battery header puts two charge circuits on one cell.',
  ],
  sources: [
    'docs/papers/07-hardware-satellite.md, sections 2 to 7',
    'hardware/pinmap.md, xKoin-Satellite table (doc03 power rows, GPIO1 proposed)',
    'hardware/shopping/mvp-kit.json, device satellite',
  ],
};

const client = {
  key: 'client',
  group: 'core',
  kind: 'sheet',
  name: 'xKoin-Client OTG dongle',
  short: 'Client dongle',
  rev: 'A',
  date: '2026-09-14',
  tagline: 'The buyer. A phone that holds the seed, and a radio on a USB lead when no Wi-Fi is in reach.',
  role:
    'Holds the user keys, presents the voucher on admission, signs the cumulative receipts and signs the EIP-712 ticket that settles them. The dongle is the radio when there is no node Wi-Fi.',
  status: 'proposed',
  statusNote: 'Proposed on both halves. The app is specified and not built; the dongle has a board, a pin map and a power budget.',
  power: 'Entirely from the phone over the OTG lead. About 50 mA listening against a 500 mA USB host budget, roughly 2 percent of a 4000 mAh phone an hour.',
  kitKey: 'client',
  mediums: [
    { name: 'LoRa', via: 'SX1262 on the Heltec V3', detail: 'path B: direct class C reach at 868.1 MHz when no node Wi-Fi is in range', state: 'fitted' },
    { name: 'Wi-Fi', via: 'the phone radio', detail: 'path A: the phone on a Node or Node-Satellite access point', state: 'fitted' },
    { name: 'USB', via: 'USB-C OTG adapter and a data lead', detail: 'USB serial recommended for the first build, SoftAP as the fallback', state: 'fitted' },
  ],
  boxes: [
    { id: 'phone', x: 2, y: 6.5, w: 11, h: 6, label: 'Android phone', sub: 'one seed in the Keystore, signs receipts and tickets', kind: 'mcu' },
    { id: 'otg', x: 15.5, y: 8.1, w: 7.5, h: 2.8, label: 'USB-C OTG adapter', sub: 'ID pin grounded' },
    { id: 'lead', x: 24.5, y: 8.1, w: 7, h: 2.8, label: 'USB-A to USB-C lead', sub: 'data-capable, short' },
    { id: 'dongle', x: 35, y: 6.5, w: 11, h: 6, label: 'Heltec WiFi LoRa 32 V3', sub: 'radio and transport, holds no key', kind: 'mcu' },
    { id: 'oled', x: 21, y: 14.5, w: 11, h: 3, label: 'SSD1306 OLED', sub: 'link state and the byte counter' },
    { id: 'sx', x: 35, y: 14.5, w: 11, h: 3, label: 'SX1262', sub: 'on board, 868.1 MHz' },
    { id: 'mesh', x: 2, y: 16.5, w: 11, h: 3.4, label: 'Node or Node-Satellite', sub: 'path A, when its Wi-Fi is in range' },
    { id: 'ant', x: 35, y: 19.4, w: 11, h: 2.6, label: '868 MHz whip', sub: 'path B, fit before the radio is keyed' },
  ],
  nets: [
    { id: 'phone-otg', from: 'phone', to: 'otg', kind: 'power', label: 'USB 5 V', fromT: 0.5, toT: 0.5 },
    { id: 'otg-lead', from: 'otg', to: 'lead', kind: 'usb', label: 'OTG' },
    { id: 'lead-dongle', from: 'lead', to: 'dongle', kind: 'usb', label: 'USB serial', toT: 0.5 },
    { id: 'phone-mesh', from: 'phone', to: 'mesh', kind: 'wifi', label: 'Wi-Fi path A' },
    { id: 'dongle-sx', from: 'dongle', to: 'sx', kind: 'spi', label: 'SPI + control' },
    { id: 'sx-ant', from: 'sx', to: 'ant', kind: 'rf', label: 'RF 868.1 MHz' },
    { id: 'dongle-oled', from: 'dongle', to: 'oled', kind: 'i2c', label: 'I2C', fromSide: 'left', fromT: 0.83, toSide: 'top', toT: 0.5 },
  ],
  boot: ['phone', 'otg', 'lead', 'dongle', 'sx', 'ant', 'oled', 'mesh'],
  flow: { label: 'RECEIPT 108 B', path: ['phone-otg', 'otg-lead', 'lead-dongle', 'dongle-sx', 'sx-ant'] },
  animCaption:
    'The phone powers the chain, then the dongle, its radio and its display. A receipt the phone signed travels the USB path to the dongle and leaves over LoRa. The dongle holds no key at any point.',
  pins: [
    { pin: 'GPIO9', part: 'SX1262 (on board)', signal: 'LoRa SCK', bus: 'SPI', provenance: 'fixed by the board', net: 'dongle-sx' },
    { pin: 'GPIO11', part: 'SX1262 (on board)', signal: 'LoRa MISO', bus: 'SPI', provenance: 'fixed by the board', net: 'dongle-sx' },
    { pin: 'GPIO10', part: 'SX1262 (on board)', signal: 'LoRa MOSI', bus: 'SPI', provenance: 'fixed by the board', net: 'dongle-sx' },
    { pin: 'GPIO8', part: 'SX1262 (on board)', signal: 'LoRa NSS / CS', bus: 'SPI', provenance: 'fixed by the board', net: 'dongle-sx' },
    { pin: 'GPIO12', part: 'SX1262 (on board)', signal: 'LoRa RESET', bus: 'CTRL', provenance: 'fixed by the board', net: 'dongle-sx' },
    { pin: 'GPIO13', part: 'SX1262 (on board)', signal: 'LoRa BUSY', bus: 'CTRL', provenance: 'fixed by the board', net: 'dongle-sx' },
    { pin: 'GPIO14', part: 'SX1262 (on board)', signal: 'LoRa DIO1 (IRQ)', bus: 'CTRL', provenance: 'fixed by the board', net: 'dongle-sx' },
    { pin: 'GPIO17', part: 'SSD1306 OLED', signal: 'SDA', bus: 'I2C', provenance: 'fixed by the board', net: 'dongle-oled' },
    { pin: 'GPIO18', part: 'SSD1306 OLED', signal: 'SCL', bus: 'I2C', provenance: 'fixed by the board', net: 'dongle-oled' },
    { pin: 'GPIO21', part: 'SSD1306 OLED', signal: 'reset', bus: 'CTRL', provenance: 'fixed by the board', net: 'dongle-oled' },
    { pin: 'GPIO36', part: 'Board', signal: 'Vext gate, active low, OLED may stay on', bus: 'CTRL', provenance: 'fixed by the board' },
    { pin: 'GPIO19', part: 'USB', signal: 'D-', bus: 'USB', provenance: 'ESP32-S3 silicon, verify at bring-up', net: 'lead-dongle' },
    { pin: 'GPIO20', part: 'USB', signal: 'D+', bus: 'USB', provenance: 'ESP32-S3 silicon, verify at bring-up', net: 'lead-dongle' },
    { pin: 'GPIO1', part: 'VBAT divider', signal: 'unused on the dongle, there is no cell', bus: 'ADC', provenance: 'fixed by the board' },
  ],
  notes: [
    'Nothing on the dongle is a proposed assignment. Every pin is fixed by the board or by the silicon, which is the one respect in which it is simpler than every other device in the set.',
    'Whether the V3 USB-C connector reaches the native USB peripheral or a USB-to-UART bridge is open, and it decides which Android driver the app needs. A board on a bench answers it.',
    'The battery header stays empty. A cell fitted there would charge from the phone.',
  ],
  sources: [
    'docs/papers/08-hardware-client-and-otg-dongle.md, sections 1 to 8',
    'docs/papers/07-hardware-satellite.md, section 5, for the shared board pin map',
    'hardware/shopping/mvp-kit.json, device client',
  ],
};

/* ------------------------------------------------------------- ecosystem */

const farmNode = {
  key: 'farm-node',
  group: 'ecosystem',
  kind: 'sheet',
  name: 'Farm sensor node',
  short: 'Farm sensor',
  rev: 'A',
  date: '2026-09-14',
  tagline: 'A third-party style sensor that pays nothing and makes the mesh denser.',
  role:
    'Sends one TELEMETRY frame per reading on the free LAN plane. No voucher is presented, no receipt is signed, no ticket is assembled.',
  status: 'proposed',
  statusNote: 'Required for demo D6. Every pin below is proposed and none has been signed off.',
  power: '18650 cell through an HT7333 at 4 uA quiescent, with an optional panel. About 2.43 mAh a day on a fifteen-minute schedule.',
  kitKey: 'farm-node',
  radio: 'Ai-Thinker Ra-01SH, an SX1262, so the existing driver covers it',
  band: '868.1 MHz, inside the 863 to 930 MHz range the module supports',
  offer: 'Free LAN plane: traffic that stays inside the mesh costs zero XKN and needs no voucher.',
  mediums: [
    { name: 'LoRa', via: 'Ra-01SH (SX1262)', detail: '3.3 V only, IPEX connector, so a pigtail is on the list', state: 'fitted' },
    { name: 'Analog and one-wire', via: 'capacitive soil probe and a DHT22', detail: 'the readings the TELEMETRY frame carries', state: 'fitted' },
  ],
  boxes: [
    { id: 'soil', x: 2, y: 3.5, w: 10, h: 3.4, label: 'Capacitive soil probe', sub: 'v2.0, capacitive not resistive' },
    { id: 'dht', x: 2, y: 9, w: 10, h: 3.4, label: 'DHT22 or AHT20', sub: 'AHT20 is I2C and moves the map' },
    { id: 'c3', x: 17, y: 7.5, w: 12, h: 5.6, label: 'ESP32-C3 SuperMini', sub: '22 by 18 mm, remove the power LED first', kind: 'mcu' },
    { id: 'ant', x: 36, y: 1.8, w: 10, h: 2.4, label: '868 MHz whip', sub: '3 dBi SMA, IPEX pigtail' },
    { id: 'radio', x: 36, y: 5.5, w: 10, h: 3.6, label: 'Ra-01SH (SX1262)', sub: 'MVP kit substitutes a second E22-900M22S' },
    { id: 'ht', x: 17, y: 16, w: 12, h: 3, label: 'HT7333 LDO', sub: '4 uA quiescent, bypasses the board regulator' },
    { id: 'cell', x: 2, y: 15.5, w: 10, h: 3, label: '18650 cell and TP4056', sub: 'panel-fed configuration only' },
    { id: 'panel', x: 2, y: 20, w: 10, h: 3, label: 'Solar panel 6 V 2 W', sub: 'a convenience, not a requirement', optional: true },
  ],
  nets: [
    { id: 'soil-c3', from: 'soil', to: 'c3', kind: 'analog', label: 'ADC1 CH0', toT: 0.16 },
    { id: 'dht-c3', from: 'dht', to: 'c3', kind: 'onewire', label: 'one-wire', fromT: 0.5, toT: 0.571 },
    { id: 'c3-radio', from: 'c3', to: 'radio', kind: 'spi', label: 'SPI + control', fromT: 0.16, toT: 0.5, via: 32.5 },
    { id: 'radio-ant', from: 'radio', to: 'ant', kind: 'rf', label: 'RF 868.1 MHz' },
    { id: 'ht-c3', from: 'ht', to: 'c3', kind: 'power', label: '3V3 pad' },
    { id: 'cell-ht', from: 'cell', to: 'ht', kind: 'power', label: 'cell out', fromT: 0.5, toT: 0.333 },
    { id: 'panel-cell', from: 'panel', to: 'cell', kind: 'power', label: '6 V in' },
  ],
  boot: ['panel', 'cell', 'ht', 'c3', 'radio', 'ant', 'soil', 'dht'],
  flow: { label: 'TELEMETRY', path: ['~soil-c3', 'c3-radio', 'radio-ant'] },
  animCaption:
    'The supply comes up, then the board, its radio and its sensors. A soil reading enters on the ADC pin and leaves as one TELEMETRY frame. Nothing on this path touches the payment plane.',
  pins: [
    { pin: 'GPIO0', part: 'Capacitive soil probe', signal: 'analog out, ADC1 CH0', bus: 'ADC', provenance: 'proposed', net: 'soil-c3' },
    { pin: 'GPIO1', part: 'DHT22', signal: 'data, 10k pull-up to 3V3', bus: 'one-wire', provenance: 'proposed', net: 'dht-c3' },
    { pin: 'GPIO2', part: 'Ra-01SH (SX1262)', signal: 'NRESET, strapping pin, idles high', bus: 'CTRL', provenance: 'proposed', net: 'c3-radio' },
    { pin: 'GPIO3', part: 'Ra-01SH (SX1262)', signal: 'DIO1 (IRQ), deep-sleep wake', bus: 'CTRL', provenance: 'proposed', net: 'c3-radio' },
    { pin: 'GPIO4', part: 'Ra-01SH (SX1262)', signal: 'SCK', bus: 'SPI', provenance: 'proposed', net: 'c3-radio' },
    { pin: 'GPIO5', part: 'Ra-01SH (SX1262)', signal: 'MISO', bus: 'SPI', provenance: 'proposed', net: 'c3-radio' },
    { pin: 'GPIO6', part: 'Ra-01SH (SX1262)', signal: 'MOSI', bus: 'SPI', provenance: 'proposed', net: 'c3-radio' },
    { pin: 'GPIO7', part: 'Ra-01SH (SX1262)', signal: 'NSS / CS', bus: 'SPI', provenance: 'proposed', net: 'c3-radio' },
    { pin: 'GPIO10', part: 'Ra-01SH (SX1262)', signal: 'BUSY, polled not waited on', bus: 'CTRL', provenance: 'proposed', net: 'c3-radio' },
    { pin: 'GPIO8', part: 'Board', signal: 'on-board LED, left alone', bus: 'reserved', provenance: 'board' },
    { pin: 'GPIO9', part: 'Board', signal: 'BOOT button, strapping pin', bus: 'reserved', provenance: 'board' },
    { pin: 'GPIO20 / 21', part: 'Board', signal: 'UART0 console RX / TX', bus: 'UART', provenance: 'board' },
    { pin: '3V3 pad', part: 'HT7333 LDO', signal: 'supply in, bypassing the board regulator', bus: 'PWR', provenance: 'proposed', net: 'ht-c3' },
  ],
  notes: [
    'Every pin on this sheet is proposed. The ESP32-C3 SuperMini is not in hardware/pinmap.md at all, so this is the first allocation for it and it needs sign-off before firmware is written against it.',
    'GPIO2 is a strapping pin, so an output that idles high is safe and an input that idles low would not be. Deep-sleep wake on the C3 works only on GPIO0 to GPIO5, which is why DIO1 sits at GPIO3.',
    'Remove the power LED before anything else. About 1 mA continuous is ten times the entire sensing budget.',
    'Martin chose a second E22-900M22S for the MVP kit on 2026-09-14 because the Ra-01SH ships mid November. Same silicon, same driver, different breakout.',
  ],
  sources: [
    'docs/papers/09-lora-ecosystem-devices.md, sections 2, 3 and 7',
    'hardware/shopping/mvp-kit.json, device farm-node',
    'hardware/shopping/parts/esp32-c3-supermini.json, ra-01sh-sx1262.json',
  ],
};

const tankNode = {
  key: 'tank-node',
  group: 'ecosystem',
  kind: 'sheet',
  name: 'Water tank level node',
  short: 'Tank level',
  rev: 'A',
  date: '2026-09-14',
  tagline: 'The same platform with a different sensor, so the pattern generalises.',
  role:
    'Reports tank level on the free LAN plane in the same TELEMETRY frame as the farm node. Proposed, not built, and not required by any demo in the current matrix.',
  status: 'proposed',
  statusNote: 'The platform is unchanged. Only the sensor and the mounting change, and the sensor pins are not allocated anywhere yet.',
  power: 'The same supply path as the farm node. A tank level changes slowly, so a schedule slower than fifteen minutes makes the budget easier still.',
  kitKey: null,
  radio: 'Ra-01SH, an SX1262, the same radio as the farm node',
  band: '868.1 MHz',
  offer: 'Free LAN plane: the reading reaches a dashboard in the same mesh at zero XKN.',
  mediums: [
    { name: 'LoRa', via: 'Ra-01SH (SX1262)', detail: 'the same SPI allocation as the farm node', state: 'fitted' },
    { name: 'Sensor', via: 'HC-SR04 ultrasonic, or a submersible pressure transducer', detail: 'HC-SR04 for a first build, pressure transducer if condensation defeats it', state: 'fitted' },
  ],
  boxes: [
    { id: 'sensor', x: 2, y: 3.5, w: 10, h: 3.6, label: 'HC-SR04 ultrasonic', sub: 'in the lid, 5 V, echo pin needs a divider' },
    { id: 'alt', x: 2, y: 9, w: 10, h: 3.6, label: 'Pressure transducer', sub: 'alternative: immune to foam and condensation', optional: true },
    { id: 'c3', x: 17, y: 7.5, w: 12, h: 5.6, label: 'ESP32-C3 SuperMini', sub: 'the farm node platform, unchanged', kind: 'mcu' },
    { id: 'ant', x: 36, y: 1.8, w: 10, h: 2.4, label: '868 MHz whip', sub: '3 dBi SMA, IPEX pigtail' },
    { id: 'radio', x: 36, y: 5.5, w: 10, h: 3.6, label: 'Ra-01SH (SX1262)', sub: 'same part, same driver' },
    { id: 'ht', x: 17, y: 16, w: 12, h: 3, label: 'HT7333 LDO', sub: '4 uA quiescent' },
    { id: 'cell', x: 2, y: 15.5, w: 10, h: 3, label: '18650 cell and TP4056', sub: 'the same supply path' },
    { id: 'panel', x: 2, y: 20, w: 10, h: 3, label: 'Solar panel 6 V 2 W', sub: 'optional', optional: true },
  ],
  nets: [
    { id: 'sensor-c3', from: 'sensor', to: 'c3', kind: 'ctrl', label: 'trigger and echo', note: 'pins not allocated', toT: 0.16 },
    { id: 'alt-c3', from: 'alt', to: 'c3', kind: 'analog', label: 'alternative', note: 'pins not allocated', fromT: 0.5, toT: 0.589, optional: true },
    { id: 'c3-radio', from: 'c3', to: 'radio', kind: 'spi', label: 'SPI + control', fromT: 0.16, toT: 0.5, via: 32.5 },
    { id: 'radio-ant', from: 'radio', to: 'ant', kind: 'rf', label: 'RF 868.1 MHz' },
    { id: 'ht-c3', from: 'ht', to: 'c3', kind: 'power', label: '3V3 pad' },
    { id: 'cell-ht', from: 'cell', to: 'ht', kind: 'power', label: 'cell out', fromT: 0.5, toT: 0.333 },
    { id: 'panel-cell', from: 'panel', to: 'cell', kind: 'power', label: '6 V in' },
  ],
  boot: ['panel', 'cell', 'ht', 'c3', 'radio', 'ant', 'sensor', 'alt'],
  flow: { label: 'TELEMETRY', path: ['c3-radio', 'radio-ant'] },
  animCaption:
    'Identical to the farm node up to the sensor. The level reading leaves in the same TELEMETRY frame on the same free plane.',
  pins: [
    { pin: 'not allocated', part: 'HC-SR04 ultrasonic', signal: 'trigger and echo', bus: 'CTRL', provenance: 'not allocated in paper 09', net: 'sensor-c3' },
    { pin: 'GPIO2', part: 'Ra-01SH (SX1262)', signal: 'NRESET', bus: 'CTRL', provenance: 'proposed, shared with the farm node', net: 'c3-radio' },
    { pin: 'GPIO3', part: 'Ra-01SH (SX1262)', signal: 'DIO1 (IRQ)', bus: 'CTRL', provenance: 'proposed, shared with the farm node', net: 'c3-radio' },
    { pin: 'GPIO4', part: 'Ra-01SH (SX1262)', signal: 'SCK', bus: 'SPI', provenance: 'proposed, shared with the farm node', net: 'c3-radio' },
    { pin: 'GPIO5', part: 'Ra-01SH (SX1262)', signal: 'MISO', bus: 'SPI', provenance: 'proposed, shared with the farm node', net: 'c3-radio' },
    { pin: 'GPIO6', part: 'Ra-01SH (SX1262)', signal: 'MOSI', bus: 'SPI', provenance: 'proposed, shared with the farm node', net: 'c3-radio' },
    { pin: 'GPIO7', part: 'Ra-01SH (SX1262)', signal: 'NSS / CS', bus: 'SPI', provenance: 'proposed, shared with the farm node', net: 'c3-radio' },
    { pin: 'GPIO10', part: 'Ra-01SH (SX1262)', signal: 'BUSY', bus: 'CTRL', provenance: 'proposed, shared with the farm node', net: 'c3-radio' },
    { pin: '3V3 pad', part: 'HT7333 LDO', signal: 'supply in', bus: 'PWR', provenance: 'proposed, shared with the farm node', net: 'ht-c3' },
  ],
  notes: [
    'Paper 09 allocates no pins for either sensor, so the sensor trace carries no GPIO numbers and the table says so. The SPI and supply rows are the farm node allocation, reused because the platform is unchanged.',
    'The reading interval is a guess. A tank level changes slowly enough that a fifteen-minute schedule is probably ten times faster than it has to be.',
  ],
  sources: [
    'docs/papers/09-lora-ecosystem-devices.md, section 4',
    'docs/papers/09-lora-ecosystem-devices.md, section 3.3, for the shared platform rows',
  ],
};

const meshtastic = {
  key: 'meshtastic',
  group: 'ecosystem',
  kind: 'card',
  name: 'Meshtastic handset',
  short: 'Meshtastic',
  rev: 'A',
  date: '2026-09-14',
  tagline: 'A stock Heltec V3 on stock firmware, on the bench to demonstrate exactly one property.',
  role:
    'Bought and flashed with unmodified Meshtastic firmware. It exists to show that an xKoin BEACON keeps Meshtastic framing compatibility for discovery, and nothing beyond that.',
  status: 'proposed',
  statusNote: 'The discovery claim is specified and undemonstrated. It has not been shown between two physical radios in this repository.',
  power: 'USB or its own cell. Nothing about this device is built by us.',
  kitKey: null,
  radio: 'SX1262 on a Heltec WiFi LoRa 32 V3 (ESP32-S3FN8, 0.96 in OLED)',
  band: '868 MHz, listings say 863 to 928 or 868 / 915',
  offer:
    'Free LAN plane and class C service. A person who already owns Meshtastic hardware can find an xKoin node without owning any xKoin hardware.',
  mediums: [
    { name: 'LoRa', via: 'SX1262 on the Heltec V3', detail: 'stock Meshtastic firmware, same radio parameters as the xKoin device', state: 'fitted' },
  ],
  claimed: [
    'A stock Meshtastic node and an xKoin device on the same radio parameters are visible to each other at the discovery layer.',
    'The xKoin BEACON, frame type 0, is framed so a Meshtastic receiver reports it rather than treating it as noise.',
    'The practical demonstration is an xKoin Satellite beacon appearing on a Meshtastic handset screen.',
  ],
  notClaimed: [
    'No message interoperation. A Meshtastic text message is not an xKoin frame.',
    'No routing between the two meshes, in either direction.',
    'No access to the payment plane. Frame types 1 through 8 are xKoin frames and a Meshtastic node receiving one drops it.',
    'No claim that an xKoin device is a Meshtastic node, can join a channel, or can be administered by a Meshtastic client.',
    'No claim about encryption interoperation in either direction.',
  ],
  notes: [
    'Meshtastic carries messages, it has no medium but radio, and it has no economics, so nobody is paid to run a node where one is needed. Those are the three gaps xKoin fills.',
    'Stage two of the MVP kit adds a third Heltec V3 flashed with Meshtastic for this story.',
  ],
  sources: [
    'docs/papers/09-lora-ecosystem-devices.md, section 5',
    'hardware/shopping/mvp-kit.json, stage_two',
  ],
};

export const DEVICES = [node, nodeSatellite, satellite, client, farmNode, tankNode, meshtastic];

export const GROUPS = [
  { key: 'core', title: 'Core devices', note: 'The four archetypes xKoin builds.' },
  { key: 'ecosystem', title: 'Ecosystem', note: 'Pre-existing LoRa hardware on the free LAN plane.' },
];

export const SHEET_DEVICES = DEVICES.filter((device) => device.kind === 'sheet');

export function deviceByKey(key) {
  return DEVICES.find((device) => device.key === key) ?? DEVICES[0];
}

/** Sheet n of m, counting only the devices that carry a drawing. */
export function sheetNumber(device) {
  const index = SHEET_DEVICES.findIndex((entry) => entry.key === device.key);
  return { n: index + 1, of: SHEET_DEVICES.length };
}
