import Heatmap from './Heatmap';
import VoiceAssistantPanel from './VoiceAssistantPanel';
import type { AiProcessingReport } from '../lib/aiEngineService';

export default function CoachDashboard({ report }: { report: AiProcessingReport }) {
  const profile = report.opponent_profile;

  if (!profile || !profile.team_name || !Array.isArray(profile.tendencies)) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">Coach dashboard</p>
            <h3 className="text-xl font-semibold text-white">{profile.team_name} scouting report</h3>
          </div>
          <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
            {report.play_events.length} tracked plays • {profile.players.length} player profiles
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <SummaryCard label="Top weakness" value={profile.weaknesses[0] ?? 'No major weakness yet'} />
          <SummaryCard label="Top strength" value={profile.strengths[0] ?? 'Still stabilizing'} />
          <SummaryCard label="Best live adjustment" value={report.live_adjustments[0] ?? 'Use the heatmap to deny the hot zone'} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {profile.tendencies.map((player) => (
            <article key={player.player_id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-white">{player.player_label}</h4>
                  <p className="text-sm text-slate-400">
                    Prefers {player.preferred_attack_zone} lane • kill rate {toPercent(player.kill_rate)} • error rate {toPercent(player.error_rate)}
                  </p>
                </div>
                <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium text-sky-100">
                  Pressure rate {toPercent(player.under_pressure_rate)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <RateCard label="Left" value={player.left_pct} />
                <RateCard label="Middle" value={player.middle_pct} />
                <RateCard label="Right" value={player.right_pct} />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
                <div className="space-y-3">
                  <PanelList title="Strengths" items={player.strengths.length > 0 ? player.strengths : ['No clear strength yet']} tone="emerald" />
                  <PanelList
                    title="Weakness"
                    items={[player.weakness ?? 'No repeated weakness signal yet']}
                    tone="rose"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-300">Shot heatmap</p>
                  <Heatmap cells={player.heatmap} />
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-4">
          <VoiceAssistantPanel alerts={report.priority_alerts} />
          <PanelList
            title="Priority alerts"
            items={report.priority_alerts.map((alert) => `${alert.level.toUpperCase()}: ${alert.text}`)}
            tone="rose"
          />
          <PanelList
            title="Matchup analysis"
            items={report.matchup_analysis.flatMap((matchup) => matchup.insights.map((insight) => `${matchup.matchup}: ${insight}`))}
            tone="sky"
          />
          <PanelList
            title="Top athletes"
            items={report.athlete_rankings.map((athlete) => `${athlete.name} — Score ${athlete.score}`)}
            tone="emerald"
          />
          <PanelList
            title="Auto playbook"
            items={report.playbook.map((play) => `${play.type}: ${play.instruction}`)}
            tone="amber"
          />
          <PanelList
            title="Defensive schemes"
            items={Object.entries(report.defensive_scheme).map(([player, scheme]) => `${player}: ${scheme}`)}
            tone="rose"
          />
          <PanelList title="Game plan" items={report.game_plan} tone="sky" />
          <PanelList title="Live coaching adjustments" items={report.live_adjustments} tone="amber" />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function RateCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{toPercent(value)}</p>
    </div>
  );
}

function PanelList({ title, items, tone }: { title: string; items: string[]; tone: 'emerald' | 'rose' | 'sky' | 'amber' }) {
  const toneStyles = {
    emerald: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
    rose: 'border-rose-400/20 bg-rose-500/10 text-rose-100',
    sky: 'border-sky-400/20 bg-sky-500/10 text-sky-100',
    amber: 'border-amber-400/20 bg-amber-500/10 text-amber-100',
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneStyles[tone]}`}>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
        {(items.length > 0 ? items : ['No items yet']).map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
