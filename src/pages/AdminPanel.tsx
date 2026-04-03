import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/useAuth';
import { useApp } from '../context/AppContext';
import type { Player, Placement } from '../context/AppContext';
import { getPendingUsersByTeam, type RegisteredUser } from '../lib/userService';
import { getAppSettings, updateAppSettings, type AppSettings } from '../lib/settingsService';
import {
  enableAdminPushNotifications,
  disableAdminPushNotifications,
  getNotificationPermission,
} from '../lib/pushNotificationService';
import { sendStatusNotificationEmail } from '../lib/emailService';
import { getTeamById, type Team } from '../lib/teamService';
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
  Settings,
  UserCheck,
  Bell,
  BellOff,
  Check,
  Ban,
  RefreshCw,
  Copy,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'players' | 'stats' | 'points' | 'events' | 'approvals' | 'settings';

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
    { id: 'approvals', label: 'Approvals', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={22} className="text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </div>
        <p className="text-slate-400 text-sm">Manage players, stats, points, events, approvals, and app settings.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-slate-800 rounded-xl p-1 w-fit">
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
      {activeTab === 'approvals' && <ApprovalsTab />}
      {activeTab === 'settings' && <SettingsTab />}
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

// ─── Approvals Tab ────────────────────────────────────────────────────────────

function ApprovalsTab() {
  const { approveUser, user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const users = user?.teamId
        ? await getPendingUsersByTeam(user.teamId)
        : [];
      setPendingUsers(users);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);// eslint-disable-line react-hooks/exhaustive-deps

  async function handleDecision(uid: string, userName: string, userEmail: string, status: 'approved' | 'rejected') {
    setActionLoading(uid);
    const ok = await approveUser(uid, status);
    if (ok) {
      // Send status notification email to the user
      try {
        await sendStatusNotificationEmail(userName, userEmail, status);
      } catch {
        // email failure is non-blocking
      }
      setPendingUsers(prev => prev.filter(u => u.id !== uid));
      setMessage({ text: `User ${status}.`, ok: true });
    } else {
      setMessage({ text: 'Action failed. Please try again.', ok: false });
    }
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">
          {loading ? 'Loading…' : `${pendingUsers.length} pending approval${pendingUsers.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-2 text-sm ${message.ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {!loading && pendingUsers.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
          No pending approvals.
        </div>
      )}

      <div className="space-y-3">
        {pendingUsers.map(u => (
          <div key={u.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {u.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{u.name}</p>
                <p className="text-slate-400 text-xs truncate">{u.email} · {u.role}</p>
                <p className="text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                disabled={actionLoading === u.id}
                onClick={() => handleDecision(u.id, u.name, u.email, 'approved')}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Check size={13} /> Approve
              </button>
              <button
                disabled={actionLoading === u.id}
                onClick={() => handleDecision(u.id, u.name, u.email, 'rejected')}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Ban size={13} /> Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    setPermissionState(getNotificationPermission());
    const teamId = user?.teamId;
    Promise.all([
      getAppSettings(),
      teamId ? getTeamById(teamId) : Promise.resolve(null),
    ]).then(([s, t]) => {
      setSettings(s);
      setTeam(t);
      setLoading(false);
    });
  }, [user?.teamId]);

  async function handleCopyCode() {
    if (!team) return;
    try {
      await navigator.clipboard.writeText(team.teamCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  function flash(text: string, ok: boolean) {
    setStatusMsg({ text, ok });
    setTimeout(() => setStatusMsg(null), 4000);
  }

  async function handleToggle(key: keyof AppSettings, value: boolean) {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setSaving(true);
    try {
      await updateAppSettings({ [key]: value });
      flash('Setting saved.', true);
    } catch {
      setSettings(settings); // revert
      flash('Failed to save setting.', false);
    } finally {
      setSaving(false);
    }
  }

  async function handleEnablePush() {
    setPushLoading(true);
    try {
      const base = (import.meta.env.BASE_URL as string) ?? '/';
      const swReg = await navigator.serviceWorker.getRegistration(
        `${base}firebase-messaging-sw.js`
      );
      const token = await enableAdminPushNotifications(swReg);
      setPermissionState(getNotificationPermission());
      if (token) {
        setSettings(prev => prev ? { ...prev, pushNotificationsEnabled: true, adminFcmToken: token } : prev);
        await updateAppSettings({ pushNotificationsEnabled: true });
        flash('Push notifications enabled on this device.', true);
      } else {
        flash('Could not get push token. Check browser permissions and VAPID key.', false);
      }
    } catch {
      flash('Failed to enable push notifications.', false);
    } finally {
      setPushLoading(false);
    }
  }

  async function handleDisablePush() {
    setPushLoading(true);
    try {
      await disableAdminPushNotifications();
      setSettings(prev => prev ? { ...prev, pushNotificationsEnabled: false, adminFcmToken: null } : prev);
      flash('Push notifications disabled.', true);
    } catch {
      flash('Failed to disable push notifications.', false);
    } finally {
      setPushLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  const pushSupported = 'Notification' in window && 'serviceWorker' in navigator;

  return (
    <div className="space-y-6 max-w-lg">
      {statusMsg && (
        <div className={`rounded-lg px-4 py-2 text-sm ${statusMsg.ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {statusMsg.text}
        </div>
      )}

      {/* Team Code Section */}
      {team && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Users size={17} className="text-cyan-400" />
            Team Code
          </h2>
          <p className="text-slate-400 text-xs">
            Share this code with players, coaches, and parents so they can join your team when they create their account.
          </p>
          <div className="flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-3">
            <span className="flex-1 text-2xl font-bold tracking-widest text-cyan-400 font-mono">{team.teamCode}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
              title="Copy team code"
            >
              {codeCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {codeCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-slate-500 text-xs">Team: <span className="text-slate-300">{team.teamName}</span></p>
        </div>
      )}

      {/* Security Section */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <ShieldCheck size={17} className="text-amber-400" />
          Security
        </h2>

        {/* Require Approval Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white text-sm font-medium">Require user approval</p>
            <p className="text-slate-400 text-xs mt-0.5">
              When enabled, new sign-ups must be approved by you before they can access the app.
              Disable to auto-approve all new users.
            </p>
          </div>
          <button
            disabled={saving}
            onClick={() => handleToggle('requireApproval', !settings.requireApproval)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 transition-colors ${
              settings.requireApproval ? 'bg-blue-600' : 'bg-slate-600'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                settings.requireApproval ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Bell size={17} className="text-cyan-400" />
          Push Notifications
        </h2>

        {!pushSupported && (
          <p className="text-amber-400 text-xs bg-amber-500/10 rounded-lg px-3 py-2">
            Your browser does not support push notifications.
          </p>
        )}

        {pushSupported && permissionState === 'denied' && (
          <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">
            Notifications are blocked in your browser. Please allow notifications in your browser
            settings and then enable them here.
          </p>
        )}

        {/* Push notifications toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white text-sm font-medium">Notify on new sign-ups</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Receive a push notification on this device whenever someone signs up,
              so you can approve or deny them promptly.
            </p>
          </div>
          <button
            disabled={saving || pushLoading || !pushSupported}
            onClick={() => handleToggle('pushNotificationsEnabled', !settings.pushNotificationsEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 transition-colors ${
              settings.pushNotificationsEnabled ? 'bg-cyan-600' : 'bg-slate-600'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                settings.pushNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Enable / Disable push on this device */}
        {pushSupported && (
          <div className="pt-2 border-t border-slate-700">
            <p className="text-slate-400 text-xs mb-3">
              {settings.adminFcmToken
                ? 'This device is registered to receive push notifications.'
                : 'Register this device to receive push notifications even when the app is closed.'}
            </p>
            {settings.adminFcmToken ? (
              <button
                disabled={pushLoading}
                onClick={handleDisablePush}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {pushLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <BellOff size={15} />
                )}
                Unregister this device
              </button>
            ) : (
              <button
                disabled={pushLoading || permissionState === 'denied'}
                onClick={handleEnablePush}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {pushLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Bell size={15} />
                )}
                Enable push on this device
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
