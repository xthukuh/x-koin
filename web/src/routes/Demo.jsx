/*
 * /demo. A full-screen playground over the three contracts: the engine in
 * web/src/demo/engine.js ports them rule for rule, crypto.js signs for real,
 * gas.js carries forge-measured gas. `npm run verify:demo` replays the anvil
 * chain proof through the engine and checks it lands on the same balances.
 *
 * Rendered outside the site Shell so it can own the whole viewport.
 */

import Playground from '../demo/ui/Playground.jsx';
import '../demo/demo.css';
import '../demo/playground.css';

export default function Demo() {
  return <Playground />;
}
