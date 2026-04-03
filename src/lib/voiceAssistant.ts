import type { PriorityAlert } from './aiEngineService';

let lastSpokenAt = 0;
const SPEECH_RATE = 1.05;
const SPEECH_PITCH = 0.9;

export function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = SPEECH_RATE;
  utterance.pitch = SPEECH_PITCH;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function speakPriority(alerts: PriorityAlert[], cooldownMs = 4000) {
  const now = Date.now();
  const highPriority = alerts.find((alert) => alert.level === 'high') ?? alerts[0];

  if (!highPriority || now - lastSpokenAt <= cooldownMs) {
    return false;
  }

  const spoken = speak(highPriority.text);
  if (spoken) {
    lastSpokenAt = now;
  }
  return spoken;
}
