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
  user_id?: string;
  team_id?: string;
  status: AiJobStatus;
  progress: number;
  processing_stage?: string;
  sport: string;
  team_name: string;
  file_name: string;
  content_type?: string;
  file_size_bytes?: number;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  last_error_at?: string | null;
  storage_path?: string | null;
  video_hash?: string | null;
  error?: string | null;
  retry_count?: number;
  max_retries?: number;
  report?: AiProcessingReport | null;
  timings_ms: Record<string, number>;
  result_url?: string | null;
  download_url?: string | null;
  pdf_report_url?: string | null;
};

type AiRequestOwner = {
  userId: string;
  teamId: string;
};

const aiEngineUrl = import.meta.env.VITE_AI_ENGINE_URL?.trim() ?? '';

export function clampJobProgress(value: number | null | undefined) {
  if (!isNumber(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function requireAiEngineUrl() {
  if (!aiEngineUrl) {
    throw new Error('Set VITE_AI_ENGINE_URL to enable AI video job uploads.');
  }

  return aiEngineUrl.replace(/\/$/, '');
}

function toAbsoluteUrl(pathOrUrl: string | null | undefined, owner?: AiRequestOwner) {
  if (!pathOrUrl) return null;
  const url = /^https?:\/\//.test(pathOrUrl)
    ? new URL(pathOrUrl)
    : new URL(`${requireAiEngineUrl()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`);

  if (owner) {
    url.searchParams.set('userId', owner.userId);
    url.searchParams.set('teamId', owner.teamId);
  }

  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isString) : [];
}

function toNumberRecord(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => isNumber(entry))) as Record<string, number>;
}

function normalizeHeatmap(value: unknown): HeatmapCell[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((entry) => ({
      x_bin: isNumber(entry.x_bin) ? entry.x_bin : 0,
      y_bin: isNumber(entry.y_bin) ? entry.y_bin : 0,
      count: isNumber(entry.count) ? entry.count : 0,
    }));
}

function normalizePlayer(value: unknown): PlayerScoutingSummary | null {
  if (!isRecord(value) || !isNumber(value.player_id) || !isString(value.player_label)) return null;
  const zone = value.preferred_attack_zone;
  if (zone !== 'left' && zone !== 'middle' && zone !== 'right') return null;
  return {
    player_id: value.player_id,
    player_label: value.player_label,
    total_events: isNumber(value.total_events) ? value.total_events : 0,
    spike_count: isNumber(value.spike_count) ? value.spike_count : 0,
    preferred_attack_zone: zone,
    left_pct: isNumber(value.left_pct) ? value.left_pct : 0,
    middle_pct: isNumber(value.middle_pct) ? value.middle_pct : 0,
    right_pct: isNumber(value.right_pct) ? value.right_pct : 0,
    kill_rate: isNumber(value.kill_rate) ? value.kill_rate : 0,
    error_rate: isNumber(value.error_rate) ? value.error_rate : 0,
    under_pressure_rate: isNumber(value.under_pressure_rate) ? value.under_pressure_rate : 0,
    strengths: toStringArray(value.strengths),
    weakness: isString(value.weakness) ? value.weakness : null,
    heatmap: normalizeHeatmap(value.heatmap),
  };
}

function normalizeReport(value: unknown, owner?: AiRequestOwner): AiProcessingReport | null {
  if (!isRecord(value)) return null;
  if (!isString(value.summary) || !isString(value.sport) || !isString(value.team_name) || !isString(value.file_name)) {
    return null;
  }

  const profile = isRecord(value.opponent_profile)
    ? {
        id: isString(value.opponent_profile.id) ? value.opponent_profile.id : 'unknown',
        team_name: isString(value.opponent_profile.team_name) ? value.opponent_profile.team_name : value.team_name,
        players: toStringArray(value.opponent_profile.players),
        tendencies: Array.isArray(value.opponent_profile.tendencies)
          ? value.opponent_profile.tendencies.map(normalizePlayer).filter((entry): entry is PlayerScoutingSummary => Boolean(entry))
          : [],
        weaknesses: toStringArray(value.opponent_profile.weaknesses),
        strengths: toStringArray(value.opponent_profile.strengths),
      }
    : null;

  return {
    pipeline_mode: 'coach_scouting_preview',
    summary: value.summary,
    sport: value.sport,
    team_name: value.team_name,
    file_name: value.file_name,
    video_hash: isString(value.video_hash) ? value.video_hash : '',
    file_size_bytes: isNumber(value.file_size_bytes) ? value.file_size_bytes : 0,
    device: isString(value.device) ? value.device : 'unknown',
    model: isString(value.model) ? value.model : 'unknown',
    optimization_profile: isRecord(value.optimization_profile) ? value.optimization_profile as Record<string, string | number> : {},
    observability: isRecord(value.observability) ? value.observability as Record<string, string | number | boolean> : {},
    immediate_next_steps: toStringArray(value.immediate_next_steps),
    recommended_gpu_provider: isString(value.recommended_gpu_provider) ? value.recommended_gpu_provider : 'Unknown',
    play_events: Array.isArray(value.play_events) ? value.play_events as PlayEvent[] : [],
    opponent_profile: profile,
    game_plan: toStringArray(value.game_plan),
    live_adjustments: toStringArray(value.live_adjustments),
    matchup_analysis: Array.isArray(value.matchup_analysis) ? value.matchup_analysis as MatchupInsight[] : [],
    live_insights: toStringArray(value.live_insights),
    priority_alerts: Array.isArray(value.priority_alerts) ? value.priority_alerts as PriorityAlert[] : [],
    athlete_rankings: Array.isArray(value.athlete_rankings) ? value.athlete_rankings as AthleteRanking[] : [],
    playbook: Array.isArray(value.playbook) ? value.playbook as PlaybookItem[] : [],
    defensive_scheme: isRecord(value.defensive_scheme) ? Object.fromEntries(Object.entries(value.defensive_scheme).filter(([, entry]) => isString(entry))) as Record<string, string> : {},
    pdf_report_url: toAbsoluteUrl(isString(value.pdf_report_url) ? value.pdf_report_url : null, owner),
    created_at: isString(value.created_at) ? value.created_at : new Date().toISOString(),
  };
}

function normalizeJob(job: unknown, owner?: AiRequestOwner): AiJob {
  if (!isRecord(job) || !isString(job.id) || !isString(job.status) || !isString(job.sport) || !isString(job.team_name) || !isString(job.file_name)) {
    throw new Error('AI engine returned an invalid job payload.');
  }

  return {
    id: job.id,
    user_id: isString(job.user_id) ? job.user_id : undefined,
    team_id: isString(job.team_id) ? job.team_id : undefined,
    status: ['queued', 'processing', 'completed', 'failed'].includes(job.status) ? (job.status as AiJobStatus) : 'failed',
    progress: clampJobProgress(isNumber(job.progress) ? job.progress : null),
    processing_stage: isString(job.processing_stage) ? job.processing_stage : undefined,
    sport: job.sport,
    team_name: job.team_name,
    file_name: job.file_name,
    content_type: isString(job.content_type) ? job.content_type : undefined,
    file_size_bytes: isNumber(job.file_size_bytes) ? job.file_size_bytes : undefined,
    created_at: isString(job.created_at) ? job.created_at : new Date().toISOString(),
    updated_at: isString(job.updated_at) ? job.updated_at : new Date().toISOString(),
    started_at: isString(job.started_at) ? job.started_at : null,
    completed_at: isString(job.completed_at) ? job.completed_at : null,
    last_error_at: isString(job.last_error_at) ? job.last_error_at : null,
    storage_path: isString(job.storage_path) ? job.storage_path : null,
    video_hash: isString(job.video_hash) ? job.video_hash : null,
    error: isString(job.error) ? job.error : null,
    retry_count: isNumber(job.retry_count) ? job.retry_count : 0,
    max_retries: isNumber(job.max_retries) ? job.max_retries : 0,
    report: normalizeReport(job.report, owner),
    timings_ms: toNumberRecord(job.timings_ms),
    result_url: toAbsoluteUrl(isString(job.result_url) ? job.result_url : null, owner),
    download_url: toAbsoluteUrl(isString(job.download_url) ? job.download_url : null, owner),
    pdf_report_url: toAbsoluteUrl(isString(job.pdf_report_url) ? job.pdf_report_url : null, owner),
  };
}

async function readError(response: Response) {
  try {
    const payload = (await response.json()) as unknown;
    if (isRecord(payload) && isString(payload.detail)) {
      return payload.detail;
    }
    if (isRecord(payload) && isString(payload.message)) {
      return payload.message;
    }
  } catch {
    // ignore invalid json
  }
  return `AI engine request failed with status ${response.status}.`;
}

async function aiRequest(path: string, init: RequestInit, owner: AiRequestOwner) {
  const response = await fetch(`${requireAiEngineUrl()}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      'X-User-Id': owner.userId,
      'X-Team-Id': owner.teamId,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response;
}

export function isAiEngineConfigured() {
  return Boolean(aiEngineUrl);
}

export function isRenderableAiReport(report: AiProcessingReport | null | undefined): report is AiProcessingReport {
  return Boolean(report?.summary && report?.team_name && report?.opponent_profile?.team_name);
}

export async function createAiJob(file: File, sport: string, teamName: string, owner: AiRequestOwner) {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('sport', sport);
  formData.append('team_name', teamName);

  const response = await aiRequest('/jobs', {
    method: 'POST',
    body: formData,
  }, owner);

  const payload = (await response.json()) as { job?: unknown };
  return normalizeJob(payload.job, owner);
}

export async function fetchAiJob(jobId: string, owner: AiRequestOwner) {
  const response = await aiRequest(`/jobs/${jobId}`, { method: 'GET' }, owner);
  const job = (await response.json()) as unknown;
  return normalizeJob(job, owner);
}
