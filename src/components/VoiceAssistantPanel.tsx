import { useEffect, useState } from 'react';
import { speak, speakPriority } from '../lib/voiceAssistant';
import type { PriorityAlert } from '../lib/aiEngineService';

export default function VoiceAssistantPanel({ alerts }: { alerts: PriorityAlert[] }) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!voiceEnabled || alerts.length === 0) {
      return;
    }

    speakPriority(alerts);
  }, [alerts, voiceEnabled]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-400">Voice assistant</p>
          <h4 className="text-lg font-semibold text-white">Bluetooth-ready coach voice</h4>
          <p className="mt-1 text-sm text-slate-300">
            Browser speech routes through the active audio output, including connected Bluetooth headsets.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVoiceEnabled((current) => !current)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            voiceEnabled ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
          }`}
        >
          {voiceEnabled ? 'Disable voice' : 'Enable voice'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            const spoken = speakPriority(alerts);
            setStatus(spoken ? 'Spoke the top-priority alert.' : 'Waiting for cooldown or a priority alert.');
          }}
          className="rounded-xl border border-sky-300/30 bg-sky-400/15 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/25"
        >
          Speak top alert
        </button>
        <button
          type="button"
          onClick={() => {
            const fallback = alerts[0]?.text ?? 'No coaching alerts available yet.';
            const spoken = speak(fallback);
            setStatus(spoken ? 'Spoke the selected alert.' : 'Speech synthesis is unavailable on this device.');
          }}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
        >
          Test audio route
        </button>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        {status || (voiceEnabled ? 'Auto-speaking high-priority alerts with cooldown protection.' : 'Voice assistant idle')}
      </p>
    </div>
  );
}
