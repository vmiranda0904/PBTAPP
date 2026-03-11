import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Communication from './pages/Communication';
import LiveStream from './pages/LiveStream';
import Stats from './pages/Stats';
import HeatMap from './pages/HeatMap';
import Calendar from './pages/Calendar';
import Points from './pages/Points';
import Rankings from './pages/Rankings';
import Login from './pages/Login';
import ApproveUser from './pages/ApproveUser';
import AdminPanel from './pages/AdminPanel';
import Membership from './pages/Membership';

function AuthRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <Login />;
}

function ProtectedApp() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <AppProvider>
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/livestream" element={<LiveStream />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/heatmap" element={<HeatMap />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/points" element={<Points />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthRedirect />} />
          <Route path="/approve" element={<ApproveUser />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
