import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import type { Player, Placement } from '../context/AppContext';
import {
  ShieldCheck,
  Users,
  Star,
  Trophy,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'players' | 'stats' | 'points' | 'events';

const ROLES = [
  'Parent',
  'Player',
  'Coach',
  'Admin',
];

const PLACEMENTS: Placement[] = ['1st', '2nd', '3rd', '4th', 'participant'];

const emptyPlayerForm = (): Omit<Player, 'id'> => ({
  name: '',
  avatar: '',
  role: 'Player',
  totalPoints: 0,
  practiceAttendance: 0,
  tournamentsPlayed: 0,
  wins: 0,
  losses: 0,
  placements: { '1st': 0, '2nd': 0, '3rd': 0, '4th': 0 },
  stats: { aces: 0, kills: 0, errors: 0, digs: 0, assists: 0, blocks: 0 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Navigate to="/" replace />;

  return <AdminPanelInner />;
}

function AdminPanelInner() {
  const [activeTab, setActiveTab] = useState<Tab>('players');

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'players', label: 'Players', icon: Users },
    { id: 'stats', label: 'Stats', icon: Trophy },
    { id: 'points', label: 'Points', icon: Star },
    { id: 'events', label: 'Events', icon: CalendarDays },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={22} className="text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </div>
        <p className="text-slate-400 text-sm">Manage players, stats, points, and events.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 rounded-xl p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'players' && <PlayersTab />}
      {activeTab === 'stats' && <StatsTab />}
      {activeTab === 'points' && <PointsTab />}
      {activeTab === 'events' && <EventsTab />}
    </div>
  );
}

// ─── Players Tab ──────────────────────────────────────────────────────────────

function PlayersTab() {
  const { players, addPlayer, updatePlayer, removePlayer } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Player, 'id'>>(emptyPlayerForm());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function openAdd() {
    setForm(emptyPlayerForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(player: Player) {
    setForm({ ...player });
    setEditingId(player.id);
    setShowForm(true);
  }

  function handleSave() {
    const name = form.name.trim();
    if (!name) return;
    const filledForm = { ...form, avatar: initials(name) };
    if (editingId) {
      updatePlayer(editingId, filledForm);
    } else {
      addPlayer(filledForm);
    }
    setShowForm(false);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    removePlayer(id);
    setConfirmDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{players.length} player{players.length !== 1 ? 's' : ''}</p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Add Player
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-800 rounded-xl border border-blue-500/40 p-5 space-y-4">
          <h3 className="text-white font-semibold">{editingId ? 'Edit Player' : 'Add New Player'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs block mb-1">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Role</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Wins</label>
              <input
                type="number"
                min={0}
                value={form.wins}
                onChange={e => setForm(f => ({ ...f, wins: Math.max(0, Number(e.target.value)) }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Losses</label>
              <input
                type="number"
                min={0}
                value={form.losses}
                onChange={e => setForm(f => ({ ...f, losses: Math.max(0, Number(e.target.value)) }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Save size={14} /> {editingId ? 'Save Changes' : 'Add Player'}
            </button>
          </div>
        </div>
      )}

      {/* Player list */}
      <div className="space-y-2">
        {players.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">No players yet. Add one above.</p>
        )}
        {players.map(player => (
          <div
            key={player.id}
            className="flex items-center justify-between gap-4 bg-slate-800 rounded-xl border border-slate-700 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-sm flex-shrink-0">
                {player.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{player.name}</p>
                <p className="text-slate-400 text-xs truncate">
                  {player.role} · {player.totalPoints} pts · {player.wins}W {player.losses}L
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => openEdit(player)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Edit player"
              >
                <Pencil size={15} />
              </button>
              {confirmDelete === player.id ? (
                <>
                  <span className="text-red-400 text-xs">Delete?</span>
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded-lg transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded-lg transition-colors"
                  >
                    No
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(player.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete player"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

const STAT_KEYS = ['aces', 'kills', 'errors', 'digs', 'assists', 'blocks'] as const;
type StatKey = typeof STAT_KEYS[number];

function StatsTab() {
  const { players, updatePlayerStats, updatePlayer } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statForm, setStatForm] = useState<Player['stats']>({ aces: 0, kills: 0, errors: 0, digs: 0, assists: 0, blocks: 0 });
  const [generalForm, setGeneralForm] = useState({ wins: 0, losses: 0, practiceAttendance: 0, tournamentsPlayed: 0 });

  function openEdit(player: Player) {
    setStatForm({ ...player.stats });
    setGeneralForm({
      wins: player.wins,
      losses: player.losses,
      practiceAttendance: player.practiceAttendance,
      tournamentsPlayed: player.tournamentsPlayed,
    });
    setEditingId(player.id);
  }

  function handleSave() {
    if (!editingId) return;
    updatePlayerStats(editingId, statForm);
    updatePlayer(editingId, generalForm);
    setEditingId(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-slate-400 text-sm">Select a player to edit their stats.</p>

      {players.map(player => (
        <div key={player.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {/* Player header */}
          <button
            onClick={() => editingId === player.id ? setEditingId(null) : openEdit(player)}
            className="w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-xs">
                {player.avatar}
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-medium">{player.name}</p>
                <p className="text-slate-400 text-xs">{player.role}</p>
              </div>
            </div>
            <Pencil size={15} className={`flex-shrink-0 ${editingId === player.id ? 'text-blue-400' : 'text-slate-500'}`} />
          </button>

          {/* Edit form */}
          {editingId === player.id && (
            <div className="border-t border-slate-700 px-4 py-4 space-y-4">
              {/* Game stats */}
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Game Stats</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {STAT_KEYS.map(key => (
                    <div key={key}>
                      <label className="text-slate-400 text-xs block mb-1 capitalize">{key}</label>
                      <input
                        type="number"
                        min={0}
                        value={statForm[key as StatKey]}
                        onChange={e => setStatForm(f => ({ ...f, [key]: Math.max(0, Number(e.target.value)) }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* General stats */}
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Season Stats</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['wins', 'losses', 'practiceAttendance', 'tournamentsPlayed'] as const).map(key => (
                    <div key={key}>
                      <label className="text-slate-400 text-xs block mb-1">
                        {key === 'practiceAttendance' ? 'Practices' : key === 'tournamentsPlayed' ? 'Tournaments' : key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={generalForm[key]}
                        onChange={e => setGeneralForm(f => ({ ...f, [key]: Math.max(0, Number(e.target.value)) }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setEditingId(null)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <Save size={14} /> Save Stats
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Points Tab ───────────────────────────────────────────────────────────────

function PointsTab() {
  const { players, tournamentResults, awardPoints, removeTournamentResult, recordTournamentResult } = useApp();
  const firstPlayerId = players[0]?.id ?? '';
  const [selectedPlayerId, setSelectedPlayerId] = useState(firstPlayerId);
  const [awardAmount, setAwardAmount] = useState(10);
  const [awardReason, setAwardReason] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Tournament result form
  const [showTournForm, setShowTournForm] = useState(false);
  const [tournName, setTournName] = useState('');
  const [tournPlayerId, setTournPlayerId] = useState(firstPlayerId);
  const [tournPlacement, setTournPlacement] = useState<Placement>('participant');
  const [tournDate, setTournDate] = useState(new Date().toISOString().split('T')[0]);

  // Keep selected IDs in sync if the players list changes (e.g. a player is deleted)
  const validSelectedId = players.find(p => p.id === selectedPlayerId) ? selectedPlayerId : (players[0]?.id ?? '');
  const validTournId = players.find(p => p.id === tournPlayerId) ? tournPlayerId : (players[0]?.id ?? '');

  function handleAward() {
    if (!validSelectedId || !awardReason.trim() || awardAmount === 0) return;
    awardPoints(validSelectedId, awardAmount, awardReason.trim());
    setAwardReason('');
    setAwardAmount(10);
  }

  function handleAddTournament() {
    if (!tournName.trim() || !validTournId) return;
    recordTournamentResult(validTournId, tournName.trim(), tournPlacement, tournDate);
    setTournName('');
    setShowTournForm(false);
  }

  const sortedResults = [...tournamentResults].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Award / Deduct Points */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <h3 className="text-white font-semibold">Award / Deduct Points</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-400 text-xs block mb-1">Player</label>
            <div className="relative">
              <select
                value={validSelectedId}
                onChange={e => setSelectedPlayerId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none"
              >
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Points (use negative to deduct)</label>
            <input
              type="number"
              value={awardAmount}
              onChange={e => setAwardAmount(Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Reason *</label>
            <input
              value={awardReason}
              onChange={e => setAwardReason(e.target.value)}
              placeholder="e.g. MVP bonus"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleAward}
            disabled={!awardReason.trim() || !validSelectedId || awardAmount === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Apply Points
          </button>
        </div>
      </div>

      {/* Add Tournament Result */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Record Tournament Result</h3>
          <button
            onClick={() => setShowTournForm(v => !v)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            {showTournForm ? 'Cancel' : '+ Add Result'}
          </button>
        </div>
        {showTournForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs block mb-1">Tournament Name *</label>
                <input
                  value={tournName}
                  onChange={e => setTournName(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. City Championship"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Date</label>
                <input
                  type="date"
                  value={tournDate}
                  onChange={e => setTournDate(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Player</label>
                <div className="relative">
                  <select
                    value={validTournId}
                    onChange={e => setTournPlayerId(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none"
                  >
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Placement</label>
                <div className="relative">
                  <select
                    value={tournPlacement ?? 'participant'}
                    onChange={e => setTournPlacement(e.target.value as Placement)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none"
                  >
                    {PLACEMENTS.map(p => (
                      <option key={String(p)} value={String(p)}>{String(p)}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddTournament}
                disabled={!tournName.trim() || !validTournId}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Save size={14} /> Save Result
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Points history */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="text-white font-semibold mb-4">Points History ({sortedResults.length})</h3>
        {sortedResults.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No records yet.</p>
        ) : (
          <div className="space-y-2">
            {sortedResults.map(result => {
              const player = players.find(p => p.id === result.playerId);
              return (
                <div
                  key={result.id}
                  className="flex items-center justify-between gap-4 bg-slate-700/50 rounded-lg px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {player?.name ?? 'Unknown'} — {result.tournamentName}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {result.date} · {result.placement ?? 'manual'} · +{result.pointsAwarded} pts
                    </p>
                  </div>
                  {confirmDeleteId === result.id ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-red-400 text-xs">Remove?</span>
                      <button
                        onClick={() => { removeTournamentResult(result.id); setConfirmDeleteId(null); }}
                        className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded-lg"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded-lg"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(result.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                      title="Remove record"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Events Tab ───────────────────────────────────────────────────────────────

function EventsTab() {
  const { events, addEvent, removeEvent } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'practice' as 'practice' | 'tournament',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    location: '',
    description: '',
  });

  function handleSave() {
    if (!form.title.trim()) return;
    addEvent({ ...form, attendees: [] });
    setForm({
      title: '',
      type: 'practice',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      location: '',
      description: '',
    });
    setShowForm(false);
  }

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-xl border border-blue-500/40 p-5 space-y-4">
          <h3 className="text-white font-semibold">Add New Event</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs block mb-1">Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Event title"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Type</label>
              <div className="relative">
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as 'practice' | 'tournament' }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none"
                >
                  <option value="practice">Practice</option>
                  <option value="tournament">Tournament</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Location</label>
              <input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Venue or gym"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Optional details"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Save size={14} /> Add Event
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sortedEvents.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">No events yet. Add one above.</p>
        )}
        {sortedEvents.map(ev => (
          <div
            key={ev.id}
            className="flex items-center justify-between gap-4 bg-slate-800 rounded-xl border border-slate-700 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                ev.type === 'tournament' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                {ev.type === 'tournament' ? 'TOURN' : 'PRAC'}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{ev.title}</p>
                <p className="text-slate-400 text-xs truncate">{ev.date} · {ev.time} · {ev.location}</p>
              </div>
            </div>
            {confirmDelete === ev.id ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-red-400 text-xs">Delete?</span>
                <button
                  onClick={() => { removeEvent(ev.id); setConfirmDelete(null); }}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded-lg"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-xs bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded-lg"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(ev.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                title="Delete event"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
