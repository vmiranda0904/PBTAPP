export type AiJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type AiProcessingReport = {
  pipeline_mode: 'skeleton';
  summary: string;
  sport: string;
  file_name: string;
  video_hash: string;
  file_size_bytes: number;
  device: string;
  model: string;
  optimization_profile: Record<string, string | number>;
  observability: Record<string, string | number | boolean>;
  immediate_next_steps: string[];
  recommended_gpu_provider: string;
  created_at: string;
};

export type AiJob = {
  id: string;
  status: AiJobStatus;
  sport: string;
  file_name: string;
  created_at: string;
  updated_at: string;
  video_hash?: string | null;
  error?: string | null;
  report?: AiProcessingReport | null;
  timings_ms: Record<string, number>;
  result_url?: string | null;
  download_url?: string | null;
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

export async function createAiJob(file: File, sport: string) {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('sport', sport);

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
    result_url: toAbsoluteUrl(job.result_url),
    download_url: toAbsoluteUrl(job.download_url),
  };
}
