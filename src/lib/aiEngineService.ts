export type AiJobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type AiPlayType = 'serve' | 'spike' | 'set' | 'dig' | 'block';
export type AiPlayResult = 'kill' | 'error' | 'continuation' | 'ace' | 'blocked';
export type PressureLevel = 'low' | 'medium' | 'high';

export type HeatmapCell = {
  x_bin: number;
  y_bin: number;
  count: number;
};

export type PlayEvent = {
  timestamp: number;
  player_id: number;
  play_type: AiPlayType;
  start_position: [number, number];
  end_position: [number, number];
  result: AiPlayResult;
  pressure_level: PressureLevel;
  sequence_id: number;
};

export type PlayerScoutingSummary = {
  player_id: number;
  player_label: string;
  total_events: number;
  spike_count: number;
  preferred_attack_zone: 'left' | 'middle' | 'right';
  left_pct: number;
  middle_pct: number;
  right_pct: number;
  kill_rate: number;
  error_rate: number;
  under_pressure_rate: number;
  strengths: string[];
  weakness?: string | null;
  heatmap: HeatmapCell[];
};

export type OpponentProfile = {
  id: string;
  team_name: string;
  players: string[];
  tendencies: PlayerScoutingSummary[];
  weaknesses: string[];
  strengths: string[];
};

export type MatchupInsight = {
  matchup: string;
  insights: string[];
};

export type PriorityAlert = {
  text: string;
  level: 'high' | 'medium' | 'low';
};

export type AthleteRanking = {
  id: string;
  name: string;
  score: number;
  stats: Record<string, number>;
};

export type PlaybookItem = {
  type: 'defense' | 'offense';
  instruction: string;
};

export type AiProcessingReport = {
  pipeline_mode: 'coach_scouting_preview';
  summary: string;
  sport: string;
  team_name: string;
  file_name: string;
  video_hash: string;
  file_size_bytes: number;
  device: string;
  model: string;
  optimization_profile: Record<string, string | number>;
  observability: Record<string, string | number | boolean>;
  immediate_next_steps: string[];
  recommended_gpu_provider: string;
  play_events: PlayEvent[];
  opponent_profile?: OpponentProfile | null;
  game_plan: string[];
  live_adjustments: string[];
  matchup_analysis: MatchupInsight[];
  live_insights: string[];
  priority_alerts: PriorityAlert[];
  athlete_rankings: AthleteRanking[];
  playbook: PlaybookItem[];
  defensive_scheme: Record<string, string>;
  pdf_report_url?: string | null;
  created_at: string;
};

export type AiJob = {
  id: string;
  status: AiJobStatus;
  sport: string;
  team_name: string;
  file_name: string;
  created_at: string;
  updated_at: string;
  video_hash?: string | null;
  error?: string | null;
  report?: AiProcessingReport | null;
  timings_ms: Record<string, number>;
  result_url?: string | null;
  download_url?: string | null;
  pdf_report_url?: string | null;
};

const aiEngineUrl = import.meta.env.VITE_AI_ENGINE_URL?.trim() ?? '';

function requireAiEngineUrl() {
  if (!aiEngineUrl) {
    throw new Error('Set VITE_AI_ENGINE_URL to enable AI video job uploads.');
  }

  return aiEngineUrl.replace(/\/$/, '');
}

function toAbsoluteUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${requireAiEngineUrl()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export function isAiEngineConfigured() {
  return Boolean(aiEngineUrl);
}

export async function createAiJob(file: File, sport: string, teamName: string) {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('sport', sport);
  formData.append('team_name', teamName);

  const response = await fetch(`${requireAiEngineUrl()}/jobs`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Unable to queue the video job.');
  }

  const payload = (await response.json()) as { job: AiJob };
  return normalizeJob(payload.job);
}

export async function fetchAiJob(jobId: string) {
  const response = await fetch(`${requireAiEngineUrl()}/jobs/${jobId}`);
  if (!response.ok) {
    throw new Error('Unable to load the video job status.');
  }

  const job = (await response.json()) as AiJob;
  return normalizeJob(job);
}

function normalizeJob(job: AiJob): AiJob {
  return {
    ...job,
    report: job.report
      ? {
          ...job.report,
          pdf_report_url: toAbsoluteUrl(job.report.pdf_report_url),
        }
      : job.report,
    result_url: toAbsoluteUrl(job.result_url),
    download_url: toAbsoluteUrl(job.download_url),
    pdf_report_url: toAbsoluteUrl(job.pdf_report_url),
  };
}
