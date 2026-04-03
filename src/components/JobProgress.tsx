import type { AiJob } from '../lib/aiEngineService';

type JobProgressProps = {
  job: AiJob;
};

export default function JobProgress({ job }: JobProgressProps) {
  const progress = Math.max(0, Math.min(100, job.progress));
  const message = getProgressMessage(job);

  return (
    <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-sky-100">Processing progress</p>
          <p className="text-xs text-sky-100/80">{message}</p>
        </div>
        <p className="text-sm font-semibold text-sky-100">{progress}%</p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900/70"
        aria-label={`Job progress ${progress}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={progress}
        role="progressbar"
      >
        <div className="h-full rounded-full bg-sky-400 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function getProgressMessage(job: AiJob) {
  if (job.status === 'completed') {
    return 'Scouting report is ready to review and download.';
  }

  if (job.status === 'failed') {
    return job.error ?? 'Processing stopped before the report was generated.';
  }

  const stageMessages: Record<string, string> = {
    accepted: 'Upload accepted and preparing the job.',
    uploaded: 'Video uploaded successfully.',
    upload_failed: 'Upload failed before processing could begin.',
    queued: 'Waiting for an available worker.',
    retry_scheduled: 'Retrying after a temporary processing issue.',
    processing_started: 'Processing started.',
    reading_storage: 'Reading the uploaded game film.',
    cache_lookup: 'Checking for a reusable analysis result.',
    completed_from_cache: 'Loaded a completed report from cache.',
    completed: 'Wrapping up the final report.',
  };

  return stageMessages[job.processing_stage ?? ''] ?? 'Analyzing the uploaded film.';
}
