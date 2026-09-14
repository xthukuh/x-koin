import ExampleDeck from '../decks/example/ExampleDeck.jsx';

/**
 * The founder deck route. The full invention deck is written in this session
 * under src/decks/slides/; until it lands, the example deck exercises the
 * player so the route already behaves like the finished page.
 */
export default function Slides() {
  return (
    <div className="xk-wrap xk-wrap--wide" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
      <p className="xk-eyebrow">founder deck</p>
      <h1>Full invention slides</h1>
      <p className="xk-lede" style={{ marginBottom: '1.5rem' }}>
        Every user journey, every operating mode and every attack scenario. Click the picture or
        use the arrow keys; a scene plays to its end and waits for you.
      </p>
      <ExampleDeck />
    </div>
  );
}
