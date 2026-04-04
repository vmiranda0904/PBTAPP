import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Gauge,
  Lock,
  Mic,
  Play,
  Search,
  Share2,
  Shield,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Video,
} from 'lucide-react';
import AiVideoPanel from './components/AiVideoPanel';
import ErrorBoundary from './components/ErrorBoundary';
import ProductPlatformPanel from './components/ProductPlatformPanel';
import { useAthletePrimaryAction } from '@/modules/athlete/useAthletePrimaryAction';
import ProtectedRoute from '@/modules/auth/ProtectedRoute';
import { useAuth } from '@/modules/auth/useAuth';
import { useUserRole, type AppUserRole } from '@/modules/auth/useUserRole';
import {
  getActiveSubscriptions,
  getAthlete,
  getAthletes,
  getStats,
  getStatsForAthletes,
  isSupabaseConfigured,
  subscribeToCheckout,
} from '@/services/api';
import type { AthleteRecord, StatsRecord } from '@/types';
import Login from './pages/Login';

type LiveSnapshot = {
  alerts: string[];
  insights: string[];
  stats: Record<string, number | string>;
  status: 'disabled' | 'connecting' | 'connected' | 'error';
};

type SubscriptionPlan = {
  key: 'athlete' | 'coach' | 'recruiter';
  label: string;
  price: string;
  description: string;
  priceId?: string;
};

type UserRole = 'athlete' | 'coach' | 'recruiter';

type OnboardingProfile = {
  email: string;
  role: UserRole;
  position: string;
  height: string;
  teamName: string;
  organization: string;
};

type ScreenKey = 'athlete' | 'coach' | 'live' | 'recruiter' | 'profile';

type Screen = {
  id: ScreenKey;
  label: string;
  eyebrow: string;
  summary: string;
};

type TeamMessage = {
  id: number;
  channel: string;
  author: string;
  content: string;
  timestamp: string;
};

const screens: Screen[] = [
  { id: 'athlete', label: 'Athlete Dashboard', eyebrow: 'Performance + Exposure', summary: 'Real stats, highlights, and recruiting momentum.' },
  { id: 'coach', label: 'Coach Dashboard', eyebrow: 'Decision Engine', summary: 'Roster production plus live AI insight.' },
  { id: 'live', label: 'Live Game Mode', eyebrow: 'In-game Differentiator', summary: 'Streaming AI insights and live stat updates.' },
  { id: 'recruiter', label: 'Recruiter Dashboard', eyebrow: 'Discovery Engine', summary: 'Search real athletes and open shareable profiles.' },
  { id: 'profile', label: 'Athlete Profile', eyebrow: 'Conversion Page', summary: 'Turn highlights and stats into opportunity.' },
];

const SCORE_RING_PRIMARY = '#22d3ee';
const SCORE_RING_SECONDARY = '#22c55e';
const SCORE_RING_ACCENT_SPAN = 4;
const MIN_TREND_BAR_HEIGHT = 18;
const DEFAULT_TREND_CHART_POINTS = [32, 48, 57, 61, 73, 84, 96];

const athleteProPriceId = import.meta.env.VITE_STRIPE_ATHLETE_PRO_PRICE_ID;
const coachProPriceId = import.meta.env.VITE_STRIPE_COACH_PRO_PRICE_ID;
const recruiterProPriceId = import.meta.env.VITE_STRIPE_RECRUITER_PRO_PRICE_ID;
const defaultAthleteId = import.meta.env.VITE_DEFAULT_ATHLETE_ID?.trim() || null;
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
const activeSubscriptions = new Set<string>(
  (import.meta.env.VITE_ACTIVE_SUBSCRIPTIONS ?? '')
    .split(',')
    .map((value: string) => value.trim().toLowerCase())
    .filter(Boolean),
);

const subscriptionPlans: SubscriptionPlan[] = [
  {
    key: 'athlete',
    label: 'Athlete Pro',
    price: '$12 / month',
    description: 'Unlock highlight generation and premium profile sharing.',
    priceId: athleteProPriceId,
  },
  {
    key: 'coach',
    label: 'Coach Pro',
    price: '$199 / month',
    description: 'Enable advanced decision support and live game workflows.',
    priceId: coachProPriceId,
  },
  {
    key: 'recruiter',
    label: 'Recruiter Pro',
    price: '$149 / month',
    description: 'Save prospects, compare athletes, and streamline discovery.',
    priceId: recruiterProPriceId,
  },
];

const allDashboardRoles: AppUserRole[] = ['admin', 'athlete', 'coach', 'recruiter'];

const pitchSlides = [
  {
    title: 'Slide 1 — Title',
    bullets: ['PRIMEAthletix', 'AI-Powered Athlete Intelligence Platform'],
  },
  {
    title: 'Slide 2 — Problem',
    bullets: ['Coaches waste hours on film', 'Athletes lack exposure', 'Recruiting is inefficient'],
  },
  {
    title: 'Slide 3 — Solution',
    bullets: ['“We turn raw game footage into real-time insights, highlights, and recruiting intelligence.”'],
  },
  {
    title: 'Slide 4 — Product Demo (Screens)',
    bullets: ['Athlete dashboard', 'Coach dashboard', 'Recruiter search'],
  },
  {
    title: 'Slide 5 — How It Works',
    bullets: ['Upload → AI → Stats + Highlights → Insights → Decisions'],
  },
  {
    title: 'Slide 6 — Key Features',
    bullets: ['AI highlight generation', 'live game tracking', 'opponent scouting', 'recruiting platform'],
  },
  {
    title: 'Slide 7 — Market',
    bullets: ['youth sports', 'college recruiting', 'pro development'],
  },
  {
    title: 'Slide 8 — Business Model',
    bullets: ['Athletes ($12/mo)', 'Teams ($199/mo)', 'Recruiters ($149/mo)'],
  },
  {
    title: 'Slide 9 — Traction (even if early)',
    bullets: ['working product', 'live demo', 'initial users'],
  },
  {
    title: 'Slide 10 — Vision',
    bullets: ['“The operating system for sports performance and recruiting.”'],
  },
];

const defaultOnboardingProfile: OnboardingProfile = {
  email: '',
  role: 'athlete',
  position: '',
  height: '',
  teamName: '',
  organization: '',
};

const demoAthletes: AthleteRecord[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Sophia Martinez',
    position: 'OH',
    score: 96,
    highlight_url: null,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Jake Reynolds',
    position: 'Setter',
    score: 91,
    highlight_url: null,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Ava Thompson',
    position: 'MB',
    score: 89,
    highlight_url: null,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Mia Chen',
    position: 'RS',
    score: 87,
    highlight_url: null,
  },
];

const demoStats: StatsRecord[] = [
  { id: 'aaaaaaa1-1111-1111-1111-111111111111', athlete_id: '11111111-1111-1111-1111-111111111111', spikes: 18, sets: 2, serves: 6, errors: 3 },
  { id: 'aaaaaaa2-2222-2222-2222-222222222222', athlete_id: '22222222-2222-2222-2222-222222222222', spikes: 4, sets: 32, serves: 5, errors: 1 },
  { id: 'aaaaaaa3-3333-3333-3333-333333333333', athlete_id: '33333333-3333-3333-3333-333333333333', spikes: 11, sets: 1, serves: 4, errors: 2 },
  { id: 'aaaaaaa4-4444-4444-4444-444444444444', athlete_id: '44444444-4444-4444-4444-444444444444', spikes: 13, sets: 1, serves: 7, errors: 4 },
];

const demoLiveSnapshot: LiveSnapshot = {
  alerts: ['Player 2 is cross-court heavy', 'Serve zone 5 now'],
  insights: ['Commit block if middle slides on 31', 'Voice guidance ready for timeout decisions'],
  stats: {
    touches: 38,
    spikes: 17,
    efficiency: '.344',
    serve_runs: 3,
  },
  status: 'connected',
};

const defaultTeamMessages: TeamMessage[] = [
  { id: 1, channel: 'Announcements', author: 'PRIMEAthletix', content: 'Welcome to the live athlete dashboard.', timestamp: 'Just now' },
  { id: 2, channel: 'Operations', author: 'AI Pipeline', content: 'Stat sync is active and ready for new match data.', timestamp: '2m ago' },
];

function getInitials(name: string) {
  if (!name.trim()) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('');
}

function toWebSocketUrl(baseUrl: string) {
  const normalized = baseUrl.trim().replace(/\/$/, '');
  if (normalized.startsWith('ws://') || normalized.startsWith('wss://')) {
    return `${normalized}/live`;
  }
  return `${normalized.replace(/^http/, 'ws')}/live`;
}

function formatMetric(value?: number | null) {
  return typeof value === 'number' ? String(value) : '—';
}

function formatScore(value?: number | null) {
  return typeof value === 'number' ? value.toFixed(0) : '—';
}

function calculateEfficiency(stats?: StatsRecord | null) {
  if (!stats || !stats.spikes) return 0;
  return Math.max(0, ((stats.spikes - stats.errors) / stats.spikes) * 100);
}

function averageScore(athletes: AthleteRecord[]) {
  const scores = athletes.map((athlete) => athlete.score).filter((score): score is number => typeof score === 'number');
  if (!scores.length) return null;
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function getScreenMeta(screenId: ScreenKey) {
  return screens.find((screen) => screen.id === screenId) ?? screens[0];
}

function getDefaultScreenForRole(role: AppUserRole | null): ScreenKey {
  switch (role) {
    case 'admin':
    case 'coach':
      return 'coach';
    case 'recruiter':
      return 'recruiter';
    case 'athlete':
    default:
      return 'athlete';
  }
}

function getAllowedScreensForRole(role: AppUserRole | null): ScreenKey[] {
  switch (role) {
    case 'admin':
      return screens.map((screen) => screen.id);
    case 'coach':
      return ['coach', 'live', 'profile'];
    case 'recruiter':
      return ['recruiter', 'profile'];
    case 'athlete':
      return ['athlete', 'profile'];
    default:
      return [];
  }
}

function getDashboardPath(screen: ScreenKey) {
  return `/dashboard/${screen}`;
}

function getDashboardScreenFromPath(pathname: string): ScreenKey | null {
  const parts = pathname.replace(/\/+$/, '').split('/');
  const dashboardSegment = parts[1];
  const screenSegment = parts[2];

  if (dashboardSegment !== 'dashboard') {
    return null;
  }

  switch (screenSegment) {
    case 'athlete':
    case 'coach':
    case 'live':
    case 'recruiter':
    case 'profile':
      return screenSegment;
    default:
      return null;
  }
}

function toOnboardingRole(role: AppUserRole | null): UserRole {
  switch (role) {
    case 'admin':
    case 'coach':
      return 'coach';
    case 'recruiter':
      return 'recruiter';
    case 'athlete':
    default:
      return 'athlete';
  }
}

export default function App() {
  const authContext = useAuth();
  const { role: userRole, loading: loadingUserRole } = useUserRole(authContext.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile>(defaultOnboardingProfile);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(defaultAthleteId);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteRecord | null>(null);
  const [selectedStats, setSelectedStats] = useState<StatsRecord | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<Set<string>>(new Set(activeSubscriptions));
  const [athletes, setAthletes] = useState<AthleteRecord[]>([]);
  const [rosterStats, setRosterStats] = useState<StatsRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataError, setDataError] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [loadingAthlete, setLoadingAthlete] = useState(true);
  const [liveSnapshot, setLiveSnapshot] = useState<LiveSnapshot>(
    isDemoMode
      ? demoLiveSnapshot
      : {
          alerts: [],
          insights: [],
          stats: {},
          status: import.meta.env.VITE_AI_PIPELINE_URL ? 'connecting' : 'disabled',
        },
  );

  const supabaseReady = isSupabaseConfigured();
  const aiPipelineUrl = import.meta.env.VITE_AI_PIPELINE_URL;
  const athleteSubscriptionActive = subscriptionState.has('athlete');
  const coachSubscriptionActive = subscriptionState.has('coach');
  const recruiterSubscriptionActive = subscriptionState.has('recruiter');
  const allowedScreens = useMemo(() => getAllowedScreensForRole(userRole), [userRole]);
  const roleFilteredScreens = useMemo(() => screens.filter((screen) => allowedScreens.includes(screen.id)), [allowedScreens]);
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const requestedScreen = getDashboardScreenFromPath(pathname);
  const defaultScreen = getDefaultScreenForRole(userRole);
  const activeScreen = requestedScreen && allowedScreens.includes(requestedScreen) ? requestedScreen : defaultScreen;
  const isDashboardPath = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  useEffect(() => {
    if (!authContext.isAuthenticated) {
      return;
    }

    setOnboardingProfile((current) => ({
      ...current,
      email: authContext.user?.email ?? current.email,
      role: toOnboardingRole(userRole),
    }));
  }, [authContext.isAuthenticated, authContext.user?.email, userRole]);

  useEffect(() => {
    if (!authContext.isAuthenticated || !userRole || !isDashboardPath) {
      return;
    }

    const targetPath = getDashboardPath(defaultScreen);

    if ((pathname === '/dashboard' || !requestedScreen || !allowedScreens.includes(requestedScreen)) && pathname !== targetPath) {
      navigate(getDashboardPath(defaultScreen), { replace: true });
    }
  }, [allowedScreens, authContext.isAuthenticated, defaultScreen, isDashboardPath, navigate, pathname, requestedScreen, userRole]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoster() {
      setLoadingRoster(true);
      setDataError(null);

      try {
        if (isDemoMode && !supabaseReady) {
          const filteredAthletes = searchQuery.trim()
            ? demoAthletes.filter((athlete) =>
                `${athlete.name} ${athlete.position ?? ''}`.toLowerCase().includes(searchQuery.trim().toLowerCase()),
              )
            : demoAthletes;

          if (cancelled) return;
          setAthletes(filteredAthletes);
          setRosterStats(demoStats.filter((stat) => filteredAthletes.some((athlete) => athlete.id === stat.athlete_id)));
          return;
        }

        const roster = await getAthletes(searchQuery);
        const stats = await getStatsForAthletes(roster);

        if (cancelled) return;

        setAthletes(roster);
        setRosterStats(stats);
      } catch (error) {
        if (cancelled) return;
        setDataError(error instanceof Error ? error.message : 'Unable to load athlete roster.');
        setAthletes([]);
        setRosterStats([]);
      } finally {
        if (!cancelled) {
          setLoadingRoster(false);
        }
      }
    }

    void loadRoster();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, supabaseReady]);

  useEffect(() => {
    if (!athletes.length) {
      setSelectedAthleteId(null);
      return;
    }

    if (!selectedAthleteId || !athletes.some((athlete) => athlete.id === selectedAthleteId)) {
      setSelectedAthleteId(athletes[0].id);
    }
  }, [athletes, selectedAthleteId]);

  useEffect(() => {
    if (!selectedAthleteId) {
      setSelectedAthlete(null);
      setSelectedStats(null);
      setLoadingAthlete(false);
      return;
    }

    const athleteId: string = selectedAthleteId;

    let cancelled = false;

    async function loadAthlete() {
      setLoadingAthlete(true);

      try {
        if (isDemoMode && !supabaseReady) {
          const athlete = demoAthletes.find((item) => item.id === athleteId) ?? null;
          const stats = demoStats.find((item) => item.athlete_id === athleteId) ?? null;
          if (cancelled) return;
          setSelectedAthlete(athlete);
          setSelectedStats(stats);
          return;
        }

        const [athlete, stats] = await Promise.all([getAthlete(athleteId), getStats(athleteId)]);
        if (cancelled) return;

        setSelectedAthlete(athlete);
        setSelectedStats(stats);
      } catch (error) {
        if (cancelled) return;
        setDataError(error instanceof Error ? error.message : 'Unable to load athlete record.');
        setSelectedAthlete(null);
        setSelectedStats(null);
      } finally {
        if (!cancelled) {
          setLoadingAthlete(false);
        }
      }
    }

    void loadAthlete();

    return () => {
      cancelled = true;
    };
  }, [selectedAthleteId, supabaseReady]);

  useEffect(() => {
    if (isDemoMode && !aiPipelineUrl) {
      setLiveSnapshot(demoLiveSnapshot);
      return;
    }

    if (!aiPipelineUrl) return;

    const socket = new WebSocket(toWebSocketUrl(aiPipelineUrl));

    socket.addEventListener('open', () => {
      setLiveSnapshot((current) => ({ ...current, status: 'connected' }));
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data) as Partial<LiveSnapshot>;
        setLiveSnapshot({
          alerts: payload.alerts ?? [],
          insights: payload.insights ?? [],
          stats: payload.stats ?? {},
          status: 'connected',
        });
      } catch {
        setLiveSnapshot((current) => ({ ...current, status: 'error' }));
      }
    });

    socket.addEventListener('error', () => {
      setLiveSnapshot((current) => ({ ...current, status: 'error' }));
    });

    socket.addEventListener('close', () => {
      setLiveSnapshot((current) => ({
        ...current,
        status: current.status === 'error' ? 'error' : 'connecting',
      }));
    });

    return () => {
      socket.close();
    };
  }, [aiPipelineUrl]);

  useEffect(() => {
    if (!supabaseReady || (!authContext.user?.id && !authContext.user?.email)) {
      setSubscriptionState(new Set(activeSubscriptions));
      return;
    }

    let cancelled = false;

    async function loadSubscriptions() {
      try {
        const subscriptions = await getActiveSubscriptions({
          userId: authContext.user?.authSource === 'supabase' ? authContext.user.id : null,
          customerEmail: authContext.user?.email ?? onboardingProfile.email,
        });
        if (cancelled) return;

        setSubscriptionState(
          new Set([
            ...activeSubscriptions,
            ...(authContext.user?.subscription ? [authContext.user.subscription.toLowerCase()] : []),
            ...subscriptions.map((subscription) => subscription.plan_key.toLowerCase()),
          ]),
        );
      } catch {
        if (!cancelled) {
          setSubscriptionState(
            new Set([
              ...activeSubscriptions,
              ...(authContext.user?.subscription ? [authContext.user.subscription.toLowerCase()] : []),
            ]),
          );
        }
      }
    }

    void loadSubscriptions();

    return () => {
      cancelled = true;
    };
  }, [authContext.user?.authSource, authContext.user?.email, authContext.user?.id, authContext.user?.subscription, onboardingProfile.email, supabaseReady]);

  const rosterStatsByAthlete = useMemo(
    () => new Map(rosterStats.map((stats) => [stats.athlete_id, stats])),
    [rosterStats],
  );

  const averageTeamScore = useMemo(() => averageScore(athletes), [athletes]);

  const playerRows = useMemo(
    () =>
      athletes.map((athlete) => {
        const stats = rosterStatsByAthlete.get(athlete.id);
        return {
          id: athlete.id,
          name: athlete.name,
          spikes: stats?.spikes ?? 0,
          sets: stats?.sets ?? 0,
          serves: stats?.serves ?? 0,
          errors: stats?.errors ?? 0,
          efficiency: stats ? `${calculateEfficiency(stats).toFixed(0)}%` : '—',
          score: athlete.score ?? 0,
        };
      }),
    [athletes, rosterStatsByAthlete],
  );

  const featuredProspects = useMemo(() => athletes.slice(0, 3), [athletes]);
  const aiInsights = liveSnapshot.insights.length
    ? liveSnapshot.insights
    : ['AI insights will stream here after the pipeline connects.', 'Configure VITE_AI_PIPELINE_URL to enable live recommendations.'];

  const coachGamePlan = useMemo(() => {
    const topAthlete = [...playerRows].sort((left, right) => right.score - left.score)[0];
    const highestPressureServer = [...playerRows].sort((left, right) => right.serves - left.serves)[0];

    return [
      topAthlete ? `Feature ${topAthlete.name} early; current score ${topAthlete.score}.` : 'Load athlete production data to generate a game plan.',
      highestPressureServer ? `Lean on ${highestPressureServer.name} from the service line.` : 'Service pressure plan will appear once stats sync.',
      liveSnapshot.alerts[0] ?? 'Live AI alerts will surface during matches.',
    ];
  }, [liveSnapshot.alerts, playerRows]);

  const athleteHighlights = selectedAthlete?.highlight_url ? [selectedAthlete.highlight_url] : [];
  const latestStatSummary = selectedStats
    ? [
        `${selectedStats.spikes} spikes logged by the AI pipeline`,
        `${selectedStats.sets} sets tracked`,
        `${selectedStats.serves} serves with ${selectedStats.errors} errors`,
      ]
    : ['No stat row has been saved for this athlete yet.'];

  const pipelineStatus = [
    isDemoMode ? 'Demo mode is on for a stable investor walkthrough.' : null,
    supabaseReady ? 'Supabase connected for live athlete records.' : 'Configure Supabase env vars to load live athlete records.',
    aiPipelineUrl ? 'AI websocket endpoint configured for live insights.' : 'Add VITE_AI_PIPELINE_URL to stream live game insights.',
    athleteHighlights.length ? 'Highlight clip available from the AI pipeline.' : 'The AI pipeline has not saved a highlight URL yet.',
  ].filter((value): value is string => Boolean(value));

  async function handleSubscribe(plan: SubscriptionPlan) {
    try {
      if (!authContext.user?.email) {
        throw new Error('User email is required to start checkout.');
      }

      setCheckoutMessage(null);
      await subscribeToCheckout({
        priceId: plan.priceId,
        userId: authContext.user.authSource === 'supabase' ? authContext.user.id : undefined,
        customerEmail: authContext.user.email,
        planKey: plan.key,
      });
    } catch (error) {
      setCheckoutMessage(error instanceof Error ? error.message : 'Unable to start checkout.');
    }
  }

  function openRecruiterProfile(athleteId: string) {
    if (!allowedScreens.includes('profile')) {
      console.warn('Blocked profile access for the current role.');
      return;
    }

    setSelectedAthleteId(athleteId);
    navigate(getDashboardPath('profile'));
  }

  const onAthletePrimaryAction = useAthletePrimaryAction({
    subscriptionActive: athleteSubscriptionActive,
    highlightUrl: selectedAthlete?.highlight_url,
    onSubscribe: () => {
      const athletePlan = subscriptionPlans.find((plan) => plan.key === 'athlete');
      if (athletePlan) {
        void handleSubscribe(athletePlan);
      }
    },
    onProcessingPending: () => {
      setCheckoutMessage('The highlight video is still being processed in the AI pipeline. Check the AI video panel for job status.');
    },
  });

  function handleOnboardingComplete(profile: OnboardingProfile) {
    setOnboardingProfile(profile);
    navigate(getDashboardPath(profile.role === 'coach' ? 'coach' : profile.role === 'recruiter' ? 'recruiter' : 'athlete'));
  }

  if (pathname === '/') {
    if (authContext.isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }

    return (
      <LandingPage
        plans={subscriptionPlans}
        onGetStarted={() => navigate('/onboarding')}
        onViewPitch={() => navigate('/pitch')}
      />
    );
  }

  if (pathname === '/login') {
    if (authContext.isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }

    return <Login />;
  }

  if (pathname === '/onboarding') {
    return (
      <OnboardingFlow
        value={onboardingProfile}
        onBack={() => navigate('/')}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  if (pathname === '/pitch') {
    return <InvestorPitchDeck slides={pitchSlides} onBack={() => navigate('/')} onGetStarted={() => navigate('/onboarding')} />;
  }

  if (!isDashboardPath) {
    return <Navigate to={authContext.isAuthenticated ? '/dashboard' : '/'} replace />;
  }

  return (
    <ProtectedRoute
      user={authContext.user}
      role={userRole}
      allowedRoles={allDashboardRoles}
      isLoading={authContext.isLoading || loadingUserRole}
      redirectTo="/login"
      loadingFallback={
        <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
          <div className="mx-auto flex max-w-xl items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
            Loading dashboard access...
          </div>
        </div>
      }
      unauthorizedFallback={
        <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
          <div className="mx-auto max-w-xl rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
            <p className="text-sm uppercase tracking-[0.28em] text-rose-200">Access restricted</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">No dashboard is assigned to this account.</h1>
            <p className="mt-3 text-sm text-slate-300">Ask an administrator to update your role before signing in again.</p>
            <button
              type="button"
              onClick={authContext.logout}
              className="mt-6 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      }
    >
        <div className="min-h-screen bg-[#050816] text-slate-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_26%),linear-gradient(180deg,_rgba(15,23,42,0.88),_rgba(2,6,23,1))]" />
          <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <header className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
                  PRIMEAthletix
                  <span className="text-xs tracking-[0.24em] text-emerald-300">Supabase • AI pipeline • subscriptions</span>
                </div>

                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-3xl space-y-4">
                    <div className="space-y-3">
                      <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                        Live athlete data, AI-generated highlights, and subscription-ready dashboards.
                      </h1>
                      <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                        This app now reads athletes and stat rows from Supabase, listens for live AI pipeline updates, and exposes Stripe-powered upgrade paths for premium workflows.
                      </p>
                      <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                        {userRole} access
                      </div>
                    </div>

                    <ul className="flex flex-wrap gap-2" aria-label="Connected product flow highlights">
                      {['Real athletes', 'Real stats', 'AI highlights', 'Monetized access'].map((item) => (
                        <li key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[380px]">
                    <StatCard label="Roster loaded" value={loadingRoster ? '...' : String(athletes.length)} detail="Supabase athlete rows" />
                    <StatCard
                      label="Live pipeline"
                      value={liveSnapshot.status === 'connected' ? 'On' : liveSnapshot.status === 'disabled' ? 'Off' : '...'}
                      detail="AI websocket health"
                    />
                    <StatCard
                      label="Subscriptions"
                      value={[athleteSubscriptionActive, coachSubscriptionActive, recruiterSubscriptionActive].filter(Boolean).length.toString()}
                      detail="Unlocked premium roles"
                    />
                  </div>
                </div>
              </div>
            </header>

            {dataError ? (
              <NoticeBanner icon={<Bell className="h-4 w-4" />} tone="rose" message={dataError} />
            ) : null}

            {checkoutMessage ? (
              <NoticeBanner icon={<Bell className="h-4 w-4" />} tone="amber" message={checkoutMessage} />
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">{getScreenMeta(activeScreen).eyebrow}</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{getScreenMeta(activeScreen).label}</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">{getScreenMeta(activeScreen).summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {roleFilteredScreens.map((screen) => (
                    <button
                      key={screen.id}
                      type="button"
                      onClick={() => navigate(getDashboardPath(screen.id))}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        screen.id === activeScreen
                          ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100'
                          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      {screen.label}
                    </button>
                  ))}
                </div>
              </Panel>

              <SubscriptionPanel plans={subscriptionPlans} activeSubscriptions={subscriptionState} onSubscribe={(plan) => void handleSubscribe(plan)} />
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={authContext.logout}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
              >
                Sign out
              </button>
            </div>

            <ErrorBoundary title="AI scouting unavailable" message="The AI scouting workspace failed to load safely.">
              <AiVideoPanel />
            </ErrorBoundary>

            {activeScreen === 'athlete' ? (
              <AthleteDashboard
                athlete={selectedAthlete}
                stats={selectedStats}
                loading={loadingAthlete}
                highlights={athleteHighlights}
                latestStatSummary={latestStatSummary}
                pipelineStatus={pipelineStatus}
                subscriptionActive={athleteSubscriptionActive}
                onPrimaryAction={onAthletePrimaryAction}
                onOpenProfile={() => navigate(getDashboardPath('profile'))}
              />
            ) : null}

            {activeScreen === 'coach' ? (
              <CoachDashboard
                onEnterLiveMode={() => navigate(getDashboardPath('live'))}
                players={playerRows}
                performance={averageTeamScore}
                insights={aiInsights}
                gamePlan={coachGamePlan}
                subscriptionActive={coachSubscriptionActive}
                onUnlock={() => {
                  const coachPlan = subscriptionPlans.find((plan) => plan.key === 'coach');
                  if (coachPlan) {
                    void handleSubscribe(coachPlan);
                  }
                }}
              />
            ) : null}

            {activeScreen === 'live' ? (
              <LiveGameMode
                liveSnapshot={liveSnapshot}
                subscriptionActive={coachSubscriptionActive}
                onUnlock={() => {
                  const coachPlan = subscriptionPlans.find((plan) => plan.key === 'coach');
                  if (coachPlan) {
                    void handleSubscribe(coachPlan);
                  }
                }}
              />
            ) : null}

            {activeScreen === 'recruiter' ? (
              <RecruiterDashboard
                athletes={athletes}
                loading={loadingRoster}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenProfile={openRecruiterProfile}
                savedProspects={featuredProspects}
                subscriptionActive={recruiterSubscriptionActive}
                onUnlock={() => {
                  const recruiterPlan = subscriptionPlans.find((plan) => plan.key === 'recruiter');
                  if (recruiterPlan) {
                    void handleSubscribe(recruiterPlan);
                  }
                }}
              />
            ) : null}

            {activeScreen === 'profile' ? (
              <AthleteProfile athlete={selectedAthlete} stats={selectedStats} loading={loadingAthlete} />
            ) : null}
          </div>
        </div>
    </ProtectedRoute>
  );
}

function AthleteDashboard({
  athlete,
  stats,
  loading,
  highlights,
  latestStatSummary,
  pipelineStatus,
  subscriptionActive,
  onPrimaryAction,
  onOpenProfile,
}: {
  athlete: AthleteRecord | null;
  stats: StatsRecord | null;
  loading: boolean;
  highlights: string[];
  latestStatSummary: string[];
  pipelineStatus: string[];
  subscriptionActive: boolean;
  onPrimaryAction: () => void;
  onOpenProfile: () => void;
}) {
  const [messageDraft, setMessageDraft] = useState({ channel: 'Announcements', author: '', content: '' });
  const [messages, setMessages] = useState<TeamMessage[]>(defaultTeamMessages);
  const efficiency = calculateEfficiency(stats);
  const score = athlete?.score ?? 0;

  function addMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!messageDraft.author.trim() || !messageDraft.content.trim()) return;

    setMessages((current) => [
      {
        id: Date.now(),
        channel: messageDraft.channel,
        author: messageDraft.author.trim(),
        content: messageDraft.content.trim(),
        timestamp: 'Just now',
      },
      ...current,
    ]);
    setMessageDraft((current) => ({ ...current, author: '', content: '' }));
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Panel>
          {loading ? (
            <LoadingState label="Loading athlete dashboard..." />
          ) : athlete ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Athlete Dashboard</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{athlete.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {athlete.position || 'Position pending'} · Score {formatScore(athlete.score)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/35 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                >
                  <Share2 className="h-4 w-4" />
                  Share Profile
                </button>
              </div>

              <form className="grid gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4" onSubmit={addMessage}>
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
                  <label className="space-y-2 text-sm text-slate-300">
                    Channel
                    <select
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none ring-0"
                      value={messageDraft.channel}
                      onChange={(event) => setMessageDraft((current) => ({ ...current, channel: event.target.value }))}
                    >
                      <option>Announcements</option>
                      <option>Operations</option>
                      <option>Design</option>
                      <option>Support</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    Author
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      value={messageDraft.author}
                      onChange={(event) => setMessageDraft((current) => ({ ...current, author: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    Message
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      placeholder="Share an update with your team"
                      value={messageDraft.content}
                      onChange={(event) => setMessageDraft((current) => ({ ...current, content: event.target.value }))}
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Post update
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                      <span>{message.channel}</span>
                      <span>{message.timestamp}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{message.author}</p>
                    <p className="mt-1 text-sm text-slate-300">{message.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="No athlete selected" detail="Add athlete rows in Supabase to populate this view." />
          )}
        </Panel>

        <Panel>
          <div className="flex h-full flex-col justify-between gap-5">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Performance Score</p>
              <div className="mt-5 flex items-center gap-5">
                <ScoreRing score={score} />
                <div>
                  <p className="text-5xl font-semibold text-white">{formatScore(athlete?.score)}</p>
                  <p className="mt-2 max-w-[220px] text-sm text-slate-400">
                    Real score sourced from the athlete row and updated by the AI pipeline save-results job.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricPill label="Spikes" value={formatMetric(stats?.spikes)} />
              <MetricPill label="Serves" value={formatMetric(stats?.serves)} />
              <MetricPill label="Efficiency" value={stats ? `${efficiency.toFixed(0)}%` : '—'} />
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <PrimaryActionCard
          icon={subscriptionActive ? <Video className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          eyebrow={subscriptionActive ? 'Primary CTA' : 'Subscription Required'}
          title={subscriptionActive ? 'Generate Highlight Reel' : 'Unlock Athlete Pro'}
          description={
            subscriptionActive
              ? 'Open the AI-generated highlight URL saved to Supabase or trigger your premium highlight workflow.'
              : 'Athlete Pro unlocks AI highlight generation, premium profile sharing, and exposure workflows.'
          }
          action={subscriptionActive ? 'Open highlight' : 'Subscribe'}
          onAction={onPrimaryAction}
        />
        <InfoCard icon={<BarChart3 className="h-5 w-5" />} title="View Stats" items={latestStatSummary} />
        <InfoCard icon={<TrendingUp className="h-5 w-5" />} title="Pipeline Status" items={pipelineStatus} footer={<MiniTrendChart />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <HighlightCard title="Recent highlights" highlights={highlights} />
        <FeedCard title="Latest stat snapshot" accent="text-emerald-200" items={latestStatSummary} />
        <FeedCard title="Integration status" accent="text-blue-200" items={pipelineStatus} />
      </section>
    </div>
  );
}

function CoachDashboard({
  onEnterLiveMode,
  players,
  performance,
  insights,
  gamePlan,
  subscriptionActive,
  onUnlock,
}: {
  onEnterLiveMode: () => void;
  players: Array<{ id: string; name: string; spikes: number; serves: number; errors: number; efficiency: string; score: number }>;
  performance: number | null;
  insights: string[];
  gamePlan: string[];
  subscriptionActive: boolean;
  onUnlock: () => void;
}) {
  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Coach / Team Dashboard</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Quantico Volleyball</h2>
            <p className="mt-2 text-sm text-slate-400">Live roster metrics sourced from Supabase athlete and stats tables.</p>
          </div>
          {subscriptionActive ? (
            <button
              type="button"
              onClick={onEnterLiveMode}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <Activity className="h-4 w-4" />
              Enter Live Mode
            </button>
          ) : (
            <button
              type="button"
              onClick={onUnlock}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
            >
              <Lock className="h-4 w-4" />
              Unlock Coach Pro
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
        <InsightCard
          icon={<Gauge className="h-5 w-5" />}
          title="Team Performance"
          detail={performance ? `Average athlete score ${performance}` : 'Waiting for live score data'}
          bullets={[
            `${players.length} roster entries loaded`,
            `Top efficiency ${players[0]?.efficiency ?? '—'}`,
          ]}
        />
        <InsightCard
          icon={<Target className="h-5 w-5" />}
          title="Opponent Insights"
          detail="AI pipeline feed"
          bullets={insights}
        />
        <InsightCard
          icon={<Shield className="h-5 w-5" />}
          title="Game Plan"
          detail="Derived from live production"
          bullets={gamePlan}
        />
        <InsightCard
          icon={<Play className="h-5 w-5" />}
          title="Film + Highlights"
          detail="AI clips"
          bullets={[
            'Athlete highlight URLs open from the profile screen.',
            'Use Coach Pro to access live decision support during matches.',
          ]}
        />
      </section>

      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-emerald-300">Bottom section</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Sortable player stats table</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {['Spikes', 'Serves', 'Errors', 'Efficiency'].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Sort: {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/[0.03] text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">Spikes</th>
                <th className="px-4 py-3 font-medium">Serves</th>
                <th className="px-4 py-3 font-medium">Errors</th>
                <th className="px-4 py-3 font-medium">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 bg-slate-950/40">
              {players.length ? (
                players.map((player) => (
                  <tr key={player.id} className="text-slate-200">
                    <td className="px-4 py-3 font-medium text-white">{player.name}</td>
                    <td className="px-4 py-3">{player.spikes}</td>
                    <td className="px-4 py-3">{player.serves}</td>
                    <td className="px-4 py-3">{player.errors}</td>
                    <td className="px-4 py-3 text-emerald-300">{player.efficiency}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={5}>
                    Add athletes and stats in Supabase to populate the coach table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function LiveGameMode({
  liveSnapshot,
  subscriptionActive,
  onUnlock,
}: {
  liveSnapshot: LiveSnapshot;
  subscriptionActive: boolean;
  onUnlock: () => void;
}) {
  const liveStatsEntries = Object.entries(liveSnapshot.stats);

  return (
    <section className="rounded-[36px] border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
      {!subscriptionActive ? (
        <NoticeBanner
          icon={<Lock className="h-4 w-4" />}
          tone="amber"
          message="Coach Pro is required for live match mode. Unlock the subscription to activate in-game AI insights."
          actionLabel="Unlock Coach Pro"
          onAction={onUnlock}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.5fr_0.82fr]">
        <Panel className="h-full">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
            <Bell className="h-4 w-4" />
            AI Insights
          </div>
          <div className="mt-5 space-y-3">
            {(liveSnapshot.insights.length ? liveSnapshot.insights : ['Waiting for AI insight stream...']).map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="h-full">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Live Game Mode</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Tracking overlay</h2>
            </div>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              {liveSnapshot.status === 'connected' ? 'LIVE' : liveSnapshot.status.toUpperCase()}
            </span>
          </div>
          <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,_rgba(8,47,73,0.65),_rgba(15,23,42,0.92))] p-4">
            <div className="relative aspect-[16/10] rounded-[24px] border border-cyan-400/20 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.16),_rgba(2,6,23,0.95))]">
              <div className="absolute inset-x-6 top-6 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-300">
                <span>Court vision</span>
                <span>{subscriptionActive ? 'AI websocket ready' : 'Locked'}</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 p-5 text-cyan-100">
                  <Video className="h-10 w-10" />
                </div>
              </div>
              <div className="absolute left-[17%] top-[30%] rounded-full border border-emerald-400/50 bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                {liveSnapshot.alerts[0] ?? 'Awaiting alert'}
              </div>
              <div className="absolute right-[18%] top-[42%] rounded-full border border-cyan-400/50 bg-cyan-400/20 px-3 py-1 text-xs font-semibold text-cyan-100">
                {liveSnapshot.insights[0] ?? 'Awaiting insight'}
              </div>
              <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-200">
                Real-time overlay ready for in-game use
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="h-full">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
            <BarChart3 className="h-4 w-4" />
            Live Stats
          </div>
          <div className="mt-5 space-y-4">
            {liveStatsEntries.length ? (
              liveStatsEntries.map(([label, value]) => <LiveStat key={label} label={label} value={String(value)} />)
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                No live stat payload has been received yet.
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          <Mic className="h-4 w-4" />
          Voice Assistant {subscriptionActive ? 'Ready' : 'Locked'}
        </button>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-100">
          Priority alerts indicator: {liveSnapshot.alerts.length}
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
          Minimal taps · Fast reading · Bench usable
        </div>
      </div>
    </section>
  );
}

function RecruiterDashboard({
  athletes,
  loading,
  searchQuery,
  onSearchChange,
  onOpenProfile,
  savedProspects,
  subscriptionActive,
  onUnlock,
}: {
  athletes: AthleteRecord[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenProfile: (athleteId: string) => void;
  savedProspects: AthleteRecord[];
  subscriptionActive: boolean;
  onUnlock: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.55fr_0.75fr]">
      <div className="grid gap-6">
        <Panel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Recruiter Dashboard</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Discovery engine for live prospects</h2>
            </div>
            <label className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
              <Search className="h-4 w-4 text-cyan-200" />
              <input
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="bg-transparent outline-none placeholder:text-slate-500"
                placeholder="Search name or position"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Real Supabase roster', 'Search by athlete name', 'Highlight URL previews', 'Shareable profile routing'].map((filter) => (
              <span key={filter} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                {filter}
              </span>
            ))}
          </div>
        </Panel>

        <section className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <Panel className="md:col-span-2">
              <LoadingState label="Loading recruiter prospects..." />
            </Panel>
          ) : athletes.length ? (
            athletes.map((athlete) => (
              <button
                key={athlete.id}
                type="button"
                onClick={() => onOpenProfile(athlete.id)}
                className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 text-left shadow-2xl shadow-black/20 transition hover:border-cyan-400/35 hover:bg-slate-900/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ProfileOrb initials={getInitials(athlete.name)} accent="from-emerald-400 to-cyan-400" small />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{athlete.name}</h3>
                      <p className="text-sm text-slate-400">{athlete.position || 'Position pending'}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                    Score {formatScore(athlete.score)}
                  </span>
                </div>
                <div className="mt-4 rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,_rgba(8,47,73,0.7),_rgba(22,101,52,0.25))] p-4">
                  {athlete.highlight_url ? (
                    <video src={athlete.highlight_url} controls className="aspect-[16/9] w-full rounded-[18px] border border-white/10 bg-slate-950/40" />
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center rounded-[18px] border border-white/10 bg-slate-950/40 text-slate-300">
                      <Play className="mr-2 h-4 w-4 text-cyan-200" />
                      No highlight URL saved yet
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <Panel className="md:col-span-2">
              <EmptyState title="No prospects found" detail="Create athlete rows in Supabase or adjust your search query." />
            </Panel>
          )}
        </section>
      </div>

      <Panel>
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
          <Users className="h-4 w-4" />
          Saved prospects
        </div>
        <div className="mt-5 space-y-3">
          {savedProspects.length ? (
            savedProspects.map((athlete) => (
              <div key={athlete.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                {athlete.name} · {athlete.position || 'Position pending'} · Score {formatScore(athlete.score)}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">No saved prospects yet.</div>
          )}
        </div>

        <div className="mt-6 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4">
          <p className="text-sm font-semibold text-cyan-100">Quick compare</p>
          <p className="mt-2 text-sm text-slate-300">
            {subscriptionActive ? 'Recruiter Pro is active. Compare score, highlight availability, and production at a glance.' : 'Recruiter Pro unlocks saved prospects and compare workflows.'}
          </p>
        </div>

        {!subscriptionActive ? (
          <button
            type="button"
            onClick={onUnlock}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            <Lock className="h-4 w-4" />
            Unlock Recruiter Pro
          </button>
        ) : null}
      </Panel>
    </div>
  );
}

function AthleteProfile({
  athlete,
  stats,
  loading,
}: {
  athlete: AthleteRecord | null;
  stats: StatsRecord | null;
  loading: boolean;
}) {
  const statBreakdown = [
    { label: 'Spikes', value: formatMetric(stats?.spikes) },
    { label: 'Sets', value: formatMetric(stats?.sets) },
    { label: 'Serves', value: formatMetric(stats?.serves) },
    { label: 'Errors', value: formatMetric(stats?.errors) },
  ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          {loading ? (
            <LoadingState label="Loading athlete profile..." />
          ) : athlete ? (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <ProfileOrb initials={getInitials(athlete.name)} accent="from-cyan-400 via-blue-400 to-emerald-400" />
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Shareable Athlete Profile</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{athlete.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {athlete.position || 'Position pending'} · Athlete ID {athlete.id.slice(0, 8)} · Score {formatScore(athlete.score)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Supabase-backed profile', athlete.highlight_url ? 'AI highlight ready' : 'Highlight pending', stats ? 'Stats synced' : 'Stats pending'].map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Contact Athlete
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <EmptyState title="No athlete selected" detail="Select an athlete from the recruiter or athlete dashboard to populate this page." />
          )}
        </Panel>

        <Panel>
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,_rgba(8,47,73,0.65),_rgba(30,41,59,0.92))] p-4">
            {athlete?.highlight_url ? (
              <video src={athlete.highlight_url} controls className="aspect-[16/9] w-full rounded-[22px] border border-white/10 bg-slate-950/50" />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center rounded-[22px] border border-white/10 bg-slate-950/50 text-slate-200">
                <Play className="mr-2 h-5 w-5 text-cyan-200" />
                Highlight video hero will appear when the AI pipeline saves a highlight URL.
              </div>
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
            <Trophy className="h-4 w-4" />
            Measurable stats
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {statBreakdown.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
            <TrendingUp className="h-4 w-4" />
            Recent performance
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">Stats breakdown</p>
              <div className="mt-4 space-y-4">
                <BarRow label="Attack volume" value={Math.min(stats?.spikes ?? 0, 100)} color="from-cyan-400 to-blue-500" />
                <BarRow label="Serve volume" value={Math.min(stats?.serves ?? 0, 100)} color="from-emerald-400 to-lime-400" />
                <BarRow label="Efficiency" value={calculateEfficiency(stats)} color="from-violet-400 to-fuchsia-400" />
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">Performance chart</p>
              <div className="mt-4">
                <MiniTrendChart tall />
              </div>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function LandingPage({
  plans,
  onGetStarted,
  onViewPitch,
}: {
  plans: SubscriptionPlan[];
  onGetStarted: () => void;
  onViewPitch: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.16),_transparent_26%),linear-gradient(180deg,_rgba(15,23,42,0.92),_rgba(2,6,23,1))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 rounded-[36px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-black/30 backdrop-blur lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
              PRIMEAthletix
              <span className="text-xs tracking-[0.24em] text-emerald-300">AI-Powered Athlete Intelligence</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">AI-Powered Athlete Intelligence</h1>
              <p className="max-w-2xl text-base text-slate-300">
                Turn game film into highlights, stats, and recruiting exposure.
              </p>
              <p className="max-w-2xl text-sm text-slate-400">
                We’re not building another sports app — we’re building the AI operating system for athlete development and recruiting.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Start onboarding
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onViewPitch}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"
              >
                View investor deck
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Used by competitive athletes', 'Built for high-performance teams', 'Ready for live demos'].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <StatCard label="Flow" value="Upload → AI → Insight" detail="Stats, highlights, and decisions from one pipeline" />
            <StatCard label="Business model" value="3 streams" detail="Athletes, teams, and recruiters" />
            <StatCard label="Architecture" value="Live" detail="Vercel + Railway + Supabase + Stripe" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['🎥', 'Auto Highlights', 'Generate recruiting-ready clips from uploaded film.'],
            ['📊', 'AI Stats', 'Capture spikes, sets, serves, and errors into live athlete profiles.'],
            ['🧠', 'Game Planning', 'Turn live reads into coach-facing adjustments.'],
            ['🏆', 'Recruiting', 'Convert performance into search, exposure, and outreach.'],
          ].map(([emoji, title, detail]) => (
            <Panel key={title}>
              <div className="text-2xl">{emoji}</div>
              <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm text-slate-400">{detail}</p>
            </Panel>
          ))}
        </section>

        <ProductPlatformPanel />

        <section className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <Panel key={plan.key}>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">{plan.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{plan.price}</p>
              <p className="mt-3 text-sm text-slate-400">{plan.description}</p>
            </Panel>
          ))}
        </section>
      </div>
    </div>
  );
}

function OnboardingFlow({
  value,
  onBack,
  onComplete,
}: {
  value: OnboardingProfile;
  onBack: () => void;
  onComplete: (profile: OnboardingProfile) => void;
}) {
  const [profile, setProfile] = useState<OnboardingProfile>(value);

  const firstAction =
    profile.role === 'athlete'
      ? 'Upload video'
      : profile.role === 'coach'
        ? 'View demo game plan'
        : 'Browse players';

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Onboarding</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Set up your first live experience</h1>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100"
            >
              Back
            </button>
          </div>
        </Panel>

        <section className="grid gap-6 lg:grid-cols-3">
          <Panel>
            <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Step 1 — Role selection</p>
            <div className="mt-4 grid gap-3">
              {(['athlete', 'coach', 'recruiter'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setProfile((current) => ({ ...current, role }))}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                    profile.role === role ? 'border-cyan-400/50 bg-cyan-400/10 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300'
                  }`}
                >
                  I am: <span className="font-semibold capitalize">{role}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Step 2 — Quick setup</p>
            <div className="mt-4 grid gap-3">
              <input
                value={profile.email}
                onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="Email"
              />
              {profile.role === 'athlete' ? (
                <>
                  <input
                    value={profile.position}
                    onChange={(event) => setProfile((current) => ({ ...current, position: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                    placeholder="Position"
                  />
                  <input
                    value={profile.height}
                    onChange={(event) => setProfile((current) => ({ ...current, height: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                    placeholder="Height"
                  />
                </>
              ) : null}
              {profile.role === 'coach' ? (
                <input
                  value={profile.teamName}
                  onChange={(event) => setProfile((current) => ({ ...current, teamName: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder="Team name"
                />
              ) : null}
              {profile.role === 'recruiter' ? (
                <input
                  value={profile.organization}
                  onChange={(event) => setProfile((current) => ({ ...current, organization: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder="Organization"
                />
              ) : null}
            </div>
          </Panel>

          <Panel>
            <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Step 3 — First action</p>
            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-lg font-semibold text-white">{firstAction}</p>
              <p className="mt-2 text-sm text-slate-400">
                {profile.role === 'athlete'
                  ? 'Bring your first clip into the AI pipeline.'
                  : profile.role === 'coach'
                    ? 'Open the live demo game plan and insights.'
                    : 'Start from the recruiter search dashboard.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onComplete(profile)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Continue to dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function InvestorPitchDeck({
  slides,
  onBack,
  onGetStarted,
}: {
  slides: Array<{ title: string; bullets: string[] }>;
  onBack: () => void;
  onGetStarted: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Investor pitch</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">PRIMEAthletix</h1>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onBack} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100">
                Back
              </button>
              <button type="button" onClick={onGetStarted} className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950">
                Start onboarding
              </button>
            </div>
          </div>
        </Panel>

        <section className="grid gap-4 lg:grid-cols-2">
          {slides.map((slide) => (
            <Panel key={slide.title}>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">{slide.title}</p>
              <div className="mt-4 space-y-3">
                {slide.bullets.map((bullet) => (
                  <div key={bullet} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                    {bullet}
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </section>

        <Panel>
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Closing line</p>
            <p className="text-2xl font-semibold text-white">
              “We turn every game into data, every player into a profile, and every decision into an advantage.”
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SubscriptionPanel({
  plans,
  activeSubscriptions,
  onSubscribe,
}: {
  plans: SubscriptionPlan[];
  activeSubscriptions: Set<string>;
  onSubscribe: (plan: SubscriptionPlan) => void;
}) {
  return (
    <Panel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Monetization</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Stripe subscription tiers</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Checkout requests post to the configured checkout endpoint and redirect users into a Stripe subscription flow.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          Active tiers: {[...activeSubscriptions].join(', ') || 'none'}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isActive = activeSubscriptions.has(plan.key);
          return (
            <div key={plan.key} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{plan.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{plan.price}</p>
                </div>
                {isActive ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <Lock className="h-5 w-5 text-slate-500" />}
              </div>
              <p className="mt-4 text-sm text-slate-300">{plan.description}</p>
              <button
                type="button"
                onClick={() => onSubscribe(plan)}
                disabled={!plan.priceId || isActive}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {isActive ? 'Unlocked' : plan.priceId ? 'Subscribe' : 'Missing price ID'}
              </button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function NoticeBanner({
  icon,
  tone,
  message,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  tone: 'amber' | 'rose';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const toneClass =
    tone === 'amber'
      ? 'border-amber-400/30 bg-amber-400/10 text-amber-100'
      : 'border-rose-400/30 bg-rose-400/10 text-rose-100';

  return (
    <div className={`flex flex-col gap-3 rounded-[24px] border px-4 py-4 shadow-lg shadow-black/10 sm:flex-row sm:items-center sm:justify-between ${toneClass}`}>
      <div className="flex items-center gap-2 text-sm">
        {icon}
        <span>{message}</span>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-xl border border-current/30 px-3 py-2 text-sm font-semibold"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-300" />
      {label}
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.02] p-6">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function HighlightCard({ title, highlights }: { title: string; highlights: string[] }) {
  return (
    <Panel>
      <h3 className="text-lg font-semibold text-cyan-200">{title}</h3>
      <div className="mt-4 space-y-3">
        {highlights.length ? (
          highlights.map((highlight) => (
            <video key={highlight} src={highlight} controls className="aspect-video w-full rounded-2xl border border-white/10 bg-slate-950/60" />
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            The AI pipeline has not saved a highlight URL for this athlete yet.
          </div>
        )}
      </div>
    </Panel>
  );
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur ${className}`}>
      {children}
    </section>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const normalizedScore = Math.max(0, Math.min(score, 100));
  const accentStop = Math.min(normalizedScore + SCORE_RING_ACCENT_SPAN, 100);

  return (
    <div
      className="flex h-32 w-32 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${SCORE_RING_PRIMARY} 0 ${normalizedScore}%, ${SCORE_RING_SECONDARY} ${normalizedScore}% ${accentStop}%, rgba(255,255,255,0.08) ${accentStop}% 100%)`,
      }}
    >
      <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full border border-white/8 bg-slate-950 text-3xl font-semibold text-white">
        {formatScore(score)}
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function PrimaryActionCard({
  icon,
  eyebrow,
  title,
  description,
  action,
  onAction,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <Panel>
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
            {icon}
            {eyebrow}
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-white">{title}</h3>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          {action}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Panel>
  );
}

function InfoCard({
  icon,
  title,
  items,
  footer,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  footer?: ReactNode;
}) {
  return (
    <Panel>
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.26em] text-cyan-200">
        {icon}
        {title}
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
            {item}
          </div>
        ))}
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </Panel>
  );
}

function FeedCard({ title, accent, items }: { title: string; accent: string; items: string[] }) {
  return (
    <Panel>
      <h3 className={`text-lg font-semibold ${accent}`}>{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
            {item}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function InsightCard({
  icon,
  title,
  detail,
  bullets,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  bullets: string[];
}) {
  return (
    <Panel>
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
        {icon}
        {title}
      </div>
      <p className="mt-4 text-lg font-semibold text-white">{detail}</p>
      <div className="mt-4 space-y-3">
        {bullets.map((bullet) => (
          <div key={bullet} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
            {bullet}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold capitalize text-white">{value}</p>
    </div>
  );
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium text-white">{value.toFixed(0)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function MiniTrendChart({ tall = false, points = DEFAULT_TREND_CHART_POINTS }: { tall?: boolean; points?: number[] }) {
  return (
    <div className={`rounded-[24px] border border-white/10 bg-white/[0.03] p-4 ${tall ? 'h-[220px]' : ''}`}>
      <div className="flex h-full items-end gap-3">
        {points.map((value, index) => (
          <div key={`trend-${index}-${value}`} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-full bg-gradient-to-t from-cyan-400 via-blue-500 to-emerald-400"
              style={{ height: `${Math.max(value, MIN_TREND_BAR_HEIGHT)}%` }}
            />
            <span className="text-xs text-slate-500">W{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileOrb({
  initials,
  accent,
  small = false,
}: {
  initials: string;
  accent: string;
  small?: boolean;
}) {
  const size = small ? 'h-12 w-12 text-sm' : 'h-16 w-16 text-lg';

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} font-semibold text-slate-950 shadow-lg shadow-black/20`}
    >
      {initials}
    </div>
  );
}
