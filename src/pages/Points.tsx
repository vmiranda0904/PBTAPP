import { useState } from 'react';
import { useApp, calcTournamentPoints, type Placement } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { Star, Trophy, Dumbbell, Plus, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PLACEMENT_INFO: { placement: Placement; label: string; bonus: number; total: number; color: string }[] = [
  { placement: '1st', label: '1st Place', bonus: 50, total: 60, color: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20' },
  { placement: '2nd', label: '2nd Place', bonus: 40, total: 50, color: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
  { placement: '3rd', label: '3rd Place', bonus: 30, total: 40, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { placement: '4th', label: '4th Place', bonus: 20, total: 30, color: 'text-blue-300 bg-blue-500/10 border-blue-500/20' },
  { placement: 'participant', label: 'Participant', bonus: 0, total: 10, color: 'text-slate-400 bg-slate-700/50 border-slate-600/30' },
];

export default function Points() {
  const { players, tournamentResults, recordPracticeAttendance, recordTournamentResult } = useApp();
  const [tab, setTab] = useState<'overview' | 'award' | 'history'>('overview');
  const [awardForm, setAwardForm] = useState({
    playerId: players[0]?.id ?? '',
    type: 'practice' as 'practice' | 'tournament',
    placement: 'participant' as Placement,
    tournamentName: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleAward = (e: React.FormEvent) => {
    e.preventDefault();
    if (awardForm.type === 'practice') {
      recordPracticeAttendance(awardForm.playerId, `prac-${Date.now()}`);
    } else {
      recordTournamentResult(awardForm.playerId, awardForm.tournamentName || 'Tournament', awardForm.placement, awardForm.date);
    }
    alert(`Points awarded successfully! 🎉`);
  };

  const sortedByPoints = [...players].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div>
      <PageHeader
        title="Participation Points System"
        subtitle="Track and award points for practice attendance and tournament performance"
      />

      {/* Point values info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2 mb-3">
          <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <h3 className="text-white font-semibold text-sm">Points Structure</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <Dumbbell size={16} className="text-blue-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">10</p>
            <p className="text-slate-400 text-xs">Practice</p>
          </div>
          {PLACEMENT_INFO.map(({ placement, label, bonus, total, color }) => (
            <div key={placement} className={`rounded-lg p-3 text-center border ${color}`}>
              <Trophy size={16} className="mx-auto mb-1 opacity-80" />
              <p className="font-bold text-lg">{total}</p>
              <p className="text-xs opacity-80">{label}</p>
              <p className="text-xs opacity-60">(10 + {bonus})</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1 mb-6 w-fit border border-slate-700">
        {(['overview', 'award', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedByPoints.map((player, rank) => (
            <div key={player.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    rank === 0 ? 'bg-yellow-500 text-white' :
                    rank === 1 ? 'bg-slate-400 text-white' :
                    rank === 2 ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {player.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium">{player.name}</p>
                    <p className="text-slate-400 text-xs">{player.role}</p>
                  </div>
                </div>
                <span className="text-slate-500 text-sm font-medium">#{rank + 1}</span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="text-yellow-400" />
                  <span className="text-yellow-400 text-2xl font-bold">{player.totalPoints}</span>
                  <span className="text-slate-500 text-sm">pts</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                  <p className="text-blue-300 font-semibold">{player.practiceAttendance}</p>
                  <p className="text-slate-500 text-xs">Practices</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                  <p className="text-green-300 font-semibold">{player.tournamentsPlayed}</p>
                  <p className="text-slate-500 text-xs">Tournaments</p>
                </div>
              </div>

              {/* Placements */}
              <div className="flex gap-1.5 mt-3">
                {(['1st', '2nd', '3rd', '4th'] as const).map(p => (
                  <div key={p} className="flex-1 bg-slate-700/50 rounded text-center py-1">
                    <p className={`text-xs font-semibold ${
                      p === '1st' ? 'text-yellow-400' :
                      p === '2nd' ? 'text-slate-300' :
                      p === '3rd' ? 'text-orange-400' : 'text-blue-300'
                    }`}>{player.placements[p] || 0}</p>
                    <p className="text-slate-500 text-xs">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'award' && (
        <div className="max-w-lg">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-5">
              <Plus size={18} className="text-blue-400" />
              <h3 className="text-white font-semibold">Award Points</h3>
            </div>
            <form onSubmit={handleAward} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Player</label>
                <select value={awardForm.playerId} onChange={e => setAwardForm(f => ({ ...f, playerId: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Event Type</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="practice" checked={awardForm.type === 'practice'} onChange={() => setAwardForm(f => ({ ...f, type: 'practice' }))} className="accent-blue-500" />
                    <span className="text-slate-300 text-sm">Practice (+10 pts)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="tournament" checked={awardForm.type === 'tournament'} onChange={() => setAwardForm(f => ({ ...f, type: 'tournament' }))} className="accent-blue-500" />
                    <span className="text-slate-300 text-sm">Tournament</span>
                  </label>
                </div>
              </div>

              {awardForm.type === 'tournament' && (
                <>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Tournament Name</label>
                    <input value={awardForm.tournamentName} onChange={e => setAwardForm(f => ({ ...f, tournamentName: e.target.value }))}
                      required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="e.g. Regional Championship" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Placement</label>
                    <select value={awardForm.placement ?? 'participant'} onChange={e => setAwardForm(f => ({ ...f, placement: e.target.value as Placement }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                      {PLACEMENT_INFO.map(({ placement, label, total }) => (
                        <option key={placement} value={placement ?? 'participant'}>
                          {label} — {total} pts
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Date</label>
                <input type="date" value={awardForm.date} onChange={e => setAwardForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-300 text-sm">
                  Points to award:{' '}
                  <strong>
                    {awardForm.type === 'practice'
                      ? '10'
                      : calcTournamentPoints(awardForm.placement)} pts
                  </strong>
                </p>
                {awardForm.type === 'tournament' && awardForm.placement !== 'participant' && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    10 (tournament participation) + {calcTournamentPoints(awardForm.placement) - 10} (placement bonus)
                  </p>
                )}
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-500 transition-colors font-medium">
                Award Points
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="text-white font-semibold text-sm">Tournament History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Player</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Tournament</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Placement</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Points</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {[...tournamentResults].sort((a, b) => b.date.localeCompare(a.date)).map(r => {
                  const player = players.find(p => p.id === r.playerId);
                  return (
                    <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-5 py-3 text-white">{player?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{r.tournamentName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          r.placement === '1st' ? 'bg-yellow-500/20 text-yellow-300' :
                          r.placement === '2nd' ? 'bg-slate-500/20 text-slate-300' :
                          r.placement === '3rd' ? 'bg-orange-500/20 text-orange-300' :
                          r.placement === '4th' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-slate-600/20 text-slate-400'
                        }`}>{r.placement || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 text-green-400 font-semibold">+{r.pointsAwarded}</td>
                      <td className="px-4 py-3 text-slate-400">{format(parseISO(r.date), 'MMM d, yyyy')}</td>
                    </tr>
                  );
                })}
                {tournamentResults.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No tournament history yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
