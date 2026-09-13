import { Link } from 'react-router-dom';

import Devices from './Devices.jsx';
import DocsAndRepo from './DocsAndRepo.jsx';
import Faq from './Faq.jsx';
import FreeLanPaidWan from './FreeLanPaidWan.jsx';
import GridFails from './GridFails.jsx';
import Hero from './Hero.jsx';
import Laws from './Laws.jsx';
import Mediums from './Mediums.jsx';
import Operators from './Operators.jsx';
import PayPerByte from './PayPerByte.jsx';
import Problem from './Problem.jsx';
import Roadmap from './Roadmap.jsx';
import TrustedParties from './TrustedParties.jsx';
import './landing.css';

export default function Landing() {
  return (
    <div className="xk-landing">
      <div className="xk-topbar">
        <div className="xk-wrap xk-topbar__inner">
          <a className="xk-brand" href="#top">
            xKoin
          </a>
          <nav className="xk-topnav" aria-label="Sections">
            <a href="#how">How it works</a>
            <a href="#devices">Devices</a>
            <a href="#operators">Operators</a>
            <a href="#laws">Security</a>
            <a href="#roadmap">Roadmap</a>
            <Link to="/docs">Papers</Link>
            <Link to="/shop">Parts</Link>
          </nav>
        </div>
      </div>

      <main id="top">
        <Hero />
        <Problem />
        <FreeLanPaidWan />
        <Mediums />
        <PayPerByte />
        <GridFails />
        <Devices />
        <Operators />
        <Laws />
        <TrustedParties />
        <Roadmap />
        <Faq />
        <DocsAndRepo />
      </main>

      <footer className="xk-footer">
        <div className="xk-wrap xk-footer__inner">
          <span className="xk-mono">xthukuh/x-koin</span>
          <span>
            Decentralized hybrid PLC and LoRa mesh with trust-minimized state-channel
            micro-settlement and M-Pesa or Equitel fiat bridging.
          </span>
          <nav aria-label="Site">
            <Link to="/map">Route map</Link>
            <Link to="/docs">Docs</Link>
            <Link to="/shop">Shop</Link>
            <a href="https://github.com/xthukuh/x-koin" rel="noreferrer noopener" target="_blank">
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
