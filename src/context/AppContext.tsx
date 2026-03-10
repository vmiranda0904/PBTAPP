import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Placement = '1st' | '2nd' | '3rd' | '4th' | 'participant' | null;

export interface Player {
  id: string;
  name: string;
  avatar: string;
  position: string;
  totalPoints: number;
  practiceAttendance: number;
  tournamentsPlayed: number;
  wins: number;
  losses: number;
  placements: Record<string, number>; // '1st':n, '2nd':n, '3rd':n, '4th':n
  stats: {
    aces: number;
    kills: number;
    errors: number;
    digs: number;
    assists: number;
    blocks: number;
  };
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  channel: string; // 'team' | playerId for DMs
}

export type EventType = 'practice' | 'tournament';

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // ISO date string
  time: string;
  location: string;
  description: string;
  attendees: string[]; // player IDs
}

export interface HeatMapPoint {
  x: number;  // 0–100 percentage across court width
  y: number;  // 0–100 percentage across court height
  value: number; // intensity
  type: 'attack' | 'defense';
}

export interface TournamentResult {
  id: string;
  tournamentId: string;
  tournamentName: string;
  playerId: string;
  placement: Placement;
  date: string;
  pointsAwarded: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLACEMENT_BONUS: Record<string, number> = {
  '1st': 50,
  '2nd': 40,
  '3rd': 30,
  '4th': 20,
  participant: 0,
};

// eslint-disable-next-line react-refresh/only-export-components
export function calcTournamentPoints(placement: Placement): number {
  if (!placement) return 0;
  return 10 + (PLACEMENT_BONUS[placement] ?? 0);
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_PLAYERS: Player[] = [
  {
    id: 'p1', name: 'Alex Rivera', avatar: 'AR', position: 'Outside Hitter',
    totalPoints: 170, practiceAttendance: 8, tournamentsPlayed: 3, wins: 12, losses: 4,
    placements: { '1st': 1, '2nd': 1, '3rd': 0, '4th': 1 },
    stats: { aces: 24, kills: 87, errors: 15, digs: 42, assists: 8, blocks: 11 },
  },
  {
    id: 'p2', name: 'Jordan Blake', avatar: 'JB', position: 'Setter',
    totalPoints: 130, practiceAttendance: 6, tournamentsPlayed: 2, wins: 8, losses: 5,
    placements: { '1st': 0, '2nd': 1, '3rd': 1, '4th': 0 },
    stats: { aces: 10, kills: 30, errors: 12, digs: 55, assists: 120, blocks: 5 },
  },
  {
    id: 'p3', name: 'Morgan Chen', avatar: 'MC', position: 'Libero',
    totalPoints: 100, practiceAttendance: 5, tournamentsPlayed: 2, wins: 7, losses: 6,
    placements: { '1st': 0, '2nd': 0, '3rd': 1, '4th': 1 },
    stats: { aces: 6, kills: 18, errors: 8, digs: 98, assists: 15, blocks: 2 },
  },
  {
    id: 'p4', name: 'Taylor Davis', avatar: 'TD', position: 'Middle Blocker',
    totalPoints: 80, practiceAttendance: 4, tournamentsPlayed: 1, wins: 5, losses: 4,
    placements: { '1st': 0, '2nd': 0, '3rd': 0, '4th': 1 },
    stats: { aces: 18, kills: 65, errors: 20, digs: 22, assists: 5, blocks: 34 },
  },
  {
    id: 'p5', name: 'Sam Nguyen', avatar: 'SN', position: 'Opposite Hitter',
    totalPoints: 60, practiceAttendance: 3, tournamentsPlayed: 1, wins: 4, losses: 5,
    placements: { '1st': 0, '2nd': 0, '3rd': 0, '4th': 0 },
    stats: { aces: 14, kills: 58, errors: 22, digs: 19, assists: 3, blocks: 9 },
  },
];

const SAMPLE_MESSAGES: Message[] = [
  {
    id: 'm1', senderId: 'p1', senderName: 'Alex Rivera',
    content: 'Great practice today everyone! Let\'s keep the energy up for the tournament this weekend.',
    timestamp: new Date(Date.now() - 3600000), channel: 'team',
  },
  {
    id: 'm2', senderId: 'p2', senderName: 'Jordan Blake',
    content: 'Reminder: we have a film session Thursday at 6PM. Don\'t forget!',
    timestamp: new Date(Date.now() - 1800000), channel: 'team',
  },
  {
    id: 'm3', senderId: 'p3', senderName: 'Morgan Chen',
    content: 'Can someone review my serve reception stats? I think I can improve.',
    timestamp: new Date(Date.now() - 900000), channel: 'team',
  },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: 'e1', title: 'Weekly Practice', type: 'practice',
    date: fmt(addDays(today, 2)), time: '18:00', location: 'Main Gym',
    description: 'Focus on serve and reception drills.',
    attendees: ['p1', 'p2', 'p3', 'p4', 'p5'],
  },
  {
    id: 'e2', title: 'Regional Tournament', type: 'tournament',
    date: fmt(addDays(today, 5)), time: '09:00', location: 'Sports Complex Arena',
    description: 'Regional qualifier tournament. All players must arrive 30 min early.',
    attendees: ['p1', 'p2', 'p3', 'p4', 'p5'],
  },
  {
    id: 'e3', title: 'Team Practice', type: 'practice',
    date: fmt(addDays(today, 9)), time: '17:30', location: 'Main Gym',
    description: 'Blocking and attack patterns.',
    attendees: ['p1', 'p2', 'p3'],
  },
  {
    id: 'e4', title: 'City Championship', type: 'tournament',
    date: fmt(addDays(today, 14)), time: '10:00', location: 'Downtown Sports Hall',
    description: 'Annual city championship.',
    attendees: ['p1', 'p2', 'p3', 'p4', 'p5'],
  },
];

const SAMPLE_HEATMAP: HeatMapPoint[] = [
  { x: 15, y: 20, value: 80, type: 'attack' },
  { x: 50, y: 10, value: 60, type: 'attack' },
  { x: 80, y: 25, value: 90, type: 'attack' },
  { x: 30, y: 40, value: 40, type: 'attack' },
  { x: 65, y: 35, value: 70, type: 'attack' },
  { x: 20, y: 70, value: 55, type: 'defense' },
  { x: 50, y: 80, value: 85, type: 'defense' },
  { x: 75, y: 65, value: 45, type: 'defense' },
  { x: 40, y: 55, value: 65, type: 'defense' },
  { x: 85, y: 80, value: 75, type: 'defense' },
];

const SAMPLE_RESULTS: TournamentResult[] = [
  {
    id: 'r1', tournamentId: 't1', tournamentName: 'Spring Open',
    playerId: 'p1', placement: '1st', date: fmt(addDays(today, -30)),
    pointsAwarded: calcTournamentPoints('1st'),
  },
  {
    id: 'r2', tournamentId: 't1', tournamentName: 'Spring Open',
    playerId: 'p2', placement: '2nd', date: fmt(addDays(today, -30)),
    pointsAwarded: calcTournamentPoints('2nd'),
  },
  {
    id: 'r3', tournamentId: 't2', tournamentName: 'Summer Classic',
    playerId: 'p1', placement: '4th', date: fmt(addDays(today, -14)),
    pointsAwarded: calcTournamentPoints('4th'),
  },
  {
    id: 'r4', tournamentId: 't2', tournamentName: 'Summer Classic',
    playerId: 'p3', placement: '3rd', date: fmt(addDays(today, -14)),
    pointsAwarded: calcTournamentPoints('3rd'),
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextType {
  players: Player[];
  messages: Message[];
  events: CalendarEvent[];
  heatMapPoints: HeatMapPoint[];
  tournamentResults: TournamentResult[];
  currentUserId: string;

  sendMessage: (content: string, channel: string) => void;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  recordPracticeAttendance: (playerId: string, eventId: string) => void;
  recordTournamentResult: (playerId: string, tournamentName: string, placement: Placement, date: string) => void;
  addHeatMapPoint: (point: Omit<HeatMapPoint, 'value'> & { value?: number }) => void;
  updatePlayerStats: (playerId: string, stats: Partial<Player['stats']>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('pbt_players');
    return saved ? JSON.parse(saved) : SAMPLE_PLAYERS;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('pbt_messages');
    return saved ? JSON.parse(saved, (k, v) => k === 'timestamp' ? new Date(v) : v) : SAMPLE_MESSAGES;
  });
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('pbt_events');
    return saved ? JSON.parse(saved) : SAMPLE_EVENTS;
  });
  const [heatMapPoints, setHeatMapPoints] = useState<HeatMapPoint[]>(SAMPLE_HEATMAP);
  const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>(() => {
    const saved = localStorage.getItem('pbt_results');
    return saved ? JSON.parse(saved) : SAMPLE_RESULTS;
  });

  const currentUserId = 'p1'; // Logged-in user

  useEffect(() => { localStorage.setItem('pbt_players', JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('pbt_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('pbt_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('pbt_results', JSON.stringify(tournamentResults)); }, [tournamentResults]);

  const sendMessage = useCallback((content: string, channel: string) => {
    const sender = players.find(p => p.id === currentUserId);
    if (!sender) return;
    setMessages(prev => [...prev, {
      id: `m${Date.now()}`,
      senderId: currentUserId,
      senderName: sender.name,
      content,
      timestamp: new Date(),
      channel,
    }]);
  }, [players, currentUserId]);

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    setEvents(prev => [...prev, { ...event, id: `e${Date.now()}` }]);
  }, []);

  const recordPracticeAttendance = useCallback((playerId: string, _eventId: string) => {
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, practiceAttendance: p.practiceAttendance + 1, totalPoints: p.totalPoints + 10 }
        : p
    ));
  }, []);

  const recordTournamentResult = useCallback((
    playerId: string, tournamentName: string, placement: Placement, date: string
  ) => {
    const points = calcTournamentPoints(placement);
    const newResult: TournamentResult = {
      id: `r${Date.now()}`,
      tournamentId: `t${Date.now()}`,
      tournamentName,
      playerId,
      placement,
      date,
      pointsAwarded: points,
    };
    setTournamentResults(prev => [...prev, newResult]);
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const newPlacements = { ...p.placements };
      if (placement && placement !== 'participant') {
        newPlacements[placement] = (newPlacements[placement] || 0) + 1;
      }
      return {
        ...p,
        totalPoints: p.totalPoints + points,
        tournamentsPlayed: p.tournamentsPlayed + 1,
        placements: newPlacements,
      };
    }));
  }, []);

  const addHeatMapPoint = useCallback((point: Omit<HeatMapPoint, 'value'> & { value?: number }) => {
    setHeatMapPoints(prev => [...prev, { ...point, value: point.value ?? 70 }]);
  }, []);

  const updatePlayerStats = useCallback((playerId: string, stats: Partial<Player['stats']>) => {
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, stats: { ...p.stats, ...stats } }
        : p
    ));
  }, []);

  return (
    <AppContext.Provider value={{
      players, messages, events, heatMapPoints, tournamentResults, currentUserId,
      sendMessage, addEvent, recordPracticeAttendance, recordTournamentResult,
      addHeatMapPoint, updatePlayerStats,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
