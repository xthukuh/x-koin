import './phone.css';

/**
 * A phone frame showing one screen of the xKoin Companion app.
 *
 *   <Phone screen="main" scale={0.5} highlight="buy" />
 *
 * Screens are ported from the wireframes in ./wireframes/*.dc.html (390x844
 * design size) into React under ./screens/. `highlight` names the control the
 * surrounding story is talking about, `scale` sizes the frame, and `t` lets a
 * player scene animate the screen (optional; a screen ignores it if it has
 * nothing to animate). Until a screen is ported, the frame shows its name.
 */
export const SCREEN_NAMES = ['onboard', 'main', 'attach', 'buy', 'send', 'withdraw'];

const SCREENS = {};

export function registerScreen(name, Component) {
  SCREENS[name] = Component;
}

export default function Phone({ screen = 'main', scale = 1, highlight = null, t = 0, className = '', label = null }) {
  const Screen = SCREENS[screen];
  return (
    <div
      className={`xk-phone ${className}`.trim()}
      style={{ width: 390 * scale, height: 844 * scale }}
      aria-label={label ?? `Companion app, ${screen} screen`}
      role="img"
    >
      <div className="xk-phone__screen" style={{ transform: `scale(${scale})` }}>
        {Screen ? (
          <Screen highlight={highlight} t={t} />
        ) : (
          <div className="xk-phone__todo">
            <span className="xk-eyebrow">companion app</span>
            <strong>{screen}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
