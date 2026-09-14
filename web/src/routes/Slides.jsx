import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { CHAPTERS, SLIDE_SCENES, deckDuration } from '../decks/slides/index.js';
import { termsFor } from '../decks/slides/terms.js';
import { ScenePlayer } from '../player/index.js';
import '../decks/slides/slides.css';

/**
 * The founder deck.
 *
 * The page owns three things the player does not: the chapter strip, the terms
 * strip, and the remount that a chapter jump needs. The player reads its
 * starting scene from the URL hash when it mounts, so a jump writes the hash
 * and then changes the player's key, which is one render rather than a new API
 * on a shared component.
 *
 * The terms strip sits outside the 1280x720 frame on purpose. A scene is a
 * picture that has to survive being captured as a still; a footnote link is
 * page furniture and belongs on the page.
 */
export default function Slides() {
  const [index, setIndex] = useState(() => startIndex());
  const [mount, setMount] = useState(0);

  const scene = SLIDE_SCENES[index] ?? SLIDE_SCENES[0];
  const chapter = CHAPTERS.find((entry) => entry.id === scene.chapter) ?? CHAPTERS[0];
  const terms = useMemo(() => termsFor(scene.terms), [scene]);

  // Stable identity, so the player's scene-change effect does not re-run on
  // every animation frame.
  const onSceneChange = useCallback((next) => setIndex(next), []);

  const jump = (target) => {
    const id = SLIDE_SCENES[target.start]?.id;
    if (!id) {
      return;
    }
    window.history.replaceState(null, '', `#/${id}`);
    setIndex(target.start);
    setMount((value) => value + 1);
  };

  const minutes = Math.round(deckDuration() / 60000);

  return (
    <div className="xk-wrap xk-wrap--wide xk-page" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
      <p className="xk-eyebrow">founder deck</p>
      <h1>Full invention slides</h1>
      <p className="xk-lede" style={{ marginBottom: '1.25rem', maxWidth: '78ch' }}>
        Every user journey, every operating mode and every attack scenario, end to end. Click the right of the
        picture for the next scene and the left for the previous one, or use the arrow keys; a scene plays to
        its end and then waits for you. {SLIDE_SCENES.length} scenes in {CHAPTERS.length} chapters, about{' '}
        {minutes} minutes of motion.
      </p>

      <nav className="xk-deck-chapters" aria-label="Chapters">
        {CHAPTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`xk-deck-chapter${entry.id === chapter.id ? ' is-current' : ''}`}
            onClick={() => jump(entry)}
            title={entry.blurb}
            aria-current={entry.id === chapter.id ? 'true' : undefined}
          >
            <span className="xk-deck-chapter__n xk-mono">{String(entry.n).padStart(2, '0')}</span>
            <span className="xk-deck-chapter__label">{entry.title}</span>
          </button>
        ))}
      </nav>

      <ScenePlayer key={mount} scenes={SLIDE_SCENES} title="Full invention slides" onSceneChange={onSceneChange} />

      <section className="xk-deck-terms" aria-label="Terms on this slide">
        <div className="xk-deck-terms__head">
          <span className="xk-eyebrow" style={{ margin: 0 }}>
            terms on this slide
          </span>
          <span className="xk-note xk-mono">
            {String(index + 1).padStart(2, '0')} / {String(SLIDE_SCENES.length).padStart(2, '0')} &middot;{' '}
            {chapter.title}
          </span>
        </div>
        {terms.length > 0 ? (
          <ul className="xk-deck-terms__list">
            {terms.map((entry) => (
              <li key={entry.id}>
                <Link to={`/docs/${entry.doc}`} className="xk-deck-term">
                  <span className="xk-deck-term__word xk-mono">{entry.term}</span>
                  <span className="xk-deck-term__gloss">{entry.short}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="xk-note" style={{ margin: 0 }}>
            No abbreviations on this scene.
          </p>
        )}
      </section>
    </div>
  );
}

/** The scene named by the hash on first load, so a link opens where it points. */
function startIndex() {
  const match = /^#\/(.+)$/.exec(window.location.hash || '');
  if (!match) {
    return 0;
  }
  const id = decodeURIComponent(match[1]);
  const found = SLIDE_SCENES.findIndex((scene) => scene.id === id);
  return found === -1 ? 0 : found;
}
