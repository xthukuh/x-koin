import { useEffect, useRef, useState } from 'react';

/**
 * The listing gallery. Hand-written rather than pulled from a carousel package:
 * the whole behaviour is one index, and a dependency would outweigh it.
 *
 * Prev and next buttons, dot indicators, left and right arrow keys while the
 * frame has focus, and a horizontal swipe on touch. Images are lazy so a page
 * of twenty galleries does not fetch two hundred photos, and an image that
 * fails to load drops itself out of the gallery instead of leaving a hole.
 */
export default function Carousel({ images, alt }) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState([]);
  // A ref, not state: a swipe quicker than one render would read a stale start
  // position and be dropped.
  const touchX = useRef(null);

  const shown = (Array.isArray(images) ? images : []).filter((src) => !broken.includes(src));
  const count = shown.length;

  useEffect(() => {
    if (index > count - 1) {
      setIndex(count > 0 ? count - 1 : 0);
    }
  }, [count, index]);

  function step(delta) {
    if (count < 2) {
      return;
    }
    setIndex((current) => (current + delta + count) % count);
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    }
  }

  function onTouchEnd(event) {
    const start = touchX.current;
    if (start === null) {
      return;
    }
    const end = event.changedTouches[0].clientX;
    if (Math.abs(end - start) > 40) {
      step(end < start ? 1 : -1);
    }
    touchX.current = null;
  }

  if (count === 0) {
    return <div className="xk-shop-nophoto">no photo on the listing</div>;
  }

  const safe = Math.min(index, count - 1);

  return (
    <div className="xk-shop-gallery">
      <div
        className="xk-shop-frame"
        onKeyDown={onKeyDown}
        onTouchEnd={onTouchEnd}
        onTouchStart={(event) => {
          touchX.current = event.touches[0].clientX;
        }}
        role="group"
        aria-roledescription="carousel"
        aria-label={alt}
        tabIndex={0}
      >
        <div className="xk-shop-track" style={{ transform: `translateX(-${safe * 100}%)` }}>
          {shown.map((src) => (
            <div className="xk-shop-slide" key={src}>
              <img
                alt={alt}
                decoding="async"
                loading="lazy"
                onError={() => setBroken((current) => current.concat(src))}
                src={src}
              />
            </div>
          ))}
        </div>
        {count > 1 ? (
          <>
            <button
              aria-label="previous image"
              className="xk-shop-arrow xk-shop-arrow-prev"
              onClick={() => step(-1)}
              type="button"
            >
              &lt;
            </button>
            <button
              aria-label="next image"
              className="xk-shop-arrow xk-shop-arrow-next"
              onClick={() => step(1)}
              type="button"
            >
              &gt;
            </button>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className="xk-shop-dots">
          {shown.map((src, dot) => (
            <button
              aria-current={dot === safe}
              aria-label={`image ${dot + 1}`}
              className="xk-shop-dot"
              key={src}
              onClick={() => setIndex(dot)}
              type="button"
            />
          ))}
        </div>
      ) : null}
      <p className="xk-shop-count">
        {safe + 1} / {count}
      </p>
    </div>
  );
}
