/**
 * Timing helpers for scenes. A scene is a pure function of `t` (milliseconds
 * since it started), so every animated value is computed from `t` with these.
 *
 *   const p = stage(t, 800, 500);          // 0 before 800 ms, 1 after 1300 ms, eased between
 *   const x = lerp(0, 240, p);
 *   const n = Math.round(lerp(0, 191698, stage(t, 1200, 900, ease.outExpo)));
 */

export const ease = {
  linear: (x) => x,
  inCubic: (x) => x * x * x,
  outCubic: (x) => 1 - (1 - x) ** 3,
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  outQuart: (x) => 1 - (1 - x) ** 4,
  outExpo: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
  outBack: (x) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
  },
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
};

export function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Eased progress of a step that starts at `start` and lasts `duration`. */
export function stage(t, start, duration = 500, easing = ease.outCubic) {
  if (duration <= 0) {
    return t >= start ? 1 : 0;
  }
  return easing(clamp01((t - start) / duration));
}

export function lerp(a, b, p) {
  return a + (b - a) * p;
}

/** A value that pulses between 0 and 1 with `period` ms, phase-locked to t. */
export function pulse(t, period = 1200) {
  return 0.5 - 0.5 * Math.cos(((t % period) / period) * Math.PI * 2);
}

/** Position 0..1 along a loop that repeats every `period` ms after `start`. */
export function loop(t, start, period) {
  if (t < start) {
    return 0;
  }
  return ((t - start) % period) / period;
}

/** How many of `count` items have appeared, staggered by `gap` ms after `start`. */
export function shown(t, start, gap, count) {
  if (t < start) {
    return 0;
  }
  return Math.min(count, Math.floor((t - start) / gap) + 1);
}

/** Stagger helper: progress of item `i` in a list starting at `start`. */
export function item(t, start, i, gap = 120, duration = 420, easing = ease.outCubic) {
  return stage(t, start + i * gap, duration, easing);
}

/** A number formatted with thousands separators as it counts up. */
export function countUp(t, start, duration, target, { from = 0, decimals = 0, easing = ease.outExpo } = {}) {
  const value = lerp(from, target, stage(t, start, duration, easing));
  return value.toLocaleString('en-KE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Style for an SVG path that draws itself: stroke-dasharray and offset from progress. */
export function draw(p, length = 1000) {
  return { strokeDasharray: length, strokeDashoffset: length * (1 - clamp01(p)) };
}

/** Milliseconds, so `ms(2.5)` reads as 2.5 seconds in a scene timeline. */
export function ms(seconds) {
  return Math.round(seconds * 1000);
}
