import { Route, Routes } from 'react-router-dom';

import Docs from './routes/Docs.jsx';
import Home from './routes/Home.jsx';
import Legacy from './routes/Legacy.jsx';
import NotFound from './routes/NotFound.jsx';
import Shop from './routes/Shop.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/docs/*" element={<Docs />} />
      <Route
        path="/investors"
        element={<Legacy file="investors.html" title="Investor demo" />}
      />
      <Route
        path="/landlord"
        element={<Legacy file="landlord.html" title="Landlord pilot" />}
      />
      <Route path="/replay" element={<Legacy file="replay.html" title="Protocol replay" />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
