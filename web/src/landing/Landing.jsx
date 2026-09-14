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
import Footer from '../shell/Footer.jsx';
import Topbar from '../shell/Topbar.jsx';
import '../shell/shell.css';
import './landing.css';

/** The landing page's own section anchors, shown after the site links. */
const SECTIONS = [
  ['#how', 'How it works'],
  ['#devices', 'Devices'],
  ['#operators', 'Operators'],
  ['#laws', 'Security'],
  ['#roadmap', 'Roadmap'],
];

export default function Landing() {
  return (
    <div className="xk-shell xk-page xk-landing">
      <Topbar
        extra={SECTIONS.map(([href, label]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      />

      <main className="xk-shell__main" id="top">
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

      <Footer />
    </div>
  );
}
