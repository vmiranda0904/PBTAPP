import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { format, parseISO, isAfter } from 'date-fns';
import { Trophy, Star, Users, CalendarDays, TrendingUp, MessageSquare } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function Dashboard() {
  const { players, events, messages, tournamentResults } = useApp();

  const sorted = [...players].sort((a, b) => b.totalPoints - a.totalPoints);
  const topPlayer = sorted[0];

  const upcomingEvents = events
    .filter(e => isAfter(parseISO(e.date), new Date()))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const recentMessages = [...messages]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  const pointsData = sorted.map(p => ({
    name: p.name.split(' ')[0],
    points: p.totalPoints,
  }));

  const stats = [
    { label: 'Total Players', value: players.length, icon: Users, color: 'blue' },
    { label: 'Upcoming Events', value: upcomingEvents.length, icon: CalendarDays, color: 'green' },
    { label: 'Tournaments Tracked', value: new Set(tournamentResults.map(r => r.tournamentId)).size, icon: Trophy, color: 'yellow' },
    { label: 'Total Points Awarded', value: players.reduce((s, p) => s + p.totalPoints, 0), icon: Star, color: 'purple' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Welcome back, {players.find(p => p.id === 'p1')?.name}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${colorMap[color]}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Points Chart */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-blue-400" />
            <h2 className="text-white font-semibold">Player Points</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pointsData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                cursor={{ fill: 'rgba(59,130,246,0.1)' }}
              />
              <Bar dataKey="points" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Player */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-yellow-400" />
            <h2 className="text-white font-semibold">Top Player</h2>
          </div>
          {topPlayer && (
            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                {topPlayer.avatar}
              </div>
              <p className="text-white font-semibold">{topPlayer.name}</p>
              <p className="text-slate-400 text-sm">{topPlayer.position}</p>
              <div className="mt-3 bg-slate-700/50 rounded-lg p-3">
                <p className="text-yellow-400 text-2xl font-bold">{topPlayer.totalPoints}</p>
                <p className="text-slate-400 text-xs">Total Points</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <p className="text-white font-semibold text-sm">{topPlayer.wins}</p>
                  <p className="text-slate-400 text-xs">Wins</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <p className="text-white font-semibold text-sm">{topPlayer.losses}</p>
                  <p className="text-slate-400 text-xs">Losses</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <p className="text-white font-semibold text-sm">{topPlayer.placements['1st'] || 0}</p>
                  <p className="text-slate-400 text-xs">1st Place</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Upcoming Events */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-green-400" />
              <h2 className="text-white font-semibold">Upcoming Events</h2>
            </div>
            <Link to="/calendar" className="text-blue-400 text-xs hover:underline">View all</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-slate-400 text-sm">No upcoming events.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium mt-0.5 ${
                    ev.type === 'tournament' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {ev.type === 'tournament' ? 'TOURN' : 'PRAC'}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{ev.title}</p>
                    <p className="text-slate-400 text-xs">{format(parseISO(ev.date), 'MMM d, yyyy')} · {ev.time} · {ev.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Messages */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-purple-400" />
              <h2 className="text-white font-semibold">Recent Messages</h2>
            </div>
            <Link to="/communication" className="text-blue-400 text-xs hover:underline">Open chat</Link>
          </div>
          {recentMessages.length === 0 ? (
            <p className="text-slate-400 text-sm">No recent messages.</p>
          ) : (
            <div className="space-y-3">
              {recentMessages.map(msg => (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 text-xs font-bold flex-shrink-0">
                    {msg.senderName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-300 text-xs font-medium">{msg.senderName}</p>
                    <p className="text-slate-400 text-xs truncate">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
