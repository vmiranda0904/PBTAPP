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
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/communication', label: 'Communication', icon: MessageSquare },
  { to: '/livestream', label: 'Live Stream', icon: Radio },
  { to: '/stats', label: 'Stats & Analysis', icon: BarChart2 },
  { to: '/heatmap', label: 'Heat Map', icon: Map },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/points', label: 'Points System', icon: Star },
  { to: '/rankings', label: 'Rankings', icon: Trophy },
];

export default function Sidebar() {
  const { players, currentUserId } = useApp();
  const me = players.find(p => p.id === currentUserId);

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
      </nav>

      {/* Current User */}
      {me && (
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {me.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{me.name}</p>
              <p className="text-slate-400 text-xs">{me.position}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
