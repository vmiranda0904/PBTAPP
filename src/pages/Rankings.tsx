import { useApp } from '../context/AppContext';
import type { Player } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { Trophy, Star, TrendingUp, Award } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#f97316', '#3b82f6', '#8b5cf6'];
const RANK_LABELS = ['🥇', '🥈', '🥉', '4th', '5th'];

function calcCompetitionScore(player: Player | undefined) {
  if (!player) return 0;
  // Weighted: 1st=5pts, 2nd=3pts, 3rd=2pts, 4th=1pt — per placement, adjusted by win rate
  const placementScore =
    (player.placements['1st'] || 0) * 5 +
    (player.placements['2nd'] || 0) * 3 +
    (player.placements['3rd'] || 0) * 2 +
    (player.placements['4th'] || 0) * 1;

  const winRate = player.wins + player.losses > 0
    ? player.wins / (player.wins + player.losses)
    : 0;

  return Math.round(placementScore * 10 + winRate * 50 + player.tournamentsPlayed * 2);
}

export default function Rankings() {
  const { players } = useApp();

  const ranked = [...players]
    .map(p => ({ ...p, competitionScore: calcCompetitionScore(p) }))
    .sort((a, b) => b.competitionScore - a.competitionScore);

  const pointsLeaderboard = [...players].sort((a, b) => b.totalPoints - a.totalPoints);

  const chartData = ranked.map(p => ({
    name: p.name.split(' ')[0],
    score: p.competitionScore,
    points: p.totalPoints,
  }));

  return (
    <div>
      <PageHeader
        title="Player Rankings"
        subtitle="Competition record rankings and leaderboard"
      />

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {/* 2nd */}
        {ranked[1] && (
          <div className="text-center w-32">
            <div className="w-14 h-14 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
              {ranked[1].avatar}
            </div>
            <p className="text-white font-semibold text-sm">{ranked[1].name.split(' ')[0]}</p>
            <p className="text-slate-400 text-xs mb-2">{ranked[1].competitionScore} pts</p>
            <div className="h-16 bg-slate-600 rounded-t-lg flex items-center justify-center">
              <span className="text-2xl">🥈</span>
            </div>
          </div>
        )}
        {/* 1st */}
        {ranked[0] && (
          <div className="text-center w-36">
            <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-2 ring-4 ring-yellow-300/30">
              {ranked[0].avatar}
            </div>
            <p className="text-white font-bold">{ranked[0].name.split(' ')[0]}</p>
            <p className="text-yellow-400 text-sm font-semibold mb-2">{ranked[0].competitionScore} pts</p>
            <div className="h-24 bg-yellow-600/80 rounded-t-lg flex items-center justify-center">
              <span className="text-3xl">🥇</span>
            </div>
          </div>
        )}
        {/* 3rd */}
        {ranked[2] && (
          <div className="text-center w-32">
            <div className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
              {ranked[2].avatar}
            </div>
            <p className="text-white font-semibold text-sm">{ranked[2].name.split(' ')[0]}</p>
            <p className="text-slate-400 text-xs mb-2">{ranked[2].competitionScore} pts</p>
            <div className="h-12 bg-orange-700/80 rounded-t-lg flex items-center justify-center">
              <span className="text-2xl">🥉</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Full Rankings Table */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-400" />
            <h3 className="text-white font-semibold">Competition Rankings</h3>
          </div>
          <div className="divide-y divide-slate-700/50">
            {ranked.map((player, i) => (
              <div key={player.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-700/30 transition-colors">
                <span className="text-lg w-8 text-center">{RANK_LABELS[i] || `${i + 1}`}</span>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: RANK_COLORS[i % RANK_COLORS.length] }}
                >
                  {player.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{player.name}</p>
                  <p className="text-slate-400 text-xs">{player.role}</p>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-white font-semibold">{player.competitionScore}</p>
                    <p className="text-slate-500 text-xs">Comp. Score</p>
                  </div>
                  <div>
                    <p className="text-yellow-400 font-semibold">{player.totalPoints}</p>
                    <p className="text-slate-500 text-xs">Total Pts</p>
                  </div>
                  <div>
                    <p className="text-green-400 font-semibold">{player.wins}W/{player.losses}L</p>
                    <p className="text-slate-500 text-xs">Record</p>
                  </div>
                  <div className="flex gap-1">
                    {['1st', '2nd', '3rd'].map(p => (
                      (player.placements[p] ?? 0) > 0 && (
                        <span key={p} className="bg-slate-700 text-xs px-1.5 py-0.5 rounded text-slate-300">
                          {player.placements[p]}{p === '1st' ? '🥇' : p === '2nd' ? '🥈' : '🥉'}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-4">
          {/* Score Chart */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-blue-400" />
              <h3 className="text-white font-semibold text-sm">Competition Score</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={RANK_COLORS[i % RANK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Points Leaderboard */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-yellow-400" />
              <h3 className="text-white font-semibold text-sm">Points Leaderboard</h3>
            </div>
            <div className="space-y-2">
              {pointsLeaderboard.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-slate-500 text-sm w-5 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{p.name.split(' ')[0]}</span>
                      <span className="text-yellow-400 font-semibold">{p.totalPoints}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(p.totalPoints / pointsLeaderboard[0].totalPoints) * 100}%`,
                          background: RANK_COLORS[i % RANK_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring formula info */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-purple-400" />
              <h3 className="text-white font-semibold text-sm">Score Formula</h3>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p>🥇 1st Place × 5 pts each</p>
              <p>🥈 2nd Place × 3 pts each</p>
              <p>🥉 3rd Place × 2 pts each</p>
              <p>4th Place × 1 pt each</p>
              <p className="pt-1 border-t border-slate-700">+ Win Rate × 50</p>
              <p>+ Tournaments × 2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
