/**
 * Geometry for the blueprint sheets.
 *
 * Every sheet is drawn on a 24 px grid. A device in devices.js is a list of
 * module boxes and nets in grid units; this file turns that into pixels,
 * orthogonal traces, label anchors and an animation timeline. Adding a device
 * is a data entry, not a new drawing: nothing here knows any device by name.
 *
 * Units: one grid square is G pixels. A sheet is 48 by 30 squares, which is
 * 1152 by 720 px, a 1.6 ratio that prints on A4 landscape with room for the
 * title block.
 */

import { clamp01, ease, item, stage } from '../player/index.js';

export const G = 24;
export const SHEET = { units: { w: 48, h: 30 }, w: 48 * G, h: 30 * G };
export const FRAME = { x: 1, y: 1, w: 46, h: 28 };
export const TITLE_BLOCK = { x: 30.5, y: 23.5, w: 16, h: 5.5 };
export const LEGEND = { x: 2, y: 24.6 };

/** How each kind of net is drawn, and what the legend calls it. */
export const NET_KINDS = {
  spi: { stroke: 'var(--xk-accent)', width: 1.6, tag: 'SPI bus' },
  uart: { stroke: 'var(--xk-accent)', width: 1.6, tag: 'UART' },
  i2c: { stroke: 'var(--xk-accent)', width: 1.6, tag: 'I2C bus' },
  ctrl: { stroke: 'var(--xk-accent)', width: 1.2, dash: '5 4', tag: 'control line' },
  analog: { stroke: 'var(--xk-accent)', width: 1.2, dash: '2 4', tag: 'analog in' },
  onewire: { stroke: 'var(--xk-accent)', width: 1.2, dash: '8 4', tag: 'one-wire' },
  usb: { stroke: 'var(--xk-accent)', width: 2.2, tag: 'USB' },
  eth: { stroke: 'var(--xk-accent)', width: 2.2, tag: 'Ethernet' },
  plc: { stroke: 'var(--xk-plc)', width: 3.2, tag: 'broadband PLC' },
  nbplc: { stroke: 'var(--xk-nbplc)', width: 2.2, tag: 'narrowband PLC' },
  rf: { stroke: 'var(--xk-lora)', width: 2.2, tag: 'LoRa 868 MHz' },
  wifi: { stroke: 'var(--xk-lora)', width: 1.6, dash: '3 5', tag: 'Wi-Fi' },
  power: { stroke: 'var(--xk-money)', width: 2.2, tag: 'DC power' },
  mains: { stroke: 'var(--xk-critical)', width: 2.6, tag: '230 V mains' },
};

const HORIZONTAL = new Set(['left', 'right']);

export function px(units) {
  return units * G;
}

function centre(box) {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

/** A point on one side of a box, `t` running 0 to 1 along that side. */
function port(box, side, t) {
  const f = typeof t === 'number' ? t : 0.5;
  switch (side) {
    case 'left':
      return { x: box.x, y: box.y + box.h * f };
    case 'right':
      return { x: box.x + box.w, y: box.y + box.h * f };
    case 'top':
      return { x: box.x + box.w * f, y: box.y };
    default:
      return { x: box.x + box.w * f, y: box.y + box.h };
  }
}

/** The pair of sides a trace leaves and arrives on, when the data does not say. */
function autoSides(a, b) {
  const ac = centre(a);
  const bc = centre(b);
  const dx = bc.x - ac.x;
  const dy = bc.y - ac.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? ['right', 'left'] : ['left', 'right'];
  }
  return dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom'];
}

/** The corner points of one orthogonal trace, in grid units. */
function routePoints(a, b, net) {
  const auto = autoSides(a, b);
  const fromSide = net.fromSide ?? auto[0];
  const toSide = net.toSide ?? auto[1];
  const p = port(a, fromSide, net.fromT);
  const q = port(b, toSide, net.toT);

  if (HORIZONTAL.has(fromSide) && HORIZONTAL.has(toSide)) {
    if (Math.abs(p.y - q.y) < 0.02) {
      return [p, { x: q.x, y: p.y }];
    }
    const mx = net.via ?? (p.x + q.x) / 2;
    return [p, { x: mx, y: p.y }, { x: mx, y: q.y }, q];
  }

  if (!HORIZONTAL.has(fromSide) && !HORIZONTAL.has(toSide)) {
    if (Math.abs(p.x - q.x) < 0.02) {
      return [p, { x: p.x, y: q.y }];
    }
    const my = net.via ?? (p.y + q.y) / 2;
    return [p, { x: p.x, y: my }, { x: q.x, y: my }, q];
  }

  if (HORIZONTAL.has(fromSide)) {
    return [p, { x: q.x, y: p.y }, q];
  }
  return [p, { x: p.x, y: q.y }, q];
}

function toPixels(points) {
  return points.map((point) => ({ x: px(point.x), y: px(point.y) }));
}

function pathOf(points) {
  return points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${round(point.x)} ${round(point.y)}`).join(' ');
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function lengthOf(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
  }
  return total;
}

/** The point a fraction `s` of the way along a polyline, by arc length. */
export function pointAt(points, s) {
  const total = lengthOf(points);
  if (total <= 0) {
    return { ...points[0] };
  }
  let walked = clamp01(s) * total;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const seg = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (walked <= seg || i === points.length - 1) {
      const f = seg === 0 ? 0 : walked / seg;
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }
    walked -= seg;
  }
  return { ...points[points.length - 1] };
}

/**
 * Where a net's label sits: the middle of the trace by arc length, lifted above
 * a horizontal run and centred across a vertical one, the way a drawing breaks
 * a line to name it. The label carries a ground-coloured halo, so a centred
 * label masks the trace rather than colliding with it, and it never runs into
 * the module it is leaving. A net may override this with `labelAt` in grid units.
 */
function labelAnchor(points, net) {
  if (net.labelAt) {
    return {
      x: px(net.labelAt.x),
      y: px(net.labelAt.y),
      anchor: net.labelAt.anchor ?? 'start',
    };
  }
  const total = lengthOf(points);
  let walked = total / 2;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const seg = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (walked <= seg || i === points.length - 1) {
      const f = seg === 0 ? 0 : walked / seg;
      const x = a.x + (b.x - a.x) * f;
      const y = a.y + (b.y - a.y) * f;
      const horizontal = Math.abs(b.y - a.y) < 0.5;
      return horizontal ? { x, y: y - 7, anchor: 'middle' } : { x, y: y + 3, anchor: 'middle' };
    }
    walked -= seg;
  }
  return { x: points[0].x, y: points[0].y, anchor: 'start' };
}

/** The GPIO numbers a net carries, read off the device's own pin table. */
function pinsOn(device, netId) {
  const rows = (device.pins ?? []).filter((row) => row.net === netId);
  const numbers = rows
    .map((row) => row.pin)
    .filter((pin) => /^GPIO\d+$/.test(pin))
    .map((pin) => pin.replace('GPIO', ''));
  const proposed = rows.some((row) => /proposed/i.test(row.provenance ?? ''));
  return { numbers, proposed };
}

/**
 * One device turned into a drawable sheet: boxes and traces in pixels, the
 * legend entries actually used, and the polyline a data frame travels.
 */
export function buildSheet(device) {
  const byId = new Map((device.boxes ?? []).map((box) => [box.id, box]));

  const boxes = (device.boxes ?? []).map((box) => ({
    ...box,
    px: { x: px(box.x), y: px(box.y), w: px(box.w), h: px(box.h) },
  }));

  const nets = (device.nets ?? []).map((net) => {
    const a = byId.get(net.from);
    const b = byId.get(net.to);
    if (!a || !b) {
      throw new Error(`blueprint net ${net.id} names a box that does not exist`);
    }
    const units = routePoints(a, b, net);
    const points = toPixels(units);
    const { numbers, proposed } = pinsOn(device, net.id);
    return {
      ...net,
      points,
      d: pathOf(points),
      length: lengthOf(points),
      labelPos: labelAnchor(points, net),
      pins: numbers,
      proposed,
      style: NET_KINDS[net.kind] ?? NET_KINDS.ctrl,
    };
  });

  const netById = new Map(nets.map((net) => [net.id, net]));
  const flowPoints = [];
  (device.flow?.path ?? []).forEach((step) => {
    const reverse = step.startsWith('~');
    const net = netById.get(reverse ? step.slice(1) : step);
    if (!net) {
      return;
    }
    const points = reverse ? [...net.points].reverse() : net.points;
    points.forEach((point, i) => {
      if (i === 0 && flowPoints.length > 0) {
        return;
      }
      flowPoints.push(point);
    });
  });

  const kinds = [];
  nets.forEach((net) => {
    if (!kinds.includes(net.kind)) {
      kinds.push(net.kind);
    }
  });

  const boundaries = (device.boundaries ?? []).map((line) => ({
    ...line,
    px:
      line.axis === 'x'
        ? { x1: px(line.at), y1: px(line.from), x2: px(line.at), y2: px(line.to) }
        : { x1: px(line.from), y1: px(line.at), x2: px(line.to), y2: px(line.at) },
    labelPx: { x: px(line.labelAt.x), y: px(line.labelAt.y) },
  }));

  return { boxes, nets, boundaries, kinds, flowPoints };
}

/** Timing for one sheet: modules light in boot order, then traces draw, then a frame runs. */
export function timing(sheet, device) {
  const boot = device.boot ?? sheet.boxes.map((box) => box.id);
  const bootStart = 400;
  const bootGap = 240;
  const bootDur = 420;
  const netStart = bootStart + boot.length * bootGap + 200;
  const netGap = 170;
  const netDur = 520;
  const flowStart = netStart + sheet.nets.length * netGap + netDur + 350;
  const flowDur = 2400;
  return {
    boot,
    bootStart,
    bootGap,
    bootDur,
    netStart,
    netGap,
    netDur,
    flowStart,
    flowDur,
    duration: flowStart + flowDur + 900,
  };
}

/**
 * The whole sheet at time `t`, as a pure function: how lit each module is, how
 * much of each trace is drawn, and where the data frame has reached.
 */
export function frameAt(sheet, device, t) {
  const clock = timing(sheet, device);
  const lit = {};
  clock.boot.forEach((id, i) => {
    lit[id] = item(t, clock.bootStart, i, clock.bootGap, clock.bootDur, ease.outCubic);
  });
  sheet.boxes.forEach((box) => {
    if (!(box.id in lit)) {
      lit[box.id] = stage(t, clock.bootStart, clock.bootDur);
    }
  });

  const drawn = {};
  sheet.nets.forEach((net, i) => {
    drawn[net.id] = item(t, clock.netStart, i, clock.netGap, clock.netDur, ease.outCubic);
  });

  const s = stage(t, clock.flowStart, clock.flowDur, ease.linear);
  const packet =
    sheet.flowPoints.length > 1 && s > 0 && s < 1
      ? { ...pointAt(sheet.flowPoints, s), label: device.flow?.label ?? 'frame' }
      : null;

  return { lit, drawn, packet, clock };
}
