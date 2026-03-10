import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
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
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
