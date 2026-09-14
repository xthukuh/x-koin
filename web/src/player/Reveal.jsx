import { ease, lerp, stage } from './stage.js';

const OFFSETS = {
  up: (p) => `translate3d(0, ${lerp(18, 0, p)}px, 0)`,
  down: (p) => `translate3d(0, ${lerp(-18, 0, p)}px, 0)`,
  left: (p) => `translate3d(${lerp(24, 0, p)}px, 0, 0)`,
  right: (p) => `translate3d(${lerp(-24, 0, p)}px, 0, 0)`,
  scale: (p) => `scale(${lerp(0.92, 1, p)})`,
  pop: (p) => `scale(${lerp(0.6, 1, ease.outBack(p))})`,
  fade: () => 'none',
};

/**
 * Children that appear when the scene clock reaches `at`.
 *
 *   <Reveal t={t} at={ms(1.2)} from="up">...</Reveal>
 *
 * `leave` hides them again at that time (for a beat that is replaced by the
 * next). Pure function of `t`, so the player's pause, replay and scrub all work
 * without this component knowing about them. `as` chooses the element; SVG
 * groups use `as="g"` and get the transform through an attribute instead.
 */
export default function Reveal({
  t,
  at = 0,
  duration = 450,
  from = 'up',
  leave = Infinity,
  leaveDuration = 300,
  easing = ease.outCubic,
  as: Tag = 'div',
  className,
  style,
  children,
  ...rest
}) {
  const enter = stage(t, at, duration, easing);
  const exit = stage(t, leave, leaveDuration, ease.inCubic);
  const p = enter * (1 - exit);
  const hidden = p <= 0.001;
  const transform = (OFFSETS[from] ?? OFFSETS.up)(p);

  if (Tag === 'g') {
    return (
      <g
        className={className}
        style={{ opacity: p, ...style }}
        transform={from === 'fade' ? undefined : svgTransform(from, p)}
        visibility={hidden ? 'hidden' : undefined}
        {...rest}
      >
        {children}
      </g>
    );
  }

  return (
    <Tag
      className={className}
      style={{
        opacity: p,
        transform,
        visibility: hidden ? 'hidden' : undefined,
        willChange: p > 0 && p < 1 ? 'opacity, transform' : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function svgTransform(from, p) {
  switch (from) {
    case 'up':
      return `translate(0 ${lerp(14, 0, p)})`;
    case 'down':
      return `translate(0 ${lerp(-14, 0, p)})`;
    case 'left':
      return `translate(${lerp(18, 0, p)} 0)`;
    case 'right':
      return `translate(${lerp(-18, 0, p)} 0)`;
    default:
      return undefined;
  }
}
