import { useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  BarChart3,
  Gauge,
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

type ScreenKey = 'athlete' | 'coach' | 'live' | 'recruiter' | 'profile';

type Screen = {
  id: ScreenKey;
  label: string;
  eyebrow: string;
  summary: string;
};

type AthleteCard = {
  name: string;
  position: string;
  score: number;
  gradYear: string;
  height: string;
  ranking: string;
};

const screens: Screen[] = [
  {
    id: 'athlete',
    label: 'Athlete Dashboard',
    eyebrow: 'Performance + Exposure',
    summary: 'How good am I and how do I get exposure?',
  },
  {
    id: 'coach',
    label: 'Coach Dashboard',
    eyebrow: 'Decision Engine',
    summary: 'How do we win this game?',
  },
  {
    id: 'live',
    label: 'Live Game Mode',
    eyebrow: 'In-game Differentiator',
    summary: 'Minimal taps, fast reads, live adjustments.',
  },
  {
    id: 'recruiter',
    label: 'Recruiter Dashboard',
    eyebrow: 'Discovery Engine',
    summary: 'Find top players fast.',
  },
  {
    id: 'profile',
    label: 'Athlete Profile',
    eyebrow: 'Shareable Conversion Page',
    summary: 'Turn performance into opportunity.',
  },
];

const athleteCards: AthleteCard[] = [
  { name: 'Maya Brooks', position: 'OH', score: 94, gradYear: '2027', height: '6’0”', ranking: '#8 West' },
  { name: 'Avery Nguyen', position: 'S', score: 91, gradYear: '2026', height: '5’10”', ranking: '#2 Setter' },
  { name: 'Jordan Ellis', position: 'MB', score: 89, gradYear: '2028', height: '6’2”', ranking: '#11 National' },
  { name: 'Sydney Flores', position: 'RS', score: 87, gradYear: '2027', height: '6’1”', ranking: '#5 Region' },
];

const athleteFeed = {
  highlights: [
    '12-kill semifinal cut with serve pressure overlays',
    'Transition scoring reel from last three tournaments',
    'Defensive pickup montage shared by club coach',
  ],
  games: [
    'vs Skyline Elite · 18 kills · .412 efficiency',
    'vs Coast VC · 4 aces · 21 perfect passes',
    'vs NorCal Surge · 9 digs · 3 stuffs',
  ],
  feedback: [
    'First-step explosion is improving. Keep swinging high hands.',
    'Recruiting profile is trending after last showcase weekend.',
  ],
};

const coachPlayers = [
  { name: 'Maya Brooks', kills: 18, errors: 4, efficiency: '.412' },
  { name: 'Avery Nguyen', kills: 4, errors: 1, efficiency: '.375' },
  { name: 'Jordan Ellis', kills: 9, errors: 2, efficiency: '.389' },
  { name: 'Sydney Flores', kills: 11, errors: 5, efficiency: '.240' },
];

const recruiterSaved = ['Maya Brooks · OH · 2027', 'Jordan Ellis · MB · 2028', 'Avery Nguyen · S · 2026'];

const profileBreakdown = [
  { label: 'Vertical', value: '10’2”' },
  { label: 'Approach touch', value: '10’5”' },
  { label: 'Serve velocity', value: '49 mph' },
  { label: 'Passing rating', value: '2.34' },
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>('athlete');

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_26%),linear-gradient(180deg,_rgba(15,23,42,0.88),_rgba(2,6,23,1))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
                PBTAPP
                <span className="text-[10px] tracking-[0.24em] text-emerald-300">Performance • Exposure • Decisions</span>
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Connected dashboards for athletes, coaches, recruiters, and live match decisions.
                </h1>
                <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                  A premium dark-mode product concept that flows from athlete performance to coach strategy to recruiter discovery,
                  then converts with a shareable athlete profile.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Athlete generates highlights', 'Coach wins with insight', 'Recruiter finds talent', 'Profile converts opportunity'].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[380px]">
              <StatCard label="Primary flows" value="4" detail="Athlete, coach, recruiter, profile" />
              <StatCard label="Live decisions" value="Now" detail="Voice + alerts + AI insights" />
              <StatCard label="Design language" value="Dark" detail="Neon green and electric blue accents" />
            </div>
          </div>
        </header>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-3 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="grid gap-3 lg:grid-cols-5">
            {screens.map((screen) => {
              const isActive = screen.id === activeScreen;
              return (
                <button
                  key={screen.id}
                  type="button"
                  onClick={() => setActiveScreen(screen.id)}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    isActive
                      ? 'border-cyan-400/50 bg-cyan-400/12 shadow-lg shadow-cyan-950/30'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]'
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300">{screen.eyebrow}</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">{screen.label}</h2>
                  <p className="mt-2 text-sm text-slate-400">{screen.summary}</p>
                </button>
              );
            })}
          </div>
        </section>

        {activeScreen === 'athlete' ? <AthleteDashboard onOpenProfile={() => setActiveScreen('profile')} /> : null}
        {activeScreen === 'coach' ? <CoachDashboard onEnterLiveMode={() => setActiveScreen('live')} /> : null}
        {activeScreen === 'live' ? <LiveGameMode /> : null}
        {activeScreen === 'recruiter' ? <RecruiterDashboard onOpenProfile={() => setActiveScreen('profile')} /> : null}
        {activeScreen === 'profile' ? <AthleteProfile /> : null}
      </div>
    </div>
  );
}

function AthleteDashboard({ onOpenProfile }: { onOpenProfile: () => void }) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Panel>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <ProfileOrb initials="MB" accent="from-cyan-400 to-emerald-400" />
              <div className="space-y-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Athlete Dashboard</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Maya Brooks</h2>
                  <p className="mt-1 text-sm text-slate-400">Outside Hitter · Class of 2027 · Wave VC</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Open to recruiting', 'Top 10 regional score', 'Last updated 2h ago'].map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
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
        </Panel>

        <Panel>
          <div className="flex h-full flex-col justify-between gap-5">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Performance Score</p>
              <div className="mt-5 flex items-center gap-5">
                <ScoreRing score={94} />
                <div>
                  <p className="text-5xl font-semibold text-white">94</p>
                  <p className="mt-2 max-w-[220px] text-sm text-slate-400">
                    Elite attack efficiency, strong platform consistency, and rising exposure momentum.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricPill label="Kills / set" value="4.8" />
              <MetricPill label="Pass rating" value="2.34" />
              <MetricPill label="Recruiter saves" value="17" />
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <PrimaryActionCard
          icon={<Video className="h-5 w-5" />}
          eyebrow="Primary CTA"
          title="Generate Highlight Reel"
          description="Create a shareable cut with best swings, key rotations, and recruiting-ready overlays."
          action="Build reel"
        />
        <InfoCard
          icon={<BarChart3 className="h-5 w-5" />}
          title="View Stats"
          items={[
            '18 kills · .412 efficiency',
            '21 perfect passes',
            '4 aces over last 3 matches',
          ]}
        />
        <InfoCard
          icon={<TrendingUp className="h-5 w-5" />}
          title="Progress Trend"
          items={['Performance score +6 in 30 days', 'Approach touch up 2 inches', 'Passing trending upward']}
          footer={<MiniTrendChart />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <FeedCard title="Recent highlights" accent="text-cyan-200" items={athleteFeed.highlights} />
        <FeedCard title="Recent games" accent="text-emerald-200" items={athleteFeed.games} />
        <FeedCard title="Coach feedback" accent="text-blue-200" items={athleteFeed.feedback} />
      </section>
    </div>
  );
}

function CoachDashboard({ onEnterLiveMode }: { onEnterLiveMode: () => void }) {
  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Coach / Team Dashboard</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Quantico Volleyball</h2>
            <p className="mt-2 text-sm text-slate-400">Next opponent: Coast United · Saturday 7:00 PM · Regional semifinal</p>
          </div>
          <button
            type="button"
            onClick={onEnterLiveMode}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            <Activity className="h-4 w-4" />
            Enter Live Mode
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
        <InsightCard
          icon={<Gauge className="h-5 w-5" />}
          title="Team Performance"
          detail="Efficiency rating 0.348"
          bullets={['Sideout rate 63%', 'Trend +8% over last 5 matches']}
        />
        <InsightCard
          icon={<Target className="h-5 w-5" />}
          title="Opponent Insights"
          detail="Coast United patterns"
          bullets={['Hits cross-court 68%', 'Weak serve receive zone 5']}
        />
        <InsightCard
          icon={<Shield className="h-5 w-5" />}
          title="Game Plan"
          detail="Auto-generated prep"
          bullets={['Block line on OH1', 'Serve zone 1 on rotation 4']}
        />
        <InsightCard
          icon={<Play className="h-5 w-5" />}
          title="Film + Highlights"
          detail="Quick access"
          bullets={['Last timeout clip stack', 'Scout reel with tagged tendencies']}
        />
      </section>

      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-emerald-300">Bottom section</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Sortable player stats table</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {['Sort: kills', 'Sort: errors', 'Sort: efficiency'].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/[0.03] text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">Kills</th>
                <th className="px-4 py-3 font-medium">Errors</th>
                <th className="px-4 py-3 font-medium">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 bg-slate-950/40">
              {coachPlayers.map((player) => (
                <tr key={player.name} className="text-slate-200">
                  <td className="px-4 py-3 font-medium text-white">{player.name}</td>
                  <td className="px-4 py-3">{player.kills}</td>
                  <td className="px-4 py-3">{player.errors}</td>
                  <td className="px-4 py-3 text-emerald-300">{player.efficiency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function LiveGameMode() {
  return (
    <section className="rounded-[36px] border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.5fr_0.82fr]">
        <Panel className="h-full">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
            <Bell className="h-4 w-4" />
            AI Insights
          </div>
          <div className="mt-5 space-y-3">
            {['Player 2 is cross-court heavy', 'Serve zone 5 now', 'Commit block if middle slides on 31'].map((item) => (
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
              LIVE · Set 4
            </span>
          </div>
          <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,_rgba(8,47,73,0.65),_rgba(15,23,42,0.92))] p-4">
            <div className="relative aspect-[16/10] rounded-[24px] border border-cyan-400/20 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.16),_rgba(2,6,23,0.95))]">
              <div className="absolute inset-x-6 top-6 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-300">
                <span>Court vision</span>
                <span>Latency 1.2s</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 p-5 text-cyan-100">
                  <Video className="h-10 w-10" />
                </div>
              </div>
              <div className="absolute left-[17%] top-[30%] rounded-full border border-emerald-400/50 bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                Zone 5 alert
              </div>
              <div className="absolute right-[18%] top-[42%] rounded-full border border-cyan-400/50 bg-cyan-400/20 px-3 py-1 text-xs font-semibold text-cyan-100">
                Player 2 tendency
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
            <LiveStat label="Touches" value="38" />
            <LiveStat label="Spikes" value="17" />
            <LiveStat label="Efficiency" value=".344" />
            <LiveStat label="Serve runs" value="3" />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          <Mic className="h-4 w-4" />
          Voice Assistant On
        </button>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-100">
          Priority alerts indicator: 2 active
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
          Minimal taps · Fast reading · Bench usable
        </div>
      </div>
    </section>
  );
}

function RecruiterDashboard({ onOpenProfile }: { onOpenProfile: () => void }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.55fr_0.75fr]">
      <div className="grid gap-6">
        <Panel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Recruiter Dashboard</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Discovery engine for top prospects</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
              <Search className="h-4 w-4 text-cyan-200" />
              Search by name, position, club, or grad year
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Height 5’10”+', 'Grad year 2026-2028', 'Ranking Top 25', 'Position: OH / MB / S'].map((filter) => (
              <span key={filter} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                {filter}
              </span>
            ))}
          </div>
        </Panel>

        <section className="grid gap-4 md:grid-cols-2">
          {athleteCards.map((athlete) => (
            <button
              key={athlete.name}
              type="button"
              onClick={onOpenProfile}
              className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 text-left shadow-2xl shadow-black/20 transition hover:border-cyan-400/35 hover:bg-slate-900/80"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ProfileOrb initials={athlete.name.split(' ').map((part) => part[0]).join('')} accent="from-emerald-400 to-cyan-400" small />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{athlete.name}</h3>
                    <p className="text-sm text-slate-400">{athlete.position} · {athlete.gradYear}</p>
                  </div>
                </div>
                <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                  Score {athlete.score}
                </span>
              </div>
              <div className="mt-4 rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,_rgba(8,47,73,0.7),_rgba(22,101,52,0.25))] p-4">
                <div className="flex aspect-[16/9] items-center justify-center rounded-[18px] border border-white/10 bg-slate-950/40 text-slate-300">
                  <Play className="mr-2 h-4 w-4 text-cyan-200" />
                  Thumbnail highlight
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{athlete.height}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{athlete.ranking}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">Verified metrics</span>
              </div>
            </button>
          ))}
        </section>
      </div>

      <Panel>
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
          <Users className="h-4 w-4" />
          Saved prospects
        </div>
        <div className="mt-5 space-y-3">
          {recruiterSaved.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
              {item}
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4">
          <p className="text-sm font-semibold text-cyan-100">Quick compare</p>
          <p className="mt-2 text-sm text-slate-300">Compare score, touch, efficiency, and recent film activity side-by-side.</p>
        </div>
      </Panel>
    </div>
  );
}

function AthleteProfile() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <ProfileOrb initials="MB" accent="from-cyan-400 via-blue-400 to-emerald-400" />
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Shareable Athlete Profile</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Maya Brooks</h2>
                <p className="mt-2 text-sm text-slate-400">OH · 2027 · 6’0” · Wave VC · GPA 3.9 · NCAA ready measurables</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Verified testing', 'Recruiting ID 38194', 'Open evaluation window'].map((item) => (
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
        </Panel>

        <Panel>
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,_rgba(8,47,73,0.65),_rgba(30,41,59,0.92))] p-4">
            <div className="flex aspect-[16/9] items-center justify-center rounded-[22px] border border-white/10 bg-slate-950/50 text-slate-200">
              <Play className="mr-2 h-5 w-5 text-cyan-200" />
              Highlight video hero
            </div>
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
            {profileBreakdown.map((item) => (
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
                <BarRow label="Attack efficiency" value={88} color="from-cyan-400 to-blue-500" />
                <BarRow label="Serve pressure" value={79} color="from-emerald-400 to-lime-400" />
                <BarRow label="Passing" value={83} color="from-violet-400 to-fuchsia-400" />
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
  return (
    <div
      className="flex h-32 w-32 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#22d3ee 0 ${score}%, #22c55e ${score}% ${Math.min(score + 4, 100)}%, rgba(255,255,255,0.08) ${Math.min(score + 4, 100)}% 100%)`,
      }}
    >
      <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full border border-white/8 bg-slate-950 text-3xl font-semibold text-white">
        {score}
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
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
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
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium text-white">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MiniTrendChart({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`rounded-[24px] border border-white/10 bg-white/[0.03] p-4 ${tall ? 'h-[220px]' : ''}`}>
      <div className="flex h-full items-end gap-3">
        {[38, 54, 48, 70, 64, 79, 94].map((value, index) => (
          <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-full bg-gradient-to-t from-cyan-400 via-blue-500 to-emerald-400"
              style={{ height: `${Math.max(value, 18)}%` }}
            />
            <span className="text-[11px] text-slate-500">W{index + 1}</span>
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
