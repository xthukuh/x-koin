import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import useClock from './useClock.js';
import './player.css';

/**
 * The presentation player.
 *
 * A deck is a list of scenes. Each scene has an `id`, a `title`, a `duration`
 * in milliseconds, an optional `caption` (the words a presenter would say,
 * shown under the stage) and a `Scene` component that renders as a pure
 * function of `t`, the time since the scene started. The player owns the
 * clock, so pause, replay and scrub are one implementation for every deck.
 *
 * Behaviour, modelled on a status viewer: a segmented bar shows where you are;
 * a scene plays to its end and then holds, waiting for you (`mode="hold"`,
 * the default) or moves on (`mode="auto"`). Going back replays the previous
 * scene from its start; going forward starts the next one from its start.
 *
 * Input: click or tap on the right two thirds of the stage for next, the left
 * third for previous; arrow keys; Space for play or pause; R to replay; Home
 * and End; F for fullscreen; C toggles captions; ? shows the key list. The
 * current scene id is mirrored in the URL hash (`#/scene-id`) so a scene can be
 * linked and the capture script can address it.
 *
 * The stage is designed at 1280x720 logical pixels and scaled to fit its box,
 * so a scene can use absolute positions and the same frame captures 1:1.
 */
export default function ScenePlayer({
  scenes,
  title = 'Presentation',
  mode = 'hold',
  start = 0,
  captions: captionsDefault = true,
  onSceneChange,
  className = '',
  width = 1280,
  height = 720,
  glossary = null,
}) {
  const count = scenes.length;
  const initial = useMemo(() => indexFromHash(scenes) ?? Math.min(Math.max(0, start), count - 1), [scenes, start, count]);
  const [index, setIndex] = useState(initial);
  const [captions, setCaptions] = useState(captionsDefault);
  const [help, setHelp] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);

  const scene = scenes[index];
  const clock = useClock({ duration: scene.duration, autoplay: true, speed });
  const { t, playing, ended, seek, toggle, replay } = clock;

  const go = useCallback(
    (next) => {
      const clamped = Math.min(Math.max(0, next), count - 1);
      setIndex(clamped);
      replay();
    },
    [count, replay],
  );

  const next = useCallback(() => {
    if (index < count - 1) {
      go(index + 1);
    } else {
      seek(scene.duration);
    }
  }, [index, count, go, seek, scene.duration]);

  const prev = useCallback(() => {
    if (index > 0) {
      go(index - 1);
    } else {
      replay();
    }
  }, [index, go, replay]);

  // Mirror the scene in the hash and tell the owner.
  useEffect(() => {
    const id = scenes[index]?.id;
    if (id && window.location.hash !== `#/${id}`) {
      window.history.replaceState(null, '', `#/${id}`);
    }
    onSceneChange?.(index, scenes[index]);
  }, [index, scenes, onSceneChange]);

  // Auto mode advances when the clock ends.
  useEffect(() => {
    if (mode === 'auto' && ended && index < count - 1) {
      const handle = window.setTimeout(() => go(index + 1), 350);
      return () => window.clearTimeout(handle);
    }
    return undefined;
  }, [mode, ended, index, count, go]);

  // Keyboard.
  useEffect(() => {
    const onKey = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) {
        return;
      }
      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
        case 'Enter':
          event.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          prev();
          break;
        case ' ':
          event.preventDefault();
          toggle();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          replay();
          break;
        case 'Home':
          event.preventDefault();
          go(0);
          break;
        case 'End':
          event.preventDefault();
          go(count - 1);
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          toggleFullscreen(rootRef.current);
          break;
        case 'c':
        case 'C':
          event.preventDefault();
          setCaptions((value) => !value);
          break;
        case '?':
          event.preventDefault();
          setHelp((value) => !value);
          break;
        case 'Escape':
          setHelp(false);
          break;
        default:
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, prev, toggle, replay, go, count]);

  // Fullscreen state.
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Fit the 1280x720 stage to its box.
  useLayoutEffect(() => {
    const element = stageRef.current;
    if (!element) {
      return undefined;
    }
    const fit = () => {
      const box = element.getBoundingClientRect();
      setScale(Math.min(box.width / width, box.height / height));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width, height]);

  // Click zones: left third previous, the rest next, unless the click landed on
  // something interactive inside the scene.
  const onStageClick = (event) => {
    if (event.target.closest('a, button, input, select, textarea, summary, [data-no-nav]')) {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    if (x < 1 / 3) {
      prev();
    } else {
      next();
    }
  };

  const Scene = scene.Scene;
  const progress = scene.duration > 0 ? Math.min(1, t / scene.duration) : 1;

  return (
    <div
      className={`xk-player${fullscreen ? ' is-fullscreen' : ''}${captions ? '' : ' no-captions'} ${className}`.trim()}
      ref={rootRef}
      role="region"
      aria-roledescription="presentation"
      aria-label={title}
    >
      <div className="xk-player__segments" role="tablist" aria-label="Scenes">
        {scenes.map((entry, i) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`${i + 1}. ${entry.title}`}
            title={entry.title}
            className={`xk-player__segment${i < index ? ' is-done' : ''}${i === index ? ' is-current' : ''}`}
            onClick={() => go(i)}
          >
            <span className="xk-player__segment-fill" style={{ transform: `scaleX(${i < index ? 1 : i === index ? progress : 0})` }} />
          </button>
        ))}
      </div>

      <div className="xk-player__stage" ref={stageRef} onClick={onStageClick}>
        <div
          className="xk-player__frame"
          style={{ width, height, transform: `translate(-50%, -50%) scale(${scale})` }}
          key={scene.id}
        >
          <Scene t={t} duration={scene.duration} playing={playing} ended={ended} index={index} glossary={glossary} />
        </div>

        {ended && mode === 'hold' && index < count - 1 ? (
          <button type="button" className="xk-player__hint" onClick={next} data-no-nav>
            Next <span aria-hidden="true">&#8250;</span>
          </button>
        ) : null}
        {ended && index === count - 1 ? (
          <button type="button" className="xk-player__hint" onClick={() => go(0)} data-no-nav>
            Replay from the start
          </button>
        ) : null}
        {!playing && !ended ? (
          <div className="xk-player__paused" aria-hidden="true">
            <span>paused</span>
          </div>
        ) : null}

        {help ? (
          <div className="xk-player__help" role="dialog" aria-label="Keyboard shortcuts" data-no-nav>
            <h3>Keys</h3>
            <dl>
              <dt>
                <kbd>&rarr;</kbd> <kbd>Enter</kbd>
              </dt>
              <dd>next scene</dd>
              <dt>
                <kbd>&larr;</kbd>
              </dt>
              <dd>previous scene, replayed</dd>
              <dt>
                <kbd>Space</kbd>
              </dt>
              <dd>pause or play</dd>
              <dt>
                <kbd>R</kbd>
              </dt>
              <dd>replay this scene</dd>
              <dt>
                <kbd>C</kbd>
              </dt>
              <dd>captions on or off</dd>
              <dt>
                <kbd>F</kbd>
              </dt>
              <dd>fullscreen</dd>
              <dt>
                <kbd>Home</kbd> <kbd>End</kbd>
              </dt>
              <dd>first or last scene</dd>
            </dl>
            <p className="xk-note">Click the right of the picture for next, the left for previous.</p>
            <button type="button" className="xk-btn xk-btn--small" onClick={() => setHelp(false)}>
              Close
            </button>
          </div>
        ) : null}
      </div>

      {captions && scene.caption ? (
        <p className="xk-player__caption" aria-live="polite">
          {scene.caption}
        </p>
      ) : null}

      <div className="xk-player__bar">
        <div className="xk-player__controls">
          <IconButton label="Previous scene" onClick={prev} disabled={index === 0 && t < 400}>
            <svg viewBox="0 0 24 24">
              <path d="M6 5v14M18 6l-9 6 9 6z" />
            </svg>
          </IconButton>
          <IconButton label={playing ? 'Pause' : 'Play'} onClick={toggle} primary>
            {playing ? (
              <svg viewBox="0 0 24 24">
                <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M7 5l12 7-12 7z" />
              </svg>
            )}
          </IconButton>
          <IconButton label="Next scene" onClick={next} disabled={index === count - 1 && ended}>
            <svg viewBox="0 0 24 24">
              <path d="M18 5v14M6 6l9 6-9 6z" />
            </svg>
          </IconButton>
          <IconButton label="Replay this scene" onClick={replay}>
            <svg viewBox="0 0 24 24">
              <path d="M12 5a7 7 0 1 1-6.3 4M5 4v5h5" fill="none" />
            </svg>
          </IconButton>
        </div>

        <div className="xk-player__scrub">
          <input
            type="range"
            min={0}
            max={scene.duration}
            step={16}
            value={Math.min(t, scene.duration)}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Scene time"
          />
        </div>

        <div className="xk-player__meta">
          <span className="xk-player__counter xk-mono">
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
          <span className="xk-player__title">{scene.title}</span>
        </div>

        <div className="xk-player__tools">
          <button
            type="button"
            className="xk-player__tool xk-mono"
            onClick={() => setSpeed((value) => (value === 1 ? 1.5 : value === 1.5 ? 2 : 1))}
            aria-label="Playback speed"
            title="Playback speed"
          >
            {speed}x
          </button>
          <button
            type="button"
            className={`xk-player__tool${captions ? ' is-on' : ''}`}
            onClick={() => setCaptions((value) => !value)}
            aria-pressed={captions}
            title="Captions"
          >
            CC
          </button>
          <button type="button" className="xk-player__tool" onClick={() => setHelp((value) => !value)} title="Keyboard shortcuts" aria-label="Keyboard shortcuts">
            ?
          </button>
          <button
            type="button"
            className="xk-player__tool"
            onClick={() => toggleFullscreen(rootRef.current)}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <svg viewBox="0 0 24 24" width="14" height="14">
              {fullscreen ? (
                <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" strokeWidth="2" />
              ) : (
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, disabled = false, primary = false, children }) {
  return (
    <button
      type="button"
      className={`xk-player__btn${primary ? ' is-primary' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function indexFromHash(scenes) {
  const match = /^#\/(.+)$/.exec(window.location.hash || '');
  if (!match) {
    return undefined;
  }
  const id = decodeURIComponent(match[1]);
  const index = scenes.findIndex((scene) => scene.id === id);
  return index === -1 ? undefined : index;
}

function toggleFullscreen(element) {
  if (!element) {
    return;
  }
  if (document.fullscreenElement) {
    document.exitFullscreen?.();
  } else {
    element.requestFullscreen?.();
  }
}
