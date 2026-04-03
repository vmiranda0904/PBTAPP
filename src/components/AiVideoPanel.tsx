import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import CoachDashboard from './CoachDashboard';
import { createAiJob, fetchAiJob, isAiEngineConfigured } from '../lib/aiEngineService';
import type { AiJob } from '../lib/aiEngineService';

const sportOptions = ['volleyball', 'soccer', 'basketball', 'football', 'baseball'];

export default function AiVideoPanel() {
  const [selectedSport, setSelectedSport] = useState('volleyball');
  const [teamName, setTeamName] = useState('Riverview Opponents');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [job, setJob] = useState<AiJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!job || (job.status !== 'queued' && job.status !== 'processing')) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setJob(await fetchAiJob(job.id));
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : 'Unable to refresh AI engine status.');
      }
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [job]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Choose a video file before starting analysis.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const queuedJob = await createAiJob(selectedFile, selectedSport, teamName.trim() || 'Opponent team');
      setJob(queuedJob);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to start AI processing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-sky-400/20 bg-slate-950/80 p-5 shadow-2xl shadow-slate-950/30 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-200">AI coaching intelligence</p>
          <h2 className="text-2xl font-semibold text-white">Opponent scouting, game planning, and live adjustment preview</h2>
          <p className="max-w-3xl text-sm text-slate-300">
            Turn film into a scouting report with opponent tendencies, weakness detection, a coach-ready game plan,
            and live adjustment prompts that can later stream during tracking.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Goal: AI-assisted coaching intelligence on top of the fast video-analysis pipeline.
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm text-slate-300">
            Opponent team name
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Riverview Opponents"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            Sport
            <select
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
              value={selectedSport}
              onChange={(event) => setSelectedSport(event.target.value)}
            >
              {sportOptions.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            Game film upload
            <input
              type="file"
              accept="video/*"
              className="w-full rounded-xl border border-dashed border-white/20 bg-slate-950 px-3 py-3 text-slate-50 outline-none"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p className="font-medium">Coach scouting contract</p>
            <ul className="mt-2 space-y-1 text-amber-50/90">
              <li>POST /jobs → upload opponent film and queue scouting analysis</li>
              <li>GET /jobs/:id → poll tendency, weakness, and game-plan outputs</li>
              <li>GET /jobs/:id/report → download the generated scouting report JSON</li>
            </ul>
          </div>

          {!isAiEngineConfigured() ? (
            <p className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-sm text-rose-100">
              Configure VITE_AI_ENGINE_URL before using the scouting upload flow.
            </p>
          ) : null}

          {error ? <p className="text-sm text-rose-200">{error}</p> : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Tendency engine" value="Per player" detail="Left / middle / right attack split" />
            <MetricCard label="Weakness scan" value="Error-based" detail="Pressure and zone flags" />
            <MetricCard label="Coach mode" value="Live-ready" detail="Prepared for future WebSocket updates" />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !isAiEngineConfigured()}
              className="rounded-xl bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              {isSubmitting ? 'Queueing…' : 'Generate scouting report'}
            </button>
          </div>
        </form>

        <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Frame skip" value="3x" detail="Preserve fast processing budget" />
            <MetricCard label="YOLO input" value="640×360" detail="Resize before inference" />
            <MetricCard label="Detection cadence" value="Every 5th" detail="Keep scouting pipeline selective" />
          </div>

          {job ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">Latest scouting job</p>
                  <h3 className="text-lg font-semibold text-white">{job.team_name}</h3>
                  <p className="text-sm text-slate-400">{job.file_name}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[job.status]}`}>
                  {statusLabels[job.status]}
                </span>
              </div>

              <dl className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                <InfoRow label="Sport" value={job.sport} />
                <InfoRow label="Team" value={job.team_name} />
                <InfoRow label="Video hash" value={job.video_hash ?? 'Pending'} />
                <InfoRow label="Total time" value={formatTiming(job.timings_ms.total_ms)} />
              </dl>

              {job.report ? (
                <>
                  <p className="mt-4 text-sm text-slate-200">{job.report.summary}</p>
                  <dl className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    <InfoRow label="Device" value={job.report.device} />
                    <InfoRow label="Model" value={job.report.model} />
                    <InfoRow label="Tracked plays" value={String(job.report.play_events.length)} />
                    <InfoRow label="GPU target" value={job.report.recommended_gpu_provider} />
                  </dl>
                  <div className="mt-4 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4 text-sm text-indigo-100">
                    <p className="font-medium">Immediate next steps</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {job.report.immediate_next_steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {job.download_url ? (
                      <a
                        className="rounded-xl border border-sky-300/30 bg-sky-400/15 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/25"
                        href={job.download_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download scouting report
                      </a>
                    ) : null}
                    {job.result_url ? (
                      <a
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                        href={job.result_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open status payload
                      </a>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-400">
                  Polling the AI engine until the scouting job becomes a completed coach dashboard.
                </p>
              )}

              {job.error ? <p className="mt-3 text-sm text-rose-200">{job.error}</p> : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-6 text-sm text-slate-400">
              No scouting job yet. Upload opponent film to generate a coaching report with tendencies, weaknesses,
              heatmaps, and game-plan guidance.
            </div>
          )}
        </div>
      </div>

      {job?.report ? (
        <div className="mt-5">
          <CoachDashboard report={job.report} />
        </div>
      ) : null}
    </section>
  );
}

const statusLabels: Record<AiJob['status'], string> = {
  queued: 'Queued',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

const statusStyles: Record<AiJob['status'], string> = {
  queued: 'bg-amber-500/15 text-amber-100',
  processing: 'bg-sky-500/15 text-sky-100',
  completed: 'bg-emerald-500/15 text-emerald-100',
  failed: 'bg-rose-500/15 text-rose-100',
};

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-white/5 px-3 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[18rem] text-right text-slate-200">{value}</dd>
    </div>
  );
}

function formatTiming(value?: number) {
  if (!value || Number.isNaN(value)) return 'Pending';
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}
