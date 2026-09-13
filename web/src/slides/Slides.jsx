import { useEffect, useRef } from 'react';
import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js';

import { kes, summary } from '../shop/data.js';
import { DECK, WORDS_PER_MINUTE, deckWordCount, wordCount } from './deck.js';

import 'reveal.js/dist/reveal.css';
import './theme.css';

/**
 * The explainer deck.
 *
 * reveal.js is mounted on a ref rather than initialised globally, so the deck
 * belongs to this route and is destroyed when the route unmounts. Every card is
 * one `<section>` and every card kind has one template below, which is what
 * keeps the content in deck.js and out of the JSX.
 *
 * Auto-Animate is on for the whole deck. The brand mark, the card counter, the
 * head rule and the foot rule carry a stable `data-id` on every card, so reveal
 * morphs them from card to card instead of cross-fading the whole slide, and
 * the four component cards morph their device name the same way.
 */

const CONFIG = {
  width: 1280,
  height: 720,
  // Zero margin so the 1280x720 card is the whole frame: a 1280x720 browser
  // viewport then captures at exactly 1:1 and a larger screen scales up whole.
  margin: 0,
  minScale: 0.2,
  maxScale: 1.5,
  center: false,
  // The study's format has no progress bar; the deck is paced by the voice
  // track. The arrow controls go too, because they would sit inside every
  // captured still. Keyboard and touch both stay on.
  progress: false,
  controls: false,
  controlsTutorial: false,
  slideNumber: false,
  // Keyboard, touch and the URL hash all stay on: the hash is how the capture
  // script and a presenter both address one card.
  keyboard: true,
  touch: true,
  hash: true,
  hashOneBasedIndex: false,
  respondToHashChanges: true,
  autoAnimate: true,
  autoAnimateDuration: 0.55,
  autoAnimateEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  transition: 'fade',
  transitionSpeed: 'fast',
  backgroundTransition: 'none',
  display: 'flex',
  pdfSeparateFragments: false,
};

/** Seconds one card holds at the deck's words-per-minute, to one decimal. */
function seconds(card) {
  return ((wordCount(card.narration) / WORDS_PER_MINUTE) * 60).toFixed(1);
}

function Head({ index }) {
  return (
    <div className="xk-head" data-id="head">
      <span className="xk-brand" data-id="brand">
        xKoin
      </span>
      <span className="xk-counter" data-id="counter">
        {String(index + 1).padStart(2, '0')} / {String(DECK.length).padStart(2, '0')}
      </span>
    </div>
  );
}

function Foot({ card }) {
  return (
    <div className="xk-foot" data-id="foot">
      <span>{card.id}</span>
      <span>
        {wordCount(card.narration)} words, {seconds(card)} s at {WORDS_PER_MINUTE} wpm
      </span>
    </div>
  );
}

function Stats({ stats }) {
  if (!Array.isArray(stats) || stats.length === 0) {
    return null;
  }
  return (
    <div className="xk-stats" data-id="stats">
      {stats.map((stat) => (
        <div className="xk-stat" key={stat.label}>
          <div className="xk-stat__value">{stat.value}</div>
          <div className="xk-stat__label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function Figure({ svg, label }) {
  if (!svg) {
    return null;
  }
  return (
    <figure
      className="xk-figure"
      data-id="figure"
      aria-label={label}
      // The figure is an inline SVG string in deck.js drawn on the same CSS
      // tokens as the rest of the deck. It is authored in this repository and
      // never comes from user input or the network.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Bullets({ items }) {
  const wide = Array.isArray(items) && items.length > 4;
  return (
    <ul className={wide ? 'xk-list xk-list--six' : 'xk-list'}>
      {items.map((item) => (
        <li key={item.label}>
          <span className="xk-list__label">{item.label}</span>
          <span className="xk-list__text">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

function PriceBody() {
  const kit = summary();
  return (
    <>
      <div className="xk-price">
        <span className="xk-price__total">{kes(kit.totalKes).replace('KSh ', '')}</span>
        <span className="xk-price__unit">KES, shipping excluded</span>
      </div>
      <div className="xk-price__lines">
        <div className="xk-price__line">
          <div className="xk-price__figure">{kit.lines}</div>
          <div className="xk-price__caption">part lines in the kit</div>
        </div>
        <div className="xk-price__line">
          <div className="xk-price__figure">{kit.scouted}</div>
          <div className="xk-price__caption">priced against a chosen listing</div>
        </div>
        <div className="xk-price__line">
          <div className="xk-price__figure">{kit.pending + kit.local}</div>
          <div className="xk-price__caption">lines still carrying no listing price</div>
        </div>
        <div className="xk-price__line">
          <div className="xk-price__figure">{kit.recorded ?? 'undated'}</div>
          <div className="xk-price__caption">latest price recorded on</div>
        </div>
      </div>
    </>
  );
}

/** One template per card kind. Everything they read comes from deck.js. */
function CardBody({ card }) {
  switch (card.kind) {
    case 'title':
      return <Stats stats={card.stats} />;
    case 'component':
      return (
        <>
          <div className="xk-component__name" data-id="component-name">
            {card.title}
          </div>
          <div className="xk-component__role">{card.body}</div>
          <Stats stats={card.stats} />
        </>
      );
    case 'chain':
    case 'graph':
      return <Figure svg={card.figure} label={card.title} />;
    case 'list':
    case 'demo':
      return <Bullets items={card.items ?? []} />;
    case 'price':
      return <PriceBody />;
    case 'card':
    default:
      return (
        <>
          <Figure svg={card.figure} label={card.title} />
          <Stats stats={card.stats} />
        </>
      );
  }
}

function Card({ card, index }) {
  const isTitle = card.kind === 'title';
  const isComponent = card.kind === 'component';
  return (
    <section
      data-auto-animate=""
      id={card.id}
      className={isTitle ? 'xk-title' : undefined}
    >
      <Head index={index} />
      {isComponent ? (
        <p className="xk-kicker" data-id="kicker">
          Component
        </p>
      ) : null}
      {isTitle ? <h1>{card.title}</h1> : null}
      {!isTitle && !isComponent ? <h2 data-id="heading">{card.title}</h2> : null}
      {isTitle || isComponent ? null : <p className="xk-lede">{card.body}</p>}
      {isTitle ? <p className="xk-lede">{card.body}</p> : null}
      <div className="xk-body">
        <CardBody card={card} />
      </div>
      <Foot card={card} />
      <aside className="notes">{card.narration}</aside>
    </section>
  );
}

export default function Slides() {
  const deckRef = useRef(null);
  const revealRef = useRef(null);

  useEffect(() => {
    const element = deckRef.current;
    if (!element) {
      return undefined;
    }
    const deck = new Reveal(element, { ...CONFIG, plugins: [RevealNotes] });
    revealRef.current = deck;
    deck.initialize();
    return () => {
      try {
        deck.destroy();
      } catch {
        /* reveal throws if it was never fully initialised; nothing to undo. */
      }
      revealRef.current = null;
    };
  }, []);

  return (
    <div className="xk-slides-viewport">
      <div className="reveal xk-slides" ref={deckRef}>
        <div className="slides">
          {DECK.map((card, index) => (
            <Card card={card} index={index} key={card.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Exported for the capture script's sanity check, and for anyone in a console. */
export const DECK_WORDS = deckWordCount();
