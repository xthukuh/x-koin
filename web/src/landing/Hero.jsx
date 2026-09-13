import { Link } from 'react-router-dom';

import NodeConsole from './NodeConsole.jsx';
import { STATS } from './data.js';

export default function Hero() {
  return (
    <header className="xk-hero">
      <div className="xk-wrap">
        <div className="xk-hero__grid">
          <div>
            <p className="xk-eyebrow">xKoin protocol v1, draft</p>
            <h1>
              <span>Internet</span>
              <span>over your</span>
              <span className="xk-hero__accent">wiring.</span>
            </h1>
            <p className="xk-hero__sub">
              Power line, narrowband power line and LoRa carry the same frames, and the network is
              paid per verified byte: nobody is owed anything until the client signs for it.
            </p>
            <div className="xk-cta">
              <a className="xk-btn xk-btn--primary" href="#how">
                See how it works
              </a>
              <Link className="xk-btn" to="/docs">
                Read the papers
              </Link>
              <Link className="xk-btn" to="/shop">
                Get the parts
              </Link>
            </div>
          </div>
          <NodeConsole />
        </div>

        <dl className="xk-stats">
          {STATS.map((stat) => (
            <div className="xk-stat" key={stat.label}>
              <dt className="xk-mono">{stat.value}</dt>
              <dd>{stat.label}</dd>
              <dd className="xk-note">{stat.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
