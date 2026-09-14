import { useId, useState } from 'react';

import useClock from './useClock.js';
import './player.css';

/**
 * A single animation inside a page, wrapped in the controls a reader expects
 * from a video: a play button over the picture before it starts, then play or
 * pause, replay, a scrubber and a loop switch. Anything that moves on /shop,
 * /replay, /docs or the landing page renders inside one of these, so the reader
 * can see at a glance that the picture is interactive and can play it again.
 *
 *   <AnimationFrame title="Frame flow" duration={ms(6)} caption="...">
 *     {({ t }) => <MyDiagram t={t} />}
 *   </AnimationFrame>
 *
 * The child is a render function of `{ t, playing, ended }`, so the animation
 * is a pure function of time like a player scene. `autoplay` starts it on
 * mount; the default waits for the reader. `aspect` sets the picture box.
 */
export default function AnimationFrame({
  title,
  duration,
  caption = null,
  autoplay = false,
  loop: loopDefault = false,
  aspect = '16 / 9',
  className = '',
  children,
}) {
  const [started, setStarted] = useState(Boolean(autoplay));
  const [loop, setLoop] = useState(loopDefault);
  const clock = useClock({ duration, autoplay });
  const { t, playing, ended, seek, toggle, replay } = clock;
  const id = useId();

  if (ended && loop && started) {
    // Restart on the next tick rather than inside render.
    window.setTimeout(replay, 0);
  }

  const begin = () => {
    setStarted(true);
    replay();
  };

  return (
    <figure className={`xk-anim ${className}`.trim()} aria-labelledby={`${id}-title`}>
      <div className="xk-anim__head">
        <span className="xk-anim__badge xk-mono">animation</span>
        <span className="xk-anim__title" id={`${id}-title`}>
          {title}
        </span>
        <span className="xk-anim__time xk-mono">
          {fmt(t)} / {fmt(duration)}
        </span>
      </div>

      <div className="xk-anim__stage" style={{ aspectRatio: aspect }}>
        {children({ t: started ? t : 0, playing: started && playing, ended })}
        {!started ? (
          <button type="button" className="xk-anim__cover" onClick={begin} aria-label={`Play ${title}`}>
            <span className="xk-anim__play">
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                <path d="M7 5l12 7-12 7z" fill="currentColor" />
              </svg>
            </span>
            <span className="xk-anim__cover-label">Play</span>
          </button>
        ) : null}
        {started && ended && !loop ? (
          <button type="button" className="xk-anim__cover xk-anim__cover--end" onClick={replay} aria-label={`Replay ${title}`}>
            <span className="xk-anim__play">
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                <path d="M12 5a7 7 0 1 1-6.3 4M5 4v5h5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
              </svg>
            </span>
            <span className="xk-anim__cover-label">Replay</span>
          </button>
        ) : null}
      </div>

      <div className="xk-anim__bar">
        <button type="button" className="xk-player__btn is-primary" onClick={started ? toggle : begin} aria-label={playing ? 'Pause' : 'Play'} title={playing ? 'Pause' : 'Play'}>
          {started && playing ? (
            <svg viewBox="0 0 24 24">
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M7 5l12 7-12 7z" />
            </svg>
          )}
        </button>
        <button type="button" className="xk-player__btn" onClick={begin} aria-label="Replay" title="Replay">
          <svg viewBox="0 0 24 24">
            <path d="M12 5a7 7 0 1 1-6.3 4M5 4v5h5" fill="none" />
          </svg>
        </button>
        <input
          type="range"
          className="xk-anim__scrub"
          min={0}
          max={duration}
          step={16}
          value={started ? Math.min(t, duration) : 0}
          onChange={(event) => {
            if (!started) {
              setStarted(true);
            }
            seek(Number(event.target.value));
          }}
          aria-label={`${title} time`}
        />
        <button
          type="button"
          className={`xk-player__tool${loop ? ' is-on' : ''}`}
          onClick={() => setLoop((value) => !value)}
          aria-pressed={loop}
          title="Loop"
        >
          loop
        </button>
      </div>

      {caption ? <figcaption className="xk-anim__caption">{caption}</figcaption> : null}
    </figure>
  );
}

function fmt(msValue) {
  const total = Math.max(0, Math.round(msValue / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
