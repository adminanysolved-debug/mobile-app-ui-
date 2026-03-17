import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Vendors from './pages/Vendors';
import Dreams from './pages/Dreams';
import Social from './pages/Social';
import Marketplace from './pages/Marketplace';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="dreams" element={<Dreams />} />
            <Route path="social" element={<Social />} />
            <Route path="notifications" element={<div className="text-slate-400">Notifications under construction</div>} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="gallery" element={<div className="text-slate-400">Gallery oversight under construction</div>} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
