import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Dreams from './pages/Dreams';
import Social from './pages/Social';
import Marketplace from './pages/Marketplace';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="dreams" element={<Dreams />} />
          <Route path="social" element={<Social />} />
          <Route path="notifications" element={<div className="text-slate-400">Notifications under construction</div>} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="gallery" element={<div className="text-slate-400">Gallery oversight under construction</div>} />
          <Route path="settings" element={<div className="text-slate-400">Settings under construction</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
