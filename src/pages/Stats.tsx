import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Player } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
} from 'recharts';

const STAT_KEYS = ['aces', 'kills', 'errors', 'digs', 'assists', 'blocks'] as const;

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' },
  cursor: { fill: 'rgba(59,130,246,0.1)' },
};

export default function Stats() {
  const { players, updatePlayerStats, currentUserId } = useApp();
  const [selectedId, setSelectedId] = useState(players[0]?.id ?? '');
  const [editingStats, setEditingStats] = useState(false);
  const [draftStats, setDraftStats] = useState<Partial<Player['stats']>>({});

  const player = players.find(p => p.id === selectedId);

  const radarData = player ? STAT_KEYS.map(k => ({
    stat: k.charAt(0).toUpperCase() + k.slice(1),
    value: player.stats[k],
    fullMark: 150,
  })) : [];

  const comparisonData = STAT_KEYS.map(k => {
    const entry: Record<string, string | number> = { stat: k.charAt(0).toUpperCase() + k.slice(1) };
    players.forEach(p => { entry[p.name.split(' ')[0]] = p.stats[k]; });
    return entry;
  });

  const winRateData = players.map(p => ({
    name: p.name.split(' ')[0],
    winRate: p.wins + p.losses > 0 ? Math.round((p.wins / (p.wins + p.losses)) * 100) : 0,
    wins: p.wins,
    losses: p.losses,
  }));

  const startEdit = () => {
    if (!player) return;
    setDraftStats({ ...player.stats });
    setEditingStats(true);
  };

  const saveEdit = () => {
    updatePlayerStats(selectedId, draftStats);
    setEditingStats(false);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div>
      <PageHeader title="Stats & Analysis" subtitle="Track and analyze team and individual performance" />

      {/* Player Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {players.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            style={selectedId === p.id ? { borderColor: COLORS[i % COLORS.length], backgroundColor: COLORS[i % COLORS.length] + '20', color: 'white' } : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors ${
              selectedId === p.id
                ? 'text-white'
                : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
            }`}
          >
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: COLORS[i % COLORS.length] }}>
              {p.avatar}
            </span>
            {p.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {player && (
        <>
          {/* Player summary cards */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
            {STAT_KEYS.map((k) => (
              <div key={k} className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
                {editingStats && player.id === currentUserId ? (
                  <input
                    type="number"
                    value={draftStats[k] ?? 0}
                    onChange={e => setDraftStats(prev => ({ ...prev, [k]: Number(e.target.value) }))}
                    className="w-full text-center text-white bg-slate-700 rounded p-1 text-lg font-bold focus:outline-none"
                  />
                ) : (
                  <p className="text-white text-xl font-bold">{player.stats[k]}</p>
                )}
                <p className="text-slate-400 text-xs mt-0.5 capitalize">{k}</p>
              </div>
            ))}
          </div>

          {player.id === currentUserId && (
            <div className="mb-4 flex gap-2">
              {editingStats ? (
                <>
                  <button onClick={saveEdit} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500">Save Stats</button>
                  <button onClick={() => setEditingStats(false)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600">Cancel</button>
                </>
              ) : (
                <button onClick={startEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">Edit My Stats</button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Radar */}
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-white font-semibold mb-4">{player.name} — Performance Radar</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Radar name={player.name} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                  <Tooltip {...TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Win Rate */}
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-white font-semibold mb-4">Win Rate Comparison</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={winRateData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                    formatter={(v) => [`${v}%`, 'Win Rate']}
                  />
                  <Bar dataKey="winRate" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Comparison */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-white font-semibold mb-4">Team Stats Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="stat" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                {players.map((p, i) => (
                  <Bar key={p.id} dataKey={p.name.split(' ')[0]} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
