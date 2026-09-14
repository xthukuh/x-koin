import { Route, Routes } from 'react-router-dom';

import Landing from './landing/Landing.jsx';
import Blueprints from './routes/Blueprints.jsx';
import Docs from './routes/Docs.jsx';
import Investors from './routes/Investors.jsx';
import Landlord from './routes/Landlord.jsx';
import Manufacturing from './routes/Manufacturing.jsx';
import NotFound from './routes/NotFound.jsx';
import Replay from './routes/Replay.jsx';
import Shop from './routes/Shop.jsx';
import Sitemap from './routes/Sitemap.jsx';
import Slides from './routes/Slides.jsx';
import Startup from './routes/Startup.jsx';
import Shell from './shell/Shell.jsx';

/**
 * Every route renders inside the shared Shell (topbar, footer, document
 * title). The landing page is the one exception: it mounts its own Shell so it
 * can add its section anchors to the topbar. Routes and their labels live in
 * shell/nav.js; add a page there first, then here.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Shell />}>
        <Route path="/docs" element={<Docs />} />
        <Route path="/docs/*" element={<Docs />} />
        <Route path="/investors" element={<Investors />} />
        <Route path="/startup" element={<Startup />} />
        <Route path="/replay" element={<Replay />} />
        <Route path="/blueprints" element={<Blueprints />} />
        <Route path="/manufacturing" element={<Manufacturing />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/slides" element={<Slides />} />
        <Route path="/landlord" element={<Landlord />} />
        <Route path="/map" element={<Sitemap />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
