import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Radio,
  BarChart2,
  Map,
  CalendarDays,
  Star,
  Trophy,
  Crown,
  Download,
  CheckCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/communication', label: 'Communication', icon: MessageSquare },
  { to: '/livestream', label: 'Live Stream', icon: Radio },
  { to: '/stats', label: 'Stats & Analysis', icon: BarChart2 },
  { to: '/heatmap', label: 'Heat Map', icon: Map },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/points', label: 'Points System', icon: Star },
  { to: '/rankings', label: 'Rankings', icon: Trophy },
  { to: '/membership', label: 'Membership', icon: Crown },
];

export default function Sidebar() {
  const { players, currentUserId } = useApp();
  const { logout, isAdmin } = useAuth();
  const me = players.find(p => p.id === currentUserId);
  const { canInstall, isInstalled, triggerInstall } = useInstallPrompt();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col min-h-screen">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
            PBT
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">PBT Sports</p>
            <p className="text-slate-400 text-xs mt-0.5">Team Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {/* Admin Panel link — only visible to admins */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-400 hover:text-white hover:bg-amber-600/20'
              }`
            }
          >
            <ShieldCheck size={18} />
            Admin Panel
          </NavLink>
        )}
      </nav>

      {/* Install App */}
      <div className="px-3 pb-3">
        {isInstalled ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-400 cursor-default select-none">
            <CheckCircle size={18} />
            App Installed
          </div>
        ) : canInstall ? (
          <button
            onClick={triggerInstall}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Download size={18} />
            Download App
          </button>
        ) : (
          <a
            href="https://github.com/vmiranda0904/PBTAPP/archive/refs/heads/main.zip"
            download
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Download size={18} />
            <span>Download App</span>
          </a>
        )}
      </div>

      {/* Current User */}
      {me && (
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {me.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{me.name}</p>
              <p className="text-slate-400 text-xs">{me.position}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
