import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A controlled clock for deterministic animation.
 *
 * Every scene in the player renders as a pure function of `t`, the number of
 * milliseconds since the scene started, so pausing is stopping the clock,
 * replaying is `t = 0`, scrubbing is `seek`, and a still for the capture script
 * is one render at a chosen `t`. Nothing animates on its own timer.
 *
 * The clock stops itself at `duration` and reports `ended`; the owner decides
 * what happens next (hold, loop or advance).
 */
export default function useClock({ duration, autoplay = true, speed = 1 } = {}) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(Boolean(autoplay));
  const [generation, setGeneration] = useState(0);
  const raf = useRef(0);
  const last = useRef(0);
  const tRef = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    last.current = performance.now();
    const step = (now) => {
      const dt = (now - last.current) * speedRef.current;
      last.current = now;
      let next = tRef.current + dt;
      let stop = false;
      if (Number.isFinite(duration) && next >= duration) {
        next = duration;
        stop = true;
      }
      tRef.current = next;
      setT(next);
      if (stop) {
        setPlaying(false);
        return;
      }
      raf.current = window.requestAnimationFrame(step);
    };
    raf.current = window.requestAnimationFrame(step);
    return () => {
      if (raf.current) {
        window.cancelAnimationFrame(raf.current);
        raf.current = 0;
      }
    };
  }, [playing, duration, generation]);

  const seek = useCallback(
    (ms) => {
      const clamped = Math.max(0, Number.isFinite(duration) ? Math.min(ms, duration) : ms);
      tRef.current = clamped;
      setT(clamped);
    },
    [duration],
  );

  const play = useCallback(() => {
    if (Number.isFinite(duration) && tRef.current >= duration) {
      tRef.current = 0;
      setT(0);
    }
    setPlaying(true);
  }, [duration]);

  const pause = useCallback(() => setPlaying(false), []);

  const toggle = useCallback(() => {
    setPlaying((value) => {
      if (!value && Number.isFinite(duration) && tRef.current >= duration) {
        tRef.current = 0;
        setT(0);
      }
      return !value;
    });
  }, [duration]);

  /** Back to zero and running; `generation` changes so a paused loop restarts. */
  const replay = useCallback(() => {
    tRef.current = 0;
    setT(0);
    setGeneration((value) => value + 1);
    setPlaying(true);
  }, []);

  const ended = Number.isFinite(duration) && t >= duration;

  return { t, playing, ended, seek, play, pause, toggle, replay };
}
